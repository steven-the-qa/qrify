import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { canvasToPngBlob, drawQr } from "./lib/canvas";
import { canCopyImage, copyImageToClipboard, copyTextToClipboard } from "./lib/clipboard";

vi.mock("./lib/canvas", () => ({
  drawQr: vi.fn(() => Promise.resolve()),
  canvasToPngBlob: vi.fn(() => Promise.resolve(new Blob(["png"], { type: "image/png" }))),
}));

vi.mock("./lib/clipboard", () => ({
  canCopyImage: vi.fn(() => true),
  copyImageToClipboard: vi.fn(() => Promise.resolve()),
  copyTextToClipboard: vi.fn(() => Promise.resolve()),
}));

const drawQrMock = vi.mocked(drawQr);
const canvasToPngBlobMock = vi.mocked(canvasToPngBlob);
const canCopyImageMock = vi.mocked(canCopyImage);
const copyImageMock = vi.mocked(copyImageToClipboard);
const copyTextMock = vi.mocked(copyTextToClipboard);

function getInput() {
  return screen.getByLabelText(/destination url/i);
}

beforeEach(() => {
  drawQrMock.mockReset().mockResolvedValue(undefined);
  canvasToPngBlobMock
    .mockReset()
    .mockResolvedValue(new Blob(["png"], { type: "image/png" }));
  canCopyImageMock.mockReset().mockReturnValue(true);
  copyImageMock.mockReset().mockResolvedValue(undefined);
  copyTextMock.mockReset().mockResolvedValue(undefined);
});

describe("Qrify app", () => {
  it("renders at rest with the default URL and a labelled QR image", async () => {
    render(<App />);

    expect(getInput()).toHaveValue("https://example.com");
    expect(
      screen.getByRole("img", { name: "QR code for https://example.com" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(drawQrMock).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        "https://example.com",
      ),
    );
  });

  it("re-encodes reactively as the URL changes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());
    drawQrMock.mockClear();

    await user.clear(getInput());
    await user.type(getInput(), "https://anthropic.com");

    await waitFor(() =>
      expect(drawQrMock).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        "https://anthropic.com",
      ),
    );
    expect(
      screen.getByRole("img", { name: "QR code for https://anthropic.com" }),
    ).toBeInTheDocument();
  });

  it("debounces rapid typing into a single encode", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());
    drawQrMock.mockClear();

    await user.clear(getInput());
    await user.type(getInput(), "abcdef");

    await waitFor(() =>
      expect(drawQrMock).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), "abcdef"),
    );
    expect(drawQrMock).toHaveBeenCalledTimes(1);
  });

  it("shows a placeholder and stops encoding when the input is empty", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());
    drawQrMock.mockClear();

    await user.clear(getInput());

    expect(await screen.findByText(/enter a url above to generate a code/i)).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(drawQrMock).not.toHaveBeenCalled();
  });

  it("shows a friendly message when the URL is too long to encode", async () => {
    drawQrMock.mockRejectedValue(new Error("code length overflow"));
    const user = userEvent.setup();
    render(<App />);

    await user.clear(getInput());
    await user.type(getInput(), "https://example.com/way-too-long");

    expect(await screen.findByText(/too long to fit in a qr code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy qr image/i })).toBeDisabled();
  });

  it("copies the rendered QR as a PNG image", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /copy qr image/i }));

    await waitFor(() => expect(copyImageMock).toHaveBeenCalledTimes(1));
    const blob = copyImageMock.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
    expect(await screen.findByText("Copied ✓")).toBeInTheDocument();
  });

  it("clears the copied confirmation after a moment", async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /copy qr image/i }));
    expect(await screen.findByText("Copied ✓")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText("Copied ✓")).not.toBeInTheDocument(), {
      timeout: 2500,
    });
  });

  it("falls back to a manual-copy hint when the clipboard cannot take an image", async () => {
    canCopyImageMock.mockReturnValue(false);
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /copy qr image/i }));

    expect(await screen.findByText(/press ⌘c on the code/i)).toBeInTheDocument();
    expect(copyImageMock).not.toHaveBeenCalled();
  });

  it("reports when the browser blocks the image copy", async () => {
    copyImageMock.mockRejectedValue(new DOMException("denied"));
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /copy qr image/i }));

    expect(await screen.findByText("Copy blocked")).toBeInTheDocument();
  });

  it("copies the trimmed link text", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(getInput());
    await user.type(getInput(), "   https://spaced.example   ");
    await user.click(screen.getByRole("button", { name: /copy link/i }));

    await waitFor(() =>
      expect(copyTextMock).toHaveBeenCalledWith("https://spaced.example"),
    );
  });

  it("exposes accessible names for every control and the QR image", async () => {
    render(<App />);
    await waitFor(() => expect(drawQrMock).toHaveBeenCalled());

    expect(getInput()).toHaveAccessibleName("Destination URL");
    expect(screen.getByRole("img")).toHaveAccessibleName(/^QR code for /);
    const copyImage = screen.getByRole("button", { name: "Copy QR image" });
    const copyLink = screen.getByRole("button", { name: "Copy link" });
    expect(copyImage).toBeEnabled();
    expect(copyLink).toBeEnabled();
    // Copy feedback is announced politely rather than only shown.
    expect(copyImage.querySelector("[aria-live='polite']")).not.toBeNull();
    expect(copyLink.querySelector("[aria-live='polite']")).not.toBeNull();
  });

  it("keeps the region landmark and labels intact in the empty state", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(getInput());
    await screen.findByText(/enter a url above to generate a code/i);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(getInput()).toHaveAccessibleName("Destination URL");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
