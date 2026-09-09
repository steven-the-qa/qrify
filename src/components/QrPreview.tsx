import { useEffect, useState } from "react";
import { drawQr } from "../lib/canvas";
import { QR_DISPLAY_SIZE } from "../lib/qr";

export type QrStatus = "empty" | "ready" | "too-long";

interface QrPreviewProps {
  /** The text to encode, or `null` when the input is empty. */
  value: string | null;
  /** Shared ref so the copy button can read the rendered pixels. */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Reports the outcome of the latest encode attempt. Must be stable. */
  onStatusChange: (status: QrStatus) => void;
}

export function QrPreview({ value, canvasRef, onStatusChange }: QrPreviewProps) {
  const [tooLong, setTooLong] = useState(false);

  useEffect(() => {
    if (value === null) {
      setTooLong(false);
      onStatusChange("empty");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    drawQr(canvas, value)
      .then(() => {
        if (cancelled) return;
        setTooLong(false);
        onStatusChange("ready");
        canvas.classList.remove("swap");
        // Force a reflow so the fade-in animation restarts on every render.
        void canvas.offsetWidth;
        canvas.classList.add("swap");
      })
      .catch(() => {
        if (cancelled) return;
        setTooLong(true);
        onStatusChange("too-long");
      });

    return () => {
      cancelled = true;
    };
  }, [value, canvasRef, onStatusChange]);

  if (value === null) {
    return <p className="tile is-empty">Enter a URL above to generate a code</p>;
  }

  return (
    <div className={tooLong ? "tile is-empty" : "tile"}>
      <canvas
        ref={canvasRef}
        width={QR_DISPLAY_SIZE}
        height={QR_DISPLAY_SIZE}
        role="img"
        aria-label={`QR code for ${value}`}
        hidden={tooLong}
      />
      {tooLong && <span>That’s too long to fit in a QR code — try a shorter link</span>}
    </div>
  );
}
