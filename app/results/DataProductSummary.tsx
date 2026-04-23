'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

interface DataProductSummaryProps {
  analysis: DeepAnalysis;
}

// ============================================================================
// CPM LOOKUP — real advertiser rates by segment
// ============================================================================
const SEGMENT_CPM: Record<string, number> = {
  mentally_vulnerable: 85,
  financially_distressed: 120,
  relationship_crisis: 64,
  job_seeking: 78,
  late_night_lonely: 42,
  validation_seeking: 38,
};

function estimateCPM(segments: DeepAnalysis['commercialProfile']['segments']): number {
  if (!segments.length) return 12;
  const top = segments[0];
  const base = SEGMENT_CPM[top.id] ?? 28;
  const bonus = segments.length > 1 ? (SEGMENT_CPM[segments[1].id] ?? 0) * 0.3 : 0;
  return Math.round(base + bonus);
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
// CPM HERO — the number that lands
// ============================================================================
function CPMHero({ cpm, isInView }: { cpm: number; isInView: boolean }) {
  const count = useCounter(cpm, isInView, 2000);

  return (
    <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        Estimated advertiser value
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: PALETTE.inkMuted, letterSpacing: '0.1em' }}>$</span>
        <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3.5rem, 10vw, 7rem)', color: PALETTE.red, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {count}
        </span>
        <div style={{ paddingBottom: '0.5rem' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>per thousand</p>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>impressions</p>
        </div>
      </div>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 560 }}>
        This is what advertisers pay to show you a single ad — based on the emotional state and life circumstances your conversations reveal. The average internet user is worth $2–4 CPM. You are worth significantly more.
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
  if (weeks.length < 3) return null;

  const maxMsgs = Math.max(...weeks.map(w => w.messageCount), 1);
  const maxAnxiety = Math.max(...weeks.map(w => w.avgAnxiety), 1);

  // Colour scale: low anxiety = warm paper, high = deep red
  function anxietyColor(score: number, max: number) {
    const t = Math.min(score / max, 1);
    if (t < 0.25) return 'rgba(26,24,20,0.12)';
    if (t < 0.5) return 'rgba(160,100,0,0.5)';
    if (t < 0.75) return 'rgba(190,40,30,0.55)';
    return 'rgba(190,40,30,0.90)';
  }

  // Bucket into columns of ~6 weeks if many weeks
  const MAX_DOTS = 72;
  const sample = weeks.length > MAX_DOTS
    ? weeks.filter((_, i) => i % Math.ceil(weeks.length / MAX_DOTS) === 0)
    : weeks;

  const COLS = Math.min(sample.length, 24);
  const DOT_SIZE = 10;
  const DOT_GAP = 4;
  const totalW = COLS * (DOT_SIZE + DOT_GAP);

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
        Assigned targeting segments
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.6, maxWidth: 560, marginBottom: '2rem' }}>
        These are the audience categories you have been placed in. Advertisers buy access to people in these segments without knowing who you are — only what you reveal.
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
          Optimal targeting window
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted, letterSpacing: '0.1em' }}>
          Peak: {mostVulnerablePeriod} · {Math.round(nighttimeRatio * 100)}% late-night messages
        </p>
      </div>

      {/* Bar chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(24, 1fr)',
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

      {/* Hour labels — just key ones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '2px' }}>
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
        ■ Late-night messages (12am–4am) command a premium. You are most emotionally unguarded — and most valuable — then.
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
  const cpm = estimateCPM(commercialProfile.segments);

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
          Every pattern extracted from your conversations has a market price. This is what the surveillance economy has decided you are worth — based not on who you are, but on what you have revealed about yourself in moments of vulnerability.
        </p>
      </div>

      <CPMHero cpm={cpm} isInView={isInView} />
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
