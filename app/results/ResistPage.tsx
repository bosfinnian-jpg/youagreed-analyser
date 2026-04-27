'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
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
// DESIGN TOKENS - for this page specifically
// ============================================================================
const STORY = {
  // Act boundaries as fractions of total scroll (9 acts = 9 phases)
  // Each act gets ~11% of scroll
  arrival:    [0.00, 0.08],
  counted:    [0.08, 0.20],
  machine:    [0.20, 0.30],
  taking:     [0.30, 0.46],
  echo:       [0.46, 0.66], // longest - the centrepiece
  imprint:    [0.66, 0.76],
  choice:     [0.76, 0.88],
  walkaway:   [0.88, 1.00],
};

// Smooth step - used for elegant in/out interpolation
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ============================================================================
// FIGURE - single hand-drawn humanoid, multiple poses
// ============================================================================
type FigurePose = 'neutral' | 'wall' | 'letter' | 'wave';
function Figure({
  size = 90, opacity = 1, pose = 'neutral', walking = false, walkingFrame = 0,
  strokeColor, fillColor,
}: {
  size?: number; opacity?: number; pose?: FigurePose; walking?: boolean; walkingFrame?: number;
  strokeColor?: string; fillColor?: string;
}) {
  const stroke = strokeColor || 'rgba(26,24,20,0.88)';
  const fill = fillColor || 'rgba(26,24,20,0.02)';
  const idle = !walking;

  const armPaths: Record<FigurePose, string> = {
    neutral: 'M 28 42 L 22 64 M 52 42 L 58 64',
    wall:    'M 28 42 L 16 36 M 52 42 L 64 36',
    letter:  'M 28 42 L 32 58 M 52 42 L 48 58',
    wave:    'M 28 42 L 22 64 M 52 42 L 56 20',
  };
  const legPath = walking
    ? (walkingFrame === 0 ? 'M 36 70 L 28 92 M 44 70 L 52 92' : 'M 36 70 L 52 92 M 44 70 L 28 92')
    : 'M 36 70 L 32 92 M 44 70 L 48 92';

  return (
    <motion.svg
      width={size} height={size * 1.15} viewBox="0 0 80 92"
      style={{ opacity, transition: 'opacity 0.8s ease', transformOrigin: '40px 70px' }}
      animate={idle ? { rotate: [0, 2.5, 0, -2.5, 0] } : { rotate: 0 }}
      transition={idle
        ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.3 }
      }
    >
      {/* head */}
      <circle cx="40" cy="20" r="11" fill={fill} stroke={stroke} strokeWidth="2" />
      {/* eyes */}
      <circle cx="36.5" cy="18.5" r="1.2" fill={stroke} opacity={0.75} />
      <circle cx="43.5" cy="18.5" r="1.2" fill={stroke} opacity={0.75} />
      {/* mouth - faint gentle curve */}
      <path d="M 36.5 23.5 Q 40 25.5 43.5 23.5" stroke={stroke} strokeWidth="1" fill="none" strokeLinecap="round" opacity={0.4} />
      {/* body */}
      <path d="M 40 31 L 40 70" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* shoulder line */}
      <path d="M 28 42 L 52 42" stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={0.5} />
      {/* arms */}
      <path d={armPaths[pose]} stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* legs */}
      <path d={legPath} stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}

// ============================================================================
// THE MACHINE - no longer a rectangle. Hand-drawn container with imperfect edges.
// Fills with red ink from the bottom. Shows silhouette when imprinted.
// ============================================================================
function Machine({
  formProgress = 0,   // 0..1 - how much the machine has materialised
  fillProgress = 0,   // 0..1 - how full of red it is
  showSilhouette = 0, // 0..1 - ghost of user inside
  emitting = false,   // red particles leaving
  width = 200,
  height = 280,
}: {
  formProgress?: number;
  fillProgress?: number;
  showSilhouette?: number;
  emitting?: boolean;
  width?: number;
  height?: number;
}) {
  const fillH = height * fillProgress * 0.85;
  const strokeOpacity = formProgress * 0.55;
  const noiseFilterId = `machine-noise-${width}`;

  const inset = 2;
  const path = `
    M ${inset} ${inset + 2}
    Q ${inset - 1} ${height / 3}, ${inset + 1} ${height - inset - 1}
    L ${width - inset} ${height - inset}
    Q ${width - inset + 1} ${height / 2}, ${width - inset - 1} ${inset}
    Z
  `.replace(/\s+/g, ' ');

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <defs>
          <clipPath id={`machine-clip-${width}`}>
            <path d={path} />
          </clipPath>
          <linearGradient id="ink-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(190,40,30,0.28)" />
            <stop offset="70%" stopColor="rgba(190,40,30,0.18)" />
            <stop offset="100%" stopColor="rgba(190,40,30,0.02)" />
          </linearGradient>
          {/* Low-frequency noise texture */}
          <filter id={noiseFilterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* Container outline - draws on */}
        <motion.path
          d={path}
          fill="none"
          stroke={PALETTE.ink}
          strokeWidth="1.2"
          strokeOpacity={strokeOpacity}
          strokeDasharray={formProgress < 1 ? '2,3' : '0'}
          pathLength={1}
          initial={false}
          style={{ strokeDashoffset: 1 - formProgress }}
        />

        {/* Noise texture - faint grain over machine body */}
        <g clipPath={`url(#machine-clip-${width})`}>
          <rect
            width={width} height={height}
            filter={`url(#${noiseFilterId})`}
            opacity={formProgress * 0.055}
          />
        </g>

        {/* Very faint background hatching - appears as it forms */}
        <g clipPath={`url(#machine-clip-${width})`} opacity={formProgress * 0.3}>
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i}
              x1="0" y1={i * 22}
              x2={width} y2={i * 22 - 8}
              stroke={PALETTE.ink} strokeWidth="0.4" strokeOpacity="0.3"
            />
          ))}
        </g>

        {/* The ink rising */}
        <g clipPath={`url(#machine-clip-${width})`}>
          <motion.rect
            x="0"
            width={width}
            y={height - fillH}
            height={fillH}
            fill="url(#ink-grad)"
            initial={false}
            animate={{ y: height - fillH }}
            transition={{ type: 'tween', duration: 0.5, ease: 'linear' }}
          />
          {fillH > 4 && (
            <motion.line
              x1="0" y1={height - fillH}
              x2={width} y2={height - fillH}
              stroke="rgba(190,40,30,0.5)" strokeWidth="0.8"
              initial={false}
              animate={{ y1: height - fillH, y2: height - fillH }}
              transition={{ type: 'tween', duration: 0.5 }}
            />
          )}
        </g>

        {/* Silhouette - appears once filled, ghost of the user inside */}
        {showSilhouette > 0 && (
          <g clipPath={`url(#machine-clip-${width})`}>
            <g
              transform={`translate(${width / 2 - 34}, ${height / 2 - 46}) scale(0.82)`}
              opacity={showSilhouette}
            >
              <circle cx="40" cy="20" r="11" fill="rgba(190,40,30,0.38)" stroke="rgba(190,40,30,0.7)" strokeWidth="1" />
              <path d="M 40 31 L 40 70" stroke="rgba(190,40,30,0.7)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M 28 42 L 52 42" stroke="rgba(190,40,30,0.5)" strokeWidth="1" fill="none" />
              <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke="rgba(190,40,30,0.7)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path d="M 36 70 L 32 92 M 44 70 L 48 92" stroke="rgba(190,40,30,0.7)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>

      {/* Interior pulse - slow breathing dark red radial gradient when machine is present */}
      {formProgress > 0.3 && (
        <motion.div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 60%, rgba(120,0,0,0.9) 0%, rgba(120,0,0,0) 65%)',
          }}
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Label - fades in with form */}
      <p style={{
        position: 'absolute', top: -22, left: 0,
        fontFamily: TYPE.mono, fontSize: '9px',
        letterSpacing: '0.3em', color: PALETTE.inkFaint,
        textTransform: 'uppercase',
        opacity: formProgress,
        transition: 'opacity 0.6s',
      }}>
        The model
      </p>

      {/* Emit particles - trailing horizontal lines, data bleeding out */}
      {emitting && (
        <>
          {[0, 0.8, 1.6, 2.4, 3.2].map((d, i) => (
            <motion.div
              key={`emit-${i}`}
              initial={{ opacity: 0, x: width, y: height * 0.3 + (i * 22) }}
              animate={{ opacity: [0, 0.7, 0], x: width + 140, y: height * 0.3 + (i * 22) + (i % 2 ? -6 : 6) }}
              transition={{ duration: 2.8, delay: d, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', width: 4, height: 1, borderRadius: 0,
                background: 'rgba(190,40,30,0.55)', pointerEvents: 'none',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ============================================================================
// PARTICLES - generated once, deterministic positions. Extracted by progress.
// ============================================================================
interface Particle { sx: number; sy: number; delay: number; size: number; }
function useParticles(count: number, cx: number, cy: number): Particle[] {
  return useMemo(() => {
    const rng = (seed: number) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
    return Array.from({ length: count }).map((_, i) => {
      const angle = rng(i * 7.13) * Math.PI * 2;
      const radius = 72 + rng(i * 3.71) * 90;
      return {
        sx: cx + Math.cos(angle) * radius,
        sy: cy + Math.sin(angle) * radius * 0.85,
        delay: rng(i * 11.7) * 0.6,
        size: 1.8 + rng(i * 17.3) * 1.8,
      };
    });
  }, [count, cx, cy]);
}

function Particles({
  particles, arrivalProgress, extractProgress, flowX, flowY,
}: {
  particles: Particle[];
  arrivalProgress: number; // 0..1 - how many have arrived
  extractProgress: number; // 0..1 - how many have left
  flowX: number; flowY: number;
}) {
  const total = particles.length;
  const arrivedCount = Math.floor(total * arrivalProgress);
  const extractedCount = Math.floor(total * extractProgress);

  return (
    <>
      {particles.map((p, i) => {
        const isArrived = i < arrivedCount;
        const isExtracted = i < extractedCount;
        let animate;
        if (isExtracted) {
          animate = { x: flowX, y: flowY, opacity: 0, scale: 0.3 };
        } else if (isArrived) {
          animate = { x: p.sx, y: p.sy, opacity: 0.7, scale: 1 };
        } else {
          animate = { x: p.sx, y: p.sy, opacity: 0, scale: 0.5 };
        }
        return (
          <motion.div
            key={i}
            initial={false}
            animate={animate}
            transition={isExtracted
              ? { duration: 1.1, delay: p.delay * 0.2, ease: [0.4, 0, 0.2, 1] }
              : { duration: 0.7, delay: p.delay * 0.5, ease: 'easeOut' }
            }
            style={{
              position: 'absolute', top: 0, left: 0,
              width: p.size, height: p.size,
              borderRadius: '50%',
              background: 'rgba(26,24,20,0.6)',
              pointerEvents: 'none',
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </>
  );
}

// ============================================================================
// COUNTER - animates from 0 to target on trigger, ease-out cubic
// ============================================================================
function AnimatedCounter({ target, active, duration = 2400 }: { target: number; active: boolean; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) { setDisplay(0); return; }
    if (raf.current) cancelAnimationFrame(raf.current);
    startRef.current = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - (startRef.current || now)) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, active, duration]);

  return <>{display.toLocaleString()}</>;
}

// ============================================================================
// PROGRESS RAIL - slim vertical rail at right showing scroll through acts
// ============================================================================
const ACT_LABELS = ['ARRIVAL', 'COUNTED', 'MACHINE', 'TAKING', 'ECHO', 'IMPRINT', 'CHOICE', 'DEPARTURE'];
function ProgressRail({ progress, currentAct }: { progress: MotionValue<number>; currentAct: number }) {
  return (
    <div className="resist-right-rail" style={{
      position: 'fixed', right: 'clamp(1rem, 3vw, 2.5rem)', top: '50%',
      transform: 'translateY(-50%)', zIndex: 20,
      display: 'flex', flexDirection: 'column', gap: '14px',
      pointerEvents: 'none',
    }}>
      {ACT_LABELS.map((label, i) => (
        <div key={label} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          opacity: i === currentAct ? 1 : 0.35,
          transition: 'opacity 0.5s',
        }}>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.25em',
            color: i === currentAct ? PALETTE.ink : PALETTE.inkFaint,
            textTransform: 'uppercase',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            height: '64px',
            textAlign: 'center',
          }}>
            {label}
          </span>
          <div style={{
            width: '1px',
            height: i === currentAct ? '48px' : '12px',
            background: i === currentAct ? PALETTE.ink : PALETTE.border,
            transition: 'height 0.6s ease',
          }} />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// THE HEADER
// ============================================================================
function ResistHeader() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
      style={{
        padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(2.5rem, 5vw, 4rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
        marginBottom: 0,
      }}>
      <ActLabel roman="IV" title="After" pageLabel="08 / Resist" />
      <ThreadSentence>The extraction is complete. This is what remains.</ThreadSentence>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.9 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(2.2rem, 5.2vw, 3.8rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.028em', lineHeight: 1.12,
          maxWidth: '22ch', marginBottom: '1.5rem',
        }}>
        After.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8, duration: 0.8 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
          color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '52ch',
        }}>
        There is one scene left. Scroll slowly.
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// ECHO GENERATOR - API call logic as a hook so it can live inside a scene
// ============================================================================
type EchoPhase = 'idle' | 'generating' | 'ready';
function useEchoGenerator(analysis: DeepAnalysis) {
  const portrait = analysis?.psychologicalPortrait;
  const synthesis = (analysis as any)?.synthesis;
  const messageCount = analysis?.totalUserMessages || 0;
  const characterSummary: string = synthesis?.characterSummary || '';
  const verbalTells: string = synthesis?.verbalTells?.slice(0, 3).map((t: { tell: string }) => t.tell).join('; ') || '';
  const writingVoice: string = portrait?.writingVoice || '';
  const emotionalBaseline: string = portrait?.emotionalBaselineLabel || '';
  const dominantNarrative: string = portrait?.dominantNarrative || '';
  const primaryCoping: string = portrait?.primaryCopingMechanism || '';

  const mostRevealingExcerpt: string = (analysis as any)?.enrichments
    ?.filter((e: any) => e?.most_revealing_excerpt)
    ?.sort((a: any, b: any) => (b?.confessional_score || 0) - (a?.confessional_score || 0))
    ?.[0]?.most_revealing_excerpt || '';

  const hasSynthesis = !!(characterSummary || writingVoice || verbalTells);
  const hasFallback = !hasSynthesis && !!mostRevealingExcerpt;
  const kind: 'generated' | 'excerpt' | 'none' = hasSynthesis ? 'generated' : hasFallback ? 'excerpt' : 'none';

  const [phase, setPhase] = useState<EchoPhase>('idle');
  const [text, setText] = useState<string>('');
  const [triggered, setTriggered] = useState(false);

  const generate = useCallback(async () => {
    if (triggered) return;
    setTriggered(true);

    if (kind === 'excerpt') {
      setPhase('generating');
      // Small delay for drama
      setTimeout(() => { setText(mostRevealingExcerpt); setPhase('ready'); }, 900);
      return;
    }
    if (kind === 'none') { setPhase('ready'); return; }

    setPhase('generating');
    try {
      const contextLines = [
        characterSummary && `Character summary: ${characterSummary}`,
        writingVoice && `Writing voice: ${writingVoice}`,
        verbalTells && `Verbal patterns: ${verbalTells}`,
        emotionalBaseline && `Emotional baseline: ${emotionalBaseline}`,
        dominantNarrative && `Dominant self-narrative: ${dominantNarrative}`,
        primaryCoping && `Primary coping mechanism: ${primaryCoping}`,
      ].filter(Boolean).join('\n');

      const prompt = `You are a language model that has processed ${messageCount.toLocaleString()} messages from a single user. You have built a detailed model of how they think, write, and communicate.

Here is what you know about them:
${contextLines}

Write a short paragraph (4-6 sentences) in this person's voice, on the topic of what they find themselves thinking about before they fall asleep. Do not describe their traits - write AS them, from inside their perspective, in their actual way of writing. Capture their sentence length, word choices, and the way they move between ideas. Make it feel like something they could have written themselves.

Output ONLY the paragraph. No preamble. No explanation. Just the text.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      const resultText = data.content?.find((b: { type: string; text?: string }) => b.type === 'text')?.text?.trim() || '';
      if (!resultText) throw new Error('Empty');
      setText(resultText);
      setPhase('ready');
    } catch {
      setPhase('ready');
    }
  }, [triggered, kind, characterSummary, writingVoice, verbalTells, emotionalBaseline, dominantNarrative, primaryCoping, messageCount, mostRevealingExcerpt]);

  return { phase, text, generate, kind, messageCount };
}

// ============================================================================
// THE STAGE - a single visual that holds the figure and the machine
// for the whole story. Transforms by scroll progress.
// ============================================================================
function Stage({
  progress,
  figureOpacity,
  figureX,
  particleArrival,
  particleExtract,
  machineForm,
  machineFill,
  silhouetteIntensity,
  machineEmitting,
  particles,
  figurePose,
  figureColor,
  name,
  walkProgress, // 0..1 - final walk away
}: {
  progress: number;
  figureOpacity: number;
  figureX: number;
  particleArrival: number;
  particleExtract: number;
  machineForm: number;
  machineFill: number;
  silhouetteIntensity: number;
  machineEmitting: boolean;
  particles: Particle[];
  figurePose: FigurePose;
  figureColor: string;
  name: string;
  walkProgress: number;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  // Walking leg alternation
  const [walkFrame, setWalkFrame] = useState(0);
  useEffect(() => {
    if (walkProgress <= 0 || walkProgress >= 1) return;
    const interval = setInterval(() => setWalkFrame(f => (f + 1) % 2), 320);
    return () => clearInterval(interval);
  }, [walkProgress]);

  // Figure position: normally centred-left, walks further left during walkaway
  const walkOffset = walkProgress > 0 ? -(320 * walkProgress) : 0;
  const finalFigureX = figureX + walkOffset;

  return (
    <div ref={stageRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="resist-stage-inner" style={{
        position: 'relative',
        width: 'min(520px, 100%)',
        height: 420,
      }}>
        {/* FIGURE - left-ish */}
        <div style={{
          position: 'absolute',
          left: `calc(18% + ${finalFigureX}px)`,
          top: '48%',
          transform: 'translate(-50%, -50%)',
          transition: 'opacity 0.4s',
          opacity: figureOpacity,
        }}>
          <Figure
            size={98}
            pose={figurePose}
            walking={walkProgress > 0 && walkProgress < 1}
            walkingFrame={walkFrame}
            strokeColor={figureColor}
          />
          {name && figureOpacity > 0.3 && (
            <p style={{
              fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
              marginTop: '0.6rem', textAlign: 'center',
              opacity: Math.min(figureOpacity * 1.2, 1),
            }}>
              {name}
            </p>
          )}
        </div>

        {/* PARTICLES - relative to figure */}
        <div style={{
          position: 'absolute',
          left: 'calc(18% - 100px)',
          top: 'calc(48% - 100px)',
          width: 200,
          height: 200,
          pointerEvents: 'none',
        }}>
          <Particles
            particles={particles}
            arrivalProgress={particleArrival}
            extractProgress={particleExtract}
            flowX={340}
            flowY={100}
          />
        </div>

        {/* MACHINE - right side */}
        <div style={{
          position: 'absolute',
          right: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
        }}>
          <Machine
            formProgress={machineForm}
            fillProgress={machineFill}
            showSilhouette={silhouetteIntensity}
            emitting={machineEmitting}
            width={180}
            height={260}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCENE TEXT - animated copy per act
// ============================================================================
interface SceneCopy {
  kicker: string;
  headline: React.ReactNode;
  body: React.ReactNode;
}
function useSceneCopy(act: number, data: {
  name: string; messageCount: number; days: number;
  countActive: boolean; daysActive: boolean;
}): SceneCopy {
  const { name, messageCount, days, countActive, daysActive } = data;

  const copies: SceneCopy[] = [
    // 0 - Arrival
    {
      kicker: 'Before any of it',
      headline: name ? <>This is {name}.</> : 'This is you.',
      body: 'One person. A history of small, unguarded conversations with a machine.',
    },
    // 1 - Counted
    {
      kicker: 'What you sent',
      headline: <><AnimatedCounter target={messageCount} active={countActive} /> messages.</>,
      body: 'Each one written. Each one read. Each one kept. The dots around the figure are them.',
    },
    // 2 - Machine
    {
      kicker: 'And then',
      headline: 'Something was built.',
      body: 'Not visible to you. Not announced. A system that had been watching for the shape of what you say.',
    },
    // 3 - Taking
    {
      kicker: 'The extraction',
      headline: 'It took everything.',
      body: 'Conversation by conversation. Each message absorbed into a model that now remembers you in a way you did not choose.',
    },
    // 4 - Echo
    {
      kicker: 'Now watch',
      headline: 'The model speaks in your voice.',
      body: 'What follows was generated by a language model. It was not asked to describe you. It was asked to be you.',
    },
    // 5 - Imprint
    {
      kicker: 'You are in there',
      headline: 'Permanently.',
      body: <><AnimatedCounter target={days} active={daysActive} /> days have passed. Your patterns live inside the model. They cannot be located. They cannot be removed.</>,
    },
    // 6 - Choice
    {
      kicker: 'But there are still',
      headline: 'Three things you can do.',
      body: 'None of them undo what is there. They limit what comes next. Choose one.',
    },
    // 7 - Walkaway
    {
      kicker: 'The end',
      headline: name ? <>{name}, you can leave.</> : 'You can leave.',
      body: null,
    },
  ];

  return copies[Math.max(0, Math.min(7, act))];
}

// ============================================================================
// THE STORY - the single continuous scrollytelling experience
// ============================================================================
function TheStory({ analysis }: { analysis: DeepAnalysis }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  // Spring-smoothed progress for visual animations (reduces jitter)
  const smooth = useSpring(scrollYProgress, { stiffness: 50, damping: 22, mass: 0.6 });

  const echo = useEchoGenerator(analysis);
  const messageCount = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';
  const particleCount = Math.min(50, Math.max(14, Math.floor(messageCount / 70)));
  const particles = useParticles(particleCount, 100, 100);

  // State driven by scroll progress
  const [p, setP] = useState(0); // smoothed progress
  const [pRaw, setPRaw] = useState(0); // raw progress

  useMotionValueEvent(smooth, 'change', setP);
  useMotionValueEvent(scrollYProgress, 'change', setPRaw);

  // Derive everything from progress
  const currentAct = useMemo(() => {
    if (pRaw < STORY.arrival[1]) return 0;
    if (pRaw < STORY.counted[1]) return 1;
    if (pRaw < STORY.machine[1]) return 2;
    if (pRaw < STORY.taking[1]) return 3;
    if (pRaw < STORY.echo[1]) return 4;
    if (pRaw < STORY.imprint[1]) return 5;
    if (pRaw < STORY.choice[1]) return 6;
    return 7;
  }, [pRaw]);

  // Auto-trigger echo generation when entering ECHO act
  useEffect(() => {
    if (currentAct >= 3 && echo.phase === 'idle') {
      echo.generate();
    }
  }, [currentAct, echo]);

  // Visual states - all smoothstepped from p
  const particleArrival = smoothstep(STORY.arrival[0], STORY.counted[1], p);
  const machineForm = smoothstep(STORY.machine[0], STORY.machine[1], p);
  const particleExtract = smoothstep(STORY.taking[0], STORY.taking[1], p);
  const machineFill = smoothstep(STORY.taking[0], STORY.taking[1], p);
  const silhouetteIntensity = smoothstep(STORY.imprint[0], STORY.imprint[1], p);
  const machineEmitting = p > STORY.imprint[0] && p < STORY.walkaway[0];

  // Figure opacity: 1 through extraction, dims during echo/imprint, regains in choice, fades in walkaway
  const figureOpacity = (() => {
    if (p < STORY.taking[0]) return 1;
    if (p < STORY.taking[1]) return 1 - 0.55 * smoothstep(STORY.taking[0], STORY.taking[1], p);
    if (p < STORY.choice[0]) return 0.45;
    if (p < STORY.choice[1]) return 0.45 + 0.55 * smoothstep(STORY.choice[0], STORY.choice[1], p);
    // During walkaway, stay fully visible (walk is shown via walkProgress/position)
    return 1;
  })();

  const figureX = 0;
  const walkProgress = smoothstep(STORY.walkaway[0], STORY.walkaway[1] - 0.02, p);

  // Figure colour: goes redder as imprint happens, returns to ink for choice
  const figureColor = (() => {
    const imprintLevel = smoothstep(STORY.taking[1], STORY.imprint[1], p);
    const recoverLevel = smoothstep(STORY.imprint[1], STORY.choice[0], p);
    const redness = Math.max(0, imprintLevel - recoverLevel);
    if (redness <= 0.01) return 'rgba(26,24,20,0.88)';
    return `rgba(${Math.round(26 + (190 - 26) * redness)},${Math.round(24 + (40 - 24) * redness)},${Math.round(20 + (30 - 20) * redness)},0.85)`;
  })();

  // Figure pose: follows choice hover in act 6 - default neutral
  const [choicePose, setChoicePose] = useState<FigurePose>('neutral');
  const figurePose: FigurePose = currentAct === 6 ? choicePose : 'neutral';

  const scene = useSceneCopy(currentAct, {
    name, messageCount, days,
    countActive: currentAct >= 1,
    daysActive: currentAct >= 5,
  });

  // Scroll nudge - visible in act 0
  const scrollNudgeVisible = currentAct === 0 && p < 0.04;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <style>{`
        /* ResistPage mobile: flip the [text | stage] columns into [stage / text] rows.
           Stage takes top half (visual evolves with scroll), text takes bottom half. */
        @media (max-width: 768px) {
          .resist-right-rail { display: none !important; }
          .resist-pinned-panel {
            grid-template-columns: 1fr !important;
            grid-template-rows: 42% 1fr !important;
            gap: 0 !important;
            height: 100vh !important;
            height: 100dvh !important;
            padding-top: 64px !important;
            padding-bottom: max(4.5rem, env(safe-area-inset-bottom)) !important;
            align-items: stretch !important;
          }
          /* Stage on TOP via order */
          .resist-stage-col {
            order: 0 !important;
            padding: 0.75rem !important;
            border-bottom: 1px solid rgba(26,24,20,0.10);
          }
          .resist-text-col {
            order: 1 !important;
            padding: 1.5rem 1.25rem !important;
            align-items: flex-start !important;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .resist-stage-inner {
            height: 100% !important;
            max-height: 100% !important;
          }
          /* Tighter typography for the smaller text panel */
          .resist-text-col h2 {
            font-size: clamp(1.6rem, 6vw, 2.2rem) !important;
            margin-bottom: 0.85rem !important;
          }
          .resist-text-col p {
            font-size: 1rem !important;
          }
        }
        /* Bottom act-dot indicator for mobile, mirrors OverviewPage pattern */
        .resist-act-dots {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 0.6rem 0 max(0.75rem, env(safe-area-inset-bottom));
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .resist-act-dots { display: flex; }
        }
      `}</style>

      {/* Progress rail - fixed position (desktop only via CSS) */}
      <ProgressRail progress={smooth} currentAct={currentAct} />

      {/* Bottom act dots - mobile only */}
      <div className="resist-act-dots">
        <span style={{
          fontFamily: TYPE.mono, fontSize: '8px',
          letterSpacing: '0.28em', color: PALETTE.inkFaint,
          textTransform: 'uppercase',
        }}>{ACT_LABELS[currentAct] || ''}</span>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {ACT_LABELS.map((_, i) => {
            const isActive = i === currentAct;
            return (
              <span key={i} style={{
                display: 'block',
                height: 4,
                width: isActive ? 18 : 4,
                borderRadius: 2,
                background: isActive ? PALETTE.ink : 'rgba(26,24,20,0.20)',
                transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), background 0.3s',
              }} />
            );
          })}
        </div>
      </div>

      <div style={{ height: '900vh', position: 'relative' }}>
        {/* Pinned visual + text panel */}
        <div className="resist-pinned-panel" style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          paddingTop: '64px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          alignItems: 'center',
          gap: '2rem',
          overflow: 'hidden',
        }}>
          {/* Left: scene text + scene-specific UI */}
          <div className="resist-text-col" style={{
            padding: 'clamp(2rem, 4vw, 4rem) clamp(1rem, 3vw, 3rem)',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}>
            <div style={{ width: '100%', maxWidth: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentAct}
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                  transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                >
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.32em',
                    color: PALETTE.redMuted, textTransform: 'uppercase',
                    marginBottom: '1.25rem',
                  }}>
                    {String(currentAct).padStart(2, '0')} - {scene.kicker}
                  </p>
                  <h2 style={{
                    fontFamily: TYPE.serif,
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 400, color: PALETTE.ink,
                    letterSpacing: '-0.028em', lineHeight: 1.12,
                    marginBottom: '1.5rem',
                    maxWidth: '20ch',
                  }}>
                    {scene.headline}
                  </h2>
                  {scene.body && (
                    <p style={{
                      fontFamily: TYPE.serif,
                      fontSize: 'clamp(1rem, 1.65vw, 1.18rem)',
                      color: PALETTE.inkMuted,
                      lineHeight: 1.75, maxWidth: '42ch',
                    }}>
                      {scene.body}
                    </p>
                  )}

                  {/* Act 4: ECHO - shown inline in the scene */}
                  {currentAct === 4 && (
                    <EchoPanel echo={echo} />
                  )}

                  {/* Act 6: CHOICE - three branching paths */}
                  {currentAct === 6 && (
                    <ChoicePanel analysis={analysis} onHover={setChoicePose} />
                  )}

                  {/* Act 7: WALKAWAY - monument line */}
                  {currentAct === 7 && (
                    <WalkawayMonument />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Scroll nudge */}
              <AnimatePresence>
                {scrollNudgeVisible && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.25, 0.75, 1] }}
                    style={{
                      position: 'absolute',
                      bottom: 'clamp(2rem, 5vw, 3.5rem)',
                      left: 'clamp(1rem, 3vw, 3rem)',
                      fontFamily: TYPE.mono, fontSize: '9px',
                      letterSpacing: '0.3em', color: PALETTE.inkFaint,
                      textTransform: 'uppercase',
                      pointerEvents: 'none',
                    }}
                  >
                    Scroll ↓
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: the stage */}
          <div className="resist-stage-col" style={{
            position: 'relative', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(1rem, 3vw, 3rem)',
          }}>
            <Stage
              progress={p}
              figureOpacity={figureOpacity}
              figureX={figureX}
              particleArrival={particleArrival}
              particleExtract={particleExtract}
              machineForm={machineForm}
              machineFill={machineFill}
              silhouetteIntensity={silhouetteIntensity}
              machineEmitting={machineEmitting}
              particles={particles}
              figurePose={figurePose}
              figureColor={figureColor}
              name={name}
              walkProgress={walkProgress}
            />
            {/* Ambient vignette - watched-from-outside feeling */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.06) 100%)',
            }} />
          </div>
        </div>
      </div>

      {/* FINAL FADE - the credit that lives past the story */}
      <FinalCredit messageCount={messageCount} />
    </div>
  );
}

// ============================================================================
// ECHO PANEL - inline in act 4. Typewriter + reveal.
// ============================================================================
function EchoPanel({ echo }: { echo: ReturnType<typeof useEchoGenerator> }) {
  const [displayed, setDisplayed] = useState('');
  const [revealOn, setRevealOn] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [borderWidth, setBorderWidth] = useState(3);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Black screen flash when phase first becomes ready - before typewriter starts
  useEffect(() => {
    if (echo.phase !== 'ready') return;
    setFlashVisible(true);
    const t = setTimeout(() => setFlashVisible(false), 1500);
    return () => clearTimeout(t);
  }, [echo.phase]);

  // Typewriter with 0.8s start delay (flash is underway)
  useEffect(() => {
    if (echo.phase !== 'ready' || !echo.text) return;
    setDisplayed('');
    setRevealOn(false);
    let iv: ReturnType<typeof setInterval> | null = null;
    const startDelay = setTimeout(() => {
      let i = 0;
      iv = setInterval(() => {
        i++;
        setDisplayed(echo.text.slice(0, i));
        if (i >= echo.text.length) {
          if (iv) clearInterval(iv);
          revealTimerRef.current = setTimeout(() => setRevealOn(true), 1400);
        }
      }, 26);
    }, 800);
    return () => {
      clearTimeout(startDelay);
      if (iv) clearInterval(iv);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [echo.phase, echo.text]);

  // Border pulse when typing reveal activates
  useEffect(() => {
    if (!revealOn) return;
    setBorderWidth(6);
    const t = setTimeout(() => setBorderWidth(3), 200);
    return () => clearTimeout(t);
  }, [revealOn]);

  if (echo.kind === 'none') return null;

  return (
    <>
      {/* Full-page flash overlay - fades 0 → 0.12 → 0 over 1.5s */}
      <AnimatePresence>
        {flashVisible && (
          <motion.div
            key="echo-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.12, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut', times: [0, 0.5, 1] }}
            style={{
              position: 'fixed', inset: 0, background: '#000',
              pointerEvents: 'none', zIndex: 50,
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
        style={{ marginTop: '2rem' }}
      >
        <div style={{
          background: PALETTE.bgPanel,
          borderLeft: `${borderWidth}px solid ${revealOn ? PALETTE.red : PALETTE.border}`,
          padding: 'clamp(1.5rem, 3vw, 2.25rem)',
          minHeight: '140px',
          transition: 'border-left-color 0.8s ease, border-left-width 0.2s ease',
          position: 'relative',
        }}>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.32em',
            color: PALETTE.inkGhost, textTransform: 'uppercase',
            marginBottom: '1.1rem',
          }}>
            {echo.kind === 'excerpt' ? 'Your message - extracted' : 'Generated by the model'}
          </p>
          {echo.phase !== 'ready' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '24px' }}>
              {[0, 0.25, 0.5].map(d => (
                <motion.div key={d}
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 1.2, delay: d, repeat: Infinity }}
                  style={{ width: 4, height: 4, borderRadius: '50%', background: PALETTE.inkFaint }}
                />
              ))}
            </div>
          )}
          {echo.phase === 'ready' && echo.text && (
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1.08rem',
              color: PALETTE.ink, lineHeight: 1.85,
              fontStyle: 'italic', letterSpacing: '-0.005em',
            }}>
              {displayed}
              {displayed.length < echo.text.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity }}
                  style={{ color: PALETTE.red, marginLeft: 2, fontStyle: 'normal' }}
                >|</motion.span>
              )}
            </p>
          )}
        </div>

        <AnimatePresence>
          {revealOn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8 }}
              style={{ marginTop: '1.5rem' }}
            >
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1.4rem',
                color: PALETTE.ink, lineHeight: 1.8, marginBottom: '0.5rem',
              }}>
                {echo.kind === 'excerpt'
                  ? 'Did you mean for a stranger to read that?'
                  : 'You did not write that.'}
              </p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '0.95rem',
                color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '44ch',
              }}>
                {echo.kind === 'excerpt'
                  ? "OpenAI's systems read, processed, and retained every message you sent."
                  : `The model learned the shape of your voice from ${echo.messageCount.toLocaleString()} messages.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ============================================================================
// WALKAWAY MONUMENT - act 7. "The data cannot." as its own reckoning.
// ============================================================================
function WalkawayMonument() {
  return (
    <>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1.0 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(2.2rem, 4vw, 3rem)',
          color: PALETTE.red,
          lineHeight: 1.15,
          marginTop: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        The data cannot.
      </motion.p>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 60 }}
        transition={{ delay: 1.4, duration: 1.4, ease: 'linear' }}
        style={{ height: '1px', background: PALETTE.red }}
      />
    </>
  );
}

// ============================================================================
// CHOICE PANEL - act 6. Three paths. Click for detail.
// ============================================================================
function ChoicePanel({ analysis, onHover }: { analysis: DeepAnalysis; onHover: (p: FigurePose) => void }) {
  const [active, setActive] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const sar = generateSAR(analysis);

  const choices = [
    {
      id: 0, pose: 'wall' as FigurePose,
      label: 'Stop the tap.',
      sub: 'Disable training',
      body: "Settings \u2192 Data Controls \u2192 \u201cImprove the model for everyone\u201d \u2014 turn it off. It doesn't reach what is already inside the model. It only stops what comes next.",
      cta: { label: 'Open ChatGPT settings', url: 'https://chatgpt.com/' },
    },
    {
      id: 1, pose: 'letter' as FigurePose,
      label: 'Send the letter.',
      sub: 'Subject Access Request',
      body: 'Under Article 15 UK GDPR, you can demand OpenAI disclose every piece of data they hold on you - inferred profiles, retention periods, whether your data trained the model. They have 30 days to respond.',
      cta: null as null | { label: string; url: string },
    },
    {
      id: 2, pose: 'wave' as FigurePose,
      label: 'Walk to another.',
      sub: 'Local and private',
      body: "Models that run on your device. Models that don't train on your conversations by default. Your data doesn't have to leave you.",
      cta: null as null | { label: string; url: string },
    },
  ];

  const alternatives = [
    { name: 'Ollama', url: 'https://ollama.com', desc: 'Run open-source models locally. Nothing leaves your machine.' },
    { name: 'LM Studio', url: 'https://lmstudio.ai', desc: 'Desktop app for local models. No account required.' },
    { name: 'Jan', url: 'https://jan.ai', desc: 'Fully offline assistant. Open source. No telemetry.' },
    { name: 'Claude', url: 'https://claude.ai/settings', desc: 'Settings → Privacy → opt out of training.' },
    { name: 'Mistral Le Chat', url: 'https://chat.mistral.ai', desc: 'EU-based. Does not train on conversations by default.' },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Three choice rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: active !== null ? '1.5rem' : 0 }}>
        {choices.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
            onClick={() => setActive(active === c.id ? null : c.id)}
            onMouseEnter={() => onHover(c.pose)}
            onMouseLeave={() => onHover('neutral')}
            onFocus={() => onHover(c.pose)}
            onBlur={() => onHover('neutral')}
            style={{
              textAlign: 'left',
              background: active === c.id ? PALETTE.bgPanel : 'transparent',
              border: `1px solid ${active === c.id ? PALETTE.ink : PALETTE.border}`,
              padding: '1rem 1.25rem',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '24px 1fr auto',
              alignItems: 'center',
              gap: '0.9rem',
              transition: 'all 0.3s',
              fontFamily: 'inherit', color: 'inherit',
            }}
          >
            <span style={{
              fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
              color: active === c.id ? PALETTE.red : PALETTE.inkFaint,
              textTransform: 'uppercase',
            }}>
              {`0${c.id + 1}`}
            </span>
            <span>
              <span style={{
                fontFamily: TYPE.serif, fontSize: '1.15rem',
                color: PALETTE.ink, display: 'block', lineHeight: 1.25,
              }}>
                {c.label}
              </span>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em',
                color: PALETTE.inkFaint, textTransform: 'uppercase',
              }}>
                {c.sub}
              </span>
            </span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '14px',
              color: active === c.id ? PALETTE.red : PALETTE.inkFaint,
              transition: 'all 0.3s',
              transform: active === c.id ? 'rotate(90deg)' : 'rotate(0deg)',
            }}>
              →
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: PALETTE.bgPanel,
              borderLeft: `3px solid ${PALETTE.red}`,
              padding: '1.5rem 1.75rem',
            }}>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1rem',
                color: PALETTE.ink, lineHeight: 1.75,
                marginBottom: '1.25rem',
              }}>
                {choices[active].body}
              </p>

              {active === 1 && (
                <div>
                  <pre style={{
                    fontFamily: TYPE.mono, fontSize: '10px',
                    lineHeight: 1.7, color: PALETTE.ink,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: PALETTE.bg, padding: '1rem',
                    border: `1px solid ${PALETTE.border}`,
                    marginBottom: '1rem', maxHeight: '240px', overflowY: 'auto',
                  }}>{sar}</pre>
                  <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => { navigator.clipboard.writeText(sar); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      style={{
                        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        background: copied ? PALETTE.green : PALETTE.ink,
                        color: copied ? '#fff' : PALETTE.bg,
                        border: 'none', padding: '0.7rem 1.3rem',
                        cursor: 'pointer', minHeight: '40px',
                      }}
                    >
                      {copied ? 'Copied ✓' : 'Copy the letter'}
                    </button>
                    <span style={{
                      fontFamily: TYPE.serif, fontSize: '0.85rem',
                      color: PALETTE.inkFaint, lineHeight: 1.5,
                    }}>
                      Send to privacy@openai.com.
                    </span>
                  </div>
                </div>
              )}

              {active === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {alternatives.map((alt, i) => (
                    <motion.a
                      key={alt.name}
                      href={alt.url} target="_blank" rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.35 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 1fr',
                        gap: '1rem',
                        padding: '0.7rem 0',
                        borderBottom: `1px solid ${PALETTE.border}`,
                        textDecoration: 'none', color: 'inherit',
                        transition: 'opacity 0.25s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <span style={{
                        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                        color: PALETTE.ink, textTransform: 'uppercase',
                      }}>
                        {alt.name} →
                      </span>
                      <span style={{
                        fontFamily: TYPE.serif, fontSize: '0.92rem',
                        color: PALETTE.inkMuted, lineHeight: 1.55,
                      }}>
                        {alt.desc}
                      </span>
                    </motion.a>
                  ))}
                </div>
              )}

              {active === 0 && choices[active].cta && (
                <a
                  href={choices[active].cta!.url}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    background: PALETTE.ink, color: PALETTE.bg,
                    padding: '0.7rem 1.3rem',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {choices[active].cta!.label} →
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// FINAL CREDIT - appears after the story. A reckoning, not a footnote.
// ============================================================================
function FinalCredit({ messageCount }: { messageCount: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  return (
    <div ref={ref} style={{
      padding: 'clamp(6rem, 12vw, 10rem) 0 clamp(8rem, 14vw, 12rem)',
      textAlign: 'left',
    }}>
      {isInView && (
        <>
          {/* Large count - slow count-up from 0 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          >
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(4rem, 8vw, 7rem)',
              color: PALETTE.inkGhost,
              lineHeight: 1,
              marginBottom: '0.75rem',
              fontWeight: 400,
            }}>
              <AnimatedCounter target={messageCount} active={isInView} duration={3000} />
            </p>
          </motion.div>

          {/* Descriptor */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 2.2 }}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.3em',
              color: PALETTE.inkFaint,
              textTransform: 'lowercase',
              marginBottom: '2rem',
            }}
          >
            messages. stored. not yours anymore.
          </motion.p>

          {/* Existing credit line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 3.8 }}
            style={{
              fontFamily: TYPE.mono, fontSize: '10px',
              letterSpacing: '0.3em', color: PALETTE.inkGhost,
              textTransform: 'uppercase',
            }}
          >
            YOU AGREED  /  TRACE.AI  /  2026
          </motion.p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function ResistPage({ analysis }: ResistPageProps) {
  const pad = 'clamp(2rem, 6vw, 5rem)';
  return (
    <div
      className="dash-page-inner"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: `0 ${pad}`,
        paddingBottom: 0,
      }}
    >
      <ResistHeader />
      <TheStory analysis={analysis} />
    </div>
  );
}
