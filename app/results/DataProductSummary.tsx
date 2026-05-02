'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from '@/lib/analysis/deepParser';

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
// VULNERABILITY PLOT — bar chart + anxiety curve + crisis markers
// ============================================================================
const toDate = (d: unknown): Date => d instanceof Date ? d : new Date(d as string);

function VulnerabilityPlot({ timeline }: { timeline: DeepAnalysis['emotionalTimeline'] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-5%' });
  const [revealed, setRevealed] = useState(false);
  const [svgWidth, setSvgWidth] = useState(800);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; week: NonNullable<DeepAnalysis['emotionalTimeline']>['weeks'][0] } | null>(null);

  useEffect(() => {
    if (isInView) { const t = setTimeout(() => setRevealed(true), 300); return () => clearTimeout(t); }
  }, [isInView]);

  useEffect(() => {
    const obs = new ResizeObserver(e => setSvgWidth(e[0].contentRect.width || 800));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const weeks = timeline?.weeks ?? [];
  if (weeks.length < 3) return null;

  // Dimensions — left pad gives room for axis, right pad prevents clip
  const H = 240;
  const PAD = { top: 24, right: 24, bottom: 48, left: 32 };
  const cW = svgWidth - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxMsgs = Math.max(...weeks.map(w => w.messageCount), 1);
  const maxAnxiety = Math.max(...weeks.map(w => w.avgAnxiety), 0.1);
  const barW = Math.max(1, (cW / weeks.length) - 1.5);

  // Anxiety: 5-week smoothing
  const smoothAnxiety = weeks.map((_, i) => {
    const win = weeks.slice(Math.max(0, i - 2), Math.min(weeks.length, i + 3));
    return win.reduce((s, w) => s + w.avgAnxiety, 0) / win.length;
  });

  // Bar colour — encode anxiety in hue
  function barColor(week: typeof weeks[0], anxietyNorm: number) {
    if (week.crisisFlag) return 'rgba(190,40,30,0.85)';
    if (anxietyNorm > 0.72) return 'rgba(190,40,30,0.65)';
    if (anxietyNorm > 0.45) return 'rgba(170,90,0,0.5)';
    if (anxietyNorm > 0.2) return 'rgba(26,24,20,0.28)';
    return 'rgba(26,24,20,0.11)';
  }

  // Anxiety SVG path
  const anxietyPts = smoothAnxiety.map((v, i) => {
    const x = PAD.left + (i / Math.max(weeks.length - 1, 1)) * cW + barW / 2;
    const y = PAD.top + cH - (v / maxAnxiety) * cH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const anxietyPath = `M ${anxietyPts.join(' L ')}`;

  // Date labels — up to 7
  const labelStep = Math.ceil(weeks.length / 7);

  // Peak anxiety week index
  const peakIdx = smoothAnxiety.indexOf(Math.max(...smoothAnxiety));

  return (
    <div ref={containerRef} style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)', borderBottom: `1px solid ${PALETTE.border}` }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Emotional exposure over time
        </p>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.65, maxWidth: 560 }}>
          {weeks.length} weeks of recorded activity. Bar height shows message volume. Colour shows anxiety intensity. The line is the aggregate emotional arc — the pattern any system would read as you.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        {[
          { swatch: <div style={{ width: 18, height: 10, background: 'rgba(26,24,20,0.18)', borderRadius: 1 }} />, label: 'Low anxiety' },
          { swatch: <div style={{ width: 18, height: 10, background: 'rgba(170,90,0,0.5)', borderRadius: 1 }} />, label: 'Moderate' },
          { swatch: <div style={{ width: 18, height: 10, background: 'rgba(190,40,30,0.85)', borderRadius: 1 }} />, label: 'High / crisis' },
          { swatch: <div style={{ width: 18, height: 2, background: PALETTE.red, marginTop: 4 }} />, label: 'Anxiety curve' },
        ].map(({ swatch, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {swatch}
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* SVG */}
      <div style={{ position: 'relative', width: '100%' }}>
        <svg ref={svgRef} width="100%" height={H} viewBox={`0 0 ${svgWidth} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
          <defs>
            <linearGradient id="anxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(190,40,30,0.18)" />
              <stop offset="100%" stopColor="rgba(190,40,30,0)" />
            </linearGradient>
          </defs>

          {/* Subtle grid */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f}
              x1={PAD.left} y1={PAD.top + cH * (1 - f)}
              x2={PAD.left + cW} y2={PAD.top + cH * (1 - f)}
              stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="2 5" />
          ))}

          {/* Crisis zone fills */}
          {timeline!.crisisPeriods.map((period, i) => {
            const si = weeks.findIndex(w => w.weekKey === period.start);
            const ei = weeks.findIndex(w => w.weekKey === period.end);
            if (si < 0) return null;
            const x1 = PAD.left + (si / Math.max(weeks.length - 1, 1)) * cW;
            const x2 = PAD.left + (Math.min(ei > 0 ? ei : si + 2, weeks.length - 1) / Math.max(weeks.length - 1, 1)) * cW + barW;
            return (
              <rect key={i} x={x1} y={PAD.top} width={x2 - x1} height={cH}
                fill="rgba(190,40,30,0.06)" />
            );
          })}

          {/* Bars */}
          {weeks.map((week, i) => {
            const bH = (week.messageCount / maxMsgs) * cH;
            const x = PAD.left + (i / Math.max(weeks.length - 1, 1)) * cW;
            const y = PAD.top + cH - bH;
            const aNorm = week.avgAnxiety / maxAnxiety;
            return (
              <motion.rect
                key={week.weekKey}
                x={x} y={y}
                width={Math.max(barW, 1)} height={Math.max(bH, 1)}
                fill={barColor(week, aNorm)}
                rx={barW > 3 ? 1 : 0}
                initial={{ scaleY: 0 }}
                animate={revealed ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 0.7, delay: (i / weeks.length) * 0.5, ease: [0.4, 0, 0.2, 1] }}
                onMouseEnter={e => {
                  const cr = (e.target as SVGElement).getBoundingClientRect();
                  const cont = containerRef.current?.getBoundingClientRect();
                  if (cont) setTooltip({ x: cr.left - cont.left + barW / 2, y: cr.top - cont.top - 8, week });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'crosshair', transformOrigin: `${x + barW / 2}px ${PAD.top + cH}px` } as React.CSSProperties}
              />
            );
          })}

          {/* Anxiety area fill under curve */}
          <motion.path
            d={`${anxietyPath} L ${(PAD.left + cW).toFixed(1)},${PAD.top + cH} L ${PAD.left.toFixed(1)},${PAD.top + cH} Z`}
            fill="url(#anxGrad)"
            initial={{ opacity: 0 }}
            animate={revealed ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
          />

          {/* Anxiety curve */}
          <motion.path
            d={anxietyPath}
            fill="none"
            stroke={PALETTE.red}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={revealed ? { pathLength: 1, opacity: 0.85 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 2, delay: 0.5, ease: 'easeInOut' }}
          />

          {/* Peak marker */}
          {(() => {
            const x = PAD.left + (peakIdx / Math.max(weeks.length - 1, 1)) * cW + barW / 2;
            const y = PAD.top + cH - (smoothAnxiety[peakIdx] / maxAnxiety) * cH;
            return (
              <motion.g initial={{ opacity: 0, scale: 0 }} animate={revealed ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 2.2 }}
                style={{ transformOrigin: `${x}px ${y}px` }}>
                <circle cx={x} cy={y} r={5} fill={PALETTE.red} />
                <circle cx={x} cy={y} r={9} fill="none" stroke={PALETTE.red} strokeWidth={1} opacity={0.35} />
                <text x={x + 12} y={y + 4} style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: PALETTE.red, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  peak
                </text>
              </motion.g>
            );
          })()}

          {/* Date labels */}
          {weeks.map((week, i) => {
            if (i % labelStep !== 0 && i !== weeks.length - 1) return null;
            const x = PAD.left + (i / Math.max(weeks.length - 1, 1)) * cW + barW / 2;
            const label = toDate(week.startDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
            return (
              <text key={`lbl-${i}`} x={x} y={PAD.top + cH + 18} textAnchor="middle"
                style={{ fontFamily: TYPE.mono, fontSize: '10px', fill: 'rgba(26,24,20,0.4)', letterSpacing: '0.08em' }}>
                {label}
              </text>
            );
          })}

          {/* Baseline */}
          <line x1={PAD.left} y1={PAD.top + cH} x2={PAD.left + cW} y2={PAD.top + cH}
            stroke={PALETTE.border} strokeWidth={0.5} />

          {/* Left axis labels */}
          <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end"
            style={{ fontFamily: TYPE.mono, fontSize: '8px', fill: 'rgba(26,24,20,0.3)', letterSpacing: '0.05em' }}>High</text>
          <text x={PAD.left - 6} y={PAD.top + cH} textAnchor="end"
            style={{ fontFamily: TYPE.mono, fontSize: '8px', fill: 'rgba(26,24,20,0.3)', letterSpacing: '0.05em' }}>Low</text>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 12, svgWidth - 190),
            top: Math.max(tooltip.y - 70, 0),
            background: PALETTE.bgElevated,
            border: `1px solid ${tooltip.week.crisisFlag ? PALETTE.red : PALETTE.border}`,
            padding: '0.75rem 1rem',
            pointerEvents: 'none',
            zIndex: 20,
            minWidth: 170,
          }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              {toDate(tooltip.week.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.ink, marginBottom: '0.2rem', letterSpacing: '-0.01em' }}>
              {tooltip.week.messageCount} messages
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: tooltip.week.avgAnxiety > 3 ? PALETTE.red : PALETTE.inkMuted }}>
              Anxiety {tooltip.week.avgAnxiety.toFixed(1)} / 10
            </p>
            {tooltip.week.lateNightCount > 0 && (
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, marginTop: '0.25rem' }}>
                {tooltip.week.lateNightCount} late-night
              </p>
            )}
            {tooltip.week.crisisFlag && (
              <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.red, marginTop: '0.4rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                ● Crisis period
              </p>
            )}
            {tooltip.week.dominantTopic && (
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, marginTop: '0.25rem', textTransform: 'capitalize' }}>
                {tooltip.week.dominantTopic}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Crisis callout strip */}
      {timeline!.crisisPeriods.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.8 }}
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            borderLeft: `3px solid ${PALETTE.red}`,
            background: 'rgba(190,40,30,0.04)',
          }}
        >
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {timeline!.crisisPeriods.length} crisis period{timeline!.crisisPeriods.length > 1 ? 's' : ''} detected
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', fontStyle: 'italic', color: PALETTE.inkMuted, lineHeight: 1.65, maxWidth: 560 }}>
            These are the weeks when you needed help most. They are also the weeks that produced the most valuable data.
          </p>
        </motion.div>
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
// TARGETING WINDOW — radial 24-hour clock of disclosure activity
// ============================================================================
function TargetingWindow({ hourDistribution, mostVulnerablePeriod, nighttimeRatio }: {
  hourDistribution: number[];
  mostVulnerablePeriod: string;
  nighttimeRatio: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isInView) { const t = setTimeout(() => setRevealed(true), 200); return () => clearTimeout(t); }
  }, [isInView]);

  if (!hourDistribution?.length) return null;

  const max = Math.max(...hourDistribution, 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Clock geometry
  const SIZE = 260;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const innerR = 48;  // hollow centre
  const outerMaxR = 112; // max spoke length

  function hourToAngle(h: number) {
    // 0h = top (−π/2), clockwise
    return (h / 24) * Math.PI * 2 - Math.PI / 2;
  }

  function wedgePath(h: number, count: number) {
    const norm = count / max;
    const spokeR = innerR + norm * (outerMaxR - innerR);
    const angleStart = hourToAngle(h) - (Math.PI / 24) * 0.7;
    const angleEnd = hourToAngle(h) + (Math.PI / 24) * 0.7;
    const x1 = cx + Math.cos(angleStart) * innerR;
    const y1 = cy + Math.sin(angleStart) * innerR;
    const x2 = cx + Math.cos(angleStart) * spokeR;
    const y2 = cy + Math.sin(angleStart) * spokeR;
    const x3 = cx + Math.cos(angleEnd) * spokeR;
    const y3 = cy + Math.sin(angleEnd) * spokeR;
    const x4 = cx + Math.cos(angleEnd) * innerR;
    const y4 = cy + Math.sin(angleEnd) * innerR;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${spokeR.toFixed(2)} ${spokeR.toFixed(2)} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)} L ${x4.toFixed(2)} ${y4.toFixed(2)} A ${innerR} ${innerR} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  }

  function wedgeColor(h: number, count: number) {
    const isLate = h <= 4 || h === 23;
    const norm = count / max;
    if (isLate && norm > 0.05) return `rgba(190,40,30,${0.4 + norm * 0.55})`;
    if (norm > 0.55) return `rgba(170,90,0,${0.35 + norm * 0.35})`;
    if (norm > 0.1) return `rgba(26,24,20,${0.12 + norm * 0.2})`;
    return 'rgba(26,24,20,0.06)';
  }

  // Cardinal labels
  const cardinals = [
    { h: 0, label: '12a' }, { h: 6, label: '6a' },
    { h: 12, label: '12p' }, { h: 18, label: '6p' },
  ];

  // Late-night arc path (23–4h shaded zone)
  const lateStart = hourToAngle(23);
  const lateEnd = hourToAngle(4) + Math.PI / 24;
  const lx1 = cx + Math.cos(lateStart) * innerR;
  const ly1 = cy + Math.sin(lateStart) * innerR;
  const lx2 = cx + Math.cos(lateStart) * outerMaxR;
  const ly2 = cy + Math.sin(lateStart) * outerMaxR;
  const lx3 = cx + Math.cos(lateEnd) * outerMaxR;
  const ly3 = cy + Math.sin(lateEnd) * outerMaxR;
  const lx4 = cx + Math.cos(lateEnd) * innerR;
  const ly4 = cy + Math.sin(lateEnd) * innerR;
  const lateArcPath = `M ${lx1.toFixed(2)} ${ly1.toFixed(2)} L ${lx2.toFixed(2)} ${ly2.toFixed(2)} A ${outerMaxR} ${outerMaxR} 0 0 1 ${lx3.toFixed(2)} ${ly3.toFixed(2)} L ${lx4.toFixed(2)} ${ly4.toFixed(2)} A ${innerR} ${innerR} 0 0 0 ${lx1.toFixed(2)} ${ly1.toFixed(2)} Z`;

  return (
    <div ref={ref} style={{ marginBottom: 'clamp(2rem, 5vw, 3rem)' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Disclosure pattern by hour
        </p>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.65, maxWidth: 520 }}>
          When you opened up. Each wedge is one hour of the day — sized by message volume. The red zone is 11pm–4am: the window of lowest emotional guard and highest disclosure density.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* Clock SVG */}
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ flexShrink: 0, overflow: 'visible' }}>
          {/* Late-night zone background */}
          <path d={lateArcPath} fill="rgba(190,40,30,0.06)" />

          {/* Outer ring guide */}
          <circle cx={cx} cy={cy} r={outerMaxR} fill="none" stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="2 4" />
          {/* Mid ring guide */}
          <circle cx={cx} cy={cy} r={(innerR + outerMaxR) / 2} fill="none" stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="1 6" opacity={0.5} />
          {/* Inner ring */}
          <circle cx={cx} cy={cy} r={innerR} fill={PALETTE.bgPanel} stroke={PALETTE.border} strokeWidth={0.5} />

          {/* Wedges */}
          {hours.map((h, i) => {
            const count = hourDistribution[h] ?? 0;
            if (count === 0) return null;
            return (
              <motion.path
                key={h}
                d={wedgePath(h, count)}
                fill={wedgeColor(h, count)}
                initial={{ opacity: 0, scale: 0 }}
                animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                transition={{ duration: 0.5, delay: (i / 24) * 0.6, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: `${cx}px ${cy}px` } as React.CSSProperties}
              />
            );
          })}

          {/* Cardinal tick marks */}
          {cardinals.map(({ h, label }) => {
            const angle = hourToAngle(h);
            const tickR = outerMaxR + 8;
            const lblR = outerMaxR + 20;
            return (
              <g key={h}>
                <line
                  x1={(cx + Math.cos(angle) * (outerMaxR + 2)).toFixed(2)}
                  y1={(cy + Math.sin(angle) * (outerMaxR + 2)).toFixed(2)}
                  x2={(cx + Math.cos(angle) * tickR).toFixed(2)}
                  y2={(cy + Math.sin(angle) * tickR).toFixed(2)}
                  stroke={PALETTE.inkFaint} strokeWidth={0.75}
                />
                <text
                  x={(cx + Math.cos(angle) * lblR).toFixed(2)}
                  y={(cy + Math.sin(angle) * lblR + 3).toFixed(2)}
                  textAnchor="middle"
                  style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: 'rgba(26,24,20,0.45)', letterSpacing: '0.08em' }}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Centre stat */}
          <motion.g initial={{ opacity: 0 }} animate={revealed ? { opacity: 1 } : {}} transition={{ delay: 0.9 }}>
            <text x={cx} y={cy - 8} textAnchor="middle"
              style={{ fontFamily: TYPE.serif, fontSize: '18px', fill: PALETTE.red, letterSpacing: '-0.02em' }}>
              {Math.round(nighttimeRatio * 100)}%
            </text>
            <text x={cx} y={cy + 9} textAnchor="middle"
              style={{ fontFamily: TYPE.mono, fontSize: '7px', fill: PALETTE.inkFaint, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              late-night
            </text>
          </motion.g>

          {/* Late night label */}
          <motion.text
            x={(cx + Math.cos(hourToAngle(1.5)) * (outerMaxR + 28)).toFixed(2)}
            y={(cy + Math.sin(hourToAngle(1.5)) * (outerMaxR + 28) + 3).toFixed(2)}
            textAnchor="middle"
            initial={{ opacity: 0 }} animate={revealed ? { opacity: 1 } : {}} transition={{ delay: 1 }}
            style={{ fontFamily: TYPE.mono, fontSize: '8px', fill: PALETTE.red, letterSpacing: '0.12em', textTransform: 'uppercase' } as React.CSSProperties}
          >
            vulnerable
          </motion.text>
        </svg>

        {/* Callout stats */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Peak window</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {mostVulnerablePeriod}
            </p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Late-night share</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', color: PALETTE.red, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {Math.round(nighttimeRatio * 100)}%
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, marginTop: '0.3rem', lineHeight: 1.5 }}>
              of all messages sent 12am–5am
            </p>
          </div>
          <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', fontStyle: 'italic', color: PALETTE.inkMuted, lineHeight: 1.65, borderLeft: `2px solid ${PALETTE.red}`, paddingLeft: '0.85rem' }}>
            Late-night messages carry the highest concentration of sensitive disclosure. This is when emotional defences are lowest — and when exposed data would be most revealing.
          </p>
        </div>
      </div>
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
