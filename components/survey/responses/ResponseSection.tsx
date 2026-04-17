import React from 'react';
import { Ms } from './shared';
import {
  downloadFile,
  previewFile,
  getFileUrl,
  getAuthHeaders,
} from '@/services/fileService';

function FileCard({ file }: { file: any }) {
  const isImage = file.fileType?.startsWith('image/');
  const isPdf = file.fileType === 'application/pdf';
  const fmt = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const [imgSrc, setImgSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isImage) return;
    fetch(getFileUrl(file.id), { headers: getAuthHeaders() })
      .then((r) => r.blob())
      .then((blob) => setImgSrc(URL.createObjectURL(blob)))
      .catch(() => {});
    return () => {
      if (imgSrc) URL.revokeObjectURL(imgSrc);
    };
  }, [file.id]);

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {isImage && (
        <div
          style={{
            height: 120,
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() =>
            previewFile(file.id).catch(() => alert('Failed to preview file.'))
          }
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={file.originalFilename}
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36, color: '#94a3b8' }}
            >
              image
            </span>
          )}
        </div>
      )}
      {!isImage && (
        <div
          style={{
            height: 80,
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() =>
            previewFile(file.id).catch(() => alert('Failed to preview file.'))
          }
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 36, color: isPdf ? '#ef4444' : '#64748b' }}
          >
            {isPdf ? 'picture_as_pdf' : 'insert_drive_file'}
          </span>
        </div>
      )}
      <div style={{ padding: '8px 10px' }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#0f172a',
            margin: '0 0 2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.originalFilename}
        </p>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 8px' }}>
          {fmt(file.fileSize)}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() =>
              previewFile(file.id).catch(() => alert('Failed to preview file.'))
            }
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#fff',
              padding: '5px 8px',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 13 }}
            >
              visibility
            </span>
            Preview
          </button>
          <button
            onClick={() =>
              downloadFile(file.id, file.originalFilename).catch(() =>
                alert('Failed to download file.'),
              )
            }
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              borderRadius: 6,
              border: 'none',
              background: '#0f172a',
              padding: '5px 8px',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 13, color: '#fff' }}
            >
              download
            </span>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ qa }: { qa: any }) {
  const hasFiles = qa.files && qa.files.length > 0;
  const displayValue = qa.selectedOptionText ?? qa.inputValue;

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#374151',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {qa.questionText}
        </p>
        <span
          style={{
            fontSize: 10,
            color: '#94a3b8',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 5,
            padding: '2px 6px',
            flexShrink: 0,
            fontFamily: 'monospace',
          }}
        >
          {qa.questionType}
        </span>
      </div>

      {/* Text/select answer */}
      {displayValue && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: hasFiles ? 10 : 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: '#22c55e', flexShrink: 0 }}
          >
            check_circle
          </span>
          <p
            style={{
              fontSize: 14,
              color: '#0f172a',
              margin: 0,
              fontWeight: 500,
            }}
          >
            {displayValue}
          </p>
        </div>
      )}

      {/* Files */}
      {hasFiles && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          {qa.files.map((file: any) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}

      {/* No answer */}
      {!displayValue && !hasFiles && (
        <p
          style={{
            fontSize: 12,
            color: '#94a3b8',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          No answer provided
        </p>
      )}
    </div>
  );
}

export default function ResponseSection({
  section,
  index,
}: {
  section: any;
  index: number;
}) {
  const questionAnswers = section.questionAnswers ?? [];
  const [title, subtitle] = (section.sectionName ?? '').includes(' - ')
    ? (section.sectionName ?? '').split(' - ')
    : [section.sectionName ?? `Section ${index + 1}`, null];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {index + 1}
          </span>
        </div>
        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingLeft: 38,
        }}
      >
        {questionAnswers.map((qa: any) => (
          <QuestionCard key={qa.questionId} qa={qa} />
        ))}
        {questionAnswers.length === 0 && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            No answers in this section.
          </p>
        )}
      </div>
    </div>
  );
}
