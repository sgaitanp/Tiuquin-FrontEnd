'use client';

import { useEffect, useState } from 'react';
import SurveyForm from '../form/SurveyForm';
import type { SiteSurvey } from '@/types/project';
import type { Template } from '@/types/template';
import type { QuestionValue } from '@/types/response';

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

const MIN_W = 420;
const MIN_H = 320;

/**
 * Full-screen dimmed modal that hosts `SurveyForm` for a worker to
 * fill out. The inner panel is user-resizable via the bottom-right
 * handle; the starting size is clamped to a fraction of the viewport
 * so small screens don't render it cropped.
 */
export default function FillOutSurveyModal({
  survey,
  template,
  onResponsesChange,
  onSubmitted,
  onClose,
}: {
  survey: SiteSurvey;
  template: Template;
  onResponsesChange?: (r: Record<string, QuestionValue>) => void;
  onSubmitted: (s: SiteSurvey) => void;
  onClose: () => void;
}) {
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 720, h: 700 });

  // Clamp the initial size to the viewport once, on mount.
  useEffect(() => {
    setSize({
      w: Math.min(720, Math.floor(window.innerWidth * 0.95)),
      h: Math.min(700, Math.floor(window.innerHeight * 0.85)),
    });
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.w;
    const startH = size.h;
    const onMove = (ev: MouseEvent) => {
      const maxW = window.innerWidth - 20;
      const maxH = window.innerHeight - 20;
      const w = Math.min(maxW, Math.max(MIN_W, startW + (ev.clientX - startX)));
      const h = Math.min(maxH, Math.max(MIN_H, startH + (ev.clientY - startY)));
      setSize({ w, h });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 14,
          width: size.w,
          height: size.h,
          minWidth: MIN_W,
          minHeight: MIN_H,
          maxWidth: '98vw',
          maxHeight: '98vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              {survey.name}
            </h2>
            <p
              style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}
            >
              {template.name} · v{template.version}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Ms icon="close" style={{ fontSize: 20, color: '#64748b' }} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SurveyForm
            survey={survey}
            template={template}
            onResponsesChange={onResponsesChange}
            onSubmitted={onSubmitted}
          />
        </div>
        {/* Resize handle — drag from bottom-right to resize the modal */}
        <div
          onMouseDown={startResize}
          title="Drag to resize"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 18,
            height: 18,
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: 2,
            color: '#94a3b8',
            background:
              'linear-gradient(135deg, transparent 0 55%, #cbd5e1 55% 60%, transparent 60% 70%, #cbd5e1 70% 75%, transparent 75% 85%, #cbd5e1 85% 90%, transparent 90%)',
            borderBottomRightRadius: 14,
          }}
        />
      </div>
    </div>
  );
}
