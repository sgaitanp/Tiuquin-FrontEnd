import React, { useState } from 'react';
import {
  downloadFile,
  previewFile,
  getFileUrl,
  getAuthHeaders,
} from '@/services/fileService';
import type {
  QuestionAnswer,
  ResponseFile,
  SectionAnswers,
} from '@/types/response';
import { fmtQuestionType } from './shared';
import SurveyMapView from '../common/SurveyMapView';

function FileCard({ file }: { file: ResponseFile }) {
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

function MeasurementOverlay({ qa }: { qa: QuestionAnswer }) {
  // The crew member uploaded the floor plan with their response — pick the first
  // attached image file.
  const imageFile =
    Array.isArray(qa.files)
      ? qa.files.find((f) => f.fileType?.startsWith('image/')) ?? qa.files[0]
      : null;
  const imageFileId: string | null = imageFile?.id ?? null;
  const measurements: Array<{ x: number; y: number; value: number; order: number }> =
    Array.isArray(qa.measurements) ? qa.measurements : [];
  const sorted = [...measurements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const unit: string = qa.measurementUnit || '';
  const referenceLabel: string = qa.referencePointLabel || 'Reference';
  const hasRef =
    typeof qa.referenceX === 'number' && typeof qa.referenceY === 'number';

  const [imgSrc, setImgSrc] = React.useState<string | null>(null);
  const [natural, setNatural] = React.useState<{ w: number; h: number } | null>(
    null,
  );
  const [rendered, setRendered] = React.useState<{ w: number; h: number } | null>(
    null,
  );
  const [failed, setFailed] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!imageFileId) {
      setFailed(true);
      return;
    }
    let revoked = false;
    let objectUrl: string | null = null;
    fetch(getFileUrl(imageFileId), { headers: getAuthHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      })
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
      })
      .catch(() => !revoked && setFailed(true));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageFileId]);

  React.useEffect(() => {
    if (!wrapRef.current) return;
    const update = () => {
      if (!imgRef.current) return;
      setRendered({
        w: imgRef.current.clientWidth,
        h: imgRef.current.clientHeight,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrapRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [imgSrc]);

  const scaleX = natural && rendered ? rendered.w / natural.w : 1;
  const scaleY = natural && rendered ? rendered.h / natural.h : 1;

  if (!imageFileId || failed) {
    return (
      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: 12,
          background: '#f8fafc',
        }}
      >
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>
          Floor plan unavailable. Showing raw data:
        </p>
        {hasRef && (
          <p style={{ fontSize: 12, color: '#0f172a', margin: '0 0 4px' }}>
            {referenceLabel}: ({Math.round(qa.referenceX!)}, {Math.round(qa.referenceY!)})
          </p>
        )}
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#374151' }}>
          {sorted.map((m) => (
            <li key={m.order}>
              #{m.order + 1}: {m.value}
              {unit ? ` ${unit}` : ''} at ({Math.round(m.x)}, {Math.round(m.y)})
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#f8fafc',
        }}
      >
        {imgSrc ? (
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Floor plan"
            draggable={false}
            onLoad={(e) => {
              const t = e.currentTarget;
              setNatural({ w: t.naturalWidth, h: t.naturalHeight });
              setRendered({ w: t.clientWidth, h: t.clientHeight });
            }}
            style={{ width: '100%', display: 'block' }}
          />
        ) : (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 13,
            }}
          >
            Loading floor plan…
          </div>
        )}
        {hasRef && natural && rendered && (
          <OverlayDot
            x={qa.referenceX! * scaleX}
            y={qa.referenceY! * scaleY}
            color="#db2777"
            icon="my_location"
            label={referenceLabel}
          />
        )}
        {natural &&
          rendered &&
          sorted.map((m) => (
            <OverlayDot
              key={m.order}
              x={m.x * scaleX}
              y={m.y * scaleY}
              color="#0ea5e9"
              label={`${m.value}${unit ? ` ${unit}` : ''}`}
            />
          ))}
      </div>
      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
        {sorted.length} measurement{sorted.length === 1 ? '' : 's'}
        {hasRef ? ` · ${referenceLabel} marked` : ''}
      </p>
    </div>
  );
}

function OverlayDot({
  x,
  y,
  color,
  icon,
  label,
}: {
  x: number;
  y: number;
  color: string;
  icon?: string;
  label?: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: color,
          border: '2px solid #fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon && (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 11, color: '#fff', lineHeight: 1 }}
          >
            {icon}
          </span>
        )}
      </div>
      {label && (
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 10,
            fontWeight: 600,
            color: '#0f172a',
            background: '#fff',
            border: `1px solid ${color}`,
            borderRadius: 4,
            padding: '1px 5px',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ qa }: { qa: QuestionAnswer }) {
  const hasFiles = qa.files && qa.files.length > 0;
  const hasGeo =
    typeof qa.latitude === 'number' && typeof qa.longitude === 'number';
  const displayValue = qa.selectedOptionText ?? qa.inputValue;
  const isMultiMeasurement = qa.type === 'MULTI_MEASUREMENT';
  const hasMeasurements =
    isMultiMeasurement &&
    Array.isArray(qa.measurements) &&
    qa.measurements.length > 0;

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
            color: '#64748b',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 5,
            padding: '2px 8px',
            flexShrink: 0,
            fontWeight: 500,
          }}
        >
          {fmtQuestionType(qa.type)}
        </span>
      </div>

      {/* Text/select answer */}
      {displayValue && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: hasFiles || hasGeo ? 10 : 0,
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

      {/* Geolocation */}
      {hasGeo && (
        <div style={{ marginBottom: hasFiles ? 10 : 0 }}>
          <SurveyMapView
            lat={qa.latitude as number}
            lng={qa.longitude as number}
            label={qa.questionText}
            showPopup={false}
          />
        </div>
      )}

      {/* Files */}
      {hasFiles && !isMultiMeasurement && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          {qa.files?.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      )}

      {/* Multi-measurement overlay */}
      {isMultiMeasurement && (
        <MeasurementOverlay qa={qa} />
      )}

      {/* No answer */}
      {!displayValue && !hasFiles && !hasGeo && !hasMeasurements && (
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
  section: SectionAnswers;
  index: number;
}) {
  const questionAnswers = section.questionAnswers ?? [];
  const [title, subtitle] = (section.sectionName ?? '').includes(' - ')
    ? (section.sectionName ?? '').split(' - ')
    : [section.sectionName ?? `Section ${index + 1}`, null];
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: expanded ? 18 : 0,
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
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
        <div style={{ flex: 1, minWidth: 0 }}>
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
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, flexShrink: 0 }}>
          {questionAnswers.length} answer{questionAnswers.length !== 1 ? 's' : ''}
        </span>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 22,
            color: '#64748b',
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
          }}
        >
          keyboard_arrow_down
        </span>
      </button>

      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingLeft: 38,
          }}
        >
          {questionAnswers.map((qa) => (
            <QuestionCard key={qa.questionId} qa={qa} />
          ))}
          {questionAnswers.length === 0 && (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              No answers in this section.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
