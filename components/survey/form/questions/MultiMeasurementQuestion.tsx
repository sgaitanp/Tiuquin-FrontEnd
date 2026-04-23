import { useEffect, useRef, useState } from 'react';
import type { Question } from '@/types/template';
import type { Measurement, MultiMeasurementValue } from '@/types/response';

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

const emptyValue = (): MultiMeasurementValue => ({
  referenceX: null,
  referenceY: null,
  measurements: [],
  file: null,
});

export default function MultiMeasurementQuestion({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: MultiMeasurementValue | null | undefined;
  onChange: (v: MultiMeasurementValue) => void;
}) {
  const requiredReadings: number = Math.max(1, question?.requiredReadings ?? 1);
  const referenceLabel: string = question?.referencePointLabel || 'Reference';
  const unit: string = question?.measurementUnit || '';

  const current: MultiMeasurementValue = value ?? emptyValue();
  const hasReference =
    typeof current.referenceX === 'number' &&
    typeof current.referenceY === 'number';

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [rendered, setRendered] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [pendingValue, setPendingValue] = useState('');
  const [zoom, setZoom] = useState(1);

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.25;

  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Build an object URL whenever the picked file changes
  useEffect(() => {
    if (!current.file) {
      setImgSrc(null);
      return;
    }
    const url = URL.createObjectURL(current.file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [current.file]);

  // Watch the image itself — its clientWidth changes both on window resize and
  // on zoom, so the marker positions stay correct.
  useEffect(() => {
    if (!imgRef.current) return;
    const el = imgRef.current;
    const update = () => {
      setRendered({ w: el.clientWidth, h: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [imgSrc]);

  const scaleX = natural && rendered ? rendered.w / natural.w : 1;
  const scaleY = natural && rendered ? rendered.h / natural.h : 1;

  const handlePickFile = (f: File) => {
    // Picking a new image invalidates any markers already placed.
    onChange({ ...emptyValue(), file: f });
    setPending(null);
    setPendingValue('');
    setNatural(null);
    setZoom(1);
  };

  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  const zoomIn = () => setZoom((z) => clampZoom(Math.round((z + ZOOM_STEP) * 100) / 100));
  const zoomOut = () => setZoom((z) => clampZoom(Math.round((z - ZOOM_STEP) * 100) / 100));
  const resetZoom = () => setZoom(1);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!natural || !rendered || !imgRef.current || pending) return;
    const rect = imgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    if (sx < 0 || sy < 0 || sx > rect.width || sy > rect.height) return;
    const nx = sx / scaleX;
    const ny = sy / scaleY;

    if (!hasReference) {
      onChange({ ...current, referenceX: nx, referenceY: ny });
      return;
    }
    setPending({ x: nx, y: ny });
    setPendingValue('');
  };

  const commitPending = () => {
    if (!pending) return;
    const num = parseFloat(pendingValue);
    if (!Number.isFinite(num)) return;
    const next: Measurement = {
      x: pending.x,
      y: pending.y,
      value: num,
      order: current.measurements.length,
    };
    onChange({
      ...current,
      measurements: [...current.measurements, next],
    });
    setPending(null);
    setPendingValue('');
  };

  const cancelPending = () => {
    setPending(null);
    setPendingValue('');
  };

  const resetMarkers = () => {
    if (!confirm('Reset the reference marker? All measurements will also be cleared.')) return;
    onChange({ ...current, referenceX: null, referenceY: null, measurements: [] });
    cancelPending();
  };

  const replaceImage = () => {
    if (
      (hasReference || current.measurements.length > 0) &&
      !confirm('Replacing the image will clear the reference marker and all measurements. Continue?')
    ) {
      return;
    }
    fileInputRef.current?.click();
  };

  const undoMeasurement = () => {
    if (current.measurements.length === 0) return;
    onChange({
      ...current,
      measurements: current.measurements.slice(0, -1),
    });
  };

  // ── No image picked yet: show picker ────────────────────────────────────────
  if (!current.file) {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePickFile(f);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            borderRadius: 10,
            border: '1.5px dashed #cbd5e1',
            background: '#f8fafc',
            padding: '28px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            color: '#475569',
          }}
        >
          <Ms icon="image" style={{ fontSize: 28, color: '#94a3b8' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Upload a floor plan image</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            PNG, JPG — you'll mark the {referenceLabel} and {requiredReadings}+
            measurements on it.
          </span>
        </button>
      </div>
    );
  }

  const remaining = Math.max(0, requiredReadings - current.measurements.length);
  const mode: 'reference' | 'measurement' = hasReference ? 'measurement' : 'reference';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePickFile(f);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          padding: '8px 12px',
          borderRadius: 8,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ms
            icon={mode === 'reference' ? 'location_searching' : 'add_location_alt'}
            style={{ fontSize: 16, color: '#db2777' }}
          />
          <span style={{ color: '#0f172a', fontWeight: 600 }}>
            {mode === 'reference'
              ? `Tap the image to place the ${referenceLabel} marker`
              : `Tap to add a measurement (${current.measurements.length} of ${requiredReadings})`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={replaceImage}
            style={{
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#fff',
              padding: '4px 8px',
              fontSize: 11,
              cursor: 'pointer',
              color: '#374151',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ms icon="swap_horiz" style={{ fontSize: 13 }} />
            Replace image
          </button>
          {(hasReference || current.measurements.length > 0) && (
            <button
              type="button"
              onClick={resetMarkers}
              style={{
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: '#fff',
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ms icon="restart_alt" style={{ fontSize: 13 }} />
              Reset
            </button>
          )}
          {current.measurements.length > 0 && (
            <button
              type="button"
              onClick={undoMeasurement}
              style={{
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                background: '#fff',
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
                color: '#374151',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ms icon="undo" style={{ fontSize: 13 }} />
              Remove last
            </button>
          )}
        </div>
      </div>

      {/* Image + overlays */}
      <div
        style={{
          position: 'relative',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#f8fafc',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            overflow: 'auto',
            maxHeight: '70vh',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: `${zoom * 100}%`,
              cursor: pending ? 'default' : 'crosshair',
            }}
            onClick={handleImageClick}
          >
            {imgSrc && (
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
                style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
              />
            )}

            {hasReference && natural && rendered && (
              <Marker
                x={(current.referenceX as number) * scaleX}
                y={(current.referenceY as number) * scaleY}
                color="#db2777"
                icon="my_location"
                label={referenceLabel}
              />
            )}
            {natural &&
              rendered &&
              current.measurements.map((m) => (
                <Marker
                  key={`${m.order}-${m.x}-${m.y}`}
                  x={m.x * scaleX}
                  y={m.y * scaleY}
                  color="#0ea5e9"
                  label={`${m.value}${unit ? ` ${unit}` : ''}`}
                />
              ))}
            {pending && natural && rendered && (
              <Marker x={pending.x * scaleX} y={pending.y * scaleY} color="#f59e0b" pulse />
            )}
          </div>
        </div>

        {/* Zoom control — stays pinned over the scroll area */}
        <ZoomControl
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetZoom}
          minZoom={ZOOM_MIN}
          maxZoom={ZOOM_MAX}
        />
      </div>

      {/* Numeric entry prompt */}
      {pending && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            padding: '10px 12px',
            borderRadius: 8,
            background: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        >
          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            Reading #{current.measurements.length + 1}:
          </span>
          <input
            type="number"
            step="any"
            autoFocus
            value={pendingValue}
            onChange={(e) => setPendingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitPending();
              if (e.key === 'Escape') cancelPending();
            }}
            placeholder={`value${unit ? ` (${unit})` : ''}`}
            style={{
              flex: 1,
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              padding: '6px 10px',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={commitPending}
            disabled={!Number.isFinite(parseFloat(pendingValue))}
            style={{
              borderRadius: 6,
              border: 'none',
              background: Number.isFinite(parseFloat(pendingValue)) ? '#0f172a' : '#cbd5e1',
              color: '#fff',
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: Number.isFinite(parseFloat(pendingValue)) ? 'pointer' : 'not-allowed',
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancelPending}
            style={{
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#374151',
              padding: '6px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
        {remaining > 0
          ? `${remaining} more reading${remaining === 1 ? '' : 's'} required.`
          : 'Minimum readings met — additional readings are allowed.'}
      </p>
    </div>
  );
}

function ZoomControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  minZoom,
  maxZoom,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  minZoom: number;
  maxZoom: number;
}) {
  const pct = Math.round(zoom * 100);
  const btn: React.CSSProperties = {
    width: 28,
    height: 28,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: '#0f172a',
    padding: 0,
  };
  const btnDisabled: React.CSSProperties = {
    ...btn,
    color: '#cbd5e1',
    cursor: 'not-allowed',
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 8,
        bottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '3px 6px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(4px)',
        zIndex: 2,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        aria-label="Zoom out"
        style={zoom <= minZoom ? btnDisabled : btn}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          remove
        </span>
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset zoom"
        title="Reset zoom"
        style={{
          minWidth: 42,
          height: 24,
          padding: '0 6px',
          borderRadius: 5,
          border: '1px solid #e2e8f0',
          background: '#fff',
          fontSize: 11,
          fontWeight: 600,
          color: '#0f172a',
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pct}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        aria-label="Zoom in"
        style={zoom >= maxZoom ? btnDisabled : btn}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          add
        </span>
      </button>
    </div>
  );
}

function Marker({
  x,
  y,
  color,
  icon,
  label,
  pulse,
}: {
  x: number;
  y: number;
  color: string;
  icon?: string;
  label?: string;
  pulse?: boolean;
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
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: color,
          border: '2px solid #fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: pulse ? 'pulse 1.2s ease-in-out infinite' : undefined,
        }}
      >
        {icon && (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 12, color: '#fff', lineHeight: 1 }}
          >
            {icon}
          </span>
        )}
      </div>
      {label && (
        <div
          style={{
            position: 'absolute',
            top: 20,
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
