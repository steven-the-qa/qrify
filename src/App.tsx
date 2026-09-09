import { useCallback, useMemo, useRef, useState } from "react";
import { CopyImageButton } from "./components/CopyImageButton";
import { CopyLinkButton } from "./components/CopyLinkButton";
import { QrPreview, type QrStatus } from "./components/QrPreview";
import { UrlInput } from "./components/UrlInput";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { normalizeUrl } from "./lib/qr";

const DEBOUNCE_MS = 200;
const DEFAULT_URL = "https://claude.ai/code";

export function App() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [status, setStatus] = useState<QrStatus>("ready");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const debouncedUrl = useDebouncedValue(url, DEBOUNCE_MS);
  const encodable = useMemo(() => normalizeUrl(debouncedUrl), [debouncedUrl]);

  const handleStatusChange = useCallback((next: QrStatus) => setStatus(next), []);

  const trimmedLink = normalizeUrl(url);
  const canCopy = status === "ready";

  return (
    <main className="card">
      <header>
        <div className="wordmark">
          <span className="glyph" aria-hidden="true">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
          Qrify
        </div>
        <p className="tagline">Paste a link, get a QR code. It updates as you type.</p>
      </header>

      <UrlInput value={url} onChange={setUrl} />

      <div className="stage">
        <QrPreview value={encodable} canvasRef={canvasRef} onStatusChange={handleStatusChange} />
        <span className="live">
          <span className="dot" aria-hidden="true" /> Live preview &middot; nothing is uploaded
        </span>
      </div>

      <div className="actions">
        <CopyImageButton canvasRef={canvasRef} disabled={!canCopy} />
        <CopyLinkButton value={trimmedLink} />
      </div>

      <p className="note">
        No account, no database. The QR code is built in your browser and embeds the URL
        itself &mdash; once you copy it, it keeps working forever without Qrify.
      </p>
    </main>
  );
}
