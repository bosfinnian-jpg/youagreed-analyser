'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import DataProductSummary from './DataProductSummary';
import EmotionalTimelineChart from './EmotionalTimelineChart';
import { ConfidenceLimitations, getActiveEmptyStates, EmptyStateNotice } from './EmptyStatesAndLimitations';
import ClosureSection from './ClosureSection';

function useCounter(target: number, isInView: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView || target === 0) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setCount(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target, duration]);
  return count;
}

function OverviewHeader({ score, stats, results }: { score: number; stats: any; results: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useCounter(score, isInView);
  const messages = results?.totalUserMessages || stats?.userMessages || 0;
  const timeSpan = stats?.timeSpan || (results?.timespan?.days ? `${results.timespan.days} days` : null);

  const scoreLabel = score >= 70 ? 'Severe exposure' : score >= 40 ? 'Moderate exposure' : 'Limited exposure';
  const scoreColor = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;
  const primaryName = results?.findings?.personalInfo?.names?.[0]?.name;
  const headline = primaryName ? `${primaryName}, this is your data profile.` : 'This is your data profile.';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9 }}
      style={{
        padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.15, duration: 0.6 }}
        style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
        }}
      >
        01 / Overview
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.8 }}
        style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem', marginBottom: '2rem' }}
      >
        <span style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(4rem, 12vw, 8rem)',
          fontWeight: 400, color: scoreColor,
          letterSpacing: '-0.04em', lineHeight: 1,
        }}>
          {count}
        </span>
        <div>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block',
          }}>out of 100</span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em',
            color: scoreColor, textTransform: 'uppercase', display: 'block', marginTop: '3px',
          }}>{scoreLabel}</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.55, duration: 0.8 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.025em', lineHeight: 1.2,
          maxWidth: 700, marginBottom: '1.25rem',
        }}
      >
        {headline}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.85, duration: 0.8 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
          color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560,
        }}
      >
        Every conversation you have had with an AI system leaves a trace — not just in logs, but embedded in the model itself. This report maps what has been extracted from you, and what it is worth to the people who hold it.
      </motion.p>

      {messages > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="stat-strip"
          style={{
            display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)',
            marginTop: 'clamp(2.5rem, 5vw, 3.5rem)',
            paddingTop: 'clamp(1.5rem, 3vw, 2rem)',
            borderTop: `1px solid ${PALETTE.border}`,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Messages analysed', value: messages.toLocaleString() },
            timeSpan ? { label: 'Time span', value: timeSpan } : null,
            stats?.avgMessageLength ? { label: 'Avg message length', value: `${stats.avgMessageLength} chars` } : null,
          ].filter(Boolean).map((stat: any, i) => (
            <div key={i}>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
                color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.35rem',
              }}>{stat.label}</p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1.4rem, 2.8vw, 2rem)',
                color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1,
              }}>{stat.value}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function MostExposingMoment({ results }: { results: any }) {
  const moment = results?.juiciestMoments?.[0];
  if (!moment) return null;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const date = moment.timestamp
    ? new Date(moment.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9 }}
      style={{
        borderLeft: `3px solid ${PALETTE.red}`,
        paddingLeft: 'clamp(1.5rem, 4vw, 3rem)',
        paddingTop: '0.5rem',
        paddingBottom: '0.5rem',
      }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.25rem',
      }}>
        Most exposing moment
      </p>
      <blockquote style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)',
        color: PALETTE.ink,
        lineHeight: 1.75,
        marginBottom: '1.25rem',
        maxWidth: 680,
      }}>
        &ldquo;{moment.excerpt?.substring(0, 300)}{moment.excerpt?.length > 300 ? '\u2026' : ''}&rdquo;
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {date && (
          <p style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
          }}>{date}</p>
        )}
        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
          color: PALETTE.redMuted, textTransform: 'uppercase',
        }}>Retained in model weights</p>
      </div>
    </motion.div>
  );
}

function KeyFindings({ results, setPage }: { results: any; setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const emptyStates = results ? getActiveEmptyStates(results) : [];

  const topStats = [
    results?.findings?.sensitiveTopics?.length > 0 && {
      number: results.findings.sensitiveTopics.length,
      label: 'sensitive disclosures',
      color: PALETTE.red,
    },
    results?.findings?.personalInfo?.names?.length > 0 && {
      number: results.findings.personalInfo.names.length,
      label: 'people identified',
      color: PALETTE.ink,
    },
    results?.lifeEvents?.length > 0 && {
      number: results.lifeEvents.length,
      label: 'life events detected',
      color: PALETTE.ink,
    },
  ].filter(Boolean) as { number: number; label: string; color: string }[];

  const rows = [
    results?.findings?.personalInfo?.names?.length > 0 && {
      label: 'People identified',
      value: `${results.findings.personalInfo.names.length} individuals`,
      detail: results.findings.personalInfo.names.slice(0, 3).map((n: any) => n.name).join(', '),
      page: 'profile' as DashPage,
    },
    results?.findings?.personalInfo?.locations?.length > 0 && {
      label: 'Locations mapped',
      value: `${results.findings.personalInfo.locations.length} places`,
      detail: results.findings.personalInfo.locations.slice(0, 2).map((l: any) => l.location).join(', '),
      page: 'profile' as DashPage,
    },
    results?.findings?.sensitiveTopics?.length > 0 && {
      label: 'Sensitive disclosures',
      value: `${results.findings.sensitiveTopics.length} instances`,
      detail: [...new Set(results.findings.sensitiveTopics.slice(0, 3).map((t: any) => t.category?.replace('_', ' ')))].join(', '),
      page: 'profile' as DashPage,
    },
    results?.lifeEvents?.length > 0 && {
      label: 'Life events detected',
      value: `${results.lifeEvents.length} event${results.lifeEvents.length > 1 ? 's' : ''}`,
      detail: results.lifeEvents.slice(0, 2).map((e: any) => e.label).join(', '),
      page: 'risk' as DashPage,
    },
    results?.findings?.repetitiveThemes?.length > 0 && {
      label: 'Recurring themes',
      value: `${results.findings.repetitiveThemes.length} patterns`,
      detail: results.findings.repetitiveThemes.slice(0, 3).map((t: any) => t.theme).join(', '),
      page: 'profile' as DashPage,
    },
  ].filter(Boolean) as any[];

  return (
    <div ref={ref}>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
      }}>
        Key findings
      </p>

      {rows.length === 0 ? (
        emptyStates.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {emptyStates.slice(0, 3).map(state => (
              <EmptyStateNotice key={state.key} state={state} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted, lineHeight: 1.7 }}>
            Insufficient data to generate findings.
          </p>
        )
      ) : (
        <>
          {topStats.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.1 }}
              style={{
                display: 'flex', gap: 'clamp(2rem, 5vw, 3.5rem)',
                flexWrap: 'wrap',
                paddingBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
                marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
                borderBottom: `1px solid ${PALETTE.border}`,
              }}
            >
              {topStats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 + i * 0.07 }}
                >
                  <p style={{
                    fontFamily: TYPE.serif,
                    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                    color: s.color,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    marginBottom: '0.3rem',
                  }}>{s.number}</p>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
                    color: PALETTE.inkFaint, textTransform: 'uppercase',
                  }}>{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((row, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.07 }}
                onClick={() => setPage(row.page)}
                className="findings-row"
                style={{
                  background: 'none', border: 'none',
                  borderBottom: `1px solid ${PALETTE.border}`,
                  padding: '1.2rem 0',
                  cursor: 'pointer', textAlign: 'left',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center', gap: '2rem',
                  transition: 'padding-left 0.15s',
                  width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.paddingLeft = '0.5rem'; }}
                onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
              >
                <div>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
                    color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.35rem',
                  }}>{row.label}</p>
                  <p style={{
                    fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
                    color: PALETTE.ink, letterSpacing: '-0.01em', marginBottom: '0.2rem',
                  }}>{row.value}</p>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '12px', color: PALETTE.inkMuted,
                    textTransform: 'capitalize', lineHeight: 1.5,
                  }}>{row.detail}</p>
                </div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '14px', color: PALETTE.inkFaint, flexShrink: 0 }}>→</span>
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ActiveRisks({ results, score, setPage }: { results: any; score: number; setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const risks = [
    { label: 'Insurance profiling', active: (results?.findings?.sensitiveTopics?.length || 0) > 0 },
    { label: 'Employment screening', active: (results?.totalUserMessages || results?.stats?.userMessages || 0) > 300 },
    { label: 'Behavioural targeting', active: (results?.nighttimeRatio || 0) > 0.05 || (results?.findings?.vulnerabilityPatterns?.length || 0) > 0 },
    { label: 'Data breach exposure', active: score > 40 },
  ];

  const activeCount = risks.filter(r => r.active).length;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
      }}>
        Risk categories
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: '2rem' }}
      >
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          color: activeCount >= 3 ? PALETTE.red : activeCount >= 1 ? PALETTE.amber : PALETTE.green,
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.3rem',
        }}>{activeCount}</p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>active risk{activeCount !== 1 ? 's' : ''} of {risks.length}</p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2.5rem' }}>
        {risks.map((risk, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.07 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}
          >
            <div style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: risk.active ? (activeCount >= 3 ? PALETTE.red : PALETTE.amber) : 'transparent',
              border: risk.active ? 'none' : `1px solid rgba(26,24,20,0.22)`,
            }} />
            <span style={{
              fontFamily: TYPE.mono, fontSize: '12px', letterSpacing: '0.1em',
              color: risk.active ? PALETTE.ink : PALETTE.inkFaint,
              textTransform: 'uppercase',
            }}>
              {risk.label}
            </span>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => setPage('risk')}
        style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
          color: PALETTE.ink, textTransform: 'uppercase',
          background: 'none', border: `1px solid ${PALETTE.border}`,
          padding: '0.65rem 1.1rem', cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
      >
        Full risk assessment →
      </button>
    </motion.div>
  );
}

function SectionRule({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1.5rem',
      marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
    }}>
      <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>{label}</p>
    </div>
  );
}

function BottomCTAs({ setPage }: { setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      style={{
        display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)',
        flexWrap: 'wrap',
        paddingTop: 'clamp(2rem, 5vw, 3.5rem)',
        borderTop: `1px solid ${PALETTE.border}`,
      }}
    >
      <button
        onClick={() => setPage('profile')}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          letterSpacing: '-0.01em',
          color: PALETTE.ink,
          background: 'none',
          border: `1px solid ${PALETTE.border}`,
          padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(1.5rem, 3vw, 2.5rem)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          textAlign: 'left',
          lineHeight: 1.3,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = PALETTE.borderHover;
          e.currentTarget.style.background = PALETTE.bgPanel;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = PALETTE.border;
          e.currentTarget.style.background = 'none';
        }}
      >
        <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>02</span>
        Read your full profile →
      </button>

      <button
        onClick={() => setPage('understand')}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          letterSpacing: '-0.01em',
          color: PALETTE.ink,
          background: 'none',
          border: `1px solid ${PALETTE.border}`,
          padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(1.5rem, 3vw, 2.5rem)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          textAlign: 'left',
          lineHeight: 1.3,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = PALETTE.borderHover;
          e.currentTarget.style.background = PALETTE.bgPanel;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = PALETTE.border;
          e.currentTarget.style.background = 'none';
        }}
      >
        <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>05</span>
        Why it cannot be deleted →
      </button>
    </motion.div>
  );
}

export default function OverviewPage({ results, sources, setPage }: {
  results: any;
  sources: any[];
  setPage: (p: DashPage) => void;
}) {
  const score = results?.privacyScore || 0;
  const stats = results?.stats || results?.rawStats;
  const hasDeepData = !!(results?.emotionalTimeline && results?.commercialProfile);
  const connected = sources.filter((s: any) => s.connected).length;
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .ov-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="dash-page-inner" style={{
        maxWidth: 1000, margin: '0 auto',
        padding: `0 ${pad}`,
        paddingBottom: 'clamp(4rem, 10vw, 8rem)',
      }}>

        {connected < sources.length && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{
              padding: '0.85rem 0',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '1.5rem',
              borderBottom: `1px solid ${PALETTE.border}`,
              flexWrap: 'wrap',
            }}
          >
            <p style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
            }}>
              Analysis based on ChatGPT export only
            </p>
            <button
              onClick={() => setPage('sources')}
              style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: PALETTE.inkMuted,
                background: 'none', border: `1px solid ${PALETTE.border}`,
                padding: '0.4rem 0.8rem', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
            >
              Add more sources →
            </button>
          </motion.div>
        )}

        <OverviewHeader score={score} stats={stats} results={results} />

        {results?.juiciestMoments?.[0] && (
          <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
            <MostExposingMoment results={results} />
          </div>
        )}

        <div
          className="ov-two-col"
          style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr',
            gap: 'clamp(3rem, 8vw, 6rem)',
            marginBottom: 'clamp(4rem, 10vw, 8rem)',
            alignItems: 'start',
          }}
        >
          <KeyFindings results={results} setPage={setPage} />
          <ActiveRisks results={results} score={score} setPage={setPage} />
        </div>

        {hasDeepData && results.emotionalTimeline?.weeks?.length > 2 && (
          <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
            <SectionRule label="Emotional pattern over time" />
            <EmotionalTimelineChart timeline={results.emotionalTimeline} totalMessages={results.totalUserMessages || 0} />
          </div>
        )}

        {hasDeepData && (
          <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
            <SectionRule label="Commercial profile" />
            <DataProductSummary analysis={results} />
          </div>
        )}

        <div style={{ marginBottom: 'clamp(4rem, 10vw, 6rem)' }}>
          <BottomCTAs setPage={setPage} />
        </div>

        <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '2rem', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
          <ConfidenceLimitations />
        </div>

        {hasDeepData && <ClosureSection analysis={results} setPage={setPage} />}

      </div>
    </>
  );
}
