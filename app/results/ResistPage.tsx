'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
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
// THE FIGURE
// ============================================================================
function Figure({
  size = 80, opacity = 1, ghosted = false, walking = false, arms = 'down',
}: {
  size?: number; opacity?: number; ghosted?: boolean; walking?: boolean; arms?: 'down' | 'wall' | 'letter' | 'wave';
}) {
  const stroke = ghosted ? 'rgba(26,24,20,0.18)' : 'rgba(26,24,20,0.85)';
  const fill = ghosted ? 'rgba(26,24,20,0.04)' : 'rgba(26,24,20,0.02)';
  const armPaths = {
    down: 'M 28 42 L 22 64 M 52 42 L 58 64',
    wall: 'M 28 42 L 18 38 M 52 42 L 62 38',
    letter: 'M 28 42 L 30 56 M 52 42 L 54 56',
    wave: 'M 28 42 L 22 64 M 52 42 L 58 22',
  };
  const legPath = walking ? 'M 36 70 L 30 92 M 44 70 L 50 92' : 'M 36 70 L 32 92 M 44 70 L 48 92';
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" style={{ opacity, transition: 'opacity 0.6s' }}>
      <circle cx="40" cy="20" r="11" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <path d="M 40 31 L 40 70" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 28 42 L 52 42" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d={armPaths[arms]} stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d={legPath} stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// THE MODEL
// ============================================================================
function Model({ filled = 0, width = 200, height = 260, showSilhouette = false, emitting = false }: {
  filled?: number; width?: number; height?: number; showSilhouette?: boolean; emitting?: boolean;
}) {
  const fillH = height * filled;
  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }}>
        <rect x="2" y="2" width={width - 4} height={height - 4} fill="none" stroke="rgba(26,24,20,0.4)" strokeWidth="1.5" />
        <rect x="2" y="2" width={width - 4} height={height - 4} fill="rgba(26,24,20,0.025)" />
        <motion.rect x="2" y={height - 2 - fillH} width={width - 4} height={fillH} fill="rgba(190,40,30,0.18)"
          initial={false} animate={{ y: height - 2 - fillH, height: fillH }} transition={{ duration: 0.4, ease: 'linear' }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1="2" y1={20 + i * 30} x2={width - 2} y2={20 + i * 30} stroke="rgba(190,40,30,0.04)" strokeWidth="1" />
        ))}
        {showSilhouette && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}
            transform={`translate(${width / 2 - 30}, ${height / 2 - 40}) scale(0.75)`}>
            <circle cx="40" cy="20" r="11" fill="rgba(190,40,30,0.32)" stroke="rgba(190,40,30,0.45)" strokeWidth="1" />
            <path d="M 40 31 L 40 70" stroke="rgba(190,40,30,0.45)" strokeWidth="1" fill="none" />
            <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke="rgba(190,40,30,0.45)" strokeWidth="1" fill="none" />
            <path d="M 36 70 L 32 92 M 44 70 L 48 92" stroke="rgba(190,40,30,0.45)" strokeWidth="1" fill="none" />
          </motion.g>
        )}
      </svg>
      <p style={{ position: 'absolute', top: -22, left: 0, fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
        The model
      </p>
      {emitting && (
        <>
          {[0, 0.7, 1.4, 2.1].map(d => (
            <motion.div key={d} initial={{ opacity: 0, x: width, y: height / 2 }}
              animate={{ opacity: [0, 0.7, 0], x: width + 80, y: height / 2 }}
              transition={{ duration: 2, delay: d, repeat: Infinity }}
              style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'rgba(190,40,30,0.6)', pointerEvents: 'none' }} />
          ))}
        </>
      )}
    </div>
  );
}

// ============================================================================
// PARTICLES
// ============================================================================
function MessageParticles({ count, centerX, centerY, extracted = 0, flowToX = 0, flowToY = 0 }: {
  count: number; centerX: number; centerY: number; extracted?: number; flowToX?: number; flowToY?: number;
}) {
  const particles = useMemo(() => {
    const rng = (seed: number) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
    return Array.from({ length: count }).map((_, i) => {
      const angle = rng(i * 7.13) * Math.PI * 2;
      const radius = 80 + rng(i * 3.71) * 80;
      return { startX: centerX + Math.cos(angle) * radius, startY: centerY + Math.sin(angle) * radius, delay: rng(i * 11.7) * 0.4, size: 2 + rng(i * 17.3) * 1.5 };
    });
  }, [count, centerX, centerY]);
  const extractedCount = Math.floor(count * extracted);
  return (
    <>
      {particles.map((p, i) => {
        const isExtracted = i < extractedCount;
        return (
          <motion.div key={i}
            initial={{ x: p.startX, y: p.startY, opacity: 0 }}
            animate={isExtracted ? { x: flowToX, y: flowToY, opacity: 0, scale: 0.4 } : { x: p.startX, y: p.startY, opacity: 0.7, scale: 1 }}
            transition={isExtracted ? { duration: 1.2, delay: p.delay * 0.3, ease: [0.4, 0, 0.2, 1] } : { duration: 1, delay: p.delay, ease: 'easeOut' }}
            style={{ position: 'absolute', top: 0, left: 0, width: p.size, height: p.size, borderRadius: '50%', background: 'rgba(26,24,20,0.55)', pointerEvents: 'none' }}
          />
        );
      })}
    </>
  );
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================
function AnimatedCounter({ target, duration = 2200 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return <>{display.toLocaleString()}</>;
}

// ============================================================================
// THE ECHO — the Pudding move. AI-generated text in the user's voice.
// ============================================================================
function TheEcho({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-15%' });
  const [phase, setPhase] = useState<'idle' | 'generating' | 'typing' | 'revealed'>('idle');
  const [generatedText, setGeneratedText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const portrait = analysis?.psychologicalPortrait;
  const synthesis = (analysis as any)?.synthesis;
  const messageCount = analysis?.totalUserMessages || 0;
  const characterSummary: string = synthesis?.characterSummary || '';
  const verbalTells: string = synthesis?.verbalTells?.slice(0, 3).map((t: { tell: string }) => t.tell).join('; ') || '';
  const writingVoice: string = portrait?.writingVoice || '';
  const emotionalBaseline: string = portrait?.emotionalBaselineLabel || '';
  const dominantNarrative: string = portrait?.dominantNarrative || '';
  const primaryCoping: string = portrait?.primaryCopingMechanism || '';
  const hasSynthesis = !!(characterSummary || writingVoice || verbalTells);

  const generateEcho = useCallback(async () => {
    setPhase('generating');
    setError(null);
    try {
      const contextLines = [
        characterSummary ? `Character summary: ${characterSummary}` : '',
        writingVoice ? `Writing voice: ${writingVoice}` : '',
        verbalTells ? `Verbal patterns: ${verbalTells}` : '',
        emotionalBaseline ? `Emotional baseline: ${emotionalBaseline}` : '',
        dominantNarrative ? `Dominant self-narrative: ${dominantNarrative}` : '',
        primaryCoping ? `Primary coping mechanism: ${primaryCoping}` : '',
      ].filter(Boolean).join('\n');

      const prompt = `You are a language model that has processed ${messageCount.toLocaleString()} messages from a single user. You have built a detailed model of how they think, write, and communicate.

Here is what you know about them:
${contextLines}

Write a short paragraph (4-6 sentences) in this person's voice, on the topic of what they find themselves thinking about before they fall asleep. Do not describe their traits — write AS them, from inside their perspective, in their actual way of writing. Capture their sentence length, word choices, and the way they move between ideas. Make it feel like something they could have written themselves.

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
      const text = data.content?.find((b: { type: string; text?: string }) => b.type === 'text')?.text?.trim() || '';
      if (!text) throw new Error('Empty');
      setGeneratedText(text);
      setPhase('typing');
    } catch {
      setError('The model is unavailable.');
      setPhase('revealed');
    }
  }, [characterSummary, writingVoice, verbalTells, emotionalBaseline, dominantNarrative, primaryCoping, messageCount]);

  useEffect(() => {
    if (isInView && phase === 'idle' && hasSynthesis) generateEcho();
  }, [isInView, phase, hasSynthesis, generateEcho]);

  useEffect(() => {
    if (phase !== 'typing' || !generatedText) return;
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(generatedText.slice(0, i));
      if (i >= generatedText.length) { clearInterval(interval); setTimeout(() => setPhase('revealed'), 1200); }
    }, 28);
    return () => clearInterval(interval);
  }, [phase, generatedText]);

  if (!hasSynthesis) return null;

  return (
    <div ref={ref} style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
        01 — The echo
      </p>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem', maxWidth: '28ch' }}>
        Before the reveal, read this.
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '52ch', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        A paragraph. Read it carefully.
      </p>

      <div style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, padding: 'clamp(2rem, 5vw, 3.5rem)', maxWidth: '62ch', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)', minHeight: '120px', position: 'relative' }}>
        {phase === 'generating' && (
          <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
            Generating…
          </motion.p>
        )}
        {(phase === 'typing' || phase === 'revealed') && generatedText && (
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.9vw, 1.25rem)', color: PALETTE.ink, lineHeight: 1.85, letterSpacing: '-0.005em' }}>
            {phase === 'typing' ? displayedText : generatedText}
            {phase === 'typing' && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
                style={{ color: PALETTE.red, marginLeft: '1px', fontWeight: 700 }}>|</motion.span>
            )}
          </p>
        )}
        {error && <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint }}>{error}</p>}
      </div>

      <AnimatePresence>
        {phase === 'revealed' && generatedText && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            style={{ borderLeft: `3px solid ${PALETTE.red}`, paddingLeft: 'clamp(1.5rem, 3vw, 2.5rem)', maxWidth: '56ch' }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.8, marginBottom: '0.75rem' }}>
              You did not write that.
            </p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.8 }}>
              A language model wrote it — using patterns extracted from your {messageCount.toLocaleString()} messages.
              Your sentence rhythm. Your word choices. Your way of circling back to what matters.
              The model learned what you sound like from the inside. This is what it knows.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      <ThreadSentence>The extraction is complete. This is what remains.</ThreadSentence>
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
// THE STORY
// ============================================================================
function MessageParticleField({ count, scrollProgress }: { count: number; scrollProgress: any }) {
  const [extractPct, setExtractPct] = useState(0);
  useEffect(() => {
    return scrollProgress.on('change', (v: number) => {
      setExtractPct(Math.min(Math.max((v - 0.18) / 0.16, 0), 1));
    });
  }, [scrollProgress]);
  return <MessageParticles count={count} centerX={106} centerY={196} extracted={extractPct} flowToX={400} flowToY={200} />;
}

function ModelWithReactiveFill({ scrollProgress }: { scrollProgress: any }) {
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

function SceneText({ scene, name, messageCount, days }: {
  scene: any; name: string; messageCount: number; days: number;
}) {
  const [currentScene, setCurrentScene] = useState(0);
  const [scene3Entered, setScene3Entered] = useState(false);

  useEffect(() => {
    return scene.on('change', (v: number) => {
      setCurrentScene(v);
      if (v === 2) setScene3Entered(true);
    });
  }, [scene]);

  const scenes = [
    {
      kicker: 'Before any of it',
      headline: name ? `This is ${name}.` : 'This is you.',
      body: `${messageCount.toLocaleString()} messages. Each one written. Each one read. Each one kept. The small dots are them.`,
    },
    {
      kicker: 'And then',
      headline: 'The model arrived.',
      body: 'Not once. Conversation by conversation. Each message taken from you, converted into something it could use.',
    },
    {
      kicker: 'Watch',
      headline: scene3Entered ? <><AnimatedCounter target={messageCount} /> messages<br />absorbed.</> : `${messageCount.toLocaleString()} messages absorbed.`,
      body: 'Not stored as text. Compressed into mathematics. Distributed across billions of parameters. Yours, now indistinguishable from everything else.',
    },
    {
      kicker: 'You are in there now',
      headline: 'Permanently.',
      body: 'A faint shape of who you are lives inside the model. Your patterns. Your unguarded sentences. Your way of asking for things. It cannot be located. It cannot be removed.',
    },
    {
      kicker: 'Time keeps moving',
      headline: `${days > 0 ? days.toLocaleString() : '—'} days have passed.`,
      body: 'The model is being used. By other people. By companies. By systems you will never see. Each output shaped, in some small way, by what it learned from you.',
    },
    {
      kicker: 'But there are still',
      headline: 'Three things\nyou can do.',
      body: 'None of them undo what is already there. They limit what comes next. They make what was taken visible. They are small acts. They matter.',
    },
  ];

  const s = scenes[currentScene];

  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentScene} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} style={{ pointerEvents: 'auto' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
          {String(currentScene + 1).padStart(2, '0')} — {s.kicker}
        </p>
        <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
          {s.headline}
        </h2>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '40ch' }}>
          {s.body}
        </p>
        {currentScene === 5 && (
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '2rem' }}>
            ↓ Continue
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function TheStory({ analysis }: { analysis: DeepAnalysis }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const scene = useTransform(scrollYProgress, v => Math.min(Math.floor(v * 6), 5));
  const figureOpacity = useTransform(scrollYProgress, [0, 0.16, 0.34, 0.55, 0.83, 1], [1, 1, 0.6, 0.45, 0.65, 0]);
  const figureX = useTransform(scrollYProgress, [0, 0.83, 0.95], [0, 0, -240]);
  const modelOpacity = useTransform(scrollYProgress, [0.12, 0.2], [0, 1]);
  const messageCount = analysis?.totalUserMessages || 0;
  const visualParticleCount = Math.min(60, Math.max(16, Math.floor(messageCount / 50)));
  const days = analysis?.timespan?.days || 0;
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ height: '600vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ padding: 'clamp(2rem, 5vw, 5rem)', position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
              <SceneText scene={scene} name={name} messageCount={messageCount} days={days} />
            </div>
          </div>
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 500, height: 400 }}>
              <motion.div style={{ position: 'absolute', left: 60, top: 150, opacity: figureOpacity, x: figureX }}>
                <Figure size={92} />
                {name && (
                  <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.5rem', textAlign: 'center' }}>
                    {name}
                  </p>
                )}
              </motion.div>
              <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <MessageParticleField count={visualParticleCount} scrollProgress={scrollYProgress} />
              </motion.div>
              <motion.div style={{ position: 'absolute', right: 0, top: 70, opacity: modelOpacity }}>
                <ModelWithReactiveFill scrollProgress={scrollYProgress} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// THREE ACTIONS
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
      label: 'Stop the tap.',
      sub: 'Disable training',
      pose: 'wall' as const,
      description: "Settings \u2192 Data Controls \u2192 \u201cImprove the model for everyone\u201d \u2014 turn it off. This doesn\u2019t reach what is already inside the model. It only stops what comes next.",
      cta: { label: 'Open ChatGPT settings', url: 'https://chatgpt.com/' },
    },
    {
      id: 1,
      label: 'Send the letter.',
      sub: 'Subject Access Request',
      pose: 'letter' as const,
      description: 'Under Article 15 UK GDPR, you can demand OpenAI disclose every piece of data they hold on you — inferred profiles, retention periods, whether your data trained the model. They have 30 days to respond. They must.',
      cta: null,
    },
    {
      id: 2,
      label: 'Walk somewhere else.',
      sub: 'Local and private alternatives',
      pose: 'wave' as const,
      description: "Models that run on your device. Models that don't train on conversations by default. Your data doesn't have to leave you. It never had to.",
      cta: { label: 'Browse alternatives', url: 'https://ollama.com' },
    },
  ];

  return (
    <div ref={ref} style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${PALETTE.border}` }}>
      <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', maxWidth: '50ch' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
          02 — What you can do
        </p>
        <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Three small acts.
        </h2>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.8 }}>
          None of them are reversals. They are fences. Tap a figure.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'clamp(1rem, 3vw, 2.5rem)', marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
        {actions.map((action, i) => (
          <motion.button key={action.id}
            onClick={() => setActive(active === action.id ? null : action.id)}
            initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.15, duration: 0.7 }}
            style={{ background: active === action.id ? PALETTE.bgPanel : 'transparent', border: `1px solid ${active === action.id ? PALETTE.ink : PALETTE.border}`, padding: 'clamp(1.5rem, 3vw, 2.5rem)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.3s, background 0.3s', minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}
            onMouseEnter={e => { if (active !== action.id) e.currentTarget.style.borderColor = PALETTE.inkFaint; }}
            onMouseLeave={e => { if (active !== action.id) e.currentTarget.style.borderColor = PALETTE.border; }}>
            <div style={{ alignSelf: 'center' }}><Figure size={70} arms={action.pose} /></div>
            <div>
              <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Action {action.id + 1}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.4rem)', color: PALETTE.ink, lineHeight: 1.25, marginBottom: '0.3rem' }}>{action.label}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{action.sub}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {active !== null && (
          <motion.div key={active} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5 }}
            style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderLeft: `3px solid ${PALETTE.red}`, padding: 'clamp(2rem, 5vw, 3.5rem)' }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.8, marginBottom: '2rem', maxWidth: '60ch' }}>
              {actions[active].description}
            </p>
            {active === 1 ? (
              <div>
                <pre style={{ fontFamily: TYPE.mono, fontSize: '11px', lineHeight: 1.75, color: PALETTE.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: PALETTE.bg, padding: 'clamp(1.25rem, 2.5vw, 2rem)', border: `1px solid ${PALETTE.border}`, marginBottom: '1.5rem', maxHeight: '320px', overflowY: 'auto' }}>{sarText}</pre>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button onClick={() => { navigator.clipboard.writeText(sarText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: copied ? PALETTE.green : PALETTE.ink, color: copied ? '#fff' : PALETTE.bg, border: 'none', padding: '0.85rem 1.6rem', cursor: 'pointer', minHeight: '44px' }}>
                    {copied ? 'Copied ✓' : 'Copy the letter'}
                  </button>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.inkFaint, lineHeight: 1.6 }}>Send to privacy@openai.com. They have 30 days.</p>
                </div>
              </div>
            ) : (
              <a href={actions[active].cta?.url} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: PALETTE.ink, color: PALETTE.bg, border: 'none', padding: '0.85rem 1.6rem', cursor: 'pointer', minHeight: '44px', textDecoration: 'none', display: 'inline-block' }}>
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
// THE FINAL WALK — figure walks off-screen, doesn't fade
// ============================================================================
function FigureLight({ walking = false }: { walking?: boolean }) {
  const stroke = 'rgba(238,236,229,0.85)';
  const fill = 'rgba(238,236,229,0.04)';
  const [legFlip, setLegFlip] = useState(false);
  useEffect(() => {
    if (!walking) return;
    const interval = setInterval(() => setLegFlip(f => !f), 350);
    return () => clearInterval(interval);
  }, [walking]);
  const legPath = walking
    ? (legFlip ? 'M 36 70 L 30 92 M 44 70 L 50 92' : 'M 36 70 L 50 92 M 44 70 L 30 92')
    : 'M 36 70 L 32 92 M 44 70 L 48 92';
  return (
    <svg width="60" height="92" viewBox="0 0 80 92">
      <circle cx="40" cy="20" r="11" fill={fill} stroke={stroke} strokeWidth="1.2" />
      <path d="M 40 31 L 40 70" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 28 42 L 52 42" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d={legPath} stroke={stroke} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function TheFinalWalk({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';
  const messages = analysis?.totalUserMessages || 0;
  const [phase, setPhase] = useState<'hidden' | 'standing' | 'walking' | 'gone' | 'final'>('hidden');
  const [figureLeft, setFigureLeft] = useState(280);

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setPhase('standing'), 600);
    const t2 = setTimeout(() => {
      setPhase('walking');
      const startTime = performance.now();
      const fromX = 280, toX = -120, dur = 3300;
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / dur, 1);
        setFigureLeft(fromX + (toX - fromX) * t);
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, 2200);
    const t3 = setTimeout(() => setPhase('gone'), 5600);
    const t4 = setTimeout(() => setPhase('final'), 7200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [isInView]);

  return (
    <div ref={ref} style={{ background: PALETTE.ink, margin: '0 calc(-1 * clamp(2rem, 6vw, 5rem))', padding: 'clamp(5rem, 12vw, 9rem) clamp(2rem, 6vw, 5rem)', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {messages > 0 && (
        <div style={{ position: 'absolute', right: '3%', top: '50%', transform: 'translateY(-50%)', fontFamily: TYPE.serif, fontSize: 'clamp(8rem, 22vw, 20rem)', color: 'rgba(238,236,229,0.025)', letterSpacing: '-0.05em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
          {messages.toLocaleString()}
        </div>
      )}

      <div style={{ position: 'relative', height: '180px', marginBottom: 'clamp(3rem, 6vw, 5rem)', maxWidth: '700px', overflow: 'hidden' }}>
        <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}} transition={{ duration: 1.5, delay: 0.2 }}
          style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, height: '1px', background: 'rgba(238,236,229,0.12)', transformOrigin: 'left' }} />

        {/* Model stays put */}
        <div style={{ position: 'absolute', right: '20px', bottom: '12px', opacity: 0.7 }}>
          <svg width="80" height="120" viewBox="0 0 80 120">
            <rect x="2" y="2" width="76" height="116" fill="rgba(190,40,30,0.12)" stroke="rgba(190,40,30,0.45)" strokeWidth="1" />
            <g transform="translate(20, 30) scale(0.5)" opacity="0.6">
              <circle cx="40" cy="20" r="11" fill="rgba(238,236,229,0.18)" stroke="rgba(238,236,229,0.4)" strokeWidth="1" />
              <path d="M 40 31 L 40 70" stroke="rgba(238,236,229,0.4)" strokeWidth="1" fill="none" />
              <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke="rgba(238,236,229,0.4)" strokeWidth="1" fill="none" />
              <path d="M 36 70 L 32 92 M 44 70 L 48 92" stroke="rgba(238,236,229,0.4)" strokeWidth="1" fill="none" />
            </g>
            <text x="40" y="135" textAnchor="middle" fontFamily={TYPE.mono} fontSize="7" letterSpacing="0.2em" fill="rgba(238,236,229,0.3)">THE MODEL</text>
          </svg>
        </div>

        {/* Figure walks left, visibly off-screen */}
        {(phase === 'standing' || phase === 'walking') && (
          <div style={{ position: 'absolute', bottom: '12px', left: `${figureLeft}px` }}>
            <FigureLight walking={phase === 'walking'} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {phase === 'final' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(238,236,229,0.3)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>The end</p>
            <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 400, color: '#eeece5', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: '18ch', marginBottom: '2rem' }}>
              {name ? `${name},` : ''} you can leave.
            </h2>
            <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 400, color: 'rgba(238,236,229,0.55)', letterSpacing: '-0.02em', lineHeight: 1.2, maxWidth: '20ch', fontStyle: 'italic', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
              The data cannot.
            </h3>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1.5 }}
              style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: 'rgba(238,236,229,0.25)', textTransform: 'uppercase' }}>
              YOU AGREED  /  TRACE.AI  /  2026
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      <TheEcho analysis={analysis} />
      <ThreeActions analysis={analysis} />
      <TheFinalWalk analysis={analysis} />
    </div>
  );
}
