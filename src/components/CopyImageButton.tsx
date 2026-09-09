import { useFlash } from "../hooks/useFlash";
import { canvasToPngBlob } from "../lib/canvas";
import { canCopyImage, copyImageToClipboard } from "../lib/clipboard";
import { CopyIcon } from "./icons";

interface CopyImageButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  disabled: boolean;
}

export function CopyImageButton({ canvasRef, disabled }: CopyImageButtonProps) {
  const [flashLabel, flash] = useFlash();

  async function handleClick() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!canCopyImage()) {
      flash("Press ⌘C on the code");
      return;
    }

    try {
      const blob = await canvasToPngBlob(canvas);
      await copyImageToClipboard(blob);
      flash("Copied ✓");
    } catch {
      flash("Copy blocked");
    }
  }

  return (
    <button
      type="button"
      className={flashLabel ? "primary done" : "primary"}
      onClick={handleClick}
      disabled={disabled}
    >
      <CopyIcon />
      <span aria-live="polite">{flashLabel ?? "Copy QR image"}</span>
    </button>
  );
}
