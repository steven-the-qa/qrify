import { describe, expect, it } from "vitest";
import {
  EMPTY,
  LONG,
  NOT_A_URL,
  SIMPLE,
  TOO_LONG,
  UNICODE,
  WHITESPACE,
} from "../test/fixtures";
import { encodeMatrix, normalizeUrl } from "./qr";

describe("normalizeUrl", () => {
  it("returns null for an empty string", () => {
    expect(normalizeUrl(EMPTY)).toBeNull();
  });

  it("returns null for whitespace only", () => {
    expect(normalizeUrl(WHITESPACE)).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUrl(`  ${SIMPLE}  `)).toBe(SIMPLE);
  });

  it("passes non-URL text through unchanged (URL-ness is advisory)", () => {
    expect(normalizeUrl(NOT_A_URL)).toBe(NOT_A_URL);
  });
});

describe("encodeMatrix", () => {
  it("produces a non-empty module matrix for a simple URL", () => {
    expect(encodeMatrix(SIMPLE).modules.size).toBeGreaterThan(0);
  });

  it("is deterministic for the same input", () => {
    expect(encodeMatrix(SIMPLE).modules.data).toEqual(encodeMatrix(SIMPLE).modules.data);
  });

  it("selects a valid QR version", () => {
    const { version } = encodeMatrix(SIMPLE);
    expect(version).toBeGreaterThanOrEqual(1);
    expect(version).toBeLessThanOrEqual(40);
  });

  it("grows the matrix as the payload grows", () => {
    expect(encodeMatrix(LONG).modules.size).toBeGreaterThan(encodeMatrix(SIMPLE).modules.size);
  });

  it("encodes non-ASCII characters without throwing", () => {
    expect(() => encodeMatrix(UNICODE)).not.toThrow();
  });

  it("throws when the payload cannot fit in a single QR code", () => {
    expect(() => encodeMatrix(TOO_LONG)).toThrow();
  });
});
