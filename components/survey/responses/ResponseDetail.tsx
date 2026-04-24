import { Ms, fmtDate, fmtTime } from './shared';
import ResponseSection from './ResponseSection';
import type { ResponseDetail as ResponseDetailData } from '@/types/response';

export default function ResponseDetail({ detail }: { detail: ResponseDetailData }) {
  const sections = detail.sections ?? [];
  const totalAnswers = sections.reduce(
    (acc, sec) => acc + (sec.questionAnswers?.length ?? 0),
    0,
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Sticky header */}
      <div
        style={{
          padding: '24px 32px 20px',
          borderBottom: '1px solid #f1f5f9',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: '#94a3b8',
                margin: '0 0 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {detail.siteSurveyName}
              <span
                style={{
                  background: '#f1f5f9',
                  borderRadius: 5,
                  padding: '1px 6px',
                  fontSize: 10,
                  color: '#64748b',
                  fontWeight: 500,
                }}
              >
                <span style={{ fontWeight: 500 }}>Response ID:</span>{' '}
                <span style={{ fontFamily: 'monospace' }}>{detail.responseId}</span>
              </span>
            </p>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 4px',
              }}
            >
              {detail.templateName}
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#64748b',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Ms
                  icon="engineering"
                  style={{ fontSize: 14, color: '#94a3b8' }}
                />
                {detail.workerName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Ms
                  icon="schedule"
                  style={{ fontSize: 14, color: '#94a3b8' }}
                />
                {fmtDate(detail.submittedAt)} at {fmtTime(detail.submittedAt)}
              </span>
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: 'quiz', label: 'Answers', value: totalAnswers },
              {
                icon: 'view_agenda',
                label: 'Sections',
                value: sections.length,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 18px',
                }}
              >
                <Ms
                  icon={s.icon}
                  style={{
                    fontSize: 20,
                    color: '#94a3b8',
                    display: 'block',
                    margin: '0 auto 4px',
                  }}
                />
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  {s.value}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div
        style={{
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          maxWidth: 820,
        }}
      >
        {sections.map((sec, i) => (
          <ResponseSection key={sec.sectionId ?? i} section={sec} index={i} />
        ))}
      </div>
    </div>
  );
}
