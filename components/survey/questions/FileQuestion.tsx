import { useRef } from 'react';

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

export default function FileQuestion({
  value,
  onChange,
}: {
  value: File[];
  onChange: (v: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const files = Array.isArray(value) ? value : [];

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    onChange([...files, ...newFiles]);
    e.target.value = '';
  };

  const fmt = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed #e2e8f0',
          borderRadius: 10,
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          background: '#fafafa',
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.borderColor = '#0f172a')
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0')
        }
      >
        <Ms
          icon="upload_file"
          style={{
            fontSize: 28,
            color: '#94a3b8',
            display: 'block',
            margin: '0 auto 6px',
          }}
        />
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Click to upload or drag and drop
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
          PDF, PNG, JPG up to 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>
      {files.length > 0 && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                padding: '8px 12px',
                background: '#fff',
              }}
            >
              <Ms
                icon="description"
                style={{ fontSize: 16, color: '#64748b' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
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
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <Ms icon="close" style={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
