'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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

  // Fallback: most revealing excerpt if no synthesis
  const mostRevealingExcerpt: string = (analysis as any)?.enrichments
    ?.filter((e: any) => e?.most_revealing_excerpt)
    ?.sort((a: any, b: any) => (b?.confessional_score || 0) - (a?.confessional_score || 0))
    ?.[0]?.most_revealing_excerpt || '';

  const hasFallback = !hasSynthesis && !!mostRevealingExcerpt;

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
      setError(null);
      setPhase('revealed'); // show the reveal even on error — just no text
    }
  }, [characterSummary, writingVoice, verbalTells, emotionalBaseline, dominantNarrative, primaryCoping, messageCount]);

  useEffect(() => {
    if (isInView && phase === 'idle') {
      if (hasSynthesis) generateEcho();
      else if (hasFallback) {
        // Fallback: show the most confessional excerpt as if typed
        setGeneratedText(mostRevealingExcerpt);
        setPhase('typing');
      }
    }
  }, [isInView, phase, hasSynthesis, hasFallback, mostRevealingExcerpt, generateEcho]);

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

  // Don't render if no data at all
  if (!hasSynthesis && !hasFallback) return null;

  const isFallback = !hasSynthesis && hasFallback;

  return (
    <div ref={ref} style={{ padding: 'clamp(5rem, 10vw, 8rem) 0', borderTop: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
        01 — The echo
      </p>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem', maxWidth: '28ch' }}>
        {isFallback ? 'Something you wrote.' : 'The model has been listening.'}
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '54ch', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        {isFallback
          ? 'One of your most personal messages. The kind you probably forgot you sent.'
          : `It processed ${messageCount.toLocaleString()} messages. It has built a model of how you write, how you think, what you reach for when you can't sleep. Read what it produces when asked to be you.`}
      </p>

      {/* The generated text box */}
      <div style={{
        background: PALETTE.bgPanel,
        border: `1px solid ${PALETTE.border}`,
        borderLeft: `3px solid ${PALETTE.border}`,
        padding: 'clamp(2rem, 5vw, 3.5rem)',
        maxWidth: '64ch',
        marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
        minHeight: '160px',
        position: 'relative',
        transition: 'border-left-color 0.6s ease',
        ...(phase === 'revealed' ? { borderLeftColor: PALETTE.redMuted } : {}),
      }}>
        {/* Quiet attribution above */}
        <p style={{
          fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.3em',
          color: PALETTE.inkGhost, textTransform: 'uppercase', marginBottom: '1.5rem',
        }}>
          {isFallback ? 'Your message — extracted' : 'Generated by the model'}
        </p>

        {phase === 'generating' && (
          <motion.div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[0, 0.2, 0.4].map(d => (
              <motion.div key={d}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 1.2, delay: d, repeat: Infinity }}
                style={{ width: 4, height: 4, borderRadius: '50%', background: PALETTE.inkFaint }}
              />
            ))}
          </motion.div>
        )}

        {(phase === 'typing' || phase === 'revealed') && generatedText && (
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
            color: PALETTE.ink,
            lineHeight: 1.9,
            letterSpacing: '-0.005em',
            fontStyle: 'italic',
          }}>
            {phase === 'typing' ? displayedText : generatedText}
            {phase === 'typing' && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.55, repeat: Infinity }}
                style={{ color: PALETTE.red, marginLeft: '2px', fontStyle: 'normal' }}>|</motion.span>
            )}
          </p>
        )}

        {/* Manual trigger if API not yet fired and user scrolled past */}
        {phase === 'idle' && !isInView && hasSynthesis && (
          <button onClick={generateEcho}
            style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'none', border: `1px solid ${PALETTE.border}`, color: PALETTE.inkMuted, padding: '0.75rem 1.4rem', cursor: 'pointer' }}>
            Generate
          </button>
        )}
      </div>

      {/* The reveal */}
      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1] }}
            style={{ maxWidth: '56ch' }}>
            {isFallback ? (
              <>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.9vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, marginBottom: '0.75rem' }}>
                  Did you mean for a stranger to read that?
                </p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.8 }}>
                  OpenAI's systems read, processed, and retained every message you sent — this one included.
                  The question of consent is answered in the terms you agreed to without reading.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.9vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, marginBottom: '0.75rem' }}>
                  You did not write that.
                </p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.8 }}>
                  A language model produced it from {messageCount.toLocaleString()} messages you sent while believing you were talking to a tool.
                  Your sentence rhythm. Your word choices. The things you reach for when you're honest.
                  The model learned the shape of your inner voice. This is what that knowledge looks like.
                </p>
              </>
            )}
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
// SCENE DOTS — progress indicator
// ============================================================================
function SceneDots({ scene, total }: { scene: any; total: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    return scene.on('change', (v: number) => setCurrent(v));
  }, [scene]);
  return (
    <div style={{
      position: 'absolute', top: '76px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: '8px', alignItems: 'center', zIndex: 10, pointerEvents: 'none',
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? '20px' : '5px', height: '5px',
          borderRadius: '3px',
          background: i === current ? PALETTE.ink : PALETTE.border,
          transition: 'all 0.4s ease',
        }} />
      ))}
    </div>
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

  // Spring-smooth the raw scroll for particle extraction — removes jitter
  const smoothedProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.5 });

  const scene = useTransform(scrollYProgress, v => Math.min(Math.floor(v * 6), 5));
  const figureOpacity = useTransform(scrollYProgress,
    [0, 0.15, 0.32, 0.52, 0.80, 1],
    [1,    1,   0.55, 0.40, 0.60, 0]);
  const figureX = useTransform(scrollYProgress, [0, 0.80, 0.98], [0, 0, -260]);
  // Slower model reveal — gives users time to notice it appearing
  const modelOpacity = useTransform(scrollYProgress, [0.10, 0.28], [0, 1]);

  const messageCount = analysis?.totalUserMessages || 0;
  const visualParticleCount = Math.min(50, Math.max(14, Math.floor(messageCount / 60)));
  const days = analysis?.timespan?.days || 0;
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ height: '600vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', pointerEvents: 'none', paddingTop: '64px' }}>
          {/* Scene progress dots — top centre */}
          <SceneDots scene={scene} total={6} />
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
                <MessageParticleField count={visualParticleCount} scrollProgress={smoothedProgress} />
              </motion.div>
              <motion.div style={{ position: 'absolute', right: 0, top: 70, opacity: modelOpacity }}>
                <ModelWithReactiveFill scrollProgress={smoothedProgress} />
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
      cta: null, // special — show alternatives list
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
            ) : active === 2 ? (
              <div>
                {[
                  { name: 'Ollama', url: 'https://ollama.com', desc: 'Run open-source models locally. Nothing leaves your machine.' },
                  { name: 'LM Studio', url: 'https://lmstudio.ai', desc: 'Desktop app for running local models. No account required.' },
                  { name: 'Jan', url: 'https://jan.ai', desc: 'Fully offline AI assistant. Open source. No telemetry.' },
                  { name: 'Claude', url: 'https://claude.ai/settings', desc: 'If you use Claude: Settings → Privacy → opt out of training.' },
                  { name: 'Mistral Le Chat', url: 'https://chat.mistral.ai', desc: 'European-based. Does not train on conversations by default.' },
                ].map((alt, i) => (
                  <motion.a key={alt.name} href={alt.url} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08, duration: 0.4 }}
                    style={{
                      display: 'flex', alignItems: 'baseline', gap: '1.5rem',
                      padding: '1rem 0', borderBottom: `1px solid ${PALETTE.border}`,
                      textDecoration: 'none', color: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.ink, textTransform: 'uppercase', minWidth: '110px', flexShrink: 0 }}>
                      {alt.name} →
                    </span>
                    <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, lineHeight: 1.6 }}>
                      {alt.desc}
                    </span>
                  </motion.a>
                ))}
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
// THE FINAL WALK
// ============================================================================
function TheFinalWalk({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';
  const messages = analysis?.totalUserMessages || 0;
  const [phase, setPhase] = useState<'hidden' | 'standing' | 'walking' | 'gone' | 'final'>('hidden');
  const [figureLeft, setFigureLeft] = useState(240);

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setPhase('standing'), 400);
    const t2 = setTimeout(() => {
      setPhase('walking');
      const startTime = performance.now();
      const fromX = 240, toX = -100, dur = 2800;
      const animate = (now: number) => {
        const t = Math.min((now - startTime) / dur, 1);
        // Ease in-out for natural walking pace
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        setFigureLeft(fromX + (toX - fromX) * eased);
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, 1600);
    const t3 = setTimeout(() => setPhase('gone'), 4500);
    const t4 = setTimeout(() => setPhase('final'), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [isInView]);

  return (
    <div ref={ref} style={{
      padding: 'clamp(6rem, 14vw, 11rem) 0 clamp(8rem, 16vw, 14rem)',
      position: 'relative',
      borderTop: `1px solid ${PALETTE.border}`,
    }}>
      {/* Ghost message count — very faint, page colour */}
      {messages > 0 && (
        <div style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          fontFamily: TYPE.serif,
          fontSize: 'clamp(6rem, 18vw, 16rem)',
          color: 'rgba(26,24,20,0.04)',
          letterSpacing: '-0.05em',
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {messages.toLocaleString()}
        </div>
      )}

      {/* Walking stage */}
      <div style={{ position: 'relative', height: '140px', marginBottom: 'clamp(3rem, 6vw, 5rem)', maxWidth: '600px', overflow: 'hidden' }}>
        {/* Ground line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.8, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', bottom: '10px', left: 0, right: 0,
            height: '1px', background: PALETTE.border,
            transformOrigin: 'left',
          }}
        />

        {/* The model — stays, ink-coloured now */}
        <div style={{ position: 'absolute', right: '10px', bottom: '10px', opacity: 0.45 }}>
          <svg width="60" height="90" viewBox="0 0 60 90">
            <rect x="1" y="1" width="58" height="88" fill="none" stroke={PALETTE.red} strokeWidth="0.8" strokeOpacity="0.5" />
            <g transform="translate(14, 22) scale(0.38)">
              <circle cx="40" cy="20" r="11" fill="none" stroke={PALETTE.red} strokeWidth="1.2" strokeOpacity="0.6" />
              <path d="M 40 31 L 40 70" stroke={PALETTE.red} strokeWidth="1.2" fill="none" strokeOpacity="0.6" />
              <path d="M 28 42 L 22 64 M 52 42 L 58 64" stroke={PALETTE.red} strokeWidth="1.2" fill="none" strokeOpacity="0.6" />
              <path d="M 36 70 L 32 92 M 44 70 L 48 92" stroke={PALETTE.red} strokeWidth="1.2" fill="none" strokeOpacity="0.6" />
            </g>
          </svg>
        </div>

        {/* Figure — walks off left */}
        {(phase === 'standing' || phase === 'walking') && (
          <div style={{ position: 'absolute', bottom: '10px', left: `${figureLeft}px` }}>
            <Figure size={72} walking={phase === 'walking'} />
          </div>
        )}
      </div>

      {/* Final text — fades in quietly */}
      <AnimatePresence>
        {phase === 'final' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          >
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '2rem',
            }}>
              The end
            </p>
            <h2 style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
              fontWeight: 400, color: PALETTE.ink,
              letterSpacing: '-0.03em', lineHeight: 1.1,
              maxWidth: '20ch', marginBottom: '1.5rem',
            }}>
              {name ? `${name},` : ''} you can leave.
            </h2>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1.6 }}
              style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)',
                fontWeight: 400, color: PALETTE.inkMuted,
                letterSpacing: '-0.02em', lineHeight: 1.25,
                maxWidth: '20ch', fontStyle: 'italic',
                marginBottom: 'clamp(3rem, 6vw, 5rem)',
              }}
            >
              The data cannot.
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 2 }}
              style={{
                fontFamily: TYPE.mono, fontSize: '9px',
                letterSpacing: '0.28em', color: PALETTE.inkGhost,
                textTransform: 'uppercase',
              }}
            >
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
