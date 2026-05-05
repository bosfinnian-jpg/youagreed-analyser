'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence, PageFooter } from '../../shared/layout/DashboardLayout';

// ============================================================================
// HOW IT WORKS - Act IV, page 07
// ============================================================================

const C = {
  training: { base: 'rgba(99,102,241,0.85)',  faint: 'rgba(99,102,241,0.10)', muted: 'rgba(99,102,241,0.45)' },
  unlearn:  { base: 'rgba(190,40,30,0.92)',   faint: 'rgba(190,40,30,0.10)',  muted: 'rgba(190,40,30,0.45)'  },
  consent:  { base: 'rgba(22,130,80,0.88)',   faint: 'rgba(22,130,80,0.10)',  muted: 'rgba(22,130,80,0.45)'  },
  gdpr:     { base: 'rgba(190,120,0,0.90)',   faint: 'rgba(190,120,0,0.10)',  muted: 'rgba(190,120,0,0.45)'  },
};

// ============================================================================
// NEURAL NETWORK - live SVG, animates per training step
// ============================================================================

const LAYERS = [1, 4, 5, 4, 1];
const LAYER_LABELS = ['Input', 'Layer 1', 'Layer 2', 'Layer 3', 'Output'];
const SVG_W = 560;
const SVG_H = 260;
const XS = [60, 168, 280, 392, 500];

interface NNode { id: string; x: number; y: number; layer: number; idx: number; }
interface NEdge { from: string; to: string; fi: number; ti: number; fl: number; }

function buildNet(): { nodes: NNode[]; edges: NEdge[] } {
  const nodes: NNode[] = [];
  const edges: NEdge[] = [];
  LAYERS.forEach((count, li) => {
    for (let i = 0; i < count; i++) {
      nodes.push({ id: `${li}-${i}`, x: XS[li], y: SVG_H / 2 - ((count - 1) * 44) / 2 + i * 44, layer: li, idx: i });
    }
  });
  for (let li = 0; li < LAYERS.length - 1; li++) {
    const from = nodes.filter(n => n.layer === li);
    const to   = nodes.filter(n => n.layer === li + 1);
    from.forEach((f, fi) => to.forEach((t, ti) => edges.push({ from: f.id, to: t.id, fi, ti, fl: li })));
  }
  return { nodes, edges };
}
const NET = buildNet();

// Which edges light up red during gradient pass (every 3rd)
const GRADIENT_EDGES = new Set(NET.edges.filter((_, i) => i % 3 !== 0).map(e => `${e.from}-${e.to}`));

type NetPhase = 'idle' | 'input' | 'forward' | 'gradient' | 'done';

function NeuralNetDiagram({ phase }: { phase: NetPhase }) {
  const [activeLayer, setActiveLayer] = useState(-1);
  const [showGradient, setShowGradient] = useState(false);
  const [faded, setFaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setActiveLayer(-1);
    setShowGradient(false);
    setFaded(false);

    if (phase === 'forward') {
      LAYERS.forEach((_, li) => {
        const t = setTimeout(() => setActiveLayer(li), li * 380);
        timerRef.current.push(t);
      });
    }
    if (phase === 'gradient') {
      setActiveLayer(LAYERS.length - 1);
      const t = setTimeout(() => setShowGradient(true), 300);
      timerRef.current.push(t);
    }
    if (phase === 'done') {
      setShowGradient(false);
      setActiveLayer(-1);
      setFaded(true);
    }
    return () => timerRef.current.forEach(clearTimeout);
  }, [phase]);

  const nodeColor = (n: NNode) => {
    if (phase === 'input' && n.layer === 0) return C.training.base;
    if (phase === 'forward' && n.layer <= activeLayer) return C.training.base;
    if (phase === 'gradient' && n.layer <= activeLayer) return showGradient && n.layer > 0 ? C.unlearn.base : C.training.base;
    if (phase === 'done') return 'none';
    return 'none';
  };

  const nodeStroke = (n: NNode) => {
    if (phase === 'done') return PALETTE.inkGhost;
    if (phase === 'gradient' && showGradient && n.layer > 0) return C.unlearn.base;
    if ((phase === 'forward' || phase === 'gradient') && n.layer <= activeLayer) return C.training.base;
    if (phase === 'input' && n.layer === 0) return C.training.base;
    return PALETTE.inkFaint;
  };

  const edgeColor = (e: NEdge) => {
    const k = `${e.from}-${e.to}`;
    if (phase === 'gradient' && showGradient && GRADIENT_EDGES.has(k)) return C.unlearn.base;
    if ((phase === 'forward' || phase === 'gradient') && e.fl < activeLayer) return C.training.base;
    return PALETTE.border;
  };

  const edgeWidth = (e: NEdge) => {
    const k = `${e.from}-${e.to}`;
    if (phase === 'gradient' && showGradient && GRADIENT_EDGES.has(k)) return 1.6;
    if ((phase === 'forward' || phase === 'gradient') && e.fl < activeLayer) return 1.2;
    return 0.5;
  };

  const edgeOpacity = (e: NEdge) => {
    const k = `${e.from}-${e.to}`;
    if (faded) return 0.15;
    if (phase === 'gradient' && showGradient && GRADIENT_EDGES.has(k)) return 0.9;
    if ((phase === 'forward' || phase === 'gradient') && e.fl < activeLayer) return 0.8;
    return 0.3;
  };

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H + 30}`} style={{ width: '100%', maxWidth: SVG_W, height: 'auto', display: 'block', overflow: 'visible' }}>
      {/* Layer labels */}
      {LAYER_LABELS.map((l, i) => (
        <text key={l} x={XS[i]} y={16} textAnchor="middle" fontFamily={TYPE.mono} fontSize="8" fill={PALETTE.inkFaint} letterSpacing="1" style={{ textTransform: 'uppercase' }}>{l.toUpperCase()}</text>
      ))}

      {/* Edges */}
      {NET.edges.map(e => {
        const f = NET.nodes.find(n => n.id === e.from)!;
        const t = NET.nodes.find(n => n.id === e.to)!;
        return (
          <motion.line key={`${e.from}-${e.to}`}
            x1={f.x} y1={f.y + 24} x2={t.x} y2={t.y + 24}
            animate={{ stroke: edgeColor(e), strokeWidth: edgeWidth(e), opacity: edgeOpacity(e) }}
            transition={{ duration: 0.35 }}
          />
        );
      })}

      {/* Nodes */}
      {NET.nodes.map(node => (
        <motion.circle key={node.id}
          cx={node.x} cy={node.y + 24} r={12}
          animate={{
            fill: nodeColor(node),
            stroke: nodeStroke(node),
            strokeWidth: phase !== 'idle' && phase !== 'done' ? 1.5 : 0.8,
            opacity: faded ? 0.2 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}

      {/* Gradient arrows - appear during gradient phase */}
      {phase === 'gradient' && showGradient && [168, 280, 392].map(x => (
        <motion.g key={x} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <line x1={x + 32} y1={SVG_H + 8} x2={x - 32} y2={SVG_H + 8} stroke={C.unlearn.base} strokeWidth={1} opacity={0.7} />
          <polygon points={`${x - 32},${SVG_H + 5} ${x - 32},${SVG_H + 11} ${x - 40},${SVG_H + 8}`} fill={C.unlearn.base} opacity={0.7} />
          <text x={x} y={SVG_H + 24} textAnchor="middle" fontFamily={TYPE.mono} fontSize="7" fill={C.unlearn.muted} letterSpacing="0.5">ΔWEIGHT</text>
        </motion.g>
      ))}

      {/* "Gone" label on input node when faded */}
      {phase === 'done' && (
        <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
          x={XS[0]} y={SVG_H / 2 + 24 + 26} textAnchor="middle" fontFamily={TYPE.mono} fontSize="7.5" fill={C.unlearn.muted} letterSpacing="0.5">GONE</motion.text>
      )}
    </svg>
  );
}

// ============================================================================
// SECTION 1 - STEP EXPLAINER + NEURAL NET INTEGRATED
// ============================================================================

const TRAINING_STEPS: {
  n: string; title: string; body: string; example: string | null;
  color: typeof C.training; exampleColor: typeof C.training; netPhase: NetPhase;
}[] = [
  {
    n: '01', title: 'You type a sentence',
    body: 'You write something personal - a worry, a relationship, a belief. That sentence enters the model as a stream of numbers.',
    example: '"I\'ve been feeling really anxious about my job situation."',
    color: C.training, exampleColor: C.training, netPhase: 'input',
  },
  {
    n: '02', title: 'It passes through the network',
    body: 'The sentence travels through layer after layer of mathematical operations. Each node transforms the signal - encoding patterns, relationships, sentiment.',
    example: null, color: C.training, exampleColor: C.training, netPhase: 'forward',
  },
  {
    n: '03', title: 'The network adjusts its weights',
    body: 'The model compares its output to what it expected. The error ripples backwards - gradient descent - nudging billions of parameters by tiny fractions. The red connections show where weights shift.',
    example: null, color: C.unlearn, exampleColor: C.unlearn, netPhase: 'gradient',
  },
  {
    n: '04', title: 'The sentence disappears',
    body: 'The original text is not stored anywhere. There is no file, no record, no copy. What remains is the adjustment - invisibly distributed across billions of numbers.',
    example: '"I\'ve been feeling really anxious..." → gone. The weight changes → distributed, persistent.',
    color: C.unlearn, exampleColor: C.unlearn, netPhase: 'done',
  },
];

function TrainingStepExplainer() {
  const [active, setActive] = useState(0);
  const step = TRAINING_STEPS[active];

  return (
    <div>
      {/* Neural net - always visible, animates per step */}
      <div style={{
        background: PALETTE.bgPanel,
        border: `1px solid ${PALETTE.border}`,
        padding: 'clamp(1.25rem, 3vw, 2rem)',
        marginBottom: '1.75rem',
      }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
          Neural network - click steps below to animate
        </p>
        <NeuralNetDiagram phase={step.netPhase} />

        {/* State label beneath the net */}
        <AnimatePresence mode="wait">
          <motion.p
            key={step.netPhase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '9px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: step.netPhase === 'gradient' || step.netPhase === 'done' ? C.unlearn.base : C.training.base,
              marginTop: '0.75rem',
            }}
          >
            {step.netPhase === 'idle'     && 'Awaiting input'}
            {step.netPhase === 'input'    && 'Input received - entering network'}
            {step.netPhase === 'forward'  && 'Forward pass - signal propagating layer by layer'}
            {step.netPhase === 'gradient' && 'Gradient descent - weights adjusting without discrete record'}
            {step.netPhase === 'done'     && 'Input gone. Adjustments remain.'}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {TRAINING_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '0.5rem 1rem',
              border: `1px solid ${active === i ? s.color.base : PALETTE.border}`,
              background: active === i ? s.color.faint : 'none',
              color: active === i ? s.color.base : PALETTE.inkFaint,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {s.n} {active === i ? '▸ ' : ''}{['You type', 'Network', 'Weights', 'Gone'][i]}
          </button>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28 }}>
          <div style={{ borderLeft: `3px solid ${step.color.base}`, paddingLeft: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '1.25rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: step.color.base, marginBottom: '0.4rem' }}>Step {step.n}</p>
            <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.6rem' }}>{step.title}</h3>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560 }}>{step.body}</p>
          </div>
          {step.example && (
            <div style={{ background: step.exampleColor.faint, border: `1px solid ${step.exampleColor.muted}`, padding: 'clamp(0.75rem, 2vw, 1.1rem) clamp(1rem, 2.5vw, 1.4rem)', fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', fontStyle: 'italic', color: step.exampleColor.base, lineHeight: 1.6 }}>
              {step.example}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress bar + nav */}
      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1.75rem' }}>
        {TRAINING_STEPS.map((s, i) => <div key={i} style={{ height: '2px', flex: 1, background: i <= active ? s.color.base : PALETTE.border, transition: 'background 0.3s', cursor: 'pointer' }} onClick={() => setActive(i)} />)}
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
        <button onClick={() => setActive(v => Math.max(0, v - 1))} disabled={active === 0} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: `1px solid ${PALETTE.border}`, background: 'none', color: active === 0 ? PALETTE.inkFaint : PALETTE.ink, cursor: active === 0 ? 'not-allowed' : 'pointer' }}>← Previous</button>
        <button onClick={() => setActive(v => Math.min(TRAINING_STEPS.length - 1, v + 1))} disabled={active === TRAINING_STEPS.length - 1} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.5rem 1rem', border: `1px solid ${active === TRAINING_STEPS.length - 1 ? PALETTE.border : C.training.base}`, background: active === TRAINING_STEPS.length - 1 ? 'none' : C.training.faint, color: active === TRAINING_STEPS.length - 1 ? PALETTE.inkFaint : C.training.base, cursor: active === TRAINING_STEPS.length - 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>Next step →</button>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 2 - MACHINE UNLEARNING DEMO
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
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: PALETTE.border, marginBottom: '1.75rem' }}>
        {[
          { label: <a href="https://arxiv.org/abs/2303.08774" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>Parameters in GPT-4</a>, value: '~1.8 trillion' },
          { label: 'Clusters influenced by one message', value: `${CONTAMINATED.size} of ${TOTAL_CELLS}` },
          { label: 'Clean deletion boundary', value: 'Does not exist' },
        ].map((item, si) => (
          <div key={si} style={{ background: PALETTE.bgPanel, padding: 'clamp(0.75rem, 2vw, 1.1rem)' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.35rem' }}>{item.label}</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: C.unlearn.base }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Parameter space (simplified) - red clusters = influence of a single message
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, gap: '2px', marginBottom: '1.5rem', userSelect: 'none' }}>
        {Array.from({ length: TOTAL_CELLS }, (_, i) => {
          const isH = highlightedCells.has(i);
          const isScan = phase === 'scanning' && Math.abs(i - Math.floor((scanProgress / 100) * TOTAL_CELLS)) < GRID_W;
          let bg = PALETTE.bgElevated;
          if (isScan) bg = C.gdpr.faint;
          if (isH && phase !== 'idle') bg = phase === 'failed' ? 'rgba(190,40,30,0.20)' : C.unlearn.faint;
          let border = `1px solid ${PALETTE.border}`;
          if (isH && phase !== 'idle') border = `1px solid ${C.unlearn.muted}`;
          return <div key={i} style={{ height: '10px', background: bg, border, transition: 'background 0.12s', borderRadius: '1px' }} />;
        })}
      </div>

      {/* Scan progress */}
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

      {/* Result states */}
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', minHeight: '4rem', paddingTop: '0.5rem' }}>
            Press "Request deletion" to attempt erasure
          </motion.p>
        )}
        {phase === 'failed' && (
          <motion.div key="failed" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ minHeight: '4rem' }}>
            <div style={{ border: `1px solid ${C.unlearn.base}`, background: C.unlearn.faint, padding: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '1rem' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: C.unlearn.base, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Deletion attempt failed</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.15rem)', color: PALETTE.ink, lineHeight: 1.7, marginBottom: '0.75rem' }}>
                The influence is distributed across <strong>{CONTAMINATED.size} non-contiguous parameter clusters</strong>. There is no clean boundary to cut around. You cannot straightforwardly remove what was never discretely inserted.
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', color: PALETTE.inkMuted, lineHeight: 1.65, fontStyle: 'italic' }}>
                <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>Approximate unlearning methods exist</a> - but they degrade model performance unpredictably and cannot currently provide the guarantees legal deletion requires. The practical alternative is retraining from scratch.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1px', background: PALETTE.border }}>
              {[
                { label: <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>Cost to retrain GPT-4</a>, value: '~$100M+', sub: 'Cooper et al., 2024' },
                { label: 'Time to retrain', value: '3–6 months', sub: 'On existing hardware' },
                { label: <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>GDPR deletion deadline</a>, value: '30 days', sub: 'Article 17' },
              ].map((item, di) => (
                <div key={di} style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{item.label}</p>
                  <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)', color: C.unlearn.base }}>{item.value}</p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, letterSpacing: '0.1em' }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={startScan} disabled={phase !== 'idle'} style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.6rem 1.4rem', border: `1px solid ${phase === 'idle' ? C.unlearn.base : PALETTE.border}`, background: phase === 'idle' ? C.unlearn.faint : 'none', color: phase === 'idle' ? C.unlearn.base : PALETTE.inkFaint, cursor: phase === 'idle' ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
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
// SECTION 3 - CONSENT / GDPR GAP
// ============================================================================
const COOKIE_STEPS = [
  { label: 'You browse a website', detail: 'Cookies track page visits, clicks, dwell time', ok: true },
  { label: 'Data stored in a database', detail: 'A discrete, bounded record with your ID', ok: true },
  { label: 'You request deletion', detail: <><a href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/#:~:text=individual%20for%20ID%3F-,What%20is%20the%20right%20to%20erasure%3F,time%20the%20request%20is%20received." target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>GDPR Article 17</a> - right to erasure</>, ok: true },
  { label: 'Record located and deleted', detail: 'The database deletes the row. Done.', ok: true },
  { label: 'Reversible. Clean.', detail: 'The system returns to its pre-collection state.', ok: true },
];
const AI_STEPS = [
  { label: 'You type a message', detail: 'Conversational input enters the training pipeline', ok: true },
  { label: 'Dissolved into weights', detail: 'The text is gone - only the adjustment remains', ok: false },
  { label: 'You request deletion', detail: 'GDPR Article 17 - right to erasure invoked', ok: null as null },
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
      {/* Hint */}
      {cookieStep === -1 && (
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          Start with the cookie model → then compare the AI model
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(1rem, 3vw, 2rem)', marginBottom: '1.5rem' }}>
        {/* Cookie */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${C.consent.muted}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.consent.base }} />
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.consent.base, textTransform: 'uppercase' }}>Cookie model</p>
          </div>
          {COOKIE_STEPS.map((step, i) => (
            <motion.div key={i} animate={{ opacity: cookieStep >= i ? 1 : 0.2 }} transition={{ duration: 0.3 }} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.9rem', alignItems: 'flex-start' }}>
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

        {/* AI */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${C.unlearn.muted}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.unlearn.base }} />
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.unlearn.base, textTransform: 'uppercase' }}>AI training model</p>
          </div>
          {AI_STEPS.map((step, i) => {
            const dc = step.ok === false ? C.unlearn.base : step.ok === null ? C.gdpr.base : C.consent.base;
            const df = step.ok === false ? C.unlearn.faint : step.ok === null ? C.gdpr.faint : C.consent.faint;
            const mk = step.ok === false ? '✗' : step.ok === null ? '?' : '✓';
            return (
              <motion.div key={i} animate={{ opacity: aiStep >= i ? 1 : 0.2 }} transition={{ duration: 0.3 }} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.9rem', alignItems: 'flex-start' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${aiStep >= i ? dc : PALETTE.border}`, background: aiStep >= i ? df : 'none', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: dc, fontFamily: TYPE.mono }}>
                  {aiStep >= i ? mk : ''}
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

      {/* Gap callout */}
      <AnimatePresence>
        {showGap && cookieDone && aiDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ border: `1px solid ${C.unlearn.base}`, background: C.unlearn.faint, padding: 'clamp(1rem, 2.5vw, 1.5rem)', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: C.unlearn.base, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Structural gap - the finding</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.75, maxWidth: 600 }}>
              Cookie consent was designed for reversible behavioural tracking. AI training is not practically reversible in the same sense. The right to erasure - <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textDecorationColor: 'inherit', cursor: 'pointer' }}>GDPR Article 17</a> - is difficult to fulfil for training data, because there is nothing discrete left to erase. This is not simply a policy failure. It is an architectural one.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setCookieStep(v => Math.min(COOKIE_STEPS.length - 1, v + 1))} disabled={cookieDone} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.55rem 1.1rem', border: `1px solid ${cookieDone ? PALETTE.border : C.consent.base}`, background: cookieDone ? 'none' : C.consent.faint, color: cookieDone ? PALETTE.inkFaint : C.consent.base, cursor: cookieDone ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {cookieDone ? '✓ Cookie done' : `Cookie: step ${cookieStep + 2} of ${COOKIE_STEPS.length} →`}
        </button>
        <button onClick={() => setAiStep(v => Math.min(AI_STEPS.length - 1, v + 1))} disabled={aiDone || !cookieDone} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.55rem 1.1rem', border: `1px solid ${aiDone ? PALETTE.border : !cookieDone ? PALETTE.border : C.unlearn.base}`, background: aiDone ? 'none' : !cookieDone ? 'none' : C.unlearn.faint, color: aiDone || !cookieDone ? PALETTE.inkFaint : C.unlearn.base, cursor: aiDone || !cookieDone ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          {aiDone ? '✗ AI failed' : !cookieDone ? 'Complete cookie first' : `AI: step ${aiStep + 2} of ${AI_STEPS.length} →`}
        </button>
        {cookieDone && aiDone && (
          <button onClick={() => setShowGap(v => !v)} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '0.55rem 1.1rem', border: `1px solid ${showGap ? C.unlearn.base : PALETTE.borderHover}`, background: showGap ? C.unlearn.faint : 'none', color: showGap ? C.unlearn.base : PALETTE.ink, cursor: 'pointer', transition: 'all 0.2s' }}>
            {showGap ? 'Hide gap' : 'Reveal structural gap'}
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
function PageSection({ number, title, body, children, accent, finding, noBorder }: {
  number: string; title: string; body: string; children: React.ReactNode;
  accent: { base: string; faint: string; muted: string }; finding?: string; noBorder?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65 }} style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: noBorder ? 'none' : `1px solid ${PALETTE.border}` }}>
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
            Consent was designed for reversible systems. AI training is not practically reversible in the same sense.
            That gap is not simply a policy failure. It is an architectural one.
          </ThreadSentence>
        </motion.div>

        {/* YouTube link */}
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.65, duration: 0.7 }}
          style={{ marginTop: 'clamp(1.2rem, 2.5vw, 1.8rem)' }}>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.88rem, 1.4vw, 1rem)', color: PALETTE.inkMuted, lineHeight: 1.7 }}>
            If you want to understand how neural networks actually learn before reading further,{' '}
            <a href="https://www.youtube.com/watch?v=aircAruvnKk" target="_blank" rel="noopener noreferrer"
              style={{ color: PALETTE.ink, textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationColor: 'rgba(26,24,20,0.35)' }}>
              this video
            </a>
            {' '}is the clearest explanation available.
          </p>
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
        number="Section 1 - The mechanism"
        title="How training works"
        body="A sentence you type does not get filed somewhere. It is absorbed. The model adjusts its parameters in response to your input - and then the input is gone. Click through the steps below to see how."
        accent={C.training}
        finding="Training does not store what it learns from in a discrete, locatable form. It converts data into weight adjustments across billions of parameters. The original data cannot be straightforwardly located - so it cannot easily be removed."
      >
        <TrainingStepExplainer />
      </PageSection>

      <PageSection
        number="Section 2 - The impossibility"
        title="Why machine unlearning doesn't work"
        body="When you request deletion under GDPR Article 17, the assumption is that a record exists, can be located, and can be removed. For AI training data, all three assumptions are difficult to satisfy."
        accent={C.unlearn}
        finding="Machine unlearning research exists. But even its proponents acknowledge it cannot currently provide the guarantees legal deletion requires. Approximate methods degrade model performance unpredictably. Thorough deletion requires retraining from scratch - at a cost that makes compliance structurally impractical within GDPR's 30-day window."
      >
        <MachineUnlearningDemo />
      </PageSection>

      {/* Section 2 further reading */}
      <div style={{ marginTop: '-2rem', marginBottom: 'clamp(3rem, 7vw, 5rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 2.2 }}>
          <span style={{ color: PALETTE.inkFaint, marginRight: '0.5rem' }}>Further reading</span>
          <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>Cooper et al. (2024) - Machine Unlearning Doesn’t Do What You Think</a>
          {' · '}
          <a href="https://arxiv.org/abs/2407.06460" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>Shi et al. (2024) - MUSE: Machine Unlearning Six-Way Evaluation</a>
          {' · '}
          <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px', textDecorationColor: 'rgba(26,24,20,0.3)' }}>GDPR Article 17 - Right to Erasure</a>
        </p>
      </div>

      <PageSection
        number="Section 3 - The structural gap"
        title="Why consent frameworks can't fix it"
        body="Cookie consent was designed for a specific kind of data: discrete records that can be found and deleted. AI training produces something entirely different. Step through both models to see where the framework breaks."
        accent={C.consent}
        noBorder
      >
        <GdprGapDiagram />
      </PageSection>

      {/* Sources */}
      <div style={{ paddingTop: 'clamp(2rem, 4vw, 3rem)', borderTop: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 2.4 }}>
          <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Cooper et al. (2024) - Machine Unlearning Doesn't Do What You Think</a>
          {' · '}
          <a href="https://www.publicaffairsbooks.com/titles/shoshana-zuboff/the-age-of-surveillance-capitalism/9781610395694/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Zuboff (2019) - The Age of Surveillance Capitalism</a>
          {' · '}
          <a href="https://doi.org/10.1162/DAED_a_00113" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Nissenbaum (2011) - A Contextual Approach to Privacy Online</a>
          {' · '}
          <a href="https://arxiv.org/abs/2402.09716" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>Gumusel, Zhou & Sanfilippo (2024) - User Privacy Harms in Conversational AI</a>
        </p>
      </div>

      <PageFooter
        statement="Cookie consent was designed for reversible systems. AI training is not practically reversible in the same sense. That gap is not simply a policy failure. It is an architectural one."
        followOn="The architecture makes the consent framework difficult to apply. The terms you agreed to did not describe a system this page explains."
        navItems={[
          { page: 'permanent',  act: 'ACT III / 05', label: 'Why deletion fails', body: 'What this architecture means for your right to erasure - and why it is not straightforwardly fulfillable.' },
          { page: 'terms',      act: 'ACT III / 06', label: 'What you agreed to', body: 'The terms that authorised training on your data - and how they changed.' },
          { page: 'understand', act: 'ACT IV / 08',  label: 'Test the inference',  body: 'Watch the extraction happen in real time on your own words.' },
        ]}
        endLabel="End of technical record."
        setPage={setPage}
      />
    </div>
  );
}
