'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import DataProductSummary from './DataProductSummary';
import EmotionalTimelineChart from './EmotionalTimelineChart';
import { ConfidenceLimitations, getActiveEmptyStates, EmptyStateNotice } from './EmptyStatesAndLimitations';
import ClosureSection from './ClosureSection';

function ExposureRing({ score }: { score: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 2000, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setCount(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, score]);

  const r = 62;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke={PALETTE.bgElevated} strokeWidth="3" />
          <motion.circle
            cx="80" cy="80" r={r} fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={isInView ? { strokeDashoffset: circ - dash } : {}}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: TYPE.serif, fontSize: '3rem', color: PALETTE.ink, letterSpacing: '-0.04em', lineHeight: 1 }}>{count}</span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: '2px' }}>/100</span>
        </div>
      </div>
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color, textTransform: 'uppercase', textAlign: 'center' }}>
        {score >= 70 ? 'Severe exposure' : score >= 40 ? 'Moderate exposure' : 'Limited exposure'}
      </p>
    </div>
  );
}

function OpeningQuoteCard({ results }: { results: any }) {
  const moment = results?.juiciestMoments?.[0];
  if (!moment) return null;
  const date = moment.timestamp
    ? new Date(moment.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.9 }}
      style={{ padding: '2rem', background: PALETTE.bgPanel, borderLeft: `2px solid ${PALETTE.red}`, height: '100%', boxSizing: 'border-box' }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.2rem' }}>
        Most exposing moment
      </p>
      <blockquote style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', fontStyle: 'italic', color: PALETTE.ink, lineHeight: 1.65, marginBottom: '1.2rem' }}>
        &ldquo;{moment.excerpt?.substring(0, 240)}{moment.excerpt?.length > 240 ? '...' : ''}&rdquo;
      </blockquote>
      {date && (
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          {date} — Retained permanently
        </p>
      )}
    </motion.div>
  );
}

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

  if (findings.length === 0) {
    return (
      <div ref={ref}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
          Key findings
        </p>
        {emptyStates.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {emptyStates.slice(0, 3).map(state => (
              <EmptyStateNotice key={state.key} state={state} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, lineHeight: 1.7 }}>
            Insufficient data to generate findings.
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={ref}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
        Key findings
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {findings.map((finding, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.07 }}
            onClick={() => setPage(finding.page)}
            style={{ background: 'none', border: 'none', borderBottom: `1px solid ${PALETTE.border}`, padding: '0.9rem 0', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', transition: 'padding-left 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.paddingLeft = '0.5rem'; }}
            onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
          >
            <div>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.2rem' }}>{finding.label}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.ink }}>{finding.value}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, marginTop: '0.15rem', textTransform: 'capitalize' }}>{finding.detail}</p>
            </div>
            <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, flexShrink: 0 }}>→</span>
          </motion.button>
        ))}
      </div>
    </div>
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

  const activeRisks = [
    { label: 'Insurance profiling', active: (results?.findings?.sensitiveTopics?.length || 0) > 0 },
    { label: 'Employment screening', active: (results?.totalUserMessages || results?.stats?.userMessages || 0) > 300 },
    { label: 'Behavioural targeting', active: (results?.nighttimeRatio || 0) > 0.05 || (results?.findings?.vulnerabilityPatterns?.length || 0) > 0 },
    { label: 'Data breach exposure', active: score > 40 },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .ov-row1 { grid-template-columns: 1fr 1fr !important; }
          .ov-row1 > *:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .ov-row1 { grid-template-columns: 1fr !important; }
          .ov-stats { grid-template-columns: 1fr 1fr !important; }
          .ov-row2 { grid-template-columns: 1fr !important; }
          .ov-navstrip { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 400px) {
          .ov-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ padding: 'clamp(1.5rem, 5vw, 4rem)', maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            This is what your data reveals.
          </h1>
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.6rem' }}>
            AI exposure report — generated from your ChatGPT export
          </p>
        </motion.div>

        {/* Sources nudge — only if sources not all connected */}
        {connected < sources.length && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ padding: '0.9rem 1.5rem', background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1px', flexWrap: 'wrap' }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
              Analysis based on ChatGPT export only
            </p>
            <button
              onClick={() => setPage('sources')}
              style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: PALETTE.inkMuted, background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.4rem 0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
            >
              Add more sources →
            </button>
          </motion.div>
        )}

        {/* Row 1: Score + Stats + Risks */}
        <div className="ov-row1" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '1px', background: PALETTE.border, marginBottom: '1px' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ background: PALETTE.bgPanel, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem', alignSelf: 'flex-start' }}>
              Exposure index
            </p>
            <ExposureRing score={score} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="ov-stats"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: PALETTE.border }}>
            {[
              { label: 'Messages analysed', value: ((stats?.totalMessages) || (results?.totalUserMessages ? results.totalUserMessages * 2 : 0) || 0).toLocaleString() },
              { label: 'Your messages', value: (stats?.userMessages || results?.totalUserMessages || 0).toLocaleString() },
              { label: 'Time span', value: stats?.timeSpan || (results?.timespan?.days ? `${results.timespan.days} days` : '—') },
              { label: 'Avg message length', value: stats?.avgMessageLength ? `${stats.avgMessageLength} chars` : '—' },
            ].map((item, i) => (
              <div key={i} style={{ background: PALETTE.bgPanel, padding: '1.4rem 1.6rem' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{item.label}</p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', color: PALETTE.ink, letterSpacing: '-0.02em' }}>{item.value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ background: PALETTE.bgPanel, padding: '2rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              Active risk categories
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeRisks.map((risk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: risk.active ? PALETTE.red : PALETTE.inkGhost, boxShadow: risk.active ? `0 0 8px ${PALETTE.red}` : 'none' }} />
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: risk.active ? PALETTE.inkMuted : PALETTE.inkFaint, textTransform: 'uppercase', flex: 1 }}>
                    {risk.label}
                  </span>
                  <button onClick={() => setPage('risk')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: PALETTE.inkFaint, fontFamily: TYPE.mono, fontSize: '11px', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = PALETTE.ink; }}
                    onMouseLeave={e => { e.currentTarget.style.color = PALETTE.inkFaint; }}
                  >→</button>
                </div>
              ))}
            </div>

            {hasDeepData && results.dependency && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: `1px solid ${PALETTE.border}` }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Dependency score
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ flex: 1, height: '2px', background: PALETTE.bgElevated, position: 'relative', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: results.dependency.dependencyScore / 100 }}
                      transition={{ duration: 1.5, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: results.dependency.dependencyScore > 60 ? PALETTE.red : PALETTE.amber }}
                    />
                  </div>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: results.dependency.dependencyScore > 60 ? PALETTE.red : PALETTE.inkMuted }}>
                    {results.dependency.dependencyScore}/100
                  </span>
                </div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, marginTop: '0.4rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {results.dependency.trajectory === 'increasing' ? 'Usage accelerating' : results.dependency.trajectory === 'stable' ? 'Stable pattern' : 'Usage declining'}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Row 2: Quote + Key findings */}
        <div className="ov-row2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: PALETTE.border, marginBottom: '1px' }}>
          <div style={{ background: PALETTE.bgPanel, padding: '2rem' }}>
            <OpeningQuoteCard results={results} />
          </div>
          <div style={{ background: PALETTE.bgPanel, padding: '2rem' }}>
            <KeyFindings results={results} setPage={setPage} />
          </div>
        </div>

        {/* Emotional timeline */}
        {hasDeepData && results.emotionalTimeline?.weeks?.length > 2 && (
          <div style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderTop: 'none', padding: '2rem', marginBottom: '1px' }}>
            <EmotionalTimelineChart timeline={results.emotionalTimeline} totalMessages={results.totalUserMessages || 0} />
          </div>
        )}

        {/* Data product summary */}
        {hasDeepData && (
          <div style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderTop: 'none', padding: '2rem', marginBottom: '1px' }}>
            <DataProductSummary analysis={results} />
          </div>
        )}

        {/* Confidence note */}
        <div style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderTop: 'none', padding: '2rem', marginBottom: '1px' }}>
          <ConfidenceLimitations />
        </div>

        {/* Nav strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="ov-navstrip"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: PALETTE.border }}
        >
          {[
            { label: 'See your full profile', sub: 'Cognitive fingerprint, social graph, locations', page: 'profile' as DashPage },
            { label: 'Assess your risks', sub: 'Insurance, employment, targeting, breach scenarios', page: 'risk' as DashPage },
            { label: 'Understand what happened', sub: 'What this data means and why it cannot be deleted', page: 'understand' as DashPage },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => setPage(item.page)}
              style={{ background: PALETTE.bgPanel, border: 'none', cursor: 'pointer', padding: '1.8rem 2rem', textAlign: 'left', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = PALETTE.bgHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = PALETTE.bgPanel; }}
            >
              <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.ink, marginBottom: '0.4rem' }}>{item.label} →</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.10em', color: PALETTE.inkMuted, textTransform: 'uppercase' }}>{item.sub}</p>
            </button>
          ))}
        </motion.div>

        {/* Closure */}
        {hasDeepData && <ClosureSection analysis={results} setPage={setPage} />}

      </div>
    </>
  );
}
