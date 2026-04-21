import { useState, useEffect, useRef } from 'react';
import {
  Ms,
  TYPE_CFG,
  QUESTION_TYPES,
  ACCEPTED_FILE_TYPES,
  FILE_TYPE_CFG,
  inp,
} from './shared';

// ── Accepted-file-type picker (shared between main q and file follow-ups) ────
function FileTypePicker({
  value,
  onChange,
  error,
}: {
  value: string | null;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
      }}
    >
      {ACCEPTED_FILE_TYPES.map((ft) => {
        const cfg = FILE_TYPE_CFG[ft];
        const active = value === ft;
        return (
          <button
            key={ft}
            type="button"
            onClick={() => onChange(ft)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '7px 8px',
              borderRadius: 8,
              border: `1.5px solid ${
                active ? cfg.color : error ? '#ef4444' : '#e2e8f0'
              }`,
              background: active ? `${cfg.color}10` : '#fff',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              color: active ? cfg.color : '#64748b',
            }}
          >
            <Ms
              icon={cfg.icon}
              style={{
                fontSize: 14,
                color: active ? cfg.color : '#94a3b8',
              }}
            />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};
const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  padding: 28,
  width: '100%',
  maxWidth: 540,
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  maxHeight: '90vh',
  overflowY: 'auto',
};

function uid() {
  return crypto.randomUUID();
}

// ── Single option row ──────────────────────────────────────────────────────────
function OptionRow({
  option,
  index,
  error,
  dragging,
  over,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onUpdate,
  onRemove,
}: {
  option: any;
  index: number;
  error: boolean;
  dragging: number | null;
  over: number | null;
  onDragStart: (i: number) => void;
  onDragEnter: (i: number) => void;
  onDragEnd: () => void;
  onUpdate: (
    id: string,
    patch: Partial<{
      text: string;
      followUpText: string;
      followUpType: string;
      followUpAcceptedFileType: string | null;
      hasFollowUp: boolean;
    }>,
  ) => void;
  onRemove: (id: string) => void;
}) {
  const followUpTypes = ['text', 'file', 'geolocation'] as const;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      style={{
        opacity: dragging === index ? 0.4 : 1,
        borderRadius: 10,
        border:
          over === index && dragging !== index
            ? '2px dashed #0f172a'
            : '1px solid #e2e8f0',
        background:
          over === index && dragging !== index
            ? '#f8fafc'
            : option.hasFollowUp
              ? '#f0fdf4'
              : '#fafafa',
        transition: 'border .1s, background .1s',
        padding: '10px 12px',
        marginBottom: 6,
      }}
    >
      {/* Option text row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Ms
            icon="drag_indicator"
            style={{ fontSize: 18, color: '#94a3b8' }}
          />
        </span>
        <input
          value={option.text}
          onChange={(e) => onUpdate(option.id, { text: e.target.value })}
          placeholder={`Option ${index + 1}`}
          style={{ ...inp(error), flex: 1 }}
        />
        {/* Follow-up toggle */}
        <button
          onClick={() =>
            onUpdate(option.id, { hasFollowUp: !option.hasFollowUp })
          }
          title={
            option.hasFollowUp ? 'Remove follow-up' : 'Add follow-up question'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            borderRadius: 6,
            border: `1px solid ${option.hasFollowUp ? '#22c55e' : '#e2e8f0'}`,
            background: option.hasFollowUp ? '#dcfce7' : '#fff',
            color: option.hasFollowUp ? '#16a34a' : '#94a3b8',
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all .15s',
          }}
        >
          <Ms
            icon="subdirectory_arrow_right"
            style={{
              fontSize: 14,
              color: option.hasFollowUp ? '#16a34a' : '#94a3b8',
            }}
          />
          {option.hasFollowUp ? 'Follow-up on' : 'Follow-up'}
        </button>
        <button
          onClick={() => onRemove(option.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Ms
            icon="remove_circle_outline"
            style={{ fontSize: 16, color: '#ef4444' }}
          />
        </button>
      </div>

      {/* Follow-up question definition */}
      {option.hasFollowUp && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px dashed #bbf7d0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ms
              icon="subdirectory_arrow_right"
              style={{ fontSize: 13, color: '#16a34a' }}
            />
            Follow-up question when &ldquo;
            {option.text || `Option ${index + 1}`}&rdquo; is selected
          </label>
          <input
            value={option.followUpText ?? ''}
            onChange={(e) =>
              onUpdate(option.id, { followUpText: e.target.value })
            }
            placeholder="e.g. Please provide more details…"
            style={{
              ...inp(
                !option.followUpText?.trim() && option.hasFollowUp
                  ? false
                  : false,
              ),
              fontSize: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {followUpTypes.map((t) => {
              const cfg = TYPE_CFG[t];
              const active = (option.followUpType ?? 'text') === t;
              return (
                <button
                  key={t}
                  onClick={() =>
                    onUpdate(option.id, {
                      followUpType: t,
                      // Clear accepted file type when leaving 'file'
                      ...(t !== 'file'
                        ? { followUpAcceptedFileType: null }
                        : {}),
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    borderRadius: 7,
                    border: `1.5px solid ${active ? cfg.color : '#e2e8f0'}`,
                    background: active ? `${cfg.color}10` : '#fff',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    color: active ? cfg.color : '#64748b',
                  }}
                >
                  <Ms
                    icon={cfg.icon}
                    style={{
                      fontSize: 14,
                      color: active ? cfg.color : '#94a3b8',
                    }}
                  />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {option.followUpType === 'file' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}
              >
                Accepted file type *
              </label>
              <FileTypePicker
                value={option.followUpAcceptedFileType ?? null}
                onChange={(v) =>
                  onUpdate(option.id, { followUpAcceptedFileType: v })
                }
                error={error && !option.followUpAcceptedFileType}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Options list ───────────────────────────────────────────────────────────────
function OptionsList({
  options,
  errors,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
}: {
  options: any[];
  errors: Record<string, boolean>;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: any) => void;
  onReorder: (opts: any[]) => void;
}) {
  const dragIndex = useRef<number | null>(null);
  const overIndex = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const handleDragStart = (i: number) => {
    dragIndex.current = i;
    setDragging(i);
  };
  const handleDragEnter = (i: number) => {
    overIndex.current = i;
    setOver(i);
  };
  const handleDragEnd = () => {
    const from = dragIndex.current;
    const to = overIndex.current;
    if (from !== null && to !== null && from !== to) {
      const reordered = [...options];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      onReorder(reordered);
    }
    dragIndex.current = null;
    overIndex.current = null;
    setDragging(null);
    setOver(null);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          Options * (min 2)
        </label>
        <button
          onClick={onAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          <Ms icon="add" style={{ fontSize: 14 }} />
          Add option
        </button>
      </div>
      {errors.options && (
        <p style={{ fontSize: 11, color: '#ef4444', margin: '0 0 8px' }}>
          At least 2 options required
        </p>
      )}

      <div>
        {options.map((o, i) => (
          <OptionRow
            key={o.id}
            option={o}
            index={i}
            error={!!errors[`opt-${i}`]}
            dragging={dragging}
            over={over}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
        {options.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: '#94a3b8',
              textAlign: 'center',
              margin: '8px 0',
            }}
          >
            No options yet — add some above
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
// onSave now receives { question, followUps } where followUps is an array of
// follow-up questions to be inserted right after the main question.
export default function QuestionModal({
  question,
  onSave,
  onClose,
}: {
  question: any | null;
  onSave: (payload: { question: any; followUps: any[] }) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(question?.text ?? '');
  const [type, setType] = useState(question?.type ?? 'text');
  const [acceptedFileType, setAcceptedFileType] = useState<string | null>(
    question?.acceptedFileType ?? null,
  );
  const [options, setOptions] = useState<any[]>(() => {
    if (!question?.options) return [];
    // Hydrate existing follow-up data from the section if present
    return question.options.map((o: any) => ({
      ...o,
      hasFollowUp: !!o.followUpQuestionId,
      followUpText: o._followUpText ?? '',
      followUpType: o._followUpType ?? 'text',
      followUpAcceptedFileType: o._followUpAcceptedFileType ?? null,
    }));
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setText(question?.text ?? '');
    setType(question?.type ?? 'text');
    setAcceptedFileType(question?.acceptedFileType ?? null);
    setOptions(
      question?.options
        ? question.options.map((o: any) => ({
            ...o,
            hasFollowUp: !!o.followUpQuestionId,
            followUpText: o._followUpText ?? '',
            followUpType: o._followUpType ?? 'text',
            followUpAcceptedFileType: o._followUpAcceptedFileType ?? null,
          }))
        : [],
    );
    setErrors({});
  }, [question]);

  // Reset acceptedFileType whenever the main type changes away from file
  const handleSetType = (t: string) => {
    setType(t);
    if (t !== 'file') setAcceptedFileType(null);
  };

  const addOption = () =>
    setOptions((o) => [
      ...o,
      {
        id: uid(),
        text: '',
        followUpQuestionId: null,
        hasFollowUp: false,
        followUpText: '',
        followUpType: 'text',
        followUpAcceptedFileType: null,
      },
    ]);

  const removeOption = (id: string) =>
    setOptions((o) => o.filter((x) => x.id !== id));

  const updateOption = (id: string, patch: any) =>
    setOptions((o) => o.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!text.trim()) e.text = true;
    if (type === 'file' && !acceptedFileType) e.acceptedFileType = true;
    if (
      (type === 'multi_select' || type === 'single_select') &&
      options.length < 2
    )
      e.options = true;
    if (type === 'multi_select' || type === 'single_select') {
      options.forEach((o, i) => {
        if (!o.text.trim()) e[`opt-${i}`] = true;
        if (
          o.hasFollowUp &&
          o.followUpType === 'file' &&
          !o.followUpAcceptedFileType
        ) {
          e[`opt-${i}`] = true;
        }
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const isSelect = type === 'multi_select' || type === 'single_select';

    // Build follow-up questions array
    const followUps: any[] = [];
    const builtOptions = isSelect
      ? options.map((o) => {
          if (!o.hasFollowUp)
            return { id: o.id, text: o.text, followUpQuestionId: null };
          const fqId = o.followUpQuestionId ?? uid();
          const fuType = o.followUpType ?? 'text';
          followUps.push({
            id: fqId,
            text:
              o.followUpText?.trim() ||
              `Please provide more details about "${o.text}"`,
            type: fuType,
            order: 999,
            isFollowUp: true,
            options: null,
            acceptedFileType:
              fuType === 'file' ? (o.followUpAcceptedFileType ?? null) : null,
          });
          return { id: o.id, text: o.text, followUpQuestionId: fqId };
        })
      : null;

    const q = {
      id: question?.id ?? uid(),
      text: text.trim(),
      type,
      order: question?.order ?? 999,
      isFollowUp: question?.isFollowUp ?? false,
      options: builtOptions,
      acceptedFileType: type === 'file' ? acceptedFileType : null,
    };

    onSave({ question: q, followUps });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            {question ? 'Edit Question' : 'New Question'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Ms icon="close" style={{ fontSize: 20, color: '#94a3b8' }} />
          </button>
        </div>

        {/* Question text */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              display: 'block',
              marginBottom: 5,
            }}
          >
            Question Text *
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. What type of flooring is present?"
            rows={2}
            style={{ ...inp(errors.text), resize: 'vertical' }}
          />
          {errors.text && (
            <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>
              Required
            </p>
          )}
        </div>

        {/* Type */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#374151',
              display: 'block',
              marginBottom: 5,
            }}
          >
            Answer Type *
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {QUESTION_TYPES.map((t) => {
              const cfg = TYPE_CFG[t];
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => handleSetType(t)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? cfg.color : '#e2e8f0'}`,
                    background: active ? `${cfg.color}10` : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <Ms
                    icon={cfg.icon}
                    style={{
                      fontSize: 20,
                      color: active ? cfg.color : '#94a3b8',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: active ? cfg.color : '#64748b',
                    }}
                  >
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accepted file type — only for file questions */}
        {type === 'file' && (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#374151',
                display: 'block',
                marginBottom: 5,
              }}
            >
              Accepted File Type *
            </label>
            <FileTypePicker
              value={acceptedFileType}
              onChange={setAcceptedFileType}
              error={!!errors.acceptedFileType}
            />
            {errors.acceptedFileType && (
              <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>
                Required
              </p>
            )}
          </div>
        )}

        {/* Options */}
        {(type === 'multi_select' || type === 'single_select') && (
          <>
            <OptionsList
              options={options}
              errors={errors}
              onAdd={addOption}
              onRemove={removeOption}
              onUpdate={updateOption}
              onReorder={setOptions}
            />
            {options.some((o) => o.hasFollowUp) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  marginBottom: 16,
                  fontSize: 12,
                  color: '#15803d',
                }}
              >
                <Ms icon="info" style={{ fontSize: 15, color: '#16a34a' }} />
                Follow-up questions will be added automatically right after this
                question.
              </div>
            )}
          </>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 24,
          }}
        >
          <button
            onClick={onClose}
            style={{
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#374151',
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              borderRadius: 8,
              border: 'none',
              background: '#0f172a',
              color: '#fff',
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {question ? 'Save changes' : 'Add question'}
          </button>
        </div>
      </div>
    </div>
  );
}
