'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import DataProductSummary from './DataProductSummary';
import EmotionalTimelineChart from './EmotionalTimelineChart';
import { ConfidenceLimitations, getActiveEmptyStates, EmptyStateNotice } from './EmptyStatesAndLimitations';
import ClosureSection from './ClosureSection';

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

function useCounter(target: number, isInView: boolean, duration = 2000) {
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

// ============================================================================
// HEADER
// ============================================================================

function OverviewHeader({ score, stats, results }: { score: number; stats: any; results: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useCounter(score, isInView);
  const messages = results?.totalUserMessages || stats?.userMessages || 0;
  const timeSpan = stats?.timeSpan || (results?.timespan?.days ? `${results.timespan.days} days` : null);

  const scoreLabel = score >= 70 ? 'Severe exposure' : score >= 40 ? 'Moderate exposure' : 'Limited exposure';
  const scoreColor = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Geometric accent */}
      <svg style={{
        position: 'absolute', top: 0, right: 0,
        width: '260px', height: '260px', pointerEvents: 'none', overflow: 'visible',
      }}>
        <rect x={160} y={20} width={60} height={60} fill="none" stroke="rgba(26,24,20,0.05)" strokeWidth="1" />
        <line x1={160} y1={100} x2={200} y2={100} stroke="rgba(26,24,20,0.04)" strokeWidth="1" />
        <line x1={210} y1={95} x2={230} y2={95} stroke="rgba(26,24,20,0.03)" strokeWidth="1" />
        <line x1={160} y1={110} x2={185} y2={110} stroke="rgba(26,24,20,0.03)" strokeWidth="1" />
        <rect x={168} y={130} width={20} height={20} fill="none" stroke="rgba(190,40,30,0.08)" strokeWidth="1" />
        <rect x={198} y={122} width={14} height={14} fill="none" stroke="rgba(26,24,20,0.04)" strokeWidth="1" />
        <circle cx={220} cy={140} r={1.5} fill="rgba(190,40,30,0.2)" />
        <circle cx={235} cy={128} r={1} fill="rgba(26,24,20,0.1)" />
      </svg>

      {/* Page label */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.7 }}
        style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
        }}
      >
        01 / Overview
      </motion.p>

      {/* Score — massive, like the day counter on Resist */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{
          display: 'flex', alignItems: 'baseline', gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        <span style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(3.5rem, 10vw, 7rem)',
          fontWeight: 400, color: scoreColor,
          letterSpacing: '-0.04em', lineHeight: 1,
        }}>
          {count}
        </span>
        <div>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block',
          }}>out of 100</span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
            color: scoreColor, textTransform: 'uppercase', display: 'block', marginTop: '2px',
          }}>{scoreLabel}</span>
        </div>
      </motion.div>

      {/* Main statement */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.9 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.02em', lineHeight: 1.25,
          maxWidth: 680, marginBottom: '1.5rem',
        }}
      >
        This is what your data reveals.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1, duration: 0.8 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)',
          color: PALETTE.inkMuted, lineHeight: 1.8,
          fontStyle: 'italic', maxWidth: 580,
        }}
      >
        Every conversation you have had with an AI system leaves a trace. Not just in logs — in the model itself. This report maps what has been extracted from you.
      </motion.p>

      {/* Stats strip */}
      {messages > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.3, duration: 0.6 }}
          style={{
            display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)',
            marginTop: 'clamp(2rem, 5vw, 3.5rem)',
            paddingTop: 'clamp(1.5rem, 3vw, 2rem)',
            borderTop: `1px solid ${PALETTE.border}`,
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Messages analysed', value: messages.toLocaleString() },
            timeSpan ? { label: 'Time span', value: timeSpan } : null,
            stats?.avgMessageLength ? { label: 'Avg length', value: `${stats.avgMessageLength} chars` } : null,
          ].filter(Boolean).map((stat: any, i) => (
            <div key={i}>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem',
              }}>{stat.label}</p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1,
              }}>{stat.value}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MOST EXPOSING MOMENT
// ============================================================================

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
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9 }}
      style={{
        borderLeft: `3px solid ${PALETTE.red}`,
        paddingLeft: 'clamp(2rem, 4vw, 3rem)',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
      }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        Most exposing moment
      </p>
      <blockquote style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
        fontStyle: 'italic',
        color: PALETTE.ink,
        lineHeight: 1.7,
        marginBottom: '1.4rem',
        maxWidth: 700,
      }}>
        &ldquo;{moment.excerpt?.substring(0, 300)}{moment.excerpt?.length > 300 ? '…' : ''}&rdquo;
      </blockquote>
      {date && (
        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          {date} / Retained permanently
        </p>
      )}
    </motion.div>
  );
}

// ============================================================================
// KEY FINDINGS
// ============================================================================

function KeyFindings({ results, setPage }: { results: any; setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const emptyStates = results ? getActiveEmptyStates(results) : [];

  const findings = [
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

      {findings.length === 0 ? (
        emptyStates.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {emptyStates.slice(0, 3).map(state => (
              <EmptyStateNotice key={state.key} state={state} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, lineHeight: 1.7 }}>
            Insufficient data to generate findings.
          </p>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {findings.map((finding, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.08 }}
              onClick={() => setPage(finding.page)}
              style={{
                background: 'none', border: 'none',
                borderBottom: `1px solid ${PALETTE.border}`,
                padding: '1.4rem 0',
                cursor: 'pointer', textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center', gap: '2rem',
                transition: 'padding-left 0.15s',
                width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.paddingLeft = '0.6rem'; }}
              onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
            >
              <div>
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
                  color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem',
                }}>{finding.label}</p>
                <p style={{
                  fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
                  color: PALETTE.ink, letterSpacing: '-0.01em', marginBottom: '0.25rem',
                }}>{finding.value}</p>
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint,
                  textTransform: 'capitalize', lineHeight: 1.5,
                }}>{finding.detail}</p>
              </div>
              <span style={{ fontFamily: TYPE.mono, fontSize: '14px', color: PALETTE.inkFaint, flexShrink: 0 }}>→</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ACTIVE RISKS
// ============================================================================

function ActiveRisks({ results, score, setPage }: { results: any; score: number; setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const risks = [
    { label: 'Insurance profiling', active: (results?.findings?.sensitiveTopics?.length || 0) > 0 },
    { label: 'Employment screening', active: (results?.totalUserMessages || results?.stats?.userMessages || 0) > 300 },
    { label: 'Behavioural targeting', active: (results?.nighttimeRatio || 0) > 0.05 || (results?.findings?.vulnerabilityPatterns?.length || 0) > 0 },
    { label: 'Data breach exposure', active: score > 40 },
  ];

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
        Active risk categories
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
        {risks.map((risk, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: risk.active ? PALETTE.red : 'transparent',
              border: risk.active ? 'none' : `1px solid rgba(26,24,20,0.25)`,
            }} />
            <span style={{
              fontFamily: TYPE.mono, fontSize: '12px', letterSpacing: '0.12em',
              color: risk.active ? PALETTE.inkMuted : PALETTE.inkFaint,
              textTransform: 'uppercase', flex: 1,
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
          padding: '0.7rem 1.2rem', cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.inkMuted; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
      >
        View risk assessment →
      </button>
    </motion.div>
  );
}

// ============================================================================
// SECTION RULE
// ============================================================================

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

// ============================================================================
// NAV STRIP
// ============================================================================

function NavStrip({ setPage }: { setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const items = [
    { label: 'Your profile', sub: 'Cognitive fingerprint, social graph, locations', page: 'profile' as DashPage, num: '02' },
    { label: 'Your risks', sub: 'Insurance, employment, targeting, breach scenarios', page: 'risk' as DashPage, num: '04' },
    { label: 'Understand this', sub: 'Why your data cannot be deleted from a trained model', page: 'understand' as DashPage, num: '05' },
    { label: 'What you can do', sub: 'Legal rights, real settings, organisations, alternatives', page: 'resist' as DashPage, num: '06' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1px',
        background: PALETTE.border,
      }}
    >
      {items.map((item, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: i * 0.1 }}
          onClick={() => setPage(item.page)}
          style={{
            background: PALETTE.bgPanel, border: 'none',
            cursor: 'pointer', padding: '2rem',
            textAlign: 'left', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.bgHover; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.bgPanel; }}
        >
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
            color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.8rem',
          }}>{item.num}</p>
          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
            color: PALETTE.ink, marginBottom: '0.6rem', letterSpacing: '-0.01em',
          }}>{item.label} →</p>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.08em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 1.7,
          }}>{item.sub}</p>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

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

      <div style={{
        maxWidth: 1000, margin: '0 auto',
        padding: `0 ${pad}`,
        paddingBottom: 'clamp(4rem, 10vw, 8rem)',
      }}>

        {/* Sources nudge */}
        {connected < sources.length && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{
              padding: '0.9rem 0',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '1.5rem',
              borderBottom: `1px solid ${PALETTE.border}`,
              flexWrap: 'wrap',
            }}
          >
            <p style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
            }}>
              Analysis based on ChatGPT export only
            </p>
            <button
              onClick={() => setPage('sources')}
              style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
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

        {/* Hero */}
        <OverviewHeader score={score} stats={stats} results={results} />

        {/* Most exposing moment */}
        {results?.juiciestMoments?.[0] && (
          <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
            <MostExposingMoment results={results} />
          </div>
        )}

        {/* Key findings + Active risks */}
        <div
          className="ov-two-col"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(3rem, 8vw, 6rem)',
            marginBottom: 'clamp(4rem, 10vw, 8rem)',
            alignItems: 'start',
          }}
        >
          <KeyFindings results={results} setPage={setPage} />
          <ActiveRisks results={results} score={score} setPage={setPage} />
        </div>

        {/* Emotional timeline */}
        {hasDeepData && results.emotionalTimeline?.weeks?.length > 2 && (
          <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
            <SectionRule label="Emotional pattern" />
            <EmotionalTimelineChart timeline={results.emotionalTimeline} totalMessages={results.totalUserMessages || 0} />
          </div>
        )}

        {/* Data product summary */}
        {hasDeepData && (
          <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
            <SectionRule label="Commercial profile" />
            <DataProductSummary analysis={results} />
          </div>
        )}

        {/* Navigate deeper */}
        <div style={{ marginBottom: 'clamp(4rem, 10vw, 6rem)' }}>
          <SectionRule label="Continue reading" />
          <NavStrip setPage={setPage} />
        </div>

        {/* Confidence note */}
        <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '2rem', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
          <ConfidenceLimitations />
        </div>

        {/* Closure */}
        {hasDeepData && <ClosureSection analysis={results} setPage={setPage} />}

      </div>
    </>
  );
}
