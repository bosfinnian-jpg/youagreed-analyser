'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence, PageFooter } from './DashboardLayout';
import type { DeepAnalysis } from '@/lib/analysis/deepParser';

// ============================================================================
// CANNOT BE DELETED — the central argument of the site
// The thesis: machine unlearning is unsolved. Deletion of your account is not
// deletion from the model. The GDPR right to erasure cannot be technically
// fulfilled. Your conversations are inside the weights now.
// ============================================================================

// ============================================================================
// RETAINED TAG — reusable stamp for extracted data items
// ============================================================================
export function RetainedTag({ variant = 'inline' }: { variant?: 'inline' | 'block' }) {
  if (variant === 'block') {
    return (
      <span style={{
        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em',
        color: PALETTE.redMuted, textTransform: 'uppercase',
        display: 'block', marginTop: '0.35rem',
      }}>
        ● Retained in model weights
      </span>
    );
  }
  return (
    <span style={{
      fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
      color: PALETTE.redMuted, textTransform: 'uppercase',
      marginLeft: '0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap',
    }}>
      ● Retained
    </span>
  );
}

// ============================================================================
// ONE-WAY FLOW DIAGRAM — animated SVG pipeline
// ============================================================================
function OneWayFlow({ setPage }: { setPage: (p: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [phase, setPhase] = useState(0); // 0=idle, 1=flowing, 2=absorbed, 3=blocked

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => setPhase(3), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isInView]);

  const stages = [
    { id: 'type', label: 'You type', sub: 'Interface' },
    { id: 'send', label: 'Transmitted', sub: 'OpenAI servers' },
    { id: 'store', label: 'Stored', sub: 'Up to 30 days' },
    { id: 'select', label: 'Batched', sub: 'Training selection' },
    { id: 'gradient', label: 'Gradient descent', sub: 'Mathematics computed' },
    { id: 'weights', label: 'Weights shift', sub: 'Permanent', red: true },
  ];

  const W = 860; const H = 120;
  const stageX = stages.map((_, i) => 40 + (i / (stages.length - 1)) * 780);
  const baseY = 60;

  return (
    <div ref={ref} style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)' }}>
      <style>{`
        @media (max-width: 640px) {
          .cbd-2col { grid-template-columns: 1fr !important; }
          .cbd-3col { grid-template-columns: 1fr !important; }
          .pipeline-svg { min-width: 500px; }
        }
      `}</style>

      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
        The pipeline
      </p>

      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <svg className="pipeline-svg" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible', minWidth: 500 }}>

          {/* Main pipeline track */}
          <motion.line x1={40} y1={baseY} x2={720} y2={baseY}
            stroke={PALETTE.border} strokeWidth={1}
            initial={{ pathLength: 0 }} animate={phase >= 1 ? { pathLength: 1 } : {}}
            transition={{ duration: 1.2, ease: 'easeInOut' }} />

          {/* Flowing particles along track */}
          {phase >= 1 && phase < 2 && [0, 0.22, 0.44, 0.66].map((offset, i) => (
            <motion.circle key={i} r={3} fill={PALETTE.red} opacity={0.6}
              initial={{ cx: 40 }} animate={{ cx: 720 }}
              transition={{ duration: 1.6, delay: offset, repeat: Infinity, ease: 'linear' }}
              style={{ cy: baseY } as React.CSSProperties} />
          ))}

          {/* Stage nodes */}
          {stages.map((stage, i) => {
            const x = stageX[i];
            const isLast = i === stages.length - 1;
            const color = isLast ? PALETTE.red : PALETTE.ink;
            const bgFill = isLast ? 'rgba(190,40,30,0.06)' : PALETTE.bgPanel;
            return (
              <motion.g key={stage.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 + i * 0.15, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformOrigin: `${x}px ${baseY}px` } as React.CSSProperties}
              >
                {/* Node circle */}
                <circle cx={x} cy={baseY} r={isLast ? 10 : 7}
                  fill={bgFill} stroke={isLast ? PALETTE.red : PALETTE.border} strokeWidth={isLast ? 1.5 : 1} />
                {isLast && <circle cx={x} cy={baseY} r={4} fill={PALETTE.red} />}
                {/* Label above */}
                <text x={x} y={baseY - 18} textAnchor="middle"
                  style={{ fontFamily: TYPE.serif, fontSize: '11px', fill: color, letterSpacing: '-0.01em' }}>
                  {stage.label}
                </text>
                {/* Sub below */}
                <text x={x} y={baseY + 22} textAnchor="middle"
                  style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: 'rgba(26,24,20,0.4)', letterSpacing: '0.06em' }}>
                  {stage.sub}
                </text>
              </motion.g>
            );
          })}

          {/* Absorbed flash on weights node */}
          {phase >= 2 && (
            <motion.circle cx={stageX[5]} cy={baseY} r={24}
              fill="none" stroke={PALETTE.red} strokeWidth={1}
              initial={{ opacity: 0.8, scale: 0.5 }} animate={{ opacity: 0, scale: 2.5 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ transformOrigin: `${stageX[5]}px ${baseY}px` } as React.CSSProperties} />
          )}

          {/* Return path — blocked */}
          <motion.line x1={720} y1={baseY + 28} x2={60} y2={baseY + 28}
            stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="3 5"
            initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }} />

          {/* Arrow pointing left — blocked */}
          {phase >= 3 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <text x={390} y={baseY + 42} textAnchor="middle"
                style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: PALETTE.red, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                NO RETURN FUNCTION
              </text>
              {/* Strike through the dashed line */}
              <line x1={200} y1={baseY + 28} x2={580} y2={baseY + 28}
                stroke={PALETTE.red} strokeWidth={1.5} opacity={0.4} />
              <line x1={210} y1={baseY + 23} x2={570} y2={baseY + 33}
                stroke={PALETTE.red} strokeWidth={1} opacity={0.25} />
            </motion.g>
          )}
        </svg>
      </div>

      {/* Contextual link to how-it-works */}
      <motion.div initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}
        style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          See how the extraction works in detail
        </span>
        <button onClick={() => setPage('how-it-works')} style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.redMuted,
          background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
          textDecoration: 'underline', textDecorationColor: 'rgba(190,40,30,0.3)', padding: 0,
        }}>
          How it works ↗
        </button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// WHAT WEIGHTS ARE — animated dissolution grid
// ============================================================================
function WhatWeightsAre({ setPage }: { setPage: (p: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [dissolved, setDissolved] = useState(false);

  useEffect(() => {
    if (isInView) { const t = setTimeout(() => setDissolved(true), 800); return () => clearTimeout(t); }
  }, [isInView]);

  // Generate a grid of plausible weight values
  const COLS = 14; const ROWS = 6;
  const weights = Array.from({ length: ROWS * COLS }, (_, i) => ({
    val: (Math.sin(i * 0.37 + 1.2) * 0.94).toFixed(4),
    highlight: i % 7 === 0 || i % 11 === 0,
  }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        What "in the weights" means
      </p>

      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
        Your data did not go into a box. It dissolved into the mathematics of the system. There is no row to delete. Your influence is distributed across every parameter — everywhere and nowhere simultaneously.
      </p>

      {/* Weight grid — numbers that "absorb" a fragment of text */}
      <div style={{ position: 'relative', marginBottom: '1.75rem', overflow: 'hidden' }}>

        {/* Sentence that dissolves in */}
        <motion.div
          initial={{ opacity: 0.9, y: 0 }}
          animate={dissolved ? { opacity: 0, y: -8, scale: 0.97 } : { opacity: 0.9 }}
          transition={{ duration: 1.2, ease: 'easeIn' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 4, pointerEvents: 'none',
            background: 'rgba(244,242,237,0.85)',
            padding: '0.5rem 1rem',
            fontFamily: TYPE.serif, fontSize: 'clamp(0.9rem, 1.5vw, 1rem)',
            color: PALETTE.ink, whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            borderBottom: `1px solid ${PALETTE.red}40`,
          }}
        >
          "I've been feeling really anxious lately..."
        </motion.div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: '1px',
          background: PALETTE.border,
          border: `1px solid ${PALETTE.border}`,
          position: 'relative', zIndex: 2,
        }}>
          {weights.map((w, i) => (
            <motion.div
              key={i}
              initial={{ background: PALETTE.bgPanel, color: 'rgba(26,24,20,0.25)' }}
              animate={dissolved ? {
                background: w.highlight ? 'rgba(190,40,30,0.08)' : PALETTE.bgPanel,
                color: w.highlight ? 'rgba(190,40,30,0.7)' : 'rgba(26,24,20,0.3)',
              } : {}}
              transition={{ duration: 0.6, delay: dissolved ? (i % 13) * 0.03 : 0 }}
              style={{
                padding: '4px 2px',
                fontFamily: TYPE.mono,
                fontSize: 'clamp(7px, 0.9vw, 9px)',
                textAlign: 'center',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {w.val}
            </motion.div>
          ))}
        </div>

        {/* Overlay label after dissolution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={dissolved ? { opacity: 1 } : {}}
          transition={{ delay: 1.4, duration: 0.8 }}
          style={{
            position: 'absolute', bottom: '-0.1rem', right: 0,
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
            color: PALETTE.red, textTransform: 'uppercase',
            zIndex: 5,
          }}
        >
          ● Absorbed — indistinguishable from all other training data
        </motion.div>
      </div>

      {/* Contextual link */}
      <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          Understand how the analysis was built
        </span>
        <button onClick={() => setPage('understand')} style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.redMuted,
          background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
          textDecoration: 'underline', textDecorationColor: 'rgba(190,40,30,0.3)', padding: 0,
        }}>
          The inference model ↗
        </button>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// SECTION — Machine unlearning impossibility
// ============================================================================
function MachineUnlearning() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        Machine unlearning: the state of the science
      </p>

      {/* Two approaches */}
      <div className="cbd-2col" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
        background: PALETTE.border, marginBottom: '2rem',
      }}>
        {[
          {
            label: 'Exact unlearning',
            body: 'Retrain the model from scratch without your data. Computationally prohibitive. Training GPT-4 cost an estimated $100 million and took months of compute time.',
            verdict: 'Not implemented',
            red: false,
          },
          {
            label: 'Approximate unlearning',
            body: 'Use algorithmic shortcuts to simulate the effect of retraining without actually retraining. Fast. Cheap. Available.',
            verdict: 'Provably incomplete',
            red: true,
          },
        ].map((approach, i) => (
          <div key={i} style={{ background: PALETTE.bgPanel, padding: 'clamp(1rem, 3vw, 1.75rem)' }}>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
              color: approach.red ? PALETTE.red : PALETTE.inkFaint,
              textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>{approach.label}</p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
              color: PALETTE.inkMuted, lineHeight: 1.7, marginBottom: '1rem',
            }}>{approach.body}</p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
              color: approach.red ? PALETTE.red : PALETTE.inkMuted,
              textTransform: 'uppercase',
            }}>■ {approach.verdict}</p>
          </div>
        ))}
      </div>

      {/* Cooper et al. pullquote */}
      <div style={{
        borderLeft: `3px solid ${PALETTE.red}`,
        paddingLeft: 'clamp(1.25rem, 3vw, 2rem)',
        marginBottom: '1.5rem',
      }}>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          color: PALETTE.ink, lineHeight: 1.75, marginBottom: '0.75rem',
        }}>
          "Removing information from a model's training data does not guarantee the model cannot reproduce or reflect that information. There is no production system, at this scale, that implements unlearning."
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          Cooper et al., 2024 — Machine Unlearning Doesn't Do What You Think (arXiv:2412.06966)
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SECTION — The legal gap
// ============================================================================
function LegalGap() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const rows = [
    {
      right: 'Right to erasure (Article 17 UK GDPR)',
      openai: 'Delete your account and conversation history',
      gap: 'Account deletion does not alter model weights. Data retained 30 days post-deletion for abuse monitoring. Model unchanged.',
    },
    {
      right: 'Right to know your data is being processed (Article 13)',
      openai: 'Privacy Policy disclosure that data may be used for training',
      gap: 'Disclosure does not explain: permanent embedding in weights; impossibility of removal; inability to quantify your contribution.',
    },
    {
      right: 'Right to object to processing (Article 21)',
      openai: 'Opt-out toggle in settings for future training',
      gap: 'Opt-out applies to new conversations only. Data already used for training is already embedded. There is no retroactive opt-out.',
    },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        The legal gap
      </p>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '2rem',
      }}>
        In March 2023, Italy's data protection authority (the Garante) temporarily banned ChatGPT. The concern: OpenAI could not demonstrate that users' personal data, once embedded in model weights, had been or could be erased on request. OpenAI added opt-out controls and the ban was lifted. In December 2024, the Garante issued a €15 million fine — subsequently annulled by the Court of Rome on procedural grounds. The underlying technical problem was never resolved.
      </p>

      {/* Rights vs reality table */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <div style={{ minWidth: 500 }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1px', background: PALETTE.border, marginBottom: '1px',
          }}>
            {['Your legal right', 'What OpenAI offers', 'The gap'].map((h, i) => (
              <div key={i} style={{ background: PALETTE.bgPanel, padding: '0.7rem 1rem' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{h}</p>
              </div>
            ))}
          </div>
          {/* Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1px', background: PALETTE.border, marginBottom: '1px',
              }}
            >
              <div style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, lineHeight: 1.55 }}>{row.right}</p>
              </div>
              <div style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, lineHeight: 1.55 }}>{row.openai}</p>
              </div>
              <div style={{ background: PALETTE.redFaint, padding: '0.9rem 1rem' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.red, lineHeight: 1.65, letterSpacing: '0.04em' }}>{row.gap}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* OpenAI's own words */}
    </motion.div>
  );
}

// ============================================================================
// SECTION — The consent failure
// ============================================================================
function ConsentFailure() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        What you were told and what you actually agreed to
      </p>

      {/* Nissenbaum */}
      <div style={{
        borderLeft: `3px solid ${PALETTE.border}`,
        paddingLeft: 'clamp(1.25rem, 3vw, 2rem)',
        marginBottom: '1.5rem',
      }}>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
          color: PALETTE.inkMuted, lineHeight: 1.75, marginBottom: '0.75rem',
        }}>
          Disclosure without comprehension is not consent. The more complex the system, the more precise the disclosure must be. AI training is diffuse, irreversible, and invisible. It exceeds the complexity threshold at which any current disclosure mechanism is adequate.
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          Nissenbaum, 2011 — A Contextual Approach to Privacy Online, Daedalus 140(4):32–48
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SECTION — Your data, specifically
// ============================================================================
function YourDataSpecifically({ analysis }: { analysis: DeepAnalysis | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        What this means for your data specifically
      </p>

      {/* The three facts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {[
          { num: '01', text: 'You cannot request the removal of your data from trained model weights. OpenAI cannot technically fulfil such a request even if they wanted to.' },
          { num: '02', text: 'You cannot know what specifically your conversations contributed. The contribution is distributed. It cannot be quantified or localised.' },
          { num: '03', text: 'The model that learned from your conversations will continue operating for the foreseeable future. Your influence outlasts your account.' },
        ].map((fact, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.1 }}
            style={{
              display: 'grid', gridTemplateColumns: '3rem 1fr',
              background: PALETTE.bgPanel, padding: 'clamp(1rem, 2.5vw, 1.5rem)',
              gap: '1rem', alignItems: 'start',
            }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', paddingTop: '4px' }}>{fact.num}</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.ink, lineHeight: 1.7 }}>{fact.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// CLOSING STATEMENT
// ============================================================================

// ── THE RETRAINING BAR ─────────────────────────────────────────────────────
// Pudding principle: show impossibility through time the reader can feel.
// 90 real days to retrain GPT-4. The bar counts up in actual seconds.
// It will always show 0.000%.

function RetrainingBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isInView) return;
    startRef.current = Date.now();
    const id = setInterval(() => { setElapsed((Date.now() - startRef.current!) / 1000); }, 80);
    return () => clearInterval(id);
  }, [isInView]);

  const RETRAIN_SECS = 90 * 24 * 3600;
  const pct = (elapsed / RETRAIN_SECS) * 100;
  const pctStr = pct.toFixed(7);

  // July 22 2026 = April 23 + 90 days
  const completionStr = '22 July 2026';

  const facts = [
    { value: '~90 days', label: 'Full GPT-4 retraining time' },
    { value: '$100M+', label: 'Estimated compute cost' },
    { value: '1.8T', label: 'Parameters to update' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        borderTop: `1px solid ${PALETTE.border}`,
        paddingTop: 'clamp(2.5rem, 5vw, 4rem)',
        marginTop: 'clamp(2.5rem, 5vw, 4rem)',
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
      }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        The only real alternative: full model retraining
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, marginBottom: '2.5rem' }}>
        The only way to guarantee removal of your data is to retrain the model from scratch — excluding your conversations. For GPT-4, that takes approximately 90 days of continuous compute. If OpenAI began retraining at the exact moment you started reading this page, this is how far along they would be.
      </p>

      <div className="cbd-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: PALETTE.border, marginBottom: '2rem' }}>
        {facts.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.2 + i * 0.1 }} style={{ background: PALETTE.bgPanel, padding: '1.4rem' }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.4rem' }}>{f.value}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{f.label}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
            Retraining progress, from the moment you opened this page
          </span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '13px', color: PALETTE.red, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
            {pctStr}%
          </span>
        </div>
        <div style={{ height: '8px', background: PALETTE.bgElevated, border: `1px solid ${PALETTE.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.min(pct, 100)}%`,
            background: `rgba(190,40,30,0.5)`,
            transition: 'width 0.08s linear',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.08em' }}>
          Est. completion if started now: <span style={{ color: PALETTE.inkMuted }}>{completionStr}</span>
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.redMuted, letterSpacing: '0.06em', fontStyle: 'italic' }}>
          New training data is added continuously. That date is a fiction.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function CannotBeDeletedPage({ results, setPage }: {
  results: any;
  setPage: (p: any) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const messages = results?.totalUserMessages || 0;
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{
      maxWidth: 1000, margin: '0 auto',
      padding: `0 ${pad}`,
      paddingBottom: 'clamp(4rem, 10vw, 8rem)',
    }}>
      <style>{`
        @media (max-width: 640px) {
          .cbd-2col { grid-template-columns: 1fr !important; }
          .cbd-3col { grid-template-columns: 1fr !important; }
          .cbd-table-3col { grid-template-columns: 1fr !important; }
          .cbd-table-3col > div + div { border-top: 1px dashed rgba(26,24,20,0.1); }
          .pipeline-svg { min-width: 400px !important; }
        }
      `}</style>
      {/* Hero */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
        style={{
          padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.6 }}
          style={{ marginBottom: '0.75rem' }}
        >
          <ActLabel roman="III" title="The Permanence" pageLabel="05 / Permanent" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.25, duration: 0.7 }}
        >
          <ThreadSentence>Deleting your account and removing yourself from the model are not the same thing.</ThreadSentence>
        </motion.div>

        {/* Hero number — message count or a fixed weight count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ marginBottom: '2rem' }}
        >
          {messages > 0 ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(4rem, 12vw, 8rem)',
                fontWeight: 400, color: PALETTE.red,
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {messages.toLocaleString()}
              </span>
              <div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block' }}>messages</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', display: 'block', marginTop: '3px' }}>all permanent</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(4rem, 12vw, 8rem)',
                fontWeight: 400, color: PALETTE.red,
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>∞</span>
              <div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', display: 'block' }}>no return function</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.55, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.35rem)',
            color: PALETTE.ink, lineHeight: 1.75, maxWidth: 580,
          }}
        >
          Not because OpenAI refuses to act. Because gradient descent has no reverse function. Deleting your account removes your conversations from your account view. It does not remove your contribution from the model's weights. One is a database query. The other is an unsolved problem in machine learning research.
        </motion.p>
      </motion.div>

      {/* Sections */}
      <OneWayFlow setPage={setPage} />
      <WhatWeightsAre setPage={setPage} />
      <MachineUnlearning />
      <RetrainingBar />
      <LegalGap />
      <ConsentFailure />
      <YourDataSpecifically analysis={results} />
      <PageFooter
        statement="You can delete your conversations. You cannot delete what they taught."
        followOn="This is not a policy failure. It is a consequence of how the technology works. The question that remains is whether the terms you agreed to were ever genuinely legible."
        navItems={[
          { page: 'terms',       act: 'ACT III / 06', label: 'What you agreed to',    body: 'The terms that made this legal. Parsed against what they actually permit.' },
          { page: 'understand',  act: 'ACT IV / 08',  label: 'How the inference works', body: 'The methodology behind how your patterns were extracted and classified.' },
          { page: 'how-it-works',act: 'ACT IV / 07',  label: 'Why deletion fails',    body: 'The architecture that makes reversal impossible — gradient descent and machine unlearning.' },
          { page: 'risk',        act: 'ACT II / 04',  label: 'What it enables',       body: 'The scenarios that become possible once this data exists.' },
        ]}
        endLabel="End of permanence record."
        setPage={setPage}
      />
    </div>
  );
}
