'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RevealData {
  name?: string;
  location?: string;
  vulnerabilityWindow?: string;
  emotionalTone?: string;
  revealingMoment?: { timestamp: string; content: string };
  messageCount?: number;
  topTopic?: string;
  // New fields from deep parser
  lateNightCount?: number;
  lifeEventCount?: number;
  crisisPeriods?: number;
  dependencyScore?: number;
  topSegment?: string;
  firstMessageDate?: string;
  confessionalCount?: number;
}

interface CountdownRevealProps {
  onComplete: () => void;
  onConsentDecision?: (consented: boolean) => void;
  data?: RevealData;
}

type Phase = 'processing' | 'flash' | 'black' | 'reveal-1' | 'reveal-2' | 'reveal-3' | 'reveal-4' | 'done';

const TYPE = {
  serif: '"EB Garamond", Georgia, "Times New Roman", serif',
  mono: '"Courier Prime", "Courier New", monospace',
};

// Build personalised status messages from real data
function buildStatusMessages(data: RevealData): string[] {
  const msgs: string[] = [];
  const count = data.messageCount || 0;

  // Opening - always show message count if we have it
  msgs.push(count > 0
    ? `Reading ${count.toLocaleString()} conversations...`
    : 'Reading conversation history...'
  );

  // Temporal data
  if (data.firstMessageDate) {
    msgs.push(`Mapping ${Math.round(count / 7) || 'your'} weeks of history from ${data.firstMessageDate}...`);
  } else {
    msgs.push('Parsing message timestamps...');
  }

  // Location
  if (data.location) {
    msgs.push(`Location signal identified: ${data.location}`);
  } else {
    msgs.push('Extracting geographic signals...');
  }

  // Late night
  if (data.lateNightCount && data.lateNightCount > 20) {
    msgs.push(`${data.lateNightCount.toLocaleString()} messages sent between midnight and 5am`);
  } else {
    msgs.push('Mapping vulnerability windows...');
  }

  // Confessional count
  if (data.confessionalCount && data.confessionalCount > 5) {
    msgs.push(`${data.confessionalCount} confessional disclosures identified`);
  } else {
    msgs.push('Scoring emotional disclosure events...');
  }

  // Crisis periods
  if (data.crisisPeriods && data.crisisPeriods > 0) {
    msgs.push(`${data.crisisPeriods} crisis period${data.crisisPeriods > 1 ? 's' : ''} detected in your history`);
  } else {
    msgs.push('Analysing emotional trajectory...');
  }

  // Top topic
  if (data.topTopic) {
    msgs.push(`Primary recurring subject: ${data.topTopic}`);
  } else {
    msgs.push('Clustering recurring themes...');
  }

  // Commercial segment
  if (data.topSegment) {
    msgs.push(`Assigning commercial segment: ${data.topSegment}`);
  } else {
    msgs.push('Building commercial profile...');
  }

  // Dependency
  if (data.dependencyScore && data.dependencyScore > 60) {
    msgs.push(`Dependency score: ${data.dependencyScore}/100 — elevated`);
  } else {
    msgs.push('Embedding patterns into model weights...');
  }

  // Always end with this
  msgs.push('Process complete.');

  return msgs;
}

export default function CountdownReveal({ onComplete, onConsentDecision, data = {} }: CountdownRevealProps) {
  const [phase, setPhase] = useState<Phase>('processing');
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [paramCount, setParamCount] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const STATUS_MESSAGES = buildStatusMessages(data);
  const TOTAL_DURATION = 13000;

  // Progress bar
  useEffect(() => {
    if (phase !== 'processing') return;

    const tick = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const raw = Math.min(elapsed / TOTAL_DURATION, 1);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      // Hesitation at 62-72%
      const adjusted = (raw > 0.58 && raw < 0.72) ? eased * 0.87 : eased;
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

  // Status cycling
  useEffect(() => {
    if (phase !== 'processing') return;
    let current = 0;
    const interval = TOTAL_DURATION / STATUS_MESSAGES.length;

    const advance = () => {
      current += 1;
      if (current < STATUS_MESSAGES.length) {
        setStatusIndex(current);
        timer = setTimeout(advance, interval * (0.8 + Math.random() * 0.4));
      }
    };

    let timer = setTimeout(advance, interval);
    return () => clearTimeout(timer);
  }, [phase]);

  // Parameter counter
  useEffect(() => {
    if (phase !== 'processing') return;
    const target = 175000000000;
    let frame: number;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const raw = Math.min(elapsed / TOTAL_DURATION, 1);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      setParamCount(Math.floor(eased * target));
      if (raw < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Phase chain
  useEffect(() => {
    if (phase === 'flash') { const t = setTimeout(() => setPhase('black'), 80); return () => clearTimeout(t); }
  }, [phase]);
  useEffect(() => {
    if (phase === 'black') { const t = setTimeout(() => setPhase('reveal-1'), 2800); return () => clearTimeout(t); }
  }, [phase]);
  useEffect(() => {
    if (phase === 'reveal-1') { const t = setTimeout(() => setPhase('reveal-2'), 5500); return () => clearTimeout(t); }
  }, [phase]);
  useEffect(() => {
    if (phase === 'reveal-2') { const t = setTimeout(() => setPhase('reveal-3'), 5500); return () => clearTimeout(t); }
  }, [phase]);
  useEffect(() => {
    if (phase === 'reveal-3') { const t = setTimeout(() => setPhase('reveal-4'), 6000); return () => clearTimeout(t); }
  }, [phase]);
  useEffect(() => {
    if (phase === 'reveal-4') {
      const t = setTimeout(() => {
        onConsentDecision?.(false);
        setPhase('done');
        onComplete();
      }, 7000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete, onConsentDecision]);

  const handleSkip = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onConsentDecision?.(false);
    setPhase('done');
    onComplete();
  }, [onComplete, onConsentDecision]);

  const formatParams = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(n);
  };

  const messageCount = data.messageCount || 0;
  const isRevealPhase = phase.startsWith('reveal');

  const bgColor =
    phase === 'flash' ? '#ffffff' :
    phase === 'black' ? '#000000' :
    isRevealPhase ? '#0a0a09' :
    '#0e0e0d';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        body { margin: 0; background: #0e0e0d; }
        body::before {
          content:''; position:fixed; inset:0; z-index:10000;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.022; pointer-events:none;
        }
      `}</style>

      <motion.div
        animate={{ background: bgColor }}
        transition={{ duration: phase === 'flash' ? 0.05 : 1.2 }}
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: TYPE.mono,
        }}
      >
        <AnimatePresence mode="wait">

          {/* PROCESSING */}
          {phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{ width: 'min(560px, 90vw)', padding: '0' }}
            >
              {/* Reference line */}
              <p style={{ fontSize: '9px', letterSpacing: '0.18em', color: 'rgba(240,237,232,0.15)', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
                REF: YA-{Date.now().toString(36).toUpperCase().slice(-8)}
              </p>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.6rem', overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'rgba(240,237,232,0.5)', width: `${Math.min(progress, 100)}%`, transition: 'width 0.1s linear' }}
                />
              </div>

              {/* Status + percentage */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIndex}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.3 }}
                    style={{ fontSize: '11px', color: 'rgba(240,237,232,0.40)', letterSpacing: '0.04em' }}
                  >
                    {STATUS_MESSAGES[statusIndex]}
                  </motion.p>
                </AnimatePresence>
                <p style={{ fontSize: '11px', color: 'rgba(240,237,232,0.22)', flexShrink: 0, marginLeft: '1rem' }}>
                  {Math.round(Math.min(progress, 100))}%
                </p>
              </div>

              {/* Parameter counter */}
              <AnimatePresence>
                {progress > 20 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}
                  >
                    <p style={{ fontSize: '9px', color: 'rgba(240,237,232,0.14)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Model parameters affected
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(240,237,232,0.30)', letterSpacing: '0.04em' }}>
                      {formatParams(paramCount)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name appears if we have it */}
              <AnimatePresence>
                {progress > 45 && data.name && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    style={{ marginTop: '1rem' }}
                  >
                    <p style={{ fontSize: '9px', color: 'rgba(240,237,232,0.14)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Subject identified
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(240,237,232,0.28)', letterSpacing: '0.06em' }}>
                      {data.name}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Irreversibility */}
              <AnimatePresence>
                {progress > 76 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    style={{ marginTop: '1.5rem' }}
                  >
                    <p style={{ fontSize: '9px', color: 'rgba(220,60,50,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      This process is irreversible
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* BLACK */}
          {phase === 'black' && (
            <motion.div key="black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} style={{ position: 'fixed', inset: 0, background: '#000' }} />
          )}

          {/* REVEAL SEQUENCE */}
          {isRevealPhase && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1.5 } }}
              transition={{ duration: 2 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2.5rem', maxWidth: '680px', gap: '0' }}
            >
              {/* Beat 1 */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay: 0.2 }}
                style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.8vw, 1.6rem)', color: 'rgba(240,237,232,0.9)', lineHeight: 1.65, fontWeight: 400, letterSpacing: '-0.01em' }}
              >
                {messageCount > 0 ? `${messageCount.toLocaleString()} messages.` : 'Your entire conversation history.'}
              </motion.p>

              {/* Beat 2 */}
              {(phase === 'reveal-2' || phase === 'reveal-3' || phase === 'reveal-4') && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.8, delay: 0.3 }}
                  style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.8vw, 1.6rem)', color: 'rgba(240,237,232,0.9)', lineHeight: 1.65, fontWeight: 400, letterSpacing: '-0.01em', marginTop: '2.2rem' }}
                >
                  Every pattern. Every vulnerability. Every thought you believed was private.
                  <br />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2, duration: 1.5 }}
                    style={{ color: 'rgba(220,60,50,0.90)' }}
                  >
                    Now embedded in model weights you cannot inspect, audit, or delete.
                  </motion.span>
                </motion.p>
              )}

              {/* Beat 3 */}
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
                    transition={{ duration: 1.5, delay: 0.3 }}
                    style={{ width: '40px', height: '1px', margin: '0 auto 2rem', background: 'rgba(240,237,232,0.12)', transformOrigin: 'center' }}
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2, delay: 1 }}
                    style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.8vw, 1.6rem)', color: 'rgba(240,237,232,0.9)', lineHeight: 1.65, fontWeight: 400 }}
                  >
                    You agreed to this.
                  </motion.p>
                </motion.div>
              )}

              {/* Beat 4 */}
              {phase === 'reveal-4' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2.5, delay: 1.5 }}
                  style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.9vw, 1.15rem)', color: 'rgba(240,237,232,0.30)', lineHeight: 1.65, fontStyle: 'italic', marginTop: '2rem' }}
                >
                  Clause 19.2. You scrolled past it.
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip */}
        <AnimatePresence>
          {phase === 'processing' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 6 }}
              onClick={handleSkip}
              style={{
                position: 'fixed', bottom: '2rem', right: '2rem',
                fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
                color: 'rgba(240,237,232,0.18)', background: 'none', border: 'none',
                cursor: 'pointer', textTransform: 'uppercase',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,237,232,0.40)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,237,232,0.18)'; }}
            >
              Skip
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
