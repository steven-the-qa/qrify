import QRCode from "qrcode";
import { ERROR_CORRECTION_LEVEL, QR_COLORS, QR_DISPLAY_SIZE, QUIET_ZONE_MODULES } from "./qr";

/**
 * Browser-only canvas helpers. These touch the real `<canvas>` API and the
 * `qrcode` renderer, so they are verified end-to-end by Playwright rather than
 * in jsdom (which has no 2D context).
 */

/** Cap the backing-store scale so huge-DPR displays don't allocate absurd canvases. */
const MAX_SCALE = 3;

/**
 * Render `text` into `canvas` at device-pixel resolution. Resolves when drawn,
 * rejects if the payload is too large for a single QR code.
 */
export async function drawQr(canvas: HTMLCanvasElement, text: string): Promise<void> {
  const dpr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    MAX_SCALE,
  );
  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: ERROR_CORRECTION_LEVEL,
    margin: QUIET_ZONE_MODULES,
    width: QR_DISPLAY_SIZE * dpr,
    color: { ...QR_COLORS },
  });
  canvas.style.width = `${QR_DISPLAY_SIZE}px`;
  canvas.style.height = `${QR_DISPLAY_SIZE}px`;
}

/** Extract the current canvas contents as a PNG blob. */
export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not render the QR image"))),
      "image/png",
    );
  });
}
