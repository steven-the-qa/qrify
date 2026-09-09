import QRCode from "qrcode";

/**
 * Error-correction level "M" (~15% recovery) is the sweet spot for URLs: dense
 * enough to stay compact, robust enough to survive a screenshot or a print.
 */
export const ERROR_CORRECTION_LEVEL = "M" as const;

/** Quiet-zone width, in modules, required by the QR spec for reliable scanning. */
export const QUIET_ZONE_MODULES = 4;

/** On-screen size of the QR image, in CSS pixels. */
export const QR_DISPLAY_SIZE = 200;

/** Dark/light module colors. Kept dark-on-white in every theme — inverted codes scan poorly. */
export const QR_COLORS = { dark: "#1B1A1F", light: "#FFFFFF" } as const;

export type QrMatrix = ReturnType<typeof QRCode.create>;

/**
 * Trim the raw input and treat blank strings as "nothing to encode".
 * Any non-blank string is encodable — URL-ness is only advisory in the UI.
 */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Build the raw QR module matrix. Throws if `text` is too large to encode. */
export function encodeMatrix(text: string): QrMatrix {
  return QRCode.create(text, { errorCorrectionLevel: ERROR_CORRECTION_LEVEL });
}
