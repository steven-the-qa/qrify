import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import jsQR from "jsqr";

/**
 * Enable clipboard access for the current browser. Chromium takes a runtime
 * permission grant; Firefox is opened with the clipboard prefs set in
 * playwright.config.ts (`firefoxUserPrefs`), which is enough for text reads.
 * WebKit has no automation hook for scripted clipboard reads at all.
 */
async function allowClipboard(context: BrowserContext, browserName: string) {
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
}

/** Read the on-screen QR canvas and decode it back to a string. */
async function decodeQr(page: Page): Promise<string | null> {
  const { data, width, height } = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("no canvas on the page");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { data: Array.from(image.data), width: canvas.width, height: canvas.height };
  });
  return jsQR(Uint8ClampedArray.from(data), width, height)?.data ?? null;
}

async function setUrl(page: Page, value: string) {
  const input = page.getByLabel(/destination url/i);
  await input.fill(value);
  // Wait past the debounce + re-render.
  await expect(page.getByRole("img", { name: `QR code for ${value}` })).toBeVisible();
}

test.describe("Qrify", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders a scannable QR for the default URL", async ({ page }) => {
    await expect(page.getByLabel(/destination url/i)).toHaveValue("https://example.com");
    await expect.poll(() => decodeQr(page)).toBe("https://example.com");
  });

  test("updates the QR live as the URL changes", async ({ page }) => {
    await setUrl(page, "https://example.com");
    await expect.poll(() => decodeQr(page)).toBe("https://example.com");

    await setUrl(page, "https://anthropic.com/research");
    await expect.poll(() => decodeQr(page)).toBe("https://anthropic.com/research");
  });

  test("encodes long URLs with query strings", async ({ page }) => {
    const long = `https://example.com/p?${"a=1&b=2&c=3&".repeat(12)}z=9`;
    await setUrl(page, long);
    await expect.poll(() => decodeQr(page)).toBe(long);
  });

  test("shows a placeholder when the input is cleared", async ({ page }) => {
    await page.getByLabel(/destination url/i).fill("");
    await expect(page.getByText(/enter a url above to generate a code/i)).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /copy qr image/i })).toBeDisabled();
  });

  test("copies the link text to the clipboard", async ({ page, context, browserName }) => {
    test.skip(
      browserName === "webkit",
      "WebKit has no way to read the clipboard from a script under automation",
    );
    await allowClipboard(context, browserName);
    await setUrl(page, "https://example.com/copied");

    await page.getByRole("button", { name: /copy link/i }).click();
    await expect(page.getByText("Copied ✓")).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe("https://example.com/copied");
  });

  test("copies the QR image and it decodes to the URL", async ({ page, context, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "async ClipboardItem image writes/reads only work headless in Chromium",
    );
    await allowClipboard(context, browserName);
    await setUrl(page, "https://example.com/as-image");

    await page.getByRole("button", { name: /copy qr image/i }).click();
    await expect(page.getByText("Copied ✓")).toBeVisible();

    const decoded = await page.evaluate(async () => {
      const items = await navigator.clipboard.read();
      const item = items.find((i) => i.types.includes("image/png"));
      if (!item) throw new Error("no image on the clipboard");
      const blob = await item.getType("image/png");
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return { data: Array.from(img.data), width: canvas.width, height: canvas.height };
    });

    const result = jsQR(
      Uint8ClampedArray.from(decoded.data),
      decoded.width,
      decoded.height,
    );
    expect(result?.data).toBe("https://example.com/as-image");
  });

  test("has no horizontal overflow on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("keeps a white QR tile in dark mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const tileBg = await page.evaluate(() => {
      const tile = document.querySelector(".tile");
      return tile ? getComputedStyle(tile).backgroundColor : null;
    });
    expect(bodyBg).toBe("rgb(20, 22, 19)");
    expect(tileBg).toBe("rgb(255, 255, 255)");
  });

  test("is operable by keyboard", async ({ page, browserName }) => {
    test.skip(
      browserName === "webkit",
      "WebKit on macOS only tabs to buttons with Full Keyboard Access enabled",
    );
    await page.getByLabel(/destination url/i).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /copy qr image/i })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /copy link/i })).toBeFocused();
  });
});
