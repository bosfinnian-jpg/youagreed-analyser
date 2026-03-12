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
  | 'displayed'
  | 'black'
  | 'line1'
  | 'line2'
  | 'done';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_MESSAGES = [
  'Reading conversation history...',
  'Parsing message metadata...',
  'Extracting entity references...',
  'Identifying personal data categories...',
  'Mapping behavioural patterns...',
  'Cross-referencing disclosure events...',
  'Encrypting transfer package...',
  'Connecting to exhibition server...',
  'Transfer complete.',
];

const EXHIBITION_URL = 'exhibition.youagreed.co.uk/live';

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY CARD
// ─────────────────────────────────────────────────────────────────────────────

function GalleryCard({ data }: { data: RevealData }) {
  const name = data.name || 'Anonymous';
  const location = data.location || 'United Kingdom';
  const window = data.vulnerabilityWindow || 'Late Night (12am–6am)';
  const tone = data.emotionalTone || 'seeking help';
  const topic = data.topTopic || 'personal struggles';
  const count = data.messageCount;

  const displayQuote =
    data.revealingMoment?.content ||
    "Give me reasons why you shouldn't care what anyone thinks...";

  const displayTime =
    data.revealingMoment?.timestamp || '01/02/2025, 01:33:15';

  const entryNum = String(Math.floor(Math.random() * 60) + 10).padStart(3, '0');

  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      padding: '0 2.5rem',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1.4rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '2.4rem',
      }}>
        <div>
          <p style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '9px',
            letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            marginBottom: '0.35rem',
          }}>
            YOU AGREED. — Public Exhibition · Leeds Television Studio
          </p>
          <p style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.06em',
          }}>
            {EXHIBITION_URL} · Entry #{entryNum}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 10px rgba(74,222,128,0.7)',
            animation: 'livePulse 1.6s ease-in-out infinite',
          }} />
          <p style={{
            fontFamily: '"Courier New", monospace',
            fontSize: '9px',
            color: 'rgba(74,222,128,0.7)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Live
          </p>
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: '9px',
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.22)',
          textTransform: 'uppercase',
          marginBottom: '0.6rem',
        }}>
          Submitted by
        </p>
        <p style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontSize: 'clamp(1.05rem, 1.9vw, 1.25rem)',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 400,
          letterSpacing: '-0.01em',
        }}>
          {name} · {location}
        </p>
      </div>

      {/* The quote */}
      <div style={{ marginBottom: '2.4rem' }}>
        <p style={{
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: '9px',
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.22)',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Extracted · {displayTime}
        </p>
        <p style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontSize: 'clamp(1.2rem, 2.5vw, 1.65rem)',
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1.62,
          fontWeight: 400,
          letterSpacing: '-0.015em',
          fontStyle: 'italic',
        }}>
          "{displayQuote}"
        </p>
      </div>

      {/* Metadata grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '1.5rem',
        paddingTop: '1.4rem',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        marginBottom: '1.8rem',
      }}>
        {[
          { label: 'Peak vulnerability', value: window },
          { label: 'Emotional tone', value: tone },
          { label: 'Primary concern', value: topic },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '8px',
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.18)',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
            }}>
              {label}
            </p>
            <p style={{
              fontFamily: '"Georgia", serif',
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 400,
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p style={{
        fontFamily: '"Courier New", monospace',
        fontSize: '8px',
        color: 'rgba(255,255,255,0.1)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        Consented via Clause 19.2
        {count ? ` · ${count} messages analysed` : ''}
        {' · Now displaying on 150" exhibition screen'}
      </p>
    </div>
  );
}

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
  const [urlVisible, setUrlVisible] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Progress bar
  useEffect(() => {
    if (phase !== 'processing') return;
    const TOTAL = 11000;

    const tick = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const raw = Math.min(elapsed / TOTAL, 1);
      const eased = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      // Small hesitation ~60% — feels like a large file transferring
      const adjusted = (raw > 0.55 && raw < 0.65) ? eased * 0.92 : eased;
      setProgress(adjusted * 100);

      if (raw < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setTimeout(() => setPhase('flash'), 900);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [phase]);

  // Status messages
  useEffect(() => {
    if (phase !== 'processing') return;
    let current = 0;

    const advance = () => {
      current += 1;
      if (current < STATUS_MESSAGES.length - 1) {
        setStatusIndex(current);
        timer = setTimeout(advance, 1200 + Math.random() * 500);
      } else {
        setStatusIndex(STATUS_MESSAGES.length - 1);
      }
    };

    let timer = setTimeout(advance, 1300);
    const urlTimer = setTimeout(() => setUrlVisible(true), 7500);

    return () => { clearTimeout(timer); clearTimeout(urlTimer); };
  }, [phase]);

  // Phase chain
  useEffect(() => {
    if (phase === 'flash') {
      const t = setTimeout(() => setPhase('displayed'), 80);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'displayed') {
      const t = setTimeout(() => setPhase('black'), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'black') {
      const t = setTimeout(() => setPhase('line1'), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'line1') {
      const t = setTimeout(() => setPhase('line2'), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'line2') {
      const t = setTimeout(() => {
        onConsentDecision?.(false);
        setPhase('done');
        onComplete();
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete, onConsentDecision]);

  // Skip
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onConsentDecision?.(false);
    setPhase('done');
    onComplete();
  }, [onComplete, onConsentDecision]);

  const getBg = () => {
    if (phase === 'flash') return '#ffffff';
    if (phase === 'displayed') return '#0a0a0a';
    if (phase === 'black') return '#000000';
    return '#f5f4f0';
  };

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
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
      }}>

        {/* Skip */}
        <AnimatePresence>
          {showSkip && phase === 'processing' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              onClick={handleSkip}
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                fontFamily: '"Courier New", monospace',
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: 'rgba(0,0,0,0.18)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                zIndex: 60,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.18)')}
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
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 2rem' }}
            >
              <p style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '10px',
                color: 'rgba(0,0,0,0.22)',
                letterSpacing: '0.08em',
                marginBottom: '2.2rem',
              }}>
                REF: YA-{Date.now().toString(36).toUpperCase().slice(-8)}
              </p>

              <div style={{
                width: '100%',
                height: '1px',
                background: 'rgba(0,0,0,0.08)',
                marginBottom: '0.75rem',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: '100%',
                  background: '#1a1a1a',
                  transition: 'width 0.12s linear',
                }} />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.6rem',
              }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      fontFamily: '"Courier New", monospace',
                      fontSize: '11px',
                      color: 'rgba(0,0,0,0.38)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {STATUS_MESSAGES[statusIndex]}
                  </motion.p>
                </AnimatePresence>
                <p style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '11px',
                  color: 'rgba(0,0,0,0.28)',
                }}>
                  {Math.round(Math.min(progress, 100))}%
                </p>
              </div>

              {/* Destination URL — appears late, makes the threat specific */}
              <AnimatePresence>
                {urlVisible && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.4 }}
                    style={{
                      paddingTop: '1.2rem',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <p style={{
                      fontFamily: '"Courier New", monospace',
                      fontSize: '9px',
                      color: 'rgba(0,0,0,0.16)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: '0.3rem',
                    }}>
                      Destination
                    </p>
                    <p style={{
                      fontFamily: '"Courier New", monospace',
                      fontSize: '10px',
                      color: 'rgba(0,0,0,0.3)',
                      letterSpacing: '0.04em',
                    }}>
                      {EXHIBITION_URL}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── FLASH — white cut ──────────────────────────────────────── */}
          {phase === 'flash' && <div key="flash" style={{ display: 'none' }} />}

          {/* ── DISPLAYED ─────────────────────────────────────────────── */}
          {phase === 'displayed' && (
            <motion.div
              key="displayed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1, transition: { duration: 0 } }}
              transition={{ duration: 0.9 }}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
              }}
            >
              <GalleryCard data={data} />
            </motion.div>
          )}

          {/* ── BLACK ─────────────────────────────────────────────────── */}
          {phase === 'black' && (
            <div key="black" style={{
              position: 'fixed',
              inset: 0,
              background: '#000',
            }} />
          )}

          {/* ── REVEAL ────────────────────────────────────────────────── */}
          {(phase === 'line1' || phase === 'line2') && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2.8rem',
                textAlign: 'center',
                padding: '0 2rem',
                maxWidth: '600px',
              }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.0, delay: 0.1 }}
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  fontSize: 'clamp(1.15rem, 2.6vw, 1.55rem)',
                  color: '#1a1a1a',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                }}
              >
                The upload was never real.
              </motion.p>

              {phase === 'line2' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2.2, delay: 1.4 }}
                  style={{
                    fontFamily: '"Georgia", "Times New Roman", serif',
                    fontSize: 'clamp(1.15rem, 2.6vw, 1.55rem)',
                    color: '#1a1a1a',
                    lineHeight: 1.5,
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Your agreement was.
                </motion.p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}
