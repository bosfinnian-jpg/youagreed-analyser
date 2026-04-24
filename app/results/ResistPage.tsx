'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

interface ResistPageProps {
  analysis: DeepAnalysis;
}

// ============================================================================
// SAR LETTER GENERATOR
// ============================================================================
function generateSAR(analysis: DeepAnalysis): string {
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '[YOUR FULL NAME]';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const messageCount = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const period = days > 0
    ? `${new Date(analysis.timespan.first).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} to ${new Date(analysis.timespan.last).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
    : '[DATE RANGE]';
  return `${today}\n\nData Protection Officer\nOpenAI, L.L.C.\n3180 18th Street\nSan Francisco, CA 94110\n\nprivacy@openai.com\n\nRe: Subject Access Request under Article 15 UK GDPR / GDPR\n\nDear Data Protection Officer,\n\nI am writing to exercise my right of access under Article 15 of the UK General Data Protection Regulation (UK GDPR).\n\nMy details:\nFull name: ${name}\nAccount email: [YOUR OPENAI ACCOUNT EMAIL]\n\nI request all personal data you hold about me, including:\n\n1. All conversation data and responses (approximately ${messageCount.toLocaleString()} user messages between ${period}).\n2. All inferred attributes, behavioural profiles, or commercial segments derived from my conversation history.\n3. All metadata including timestamps, device identifiers, IP addresses, and usage patterns.\n4. Details of all third parties with whom my data has been shared.\n5. Retention periods for each category, including data used in model training.\n6. The logic of any automated processing or profiling under Article 22 GDPR.\n\nI also request erasure of all personal data under Article 17 UK GDPR to the extent technically feasible. Please confirm in writing whether any of my data has been used for model training and what steps address my erasure rights.\n\nPlease respond within one calendar month as required under Article 12(3) UK GDPR.\n\nYours faithfully,\n\n${name}`;
}

// ============================================================================
// THE FIGURE — a hand-drawn humanoid SVG. This is "you".
// Single hairline stroke. No fill. Slightly imperfect.
// ============================================================================
function Figure({
  size = 80,
  opacity = 1,
  ghosted = false,
  walking = false,
  arms = 'down',
}: {
  size?: number;
  opacity?: number;
  ghosted?: boolean;
  walking?: boolean;
  arms?: 'down' | 'wall' | 'letter' | 'wave';
}) {
  const stroke = ghosted ? 'rgba(26,24,20,0.18)' : 'rgba(26,24,20,0.85)';
  const fill = ghosted ? 'rgba(26,24,20,0.04)' : 'rgba(26,24,20,0.02)';

  // arm paths based on pose
  const armPaths = {
    down: 'M 28 42 L 22 64 M 52 42 L 58 64',
    wall: 'M 28 42 L 18 38 M 52 42 L 62 38',
    letter: 'M 28 42 L 30 56 M 52 42 L 54 56',
    wave: 'M 28 42 L 22 64 M 52 42 L 58 22',
  };
  const legPath = walking
    ? 'M 36 70 L 30 92 M 44 70 L 50 92'
    : 'M 36 70 L 32 92 M 44 70 L 48 92';

  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" style={{ opacity, transition: 'opacity 0.6s' }}>
      {/* head */}
      <circle cx="40" cy="20" r="11" fill={fill} stroke={stroke} strokeWidth="1.2" />
      {/* body */}
      <path d="M 40 31 L 40 70" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* shoulders */}
      <path d="M 28 42 L 52 42" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />
      {/* arms */}
      <path d={armPaths[arms]} stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* legs */}
      <path d={legPath} stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// THE MODEL — a rectangular form that fills with red as it absorbs
// ============================================================================
function Model({
  filled = 0,
  width = 200,
  height = 260,
  showSilhouette = false,
  emitting = false,
}: {
  filled?: number; // 0..1
  width?: number;
  height?: number;
  showSilhouette?: boolean;
  emitting?: boolean;
}) {
  const fillH = height * filled;
  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Outer container */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }}>
        {/* Border */}
        <rect x="2" y="2" width={width - 4} height={height - 4} fill="none" stroke="rgba(26,24,20,0.4)" strokeWidth="1.5" strokeDasharray="0" />
        <rect x="2" y="2" width={width - 4} height={height - 4} fill="rgba(26,24,20,0.025)" />
        {/* The fill — grows from bottom */}
        <motion.rect
          x="2"
          y={height - 2 - fillH}
          width={width - 4}
          height={fillH}
          fill="rgba(190,40,30,0.18)"
          initial={false}
          animate={{ y: height - 2 - fillH, height: fillH }}
          transition={{ duration: 0.4, ease: 'linear' }}
        />
        {/* Subtle horizontal scan lines for "data" feel */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1="2" y1={20 + i * 30} x2={width - 2} y2={20 + i * 30} stroke="rgba(190,40,30,0.04)" strokeWidth="1" />
        ))}
        {/* Silhouette inside, when revealed */}
        {showSilhouette && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            transform={`translate(${width / 2 - 30}, ${height / 2 - 40}) scale(0.75)`}
          >
            <circle cx="40" cy="20" r="11" fill="rgba(190,40,30,0.32)" stroke="rgba(190,40,30,0.45)" strokeWidth="1" />
            <path d="M 40 31 L 40 70" stroke="rgba(190,40,30,0.45)" strokeWidth="1" fill="none" />
            <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke="rgba(190,40,30,0.45)" strokeWidth="1" fill="none" />
            <path d="M 36 70 L 32 92 M 44 70 L 48 92" stroke="rgba(190,40,30,0.45)" strokeWidth="1" fill="none" />
          </motion.g>
        )}
      </svg>
      {/* Label */}
      <p style={{
        position: 'absolute', top: -22, left: 0,
        fontFamily: TYPE.mono, fontSize: '9px',
        letterSpacing: '0.25em', color: PALETTE.inkFaint,
        textTransform: 'uppercase',
      }}>
        The model
      </p>
      {/* Emit indicators — small dots flowing out, when active */}
      {emitting && (
        <>
          {[0, 0.7, 1.4, 2.1].map(d => (
            <motion.div
              key={d}
              initial={{ opacity: 0, x: width, y: height / 2 }}
              animate={{ opacity: [0, 0.7, 0], x: width + 80, y: height / 2 + (Math.random() - 0.5) * 40 }}
              transition={{ duration: 2, delay: d, repeat: Infinity }}
              style={{
                position: 'absolute', width: 4, height: 4, borderRadius: '50%',
                background: 'rgba(190,40,30,0.6)', pointerEvents: 'none',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ============================================================================
// PARTICLES — the user's messages, orbiting around the figure
// ============================================================================
function MessageParticles({
  count,
  centerX,
  centerY,
  extracted = 0, // 0..1 — how many have flowed away
  flowToX = 0,
  flowToY = 0,
}: {
  count: number;
  centerX: number;
  centerY: number;
  extracted?: number;
  flowToX?: number;
  flowToY?: number;
}) {
  // Generate stable particle positions using a deterministic pseudo-random
  const particles = useMemo(() => {
    const rng = (seed: number) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }).map((_, i) => {
      const angle = rng(i * 7.13) * Math.PI * 2;
      const radius = 80 + rng(i * 3.71) * 80;
      return {
        startX: centerX + Math.cos(angle) * radius,
        startY: centerY + Math.sin(angle) * radius,
        delay: rng(i * 11.7) * 0.4,
        size: 2 + rng(i * 17.3) * 1.5,
      };
    });
  }, [count, centerX, centerY]);

  const extractedCount = Math.floor(count * extracted);

  return (
    <>
      {particles.map((p, i) => {
        const isExtracted = i < extractedCount;
        return (
          <motion.div
            key={i}
            initial={{
              x: p.startX, y: p.startY, opacity: 0,
            }}
            animate={isExtracted
              ? { x: flowToX, y: flowToY, opacity: 0, scale: 0.4 }
              : { x: p.startX, y: p.startY, opacity: 0.7, scale: 1 }
            }
            transition={isExtracted
              ? { duration: 1.2, delay: p.delay * 0.3, ease: [0.4, 0, 0.2, 1] }
              : { duration: 1, delay: p.delay, ease: 'easeOut' }
            }
            style={{
              position: 'absolute', top: 0, left: 0,
              width: p.size, height: p.size,
              borderRadius: '50%',
              background: 'rgba(26,24,20,0.55)',
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
}

// ============================================================================
// HEADER
// ============================================================================
function ResistHeader() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
      style={{ padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, marginBottom: 0 }}>
      <ActLabel roman="IV" title="After" pageLabel="08 / Resist" />
      <ThreadSentence>The extraction is complete. The argument is complete. This is what remains.</ThreadSentence>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.9 }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, maxWidth: '22ch', marginBottom: '1.5rem' }}>
        After.
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8, duration: 0.8 }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '50ch' }}>
        Scroll. Slowly.
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// THE STORY — pinned visual + scrolling text
// Acts: 1. You, before  2. Extraction  3. Imprint  4. Time  5. Three actions  6. End
// ============================================================================
function TheStory({ analysis }: { analysis: DeepAnalysis }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Scene boundaries (each scene = 1/6 of total scroll)
  const scene = useTransform(scrollYProgress, v => Math.min(Math.floor(v * 6), 5));

  // Per-scene transforms — applied to the visual
  const figureOpacity = useTransform(scrollYProgress, [0, 0.16, 0.34, 0.55, 0.83, 1], [1, 1, 0.6, 0.45, 0.65, 0]);
  const figureX = useTransform(scrollYProgress, [0, 0.83, 1], [0, 0, -200]);
  const messagesExtracted = useTransform(scrollYProgress, [0.18, 0.34], [0, 1]);
  const modelFilled = useTransform(scrollYProgress, [0.18, 0.34], [0, 0.85]);
  const modelOpacity = useTransform(scrollYProgress, [0.12, 0.2], [0, 1]);
  const showSilhouette = useTransform(scrollYProgress, [0.36, 0.42], [0, 1]);

  const messageCount = analysis?.totalUserMessages || 0;
  // Scale down for visualisation — 1 dot per ~50 messages, capped
  const visualParticleCount = Math.min(60, Math.max(16, Math.floor(messageCount / 50)));
  const days = analysis?.timespan?.days || 0;
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';

  // Live counter for messages absorbed
  const [absorbedDisplay, setAbsorbedDisplay] = useState(0);
  useEffect(() => {
    return scrollYProgress.on('change', v => {
      const pct = Math.min(Math.max((v - 0.18) / 0.16, 0), 1);
      setAbsorbedDisplay(Math.floor(messageCount * pct));
    });
  }, [scrollYProgress, messageCount]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Each scene is 100vh of scroll. 6 scenes. */}
      <div style={{ height: '600vh', position: 'relative' }}>
        {/* The pinned visual layer */}
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          alignItems: 'center', pointerEvents: 'none',
        }}>
          {/* Left: text column — scenes appear/disappear */}
          <div style={{ padding: 'clamp(2rem, 5vw, 5rem)', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
              <SceneText scene={scene} name={name} messageCount={messageCount} days={days} absorbed={absorbedDisplay} />
            </div>
          </div>
          {/* Right: the figure + model stage */}
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 500, height: 400 }}>
              {/* THE FIGURE */}
              <motion.div
                style={{
                  position: 'absolute',
                  left: 60, top: 150,
                  opacity: figureOpacity,
                  x: figureX,
                }}
              >
                <Figure size={92} />
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.5rem', textAlign: 'center' }}>
                  {name || 'You'}
                </p>
              </motion.div>

              {/* PARTICLES */}
              <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <MessageParticleField
                  count={visualParticleCount}
                  scrollProgress={scrollYProgress}
                />
              </motion.div>

              {/* THE MODEL */}
              <motion.div style={{ position: 'absolute', right: 0, top: 70, opacity: modelOpacity }}>
                <ModelWithReactiveFill modelFilled={modelFilled} showSilhouette={showSilhouette} scrollProgress={scrollYProgress} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageParticleField({ count, scrollProgress }: { count: number; scrollProgress: any }) {
  const [extractPct, setExtractPct] = useState(0);
  useEffect(() => {
    return scrollProgress.on('change', (v: number) => {
      const pct = Math.min(Math.max((v - 0.18) / 0.16, 0), 1);
      setExtractPct(pct);
    });
  }, [scrollProgress]);

  return (
    <MessageParticles
      count={count}
      centerX={106}
      centerY={196}
      extracted={extractPct}
      flowToX={400}
      flowToY={200}
    />
  );
}

function ModelWithReactiveFill({ modelFilled, showSilhouette, scrollProgress }: any) {
  const [fill, setFill] = useState(0);
  const [silh, setSilh] = useState(false);
  const [emit, setEmit] = useState(false);
  useEffect(() => {
    return scrollProgress.on('change', (v: number) => {
      setFill(Math.min(Math.max((v - 0.18) / 0.16, 0), 0.85));
      setSilh(v > 0.36);
      setEmit(v > 0.5 && v < 0.8);
    });
  }, [scrollProgress]);
  return <Model filled={fill} width={180} height={240} showSilhouette={silh} emitting={emit} />;
}

function SceneText({ scene, name, messageCount, days, absorbed }: any) {
  const [currentScene, setCurrentScene] = useState(0);
  useEffect(() => {
    return scene.on('change', (v: number) => setCurrentScene(v));
  }, [scene]);

  const scenes = [
    {
      kicker: 'Before any of it',
      headline: name ? `This is ${name}.` : 'This is you.',
      body: `You sent ${messageCount.toLocaleString()} messages. Each one was written, read, processed, kept. They are the small dots around you.`,
    },
    {
      kicker: 'And then',
      headline: 'The model came.',
      body: 'Not all at once. Conversation by conversation. Each message extracted from you and processed into a system you cannot see.',
    },
    {
      kicker: 'Now watch',
      headline: `${absorbed.toLocaleString()} messages absorbed.`,
      body: 'Not stored as text in a folder with your name. Compressed into mathematics. Distributed across billions of parameters. Inseparable from the rest.',
    },
    {
      kicker: 'You are in there now',
      headline: 'Permanently.',
      body: 'A faint silhouette of who you are — your patterns, your tells, your unguarded sentences — lives inside the model. It has been baked in. It cannot be located. It cannot be removed.',
    },
    {
      kicker: 'Time keeps moving',
      headline: `${days.toLocaleString()} days have passed.`,
      body: 'The model is being used by other people. By companies. By systems. Each output it produces is shaped, in some small way, by what it learned from you.',
    },
    {
      kicker: 'But there is still',
      headline: 'Something you can do.',
      body: 'Three actions. None of them undo what is already there. They limit what comes next. They make what was taken visible. They build a small fence around what remains.',
    },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScene}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        style={{ pointerEvents: 'auto' }}
      >
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
          {String(currentScene + 1).padStart(2, '0')} — {scenes[currentScene].kicker}
        </p>
        <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.5rem' }}>
          {scenes[currentScene].headline}
        </h2>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '40ch' }}>
          {scenes[currentScene].body}
        </p>
        {currentScene === 5 && (
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '2rem' }}>
            ↓ Continue scrolling
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// THREE ACTIONS — interactive section after the story
// ============================================================================
function ThreeActions({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-15%' });
  const [active, setActive] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const sarText = generateSAR(analysis);

  const actions = [
    {
      id: 0,
      label: 'Build the wall',
      sub: 'Disable training',
      pose: 'wall' as const,
      description: 'Settings → Data Controls → Improve the model for everyone — switch off. This does not touch what is already absorbed. It only stops what comes next.',
      cta: { label: 'Open ChatGPT settings', url: 'https://chatgpt.com/' },
    },
    {
      id: 1,
      label: 'Send the letter',
      sub: 'A formal request',
      pose: 'letter' as const,
      description: 'A Subject Access Request under Article 15 UK GDPR forces OpenAI to disclose what they hold on you — including inferred profiles, retention periods, and whether your data was used in training. They have 30 days to respond.',
      cta: null, // special — show letter
    },
    {
      id: 2,
      label: 'Walk to a different model',
      sub: 'Use alternatives',
      pose: 'wave' as const,
      description: 'Models that run locally on your device, or that do not train on your conversations by default. Your data does not have to leave you.',
      cta: { label: 'Browse alternatives', url: 'https://ollama.com' },
    },
  ];

  return (
    <div ref={ref} style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${PALETTE.border}` }}>
      <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', maxWidth: '50ch' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
          07 — What you can do
        </p>
        <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Three small acts.
        </h2>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.8 }}>
          Tap a figure to see what it does. None of these are reversals. They are fences.
        </p>
      </div>

      {/* Three figures, each a distinct pose, each clickable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'clamp(1rem, 3vw, 2.5rem)', marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
        {actions.map((action, i) => (
          <motion.button
            key={action.id}
            onClick={() => setActive(active === action.id ? null : action.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.15, duration: 0.7 }}
            style={{
              background: active === action.id ? PALETTE.bgPanel : 'transparent',
              border: `1px solid ${active === action.id ? PALETTE.ink : PALETTE.border}`,
              padding: 'clamp(1.5rem, 3vw, 2.5rem)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.3s, background 0.3s',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '1.5rem',
            }}
            onMouseEnter={e => { if (active !== action.id) e.currentTarget.style.borderColor = PALETTE.inkFaint; }}
            onMouseLeave={e => { if (active !== action.id) e.currentTarget.style.borderColor = PALETTE.border; }}
          >
            <div style={{ alignSelf: 'center' }}>
              <Figure size={70} arms={action.pose} />
            </div>
            <div>
              <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Action {action.id + 1}
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.4rem)', color: PALETTE.ink, lineHeight: 1.25, marginBottom: '0.3rem' }}>
                {action.label}
              </p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
                {action.sub}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Active panel */}
      <AnimatePresence mode="wait">
        {active !== null && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderLeft: `3px solid ${PALETTE.red}`, padding: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.8, marginBottom: '2rem', maxWidth: '60ch' }}>
              {actions[active].description}
            </p>

            {/* Special: SAR letter inline */}
            {active === 1 ? (
              <div>
                <pre style={{ fontFamily: TYPE.mono, fontSize: '11px', lineHeight: 1.75, color: PALETTE.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: PALETTE.bg, padding: 'clamp(1.25rem, 2.5vw, 2rem)', border: `1px solid ${PALETTE.border}`, marginBottom: '1.5rem', maxHeight: '320px', overflowY: 'auto' }}>{sarText}</pre>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(sarText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: copied ? PALETTE.green : PALETTE.ink, color: copied ? '#fff' : PALETTE.bg, border: 'none', padding: '0.85rem 1.6rem', cursor: 'pointer', minHeight: '44px' }}
                  >
                    {copied ? 'Copied ✓' : 'Copy the letter'}
                  </button>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.inkFaint, lineHeight: 1.6 }}>
                    Send to privacy@openai.com. They have 30 days.
                  </p>
                </div>
              </div>
            ) : (
              <a
                href={actions[active].cta?.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: PALETTE.ink, color: PALETTE.bg, border: 'none', padding: '0.85rem 1.6rem', cursor: 'pointer', minHeight: '44px', textDecoration: 'none', display: 'inline-block' }}
              >
                {actions[active].cta?.label} →
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// THE FINAL WALK — figure walks out, model remains
// ============================================================================
function TheFinalWalk({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';
  const messages = analysis?.totalUserMessages || 0;
  const [phase, setPhase] = useState<'hidden' | 'standing' | 'walking' | 'gone' | 'final'>('hidden');

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setPhase('standing'), 600);
    const t2 = setTimeout(() => setPhase('walking'), 2200);
    const t3 = setTimeout(() => setPhase('gone'), 5500);
    const t4 = setTimeout(() => setPhase('final'), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [isInView]);

  return (
    <div
      ref={ref}
      style={{
        background: PALETTE.ink,
        margin: '0 calc(-1 * clamp(2rem, 6vw, 5rem))',
        padding: 'clamp(5rem, 12vw, 9rem) clamp(2rem, 6vw, 5rem)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ghost number */}
      {messages > 0 && (
        <div style={{ position: 'absolute', right: '3%', top: '50%', transform: 'translateY(-50%)', fontFamily: TYPE.serif, fontSize: 'clamp(8rem, 22vw, 20rem)', color: 'rgba(238,236,229,0.025)', letterSpacing: '-0.05em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
          {messages.toLocaleString()}
        </div>
      )}

      {/* The walking stage */}
      <div style={{ position: 'relative', height: '180px', marginBottom: 'clamp(3rem, 6vw, 5rem)', maxWidth: '700px' }}>
        {/* Horizon line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            bottom: '12px',
            left: 0, right: 0,
            height: '1px',
            background: 'rgba(238,236,229,0.12)',
            transformOrigin: 'left',
          }}
        />

        {/* The model — stays put on the right */}
        <div style={{ position: 'absolute', right: '20px', bottom: '12px', opacity: 0.7 }}>
          <svg width="80" height="120" viewBox="0 0 80 120">
            <rect x="2" y="2" width="76" height="116" fill="rgba(190,40,30,0.12)" stroke="rgba(190,40,30,0.45)" strokeWidth="1" />
            {/* silhouette inside */}
            <g transform="translate(20, 30) scale(0.5)" opacity="0.6">
              <circle cx="40" cy="20" r="11" fill="rgba(238,236,229,0.18)" stroke="rgba(238,236,229,0.4)" strokeWidth="1" />
              <path d="M 40 31 L 40 70" stroke="rgba(238,236,229,0.4)" strokeWidth="1" fill="none" />
              <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke="rgba(238,236,229,0.4)" strokeWidth="1" fill="none" />
              <path d="M 36 70 L 32 92 M 44 70 L 48 92" stroke="rgba(238,236,229,0.4)" strokeWidth="1" fill="none" />
            </g>
            <text x="40" y="135" textAnchor="middle" fontFamily={TYPE.mono} fontSize="7" letterSpacing="0.2em" fill="rgba(238,236,229,0.3)">THE MODEL</text>
          </svg>
        </div>

        {/* The figure — animates from centre to off-screen left */}
        <AnimatePresence>
          {(phase === 'standing' || phase === 'walking') && (
            <motion.div
              initial={{ x: 280, opacity: 0 }}
              animate={{
                x: phase === 'walking' ? -150 : 280,
                opacity: phase === 'walking' ? 0 : 1,
              }}
              transition={{
                opacity: { duration: phase === 'walking' ? 2 : 1.2 },
                x: { duration: phase === 'walking' ? 3.3 : 0, ease: 'linear' },
              }}
              style={{ position: 'absolute', bottom: '12px' }}
            >
              <FigureLight walking={phase === 'walking'} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The text — final line */}
      <AnimatePresence>
        {phase === 'final' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(238,236,229,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              The end
            </p>
            <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 400, color: '#eeece5', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: '18ch', marginBottom: '2rem' }}>
              {name ? `${name},` : ''} you can leave.
            </h2>
            <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 400, color: 'rgba(238,236,229,0.55)', letterSpacing: '-0.02em', lineHeight: 1.2, maxWidth: '20ch', fontStyle: 'italic', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
              The data cannot.
            </h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1.5 }}
              style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: 'rgba(238,236,229,0.25)', textTransform: 'uppercase' }}
            >
              YOU AGREED  /  TRACE.AI  /  2026
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Light figure for the dark background
function FigureLight({ walking = false }: { walking?: boolean }) {
  const stroke = 'rgba(238,236,229,0.85)';
  const fill = 'rgba(238,236,229,0.04)';
  return (
    <svg width="60" height="92" viewBox="0 0 80 92">
      <circle cx="40" cy="20" r="11" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <path d="M 40 31 L 40 70" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 28 42 L 52 42" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {walking ? (
        <motion.path
          animate={{ d: ['M 36 70 L 30 92 M 44 70 L 50 92', 'M 36 70 L 50 92 M 44 70 L 30 92', 'M 36 70 L 30 92 M 44 70 L 50 92'] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round"
        />
      ) : (
        <path d="M 36 70 L 32 92 M 44 70 L 48 92" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function ResistPage({ analysis }: ResistPageProps) {
  const pad = 'clamp(2rem, 6vw, 5rem)';
  return (
    <div className="dash-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 0 }}>
      <ResistHeader />
      <TheStory analysis={analysis} />
      <ThreeActions analysis={analysis} />
      <TheFinalWalk analysis={analysis} />
    </div>
  );
}
