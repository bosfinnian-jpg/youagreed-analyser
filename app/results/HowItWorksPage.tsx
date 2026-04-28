'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE as P_DASH, TYPE } from './DashboardLayout';

// ============================================================================
// LOCAL PALETTE — mapped to dashboard system
// ============================================================================
const P = {
  bg: P_DASH.bg,
  bgPanel: P_DASH.bgPanel,
  bgElevated: P_DASH.bgElevated,
  border: P_DASH.border,
  borderMid: P_DASH.borderHover,
  ink: P_DASH.ink,
  inkMuted: P_DASH.inkMuted,
  inkFaint: P_DASH.inkFaint,
  inkGhost: P_DASH.inkGhost,
  red: 'rgba(168,36,36,0.85)',
  redMuted: 'rgba(168,36,36,0.45)',
  redFaint: 'rgba(168,36,36,0.08)',
};
const SERIF = TYPE.serif;
const MONO = TYPE.mono;

// ============================================================================
// NEURAL NETWORK DATA
// ============================================================================
const LAYERS = [1, 4, 5, 4, 1];
const EXAMPLE_SENTENCE = "I'm struggling with my mental health lately.";

interface NetNode { id: string; x: number; y: number; layer: number; }
interface NetEdge { from: string; to: string; }

function buildNetwork(): { nodes: NetNode[]; edges: NetEdge[] } {
  const nodes: NetNode[] = [];
  const edges: NetEdge[] = [];
  const layerXPositions = [60, 170, 280, 390, 500];
  const H = 260;

  LAYERS.forEach((count, li) => {
    const x = layerXPositions[li];
    for (let i = 0; i < count; i++) {
      const y = H / 2 - ((count - 1) * 44) / 2 + i * 44;
      nodes.push({ id: `${li}-${i}`, x, y, layer: li });
    }
  });

  for (let li = 0; li < LAYERS.length - 1; li++) {
    const fromNodes = nodes.filter(n => n.layer === li);
    const toNodes = nodes.filter(n => n.layer === li + 1);
    fromNodes.forEach(f => toNodes.forEach(t => edges.push({ from: f.id, to: t.id })));
  }

  return { nodes, edges };
}

const NETWORK = buildNetwork();

// ============================================================================
// SECTION 1 — NEURAL NETWORK DIAGRAM
// ============================================================================
type AnimPhase = 'idle' | 'forward' | 'gradient' | 'done';

function NeuralNetworkDiagram() {
  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [shiftedEdges] = useState<Set<string>>(() => {
    // Fixed deterministic set — no random on re-render
    const s = new Set<string>();
    NETWORK.edges.forEach((e, i) => { if (i % 3 !== 0) s.add(`${e.from}-${e.to}`); });
    return s;
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => timers.current.forEach(clearTimeout);

  const runAnimation = useCallback(() => {
    if (phase === 'forward' || phase === 'gradient') return;
    clearTimers();
    setPhase('forward');
    setActiveEdges(new Set());
    setActiveNodes(new Set());

    let delay = 0;
    for (let li = 0; li < LAYERS.length; li++) {
      const layerNodes = NETWORK.nodes.filter(n => n.layer === li);
      const t1 = setTimeout(() => {
        setActiveNodes(prev => { const next = new Set(prev); layerNodes.forEach(n => next.add(n.id)); return next; });
      }, delay);
      timers.current.push(t1);

      if (li < LAYERS.length - 1) {
        const layerEdges = NETWORK.edges.filter(e => e.from.startsWith(`${li}-`));
        const t2 = setTimeout(() => {
          setActiveEdges(prev => { const next = new Set(prev); layerEdges.forEach(e => next.add(`${e.from}-${e.to}`)); return next; });
        }, delay + 200);
        timers.current.push(t2);
      }
      delay += 450;
    }

    const tGrad = setTimeout(() => setPhase('gradient'), delay + 300);
    timers.current.push(tGrad);

    const tDone = setTimeout(() => {
      setPhase('done');
      setActiveEdges(new Set());
      setActiveNodes(new Set());
    }, delay + 1800);
    timers.current.push(tDone);
  }, [phase]);

  const getEdgeColor = (key: string) => {
    if (phase === 'gradient' && shiftedEdges.has(key)) return P.red;
    if (activeEdges.has(key)) return P.redMuted;
    return P.border;
  };
  const getEdgeOpacity = (key: string) =>
    activeEdges.has(key) || (phase === 'gradient' && shiftedEdges.has(key)) ? 1 : 0.35;
  const getEdgeWidth = (key: string) => {
    if (phase === 'gradient' && shiftedEdges.has(key)) return 1.8;
    if (activeEdges.has(key)) return 1.2;
    return 0.6;
  };

  return (
    <div>
      <div style={{ marginBottom: '1.2rem' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.3em', color: P.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Training input
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: '1.1rem', fontStyle: 'italic',
          color: P.ink, padding: '0.55rem 0.9rem',
          border: `1px solid ${P.borderMid}`,
          background: P.bgPanel, display: 'inline-block',
        }}>
          "{EXAMPLE_SENTENCE}"
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 580 280" style={{ width: '100%', maxWidth: '580px', height: 'auto', display: 'block' }}>
          {['Input', 'Layer 1', 'Layer 2', 'Layer 3', 'Output'].map((label, i) => (
            <text key={label} x={[60, 170, 280, 390, 500][i]} y={18}
              textAnchor="middle" fontFamily={MONO} fontSize="8" fill={P.inkFaint} letterSpacing="1">
              {label.toUpperCase()}
            </text>
          ))}

          {NETWORK.edges.map(e => {
            const from = NETWORK.nodes.find(n => n.id === e.from)!;
            const to = NETWORK.nodes.find(n => n.id === e.to)!;
            const key = `${e.from}-${e.to}`;
            return (
              <motion.line key={key}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                animate={{ stroke: getEdgeColor(key), strokeWidth: getEdgeWidth(key), opacity: getEdgeOpacity(key) }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {NETWORK.nodes.map(node => (
            <motion.circle key={node.id}
              cx={node.x} cy={node.y} r={10}
              animate={{
                fill: activeNodes.has(node.id) ? P.red : 'none',
                stroke: activeNodes.has(node.id) ? P.red : P.inkMuted,
                strokeWidth: activeNodes.has(node.id) ? 1.5 : 0.8,
              }}
              transition={{ duration: 0.25 }}
            />
          ))}

          {phase === 'gradient' && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              {[170, 280, 390].map(x => (
                <g key={x}>
                  <line x1={x - 28} y1={252} x2={x + 28} y2={252} stroke={P.red} strokeWidth={1} opacity={0.6} />
                  <polygon points={`${x + 28},249 ${x + 28},255 ${x + 36},252`} fill={P.red} opacity={0.6} />
                  <text x={x} y={270} textAnchor="middle" fontFamily={MONO} fontSize="7" fill={P.redMuted} letterSpacing="0.5">ΔWEIGHT</text>
                </g>
              ))}
              <text x={290} y={140} textAnchor="middle" fontFamily={MONO} fontSize="7.5" fill={P.red} letterSpacing="0.8">
                PARAMETERS ADJUSTING
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      <div style={{ marginTop: '1.2rem', minHeight: '3.5rem' }}>
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.inkFaint, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Awaiting input</div>
            </motion.div>
          )}
          {phase === 'forward' && (
            <motion.div key="fwd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.redMuted, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Forward pass — signal propagating through layers</div>
            </motion.div>
          )}
          {phase === 'gradient' && (
            <motion.div key="grad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.red, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Gradient descent — weights adjusting permanently
              </div>
              <div style={{ fontFamily: SERIF, fontSize: '1.05rem', color: P.ink, fontStyle: 'italic' }}>
                The sentence is no longer stored anywhere in this network.
              </div>
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'inline-block', border: `1px solid ${P.red}`, padding: '0.45rem 0.9rem', background: P.redFaint }}>
                <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.2em', color: P.red, textTransform: 'uppercase' }}>
                  The sentence is gone. The adjustment remains.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button onClick={runAnimation} disabled={phase === 'forward' || phase === 'gradient'}
        style={{
          marginTop: '1.2rem', fontFamily: MONO, fontSize: '10px', letterSpacing: '0.25em',
          textTransform: 'uppercase', color: phase === 'forward' || phase === 'gradient' ? P.inkFaint : P.ink,
          background: 'none', border: `1px solid ${phase === 'forward' || phase === 'gradient' ? P.border : P.borderMid}`,
          padding: '0.45rem 1.1rem', cursor: phase === 'forward' || phase === 'gradient' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}>
        {phase === 'idle' ? 'Run training pass' : phase === 'done' ? 'Run again' : 'Running…'}
      </button>
    </div>
  );
}

// ============================================================================
// SECTION 2 — MACHINE UNLEARNING DIAGRAM
// ============================================================================
const UNLEARN_POINTS = [
  { x: 80, y: 60 }, { x: 200, y: 45 }, { x: 330, y: 70 }, { x: 460, y: 55 }, { x: 540, y: 90 },
  { x: 60, y: 150 }, { x: 160, y: 130 }, { x: 270, y: 155 }, { x: 390, y: 140 }, { x: 500, y: 160 },
  { x: 90, y: 230 }, { x: 210, y: 215 }, { x: 340, y: 240 }, { x: 450, y: 220 }, { x: 530, y: 245 },
  { x: 140, y: 95 }, { x: 310, y: 110 }, { x: 430, y: 95 }, { x: 180, y: 185 }, { x: 360, y: 195 },
];

// Fixed connections — deterministic, no Math.random at render time
const UNLEARN_CONNECTIONS: [number, number][] = [
  [0,1],[0,5],[0,15],[1,2],[1,6],[1,15],[1,16],[2,3],[2,7],[2,16],
  [3,4],[3,8],[3,17],[4,9],[4,14],[5,6],[5,10],[5,15],[6,7],[6,11],
  [6,18],[7,8],[7,12],[7,18],[8,9],[8,13],[8,19],[9,14],[9,19],
  [10,11],[10,15],[11,12],[11,18],[12,13],[12,19],[13,14],[13,19],
  [15,16],[16,17],[17,18],[18,19],[1,7],[3,16],[6,15],[8,18],[9,13],
];

const INFLUENCED = new Set([1, 3, 6, 9, 12, 15, 17, 19, 4, 7]);

function UnlearningDiagram() {
  const [revealed, setRevealed] = useState(false);
  const [showUnlearn, setShowUnlearn] = useState(false);

  const influencedConnections = UNLEARN_CONNECTIONS.filter(
    ([a, b]) => INFLUENCED.has(a) || INFLUENCED.has(b)
  );

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 600 270" style={{ width: '100%', maxWidth: '600px', height: 'auto', display: 'block' }}>
          {UNLEARN_CONNECTIONS.map(([a, b], i) => (
            <line key={i}
              x1={UNLEARN_POINTS[a].x} y1={UNLEARN_POINTS[a].y}
              x2={UNLEARN_POINTS[b].x} y2={UNLEARN_POINTS[b].y}
              stroke={P.border} strokeWidth={0.6} opacity={0.5}
            />
          ))}

          {revealed && influencedConnections.map(([a, b], i) => (
            <motion.line key={`inf-${i}`}
              x1={UNLEARN_POINTS[a].x} y1={UNLEARN_POINTS[a].y}
              x2={UNLEARN_POINTS[b].x} y2={UNLEARN_POINTS[b].y}
              stroke={P.red} strokeWidth={1.2}
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}
              transition={{ duration: 0.35, delay: i * 0.02 }}
            />
          ))}

          {UNLEARN_POINTS.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={6}
              fill={P.bgPanel} stroke={P.inkFaint} strokeWidth={0.8}
            />
          ))}

          {revealed && [...INFLUENCED].map(id => (
            <motion.circle key={`inf-${id}`}
              cx={UNLEARN_POINTS[id].x} cy={UNLEARN_POINTS[id].y} r={7}
              fill={P.redFaint} stroke={P.red} strokeWidth={1.2}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: id * 0.03 }}
            />
          ))}

          {showUnlearn && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <rect x={28} y={18} width={230} height={46} fill={P.redFaint} stroke={P.red} strokeWidth={0.8} strokeDasharray="3,3" />
              <text x={40} y={37} fontFamily={MONO} fontSize="8" fill={P.red} letterSpacing="0.5">ATTEMPTING TO ISOLATE INFLUENCE</text>
              <text x={40} y={53} fontFamily={MONO} fontSize="8" fill={P.redMuted} letterSpacing="0.3">— no contiguous boundary found —</text>
            </motion.g>
          )}
        </svg>
      </div>

      <div style={{ marginTop: '1.2rem', minHeight: '3rem' }}>
        <AnimatePresence mode="wait">
          {!revealed && (
            <motion.div key="base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.inkFaint, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                175 billion parameters — one training example distributed across many
              </div>
            </motion.div>
          )}
          {revealed && !showUnlearn && (
            <motion.div key="highlighted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.red, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Influence of a single input — {INFLUENCED.size} nodes, {influencedConnections.length} connections
              </div>
              <div style={{ fontFamily: SERIF, fontSize: '1.05rem', color: P.inkMuted, fontStyle: 'italic' }}>
                The influence is non-contiguous. There is no clean boundary to excise.
              </div>
            </motion.div>
          )}
          {showUnlearn && (
            <motion.div key="unlearn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'inline-block', border: `1px solid ${P.red}`, padding: '0.45rem 0.9rem', background: P.redFaint, marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.2em', color: P.red, textTransform: 'uppercase' }}>
                  There is no Ctrl+Z.
                </span>
              </div>
              <div style={{ marginTop: '0.5rem', fontFamily: SERIF, fontSize: '1.05rem', color: P.inkMuted, fontStyle: 'italic' }}>
                Approximate unlearning methods exist. They degrade model performance unpredictably.
                The alternative — retraining from scratch — takes months and costs millions.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', gap: '0.7rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Show influence', action: () => { setRevealed(true); setShowUnlearn(false); }, active: revealed && !showUnlearn, disabled: false },
          { label: 'Attempt deletion', action: () => { setRevealed(true); setShowUnlearn(true); }, active: showUnlearn, disabled: !revealed },
          { label: 'Reset', action: () => { setRevealed(false); setShowUnlearn(false); }, active: false, disabled: false },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
            style={{
              fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: btn.disabled ? P.inkGhost : btn.active ? P.red : P.ink,
              background: btn.active ? P.redFaint : 'none',
              border: `1px solid ${btn.disabled ? P.inkGhost : btn.active ? P.red : P.borderMid}`,
              padding: '0.45rem 1rem', cursor: btn.disabled ? 'not-allowed' : 'pointer',
            }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 3 — CONSENT COMPARISON TIMELINE
// ============================================================================
type TimelineStep = { label: string; sublabel?: string; terminal?: boolean; warning?: boolean; };

const COOKIE_STEPS: TimelineStep[] = [
  { label: 'Data collected', sublabel: 'Behavioural tracking begins' },
  { label: 'Consent given or withdrawn', sublabel: 'User controls access' },
  { label: 'Deletion requested', sublabel: 'GDPR Article 17 invoked' },
  { label: 'Data deleted', sublabel: 'Record expunged from server' },
  { label: 'Clean state restored', sublabel: 'Reversibility confirmed', terminal: true },
];

const AI_STEPS: TimelineStep[] = [
  { label: 'Data collected', sublabel: 'Conversational input ingested' },
  { label: 'Trained into weights', sublabel: 'Dissolved across 175B parameters' },
  { label: 'Consent requested', sublabel: 'User presented with opt-out mechanism', warning: true },
  { label: 'Nothing to delete', sublabel: 'No bounded record exists', warning: true },
  { label: 'Consent is retroactive theatre', sublabel: 'The mechanism cannot reach what it governs', terminal: true, warning: true },
];

function TimelineRow({ steps, label, revealed }: { steps: TimelineStep[]; label: string; revealed: boolean }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.3em', color: P.inkFaint, textTransform: 'uppercase', marginBottom: '0.9rem' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.4rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.4, delay: i * 0.14 }}
              style={{ textAlign: 'center', minWidth: '108px', maxWidth: '126px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.45rem' }}>
                <div style={{
                  width: step.terminal ? '13px' : '9px', height: step.terminal ? '13px' : '9px',
                  borderRadius: '50%',
                  background: step.warning ? P.red : step.terminal ? P.ink : 'none',
                  border: `1.5px solid ${step.warning ? P.red : P.inkMuted}`,
                }} />
              </div>
              <div style={{
                fontFamily: step.terminal ? MONO : SERIF,
                fontSize: step.terminal ? '8.5px' : '0.85rem',
                color: step.warning ? P.red : P.ink,
                letterSpacing: step.terminal ? '0.04em' : 0,
                textTransform: step.terminal ? 'uppercase' : 'none',
                fontStyle: !step.terminal ? 'italic' : 'normal',
                lineHeight: 1.3, padding: '0 3px',
              }}>
                {step.label}
              </div>
              {step.sublabel && (
                <div style={{
                  fontFamily: MONO, fontSize: '7.5px',
                  color: step.warning ? P.redMuted : P.inkFaint,
                  letterSpacing: '0.14em', marginTop: '0.2rem',
                  padding: '0 3px', lineHeight: 1.4,
                }}>
                  {step.sublabel}
                </div>
              )}
            </motion.div>

            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={revealed ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.28, delay: i * 0.14 + 0.1 }}
                style={{
                  height: '1px', width: '24px', flexShrink: 0, marginTop: '5px',
                  background: steps[i + 1]?.warning ? P.redMuted : P.inkFaint,
                  transformOrigin: 'left',
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsentDiagram() {
  const [cookieRevealed, setCookieRevealed] = useState(false);
  const [aiRevealed, setAiRevealed] = useState(false);
  const [gapRevealed, setGapRevealed] = useState(false);

  return (
    <div>
      <TimelineRow steps={COOKIE_STEPS} label="Cookie consent model — 2003–present" revealed={cookieRevealed} />
      <TimelineRow steps={AI_STEPS} label="AI training model — 2022–present" revealed={aiRevealed} />

      <AnimatePresence>
        {gapRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ borderTop: `1px solid ${P.borderMid}`, borderBottom: `1px solid ${P.borderMid}`, padding: '1.2rem 0', marginTop: '0.4rem', marginBottom: '1.4rem' }}
          >
            <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.3em', color: P.redMuted, textTransform: 'uppercase', marginBottom: '0.7rem' }}>Finding</div>
            <p style={{ fontFamily: SERIF, fontSize: '1.15rem', color: P.ink, lineHeight: 1.65, margin: 0, maxWidth: '640px' }}>
              Cookie consent frameworks were designed for reversible behavioural tracking.
              They are structurally inadequate for irreversible cognitive extraction.
              The gap between these two paradigms is not a policy failure — it is an architectural one.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Show cookie model', action: () => setCookieRevealed(true), active: cookieRevealed, disabled: false },
          { label: 'Show AI model', action: () => { if (cookieRevealed) setAiRevealed(true); }, active: aiRevealed, disabled: !cookieRevealed },
          { label: 'Show structural gap', action: () => { if (cookieRevealed && aiRevealed) setGapRevealed(v => !v); }, active: gapRevealed, disabled: !(cookieRevealed && aiRevealed) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
            style={{
              fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
              color: btn.disabled ? P.inkGhost : btn.active ? P.red : P.ink,
              background: btn.active ? P.redFaint : 'none',
              border: `1px solid ${btn.disabled ? P.inkGhost : btn.active ? P.red : P.borderMid}`,
              padding: '0.45rem 1rem', cursor: btn.disabled ? 'not-allowed' : 'pointer',
            }}>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SECTION WRAPPER
// ============================================================================
function Section({ number, title, subtitle, children, finding }: {
  number: string; title: string; subtitle: string;
  children: React.ReactNode; finding?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{ borderTop: `1px solid ${P.borderMid}`, paddingTop: '2.8rem', paddingBottom: '3rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.4rem' }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.3em', color: P.redMuted, textTransform: 'uppercase' }}>{number}</span>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.35rem, 3vw, 1.7rem)', color: P.ink, margin: 0, fontWeight: 400, letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      <p style={{ fontFamily: SERIF, fontSize: '1rem', color: P.inkMuted, fontStyle: 'italic', margin: '0 0 2rem', lineHeight: 1.6 }}>{subtitle}</p>

      {children}

      {finding && (
        <div style={{ marginTop: '2rem', paddingTop: '1.2rem', borderTop: `1px solid ${P.border}` }}>
          <span style={{ fontFamily: MONO, fontSize: '8px', letterSpacing: '0.3em', color: P.inkFaint, textTransform: 'uppercase' }}>Mechanism</span>
          <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: P.inkMuted, lineHeight: 1.7, margin: '0.4rem 0 0', maxWidth: '600px' }}>{finding}</p>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================
export default function HowItWorksPage() {
  return (
    <div style={{ padding: '0 0 4rem' }}>
      {/* Page header */}
      <div style={{ paddingBottom: '2.8rem', borderBottom: `1px solid ${P.borderMid}` }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.35em', color: P.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
          Act IV — After
        </div>
        <h1 style={{
          fontFamily: SERIF, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 400, color: P.ink, margin: '0 0 1rem',
          lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          How it works.
        </h1>
        <p style={{
          fontFamily: SERIF, fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          color: P.inkMuted, fontStyle: 'italic', margin: 0, lineHeight: 1.7, maxWidth: '520px',
        }}>
          Neural network training does not store data. It dissolves data into parameter adjustments
          across billions of weights. This is not a detail — it is the mechanism by which
          all existing consent frameworks become structurally irrelevant.
        </p>
      </div>

      <Section
        number="01"
        title="How training works"
        subtitle="The mechanism by which conversational data is permanently absorbed."
        finding="Training does not store what it learns from. A sentence passed through a model during training is not retained as a record — it is dissolved into incremental adjustments across billions of parameters. The sentence cannot subsequently be located. It cannot, therefore, be removed."
      >
        <NeuralNetworkDiagram />
      </Section>

      <Section
        number="02"
        title="Why deletion fails"
        subtitle="The machine unlearning problem, stated precisely."
        finding="The influence of a single training example is distributed across thousands of non-contiguous parameters — there is no clean boundary to excise. You cannot surgically remove what was never surgically inserted. Approximate unlearning methods exist; they degrade model performance unpredictably and cannot offer the guarantees deletion requires."
      >
        <UnlearningDiagram />
      </Section>

      <Section
        number="03"
        title="Why consent frameworks fail"
        subtitle="The structural argument. Not a policy critique — an architectural one."
      >
        <ConsentDiagram />
      </Section>

      {/* Sources footnote */}
      <div style={{ paddingTop: '1.8rem', borderTop: `1px solid ${P.border}` }}>
        <p style={{ fontFamily: MONO, fontSize: '8.5px', letterSpacing: '0.18em', color: P.inkFaint, textTransform: 'uppercase', lineHeight: 2, margin: 0 }}>
          Sources — Cooper et al. (2022), machine unlearning impossibility &nbsp;·&nbsp;
          Zuboff (2019), surveillance capitalism stages &nbsp;·&nbsp;
          Nissenbaum (2004), contextual integrity &nbsp;·&nbsp;
          Gumusel et al. (2024), conversational AI privacy harms
        </p>
      </div>
    </div>
  );
}
