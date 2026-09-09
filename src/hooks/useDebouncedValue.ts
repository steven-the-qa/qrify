import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stopped changing for `delayMs`. Used to keep the
 * QR encoder from re-running on every keystroke while a URL is being typed.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
