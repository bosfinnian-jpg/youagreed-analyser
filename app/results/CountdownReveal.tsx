'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RevealData {
  name?: string;
  location?: string;
  vulnerabilityWindow?: string;
  emotionalTone?: string;
  revealingMoment?: {
    timestamp: string;
    content: string;
  };
  messageCount?: number;
  topTopic?: string;
}

interface CountdownRevealProps {
  onComplete: () => void;
  onConsentDecision?: (consented: boolean) => void;
  data?: RevealData;
}

type Phase =
  | 'processing'
  | 'flash'
  | 'black'
  | 'reveal-1'
  | 'reveal-2'
  | 'reveal-3'
  | 'reveal-4'
  | 'done';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MESSAGES = [
  'Reading conversation history...',
  'Parsing message metadata...',
  'Extracting cognitive patterns...',
  'Mapping emotional disclosure events...',
  'Identifying vulnerability windows...',
  'Tokenising conversational data...',
  'Embedding patterns into model weights...',
  'Distributing across parameter space...',
  'Process complete.',
];

const TYPE = {
  serif: '"EB Garamond", Georgia, "Times New Roman", serif',
  mono: '"Courier New", monospace',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CountdownReveal({
  onComplete,
  onConsentDecision,
  data = {},
}: CountdownRevealProps) {
  const [phase, setPhase] = useState<Phase>('processing');
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [paramCount, setParamCount] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // ── Progress bar ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'processing') return;
    const TOTAL = 12000;

    const tick = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const raw = Math.min(elapsed / TOTAL, 1);
      const eased = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      // Hesitation around 60-70% — feels like heavy computation
      const adjusted = (raw > 0.55 && raw < 0.70) ? eased * 0.88 : eased;
      setProgress(adjusted * 100);

      if (raw < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setTimeout(() => setPhase('flash'), 1200);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [phase]);

  // ── Status messages ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'processing') return;
    let current = 0;

    const advance = () => {
      current += 1;
      if (current < STATUS_MESSAGES.length - 1) {
        setStatusIndex(current);
        timer = setTimeout(advance, 1300 + Math.random() * 500);
      } else {
        setStatusIndex(STATUS_MESSAGES.length - 1);
      }
    };

    let timer = setTimeout(advance, 1400);
    return () => { clearTimeout(timer); };
  }, [phase]);

  // ── Parameter counter animation (during processing) ───────────────────────
  useEffect(() => {
    if (phase !== 'processing') return;
    const target = 175000000000; // 175 billion
    let frame: number;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(elapsed / 12000, 1);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      setParamCount(Math.floor(eased * target));
      if (raw < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // ── Phase chain ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'flash') {
      const t = setTimeout(() => setPhase('black'), 100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'black') {
      const t = setTimeout(() => setPhase('reveal-1'), 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'reveal-1') {
      const t = setTimeout(() => setPhase('reveal-2'), 5000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'reveal-2') {
      const t = setTimeout(() => setPhase('reveal-3'), 5500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'reveal-3') {
      const t = setTimeout(() => setPhase('reveal-4'), 5500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'reveal-4') {
      const t = setTimeout(() => {
        onConsentDecision?.(false);
        setPhase('done');
        onComplete();
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete, onConsentDecision]);

  // ── Skip ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onConsentDecision?.(false);
    setPhase('done');
    onComplete();
  }, [onComplete, onConsentDecision]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatParams = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(n);
  };

  const messageCount = data.messageCount || 0;
  const name = data.name || 'Anonymous';

  const getBg = (): string => {
    if (phase === 'flash') return '#ffffff';
    if (phase === 'black') return '#000000';
    if (phase === 'processing') return '#f5f4f0';
    return '#f5f4f0';
  };

  const isRevealPhase = phase.startsWith('reveal');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        body::before {
          content:''; position:fixed; inset:0; z-index:10000;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.028; pointer-events:none;
        }
      `}</style>

      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: getBg(),
        transition: phase === 'flash' ? 'none' : 'background 1.5s ease',
      }}>

        {/* Skip */}
        <AnimatePresence>
          {showSkip && (phase === 'processing' || isRevealPhase) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              onClick={handleSkip}
              style={{
                position: 'absolute', top: '2rem', right: '2rem',
                fontFamily: TYPE.mono, fontSize: '10px',
                letterSpacing: '0.12em',
                color: phase === 'processing' ? 'rgba(0,0,0,0.18)' : 'rgba(26,26,26,0.18)',
                background: 'none', border: 'none', cursor: 'pointer', zIndex: 60,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = phase === 'processing' ? 'rgba(0,0,0,0.45)' : 'rgba(26,26,26,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.color = phase === 'processing' ? 'rgba(0,0,0,0.18)' : 'rgba(26,26,26,0.18)')}
            >
              SKIP
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── PROCESSING ─────────────────────────────────────────────── */}
          {phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', maxWidth: '420px', padding: '0 2rem' }}
            >
              {/* Reference number */}
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px',
                color: 'rgba(0,0,0,0.22)', letterSpacing: '0.08em',
                marginBottom: '2.5rem',
              }}>
                REF: YA-{Date.now().toString(36).toUpperCase().slice(-8)}
              </p>

              {/* Progress bar */}
              <div style={{
                width: '100%', height: '1px',
                background: 'rgba(0,0,0,0.08)',
                marginBottom: '0.75rem', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: '100%', background: '#1a1a1a',
                  transition: 'width 0.12s linear',
                }} />
              </div>

              {/* Status + percentage */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '2rem',
              }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      fontFamily: TYPE.mono, fontSize: '11px',
                      color: 'rgba(0,0,0,0.38)', letterSpacing: '0.04em',
                    }}
                  >
                    {STATUS_MESSAGES[statusIndex]}
                  </motion.p>
                </AnimatePresence>
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '11px',
                  color: 'rgba(0,0,0,0.28)',
                }}>
                  {Math.round(Math.min(progress, 100))}%
                </p>
              </div>

              {/* Parameter counter — appears after 3 seconds */}
              <AnimatePresence>
                {progress > 25 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    style={{
                      paddingTop: '1.5rem',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <p style={{
                      fontFamily: TYPE.mono, fontSize: '9px',
                      color: 'rgba(0,0,0,0.16)', letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const, marginBottom: '0.4rem',
                    }}>
                      Model parameters affected
                    </p>
                    <p style={{
                      fontFamily: TYPE.mono, fontSize: '13px',
                      color: 'rgba(0,0,0,0.32)', letterSpacing: '0.04em',
                    }}>
                      {formatParams(paramCount)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Irreversibility notice — appears near end */}
              <AnimatePresence>
                {progress > 75 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    style={{ marginTop: '1.5rem' }}
                  >
                    <p style={{
                      fontFamily: TYPE.mono, fontSize: '9px',
                      color: 'rgba(168,36,36,0.35)', letterSpacing: '0.1em',
                      textTransform: 'uppercase' as const,
                    }}>
                      This process is irreversible
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── FLASH — white cut ──────────────────────────────────────── */}
          {phase === 'flash' && <div key="flash" style={{ display: 'none' }} />}

          {/* ── BLACK — breathing room ─────────────────────────────────── */}
          {phase === 'black' && (
            <motion.div
              key="black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              style={{ position: 'fixed', inset: 0, background: '#000' }}
            />
          )}

          {/* ── REVEAL SEQUENCE ────────────────────────────────────────── */}
          {isRevealPhase && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1.5 } }}
              transition={{ duration: 2 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', padding: '0 2.5rem',
                maxWidth: '620px', gap: '0',
              }}
            >
              {/* Beat 1: What was taken */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.2 }}
                style={{
                  fontFamily: TYPE.serif,
                  fontSize: 'clamp(1.15rem, 2.6vw, 1.5rem)',
                  color: '#1a1a1a', lineHeight: 1.65,
                  fontWeight: 400, letterSpacing: '-0.01em',
                }}
              >
                {messageCount > 0
                  ? `${messageCount.toLocaleString()} messages.`
                  : 'Your entire conversation history.'
                }
              </motion.p>

              {/* Beat 2: Embedded permanently */}
              {(phase === 'reveal-2' || phase === 'reveal-3' || phase === 'reveal-4') && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.8, delay: 0.3 }}
                  style={{
                    fontFamily: TYPE.serif,
                    fontSize: 'clamp(1.15rem, 2.6vw, 1.5rem)',
                    color: '#1a1a1a', lineHeight: 1.65,
                    fontWeight: 400, letterSpacing: '-0.01em',
                    marginTop: '2.2rem',
                  }}
                >
                  Every pattern. Every vulnerability. Every thought you believed was private.
                  <br />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 1.5 }}
                    style={{ color: 'rgba(168,36,36,0.85)' }}
                  >
                    Now embedded in model weights you cannot inspect, audit, or delete.
                  </motion.span>
                </motion.p>
              )}

              {/* Beat 3: The consent line */}
              {(phase === 'reveal-3' || phase === 'reveal-4') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2, delay: 0.5 }}
                  style={{ marginTop: '3.5rem' }}
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      width: '40px', height: '1px', margin: '0 auto 2rem',
                      background: 'rgba(26,26,26,0.15)', transformOrigin: 'center',
                    }}
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, delay: 1 }}
                    style={{
                      fontFamily: TYPE.serif,
                      fontSize: 'clamp(1.15rem, 2.6vw, 1.5rem)',
                      color: '#1a1a1a', lineHeight: 1.65,
                      fontWeight: 400, letterSpacing: '-0.01em',
                    }}
                  >
                    You agreed to this.
                  </motion.p>
                </motion.div>
              )}

              {/* Beat 4: The kicker */}
              {phase === 'reveal-4' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2.5, delay: 1.5 }}
                  style={{
                    fontFamily: TYPE.serif,
                    fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                    color: 'rgba(26,26,26,0.35)',
                    lineHeight: 1.65, fontStyle: 'italic',
                    fontWeight: 400, letterSpacing: '-0.005em',
                    marginTop: '2rem',
                  }}
                >
                  Clause 19.2. You scrolled past it.
                </motion.p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}
