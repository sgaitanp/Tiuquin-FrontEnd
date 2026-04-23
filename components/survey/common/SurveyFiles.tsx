'use client';

import { useEffect, useState } from 'react';
import { getSiteSurveyFiles } from '@/services/projectService';
import { downloadFile, previewFile } from '@/services/fileService';
import type { ResponseFile } from '@/types/response';

/**
 * Lists the files attached to a site survey with preview / download
 * actions. Fetches on mount via `getSiteSurveyFiles`. Site-survey
 * files share the same wire shape as `ResponseFile`, so we reuse it.
 */
export default function SurveyFiles({ surveyId }: { surveyId: string }) {
  const [files, setFiles] = useState<ResponseFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteSurveyFiles(surveyId)
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#94a3b8',
          fontSize: 12,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          sync
        </span>
        Loading files…
      </div>
    );

  if (!files.length)
    return (
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
        No files attached to this survey.
      </p>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {files.map((file) => {
        const isImage = file.fileType?.startsWith('image/');
        const isPdf = file.fileType === 'application/pdf';
        const fmt = (b: number) =>
          b < 1024 * 1024
            ? `${(b / 1024).toFixed(1)} KB`
            : `${(b / (1024 * 1024)).toFixed(1)} MB`;
        return (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                color: isPdf ? '#ef4444' : isImage ? '#3b82f6' : '#64748b',
                flexShrink: 0,
              }}
            >
              {isPdf
                ? 'picture_as_pdf'
                : isImage
                  ? 'image'
                  : 'insert_drive_file'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#0f172a',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.originalFilename}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                {fmt(file.fileSize)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() =>
                  previewFile(file.id).catch(() => alert('Preview failed'))
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  padding: '5px 10px',
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
                    alert('Download failed'),
                  )
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 6,
                  border: 'none',
                  background: '#0f172a',
                  padding: '5px 10px',
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
        );
      })}
    </div>
  );
}
