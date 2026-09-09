/** Shared test inputs — see the test-suite spec in README.md. */

export const EMPTY = "";
export const WHITESPACE = "   ";
export const SIMPLE = "https://example.com";
export const OTHER = "https://anthropic.com";
export const LONG = `https://example.com/search?${"q=qr+code+generator&page=2&".repeat(10)}end`;
export const UNICODE = "https://example.com/café/☕/naïve";
export const NOT_A_URL = "hello world";
/** Comfortably past a single QR code's byte capacity at error-correction "M". */
export const TOO_LONG = "x".repeat(3000);
