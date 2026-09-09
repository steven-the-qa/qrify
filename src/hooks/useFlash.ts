import { useCallback, useEffect, useRef, useState } from "react";

const FLASH_MS = 1600;

/**
 * A transient status label for a button ("Copied ✓", "Copy blocked"). Call
 * `flash(message)` to show it; it clears itself after {@link FLASH_MS}.
 */
export function useFlash(): readonly [string | null, (message: string) => void] {
  const [label, setLabel] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const flash = useCallback((message: string) => {
    setLabel(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLabel(null), FLASH_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [label, flash] as const;
}
