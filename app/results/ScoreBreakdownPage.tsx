'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// SCORE BREAKDOWN PAGE
// How the exposure index was calculated. What it means. What changes it.
// ============================================================================

interface ScoreFactor {
  label: string;
  contribution: number;
  max: number;
  explanation: string;
  category: 'disclosure' | 'behavioural' | 'volume' | 'commercial';
}

// ── Band definitions ─────────────────────────────────────────────────────────

const BANDS = [
  {
    range: [0, 19],
    label: 'Minimal exposure',
    sublabel: 'Low extractable signal',
    description: 'Your conversations contain limited personally identifiable information or sensitive disclosure. Either your usage is recent, your messages are largely task-focused, or the content does not constitute high-value training data for commercial inference systems. This does not mean you are not profiled — it means the current corpus yields limited signal.',
    color: 'rgba(60,140,80,0.9)',
    bgColor: 'rgba(60,140,80,0.06)',
  },
  {
    range: [20, 39],
    label: 'Low–moderate exposure',
    sublabel: 'Extractable behavioural patterns',
    description: 'Your conversations contain enough consistent behavioural signal to support basic profiling: usage patterns, topic clusters, and writing style are identifiable. This is sufficient for personality inference and some demographic prediction. The risk level here is not catastrophic — but it is active and non-trivial.',
    color: 'rgba(160,120,20,0.9)',
    bgColor: 'rgba(160,120,20,0.06)',
  },
  {
    range: [40, 59],
    label: 'Moderate exposure',
    sublabel: 'Significant commercial data value',
    description: 'Your profile contains substantial extractable information: likely includes life events, emotional disclosure, named individuals, or persistent behavioural signatures. This is the range where commercial profiling becomes accurate and where breach exposure would be materially damaging. The data has real market value in the behavioural data ecosystem.',
    color: 'rgba(190,110,20,0.9)',
    bgColor: 'rgba(190,110,20,0.06)',
  },
  {
    range: [60, 79],
    label: 'High exposure',
    sublabel: 'Actionable profile — multiple high-risk signals',
    description: 'Multiple high-severity disclosures, sustained emotional patterns, and a significant corpus of identifiable personal data. This profile is commercially actionable without further processing — it can be slotted directly into targeting, insurance, or screening systems. The people you named in your conversations are also exposed at this level.',
    color: PALETTE.amber,
    bgColor: 'rgba(220,130,30,0.06)',
  },
  {
    range: [80, 100],
    label: 'Severe exposure',
    sublabel: 'Maximum extractable risk — irreversibility is total',
    description: 'The corpus contains the full range of high-risk disclosure categories: acute mental health signals, financial vulnerability, named third parties, confessional content, and sustained dependency patterns. At this level, the model weights derived from your conversations constitute a detailed and exploitable behavioural signature. Deletion of your account does not change this.',
    color: PALETTE.red,
    bgColor: 'rgba(190,40,30,0.05)',
  },
];

function getBand(score: number) {
  return BANDS.find(b => score >= b.range[0] && score <= b.range[1]) ?? BANDS[BANDS.length - 1];
}

// ── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; description: string }> = {
  disclosure: {
    label: 'Disclosure',
    description: 'Direct personal information you provided — life events, confessions, named individuals. The highest-weight category because content is specific, irrecoverable, and commercially valuable.',
  },
  behavioural: {
    label: 'Behavioural',
    description: 'Patterns inferred from how and when you write — anxiety signals, late-night usage, dependency trajectory. Not what you said but how you said it, and when.',
  },
  commercial: {
    label: 'Commercial',
    description: 'Segments your usage maps onto in data broker taxonomy. Weighted by how dangerous each segment is — mental health and financial distress segments carry the highest multipliers.',
  },
  volume: {
    label: 'Volume × Intimacy',
    description: 'Raw message count adjusted for intimacy level. Volume alone is not damaging — but high volume at high intimacy creates cumulative profiling depth that compounds all other factors.',
  },
};

// ── Factor bar ───────────────────────────────────────────────────────────────

function FactorBar({ factor, index, maxPossible }: {
  factor: ScoreFactor;
  index: number;
  maxPossible: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const fillPct = (factor.contribution / maxPossible) * 100;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -10 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.06 }}
      style={{ marginBottom: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
        <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.ink }}>
          {factor.label}
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em', color: factor.contribution > 0 ? PALETTE.red : PALETTE.inkFaint }}>
          +{factor.contribution} / {factor.max}
        </span>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: '3px', background: 'rgba(26,24,20,0.08)', marginBottom: '0.5rem' }}>
        {/* Max possible (faint) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, height: '100%',
          width: `${(factor.max / maxPossible) * 100}%`,
          background: 'rgba(26,24,20,0.10)',
        }} />
        {/* Actual contribution */}
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${fillPct}%` } : {}}
          transition={{ duration: 0.75, delay: index * 0.06 + 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            background: factor.contribution > factor.max * 0.7 ? PALETTE.red : PALETTE.ink,
          }}
        />
      </div>

      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.08em',
        color: PALETTE.inkFaint, lineHeight: 1.6,
      }}>
        {factor.explanation}
      </p>
    </motion.div>
  );
}

// ── Score ring (static) ──────────────────────────────────────────────────────

function ScoreRing({ score, band }: { score: number; band: typeof BANDS[number] }) {
  const ref = useRef<SVGCircleElement>(null);
  const isInView = useInView({ current: ref.current?.ownerSVGElement ?? null }, { once: true });
  const R = 80;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);

  return (
    <div style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
        <circle cx={100} cy={100} r={R} fill="none" stroke="rgba(26,24,20,0.08)" strokeWidth={5} />
        <motion.circle
          ref={ref}
          cx={100} cy={100} r={R}
          fill="none"
          stroke={band.color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
          transform="rotate(-90 100 100)"
        />
        <text x={100} y={95} textAnchor="middle"
          style={{ fontFamily: TYPE.serif, fontSize: '38px', fill: band.color }}>
          {score}
        </text>
        <text x={100} y={114} textAnchor="middle"
          style={{ fontFamily: TYPE.mono, fontSize: '8px', fill: 'rgba(26,24,20,0.40)', letterSpacing: '0.2em' }}>
          / 100
        </text>
        <text x={100} y={130} textAnchor="middle"
          style={{ fontFamily: TYPE.mono, fontSize: '7.5px', fill: band.color, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          EXPOSURE INDEX
        </text>
      </svg>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function ScoreBreakdownPage({
  results,
  setPage,
}: {
  results: any;
  setPage: (p: string) => void;
}) {
  const score: number = results?.privacyScore ?? 0;
  const factors: ScoreFactor[] = results?.scoreFactors ?? [];
  const band = getBand(score);
  const pad = 'clamp(1.5rem, 6vw, 5rem)';

  // Group factors by category
  const grouped = (Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).reduce((acc, cat) => {
    acc[cat] = factors.filter(f => f.category === cat);
    return acc;
  }, {} as Record<string, ScoreFactor[]>);

  const TOTAL_MAX = 40 + 15 + 20 + 10 + 12 + 8 + 12 + 8 + 25 + 15; // 165
  const rawTotal = factors.reduce((s, f) => s + f.contribution, 0);

  return (
    <div
      className="dash-page-inner"
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: `0 ${pad}`,
        paddingBottom: 'clamp(6rem, 14vw, 12rem)',
      }}
    >
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          padding: 'clamp(4rem, 10vw, 7rem) 0 clamp(3rem, 6vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 7vw, 5rem)',
        }}
      >
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.redMuted, textTransform: 'uppercase',
          marginBottom: 'clamp(2rem, 4vw, 3rem)',
        }}>
          Exposure index · Score methodology
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 'clamp(2rem, 5vw, 5rem)',
          alignItems: 'center',
        }}>
          <ScoreRing score={score} band={band} />

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: 400, color: PALETTE.ink,
                letterSpacing: '-0.03em', lineHeight: 1.05,
                marginBottom: '0.75rem',
              }}
            >
              {band.label}.
            </motion.h1>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
              color: band.color, textTransform: 'uppercase',
              marginBottom: '1rem',
            }}>
              {band.sublabel}
            </p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
              color: PALETTE.inkMuted, lineHeight: 1.75,
              maxWidth: '52ch',
            }}>
              {band.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Band scale */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 'clamp(4rem, 8vw, 7rem)' }}
      >
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.28em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}>
          Scale · Where you sit
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
          {BANDS.map((b) => {
            const isCurrent = score >= b.range[0] && score <= b.range[1];
            return (
              <div
                key={b.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: '1.5rem',
                  padding: 'clamp(1rem, 2vw, 1.4rem) clamp(1rem, 2.5vw, 1.75rem)',
                  background: isCurrent ? b.bgColor : PALETTE.bgPanel,
                  borderLeft: isCurrent ? `3px solid ${b.color}` : `3px solid transparent`,
                  alignItems: 'start',
                }}
              >
                <div>
                  <span style={{
                    fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em',
                    color: isCurrent ? b.color : PALETTE.inkFaint, fontWeight: isCurrent ? 700 : 400,
                  }}>
                    {b.range[0]}–{b.range[1]}
                  </span>
                  {isCurrent && (
                    <span style={{
                      display: 'block',
                      fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em',
                      color: b.color, textTransform: 'uppercase', marginTop: '2px',
                    }}>
                      ← you
                    </span>
                  )}
                </div>
                <div>
                  <p style={{
                    fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
                    color: isCurrent ? PALETTE.ink : PALETTE.inkMuted,
                    fontWeight: 400, marginBottom: '0.25rem',
                  }}>
                    {b.label}
                  </p>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.12em',
                    color: isCurrent ? b.color : PALETTE.inkFaint, textTransform: 'uppercase',
                  }}>
                    {b.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Factor breakdown by category */}
      <div style={{ marginBottom: 'clamp(4rem, 8vw, 7rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.28em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
          marginBottom: 'clamp(2rem, 4vw, 3rem)',
        }}>
          Factor breakdown · {rawTotal} raw points → {score}/100 after curve
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: 'clamp(2.5rem, 5vw, 4rem) clamp(3rem, 6vw, 5rem)' }}>
          {(Object.entries(CATEGORY_META) as [string, { label: string; description: string }][]).map(([cat, meta]) => {
            const catFactors = grouped[cat] ?? [];
            const catTotal = catFactors.reduce((s, f) => s + f.contribution, 0);
            return (
              <div key={cat}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  marginBottom: '0.6rem',
                  paddingBottom: '0.8rem',
                  borderBottom: `1px solid ${PALETTE.border}`,
                }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: catTotal > 0 ? PALETTE.ink : PALETTE.inkFaint }}>
                    {catTotal} pts
                  </span>
                </div>
                <p style={{
                  fontFamily: TYPE.serif, fontSize: 'clamp(0.9rem, 1.4vw, 1rem)',
                  color: PALETTE.inkFaint, lineHeight: 1.7,
                  marginBottom: catFactors.length > 0 ? '1.5rem' : '0',
                }}>
                  {meta.description}
                </p>

                {catFactors.length === 0 ? (
                  <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
                    No signal detected
                  </p>
                ) : (
                  catFactors.map((f, i) => (
                    <FactorBar key={f.label} factor={f} index={i} maxPossible={TOTAL_MAX} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{
          padding: 'clamp(2rem, 4vw, 3rem)',
          borderLeft: `3px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}
      >
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          How the score is calculated
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
          color: PALETTE.inkMuted, lineHeight: 1.8, marginBottom: '1rem', maxWidth: '60ch',
        }}>
          Ten independent factors are assessed across four categories: disclosure, behavioural, commercial, and volume. Each factor has a defined maximum contribution (total possible: 165 points). The raw sum is normalised to 0–100 using a square-root compression curve, which distributes scores across the full range rather than clustering at the top.
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
          color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '60ch',
        }}>
          Compression is intentional: without it, any user with more than a few months of conversations would score near 100, making differentiation meaningless. The curve means a score of 80 represents genuinely severe exposure — not simply heavy usage.
        </p>
      </motion.div>

      {/* Back nav */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setPage('overview')}
          style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: PALETTE.inkFaint,
            background: 'none', border: `1px solid ${PALETTE.border}`,
            padding: '0.6rem 1.2rem', cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = PALETTE.ink; e.currentTarget.style.borderColor = PALETTE.ink; }}
          onMouseLeave={e => { e.currentTarget.style.color = PALETTE.inkFaint; e.currentTarget.style.borderColor = PALETTE.border; }}
        >
          ← Back to overview
        </button>
        <button
          onClick={() => setPage('risk')}
          style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: PALETTE.bgPanel,
            background: PALETTE.ink, border: 'none',
            padding: '0.6rem 1.2rem', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          What this enables →
        </button>
      </div>
    </div>
  );
}
