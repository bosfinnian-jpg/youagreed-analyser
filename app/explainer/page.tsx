'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';

// ============================================================================
// DESIGN TOKENS — matching established visual system
// ============================================================================
const P = {
  bg: '#f5f4f0',
  bgPanel: '#faf9f7',
  bgElevated: '#eceae3',
  border: 'rgba(26,24,20,0.12)',
  borderMid: 'rgba(26,24,20,0.20)',
  ink: '#1a1816',
  inkMuted: 'rgba(26,24,20,0.55)',
  inkFaint: 'rgba(26,24,20,0.35)',
  inkGhost: 'rgba(26,24,20,0.08)',
  red: 'rgba(168,36,36,0.85)',
  redMuted: 'rgba(168,36,36,0.45)',
  redFaint: 'rgba(168,36,36,0.08)',
};
const SERIF = '"EB Garamond", Georgia, serif';
const MONO = '"Courier Prime", "Courier New", monospace';

// ============================================================================
// SECTION 1 — NEURAL NETWORK DIAGRAM
// ============================================================================

interface Node {
  id: string;
  x: number;
  y: number;
  layer: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

const LAYERS = [1, 4, 5, 4, 1];
const EXAMPLE_SENTENCE = "I'm struggling with my mental health lately.";

function buildNetwork(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const W = 520;
  const H = 260;
  const layerXPositions = [60, 170, 280, 390, 500];

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
    fromNodes.forEach(f => {
      toNodes.forEach(t => {
        edges.push({ from: f.id, to: t.id, weight: Math.random() * 2 - 1 });
      });
    });
  }

  return { nodes, edges };
}

const NETWORK = buildNetwork();

type AnimPhase = 'idle' | 'forward' | 'gradient' | 'adjusted' | 'done';

function NeuralNetworkDiagram() {
  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [shiftedEdges, setShiftedEdges] = useState<Set<string>>(new Set());
  const [adjustedWeights, setAdjustedWeights] = useState<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => timerRef.current.forEach(clearTimeout);

  const runAnimation = useCallback(() => {
    if (phase === 'forward' || phase === 'gradient') return;
    clear();
    setPhase('forward');
    setActiveEdges(new Set());
    setActiveNodes(new Set());
    setShiftedEdges(new Set());

    // Forward pass: layer by layer
    let delay = 0;
    for (let li = 0; li < LAYERS.length; li++) {
      const layerNodes = NETWORK.nodes.filter(n => n.layer === li);
      const t1 = setTimeout(() => {
        setActiveNodes(prev => {
          const next = new Set(prev);
          layerNodes.forEach(n => next.add(n.id));
          return next;
        });
      }, delay);
      timerRef.current.push(t1);

      if (li < LAYERS.length - 1) {
        const layerEdges = NETWORK.edges.filter(e => e.from.startsWith(`${li}-`));
        const t2 = setTimeout(() => {
          setActiveEdges(prev => {
            const next = new Set(prev);
            layerEdges.forEach(e => next.add(`${e.from}-${e.to}`));
            return next;
          });
        }, delay + 200);
        timerRef.current.push(t2);
      }
      delay += 450;
    }

    // Gradient phase
    const tGrad = setTimeout(() => {
      setPhase('gradient');
      // Randomly shift some edges
      const edgeKeys = NETWORK.edges.map(e => `${e.from}-${e.to}`);
      const toShift = new Set(edgeKeys.filter(() => Math.random() > 0.35));
      setShiftedEdges(toShift);
      const newWeights: Record<string, number> = {};
      NETWORK.edges.forEach(e => {
        const k = `${e.from}-${e.to}`;
        newWeights[k] = e.weight + (Math.random() * 0.06 - 0.03);
      });
      setAdjustedWeights(newWeights);
    }, delay + 300);
    timerRef.current.push(tGrad);

    const tDone = setTimeout(() => {
      setPhase('done');
      setActiveEdges(new Set());
      setActiveNodes(new Set());
    }, delay + 1800);
    timerRef.current.push(tDone);
  }, [phase]);

  useEffect(() => () => clear(), []);

  const getEdgeColor = (key: string) => {
    if (phase === 'gradient' && shiftedEdges.has(key)) return P.red;
    if (activeEdges.has(key)) return P.redMuted;
    return P.border;
  };

  const getEdgeWidth = (key: string) => {
    if (phase === 'gradient' && shiftedEdges.has(key)) return 1.8;
    if (activeEdges.has(key)) return 1.2;
    return 0.6;
  };

  const getNodeFill = (id: string) => {
    if (activeNodes.has(id)) return P.red;
    return 'none';
  };

  const getNodeStroke = (id: string) => {
    if (activeNodes.has(id)) return P.red;
    return P.inkMuted;
  };

  return (
    <div>
      {/* Input label */}
      <div style={{ marginBottom: '1.2rem' }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.3em', color: P.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Training input
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: '1.15rem', fontStyle: 'italic',
          color: P.ink, padding: '0.6rem 1rem',
          border: `1px solid ${P.borderMid}`,
          background: P.bgPanel,
          display: 'inline-block',
        }}>
          "{EXAMPLE_SENTENCE}"
        </div>
      </div>

      {/* SVG Network */}
      <div style={{ position: 'relative', overflowX: 'auto' }}>
        <svg viewBox="0 0 580 280" style={{ width: '100%', maxWidth: '580px', height: 'auto', display: 'block' }}>
          {/* Layer labels */}
          {['Input', 'Layer 1', 'Layer 2', 'Layer 3', 'Output'].map((label, i) => (
            <text key={label} x={[60, 170, 280, 390, 500][i]} y={18}
              textAnchor="middle" fontFamily={MONO} fontSize="8"
              fill={P.inkFaint} letterSpacing="1">
              {label.toUpperCase()}
            </text>
          ))}

          {/* Edges */}
          {NETWORK.edges.map(e => {
            const from = NETWORK.nodes.find(n => n.id === e.from)!;
            const to = NETWORK.nodes.find(n => n.id === e.to)!;
            const key = `${e.from}-${e.to}`;
            return (
              <motion.line
                key={key}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={getEdgeColor(key)}
                strokeWidth={getEdgeWidth(key)}
                opacity={activeEdges.has(key) || (phase === 'gradient' && shiftedEdges.has(key)) ? 1 : 0.35}
                animate={{
                  stroke: getEdgeColor(key),
                  strokeWidth: getEdgeWidth(key),
                  opacity: activeEdges.has(key) || (phase === 'gradient' && shiftedEdges.has(key)) ? 1 : 0.35,
                }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* Nodes */}
          {NETWORK.nodes.map(node => (
            <g key={node.id}>
              <motion.circle
                cx={node.x} cy={node.y} r={10}
                fill={getNodeFill(node.id)}
                stroke={getNodeStroke(node.id)}
                strokeWidth={activeNodes.has(node.id) ? 1.5 : 0.8}
                animate={{
                  fill: getNodeFill(node.id),
                  stroke: getNodeStroke(node.id),
                }}
                transition={{ duration: 0.25 }}
              />
            </g>
          ))}

          {/* Gradient arrows during gradient phase */}
          {phase === 'gradient' && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              {[170, 280, 390].map(x => (
                <g key={x}>
                  <line x1={x - 30} y1={250} x2={x + 30} y2={250}
                    stroke={P.red} strokeWidth={1} opacity={0.6} />
                  <polygon points={`${x + 30},247 ${x + 30},253 ${x + 38},250`}
                    fill={P.red} opacity={0.6} />
                  <text x={x} y={270} textAnchor="middle" fontFamily={MONO}
                    fontSize="7" fill={P.redMuted} letterSpacing="0.5">
                    ΔWEIGHT
                  </text>
                </g>
              ))}
            </motion.g>
          )}

          {/* Weight shift annotation */}
          {phase === 'gradient' && (
            <motion.text
              x={290} y={140}
              textAnchor="middle"
              fontFamily={MONO} fontSize="7.5"
              fill={P.red}
              letterSpacing="0.8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              PARAMETERS ADJUSTING
            </motion.text>
          )}
        </svg>
      </div>

      {/* Phase labels */}
      <div style={{ marginTop: '1.4rem', minHeight: '3.5rem' }}>
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.inkFaint, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                Awaiting input
              </div>
            </motion.div>
          )}
          {phase === 'forward' && (
            <motion.div key="fwd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.redMuted, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                Forward pass — signal propagating through layers
              </div>
            </motion.div>
          )}
          {phase === 'gradient' && (
            <motion.div key="grad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.red, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Gradient descent — weights adjusting permanently
              </div>
              <div style={{ fontFamily: SERIF, fontSize: '1.1rem', color: P.ink, fontStyle: 'italic' }}>
                The sentence is no longer stored anywhere in this network.
              </div>
            </motion.div>
          )}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{
                display: 'inline-block',
                border: `1px solid ${P.red}`,
                padding: '0.5rem 1rem',
                background: P.redFaint,
              }}>
                <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.2em', color: P.red, textTransform: 'uppercase' }}>
                  The sentence is gone. The adjustment remains.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={runAnimation}
        disabled={phase === 'forward' || phase === 'gradient'}
        style={{
          marginTop: '1.4rem',
          fontFamily: MONO, fontSize: '10px', letterSpacing: '0.25em',
          textTransform: 'uppercase', color: phase === 'forward' || phase === 'gradient' ? P.inkFaint : P.ink,
          background: 'none', border: `1px solid ${phase === 'forward' || phase === 'gradient' ? P.border : P.borderMid}`,
          padding: '0.5rem 1.2rem', cursor: phase === 'forward' || phase === 'gradient' ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {phase === 'idle' ? 'Run training pass' : phase === 'done' ? 'Run again' : 'Running…'}
      </button>
    </div>
  );
}

// ============================================================================
// SECTION 2 — MACHINE UNLEARNING DIAGRAM
// ============================================================================

function UnlearningDiagram() {
  const [revealed, setRevealed] = useState(false);
  const [showUnlearn, setShowUnlearn] = useState(false);

  // Build a dense weight web
  const points: { x: number; y: number; id: number }[] = [];
  const seed = [
    [80, 60], [200, 45], [330, 70], [460, 55], [540, 90],
    [60, 150], [160, 130], [270, 155], [390, 140], [500, 160],
    [90, 230], [210, 215], [340, 240], [450, 220], [530, 245],
    [140, 95], [310, 110], [430, 95], [180, 185], [360, 195],
  ];
  seed.forEach(([x, y], i) => points.push({ x, y, id: i }));

  const connections: [number, number][] = [];
  points.forEach((p, i) => {
    points.forEach((q, j) => {
      if (i < j) {
        const dist = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
        if (dist < 170 && Math.random() > 0.4) connections.push([i, j]);
      }
    });
  });

  // "Influenced" nodes — simulating distributed influence from one training example
  const influencedNodes = new Set([1, 3, 6, 9, 12, 15, 17, 19, 4, 7]);
  const influencedEdges = connections.filter(([a, b]) => influencedNodes.has(a) || influencedNodes.has(b));

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox="0 0 600 290" style={{ width: '100%', maxWidth: '600px', height: 'auto', display: 'block' }}>
          {/* Base connections */}
          {connections.map(([a, b], i) => (
            <line
              key={i}
              x1={points[a].x} y1={points[a].y}
              x2={points[b].x} y2={points[b].y}
              stroke={P.border} strokeWidth={0.6} opacity={0.5}
            />
          ))}

          {/* Revealed influence edges */}
          {revealed && influencedEdges.map(([a, b], i) => (
            <motion.line
              key={`inf-${i}`}
              x1={points[a].x} y1={points[a].y}
              x2={points[b].x} y2={points[b].y}
              stroke={P.red} strokeWidth={1.2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.4, delay: i * 0.02 }}
            />
          ))}

          {/* Base nodes */}
          {points.map(p => (
            <circle
              key={p.id}
              cx={p.x} cy={p.y} r={6}
              fill={P.bgPanel} stroke={P.inkFaint} strokeWidth={0.8}
            />
          ))}

          {/* Revealed influence nodes */}
          {revealed && [...influencedNodes].map(id => {
            const p = points[id];
            return (
              <motion.circle
                key={`inf-node-${id}`}
                cx={p.x} cy={p.y} r={7}
                fill={P.redFaint} stroke={P.red} strokeWidth={1.2}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: id * 0.03 }}
              />
            );
          })}

          {/* Unlearn attempt annotation */}
          {showUnlearn && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <rect x={30} y={20} width={220} height={44} fill={P.redFaint} stroke={P.red} strokeWidth={0.8} strokeDasharray="3,3" />
              <text x={40} y={38} fontFamily={MONO} fontSize="8" fill={P.red} letterSpacing="0.5">
                ATTEMPTING TO ISOLATE INFLUENCE
              </text>
              <text x={40} y={54} fontFamily={MONO} fontSize="8" fill={P.redMuted} letterSpacing="0.3">
                — no contiguous boundary found —
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      {/* Labels */}
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
              <div style={{ fontFamily: MONO, fontSize: '9px', color: P.red, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Influence of a single input — {influencedNodes.size} nodes, {influencedEdges.length} connections
              </div>
              <div style={{ fontFamily: SERIF, fontSize: '1.05rem', color: P.inkMuted, fontStyle: 'italic' }}>
                The influence is non-contiguous. There is no clean boundary to excise.
              </div>
            </motion.div>
          )}
          {showUnlearn && (
            <motion.div key="unlearn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{
                display: 'inline-block',
                border: `1px solid ${P.red}`,
                padding: '0.5rem 1rem',
                background: P.redFaint,
                marginBottom: '0.5rem',
              }}>
                <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.2em', color: P.red, textTransform: 'uppercase' }}>
                  There is no Ctrl+Z.
                </span>
              </div>
              <div style={{ marginTop: '0.6rem', fontFamily: SERIF, fontSize: '1.05rem', color: P.inkMuted, fontStyle: 'italic' }}>
                Approximate unlearning methods exist. They degrade model performance unpredictably.
                The alternative — retraining from scratch — takes months and costs millions.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.4rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setRevealed(true); setShowUnlearn(false); }}
          style={{
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: revealed && !showUnlearn ? P.red : P.ink,
            background: 'none',
            border: `1px solid ${revealed && !showUnlearn ? P.red : P.borderMid}`,
            padding: '0.5rem 1.1rem', cursor: 'pointer',
          }}
        >
          Show influence
        </button>
        <button
          onClick={() => { setRevealed(true); setShowUnlearn(true); }}
          disabled={!revealed}
          style={{
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: !revealed ? P.inkFaint : showUnlearn ? P.red : P.ink,
            background: 'none',
            border: `1px solid ${!revealed ? P.border : showUnlearn ? P.red : P.borderMid}`,
            padding: '0.5rem 1.1rem', cursor: !revealed ? 'not-allowed' : 'pointer',
          }}
        >
          Attempt deletion
        </button>
        <button
          onClick={() => { setRevealed(false); setShowUnlearn(false); }}
          style={{
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: P.inkFaint,
            background: 'none', border: `1px solid ${P.border}`,
            padding: '0.5rem 1.1rem', cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION 3 — CONSENT FRAMEWORK COMPARISON TIMELINE
// ============================================================================

type TimelineStep = {
  label: string;
  sublabel?: string;
  terminal?: boolean;
  warning?: boolean;
};

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
    <div style={{ marginBottom: '2.4rem' }}>
      <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.3em', color: P.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
            {/* Step */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              style={{ textAlign: 'center', minWidth: '110px', maxWidth: '130px' }}
            >
              {/* Node */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <div style={{
                  width: step.terminal ? '14px' : '10px',
                  height: step.terminal ? '14px' : '10px',
                  borderRadius: '50%',
                  background: step.warning ? P.red : step.terminal ? P.ink : 'none',
                  border: `1.5px solid ${step.warning ? P.red : P.inkMuted}`,
                  flexShrink: 0,
                }} />
              </div>
              {/* Label */}
              <div style={{
                fontFamily: step.terminal ? MONO : SERIF,
                fontSize: step.terminal ? '9px' : '0.88rem',
                color: step.warning ? P.red : P.ink,
                letterSpacing: step.terminal ? '0.05em' : 0,
                textTransform: step.terminal ? 'uppercase' : 'none',
                fontStyle: !step.terminal ? 'italic' : 'normal',
                lineHeight: 1.3,
                padding: '0 4px',
              }}>
                {step.label}
              </div>
              {step.sublabel && (
                <div style={{
                  fontFamily: MONO, fontSize: '8px',
                  color: step.warning ? P.redMuted : P.inkFaint,
                  letterSpacing: '0.15em', marginTop: '0.25rem',
                  padding: '0 4px', lineHeight: 1.4,
                }}>
                  {step.sublabel}
                </div>
              )}
            </motion.div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={revealed ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.3, delay: i * 0.15 + 0.1 }}
                style={{
                  height: '1px',
                  width: '28px',
                  background: steps[i + 1]?.warning ? P.redMuted : P.inkFaint,
                  marginTop: '5px',
                  flexShrink: 0,
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

  const canRevealAI = cookieRevealed;
  const canRevealGap = cookieRevealed && aiRevealed;

  return (
    <div>
      <TimelineRow steps={COOKIE_STEPS} label="Cookie consent model — 2003–present" revealed={cookieRevealed} />
      <TimelineRow steps={AI_STEPS} label="AI training model — 2022–present" revealed={aiRevealed} />

      {/* Structural gap annotation */}
      <AnimatePresence>
        {gapRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              borderTop: `1px solid ${P.borderMid}`,
              borderBottom: `1px solid ${P.borderMid}`,
              padding: '1.4rem 0',
              marginTop: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.3em', color: P.redMuted, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
              Finding
            </div>
            <p style={{ fontFamily: SERIF, fontSize: '1.2rem', color: P.ink, lineHeight: 1.65, margin: 0, maxWidth: '680px' }}>
              Cookie consent frameworks were designed for reversible behavioural tracking.
              They are structurally inadequate for irreversible cognitive extraction.
              The gap between these two paradigms is not a policy failure — it is an architectural one.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setCookieRevealed(true)}
          style={{
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: cookieRevealed ? P.inkFaint : P.ink,
            background: 'none', border: `1px solid ${cookieRevealed ? P.border : P.borderMid}`,
            padding: '0.5rem 1.1rem', cursor: cookieRevealed ? 'default' : 'pointer',
          }}
        >
          Show cookie model
        </button>
        <button
          onClick={() => { if (canRevealAI) setAiRevealed(true); }}
          disabled={!canRevealAI}
          style={{
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: !canRevealAI ? P.inkGhost : aiRevealed ? P.inkFaint : P.ink,
            background: 'none',
            border: `1px solid ${!canRevealAI ? P.inkGhost : aiRevealed ? P.border : P.borderMid}`,
            padding: '0.5rem 1.1rem', cursor: !canRevealAI || aiRevealed ? 'not-allowed' : 'pointer',
          }}
        >
          Show AI model
        </button>
        <button
          onClick={() => { if (canRevealGap) setGapRevealed(v => !v); }}
          disabled={!canRevealGap}
          style={{
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: !canRevealGap ? P.inkGhost : gapRevealed ? P.red : P.ink,
            background: !canRevealGap ? 'none' : gapRevealed ? P.redFaint : 'none',
            border: `1px solid ${!canRevealGap ? P.inkGhost : gapRevealed ? P.red : P.borderMid}`,
            padding: '0.5rem 1.1rem', cursor: !canRevealGap ? 'not-allowed' : 'pointer',
          }}
        >
          Show structural gap
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION WRAPPER WITH SCROLL REVEAL
// ============================================================================

function Section({
  number,
  title,
  subtitle,
  children,
  finding,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  finding?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        borderTop: `1px solid ${P.borderMid}`,
        paddingTop: '3.5rem',
        paddingBottom: '4rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.2rem', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.3em', color: P.redMuted, textTransform: 'uppercase' }}>
          {number}
        </span>
        <h2 style={{ fontFamily: SERIF, fontSize: '1.7rem', color: P.ink, margin: 0, fontWeight: 400, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      </div>
      <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: P.inkMuted, fontStyle: 'italic', margin: '0 0 2.4rem', lineHeight: 1.6 }}>
        {subtitle}
      </p>

      {children}

      {finding && (
        <div style={{
          marginTop: '2.4rem',
          paddingTop: '1.4rem',
          borderTop: `1px solid ${P.border}`,
        }}>
          <span style={{ fontFamily: MONO, fontSize: '8.5px', letterSpacing: '0.3em', color: P.inkFaint, textTransform: 'uppercase' }}>
            Mechanism
          </span>
          <p style={{ fontFamily: SERIF, fontSize: '1.08rem', color: P.inkMuted, lineHeight: 1.7, margin: '0.5rem 0 0', maxWidth: '620px' }}>
            {finding}
          </p>
        </div>
      )}
    </motion.section>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ExplainerPage() {
  return (
    <main style={{
      background: P.bg,
      minHeight: '100vh',
      padding: '0 clamp(1.2rem, 5vw, 4rem)',
      fontFamily: SERIF,
    }}>

      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: 'clamp(3rem, 8vw, 6rem)',
        paddingBottom: '3rem',
        borderBottom: `1px solid ${P.borderMid}`,
      }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.35em', color: P.redMuted, textTransform: 'uppercase', marginBottom: '1.2rem' }}>
          Technical finding — YOU AGREED
        </div>
        <h1 style={{
          fontFamily: SERIF, fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 400, color: P.ink, margin: '0 0 1.2rem',
          lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          Why consent, as designed,<br />cannot reach what was taken.
        </h1>
        <p style={{
          fontFamily: SERIF, fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: P.inkMuted, fontStyle: 'italic',
          margin: 0, lineHeight: 1.7, maxWidth: '560px',
        }}>
          Neural network training does not store data. It dissolves data into parameter adjustments
          across billions of weights. This is not a detail — it is the mechanism by which
          all existing consent frameworks become structurally irrelevant.
        </p>
      </div>

      {/* Section 1 */}
      <Section
        number="01"
        title="How training works"
        subtitle="The mechanism by which conversational data is permanently absorbed."
        finding="Training does not store what it learns from. A sentence passed through a model during training is not retained as a record — it is dissolved into incremental adjustments across billions of parameters. The sentence cannot subsequently be located. It cannot, therefore, be removed."
      >
        <NeuralNetworkDiagram />
      </Section>

      {/* Section 2 */}
      <Section
        number="02"
        title="Why deletion fails"
        subtitle="The machine unlearning problem, stated precisely."
        finding="The influence of a single training example is distributed across thousands of non-contiguous parameters — there is no clean boundary to excise. You cannot surgically remove what was never surgically inserted. Approximate unlearning methods exist; they degrade model performance unpredictably and cannot offer the guarantees deletion requires."
      >
        <UnlearningDiagram />
      </Section>

      {/* Section 3 */}
      <Section
        number="03"
        title="Why consent frameworks fail"
        subtitle="The structural argument. Not a policy critique — an architectural one."
      >
        <ConsentDiagram />
      </Section>

      {/* Footer note */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: '2rem',
        paddingBottom: 'clamp(3rem, 8vw, 6rem)',
        borderTop: `1px solid ${P.border}`,
      }}>
        <p style={{ fontFamily: MONO, fontSize: '9px', letterSpacing: '0.2em', color: P.inkFaint, textTransform: 'uppercase', lineHeight: 2, margin: 0 }}>
          Sources — Cooper et al. (2022), machine unlearning impossibility &nbsp;·&nbsp;
          Zuboff (2019), surveillance capitalism stages &nbsp;·&nbsp;
          Nissenbaum (2004), contextual integrity &nbsp;·&nbsp;
          Gumusel et al. (2024), conversational AI privacy harms
        </p>
      </div>
    </main>
  );
}
