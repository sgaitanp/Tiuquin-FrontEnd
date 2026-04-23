import { Ms } from './shared';

/**
 * Numbered step indicator used by the multi-step AddSurveyWizard.
 * Defaults to a two-step flow if `steps` isn't provided.
 */
export default function StepIndicator({
  step,
  steps: stepLabels,
}: {
  step: number;
  steps?: string[];
}) {
  const steps = stepLabels ?? ['Work Order', 'Survey Details'];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 20,
      }}
    >
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div
            key={n}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: i < steps.length - 1 ? 1 : undefined,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: done ? '#22c55e' : active ? '#0f172a' : '#f1f5f9',
                  color: done || active ? '#fff' : '#94a3b8',
                  transition: 'all .2s',
                }}
              >
                {done ? (
                  <Ms icon="check" style={{ fontSize: 14, color: '#fff' }} />
                ) : (
                  n
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: active ? '#0f172a' : done ? '#22c55e' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: done ? '#22c55e' : '#e2e8f0',
                  margin: '0 10px',
                  transition: 'background .2s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
