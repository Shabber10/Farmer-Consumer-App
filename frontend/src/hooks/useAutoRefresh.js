import { useEffect, useRef } from 'react';

/**
 * Periodically invokes `callback(true)` in the background and also refreshes
 * whenever the browser tab/app regains focus or network connectivity.
 * Pass `enabled = false` while a modal/form is open to avoid disrupting edits.
 */
export const useAutoRefresh = (callback, intervalMs = 10000, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const trigger = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      savedCallback.current?.(true);
    };

    const timer = setInterval(trigger, intervalMs);
    const onFocus = () => trigger();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        trigger();
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
};

export default useAutoRefresh;
