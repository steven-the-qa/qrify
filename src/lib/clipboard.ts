/** True when the browser can accept an image on the clipboard from a script. */
export function canCopyImage(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.write === "function" &&
    typeof ClipboardItem !== "undefined"
  );
}

/** Write a PNG blob to the clipboard as an image. */
export async function copyImageToClipboard(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

/** Write plain text to the clipboard. */
export async function copyTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
