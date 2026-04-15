'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import DataProductSummary from './DataProductSummary';
import EmotionalTimelineChart from './EmotionalTimelineChart';

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

  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke={PALETTE.bgElevated} strokeWidth="3" />
          <motion.circle
            cx="70" cy="70" r={r} fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={isInView ? { strokeDashoffset: circ - dash } : {}}
            transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: TYPE.serif, fontSize: '2.4rem', color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{count}</span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginTop: '2px' }}>/100</span>
        </div>
      </div>
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color, textTransform: 'uppercase' as const, textAlign: 'center' }}>
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
      style={{ padding: '2rem', background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderLeft: `2px solid ${PALETTE.red}`, height: '100%', boxSizing: 'border-box' as const }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase' as const, marginBottom: '1.2rem' }}>
        Most exposing moment
      </p>
      <blockquote style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', fontStyle: 'italic', color: PALETTE.ink, lineHeight: 1.6, marginBottom: '1.2rem' }}>
        "{moment.excerpt?.substring(0, 220)}{moment.excerpt?.length > 220 ? '...' : ''}"
      </blockquote>
      {date && (
        <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const }}>
          {date} — Retained permanently
        </p>
      )}
    </motion.div>
  );
}

function SourcesBar({ sources, setPage }: { sources: any[]; setPage: (p: DashPage) => void }) {
  const connected = sources.filter(s => s.connected).length;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      style={{ padding: '1rem 1.5rem', background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flex: 1, flexWrap: 'wrap' as const }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
          Data sources
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const }}>
          {sources.map(source => (
            <div key={source.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.6rem', background: source.connected ? PALETTE.greenFaint : PALETTE.bgElevated, border: `1px solid ${source.connected ? 'rgba(52,199,89,0.25)' : PALETTE.border}` }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: source.connected ? PALETTE.green : PALETTE.inkFaint }} />
              <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.1em', color: source.connected ? PALETTE.ink : PALETTE.inkFaint, textTransform: 'uppercase' as const }}>
                {source.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      {connected < sources.length && (
        <button
          onClick={() => setPage('sources')}
          style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: PALETTE.inkMuted, background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.4rem 0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' as const }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
        >
          Add sources
        </button>
      )}
    </motion.div>
  );
}

function KeyFindings({ results, setPage }: { results: any; setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

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
      label: 'Recurring obsessions',
      value: `${results.findings.repetitiveThemes.length} themes`,
      detail: results.findings.repetitiveThemes.slice(0, 3).map((t: any) => t.theme).join(', '),
      page: 'profile' as DashPage,
    },
  ].filter(Boolean) as any[];

  return (
    <div ref={ref}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, marginBottom: '1rem' }}>
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
            style={{ background: 'none', border: 'none', borderBottom: `1px solid ${PALETTE.border}`, padding: '0.9rem 0', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', transition: 'padding-left 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.paddingLeft = '0.5rem'; }}
            onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
          >
            <div>
              <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, marginBottom: '0.2rem' }}>{finding.label}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink }}>{finding.value}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, marginTop: '0.15rem', textTransform: 'capitalize' as const }}>{finding.detail}</p>
            </div>
            <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, flexShrink: 0 }}>→</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW PAGE
// ============================================================================
export default function OverviewPage({ results, sources, setPage }: {
  results: any;
  sources: any[];
  setPage: (p: DashPage) => void;
}) {
  const score = results?.privacyScore || 0;
  const stats = results?.stats || results?.rawStats;
  const hasDeepData = !!(results?.emotionalTimeline && results?.commercialProfile);

  const activeRisks = [
    { label: 'Insurance profiling', active: (results?.findings?.sensitiveTopics?.length || 0) > 0 },
    { label: 'Employment screening', active: (results?.totalUserMessages || results?.stats?.userMessages || 0) > 300 },
    { label: 'Behavioural targeting', active: (results?.nighttimeRatio || 0) > 0.05 || (results?.findings?.vulnerabilityPatterns?.length || 0) > 0 },
    { label: 'Data breach exposure', active: score > 40 },
  ];

  return (
    <div style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, marginBottom: '0.4rem' }}>
          DataSync Analytics Platform
        </p>
        <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Your AI Exposure Report
        </h1>
      </motion.div>

      {/* Sources bar */}
      <div style={{ marginBottom: '1px' }}>
        <SourcesBar sources={sources} setPage={setPage} />
      </div>

      {/* Row 1: Score + Stats + Risks */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 280px', gap: '1px', background: PALETTE.border, marginBottom: '1px' }}>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ background: PALETTE.bgPanel, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, marginBottom: '1.5rem', alignSelf: 'flex-start' }}>
            Exposure index
          </p>
          <ExposureRing score={score} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: PALETTE.border }}>
          {[
            { label: 'Messages analysed', value: ((stats?.totalMessages) || (results?.totalUserMessages ? results.totalUserMessages * 2 : 0) || 0).toLocaleString() },
            { label: 'Your messages', value: (stats?.userMessages || results?.totalUserMessages || 0).toLocaleString() },
            { label: 'Time span', value: stats?.timeSpan || (results?.timespan?.days ? `${results.timespan.days} days` : '—') },
            { label: 'Avg message length', value: stats?.avgMessageLength ? `${stats.avgMessageLength} chars` : '—' },
          ].map((item, i) => (
            <div key={i} style={{ background: PALETTE.bgPanel, padding: '1.4rem 1.6rem' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>{item.label}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)', color: PALETTE.ink, letterSpacing: '-0.02em' }}>{item.value}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ background: PALETTE.bgPanel, padding: '2rem' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, marginBottom: '1.5rem' }}>
            Active risk categories
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {activeRisks.map((risk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: risk.active ? PALETTE.red : PALETTE.inkGhost, boxShadow: risk.active ? `0 0 8px ${PALETTE.red}` : 'none' }} />
                <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.1em', color: risk.active ? PALETTE.inkMuted : PALETTE.inkFaint, textTransform: 'uppercase' as const, flex: 1 }}>
                  {risk.label}
                </span>
                <button onClick={() => setPage('risk')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PALETTE.inkFaint, fontFamily: TYPE.mono, fontSize: '8px' }}>→</button>
              </div>
            ))}
          </div>

          {hasDeepData && results.dependency && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: `1px solid ${PALETTE.border}` }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const, marginBottom: '0.5rem' }}>
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
                <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: results.dependency.dependencyScore > 60 ? PALETTE.red : PALETTE.inkMuted }}>
                  {results.dependency.dependencyScore}/100
                </span>
              </div>
              <p style={{ fontFamily: TYPE.mono, fontSize: '7px', color: PALETTE.inkFaint, marginTop: '0.3rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                {results.dependency.trajectory === 'increasing' ? 'Usage accelerating' : results.dependency.trajectory === 'stable' ? 'Stable pattern' : 'Usage declining'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 2: Quote + Key findings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: PALETTE.border, marginBottom: '1px' }}>
        <div style={{ background: PALETTE.bgPanel, padding: '2rem' }}>
          <OpeningQuoteCard results={results} />
        </div>
        <div style={{ background: PALETTE.bgPanel, padding: '2rem' }}>
          <KeyFindings results={results} setPage={setPage} />
        </div>
      </div>

      {/* Row 3: Emotional timeline — only with deep data */}
      {hasDeepData && results.emotionalTimeline?.weeks?.length > 2 && (
        <div style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderTop: 'none', padding: '2rem', marginBottom: '1px' }}>
          <EmotionalTimelineChart
            timeline={results.emotionalTimeline}
            totalMessages={results.totalUserMessages || 0}
          />
        </div>
      )}

      {/* Row 4: Data product summary (AI) — only with deep data */}
      {hasDeepData && (
        <div style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderTop: 'none', padding: '2rem', marginBottom: '1px' }}>
          <DataProductSummary analysis={results} />
        </div>
      )}

      {/* Row 5: Nav strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
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
            style={{ background: PALETTE.bgPanel, border: 'none', cursor: 'pointer', padding: '1.5rem 2rem', textAlign: 'left' as const, transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = PALETTE.bgHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = PALETTE.bgPanel; }}
          >
            <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.ink, marginBottom: '0.35rem' }}>{item.label} →</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.12em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const }}>{item.sub}</p>
          </button>
        ))}
      </motion.div>

    </div>
  );
}
