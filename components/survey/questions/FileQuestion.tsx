import { useRef, useState } from 'react';

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

type FileTypeSpec = {
  label: string;
  hint: string;
  accept: string;
  test: (f: File) => boolean;
};

const FILE_TYPE_SPEC: Record<string, FileTypeSpec> = {
  image: {
    label: 'image',
    hint: 'PNG, JPG, GIF, etc.',
    accept: 'image/*',
    test: (f) => f.type.startsWith('image/'),
  },
  pdf: {
    label: 'PDF',
    hint: 'PDF only',
    accept: 'application/pdf,.pdf',
    test: (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name),
  },
  doc: {
    label: 'Word document',
    hint: 'DOC, DOCX',
    accept:
      '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    test: (f) =>
      /\.docx?$/i.test(f.name) ||
      f.type === 'application/msword' ||
      f.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  excel: {
    label: 'Excel spreadsheet',
    hint: 'XLS, XLSX, CSV',
    accept:
      '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv',
    test: (f) =>
      /\.(xlsx?|csv)$/i.test(f.name) ||
      f.type === 'application/vnd.ms-excel' ||
      f.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'text/csv',
  },
  video: {
    label: 'video',
    hint: 'MP4, MOV, WEBM, etc.',
    accept: 'video/*',
    test: (f) => f.type.startsWith('video/'),
  },
  audio: {
    label: 'audio',
    hint: 'MP3, WAV, M4A, etc.',
    accept: 'audio/*',
    test: (f) => f.type.startsWith('audio/'),
  },
};

export default function FileQuestion({
  value,
  onChange,
  acceptedFileType,
}: {
  value: File[];
  onChange: (v: File[]) => void;
  acceptedFileType?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const files = Array.isArray(value) ? value : [];

  const spec = acceptedFileType
    ? FILE_TYPE_SPEC[acceptedFileType.toLowerCase()]
    : null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';

    if (spec) {
      const invalid = picked.filter((f) => !spec.test(f));
      const valid = picked.filter((f) => spec.test(f));
      if (invalid.length) {
        setError(
          `Only ${spec.label} files are accepted. Rejected: ${invalid
            .map((f) => f.name)
            .join(', ')}`,
        );
      } else {
        setError('');
      }
      if (valid.length) onChange([...files, ...valid]);
    } else {
      setError('');
      onChange([...files, ...picked]);
    }
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
          {spec
            ? `Accepted: ${spec.label} (${spec.hint})`
            : 'Any file up to 10MB'}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={spec?.accept}
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <p style={{ fontSize: 11, color: '#ef4444', margin: '8px 0 0' }}>
          {error}
        </p>
      )}

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
