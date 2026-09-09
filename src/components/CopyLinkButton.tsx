import { useFlash } from "../hooks/useFlash";
import { copyTextToClipboard } from "../lib/clipboard";
import { LinkIcon } from "./icons";

interface CopyLinkButtonProps {
  /** The exact text to copy, or `null` when there is nothing to copy. */
  value: string | null;
}

export function CopyLinkButton({ value }: CopyLinkButtonProps) {
  const [flashLabel, flash] = useFlash();

  async function handleClick() {
    if (value === null) return;
    try {
      await copyTextToClipboard(value);
      flash("Copied ✓");
    } catch {
      flash("Copy blocked");
    }
  }

  return (
    <button
      type="button"
      className={flashLabel ? "ghost done" : "ghost"}
      onClick={handleClick}
      disabled={value === null}
    >
      <LinkIcon />
      <span aria-live="polite">{flashLabel ?? "Copy link"}</span>
    </button>
  );
}
