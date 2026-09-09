# Qrify

A minimalist, friendly QR code generator. Paste a URL, get a QR code that updates
as you type, and copy it to the clipboard as an image (or copy the link itself).

**It runs entirely in your browser.** A QR code *is* the data — the URL is encoded
directly into the pattern — so there is no account, no database, and no network
call. Once you copy the code, it works forever without Qrify.

## Stack

- **Vite + React + TypeScript** — single-page app, no router, no state library
- **[`qrcode`](https://www.npmjs.com/package/qrcode)** — QR rendering to `<canvas>`
- **Plain CSS** with custom properties (`src/index.css`) — no utility framework
- **Vitest** + Testing Library for unit/component tests, **Playwright** for E2E

## Develop

```bash
npm install
npm run dev            # http://localhost:5173
```

```bash
npm run build          # typecheck + production build to dist/
npm run preview        # serve the build
npm run test           # unit + component tests
npm run test:coverage  # + coverage thresholds
npm run test:e2e       # Playwright (builds first, then runs)
```

## Deploy (GitHub Pages)

It's a static SPA with no backend, so Pages is a natural fit.

1. Push to GitHub with the repo named `qrify` (any name works — `base: "./"`
   in `vite.config.ts` makes the build path-independent).
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. `.github/workflows/deploy.yml` builds and publishes; the app
   lands at `https://<user>.github.io/<repo>/`.

The only external dependency at runtime is Google Fonts (served over HTTPS); the
QR generation itself is fully offline.

## Architecture

Single state atom (`url`) in `App`. Everything else is a pure function of it.

```
App
├─ UrlInput            controlled <input type="url">
├─ QrPreview           draws the debounced URL to a shared <canvas> ref
├─ CopyImageButton     canvas → PNG blob → clipboard
└─ CopyLinkButton      url text → clipboard
```

- `hooks/useDebouncedValue` — coalesces keystrokes (200 ms) before re-encoding
- `hooks/useFlash` — transient button status ("Copied ✓", "Copy blocked")
- `lib/qr` — pure encoder helpers (`normalizeUrl`, `encodeMatrix`; level **M**, 4-module quiet zone)
- `lib/canvas` — browser-only `<canvas>` rendering + PNG extraction (E2E-tested)
- `lib/clipboard` — feature-detected clipboard writes with graceful fallback (E2E-tested)

## Design

Minimalist but friendly: one card, one job. Warmth comes from a soft paper
ground, a rounded green mark, and plain-spoken copy — not decoration.

| Token       | Light                     | Dark      | Role                          |
| ----------- | ------------------------- | --------- | ----------------------------- |
| `--ground`  | `#F4F5F0`                 | `#141613` | page background               |
| `--surface` | `#FFFFFF`                 | `#1E211D` | the card                      |
| `--ink`     | `#1C201D`                 | `#E9EDE9` | text                          |
| `--accent`  | `#2FA36B`                 | `#4FBE86` | primary button, mark, focus   |
| `--ok`      | `#1F7E52`                 | `#6ED0A0` | "Copied ✓" confirmation       |
| `--line`    | `#E3E5DB`                 | `#2C302C` | hairline borders              |

- **Display:** Bricolage Grotesque (wordmark only)
- **UI / body:** Figtree
- **Data:** IBM Plex Mono (the URL field)

Green reads as the "scan complete / go" signal, so the accent and success state
sit in one family. Full light + dark token sets; the QR tile stays white in both
themes (inverted codes scan poorly). Motion is minimal and respects
`prefers-reduced-motion`.

## Test-suite spec

### Unit — `src/lib/qr.test.ts`

- `normalizeUrl` returns `null` for empty/whitespace, trims, passes non-URL text through
- `encodeMatrix` produces a non-empty matrix, is deterministic, picks a valid
  version, grows with payload size, encodes non-ASCII, and throws when the
  payload overflows a single code

`lib/canvas.ts` and `lib/clipboard.ts` are excluded from Vitest coverage — they
are thin wrappers over browser APIs jsdom does not implement, and are covered by
the Playwright round-trip tests instead.

### Hooks — `src/hooks/hooks.test.ts`

- `useDebouncedValue`: initial value is immediate; updates only after the delay;
  coalesces rapid changes to the last value
- `useFlash`: shows then auto-clears; restarts its timer on re-flash

### Component — `src/App.test.tsx` (`drawQr`/`canvasToPngBlob` mocked; jsdom has no canvas)

- Renders at rest with the default URL and a labelled QR image
- Re-encodes reactively as the URL changes; the `aria-label` tracks the value
- Debounces rapid typing into a single encode
- Empty input → placeholder, no `<img>`, encoder not called
- Payload too long → friendly message, copy button disabled
- Copy image → one `ClipboardItem` with `image/png`; button flashes "Copied ✓"
  and clears after the timeout
- No `ClipboardItem` support → "Press ⌘C on the code" fallback, no write attempt
- Clipboard write rejects → "Copy blocked"
- Copy link → `writeText` with the trimmed value
- Accessible names present for the input, QR image, and both buttons; `main`
  landmark and labels intact in the empty state

### End-to-end — `e2e/qrify.spec.ts` (Playwright: chromium, firefox, webkit)

The real correctness check: render the canvas, decode it back with **jsQR**, and
assert it equals the input.

- Default URL renders a decodable code
- Live update: change the URL twice, decode after each
- Long URL with a query string round-trips
- Cleared input → placeholder, no canvas, disabled copy button
- Copy link round-trip via `navigator.clipboard.readText()` — chromium + firefox
  (firefox needs the `firefoxUserPrefs` clipboard flags set in the config)
- Copy image round-trip: read the PNG back off the clipboard, decode it — chromium
  only (async `ClipboardItem` image r/w is not reachable headless elsewhere)
- No horizontal overflow at 375 px
- Dark mode: body background is the dark token, QR tile stays white
- Keyboard: Tab order input → Copy image → Copy link, focus visible (skipped on
  WebKit, which only tabs to buttons with Full Keyboard Access on)

Browser-specific clipboard skips are per-test with explicit reasons, not a blanket
`chromium`-only guard — the "Copy link" feature is verified on two engines.

### CI (`.github/workflows/ci.yml`)

- `test` job: `typecheck` + `test:coverage` — fails under **90%** lines /
  **85%** branches on `src/`
- `e2e` job: full browser matrix, uploads the Playwright HTML report
