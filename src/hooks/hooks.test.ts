import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";
import { useFlash } from "./useFlash";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 200));
    expect(result.current).toBe("a");
  });

  it("updates only after the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("b");
  });

  it("coalesces rapid changes to the last value", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("c");
  });
});

describe("useFlash", () => {
  it("shows a message, then clears it after the timeout", () => {
    const { result } = renderHook(() => useFlash());
    expect(result.current[0]).toBeNull();

    act(() => result.current[1]("Copied ✓"));
    expect(result.current[0]).toBe("Copied ✓");

    act(() => vi.advanceTimersByTime(1600));
    expect(result.current[0]).toBeNull();
  });

  it("restarts the timer when flashed again", () => {
    const { result } = renderHook(() => useFlash());

    act(() => result.current[1]("first"));
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current[1]("second"));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current[0]).toBe("second");

    act(() => vi.advanceTimersByTime(600));
    expect(result.current[0]).toBeNull();
  });
});
