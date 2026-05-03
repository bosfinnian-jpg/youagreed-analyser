'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence, PageFooter } from './DashboardLayout';
import type { DeepAnalysis } from '@/lib/analysis/deepParser';

// ============================================================================
// CANNOT BE DELETED
// ============================================================================

const C = {
  flow:    { base: 'rgba(99,102,241,0.85)',  faint: 'rgba(99,102,241,0.10)', muted: 'rgba(99,102,241,0.45)' },
  weight:  { base: 'rgba(190,40,30,0.92)',   faint: 'rgba(190,40,30,0.10)',  muted: 'rgba(190,40,30,0.45)'  },
  legal:   { base: 'rgba(190,120,0,0.90)',   faint: 'rgba(190,120,0,0.10)',  muted: 'rgba(190,120,0,0.45)'  },
  consent: { base: 'rgba(22,130,80,0.88)',   faint: 'rgba(22,130,80,0.10)',  muted: 'rgba(22,130,80,0.45)'  },
};

function SectionLabel({ children, color = PALETTE.redMuted }: { children: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
      <div style={{ width: 24, height: '1.5px', background: color }} />
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color, textTransform: 'uppercase' }}>{children}</p>
    </div>
  );
}

export function RetainedTag({ variant = 'inline' }: { variant?: 'inline' | 'block' }) {
  if (variant === 'block') {
    return <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase', display: 'block', marginTop: '0.35rem' }}>● Retained in model weights</span>;
  }
  return <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginLeft: '0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>● Retained</span>;
}

// ============================================================================
// ONE-WAY FLOW DIAGRAM
// ============================================================================
function OneWayFlow({ setPage }: { setPage: (p: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => setPhase(3), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isInView]);

  const stages = [
    { id: 'type',     label: 'You type',        sub: 'Interface' },
    { id: 'send',     label: 'Transmitted',      sub: 'OpenAI servers' },
    { id: 'store',    label: 'Stored',           sub: 'Up to 30 days' },
    { id: 'select',   label: 'Batched',          sub: 'Training selection' },
    { id: 'gradient', label: 'Gradient descent', sub: 'Mathematics computed' },
    { id: 'weights',  label: 'Weights shift',    sub: 'Permanent' },
  ];

  const W = 860; const H = 110;
  const stageX = stages.map((_, i) => 40 + (i / (stages.length - 1)) * 780);
  const baseY = 55;

  return (
    <div ref={ref} style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <style>{`@media (max-width: 640px) { .cbd-2col { grid-template-columns: 1fr !important; } .cbd-3col { grid-template-columns: 1fr !important; } .pipeline-svg { min-width: 500px; } }`}</style>
      <SectionLabel color={C.flow.base}>The pipeline</SectionLabel>

      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <svg className="pipeline-svg" viewBox={`0 0 ${W} ${H + 20}`} width="100%" style={{ display: 'block', overflow: 'visible', minWidth: 500 }}>
          <motion.line x1={40} y1={baseY} x2={820} y2={baseY}
            stroke={PALETTE.border} strokeWidth={1}
            initial={{ pathLength: 0 }} animate={phase >= 1 ? { pathLength: 1 } : {}}
            transition={{ duration: 1.2, ease: 'easeInOut' }} />

          {phase >= 1 && phase < 2 && [0, 0.22, 0.44, 0.66].map((offset, i) => (
            <motion.circle key={i} r={3} fill={C.flow.base} opacity={0.7}
              initial={{ cx: 40 }} animate={{ cx: 820 }}
              transition={{ duration: 1.6, delay: offset, repeat: Infinity, ease: 'linear' }}
              style={{ cy: baseY } as React.CSSProperties} />
          ))}

          {stages.map((stage, i) => {
            const x = stageX[i];
            const isLast = i === stages.length - 1;
            const nodeColor = isLast ? C.weight.base : i >= 4 ? C.flow.base : PALETTE.inkFaint;
            return (
              <motion.g key={stage.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 + i * 0.15, duration: 0.4 }}
                style={{ transformOrigin: `${x}px ${baseY}px` } as React.CSSProperties}>
                <circle cx={x} cy={baseY} r={isLast ? 11 : 7}
                  fill={isLast ? C.weight.faint : 'none'}
                  stroke={nodeColor} strokeWidth={isLast ? 1.5 : 1} />
                {isLast && <circle cx={x} cy={baseY} r={4} fill={C.weight.base} />}
                <text x={x} y={baseY - 20} textAnchor="middle"
                  style={{ fontFamily: TYPE.serif, fontSize: '11px', fill: isLast ? C.weight.base : PALETTE.ink, letterSpacing: '-0.01em' }}>
                  {stage.label}
                </text>
                <text x={x} y={baseY + 24} textAnchor="middle"
                  style={{ fontFamily: TYPE.mono, fontSize: '8.5px', fill: 'rgba(26,24,20,0.38)', letterSpacing: '0.06em' }}>
                  {stage.sub}
                </text>
              </motion.g>
            );
          })}

          {phase >= 2 && (
            <motion.circle cx={stageX[5]} cy={baseY} r={24}
              fill="none" stroke={C.weight.base} strokeWidth={1}
              initial={{ opacity: 0.8, scale: 0.5 }} animate={{ opacity: 0, scale: 2.5 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ transformOrigin: `${stageX[5]}px ${baseY}px` } as React.CSSProperties} />
          )}

          {/* Return path — blocked */}
          <motion.line x1={820} y1={baseY + 30} x2={60} y2={baseY + 30}
            stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="3 5"
            initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }} />

          {phase >= 3 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <text x={390} y={baseY + 48} textAnchor="middle"
                style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: C.weight.base, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                NO RETURN FUNCTION
              </text>
              <line x1={200} y1={baseY + 30} x2={580} y2={baseY + 30} stroke={C.weight.base} strokeWidth={1.5} opacity={0.4} />
            </motion.g>
          )}
        </svg>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>See how extraction works in detail</span>
        <button onClick={() => setPage('how-it-works')} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.redMuted, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', textDecoration: 'underline', textDecorationColor: 'rgba(190,40,30,0.3)', padding: 0 }}>
          How it works ↗
        </button>
      </motion.div>
    </div>
  );
}

// ============================================================================
// WHAT WEIGHTS ARE — dissolving text into parameter grid
// Fixed: label now below the grid with a paddingTop gap so it never overlaps
// ============================================================================
function WhatWeightsAre({ setPage }: { setPage: (p: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [dissolved, setDissolved] = useState(false);

  useEffect(() => {
    if (isInView) { const t = setTimeout(() => setDissolved(true), 900); return () => clearTimeout(t); }
  }, [isInView]);

  const COLS = 14; const ROWS = 6;
  const weights = Array.from({ length: ROWS * COLS }, (_, i) => ({
    val: (Math.sin(i * 0.37 + 1.2) * 0.94).toFixed(4),
    highlight: i % 7 === 0 || i % 11 === 0,
  }));

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <SectionLabel color={C.weight.base}>What "in the weights" means</SectionLabel>

      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
        Your data did not go into a box. It dissolved into the mathematics of the system. There is no row to delete. Your influence is distributed across every parameter — everywhere and nowhere simultaneously.
      </p>

      {/* Grid with sentence that dissolves in — text is above, never overlapping */}
      <div style={{ marginBottom: '0.75rem' }}>
        {/* Sentence floats above the grid, then fades out */}
        <div style={{ height: '2.5rem', display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <motion.p
            initial={{ opacity: 0.9 }}
            animate={dissolved ? { opacity: 0 } : { opacity: 0.9 }}
            transition={{ duration: 1.2, ease: 'easeIn' }}
            style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.9rem, 1.4vw, 1rem)', color: PALETTE.ink, fontStyle: 'italic', letterSpacing: '-0.01em' }}
          >
            "I've been feeling really anxious lately..."
          </motion.p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: '1px', background: PALETTE.border, border: `1px solid ${PALETTE.border}`,
        }}>
          {weights.map((w, i) => (
            <motion.div key={i}
              animate={dissolved ? {
                background: w.highlight ? C.weight.faint : PALETTE.bgPanel,
                color: w.highlight ? C.weight.base : 'rgba(26,24,20,0.3)',
              } : { background: PALETTE.bgPanel, color: 'rgba(26,24,20,0.25)' }}
              transition={{ duration: 0.6, delay: dissolved ? (i % 13) * 0.03 : 0 }}
              style={{ padding: '4px 2px', fontFamily: TYPE.mono, fontSize: 'clamp(7px, 0.9vw, 9px)', textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {w.val}
            </motion.div>
          ))}
        </div>

        {/* Label sits cleanly below the grid */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={dissolved ? { opacity: 1 } : {}}
          transition={{ delay: 1.4, duration: 0.8 }}
          style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.weight.base, textTransform: 'uppercase', marginTop: '0.6rem' }}>
          ● Absorbed — indistinguishable from all other training data
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Understand how the analysis was built</span>
        <button onClick={() => setPage('understand')} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.redMuted, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', textDecoration: 'underline', textDecorationColor: 'rgba(190,40,30,0.3)', padding: 0 }}>
          The inference model ↗
        </button>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MACHINE UNLEARNING — with interactive comparison
// ============================================================================
function MachineUnlearning() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [activeMethod, setActiveMethod] = useState<'exact' | 'approximate' | null>(null);

  const methods = [
    {
      id: 'exact' as const,
      label: 'Exact unlearning',
      tag: 'Not implemented',
      tagColor: C.legal,
      body: 'Retrain the model from scratch without your data. Guaranteed removal. Computationally prohibitive — training GPT-4 cost an estimated $100 million and took months of continuous compute time.',
      detail: 'This is the only method that provides a mathematical guarantee of removal. It is also the only method no production AI company currently implements at scale for individual deletion requests. The economics make it impossible.',
      verdict: 'Technically possible. Economically non-viable. Not offered.',
    },
    {
      id: 'approximate' as const,
      label: 'Approximate unlearning',
      tag: 'Provably incomplete',
      tagColor: C.weight,
      body: 'Use algorithmic shortcuts to simulate the effect of retraining without actually retraining. Fast, cheap, and available — but fundamentally limited.',
      detail: 'Cooper et al. (2024, NeurIPS) demonstrate that approximate unlearning methods cannot provide the guarantees legal deletion requires. They may reduce influence — but they cannot eliminate it. The model retains traces that no audit can rule out.',
      verdict: 'Implemented by some systems. Cannot satisfy GDPR Art.17.',
    },
  ];

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <SectionLabel>Machine unlearning: the state of the science</SectionLabel>

      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 580, marginBottom: '1.75rem' }}>
        There are two technical approaches to removing training data from a model. Click each one.
      </p>

      {/* Interactive method cards */}
      <div className="cbd-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: PALETTE.border, marginBottom: '1.5rem' }}>
        {methods.map(method => {
          const isActive = activeMethod === method.id;
          return (
            <div key={method.id} style={{ background: PALETTE.bgPanel }}>
              <button
                onClick={() => setActiveMethod(isActive ? null : method.id)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  padding: 'clamp(1rem, 3vw, 1.75rem)',
                  borderTop: `3px solid ${isActive ? method.tagColor.base : PALETTE.border}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: method.tagColor.base, textTransform: 'uppercase' }}>{method.label}</p>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.15em', color: method.tagColor.base, background: method.tagColor.faint, padding: '0.2rem 0.5rem', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{method.tag}</span>
                </div>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.7 }}>{method.body}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.12em', color: method.tagColor.muted, marginTop: '0.75rem', textTransform: 'uppercase' }}>
                  {isActive ? '− collapse' : '+ what this means'}
                </p>
              </button>
              <AnimatePresence>
                {isActive && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden', borderTop: `1px solid ${method.tagColor.faint}` }}>
                    <div style={{ padding: 'clamp(1rem, 2.5vw, 1.5rem)', background: method.tagColor.faint }}>
                      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.ink, lineHeight: 1.7, marginBottom: '0.75rem' }}>{method.detail}</p>
                      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: method.tagColor.base, textTransform: 'uppercase' }}>■ {method.verdict}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Cooper pullquote — single clean block, no double lines */}
      <div style={{ borderLeft: `3px solid ${C.weight.base}`, background: C.weight.faint, padding: 'clamp(1rem, 2.5vw, 1.5rem)', paddingLeft: 'clamp(1.25rem, 3vw, 2rem)' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.75, marginBottom: '0.75rem' }}>
          "Removing information from a model's training data does not guarantee the model cannot reproduce or reflect that information. There is no production system, at this scale, that implements unlearning."
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          Cooper et al., NeurIPS 2024 — Machine Unlearning Doesn't Do What You Think (arXiv:2412.06966)
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// RETRAINING BAR
// ============================================================================
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

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <SectionLabel>The only real alternative: full model retraining</SectionLabel>

      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, marginBottom: '2rem' }}>
        The only way to guarantee removal of your data is to retrain the model from scratch — excluding your conversations. For GPT-4, that takes approximately 90 days of continuous compute. If OpenAI began retraining at the exact moment you started reading this page, this is how far along they would be.
      </p>

      <div className="cbd-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: PALETTE.border, marginBottom: '2rem' }}>
        {[
          { value: '~90 days', label: 'Full GPT-4 retraining time' },
          { value: '$100M+', label: 'Estimated compute cost' },
          { value: '1.8T', label: 'Parameters to update' },
        ].map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.2 + i * 0.1 }}
            style={{ background: PALETTE.bgPanel, padding: '1.4rem', borderTop: `2px solid ${C.weight.muted}` }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: C.weight.base, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.4rem' }}>{f.value}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{f.label}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Retraining progress, from the moment you opened this page</span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '13px', color: C.weight.base, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>{pct.toFixed(7)}%</span>
        </div>
        <div style={{ height: '8px', background: PALETTE.bgElevated, border: `1px solid ${PALETTE.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(pct, 100)}%`, background: C.weight.muted, transition: 'width 0.08s linear' }} />
        </div>
      </div>

      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: C.weight.muted, letterSpacing: '0.06em' }}>
        New training data is added continuously. This date is a fiction.
      </p>
    </motion.div>
  );
}

// ============================================================================
// LEGAL GAP — interactive row reveal
// ============================================================================
function LegalGap() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [openRow, setOpenRow] = useState<number | null>(null);

  const rows = [
    {
      right: 'Right to erasure (Art. 17 UK GDPR)',
      openai: 'Delete your account and conversation history',
      gap: 'Account deletion does not alter model weights. Data retained 30 days post-deletion. Model unchanged.',
      detail: "Article 17 creates a right to erasure but contains explicit exemptions for data that has been de-identified and incorporated into statistical models. OpenAI's April 2026 Privacy Policy (s.4) contains this carve-out verbatim.",
    },
    {
      right: 'Right to know your data is processed (Art. 13)',
      openai: 'Privacy Policy disclosure that data may be used for training',
      gap: 'Disclosure does not explain: permanent embedding in weights; impossibility of removal; inability to quantify your contribution.',
      detail: "Nissenbaum's transparency paradox: a policy short enough to read cannot be detailed enough to be meaningful. A policy detailed enough to be meaningful cannot be read.",
    },
    {
      right: 'Right to object to processing (Art. 21)',
      openai: 'Opt-out toggle in settings for future training',
      gap: 'Opt-out applies to new conversations only. Data already used for training is already embedded. There is no retroactive opt-out.',
      detail: 'The opt-out toggle was introduced in response to the Italian Garante ban in 2023. It does not and cannot reach data already embedded in trained weights.',
    },
  ];

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <SectionLabel color={C.legal.base}>The legal gap</SectionLabel>

      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '2rem' }}>
        In March 2023, Italy's Garante temporarily banned ChatGPT — OpenAI could not demonstrate that users' data, once embedded in model weights, could be erased on request. OpenAI added opt-out controls and the ban was lifted. In December 2024, a €15M fine was issued, subsequently annulled on procedural grounds. The underlying technical problem was never resolved.
      </p>

      {/* Interactive table */}
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <div style={{ minWidth: 500 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: PALETTE.border, marginBottom: '1px' }}>
            {['Your legal right', 'What OpenAI offers', 'The gap'].map((h, i) => (
              <div key={i} style={{ background: PALETTE.bgPanel, padding: '0.7rem 1rem', borderTop: `2px solid ${i === 2 ? C.legal.base : PALETTE.border}` }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: i === 2 ? C.legal.base : PALETTE.inkFaint, textTransform: 'uppercase' }}>{h}</p>
              </div>
            ))}
          </div>
          {rows.map((row, i) => (
            <div key={i}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: PALETTE.border, marginBottom: '1px', cursor: 'pointer' }}
                onClick={() => setOpenRow(openRow === i ? null : i)}>
                <div style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.ink, lineHeight: 1.5 }}>{row.right}</p>
                </div>
                <div style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.inkMuted, lineHeight: 1.5 }}>{row.openai}</p>
                </div>
                <div style={{ background: C.legal.faint, padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: C.legal.base, lineHeight: 1.6, letterSpacing: '0.04em' }}>{row.gap}</p>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: C.legal.muted, flexShrink: 0 }}>{openRow === i ? '−' : '+'}</span>
                </div>
              </div>
              <AnimatePresence>
                {openRow === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden', marginBottom: '1px' }}>
                    <div style={{ background: C.legal.faint, padding: '0.9rem 1rem', borderTop: `1px solid ${C.legal.muted}` }}>
                      <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, lineHeight: 1.7, fontStyle: 'italic' }}>{row.detail}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CONSENT FAILURE
// ============================================================================
function ConsentFailure() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <SectionLabel color={C.consent.base}>What you were told vs what you agreed to</SectionLabel>

      <div style={{ borderLeft: `3px solid ${C.consent.muted}`, paddingLeft: 'clamp(1.25rem, 3vw, 2rem)' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, marginBottom: '0.75rem' }}>
          Disclosure without comprehension is not consent. The more complex the system, the more precise the disclosure must be. AI training is diffuse, irreversible, and invisible. It exceeds the complexity threshold at which any current disclosure mechanism is adequate.
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          Nissenbaum, 2011 — A Contextual Approach to Privacy Online, Daedalus 140(4):32–48
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// YOUR DATA SPECIFICALLY
// ============================================================================
function YourDataSpecifically({ analysis }: { analysis: DeepAnalysis | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}
      style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <SectionLabel>What this means for your data specifically</SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {[
          { num: '01', text: 'You cannot request the removal of your data from trained model weights. OpenAI cannot technically fulfil such a request even if they wanted to.' },
          { num: '02', text: 'You cannot know what specifically your conversations contributed. The contribution is distributed. It cannot be quantified or localised.' },
          { num: '03', text: 'The model that learned from your conversations will continue operating for the foreseeable future. Your influence outlasts your account.' },
        ].map((fact, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: '3rem 1fr', background: PALETTE.bgPanel, padding: 'clamp(1rem, 2.5vw, 1.5rem)', gap: '1rem', alignItems: 'start' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', paddingTop: '4px' }}>{fact.num}</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.ink, lineHeight: 1.7 }}>{fact.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function CannotBeDeletedPage({ results, setPage }: { results: any; setPage: (p: any) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const messages = results?.totalUserMessages || 0;
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 'clamp(4rem, 10vw, 8rem)' }}>
      <style>{`
        @media (max-width: 640px) {
          .cbd-2col { grid-template-columns: 1fr !important; }
          .cbd-3col { grid-template-columns: 1fr !important; }
          .pipeline-svg { min-width: 400px !important; }
        }
      `}</style>

      {/* Hero */}
      <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}
        style={{ padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15, duration: 0.6 }} style={{ marginBottom: '0.75rem' }}>
          <ActLabel roman="III" title="The Permanence" pageLabel="05 / Permanent" />
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.25, duration: 0.7 }}>
          <ThreadSentence>Deleting your account and removing yourself from the model are not the same thing.</ThreadSentence>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.3, duration: 0.8 }} style={{ marginBottom: '2rem' }}>
          {messages > 0 ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(4rem, 12vw, 8rem)', fontWeight: 400, color: PALETTE.red, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {messages.toLocaleString()}
              </span>
              <div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block' }}>messages</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', display: 'block', marginTop: '3px' }}>all permanent</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(4rem, 12vw, 8rem)', fontWeight: 400, color: PALETTE.red, letterSpacing: '-0.04em', lineHeight: 1 }}>∞</span>
              <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', display: 'block' }}>no return function</span>
            </div>
          )}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.55, duration: 0.8 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.35rem)', color: PALETTE.ink, lineHeight: 1.75, maxWidth: 580 }}>
          Not because OpenAI refuses to act. Because gradient descent has no reverse function. Deleting your account removes your conversations from your account view. It does not remove your contribution from the model's weights. One is a database query. The other is an unsolved problem in machine learning research.
        </motion.p>
      </motion.div>

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
          { page: 'terms',        act: 'ACT III / 06', label: 'What you agreed to',      body: 'The terms that made this legal. Parsed against what they actually permit.' },
          { page: 'resist',       act: 'ACT V / 09',   label: 'What you can do',         body: 'Three actions that limit what happens from this point forward.' },
          { page: 'understand',   act: 'ACT IV / 08',  label: 'How the inference works', body: 'The methodology behind how your patterns were extracted and classified.' },
          { page: 'how-it-works', act: 'ACT IV / 07',  label: 'Why deletion fails',      body: 'The architecture that makes reversal impossible.' },
        ]}
        endLabel="End of permanence record."
        setPage={setPage}
      />
    </div>
  );
}
