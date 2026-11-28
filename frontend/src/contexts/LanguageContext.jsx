import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import en from '../translations/en.json';
import te from '../translations/te.json';
import hi from '../translations/hi.json';
import api from '../services/api';

const translations = { en, te, hi };

const LanguageContext = createContext();

// Track original English text/attributes on DOM nodes so switching back to EN is lossless and React-safe
const originalTextMap = new WeakMap();
const originalPlaceholderMap = new WeakMap();
const memoryCache = {
  te: {},
  hi: {},
};

const loadCache = (lang) => {
  if (lang === 'en') return {};
  try {
    const raw = localStorage.getItem(`kd_auto_i18n_${lang}`);
    if (raw) {
      memoryCache[lang] = { ...JSON.parse(raw), ...memoryCache[lang] };
    }
  } catch {}
  return memoryCache[lang] || {};
};

const saveCache = (lang) => {
  try {
    const entries = Object.entries(memoryCache[lang] || {}).slice(-1500);
    localStorage.setItem(`kd_auto_i18n_${lang}`, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
};

const shouldSkipText = (trimmed) => {
  if (!trimmed || trimmed.length < 2) return true;
  if (!/[A-Za-z]/.test(trimmed)) return true; // pure numbers, ₹, punctuation
  if (/^(EN|TE|HI)$/i.test(trimmed)) return true;
  if (/^KD-[A-Z0-9-]+$/i.test(trimmed)) return true;
  if (/^\d+h\s*:\s*\d+m\s*:\s*\d+s$/i.test(trimmed)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
};

const translateBatchOnline = async (texts, targetLang) => {
  const cache = loadCache(targetLang);
  const missing = texts.filter((t) => !cache[t]);
  if (missing.length === 0) return;

  // Batch in chunks of 20 separated by a rare delimiter
  const SEP = '\n|||KD_SEP|||\n';
  for (let i = 0; i < missing.length; i += 20) {
    const chunk = missing.slice(i, i + 20);
    try {
      const joined = chunk.join(SEP);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(joined)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const translatedFull = (json?.[0] || []).map((seg) => seg?.[0] || '').join('');
      const parts = translatedFull.split(/\s*\|\|\|\s*KD_SEP\s*\|\|\|\s*/);
      if (parts.length === chunk.length) {
        chunk.forEach((src, idx) => {
          if (parts[idx]) cache[src] = parts[idx].trim();
        });
      } else {
        // Fallback per-string for mismatched delimiter splits
        await Promise.all(
          chunk.map(async (src) => {
            try {
              const r = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(src)}`
              );
              if (r.ok) {
                const j = await r.json();
                const out = (j?.[0] || []).map((s) => s?.[0] || '').join('').trim();
                if (out) cache[src] = out;
              }
            } catch {}
          })
        );
      }
      memoryCache[targetLang] = cache;
      saveCache(targetLang);
    } catch {
      // Offline / network fallback silently ignored
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('kd_language') || 'en';
  });
  const applyingRef = useRef(false);

  const setLanguage = async (newLang) => {
    if (translations[newLang]) {
      setLanguageState(newLang);
      localStorage.setItem('kd_language', newLang);

      const token = localStorage.getItem('kd_token');
      if (token) {
        try {
          await api.put('/api/auth/language', { language: newLang });
        } catch {
          // non-blocking
        }
      }
    }
  };

  useEffect(() => {
    let active = true;
    let debounceTimer = null;

    const collectAndApply = async () => {
      if (!active || applyingRef.current || typeof document === 'undefined' || !document.body) return;
      applyingRef.current = true;
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
          const parentTag = node.parentElement?.tagName;
          if (!parentTag || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA'].includes(parentTag)) continue;
          if (node.parentElement?.closest('.notranslate, .leaflet-container')) continue;
          textNodes.push(node);
        }

        const placeholders = Array.from(document.querySelectorAll('input[placeholder], textarea[placeholder]'));

        if (language === 'en') {
          textNodes.forEach((n) => {
            if (originalTextMap.has(n)) {
              const orig = originalTextMap.get(n);
              if (n.nodeValue !== orig) n.nodeValue = orig;
            }
          });
          placeholders.forEach((el) => {
            if (originalPlaceholderMap.has(el)) {
              el.setAttribute('placeholder', originalPlaceholderMap.get(el));
            }
          });
          return;
        }

        const cache = loadCache(language);
        const toTranslate = new Set();

        textNodes.forEach((n) => {
          if (!originalTextMap.has(n)) {
            originalTextMap.set(n, n.nodeValue);
          }
          const orig = originalTextMap.get(n);
          const trimmed = (orig || '').trim();
          if (shouldSkipText(trimmed)) return;
          if (cache[trimmed]) {
            const lead = orig.match(/^\s*/)?.[0] || '';
            const trail = orig.match(/\s*$/)?.[0] || '';
            const nextVal = `${lead}${cache[trimmed]}${trail}`;
            if (n.nodeValue !== nextVal) n.nodeValue = nextVal;
          } else {
            toTranslate.add(trimmed);
          }
        });

        placeholders.forEach((el) => {
          if (!originalPlaceholderMap.has(el)) {
            originalPlaceholderMap.set(el, el.getAttribute('placeholder') || '');
          }
          const origPh = (originalPlaceholderMap.get(el) || '').trim();
          if (shouldSkipText(origPh)) return;
          if (cache[origPh]) {
            el.setAttribute('placeholder', cache[origPh]);
          } else {
            toTranslate.add(origPh);
          }
        });

        if (toTranslate.size > 0) {
          await translateBatchOnline(Array.from(toTranslate), language);
          if (!active) return;
          const updatedCache = loadCache(language);
          textNodes.forEach((n) => {
            const orig = originalTextMap.get(n);
            const trimmed = (orig || '').trim();
            if (updatedCache[trimmed]) {
              const lead = orig.match(/^\s*/)?.[0] || '';
              const trail = orig.match(/\s*$/)?.[0] || '';
              const nextVal = `${lead}${updatedCache[trimmed]}${trail}`;
              if (n.nodeValue !== nextVal) n.nodeValue = nextVal;
            }
          });
          placeholders.forEach((el) => {
            const origPh = (originalPlaceholderMap.get(el) || '').trim();
            if (updatedCache[origPh]) {
              el.setAttribute('placeholder', updatedCache[origPh]);
            }
          });
        }
      } finally {
        applyingRef.current = false;
      }
    };

    const scheduleApply = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(collectAndApply, 120);
    };

    collectAndApply();

    const observer = new MutationObserver(() => {
      if (!applyingRef.current && language !== 'en') {
        scheduleApply();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      active = false;
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [language]);

  const t = (key, fallback = '') => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
