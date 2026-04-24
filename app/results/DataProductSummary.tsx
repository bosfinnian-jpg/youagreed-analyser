'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

interface DataProductSummaryProps {
  analysis: DeepAnalysis;
}

// ============================================================================
// TRAINING VALUE — value of conversation data to the AI industry
// ============================================================================
// OpenAI's valuation crossed $300bn in 2025. That valuation is built on
// the model — which was trained on conversations like yours, for free.
// This is illustrative: the economic argument, not a market rate for your data.
function estimateTrainingValue(segments: DeepAnalysis['commercialProfile']['segments']): number {
  // Returns an illustrative 'sensitivity index' (not a CPM or market price)
  const base = segments.length > 0 ? 40 : 12;
  const bonus = segments.filter(s => ['mentally_vulnerable','financially_distressed'].includes(s.id)).length * 20;
  return Math.min(base + bonus, 100);
}

// ============================================================================
// ANIMATED NUMBER
// ============================================================================
function useCounter(target: number, isInView: boolean, duration = 1600) {
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
// TRAINING VALUE HERO
// ============================================================================
function TrainingValueHero({ sensitivityIndex, isInView }: { sensitivityIndex: number; isInView: boolean }) {
  const count = useCounter(300, isInView, 2200);

  return (
    <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        The company your data helped build
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: PALETTE.inkMuted, letterSpacing: '0.1em' }}>$</span>
        <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3.5rem, 10vw, 7rem)', color: PALETTE.red, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {count}bn
        </span>
      </div>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 560 }}>
        OpenAI’s valuation in 2025. That number is built on the model — which was trained on conversations like yours, without payment, and without the ability to remove your contribution. You cannot opt out retroactively. You cannot be compensated. The data is inside the weights now.
      </p>
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em', color: PALETTE.inkFaint, marginTop: '1rem', lineHeight: 1.6 }}>
        Note: OpenAI does not sell your conversation data to advertisers. The risk is different — it is irreversibility, breach exposure, and the use of your disclosures to train commercial AI products.
      </p>
    </div>
  );
}

// ============================================================================
// DOT PLOT — weekly vulnerability over time (Pudding-style shape of data)
// ============================================================================
function VulnerabilityPlot({ timeline }: { timeline: DeepAnalysis['emotionalTimeline'] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const weeks = timeline?.weeks ?? [];

  const plotData = useMemo(() => {
    if (weeks.length < 3) return null;
    const maxMsgs = Math.max(...weeks.map(w => w.messageCount), 1);
    const maxAnxiety = Math.max(...weeks.map(w => w.avgAnxiety), 1);
    const MAX_DOTS = 72;
    const sample = weeks.length > MAX_DOTS
      ? weeks.filter((_, i) => i % Math.ceil(weeks.length / MAX_DOTS) === 0)
      : weeks;
    const COLS = Math.min(sample.length, 24);
    const DOT_SIZE = 10;
    const DOT_GAP = 4;
    const totalW = COLS * (DOT_SIZE + DOT_GAP);
    return { maxMsgs, maxAnxiety, sample, DOT_SIZE, DOT_GAP, totalW };
  }, [weeks]);

  if (!plotData) return null;
  const { maxMsgs, maxAnxiety, sample, DOT_SIZE, DOT_GAP, totalW } = plotData;

  function anxietyColor(score: number, max: number) {
    const t = Math.min(score / max, 1);
    if (t < 0.25) return 'rgba(26,24,20,0.12)';
    if (t < 0.5) return 'rgba(160,100,0,0.5)';
    if (t < 0.75) return 'rgba(190,40,30,0.55)';
    return 'rgba(190,40,30,0.90)';
  }

  return (
    <div ref={ref} style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
          Emotional exposure over time
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(26,24,20,0.12)', border: `1px solid ${PALETTE.border}` }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Low</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(190,40,30,0.90)' }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>High anxiety</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: PALETTE.inkGhost, border: `1px solid ${PALETTE.border}` }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>= more messages</span>
          </div>
        </div>
      </div>

      {/* The dot plot */}
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${DOT_GAP}px`,
          maxWidth: `${totalW}px`,
          minWidth: '200px',
        }}>
          {sample.map((week, i) => {
            const size = DOT_SIZE + Math.round((week.messageCount / maxMsgs) * 8);
            const color = anxietyColor(week.avgAnxiety, maxAnxiety);
            const hasCrisis = week.crisisFlag;
            return (
              <motion.div
                key={week.weekKey}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.012, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                title={`Week of ${week.weekKey} · ${week.messageCount} messages · anxiety ${week.avgAnxiety.toFixed(1)}`}
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                  outline: hasCrisis ? `2px solid ${PALETTE.red}` : 'none',
                  outlineOffset: '2px',
                  cursor: 'default',
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          {sample[0]?.weekKey ?? 'Earlier'}
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          Most recent
        </p>
      </div>

      {/* Crisis period callout */}
      {timeline.crisisPeriods?.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: PALETTE.red, marginTop: '1rem' }}
        >
          ● {timeline.crisisPeriods.length} crisis period{timeline.crisisPeriods.length > 1 ? 's' : ''} detected — outlined in red above
        </motion.p>
      )}
    </div>
  );
}

// ============================================================================
// SEGMENT CARDS — styled like ad platform targeting UI
// ============================================================================
function SegmentCards({ segments, isInView }: { segments: DeepAnalysis['commercialProfile']['segments']; isInView: boolean }) {
  if (!segments.length) return null;

  return (
    <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        Inferred vulnerability categories
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.6, maxWidth: 560, marginBottom: '2rem' }}>
        These are the vulnerability categories your conversations map onto. OpenAI does not sell this profile to advertisers — but these patterns exist in your data. If exposed through a breach or subpoena, they would fit directly into systems that do trade on them.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {segments.map((seg, i) => (
          <motion.div
            key={seg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
            style={{ background: PALETTE.bgPanel }}
          >
            {/* Card header — platform dossier aesthetic */}
            <div style={{
              padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(1rem, 2.5vw, 1.5rem) 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Audience segment {String(i + 1).padStart(2, '0')}
                </p>
                <p style={{
                  fontFamily: TYPE.serif,
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                  color: PALETTE.ink,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  marginBottom: '0.5rem',
                }}>
                  {seg.label}
                </p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted, letterSpacing: '0.06em', maxWidth: 500, lineHeight: 1.6 }}>
                  {seg.evidence || seg.description}
                </p>
              </div>

              {/* Confidence indicator */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Match</p>
                <p style={{
                  fontFamily: TYPE.serif,
                  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                  color: seg.confidence > 70 ? PALETTE.red : seg.confidence > 40 ? PALETTE.amber : PALETTE.inkMuted,
                  letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  {seg.confidence}%
                </p>
              </div>
            </div>

            {/* Confidence bar — full width */}
            <div style={{ margin: '1rem clamp(1rem, 2.5vw, 1.5rem) 0', height: '2px', background: PALETTE.bgElevated }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: seg.confidence / 100 } : {}}
                transition={{ duration: 1.4, delay: 0.3 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  height: '100%',
                  transformOrigin: 'left',
                  background: seg.confidence > 70 ? PALETTE.red : seg.confidence > 40 ? PALETTE.amber : PALETTE.inkFaint,
                }}
              />
            </div>

            {/* Ad categories */}
            <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 2.5vw, 1.5rem)' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Ad categories unlocked
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {seg.adCategories.map(cat => (
                  <span key={cat} style={{
                    fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.08em',
                    color: PALETTE.inkMuted, padding: '0.25rem 0.6rem',
                    border: `1px solid ${PALETTE.border}`,
                    background: PALETTE.redFaint,
                  }}>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TARGETING WINDOW — 24-hour bar chart showing vulnerability by hour
// ============================================================================
function TargetingWindow({ hourDistribution, mostVulnerablePeriod, nighttimeRatio }: {
  hourDistribution: number[];
  mostVulnerablePeriod: string;
  nighttimeRatio: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  if (!hourDistribution?.length) return null;

  const max = Math.max(...hourDistribution, 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  function hourLabel(h: number) {
    if (h === 0) return '12a';
    if (h === 12) return '12p';
    return h < 12 ? `${h}a` : `${h - 12}p`;
  }

  function barColor(h: number, count: number) {
    const isLateNight = h >= 0 && h <= 4;
    const intensity = count / max;
    if (isLateNight && intensity > 0.1) return PALETTE.red;
    if (intensity > 0.6) return PALETTE.amber;
    return 'rgba(26,24,20,0.22)';
  }

  return (
    <div ref={ref} style={{ marginBottom: 'clamp(2rem, 5vw, 3rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
          Disclosure pattern by hour
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted, letterSpacing: '0.1em' }}>
          Peak: {mostVulnerablePeriod} · {Math.round(nighttimeRatio * 100)}% late-night messages
        </p>
      </div>

      {/* Bar chart */}
      <div style={{ overflowX: 'auto', marginBottom: '4px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(24, 1fr)',
        minWidth: '360px',
        gap: '2px',
        alignItems: 'flex-end',
        height: '64px',
        marginBottom: '4px',
      }}>
        {hours.map((h) => {
          const count = hourDistribution[h] ?? 0;
          const pct = count / max;
          return (
            <motion.div
              key={h}
              title={`${hourLabel(h)}: ${count} messages`}
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ delay: h * 0.02, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                transformOrigin: 'bottom',
              }}
            >
              <div style={{
                width: '100%',
                height: `${Math.max(pct * 100, 2)}%`,
                background: barColor(h, count),
                minHeight: '2px',
                transition: 'background 0.3s',
              }} />
            </motion.div>
          );
        })}
      </div>
      </div>

      {/* Hour labels — just key ones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '2px', minWidth: '360px', overflowX: 'hidden' }}>
        {hours.map(h => (
          <p key={h} style={{
            fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.05em',
            color: h === 0 || h === 6 || h === 12 || h === 18 ? PALETTE.inkFaint : 'transparent',
            textAlign: 'center', textTransform: 'uppercase',
          }}>
            {hourLabel(h)}
          </p>
        ))}
      </div>

      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', color: PALETTE.red, marginTop: '0.75rem' }}>
        ■ Late-night messages (12am–4am) carry the highest concentration of sensitive disclosure. This is when emotional defences are lowest — and when exposed data would be most revealing.
      </p>
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function DataProductSummary({ analysis }: DataProductSummaryProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  const { commercialProfile, dependency, lifeEvents, nighttimeRatio, mostVulnerablePeriod, emotionalTimeline, hourDistribution } = analysis;
  const sensitivityIndex = estimateTrainingValue(commercialProfile.segments);

  return (
    <div ref={ref}>
      {/* Section intro */}
      <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <h2 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.025em', lineHeight: 1.2,
          marginBottom: '1rem', maxWidth: 680,
        }}>
          You, as a commercial product.
        </h2>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 580 }}>
          OpenAI does not sell your data to advertisers. The real problem is different: your conversations helped train a model worth hundreds of billions of dollars, and that contribution cannot be undone. What follows shows the patterns your data contains — and what would be exposed if that data were ever compromised.
        </p>
      </div>

      <TrainingValueHero sensitivityIndex={sensitivityIndex} isInView={isInView} />
      <VulnerabilityPlot timeline={emotionalTimeline} />
      <SegmentCards segments={commercialProfile.segments} isInView={isInView} />
      <TargetingWindow
        hourDistribution={hourDistribution ?? []}
        mostVulnerablePeriod={mostVulnerablePeriod}
        nighttimeRatio={nighttimeRatio}
      />
    </div>
  );
}
