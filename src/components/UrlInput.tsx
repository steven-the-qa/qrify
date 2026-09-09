interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function UrlInput({ value, onChange }: UrlInputProps) {
  return (
    <div className="field-group">
      <label htmlFor="url">Destination URL</label>
      <input
        id="url"
        type="url"
        inputMode="url"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="none"
        placeholder="https://example.com"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
