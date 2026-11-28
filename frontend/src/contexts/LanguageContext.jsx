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
const memoryCache = { te: {}, hi: {} };
const nounCache = { te: {}, hi: {} };

// Common English UI words / produce terms that SHOULD be translated by meaning (not treated as proper-noun names)
const COMMON_UI_WORDS = new Set([
  'all', 'home', 'back', 'save', 'edit', 'delete', 'cancel', 'submit', 'search', 'filter',
  'reset', 'close', 'open', 'add', 'remove', 'clear', 'checkout', 'cart', 'orders',
  'order', 'products', 'product', 'produce', 'dashboard', 'marketplace', 'categories',
  'category', 'community', 'communities', 'apartments', 'apartment', 'profile', 'reviews',
  'earnings', 'payments', 'notifications', 'users', 'overview', 'login', 'logout',
  'register', 'verify', 'continue', 'loading', 'pending', 'confirmed', 'packed',
  'delivered', 'completed', 'cancelled', 'accepted', 'preparing', 'vegetables', 'fruits',
  'grains', 'pulses', 'spices', 'organic', 'fresh', 'bulk', 'solo', 'price', 'total',
  'subtotal', 'delivery', 'quantity', 'available', 'unit', 'stock', 'status', 'farmer',
  'farmers', 'buyer', 'buyers', 'consumer', 'consumers', 'admin', 'neighbor', 'neighbors',
  'members', 'member', 'invite', 'switch', 'camera', 'gallery', 'upload', 'location',
  'address', 'landmark', 'pincode', 'language', 'welcome', 'hello', 'today', 'yesterday',
  'free', 'paid', 'online', 'cash', 'help', 'support', 'details', 'active', 'expired',
  'ended', 'kg', 'bunch', 'dozen', 'litre', 'piece', 'gram', 'tomatoes', 'onions',
  'potatoes', 'spinach', 'okra', 'carrots', 'capsicum', 'cauliflower', 'mangoes',
  'pomegranate', 'bananas', 'watermelon', 'guava', 'rice', 'millet', 'turmeric', 'chillies',
  'honey', 'jaggery', 'green', 'red', 'sweet', 'wild', 'freshly', 'harvested',
]);

const loadCache = (store, storagePrefix, lang) => {
  if (lang === 'en') return {};
  try {
    const raw = localStorage.getItem(`${storagePrefix}_${lang}`);
    if (raw) {
      store[lang] = { ...JSON.parse(raw), ...store[lang] };
    }
  } catch {}
  return store[lang] || {};
};

const saveCache = (store, storagePrefix, lang) => {
  try {
    const entries = Object.entries(store[lang] || {}).slice(-1500);
    localStorage.setItem(`${storagePrefix}_${lang}`, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
};

const shouldSkipText = (trimmed) => {
  if (!trimmed || trimmed.length < 2) return true;
  if (!/[A-Za-z]/.test(trimmed)) return true;
  if (/^(EN|TE|HI|OTP|COD|UPI|ID|KM)$/i.test(trimmed)) return true;
  if (/^KD-[A-Z0-9-]+$/i.test(trimmed)) return true;
  if (/^\d+h\s*:\s*\d+m\s*:\s*\d+s$/i.test(trimmed)) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return false;
};

const looksLikeProperNoun = (trimmed) => {
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  // Every word must start with uppercase letter and contain only letters/dots/hyphens
  const allCapitalizedWords = words.every((w) => /^[A-Z][a-zA-Z.-]*$/.test(w));
  if (!allCapitalizedWords) return false;
  // If any word is a known common UI/produce word, let standard translation handle phrases unless single unknown name
  if (words.length === 1) {
    return !COMMON_UI_WORDS.has(words[0].toLowerCase());
  }
  const hasCommonUiWord = words.some((w) => COMMON_UI_WORDS.has(w.toLowerCase()));
  return !hasCommonUiWord;
};

const transliterateTokenOnline = async (phrase, targetLang) => {
  const itc = targetLang === 'te' ? 'te-t-i0-und' : targetLang === 'hi' ? 'hi-t-i0-und' : null;
  if (!itc) return phrase;

  // Transliterate word-by-word to avoid meaning translation and keep every proper noun exact
  const tokens = phrase.split(/(\s+|[,.\-\/()]+)/);
  const out = await Promise.all(
    tokens.map(async (tok) => {
      if (!tok || !/[A-Za-z]/.test(tok)) return tok;
      if (/^(KD|PIN|NO|H\.No)$/i.test(tok)) return tok;
      try {
        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(tok)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const candidate = data?.[1]?.[0]?.[1]?.[0];
          if (candidate) return candidate;
        }
      } catch {}
      return tok;
    })
  );
  return out.join('');
};

const transliterateBatchOnline = async (nouns, targetLang) => {
  const cache = loadCache(nounCache, 'kd_noun_i18n_v1', targetLang);
  const missing = nouns.filter((n) => !cache[n]);
  if (missing.length === 0) return;

  for (let i = 0; i < missing.length; i += 10) {
    const chunk = missing.slice(i, i + 10);
    await Promise.all(
      chunk.map(async (noun) => {
        const result = await transliterateTokenOnline(noun, targetLang);
        if (result) cache[noun] = result;
      })
    );
    nounCache[targetLang] = cache;
    saveCache(nounCache, 'kd_noun_i18n_v1', targetLang);
  }
};

const translateBatchOnline = async (texts, targetLang) => {
  const cache = loadCache(memoryCache, 'kd_auto_i18n_v2', targetLang);
  const missing = texts.filter((t) => !cache[t]);
  if (missing.length === 0) return;

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
      saveCache(memoryCache, 'kd_auto_i18n_v2', targetLang);
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

        const uiCache = loadCache(memoryCache, 'kd_auto_i18n_v2', language);
        const pNounCache = loadCache(nounCache, 'kd_noun_i18n_v1', language);
        const missingUi = new Set();
        const missingNouns = new Set();

        const isNodeNoun = (n, trimmed) =>
          Boolean(n.parentElement?.closest('.kd-noun, [data-noun="true"]')) || looksLikeProperNoun(trimmed);

        textNodes.forEach((n) => {
          if (!originalTextMap.has(n)) {
            originalTextMap.set(n, n.nodeValue);
          }
          const orig = originalTextMap.get(n);
          const trimmed = (orig || '').trim();
          if (shouldSkipText(trimmed)) return;

          const noun = isNodeNoun(n, trimmed);
          const cachedVal = noun ? pNounCache[trimmed] : uiCache[trimmed];
          if (cachedVal) {
            const lead = orig.match(/^\s*/)?.[0] || '';
            const trail = orig.match(/\s*$/)?.[0] || '';
            const nextVal = `${lead}${cachedVal}${trail}`;
            if (n.nodeValue !== nextVal) n.nodeValue = nextVal;
          } else if (noun) {
            missingNouns.add(trimmed);
          } else {
            missingUi.add(trimmed);
          }
        });

        placeholders.forEach((el) => {
          if (el.closest('.notranslate')) return;
          if (!originalPlaceholderMap.has(el)) {
            originalPlaceholderMap.set(el, el.getAttribute('placeholder') || '');
          }
          const origPh = (originalPlaceholderMap.get(el) || '').trim();
          if (shouldSkipText(origPh)) return;
          if (uiCache[origPh]) {
            el.setAttribute('placeholder', uiCache[origPh]);
          } else {
            missingUi.add(origPh);
          }
        });

        await Promise.all([
          missingNouns.size > 0 ? transliterateBatchOnline(Array.from(missingNouns), language) : Promise.resolve(),
          missingUi.size > 0 ? translateBatchOnline(Array.from(missingUi), language) : Promise.resolve(),
        ]);

        if (!active) return;
        const updatedUi = loadCache(memoryCache, 'kd_auto_i18n_v2', language);
        const updatedNouns = loadCache(nounCache, 'kd_noun_i18n_v1', language);

        textNodes.forEach((n) => {
          const orig = originalTextMap.get(n);
          const trimmed = (orig || '').trim();
          if (shouldSkipText(trimmed)) return;
          const noun = isNodeNoun(n, trimmed);
          const val = noun ? updatedNouns[trimmed] : updatedUi[trimmed];
          if (val) {
            const lead = orig.match(/^\s*/)?.[0] || '';
            const trail = orig.match(/\s*$/)?.[0] || '';
            const nextVal = `${lead}${val}${trail}`;
            if (n.nodeValue !== nextVal) n.nodeValue = nextVal;
          }
        });

        placeholders.forEach((el) => {
          if (el.closest('.notranslate')) return;
          const origPh = (originalPlaceholderMap.get(el) || '').trim();
          if (updatedUi[origPh]) {
            el.setAttribute('placeholder', updatedUi[origPh]);
          }
        });
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
