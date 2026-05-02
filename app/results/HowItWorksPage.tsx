'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from './DashboardLayout';

// ============================================================================
// HOW IT WORKS — Act IV, page 08
// ============================================================================

const LAYERS = [1, 4, 5, 4, 1];
const EXAMPLE_SENTENCE = "I'm struggling with my mental health lately.";

interface NetNode { id: string; x: number; y: number; layer: number; }
interface NetEdge { from: string; to: string; }

function buildNetwork(): { nodes: NetNode[]; edges: NetEdge[] } {
  const nodes: NetNode[] = [];
  const edges: NetEdge[] = [];
  const xs = [60, 170, 280, 390, 500];
  const H = 260;
  LAYERS.forEach((count, li) => {
    const x = xs[li];
    for (let i = 0; i < count; i++) {
      nodes.push({ id: `${li}-${i}`, x, y: H / 2 - ((count - 1) * 44) / 2 + i * 44, layer: li });
    }
  });
  for (let li = 0; li < LAYERS.length - 1; li++) {
    nodes.filter(n => n.layer === li).forEach(f =>
      nodes.filter(n => n.layer === li + 1).forEach(t => edges.push({ from: f.id, to: t.id }))
    );
  }
  return { nodes, edges };
}

const NETWORK = buildNetwork();
const SHIFTED_EDGES = new Set(
  NETWORK.edges.map((e, i) => i % 3 !== 0 ? `${e.from}-${e.to}` : null).filter(Boolean) as string[]
);

type AnimPhase = 'idle' | 'forward' | 'gradient' | 'done';

function NeuralNetworkDiagram() {
  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const run = useCallback(() => {
    if (phase === 'forward' || phase === 'gradient') return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('forward');
    setActiveEdges(new Set());
    setActiveNodes(new Set());
    let delay = 0;
    for (let li = 0; li < LAYERS.length; li++) {
      const ln = NETWORK.nodes.filter(n => n.layer === li);
      const t1 = setTimeout(() => setActiveNodes(p => { const s = new Set(p); ln.forEach(n => s.add(n.id)); return s; }), delay);
      timers.current.push(t1);
      if (li < LAYERS.length - 1) {
        const le = NETWORK.edges.filter(e => e.from.startsWith(`${li}-`));
        const t2 = setTimeout(() => setActiveEdges(p => { const s = new Set(p); le.forEach(e => s.add(`${e.from}-${e.to}`)); return s; }), delay + 200);
        timers.current.push(t2);
      }
      delay += 450;
    }
    timers.current.push(setTimeout(() => setPhase('gradient'), delay + 300));
    timers.current.push(setTimeout(() => { setPhase('done'); setActiveEdges(new Set()); setActiveNodes(new Set()); }, delay + 1800));
  }, [phase]);

  const ec = (k: string) => phase === 'gradient' && SHIFTED_EDGES.has(k) ? PALETTE.red : activeEdges.has(k) ? PALETTE.redMuted : PALETTE.border;
  const ew = (k: string) => phase === 'gradient' && SHIFTED_EDGES.has(k) ? 1.8 : activeEdges.has(k) ? 1.2 : 0.6;
  const eo = (k: string) => activeEdges.has(k) || (phase === 'gradient' && SHIFTED_EDGES.has(k)) ? 1 : 0.35;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Training input</p>
        <div style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', fontStyle: 'italic', color: PALETTE.ink, padding: 'clamp(0.6rem, 1.5vw, 0.9rem) clamp(0.8rem, 2vw, 1.25rem)', border: `1px solid ${PALETTE.borderHover}`, background: PALETTE.bgPanel, display: 'inline-block' }}>
          "{EXAMPLE_SENTENCE}"
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 580 280" style={{ width: '100%', maxWidth: '580px', height: 'auto', display: 'block' }}>
          {['Input', 'Layer 1', 'Layer 2', 'Layer 3', 'Output'].map((l, i) => (
            <text key={l} x={[60, 170, 280, 390, 500][i]} y={18} textAnchor="middle" fontFamily={TYPE.mono} fontSize="8" fill={PALETTE.inkFaint} letterSpacing="1">{l.toUpperCase()}</text>
          ))}
          {NETWORK.edges.map(e => {
            const f = NETWORK.nodes.find(n => n.id === e.from)!;
            const t = NETWORK.nodes.find(n => n.id === e.to)!;
            const k = `${e.from}-${e.to}`;
            return <motion.line key={k} x1={f.x} y1={f.y} x2={t.x} y2={t.y} animate={{ stroke: ec(k), strokeWidth: ew(k), opacity: eo(k) }} transition={{ duration: 0.3 }} />;
          })}
          {NETWORK.nodes.map(node => (
            <motion.circle key={node.id} cx={node.x} cy={node.y} r={10}
              animate={{ fill: activeNodes.has(node.id) ? PALETTE.red : 'none', stroke: activeNodes.has(node.id) ? PALETTE.red : PALETTE.inkMuted, strokeWidth: activeNodes.has(node.id) ? 1.5 : 0.8 }}
              transition={{ duration: 0.25 }} />
          ))}
          {phase === 'gradient' && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              {[170, 280, 390].map(x => (
                <g key={x}>
                  <line x1={x - 28} y1={252} x2={x + 28} y2={252} stroke={PALETTE.red} strokeWidth={1} opacity={0.6} />
                  <polygon points={`${x + 28},249 ${x + 28},255 ${x + 36},252`} fill={PALETTE.red} opacity={0.6} />
                  <text x={x} y={270} textAnchor="middle" fontFamily={TYPE.mono} fontSize="7" fill={PALETTE.redMuted} letterSpacing="0.5">ΔWEIGHT</text>
                </g>
              ))}
              <text x={290} y={140} textAnchor="middle" fontFamily={TYPE.mono} fontSize="7.5" fill={PALETTE.red} letterSpacing="0.8">PARAMETERS ADJUSTING</text>
            </motion.g>
          )}
        </svg>
      </div>
      <div style={{ marginTop: '1.5rem', minHeight: '3.5rem' }}>
        <AnimatePresence mode="wait">
          {phase === 'idle' && <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Awaiting input</motion.p>}
          {phase === 'forward' && <motion.p key="fwd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.redMuted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Forward pass — signal propagating through layers</motion.p>}
          {phase === 'gradient' && (
            <motion.div key="grad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.red, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Gradient descent — weights adjusting permanently</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.ink, fontStyle: 'italic' }}>The sentence is no longer stored anywhere in this network.</p>
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'inline-block', border: `1px solid ${PALETTE.red}`, padding: '0.5rem 1rem', background: PALETTE.redFaint }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.red, textTransform: 'uppercase' }}>The sentence is gone. The adjustment remains.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button onClick={run} disabled={phase === 'forward' || phase === 'gradient'}
        style={{ marginTop: '1.5rem', fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: phase === 'forward' || phase === 'gradient' ? PALETTE.inkFaint : PALETTE.ink, background: 'none', border: `1px solid ${phase === 'forward' || phase === 'gradient' ? PALETTE.border : PALETTE.borderHover}`, padding: '0.55rem 1.25rem', cursor: phase === 'forward' || phase === 'gradient' ? 'not-allowed' : 'pointer', transition: 'border-color 0.2s' }}>
        {phase === 'idle' ? 'Run training pass' : phase === 'done' ? 'Run again' : 'Running\u2026'}
      </button>
    </div>
  );
}

// ============================================================================
// MACHINE UNLEARNING DIAGRAM
// ============================================================================
const UL_PTS = [
  { x: 80, y: 60 }, { x: 200, y: 45 }, { x: 330, y: 70 }, { x: 460, y: 55 }, { x: 540, y: 90 },
  { x: 60, y: 150 }, { x: 160, y: 130 }, { x: 270, y: 155 }, { x: 390, y: 140 }, { x: 500, y: 160 },
  { x: 90, y: 230 }, { x: 210, y: 215 }, { x: 340, y: 240 }, { x: 450, y: 220 }, { x: 530, y: 245 },
  { x: 140, y: 95 }, { x: 310, y: 110 }, { x: 430, y: 95 }, { x: 180, y: 185 }, { x: 360, y: 195 },
];
const UL_EDGES: [number, number][] = [
  [0,1],[0,5],[0,15],[1,2],[1,6],[1,15],[1,16],[2,3],[2,7],[2,16],
  [3,4],[3,8],[3,17],[4,9],[4,14],[5,6],[5,10],[5,15],[6,7],[6,11],
  [6,18],[7,8],[7,12],[7,18],[8,9],[8,13],[8,19],[9,14],[9,19],
  [10,11],[10,15],[11,12],[11,18],[12,13],[12,19],[13,14],[13,19],
  [15,16],[16,17],[17,18],[18,19],[1,7],[3,16],[6,15],[8,18],[9,13],
];
const UL_INF = new Set([1, 3, 6, 9, 12, 15, 17, 19, 4, 7]);
const UL_INF_EDGES = UL_EDGES.filter(([a, b]) => UL_INF.has(a) || UL_INF.has(b));

function UnlearningDiagram() {
  const [revealed, setRevealed] = useState(false);
  const [showUnlearn, setShowUnlearn] = useState(false);
  const btns = [
    { label: 'Show influence', action: () => { setRevealed(true); setShowUnlearn(false); }, active: revealed && !showUnlearn, disabled: false },
    { label: 'Attempt deletion', action: () => { setRevealed(true); setShowUnlearn(true); }, active: showUnlearn, disabled: !revealed },
    { label: 'Reset', action: () => { setRevealed(false); setShowUnlearn(false); }, active: false, disabled: false },
  ];
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 600 270" style={{ width: '100%', maxWidth: '600px', height: 'auto', display: 'block' }}>
          {UL_EDGES.map(([a, b], i) => <line key={i} x1={UL_PTS[a].x} y1={UL_PTS[a].y} x2={UL_PTS[b].x} y2={UL_PTS[b].y} stroke={PALETTE.border} strokeWidth={0.6} opacity={0.5} />)}
          {revealed && UL_INF_EDGES.map(([a, b], i) => <motion.line key={`i${i}`} x1={UL_PTS[a].x} y1={UL_PTS[a].y} x2={UL_PTS[b].x} y2={UL_PTS[b].y} stroke={PALETTE.red} strokeWidth={1.2} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 0.35, delay: i * 0.02 }} />)}
          {UL_PTS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={6} fill={PALETTE.bgPanel} stroke={PALETTE.inkFaint} strokeWidth={0.8} />)}
          {revealed && [...UL_INF].map(id => <motion.circle key={`n${id}`} cx={UL_PTS[id].x} cy={UL_PTS[id].y} r={7} fill={PALETTE.redFaint} stroke={PALETTE.red} strokeWidth={1.2} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, delay: id * 0.03 }} />)}
          {showUnlearn && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <rect x={28} y={18} width={238} height={46} fill={PALETTE.redFaint} stroke={PALETTE.red} strokeWidth={0.8} strokeDasharray="3,3" />
              <text x={40} y={37} fontFamily={TYPE.mono} fontSize="8" fill={PALETTE.red} letterSpacing="0.5">ATTEMPTING TO ISOLATE INFLUENCE</text>
              <text x={40} y={53} fontFamily={TYPE.mono} fontSize="8" fill={PALETTE.redMuted} letterSpacing="0.3">— no contiguous boundary found —</text>
            </motion.g>
          )}
        </svg>
      </div>
      <div style={{ marginTop: '1.5rem', minHeight: '3.5rem' }}>
        <AnimatePresence mode="wait">
          {!revealed && <motion.p key="base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, letterSpacing: '0.2em', textTransform: 'uppercase' }}>175 billion parameters — one training example distributed across many</motion.p>}
          {revealed && !showUnlearn && (
            <motion.div key="hl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.red, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Influence of a single input — {UL_INF.size} nodes, {UL_INF_EDGES.length} connections</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, fontStyle: 'italic' }}>The influence is non-contiguous. There is no clean boundary to excise.</p>
            </motion.div>
          )}
          {showUnlearn && (
            <motion.div key="ul" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'inline-block', border: `1px solid ${PALETTE.red}`, padding: '0.5rem 1rem', background: PALETTE.redFaint, marginBottom: '0.75rem' }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.red, textTransform: 'uppercase' }}>There is no Ctrl+Z.</span>
              </div>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, fontStyle: 'italic' }}>Approximate unlearning methods exist. They degrade model performance unpredictably. The alternative — retraining from scratch — takes months and costs millions.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        {btns.map(btn => (
          <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
            style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: btn.disabled ? PALETTE.inkFaint : btn.active ? PALETTE.red : PALETTE.ink, background: btn.active ? PALETTE.redFaint : 'none', border: `1px solid ${btn.disabled ? PALETTE.border : btn.active ? PALETTE.red : PALETTE.borderHover}`, padding: '0.55rem 1.1rem', cursor: btn.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CONSENT TIMELINE
// ============================================================================
type TStep = { label: string; sublabel?: string; terminal?: boolean; warning?: boolean; };
const COOKIE_STEPS: TStep[] = [
  { label: 'Data collected', sublabel: 'Behavioural tracking begins' },
  { label: 'Consent given or withdrawn', sublabel: 'User controls access' },
  { label: 'Deletion requested', sublabel: 'GDPR Article 17 invoked' },
  { label: 'Data deleted', sublabel: 'Record expunged from server' },
  { label: 'Clean state restored', sublabel: 'Reversibility confirmed', terminal: true },
];
const AI_STEPS: TStep[] = [
  { label: 'Data collected', sublabel: 'Conversational input ingested' },
  { label: 'Trained into weights', sublabel: 'Dissolved across 175B parameters' },
  { label: 'Consent requested', sublabel: 'User presented with opt-out mechanism', warning: true },
  { label: 'Nothing to delete', sublabel: 'No bounded record exists', warning: true },
  { label: 'Consent is retroactive theatre', sublabel: 'The mechanism cannot reach what it governs', terminal: true, warning: true },
];

function TimelineRow({ steps, label, revealed }: { steps: TStep[]; label: string; revealed: boolean }) {
  return (
    <div style={{ marginBottom: 'clamp(2rem, 4vw, 2.5rem)' }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.4, delay: i * 0.14 }} style={{ textAlign: 'center', minWidth: '110px', maxWidth: '128px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <div style={{ width: step.terminal ? '13px' : '9px', height: step.terminal ? '13px' : '9px', borderRadius: '50%', background: step.warning ? PALETTE.red : step.terminal ? PALETTE.ink : 'none', border: `1.5px solid ${step.warning ? PALETTE.red : PALETTE.inkMuted}` }} />
              </div>
              <p style={{ fontFamily: step.terminal ? TYPE.mono : TYPE.serif, fontSize: step.terminal ? '8.5px' : 'clamp(0.82rem, 1.4vw, 0.9rem)', color: step.warning ? PALETTE.red : PALETTE.ink, letterSpacing: step.terminal ? '0.04em' : 0, textTransform: step.terminal ? 'uppercase' : 'none', fontStyle: !step.terminal ? 'italic' : 'normal', lineHeight: 1.3, padding: '0 3px', margin: 0 }}>{step.label}</p>
              {step.sublabel && <p style={{ fontFamily: TYPE.mono, fontSize: '7.5px', color: step.warning ? PALETTE.redMuted : PALETTE.inkFaint, letterSpacing: '0.14em', padding: '0 3px', lineHeight: 1.4, margin: '0.2rem 0 0' }}>{step.sublabel}</p>}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={revealed ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }} transition={{ duration: 0.25, delay: i * 0.14 + 0.1 }}
                style={{ height: '1px', width: '22px', flexShrink: 0, marginTop: '5px', background: steps[i + 1]?.warning ? PALETTE.redMuted : PALETTE.inkFaint, transformOrigin: 'left' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsentDiagram() {
  const [cookieOn, setCookieOn] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [gapOn, setGapOn] = useState(false);
  const btns = [
    { label: 'Show cookie model', action: () => setCookieOn(true), active: cookieOn, disabled: false },
    { label: 'Show AI model', action: () => { if (cookieOn) setAiOn(true); }, active: aiOn, disabled: !cookieOn },
    { label: 'Show structural gap', action: () => { if (cookieOn && aiOn) setGapOn(v => !v); }, active: gapOn, disabled: !(cookieOn && aiOn) },
  ];
  return (
    <div>
      <TimelineRow steps={COOKIE_STEPS} label="Cookie consent model — 2003–present" revealed={cookieOn} />
      <TimelineRow steps={AI_STEPS} label="AI training model — 2022–present" revealed={aiOn} />
      <AnimatePresence>
        {gapOn && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ borderTop: `1px solid ${PALETTE.borderHover}`, borderBottom: `1px solid ${PALETTE.borderHover}`, padding: 'clamp(1rem, 2.5vw, 1.5rem) 0', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Finding</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, margin: 0 }}>
              Cookie consent frameworks were designed for reversible behavioural tracking. They are structurally inadequate for irreversible cognitive extraction. The gap between these two paradigms is not a policy failure — it is an architectural one.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        {btns.map(btn => (
          <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
            style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: btn.disabled ? PALETTE.inkFaint : btn.active ? PALETTE.red : PALETTE.ink, background: btn.active ? PALETTE.redFaint : 'none', border: `1px solid ${btn.disabled ? PALETTE.border : btn.active ? PALETTE.red : PALETTE.borderHover}`, padding: '0.55rem 1.1rem', cursor: btn.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION — matches CannotBeDeletedPage section structure exactly
// ============================================================================
function PageSection({ number, title, body, children, finding }: {
  number: string; title: string; body: string; children: React.ReactNode; finding?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
      style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', paddingBottom: 'clamp(3rem, 6vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>{number}</p>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.25 }}>{title}</h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 540, marginBottom: 'clamp(2rem, 5vw, 3rem)' }}>{body}</p>
      {children}
      {finding && (
        <div style={{ marginTop: 'clamp(2rem, 4vw, 3rem)', paddingLeft: 'clamp(1.25rem, 3vw, 2rem)', borderLeft: `2px solid ${PALETTE.border}` }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Mechanism</p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.75, marginBottom: '0.75rem' }}>{finding}</p>
        </div>
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
          <ActLabel roman="IV" title="After" pageLabel="08 / How It Works" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
            fontWeight: 400, color: PALETTE.ink,
            letterSpacing: '-0.04em', lineHeight: 0.97,
            marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
            maxWidth: '18ch',
          }}
        >
          Why deletion<br />is not reversal.
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5, duration: 0.7 }}>
          <ThreadSentence>
            Consent was designed for reversible systems. AI training is not reversible.
            That gap is not a policy failure. It is an architectural one.
          </ThreadSentence>
        </motion.div>
      </motion.div>

      <PageSection
        number="The mechanism"
        title="How training works"
        body="A sentence passed through a model during training is not retained as a record. It dissolves into incremental adjustments across billions of parameters. The sentence cannot subsequently be located or removed."
        finding="Training does not store what it learns from. It dissolves data into weight adjustments across billions of parameters. The data cannot be located, so it cannot be removed."
      >
        <NeuralNetworkDiagram />
      </PageSection>

      <PageSection
        number="The impossibility"
        title="Why deletion fails"
        body="The influence of a single training example is distributed across thousands of non-contiguous parameters. There is no clean boundary to excise. You cannot remove what was never discretely inserted."
        finding="Approximate unlearning methods exist. They degrade model performance unpredictably and cannot provide the guarantees legal deletion requires. The alternative — retraining from scratch — takes months and costs tens of millions."
      >
        <UnlearningDiagram />
      </PageSection>

      <PageSection
        number="The structural argument"
        title="Why consent frameworks fail"
        body="Cookie consent frameworks were designed for reversible behavioural tracking. AI training is not reversible. The consent mechanism was applied to a system it was never designed to govern."
      >
        <ConsentDiagram />
      </PageSection>

      {/* Sources footnote */}
      <div style={{ paddingTop: 'clamp(2rem, 4vw, 3rem)', borderTop: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 2.2, margin: 0 }}>
          <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>
            Cooper et al. (2024) — Machine Unlearning Doesn't Do What You Think, arXiv:2412.06966
          </a>
          &nbsp;&middot;&nbsp;
          <a href="https://www.publicaffairsbooks.com/titles/shoshana-zuboff/the-age-of-surveillance-capitalism/9781610395694/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>
            Zuboff (2019) — The Age of Surveillance Capitalism
          </a>
          &nbsp;&middot;&nbsp;
          <a href="https://doi.org/10.1162/DAED_a_00113" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>
            Nissenbaum (2011) — A Contextual Approach to Privacy Online, Daedalus 140(4):32–48
          </a>
          &nbsp;&middot;&nbsp;
          <a href="https://arxiv.org/abs/2402.09716" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(26,24,20,0.2)' }}>
            Gumusel, Zhou &amp; Sanfilippo (2024) — User Privacy Harms in Conversational AI, arXiv:2402.09716
          </a>
        </p>
      </div>

      {/* Navigation footer */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingBottom: 'clamp(4rem, 10vw, 8rem)' }}>
        <button
          onClick={() => setPage('permanent')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: PALETTE.ink, background: 'none',
            border: `1px solid ${PALETTE.borderHover}`,
            padding: '0.55rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = PALETTE.bgPanel; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          ← Permanence
        </button>
        <button
          onClick={() => setPage('understand')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: PALETTE.inkFaint, background: 'none',
            border: `1px solid ${PALETTE.border}`,
            padding: '0.55rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; e.currentTarget.style.color = PALETTE.ink; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; e.currentTarget.style.color = PALETTE.inkFaint; }}
        >
          Understand the inference →
        </button>
      </div>

    </div>
  );
}
