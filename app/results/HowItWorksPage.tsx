'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence, PageFooter } from './DashboardLayout';

// ============================================================================
// HOW IT WORKS — Act IV, page 07
// ============================================================================

const C = {
  training: { base: 'rgba(99,102,241,0.85)',  faint: 'rgba(99,102,241,0.10)', muted: 'rgba(99,102,241,0.45)' },
  unlearn:  { base: 'rgba(190,40,30,0.92)',   faint: 'rgba(190,40,30,0.10)',  muted: 'rgba(190,40,30,0.45)'  },
  consent:  { base: 'rgba(22,130,80,0.88)',   faint: 'rgba(22,130,80,0.10)',  muted: 'rgba(22,130,80,0.45)'  },
  gdpr:     { base: 'rgba(190,120,0,0.90)',   faint: 'rgba(190,120,0,0.10)',  muted: 'rgba(190,120,0,0.45)'  },
};

// ============================================================================
// SECTION 1 — STEP EXPLAINER
// ============================================================================
const TRAINING_STEPS = [
  {
    n: '01', title: 'You type a sentence',
    body: 'You write something personal — a worry, a relationship, a belief. That sentence enters the model as a stream of numbers.',
    example: '"I\'ve been feeling really anxious about my job situation."',
    color: C.training, exampleColor: C.training,
  },
  {
    n: '02', title: 'It passes through the network',
    body: 'The sentence travels through hundreds of layers of mathematical operations. Each layer transforms the meaning into numbers — called activations — that encode patterns.',
    example: null, color: C.training, exampleColor: C.training,
  },
  {
    n: '03', title: 'The network adjusts its weights',
    body: 'The model compares its output to what it expected. The error ripples backwards — gradient descent — nudging billions of parameters by tiny fractions.',
    example: null, color: C.training, exampleColor: C.training,
  },
  {
    n: '04', title: 'The sentence disappears',
    body: 'The original text is not stored anywhere. There is no file, no record, no copy. What remains is the adjustment — invisibly distributed across billions of numbers.',
    example: '"I\'ve been feeling really anxious..." → gone. The weight changes → permanent.',
    color: C.unlearn, exampleColor: C.unlearn,
  },
];

function TrainingStepExplainer() {
  const [active, setActive] = useState(0);
  const step = TRAINING_STEPS[active];
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TRAINING_STEPS.map((s, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '0.45rem 0.9rem',
            border: `1px solid ${active === i ? s.color.base : PALETTE.border}`,
            background: active === i ? s.color.faint : 'none',
            color: active === i ? s.color.base : PALETTE.inkFaint,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>{s.n}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          <div style={{ borderLeft: `3px solid ${step.color.base}`, paddingLeft: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: step.color.base, marginBottom: '0.5rem' }}>Step {step.n}</p>
            <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.2vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>{step.title}</h3>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560 }}>{step.body}</p>
          </div>
          {step.example && (
            <div style={{ background: step.exampleColor.faint, border: `1px solid ${step.exampleColor.muted}`, padding: 'clamp(0.75rem, 2vw, 1.1rem) clamp(1rem, 2.5vw, 1.4rem)', fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', fontStyle: 'italic', color: step.exampleColor.base, lineHeight: 1.6 }}>
              {step.example}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1.75rem' }}>
        {TRAINING_STEPS.map((s, i) => <div key={i} style={{ height: '2px', flex: 1, background: i <= active ? s.color.base : PALETTE.border, transition: 'background 0.3s' }} />)}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
        <button onClick={() => setActive(v => Math.max(0, v - 1))} disabled={active === 0} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.45rem 0.9rem', border: `1px solid ${PALETTE.border}`, background: 'none', color: active === 0 ? PALETTE.inkFaint : PALETTE.ink, cursor: active === 0 ? 'not-allowed' : 'pointer' }}>← Prev</button>
        <button onClick={() => setActive(v => Math.min(TRAINING_STEPS.length - 1, v + 1))} disabled={active === TRAINING_STEPS.length - 1} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.45rem 0.9rem', border: `1px solid ${PALETTE.border}`, background: 'none', color: active === TRAINING_STEPS.length - 1 ? PALETTE.inkFaint : PALETTE.ink, cursor: active === TRAINING_STEPS.length - 1 ? 'not-allowed' : 'pointer' }}>Next →</button>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 2 — MACHINE UNLEARNING DEMO
// ============================================================================
const GRID_W = 22;
const GRID_H = 12;
const TOTAL_CELLS = GRID_W * GRID_H;

function buildContaminated(): Set<number> {
  const cells = new Set<number>();
  const seeds = [5,17,43,89,120,155,203,247,198,61,33,178,222,87,144,9,260,186,73,231,108,55,167,215,28,93,140,195,47,238];
  seeds.forEach(s => {
    cells.add(s % TOTAL_CELLS);
    cells.add((s + GRID_W + 3) % TOTAL_CELLS);
    cells.add((s + GRID_W * 2 - 5) % TOTAL_CELLS);
  });
  return cells;
}
const CONTAMINATED = buildContaminated();

type UnlearnPhase = 'idle' | 'scanning' | 'failed';

function MachineUnlearningDemo() {
  const [phase, setPhase] = useState<UnlearnPhase>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [highlightedCells, setHighlightedCells] = useState<Set<number>>(new Set());
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startScan = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    setScanProgress(0);
    setHighlightedCells(new Set());
    let progress = 0;
    const found = new Set<number>();
    scanRef.current = setInterval(() => {
      progress += 3;
      setScanProgress(progress);
      const threshold = Math.floor((progress / 100) * TOTAL_CELLS);
      for (let i = 0; i < threshold; i++) { if (CONTAMINATED.has(i)) found.add(i); }
      setHighlightedCells(new Set(found));
      if (progress >= 100) {
        clearInterval(scanRef.current!);
        setTimeout(() => setPhase('failed'), 400);
      }
    }, 40);
  }, [phase]);

  const reset = () => {
    if (scanRef.current) clearInterval(scanRef.current);
    setPhase('idle'); setScanProgress(0); setHighlightedCells(new Set());
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: PALETTE.border, marginBottom: '2rem' }}>
        {[
          { label: 'Parameters in GPT-4', value: '~1.8 trillion' },
          { label: 'Clusters influenced by one message', value: `${CONTAMINATED.size} of ${TOTAL_CELLS}` },
          { label: 'Clean deletion boundary', value: 'Does not exist' },
        ].map(item => (
          <div key={item.label} style={{ background: PALETTE.bgPanel, padding: 'clamp(0.75rem, 2vw, 1.1rem)' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.35rem' }}>{item.label}</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: C.unlearn.base }}>{item.value}</p>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Parameter space (simplified) — each cell = a parameter cluster
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, gap: '2px', marginBottom: '1.5rem', userSelect: 'none' }}>
        {Array.from({ length: TOTAL_CELLS }, (_, i) => {
          const isHighlighted = highlightedCells.has(i);
          const isScanLine = phase === 'scanning' && Math.abs(i - Math.floor((scanProgress / 100) * TOTAL_CELLS)) < GRID_W;
          let bg = PALETTE.bgElevated;
          if (isScanLine) bg = C.gdpr.faint;
          if (isHighlighted && phase !== 'idle') bg = phase === 'failed' ? 'rgba(190,40,30,0.18)' : C.unlearn.faint;
          let border = `1px solid ${PALETTE.border}`;
          if (isHighlighted && phase !== 'idle') border = `1px solid ${C.unlearn.muted}`;
          return <div key={i} style={{ height: '10px', background: bg, border, transition: 'background 0.12s', borderRadius: '1px' }} />;
        })}
      </div>

      {phase === 'scanning' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: C.gdpr.base, textTransform: 'uppercase' }}>Scanning parameters for influence boundary…</span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint }}>{scanProgress}%</span>
          </div>
          <div style={{ height: '2px', background: PALETTE.border }}>
            <div style={{ height: '100%', background: C.gdpr.base, width: `${scanProgress}%`, transition: 'width 0.04s linear' }} />
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', minHeight: '5rem', display: 'flex', alignItems: 'center' }}>
            {CONTAMINATED.size} of {TOTAL_CELLS} parameter clusters influenced by a single training message
          </motion.p>
        )}
        {phase === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ minHeight: '5rem' }}>
            <div style={{ border: `1px solid ${C.unlearn.base}`, background: C.unlearn.faint, padding: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '1rem' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: C.unlearn.base, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Deletion attempt failed</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.15rem)', color: PALETTE.ink, lineHeight: 1.7, marginBottom: '0.75rem' }}>
                The influence of this message is distributed across <strong>{CONTAMINATED.size} non-contiguous parameter clusters</strong>. There is no clean boundary to cut around. You cannot remove what was never discretely inserted.
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', color: PALETTE.inkMuted, lineHeight: 1.65, fontStyle: 'italic' }}>
                Approximate unlearning methods exist — but they degrade the model unpredictably and cannot provide the legal guarantees that deletion requires. The only alternative is retraining from scratch.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: PALETTE.border }}>
              {[
                { label: 'Cost to retrain GPT-4', value: '~$100M+', sub: 'OpenAI estimates' },
                { label: 'Time to retrain', value: '3–6 months', sub: 'On existing hardware' },
                { label: 'GDPR deletion deadline', value: '30 days', sub: 'Article 17 requirement' },
              ].map(item => (
                <div key={item.label} style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{item.label}</p>
                  <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)', color: C.unlearn.base }}>{item.value}</p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, letterSpacing: '0.1em' }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={startScan} disabled={phase !== 'idle'} style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', border: `1px solid ${phase === 'idle' ? C.unlearn.base : PALETTE.border}`, background: phase === 'idle' ? C.unlearn.faint : 'none', color: phase === 'idle' ? C.unlearn.base : PALETTE.inkFaint, cursor: phase === 'idle' ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          {phase === 'idle' ? 'Request deletion' : phase === 'scanning' ? 'Scanning…' : 'Deletion failed'}
        </button>
        {phase !== 'idle' && (
          <button onClick={reset} style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.6rem 1.25rem', border: `1px solid ${PALETTE.borderHover}`, background: 'none', color: PALETTE.ink, cursor: 'pointer' }}>Reset</button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 3 — CONSENT / GDPR GAP
// ============================================================================
const COOKIE_STEPS = [
  { label: 'You browse a website', detail: 'Cookies track page visits, clicks, dwell time', ok: true },
  { label: 'Data stored in a database', detail: 'A discrete, bounded record with your ID on it', ok: true },
  { label: 'You request deletion', detail: 'GDPR Article 17 — right to erasure', ok: true },
  { label: 'Record located and deleted', detail: 'The database deletes the row. Done.', ok: true },
  { label: 'Reversible. Clean.', detail: 'The system returns to its pre-collection state.', ok: true },
];
const AI_STEPS = [
  { label: 'You type a message', detail: 'Conversational input enters the training pipeline', ok: true },
  { label: 'Dissolved into weights', detail: 'The text is gone — only the adjustment remains', ok: false },
  { label: 'You request deletion', detail: 'GDPR Article 17 — right to erasure invoked', ok: null },
  { label: 'Nothing to locate', detail: 'There is no discrete record. The adjustment is everywhere.', ok: false },
  { label: 'Deletion is impossible.', detail: 'The consent mechanism cannot reach what it governs.', ok: false },
];

function GdprGapDiagram() {
  const [cookieStep, setCookieStep] = useState(-1);
  const [aiStep, setAiStep] = useState(-1);
  const [showGap, setShowGap] = useState(false);
  const cookieDone = cookieStep >= COOKIE_STEPS.length - 1;
  const aiDone = aiStep >= AI_STEPS.length - 1;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(1rem, 3vw, 2rem)', marginBottom: '1.5rem' }}>
        {/* Cookie column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${C.consent.muted}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.consent.base, flexShrink: 0 }} />
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.consent.base, textTransform: 'uppercase' }}>Cookie model</p>
          </div>
          {COOKIE_STEPS.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0.22 }} animate={{ opacity: cookieStep >= i ? 1 : 0.22 }} transition={{ duration: 0.3 }} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.9rem', alignItems: 'flex-start' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${cookieStep >= i ? C.consent.base : PALETTE.border}`, background: cookieStep >= i ? C.consent.faint : 'none', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.consent.base, fontFamily: TYPE.mono }}>
                {cookieStep >= i ? '✓' : ''}
              </div>
              <div>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.82rem, 1.3vw, 0.92rem)', color: PALETTE.ink, marginBottom: '0.15rem' }}>{step.label}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, letterSpacing: '0.1em', lineHeight: 1.5 }}>{step.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${C.unlearn.muted}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.unlearn.base, flexShrink: 0 }} />
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.unlearn.base, textTransform: 'uppercase' }}>AI training model</p>
          </div>
          {AI_STEPS.map((step, i) => {
            const dotColor = step.ok === false ? C.unlearn.base : step.ok === null ? C.gdpr.base : C.consent.base;
            const dotBg = step.ok === false ? C.unlearn.faint : step.ok === null ? C.gdpr.faint : C.consent.faint;
            const mark = step.ok === false ? '✗' : step.ok === null ? '?' : '✓';
            return (
              <motion.div key={i} initial={{ opacity: 0.22 }} animate={{ opacity: aiStep >= i ? 1 : 0.22 }} transition={{ duration: 0.3 }} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.9rem', alignItems: 'flex-start' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${aiStep >= i ? dotColor : PALETTE.border}`, background: aiStep >= i ? dotBg : 'none', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: dotColor, fontFamily: TYPE.mono }}>
                  {aiStep >= i ? mark : ''}
                </div>
                <div>
                  <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.82rem, 1.3vw, 0.92rem)', color: aiStep >= i && step.ok === false ? C.unlearn.base : PALETTE.ink, fontStyle: step.ok === false ? 'italic' : 'normal', marginBottom: '0.15rem' }}>{step.label}</p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, letterSpacing: '0.1em', lineHeight: 1.5 }}>{step.detail}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showGap && cookieDone && aiDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ border: `1px solid ${C.unlearn.base}`, background: C.unlearn.faint, padding: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.unlearn.base, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Structural gap — the finding</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.75, maxWidth: 600 }}>
              Cookie consent was designed for reversible behavioural tracking. AI training is irreversible by architecture. The right to erasure — GDPR Article 17 — cannot be fulfilled for training data, because there is nothing discrete left to erase. This is not a policy failure. It is an architectural one.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button onClick={() => setCookieStep(v => Math.min(COOKIE_STEPS.length - 1, v + 1))} disabled={cookieDone} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.55rem 1rem', border: `1px solid ${cookieDone ? PALETTE.border : C.consent.base}`, background: cookieDone ? 'none' : C.consent.faint, color: cookieDone ? PALETTE.inkFaint : C.consent.base, cursor: cookieDone ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {cookieDone ? 'Cookie: complete ✓' : 'Step through cookie →'}
        </button>
        <button onClick={() => setAiStep(v => Math.min(AI_STEPS.length - 1, v + 1))} disabled={aiDone || !cookieDone} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.55rem 1rem', border: `1px solid ${aiDone ? PALETTE.border : !cookieDone ? PALETTE.border : C.unlearn.base}`, background: aiDone ? 'none' : !cookieDone ? 'none' : C.unlearn.faint, color: aiDone || !cookieDone ? PALETTE.inkFaint : C.unlearn.base, cursor: aiDone || !cookieDone ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {aiDone ? 'AI model: failed ✗' : 'Step through AI →'}
        </button>
        {cookieDone && aiDone && (
          <button onClick={() => setShowGap(v => !v)} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.55rem 1rem', border: `1px solid ${showGap ? C.unlearn.base : PALETTE.borderHover}`, background: showGap ? C.unlearn.faint : 'none', color: showGap ? C.unlearn.base : PALETTE.ink, cursor: 'pointer', transition: 'all 0.2s' }}>
            {showGap ? 'Hide gap' : 'Show structural gap'}
          </button>
        )}
        <button onClick={() => { setCookieStep(-1); setAiStep(-1); setShowGap(false); }} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.55rem 1rem', border: `1px solid ${PALETTE.border}`, background: 'none', color: PALETTE.inkFaint, cursor: 'pointer' }}>Reset</button>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION WRAPPER
// ============================================================================
function PageSection({ number, title, body, children, accent, finding }: {
  number: string; title: string; body: string; children: React.ReactNode;
  accent: { base: string; faint: string; muted: string }; finding?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65 }} style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '28px', height: '2px', background: accent.base }} />
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: accent.base, textTransform: 'uppercase' }}>{number}</p>
      </div>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', marginBottom: '0.75rem', lineHeight: 1.2 }}>{title}</h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>{body}</p>
      {children}
      {finding && (
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.4 }} style={{ marginTop: 'clamp(2rem, 4vw, 3rem)', borderLeft: `3px solid ${accent.base}`, background: accent.faint, padding: 'clamp(1rem, 2.5vw, 1.5rem)', paddingLeft: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: accent.base, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Finding</p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.75 }}>{finding}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export default function HowItWorksPage({ setPage }: { setPage: (p: string) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 'clamp(4rem, 10vw, 8rem)' }}>

      {/* Hero */}
      <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}
        style={{ padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15, duration: 0.6 }} style={{ marginBottom: '0.75rem' }}>
          <ActLabel roman="IV" title="The Mechanism" pageLabel="07 / How It Works" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.25, duration: 0.8 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.04em', lineHeight: 0.97, marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)', maxWidth: '18ch' }}>
          Why deletion<br />is not reversal.
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5, duration: 0.7 }}>
          <ThreadSentence>
            Consent was designed for reversible systems. AI training is not reversible.
            That gap is not a policy failure. It is an architectural one.
          </ThreadSentence>
        </motion.div>

        {/* Section pills */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.7, duration: 0.6 }}
          style={{ display: 'flex', gap: '1px', background: PALETTE.border, marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
          {[
            { label: 'Section 1', title: 'How training works', color: C.training },
            { label: 'Section 2', title: 'Why machine unlearning fails', color: C.unlearn },
            { label: 'Section 3', title: 'Why consent can\'t fix it', color: C.consent },
          ].map(item => (
            <div key={item.label} style={{ flex: 1, background: PALETTE.bgPanel, padding: 'clamp(0.75rem, 2vw, 1rem)', borderTop: `2px solid ${item.color.base}` }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.2em', color: item.color.base, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{item.label}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.82rem, 1.3vw, 0.92rem)', color: PALETTE.ink }}>{item.title}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <PageSection
        number="Section 1 — The mechanism"
        title="How training works"
        body="A sentence you type does not get filed somewhere. It dissolves. The model adjusts its billions of parameters in response to your input — and then the input is gone. What remains is the adjustment, invisibly distributed, impossible to locate."
        accent={C.training}
        finding="Training does not store what it learns from. It converts data into weight adjustments across billions of parameters. The original data cannot be located — so it cannot be removed."
      >
        <TrainingStepExplainer />
      </PageSection>

      <PageSection
        number="Section 2 — The impossibility"
        title="Why machine unlearning doesn't work"
        body="When you request deletion under GDPR Article 17, the assumption is that a record exists, can be located, and can be removed. For AI training data, all three assumptions are wrong. Press 'Request deletion' to see what happens."
        accent={C.unlearn}
        finding="Machine unlearning research exists. But even its proponents acknowledge it cannot provide the guarantees legal deletion requires. Approximate methods degrade model performance unpredictably. True deletion requires retraining from scratch — at a cost that makes compliance structurally impossible within GDPR's 30-day window."
      >
        <MachineUnlearningDemo />
      </PageSection>

      <PageSection
        number="Section 3 — The structural gap"
        title="Why consent frameworks can't fix it"
        body="Cookie consent was designed for a specific kind of data: discrete records that can be found and deleted. AI training produces something entirely different. Step through both models below to see exactly where the framework breaks."
        accent={C.consent}
      >
        <GdprGapDiagram />
      </PageSection>

      {/* Sources */}
      <div style={{ paddingTop: 'clamp(2rem, 4vw, 3rem)', borderTop: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 2.4 }}>
          <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Cooper et al. (2024) — Machine Unlearning Doesn't Do What You Think, arXiv:2412.06966</a>
          {' · '}
          <a href="https://www.publicaffairsbooks.com/titles/shoshana-zuboff/the-age-of-surveillance-capitalism/9781610395694/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Zuboff (2019) — The Age of Surveillance Capitalism</a>
          {' · '}
          <a href="https://doi.org/10.1162/DAED_a_00113" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Nissenbaum (2011) — A Contextual Approach to Privacy Online, Daedalus 140(4)</a>
          {' · '}
          <a href="https://arxiv.org/abs/2402.09716" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Gumusel, Zhou & Sanfilippo (2024) — User Privacy Harms in Conversational AI</a>
        </p>
      </div>

      <PageFooter
        statement="Cookie consent was designed for reversible systems. AI training is not reversible. That gap is not a policy failure. It is an architectural one."
        followOn="The architecture makes the consent framework inapplicable. The terms you agreed to did not describe a system this page explains."
        navItems={[
          { page: 'permanent', act: 'ACT III / 05', label: 'Why deletion fails',  body: 'What this architecture means for your right to erasure — and why it cannot be fulfilled.' },
          { page: 'terms',    act: 'ACT III / 06', label: 'What you agreed to',  body: 'The terms that authorised training on your data — and how they changed.' },
          { page: 'understand',act: 'ACT IV / 08', label: 'Test the inference',  body: 'Watch the extraction happen in real time on your own words.' },
        ]}
        endLabel="End of technical record."
        setPage={setPage}
      />
    </div>
  );
}
