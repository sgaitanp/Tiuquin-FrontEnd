import { useEffect, useMemo, useRef, useState } from 'react';
/* eslint-disable react-hooks/set-state-in-effect */

const Ms = ({
  icon,
  style = {},
}: {
  icon: string;
  style?: React.CSSProperties;
}) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: 18, lineHeight: 1, verticalAlign: 'middle', ...style }}
  >
    {icon}
  </span>
);

export default function ImageQuestion({
  value,
  onChange,
}: {
  value: File[];
  onChange: (v: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const files = useMemo(
    () => (Array.isArray(value) ? value : []),
    [value],
  );

  // Object URLs for thumbnail previews. Creating them inside the
  // effect (rather than useMemo) keeps URL lifetimes tied to the
  // effect's cleanup, which survives section-switch remounts.
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [files]);

  const handlePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    const invalid = picked.filter((f) => !f.type.startsWith('image/'));
    const valid = picked.filter((f) => f.type.startsWith('image/'));
    if (invalid.length) {
      setError(
        `Only image files are accepted. Rejected: ${invalid.map((f) => f.name).join(', ')}`,
      );
    } else {
      setError('');
    }
    if (valid.length) onChange([...files, ...valid]);
  };

  const fmt = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            minWidth: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 10,
            border: '2px dashed #e2e8f0',
            background: '#fafafa',
            padding: '18px 14px',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Ms icon="image" style={{ fontSize: 22, color: '#94a3b8' }} />
          Choose image
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          style={{
            flex: 1,
            minWidth: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 10,
            border: '2px dashed #e2e8f0',
            background: '#fafafa',
            padding: '18px 14px',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Ms icon="photo_camera" style={{ fontSize: 22, color: '#94a3b8' }} />
          Take photo
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handlePicked}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePicked}
        style={{ display: 'none' }}
      />

      {error && (
        <p style={{ fontSize: 11, color: '#ef4444', margin: '8px 0 0' }}>
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 8,
          }}
        >
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              {previews[i] ? (
                <img
                  src={previews[i]}
                  alt={f.name}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 100,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f1f5f9',
                  }}
                >
                  <Ms icon="image" style={{ fontSize: 24, color: '#94a3b8' }} />
                </div>
              )}
              <div style={{ padding: '6px 8px' }}>
                <p
                  title={f.name}
                  style={{
                    fontSize: 11,
                    color: '#374151',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.name}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                  {fmt(f.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                title="Remove"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  padding: 2,
                  borderRadius: 4,
                  display: 'flex',
                }}
              >
                <Ms icon="close" style={{ fontSize: 14, color: '#fff' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
