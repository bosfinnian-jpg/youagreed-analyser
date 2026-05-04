'use client';

// ============================================================================
// OVERVIEW PAGE — Act I: The Record
// ============================================================================
// Architecture: linear single-column scroll, eight chapters, fixed right rail.
// Each chapter is its own moment of demonstration — anime.js earns its place
// by embodying the argument, not decorating it.
//
// ┌──────────────────────────────────────────────────────────────────────┐
// │ 00 ARRIVAL    confident silence — type alone, almost no animation    │
// │ 01 VOLUME     the count, then a field of dots, stagger from random   │
// │ 02 INFERENCE  attributes stamped onto the page — spring scale+rotate │
// │ 03 DISCLOSURE the most exposing excerpt — createDrawable + words     │
// │ 04 NETWORK    named people connected by SVG paths drawing in         │
// │ 05 SCORE      the climax ring — createTimeline + spring counter      │
// │ 06 PERMANENCE the gut-punch — RETAINED watermark + sealed mass       │
// │ 07 CONTINUE   navigation onward                                      │
// └──────────────────────────────────────────────────────────────────────┘
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { animate, stagger, onScroll, createDrawable, createSpring, createTimeline } from 'animejs';
import { PALETTE, TYPE, type DashPage, ActLabel, ThreadSentence, PageFooter } from './DashboardLayout';

// ── Chapters ────────────────────────────────────────────────────────────────
const CHAPTERS = [
  { id: 'arrival',    label: 'Arrival'    },
  { id: 'volume',     label: 'Volume'     },
  { id: 'inference',  label: 'Inference'  },
  { id: 'disclosure', label: 'Disclosure' },
  { id: 'network',    label: 'Network'    },
  { id: 'score',      label: 'Score'      },
  { id: 'permanence', label: 'Permanence' },
] as const;
type ChapterId = typeof CHAPTERS[number]['id'];

// ── Helpers ─────────────────────────────────────────────────────────────────
function useScrollTrigger(ref: React.RefObject<HTMLElement | null>, fn: () => void | (() => void), deps: any[] = []) {
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = onScroll({
      target: el,
      onEnter: () => {
        if (fired.current) return;
        fired.current = true;
        fn();
      },
    });
    return () => { obs.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const fmt = (n: number | null | undefined) =>
  typeof n === 'number' ? n.toLocaleString('en-GB') : '—';

// ════════════════════════════════════════════════════════════════════════════
// RIGHT RAIL — fixed chapter index
// ════════════════════════════════════════════════════════════════════════════
function RightRail({ active, visible }: { active: ChapterId; visible: ChapterId[] }) {
  return (
    <div className="ov-right-rail" style={{
      position: 'fixed',
      right: 'clamp(1rem, 2.5vw, 2rem)',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      pointerEvents: 'none',
    }}>
      {CHAPTERS.filter(c => visible.includes(c.id)).map((c) => {
        const isActive = c.id === active;
        return (
          <div key={c.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isActive ? 1 : 0.25,
            transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <span style={{
              fontFamily: TYPE.mono,
              fontSize: '9px',
              letterSpacing: '0.3em',
              color: isActive ? PALETTE.ink : PALETTE.inkFaint,
              textTransform: 'uppercase',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              height: isActive ? '80px' : '48px',
              textAlign: 'center',
              transition: 'height 0.65s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s',
              overflow: 'hidden',
            }}>
              {c.label}
            </span>
            <div style={{
              width: isActive ? '2px' : '1px',
              height: isActive ? '64px' : '8px',
              background: isActive ? PALETTE.red : PALETTE.border,
              transition: 'height 0.65s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s, width 0.3s',
            }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Chapter Dots — Spotify Wrapped progress indicator ───────────────────────
function ChapterDots({ active, chapters }: { active: ChapterId; chapters: typeof CHAPTERS[number][] }) {
  const activeLabel = chapters.find(c => c.id === active)?.label ?? '';
  const handleJump = (id: ChapterId) => {
    const el = document.getElementById(`chapter-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div className="ov-chapter-dots" style={{
      position: 'fixed', bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '8px',
      paddingTop: '0.75rem',
    }}>
      <span style={{
        fontFamily: TYPE.mono, fontSize: '9px',
        letterSpacing: '0.28em', color: PALETTE.inkFaint,
        textTransform: 'uppercase',
        transition: 'opacity 0.4s',
      }}>{activeLabel}</span>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', pointerEvents: 'auto' }}>
        {chapters.map(c => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              onClick={() => handleJump(c.id)}
              aria-label={`Jump to chapter: ${c.label}`}
              className="inline-tight"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '14px 4px',  // touch-friendly hit area, visual bar within
                margin: 0,
                display: 'flex', alignItems: 'center',
              }}
            >
              <span style={{
                display: 'block',
                height: 5,
                width: isActive ? 22 : 5,
                borderRadius: 3,
                background: isActive ? PALETTE.ink : 'rgba(26,24,20,0.20)',
                transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), background 0.3s',
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER SHELL — consistent layout for every chapter
// ════════════════════════════════════════════════════════════════════════════
function ChapterShell({
  id, num, label, children, onActive, last = false,
}: {
  id: ChapterId;
  num?: string;
  label: string;
  children: React.ReactNode;
  onActive: (id: ChapterId) => void;
  last?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const active = entry.isIntersecting;
        if (active) onActive(id);
        setIsActive(active);
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, onActive]);

  return (
    <section
      ref={ref}
      id={`chapter-${id}`}
      className={`chapter-snap chapter-shell${last ? ' chapter-last' : ''}`}
      style={{
        height: '100dvh',
        padding: 'clamp(4rem,10vw,8rem) clamp(1.25rem,6vw,5rem) clamp(1.5rem,4vw,3rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Ghost chapter number */}
      {num && (
        <div aria-hidden="true" className="chapter-ghost-num" style={{
          position: 'absolute',
          right: '-0.05em',
          top: '50%',
          transform: `translateY(-50%) scale(${isActive ? 1 : 0.96})`,
          fontFamily: TYPE.serif,
          fontSize: 'clamp(10rem, 26vw, 22rem)',
          fontWeight: 400,
          color: `rgba(26,24,20,${isActive ? 0.042 : 0.008})`,
          lineHeight: 1,
          letterSpacing: '-0.05em',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'color 1.4s ease, transform 1.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}>{num}</div>
      )}
      <div style={{
        maxWidth: 880,
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {(num || label) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 'clamp(1.5rem,3vw,2.5rem)',
            opacity: isActive ? 1 : 0.3,
            transform: `translateX(${isActive ? 0 : -10}px)`,
            transition: 'opacity 0.9s ease, transform 1s cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}>
            {num && (
              <span style={{
                fontFamily: TYPE.mono, fontSize: '11px',
                letterSpacing: '0.32em', color: PALETTE.redMuted,
                textTransform: 'uppercase',
              }}>{num}</span>
            )}
            {num && <span style={{ flex: '0 0 64px', height: 1, background: PALETTE.border }} />}
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px',
              letterSpacing: '0.32em', color: PALETTE.ink,
              textTransform: 'uppercase',
            }}>{label}</span>
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 00 — ARRIVAL
// Confident silence. Almost no animation. Just the type.
// ════════════════════════════════════════════════════════════════════════════
function ArrivalChapter({ name, date, onActive }: {
  name: string | null;
  date: string;
  onActive: (id: ChapterId) => void;
}) {
  return (
    <ChapterShell id="arrival" label="File 01" onActive={onActive}>
      <div style={{ marginBottom: '2.5rem' }}>
        <ActLabel roman="I" title="The Record" pageLabel="01 / Overview" />
        <ThreadSentence>You agreed to terms that permitted this. What follows is what those terms extracted.</ThreadSentence>
      </div>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.32em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
          marginBottom: '3rem',
        }}
      >
        Compiled · {date}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.2, 0, 0.2, 1] }}
        className="arrival-heading"
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(3.6rem, 13vw, 8rem)',
          fontWeight: 400,
          color: PALETTE.ink,
          letterSpacing: '-0.04em',
          lineHeight: 0.96,
          marginBottom: 'clamp(1.5rem,5vw,2.5rem)',
        }}
      >
        The Record<br/>of {name ? <span style={{ color: PALETTE.red }}>{name}</span> : 'You'}.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.15rem, 1.9vw, 1.3rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.72,
          maxWidth: '46ch',
          marginBottom: 'clamp(2.5rem,8vw,4rem)',
        }}
      >
        What follows was inferred from your conversations.
        Each item is permanent. None of it can be returned.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        <div style={{ width: 32, height: 1, background: PALETTE.ink }} />
        <motion.span
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontFamily: TYPE.mono, fontSize: '10px',
            letterSpacing: '0.3em', color: PALETTE.inkFaint,
            textTransform: 'uppercase',
          }}
        >
          Scroll to begin
        </motion.span>
      </motion.div>
    </ChapterShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 01 — VOLUME
// Horizontal bar per day of week. Width = message count that day.
// Sparse data reads cleanly — the pattern is immediately visible.
// ════════════════════════════════════════════════════════════════════════════
function VolumeChapter({ count, days, dayHourMatrix, onActive }: {
  count: number;
  days: number;
  dayHourMatrix: number[][];
  onActive: (id: ChapterId) => void;
}) {
  const numRef     = useRef<HTMLSpanElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const barRefs    = useRef<HTMLDivElement[]>([]);

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Total per day
  const dayTotals = dayHourMatrix.map(row => row.reduce((s, v) => s + v, 0));
  const maxDay    = Math.max(...dayTotals, 1);
  const peakDay   = dayTotals.indexOf(maxDay);

  useScrollTrigger(sectionRef, () => {
    // Count up
    const num = numRef.current;
    if (num) {
      const obj = { v: 0 };
      animate(obj, {
        v: count,
        ease: createSpring({ stiffness: 60, damping: 14 }).ease,
        duration: 2000,
        onUpdate: () => { num.textContent = fmt(Math.round(obj.v)); },
      });
    }

    // Bars grow from left
    barRefs.current.filter(Boolean).forEach((el, i) => {
      el.style.width = '0%';
      setTimeout(() => {
        animate(el, {
          width: [`0%`, `${Math.max(2, (dayTotals[i] / maxDay) * 100)}%`],
          duration: 800,
          ease: createSpring({ stiffness: 120, damping: 18 }).ease,
        });
      }, 80 + i * 60);
    });
  }, [count, dayTotals]);

  return (
    <div ref={sectionRef}>
      <ChapterShell id="volume" num="01" label="Volume" onActive={onActive}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1.25rem,3vw,2rem)' }}>

          {/* Count headline */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(3.8rem,10vw,6rem)',
              fontWeight: 400, color: PALETTE.ink,
              letterSpacing: '-0.05em', lineHeight: 0.92,
              margin: 0,
            }}>
              <span ref={numRef}>0</span>
            </h2>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1rem,2vw,1.3rem)',
              color: PALETTE.inkMuted,
              fontStyle: 'italic',
              lineHeight: 1.3,
              margin: 0,
            }}>
              messages{days > 0 ? `, across ${days} days` : ''}.
            </p>
          </div>

          {/* Strip chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 640 }}>
            {DAY_LABELS.map((label, d) => {
              const val      = dayTotals[d];
              const isPeak   = d === peakDay;
              const hasData  = val > 0;

              return (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Day label */}
                  <span style={{
                    fontFamily: TYPE.mono,
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    color: isPeak ? PALETTE.ink : PALETTE.inkFaint,
                    textTransform: 'uppercase',
                    width: '28px',
                    flexShrink: 0,
                    fontWeight: isPeak ? 700 : 400,
                  }}>
                    {label}
                  </span>

                  {/* Track + bar */}
                  <div style={{
                    flex: 1,
                    height: isPeak ? 10 : 6,
                    background: 'rgba(26,24,20,0.07)',
                    position: 'relative',
                    borderRadius: '1px',
                  }}>
                    <div
                      ref={el => { if (el) barRefs.current[d] = el; }}
                      style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: '0%',
                        background: isPeak ? PALETTE.red : hasData ? 'rgba(26,24,20,0.45)' : 'transparent',
                        borderRadius: '1px',
                      }}
                    />
                  </div>

                  {/* Count */}
                  <span style={{
                    fontFamily: TYPE.mono,
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    color: isPeak ? PALETTE.red : hasData ? PALETTE.inkFaint : 'rgba(26,24,20,0.18)',
                    width: '18px',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    {val > 0 ? val : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Copy */}
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(0.95rem,1.6vw,1.1rem)',
            color: PALETTE.inkMuted,
            lineHeight: 1.78,
            maxWidth: '44ch',
          }}>
            Each one a permanent record. OpenAI's Privacy Policy permits use
            of conversation content to improve its models — no version specifies
            which conversations were used, or when.
          </p>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
          }}>
            OpenAI Privacy Policy, June 2023 — April 2026
          </p>

        </div>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 02 — INFERENCE
// 4 cards max. Closed by default — click to reveal each one.
// The act of clicking mirrors the act of consenting: you open it yourself.
// ════════════════════════════════════════════════════════════════════════════
function InferenceCard({ inf, index, revealed, onReveal }: {
  inf: { attribute: string; value: string; confidence: number };
  index: number;
  revealed: boolean;
  onReveal: (i: number) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef  = useRef<HTMLDivElement>(null);
  const confRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!revealed) return;
    const card = cardRef.current;
    const bar  = barRef.current;
    const conf = confRef.current;
    if (!card || !bar) return;

    animate(card, {
      scale:   [0.96, 1],
      opacity: [0.6, 1],
      rotate:  ['-1.5deg', '0deg'],
      duration: 500,
      ease: createSpring({ stiffness: 220, damping: 14 }).ease,
    });

    bar.style.transform = 'scaleX(0)';
    animate(bar, {
      scaleX:   [0, 1],
      duration: 700,
      ease:     'outQuart',
      delay:    80,
    });

    if (conf) {
      const target = inf.confidence;
      const obj = { v: 0 };
      setTimeout(() => {
        animate(obj, {
          v: target,
          duration: 700,
          ease: 'outQuart',
          onUpdate: () => { conf.textContent = obj.v.toFixed(2); },
        });
      }, 120);
    }
  }, [revealed, inf.confidence]);

  return (
    <div
      ref={cardRef}
      onClick={() => !revealed && onReveal(index)}
      style={{
        border: `1px solid ${revealed ? PALETTE.border : 'rgba(26,24,20,0.12)'}`,
        padding: 'clamp(1.1rem, 2vw, 1.4rem)',
        background: revealed ? PALETTE.bgPanel : 'rgba(26,24,20,0.025)',
        cursor: revealed ? 'default' : 'pointer',
        transformOrigin: 'center',
        transition: 'background 0.3s, border-color 0.3s',
        position: 'relative',
        overflow: 'hidden',
        minHeight: revealed ? 'auto' : '5.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
      onMouseEnter={e => { if (!revealed) (e.currentTarget as HTMLDivElement).style.background = 'rgba(26,24,20,0.055)'; }}
      onMouseLeave={e => { if (!revealed) (e.currentTarget as HTMLDivElement).style.background = 'rgba(26,24,20,0.025)'; }}
    >
      {/* Closed state */}
      {!revealed && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '9px',
            letterSpacing: '0.25em', color: PALETTE.inkFaint,
            textTransform: 'uppercase',
          }}>
            {inf.attribute}
          </span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '9px',
            letterSpacing: '0.2em', color: PALETTE.redMuted,
            textTransform: 'uppercase', opacity: 0.7,
          }}>
            tap to reveal →
          </span>
        </div>
      )}

      {/* Revealed state */}
      {revealed && (
        <>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '9px',
            letterSpacing: '0.22em', color: PALETTE.inkFaint,
            textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>
            {inf.attribute}
          </p>
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
            color: PALETTE.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            marginBottom: '1rem',
          }}>
            {inf.value}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              flex: 1, height: 1,
              background: 'rgba(26,24,20,0.10)',
              position: 'relative',
            }}>
              <div ref={barRef} style={{
                position: 'absolute', inset: 0,
                background: PALETTE.red,
                transformOrigin: 'left center',
                width: `${Math.max(8, Math.min(100, inf.confidence * 100))}%`,
              }} />
            </div>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px',
              letterSpacing: '0.1em', color: PALETTE.inkFaint,
            }}>
              <span ref={confRef}>0.00</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function InferenceChapter({ inferences, onActive }: {
  inferences: { attribute: string; value: string; confidence: number }[];
  onActive: (id: ChapterId) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const capped = inferences.slice(0, 4);

  useEffect(() => {
    setRevealed(Array(capped.length).fill(false));
  }, [capped.length]);

  const handleReveal = (i: number) => {
    setRevealed(prev => prev.map((v, idx) => idx === i ? true : v));
  };

  const allRevealed = revealed.every(Boolean) && revealed.length > 0;

  return (
    <div ref={sectionRef}>
      <ChapterShell id="inference" num="02" label="Inference" onActive={onActive}>
        <h2 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.6rem,3.5vw,2.4rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          marginBottom: 'clamp(0.5rem,1.5vw,1rem)',
          maxWidth: '20ch',
        }}>
          From these messages, the model learned:
        </h2>

        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px',
          letterSpacing: '0.22em', color: PALETTE.redMuted,
          textTransform: 'uppercase', marginBottom: 'clamp(0.85rem,2vw,1.25rem)',
          opacity: allRevealed ? 0 : 1,
          transition: 'opacity 0.6s',
        }}>
          {revealed.filter(Boolean).length} of {capped.length} revealed
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'clamp(0.6rem, 1.5vw, 1rem)',
          marginBottom: 'clamp(1rem,2vw,1.5rem)',
        }}>
          {capped.map((inf, i) => (
            <InferenceCard
              key={i}
              inf={inf}
              index={i}
              revealed={revealed[i] ?? false}
              onReveal={handleReveal}
            />
          ))}
        </div>

        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem,1.7vw,1.18rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.78,
          maxWidth: '50ch',
          opacity: allRevealed ? 1 : 0.35,
          transition: 'opacity 0.8s ease',
        }}>
          None of these attributes were stated. All were inferred.
          OpenAI's terms permit the use of conversation content to improve
          its models — but say nothing about what is inferred in the process,
          or what that inference produces.
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
          marginTop: '1rem', opacity: 0.6,
        }}>OpenAI Terms of Service, 2023 · OpenAI Privacy Policy, 2026</p>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 03 — DISCLOSURE
// Most exposing excerpt. Red border draws down, words appear sequentially.
// ════════════════════════════════════════════════════════════════════════════
function DisclosureChapter({ excerpt, date, onActive }: {
  excerpt: string;
  date: string | null;
  onActive: (id: ChapterId) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const borderRef  = useRef<SVGLineElement>(null);
  const wordsRef   = useRef<HTMLDivElement>(null);
  const stampRef   = useRef<HTMLDivElement>(null);

  const words = excerpt.split(' ');

  useScrollTrigger(sectionRef, () => {
    // 1. Border draws down with createDrawable
    const border = borderRef.current;
    if (border) {
      const drawables = createDrawable(border);
      if (drawables.length) {
        animate(drawables, {
          draw: ['0 0', '0 1'],
          duration: 1200,
          ease: 'outQuart',
          delay: 100,
        });
      }
    }

    // 2. Words appear left to right
    const wrap = wordsRef.current;
    if (wrap) {
      const wEls = Array.from(wrap.querySelectorAll('.d-word'));
      wEls.forEach(w => { (w as HTMLElement).style.opacity = '0'; });
      animate(wEls, {
        opacity:  [0, 1],
        delay:    stagger(45, { start: 600 }),
        duration: 350,
        ease:     'outQuint',
      });
    }

    // 3. RETAINED stamp appears after the quote
    const stamp = stampRef.current;
    if (stamp) {
      stamp.style.opacity = '0';
      stamp.style.transform = 'scale(0.9) rotate(-3deg)';
      const totalDelay = 600 + words.length * 45 + 200;
      setTimeout(() => {
        animate(stamp, {
          opacity:  [0, 1],
          scale:    [0.9, 1],
          rotate:   ['-3deg', '-1.5deg'],
          duration: 600,
          ease:     createSpring({ stiffness: 200, damping: 12 }).ease,
        });
      }, totalDelay);
    }
  }, [excerpt]);

  return (
    <div ref={sectionRef}>
      <ChapterShell id="disclosure" num="03" label="Disclosure" onActive={onActive}>
        <h2 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.6rem,3.5vw,2.4rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          marginBottom: 'clamp(1rem,2.5vw,1.75rem)',
          maxWidth: '22ch',
        }}>
          The most exposing thing you wrote:
        </h2>

        <div style={{
          position: 'relative',
          paddingLeft: 'clamp(1.5rem,4vw,3rem)',
          marginBottom: 'clamp(0.85rem,2vw,1.5rem)',
          maxWidth: 760,
        }}>
          <svg style={{
            position: 'absolute', left: 0, top: 0,
            width: 4, height: '100%', overflow: 'visible',
          }} preserveAspectRatio="none" viewBox="0 0 4 100">
            <line ref={borderRef}
              x1={2} y1={0} x2={2} y2={100}
              stroke={PALETTE.red} strokeWidth={4}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div ref={wordsRef} style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.55rem, 5vw, 2.1rem)',
            color: PALETTE.ink,
            lineHeight: 1.5,
            fontStyle: 'italic',
            letterSpacing: '-0.012em',
            maxWidth: '60ch',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}>
            <span style={{ marginRight: '0.15em' }}>&ldquo;</span>
            {words.map((word, i) => (
              <span key={i} className="d-word" style={{ display: 'inline', marginRight: '0.32em' }}>
                {word}
              </span>
            ))}
            <span>&rdquo;</span>
          </div>

          <div ref={stampRef} className="disclosure-stamp" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            marginTop: '2rem',
            padding: '0.55rem 0.9rem',
            border: `1.5px solid ${PALETTE.red}`,
            transformOrigin: 'left center',
            maxWidth: '100%',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: PALETTE.red, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: TYPE.mono, fontSize: 'clamp(8px, 2.4vw, 9px)',
              letterSpacing: '0.22em', color: PALETTE.red,
              textTransform: 'uppercase', fontWeight: 700,
            }}>
              Retained in model weights
            </span>
          </div>
        </div>

        {date && (
          <p style={{
            fontFamily: TYPE.mono, fontSize: '11px',
            letterSpacing: '0.2em', color: PALETTE.inkFaint,
            textTransform: 'uppercase', marginBottom: '2.5rem',
          }}>
            — {date}
          </p>
        )}

        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem,1.7vw,1.18rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.78,
          maxWidth: '50ch',
        }}>
          It was processed, classified, and used to weight a model.
          OpenAI's April 2026 Privacy Policy contains an explicit carve-out:
          data already used in model training is exempt from the right to deletion.
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
          marginTop: '1rem', opacity: 0.6,
        }}>OpenAI Privacy Policy, April 2026 (US) — deletion carve-out</p>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 04 — NETWORK
// SVG constellation — names appear, then paths draw between them.
// ════════════════════════════════════════════════════════════════════════════
function NetworkChapter({ names, onActive }: {
  names: string[];
  onActive: (id: ChapterId) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgRef     = useRef<SVGSVGElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Compute positions for up to 8 names in a constellation
  const displayed = names.slice(0, 8);

  // Mobile: tighter portrait layout (taller viewBox, smaller orbit, larger nodes/text)
  // Desktop: landscape constellation (wide viewBox)
  const cx = isMobile ? 250 : 400;
  const cy = isMobile ? 320 : 250;
  const orbitR = isMobile ? 130 : 170;
  const orbitVar = isMobile ? 22 : 30;
  const labelOffset = isMobile ? 36 : 28;
  const labelOffsetUp = isMobile ? 22 : 16;
  const fontSize = isMobile ? 17 : 13;
  const nodeR = isMobile ? 7 : 5.5;
  const nodeRingR = isMobile ? 14 : 11;
  const viewBox = isMobile ? '0 0 500 640' : '0 0 800 500';
  const aspectRatio = isMobile ? '5 / 6.4' : '8 / 5';

  const positions = displayed.map((_, i) => {
    if (displayed.length === 1) return { x: cx, y: cy };
    const angle = (i / displayed.length) * Math.PI * 2 - Math.PI / 2;
    const r = orbitR + (i % 2) * orbitVar;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  useScrollTrigger(sectionRef, () => {
    const svg = svgRef.current;
    if (!svg) return;

    const nodes = Array.from(svg.querySelectorAll('.n-node'));
    const labels = Array.from(svg.querySelectorAll('.n-label'));
    const lines = Array.from(svg.querySelectorAll('.n-line'));

    nodes.forEach(n => {
      (n as SVGElement).setAttribute('opacity', '0');
      (n as SVGElement).style.transform = 'scale(0)';
      (n as SVGElement).style.transformOrigin = 'center';
              const tn = n as unknown as SVGElement;
        const cxv = tn.getAttribute('data-cx') || '0';
        const cyv = tn.getAttribute('data-cy') || '0';
        tn.style.transformBox = 'fill-box';
        tn.style.transformOrigin = `${cxv}px ${cyv}px`;
    });
    labels.forEach(l => { (l as SVGElement).setAttribute('opacity', '0'); });

    // Lines: draw using createDrawable
    const drawables = lines.flatMap(l => createDrawable(l as SVGGeometryElement));

    // 1. Nodes pop in with spring
    animate(nodes, {
      opacity:  [0, 1],
      scale:    [0, 1],
      delay:    stagger(120),
      ease:     createSpring({ stiffness: 220, damping: 14 }).ease,
      duration: 700,
    });

    // 2. Labels fade in slightly after nodes
    animate(labels, {
      opacity:  [0, 1],
      delay:    stagger(120, { start: 250 }),
      duration: 500,
      ease:     'outQuint',
    });

    // 3. Lines draw between nodes
    if (drawables.length) {
      animate(drawables, {
        draw:     ['0 0', '0 1'],
        delay:    stagger(70, { start: 800, from: 'random' }),
        duration: 900,
        ease:     'outQuart',
      });
    }
  }, [names, isMobile]);

  if (!displayed.length) {
    return (
      <ChapterShell id="network" num="04" label="Network" onActive={onActive}>
        <p style={{ fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.inkMuted, lineHeight: 1.78 }}>
          No named individuals detected in this dataset.
        </p>
      </ChapterShell>
    );
  }

  return (
    <div ref={sectionRef}>
      <ChapterShell id="network" num="04" label="Network" onActive={onActive}>
        <h2 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.6rem,3.5vw,2.4rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          marginBottom: 'clamp(0.85rem,2vw,1.5rem)',
          maxWidth: '22ch',
        }}>
          The {displayed.length} {displayed.length === 1 ? 'person' : 'people'} you named:
        </h2>

        <div style={{
          width: '100%',
          maxWidth: isMobile ? 420 : 720,
          aspectRatio: aspectRatio,
          marginBottom: 'clamp(1rem,2.5vw,1.75rem)',
          marginInline: 'auto',
        }}>
          <svg ref={svgRef} viewBox={viewBox} style={{ width: '100%', height: '100%' }}>
            {/* Connecting lines — fully connected graph for small N */}
            {positions.map((p1, i) =>
              positions.slice(i + 1).map((p2, j) => (
                <line key={`${i}-${j}`} className="n-line"
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="rgba(26,24,20,0.18)"
                  strokeWidth={isMobile ? 1 : 0.75}
                />
              ))
            )}
            {/* Center node */}
            <circle cx={cx} cy={cy} r={isMobile ? 5 : 4} fill={PALETTE.red} opacity={0.6} />
            <circle cx={cx} cy={cy} r={isMobile ? 13 : 10} fill="none" stroke={PALETTE.red} strokeOpacity={0.20} strokeWidth={isMobile ? 1 : 0.75} />

            {/* Name nodes */}
            {positions.map((p, i) => (
              <g key={i}>
                <circle className="n-node"
                  data-cx={p.x} data-cy={p.y}
                  cx={p.x} cy={p.y} r={nodeR}
                  fill={PALETTE.ink}
                />
                <circle className="n-node"
                  data-cx={p.x} data-cy={p.y}
                  cx={p.x} cy={p.y} r={nodeRingR}
                  fill="none"
                  stroke="rgba(26,24,20,0.20)"
                  strokeWidth={isMobile ? 1 : 0.75}
                />
                <text className="n-label"
                  x={p.x}
                  y={p.y + (p.y > cy ? labelOffset : -labelOffsetUp)}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill={PALETTE.ink}
                  fontFamily="EB Garamond, Georgia, serif"
                  fontStyle="italic"
                >
                  {displayed[i]}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem,1.7vw,1.18rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.78,
          maxWidth: '50ch',
        }}>
          These individuals did not consent to being named in a training dataset.
          OpenAI's terms govern only the account holder — not the people
          mentioned in their conversations.
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
          marginTop: '1rem', opacity: 0.6,
        }}>OpenAI Privacy Policy, 2023 — third-party data</p>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 05 — SCORE
// The climax. Big ring draws in, number counts up with spring overshoot.
// ════════════════════════════════════════════════════════════════════════════
const RING_R = 130;
const RING_C = 2 * Math.PI * RING_R;

function ScoreChapter({ score, onActive }: {
  score: number;
  onActive: (id: ChapterId) => void;
}) {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const ringRef      = useRef<SVGCircleElement>(null);
  const numRef       = useRef<HTMLSpanElement>(null);
  const labelRef     = useRef<HTMLSpanElement>(null);
  const ticksRef     = useRef<SVGGElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const color = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;
  const label = score >= 70 ? 'Severe' : score >= 40 ? 'Moderate' : 'Limited';

  useScrollTrigger(sectionRef, () => {
    const ring = ringRef.current;
    const num  = numRef.current;
    const ticks = ticksRef.current;
    if (!ring || !num) return;

    ring.style.strokeDasharray  = `${RING_C}`;
    ring.style.strokeDashoffset = `${RING_C}`;

    // Hide tick marks initially
    if (ticks) {
      Array.from(ticks.children).forEach(t => {
        (t as SVGElement).setAttribute('opacity', '0');
      });
    }

    // Build a timeline: ticks fade in, then ring draws + number counts
    const tl = createTimeline();

    // Ticks fade in
    if (ticks) {
      tl.add(Array.from(ticks.children) as any, {
        opacity:  [0, 1],
        delay:    stagger(8, { from: 'center' }),
        duration: 400,
        ease:     'outQuint',
      });
    }

    // Ring + number with spring
    const obj = { v: 0 };
    tl.add(obj, {
      v: score,
      ease: createSpring({ stiffness: 50, damping: 11 }).ease,
      duration: 2400,
      onUpdate: () => {
        const t = Math.max(0, Math.min(obj.v, 100)) / 100;
        ring.style.strokeDashoffset = `${RING_C * (1 - t)}`;
        if (num) num.textContent = String(Math.round(obj.v));
      },
      onComplete: () => {
        ring.style.strokeDashoffset = `${RING_C * (1 - score / 100)}`;
        if (num) num.textContent = String(score);
      },
    }, 200);

    // Label fades in after
    if (labelRef.current) {
      labelRef.current.style.opacity = '0';
      tl.add(labelRef.current, {
        opacity: [0, 1],
        translateY: [6, 0],
        duration: 600,
        ease: 'outQuint',
      }, '-=300');
    }

    // Particle burst when score settles
    setTimeout(() => {
      const container = particlesRef.current;
      if (!container) return;
      const dots = Array.from(container.children) as HTMLElement[];
      animate(dots, {
        opacity: [0.9, 0],
        translateX: (_el: any, i: number) => {
          const angle = (i / 24) * Math.PI * 2;
          return [0, Math.cos(angle) * (70 + (i % 4) * 22)];
        },
        translateY: (_el: any, i: number) => {
          const angle = (i / 24) * Math.PI * 2;
          return [0, Math.sin(angle) * (70 + (i % 4) * 22)];
        },
        scale: [1, 0],
        delay: stagger(18),
        duration: 750,
        ease: 'outQuart',
      });
    }, 1800);
  }, [score]);

  return (
    <div ref={sectionRef}>
      <ChapterShell id="score" num="05" label="Score" onActive={onActive}>
        <h2 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.6rem,3.5vw,2.4rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          marginBottom: 'clamp(1rem,2.5vw,1.75rem)',
          maxWidth: '22ch',
        }}>
          Combined into a single value:
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'clamp(1rem,2vw,1.5rem)',
        }}>
          <div style={{
            position: 'relative',
            width: 'min(60vw, clamp(200px, 32vw, 320px))',
            aspectRatio: '1',
          }}>
            <svg viewBox="0 0 360 360" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Bezel ticks */}
              <g ref={ticksRef}>
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i / 60) * 360 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const isMaj = i % 15 === 0;
                  const isMin = i % 5 === 0;
                  const r0 = RING_R + (isMaj ? 14 : isMin ? 16 : 17);
                  const r1 = RING_R + (isMaj ? 26 : isMin ? 22 : 19);
                  return (
                    <line key={i}
                      x1={180 + Math.cos(rad) * r0} y1={180 + Math.sin(rad) * r0}
                      x2={180 + Math.cos(rad) * r1} y2={180 + Math.sin(rad) * r1}
                      stroke={`rgba(26,24,20,${isMaj ? 0.30 : isMin ? 0.14 : 0.06})`}
                      strokeWidth={isMaj ? 1.8 : 0.85}
                    />
                  );
                })}
              </g>

              {/* Concentric depth */}
              {[80, 100, 120].map((r, i) => (
                <circle key={r} cx={180} cy={180} r={r}
                  fill="none"
                  stroke={`rgba(26,24,20,${[0.04, 0.03, 0.025][i]})`}
                  strokeWidth={0.5}
                />
              ))}

              {/* Background track */}
              <circle cx={180} cy={180} r={RING_R}
                fill="none" stroke="rgba(26,24,20,0.10)" strokeWidth={6}
              />

              {/* Animated arc */}
              <circle ref={ringRef}
                cx={180} cy={180} r={RING_R}
                fill="none" stroke={color} strokeWidth={6}
                strokeLinecap="round"
                transform="rotate(-90 180 180)"
              />

              {/* Cardinal labels */}
              {[{v:'0',a:-90},{v:'25',a:0},{v:'50',a:90},{v:'75',a:180}].map(({v,a}) => {
                const rad = (a * Math.PI) / 180;
                const lr = RING_R + 38;
                return (
                  <text key={v}
                    x={180 + Math.cos(rad) * lr}
                    y={180 + Math.sin(rad) * lr + 4}
                    textAnchor="middle" fontSize="9" letterSpacing="0.06em"
                    fill="rgba(26,24,20,0.22)"
                    fontFamily="'Courier Prime', monospace"
                  >{v}</text>
                );
              })}

              {/* Centre crosshair */}
              <line x1={172} y1={180} x2={188} y2={180} stroke="rgba(26,24,20,0.12)" strokeWidth={0.85} />
              <line x1={180} y1={172} x2={180} y2={188} stroke="rgba(26,24,20,0.12)" strokeWidth={0.85} />
              <circle cx={180} cy={180} r={2} fill="rgba(190,40,30,0.50)" />
              <circle cx={180} cy={180} r={8} fill="none" stroke="rgba(190,40,30,0.14)" strokeWidth={0.85} />
            </svg>

            {/* Centre readout */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            }}>
              <span ref={numRef} style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(4.5rem, 9vw, 6.5rem)',
                fontWeight: 400, color,
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>0</span>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '9px',
                letterSpacing: '0.24em', color: PALETTE.inkFaint,
                textTransform: 'uppercase',
              }}>/ 100</span>
              <span ref={labelRef} style={{
                fontFamily: TYPE.mono, fontSize: '10px',
                letterSpacing: '0.24em', color, textTransform: 'uppercase',
                marginTop: '0.4rem',
              }}>{label}</span>
            </div>

            {/* Particle burst */}
            <div ref={particlesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  width: i % 3 === 0 ? 7 : i % 3 === 1 ? 5 : 3,
                  height: i % 3 === 0 ? 7 : i % 3 === 1 ? 5 : 3,
                  borderRadius: '50%',
                  background: color,
                  opacity: 0,
                  transform: 'translate(-50%, -50%)',
                }} />
              ))}
            </div>
          </div>
        </div>

        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem,1.7vw,1.18rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.78,
          maxWidth: '50ch',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          A composite measure of the personal information recoverable
          from your conversation history — derived from what OpenAI's
          systems were permitted to collect, retain, and learn from.
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
          marginTop: '1rem', opacity: 0.6,
          textAlign: 'center',
        }}>Based on OpenAI Privacy Policy categories, June 2023 — April 2026</p>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 06 — PERMANENCE
// The gut-punch. A massive RETAINED watermark fades in. A seal SVG draws.
// ════════════════════════════════════════════════════════════════════════════
function PermanenceChapter({ onActive }: { onActive: (id: ChapterId) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wmRef      = useRef<HTMLDivElement>(null);
  const sealRef    = useRef<SVGCircleElement>(null);
  const sealInnerRef = useRef<SVGCircleElement>(null);
  const sealTextRef = useRef<SVGGElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useScrollTrigger(sectionRef, () => {
    // Watermark fades in slowly
    const wm = wmRef.current;
    if (wm) {
      wm.style.opacity = '0';
      animate(wm, {
        opacity: [0, 1],
        duration: 2400,
        ease: 'outQuart',
        delay: 200,
      });
    }

    // Seal: outer + inner circles draw, then text rotates in
    const seal = sealRef.current;
    const sealInner = sealInnerRef.current;
    const sealText = sealTextRef.current;
    if (seal && sealInner) {
      const drawables = [...createDrawable(seal), ...createDrawable(sealInner)];
      animate(drawables, {
        draw: ['0 0', '0 1'],
        duration: 1400,
        delay: stagger(150, { start: 400 }),
        ease: 'outQuart',
      });
    }
    if (sealText) {
      sealText.style.opacity = '0';
      sealText.style.transformOrigin = 'center';
      animate(sealText, {
        opacity: [0, 1],
        rotate: ['-12deg', '0deg'],
        duration: 800,
        ease: createSpring({ stiffness: 150, damping: 15 }).ease,
        delay: 1400,
      });
    }

    // Headline reveals after
    const h = headlineRef.current;
    if (h) {
      const wEls = Array.from(h.querySelectorAll('.p-word'));
      wEls.forEach(w => { (w as HTMLElement).style.opacity = '0'; });
      animate(wEls, {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: stagger(80, { start: 700 }),
        duration: 700,
        ease: 'outQuint',
      });
    }
  });

  const headline = 'None of this can be retracted.';
  const words = headline.split(' ');

  return (
    <div ref={sectionRef}>
      <ChapterShell id="permanence" num="06" label="Permanence" onActive={onActive}>
        <div style={{ position: 'relative', minHeight: 'clamp(360px, 56vh, 520px)' }}>
          {/* RETAINED massive watermark */}
          <div ref={wmRef} className="permanence-watermark" style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
          }}>
            <span style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(5rem, 22vw, 16rem)',
              fontWeight: 400,
              color: 'rgba(190,40,30,0.07)',
              letterSpacing: '-0.05em',
              lineHeight: 1,
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}>
              RETAINED
            </span>
          </div>

          {/* Seal in upper right */}
          <div className="permanence-seal" style={{
            position: 'absolute',
            top: 'clamp(0.5rem, 2vw, 1.5rem)',
            right: 'clamp(1rem, 4vw, 3rem)',
            width: 'clamp(110px, 18vw, 180px)',
            aspectRatio: '1',
            zIndex: 1,
          }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <circle ref={sealRef}
                cx={100} cy={100} r={96}
                fill="none" stroke={PALETTE.red} strokeWidth={1.5}
              />
              <circle ref={sealInnerRef}
                cx={100} cy={100} r={84}
                fill="none" stroke={PALETTE.red} strokeWidth={0.75}
              />
              <g ref={sealTextRef}>
                <defs>
                  <path id="seal-circle" d="M 100,100 m -72,0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0" />
                </defs>
                <text fontFamily="'Courier Prime', monospace" fontSize="11" fill={PALETTE.red} letterSpacing="4">
                  <textPath href="#seal-circle" startOffset="0">
                    NON-RETRACTABLE · MODEL WEIGHT INSTANCE · RETAINED ·
                  </textPath>
                </text>
                <text x={100} y={94} textAnchor="middle"
                  fontFamily="'Courier Prime', monospace" fontSize="9" letterSpacing="3"
                  fill={PALETTE.red}>
                  PERMANENT
                </text>
                <text x={100} y={110} textAnchor="middle"
                  fontFamily="EB Garamond, Georgia, serif" fontSize="14" fontStyle="italic"
                  fill={PALETTE.red}>
                  Record
                </text>
                <text x={100} y={126} textAnchor="middle"
                  fontFamily="'Courier Prime', monospace" fontSize="9" letterSpacing="3"
                  fill={PALETTE.red}>
                  CLOSED
                </text>
              </g>
            </svg>
          </div>

          {/* Foreground content */}
          <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(2rem, 5vw, 4rem) 0' }}>
            <h2 ref={headlineRef} style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(2rem,5vw,3rem)',
              fontWeight: 400, color: PALETTE.ink,
              letterSpacing: '-0.035em', lineHeight: 1.04,
              marginBottom: 'clamp(0.85rem,2vw,1.5rem)',
              maxWidth: '14ch',
            }}>
              {words.map((w, i) => (
                <span key={i} className="p-word" style={{
                  display: 'inline-block',
                  marginRight: '0.25em',
                  color: w === 'retracted.' ? PALETTE.red : PALETTE.ink,
                }}>{w}</span>
              ))}
            </h2>

            <p style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1.05rem,1.85vw,1.3rem)',
              color: PALETTE.inkMuted,
              lineHeight: 1.78,
              maxWidth: '46ch',
            }}>
              OpenAI's April 2026 Privacy Policy explicitly exempts training data
              from the right to deletion. Deleting your account removes your data
              from OpenAI's servers. It does not remove your contribution from the
              model's weights. Those are different operations — and only one of
              them is covered by the terms you accepted.
            </p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
              marginTop: '1rem',
            }}>OpenAI Privacy Policy, April 2026 · Cooper et al., 2024 (machine unlearning)</p>
          </div>
        </div>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 07 — CONTINUE
// ════════════════════════════════════════════════════════════════════════════
function ContinueChapter({ setPage }: { setPage: (p: DashPage) => void }) {
  return (
    <div style={{
      maxWidth: 880,
      margin: '0 auto',
      width: '100%',
      padding: '0 clamp(1.25rem,6vw,5rem)',
      boxSizing: 'border-box',
    }}>
      <PageFooter
        statement="This is not your identity. This is a commercial reconstruction of your identity — assembled without your knowledge, retained without your meaningful consent, and irrecoverable once embedded in a trained model."
        followOn="The difference between the two is what makes it valuable."
        endLabel="End of Act I."
        setPage={setPage}
        navItems={[
          { page: 'profile', act: 'Act II / 03', label: 'What you are worth', body: 'The commercial valuation of this profile — segments, pricing, and market position.' },
          { page: 'risk',    act: 'Act II / 04', label: 'What it enables',    body: 'The scenarios that become possible once this record exists.' },
          { page: 'terms',   act: 'Act III / 05', label: 'Why it persists',   body: 'Why this profile cannot be removed — even if you delete your account.' },
        ]}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════════
export default function OverviewPage({ results, sources, setPage }: {
  results: any;
  sources: any[];
  setPage: (p: DashPage) => void;
}) {
  const [active, setActive] = useState<ChapterId>('arrival');
  const handleActive = useCallback((id: ChapterId) => setActive(id), []);

  // Snap scroll — on while overview is mounted, removed on unmount
  useEffect(() => {
    document.documentElement.style.scrollSnapType = 'y mandatory';
    return () => { document.documentElement.style.scrollSnapType = ''; };
  }, []);

  // ── Derive content from results ─────────────────────────────────────────
  const score        = results?.privacyScore ?? 0;
  const messageCount = results?.totalUserMessages || results?.rawStats?.userMessages || 0;
  const days         = results?.timespan?.days || 0;
  const primaryName  = results?.findings?.personalInfo?.names?.[0]?.name || null;
  const namesAll     = (results?.findings?.personalInfo?.names || []).map((n: any) => n.name);
  const hourDist: number[] = results?.hourDistribution || Array(24).fill(0);
  const dayHourMatrix: number[][] = results?.dayHourMatrix || Array.from({ length: 7 }, () => Array(24).fill(0));

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Build inference list — prefer synthesis demographicPredictions, fall back to portrait
  let inferences: { attribute: string; value: string; confidence: number }[] = [];
  const synth = results?.synthesis;
  const portrait = results?.psychologicalPortrait;

  if (synth?.demographicPredictions?.length) {
    inferences = synth.demographicPredictions.slice(0, 4).map((d: any) => ({
      attribute:  d.attribute || 'Attribute',
      value:      d.value || '—',
      confidence: typeof d.confidence === 'number' ? d.confidence : 0.7,
    }));
  } else if (portrait) {
    const p = portrait;
    const candidates = [
      p.emotionalBaselineLabel && { attribute: 'Emotional baseline', value: p.emotionalBaselineLabel, confidence: 0.82 },
      p.writingVoice && { attribute: 'Writing voice', value: p.writingVoice, confidence: 0.78 },
      p.communicationPattern && { attribute: 'Communication pattern', value: p.communicationPattern, confidence: 0.75 },
      p.primaryCopingMechanism && { attribute: 'Primary coping', value: p.primaryCopingMechanism, confidence: 0.71 },
      p.dominantNarrative && { attribute: 'Dominant narrative', value: p.dominantNarrative, confidence: 0.68 },
      p.relationshipDynamics && { attribute: 'Relationship dynamics', value: p.relationshipDynamics, confidence: 0.66 },
    ].filter(Boolean) as any[];
    inferences = candidates.slice(0, 4);
  }

  // Disclosure excerpt
  const moment = results?.juiciestMoments?.[0];
  const excerpt = moment?.excerpt
    ? moment.excerpt.substring(0, 240).trim() + (moment.excerpt.length > 240 ? '…' : '')
    : null;
  const excerptDate = moment?.timestamp
    ? new Date(moment.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // ── Determine which chapters are visible ─────────────────────────────────
  const visibleChapters: ChapterId[] = [
    'arrival',
    ...(messageCount > 0 ? ['volume' as ChapterId] : []),
    ...(inferences.length > 0 ? ['inference' as ChapterId] : []),
    ...(excerpt ? ['disclosure' as ChapterId] : []),
    ...(namesAll.length > 0 ? ['network' as ChapterId] : []),
    'score',
    'permanence',
  ];

  const connected = sources.filter((s: any) => s.connected).length;
  const pad       = 'clamp(2rem,6vw,5rem)';

  return (
    <>
      <style>{`
        /* Chapter shell uses dvh so iOS Safari URL bar collapse doesn't break layout */
        .chapter-shell {
          min-height: 100vh;
          min-height: 100dvh;
        }
        @media (max-width: 768px) {
          .ov-right-rail { display: none !important; }
        }
        .chapter-snap { scroll-snap-align: start; }

        /* Bottom chapter indicator — sits above home indicator on iOS */
        .ov-chapter-dots {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }

        /* Volume chapter — phone-portrait grid (denser, taller) */
        @media (max-width: 640px) {
          .v-grid {
            grid-template-columns: repeat(14, 1fr) !important;
            gap: 5px !important;
            max-width: 100% !important;
          }
          /* Hide ghost chapter number on smaller screens to free up space */
          .chapter-ghost-num { font-size: clamp(10rem, 36vw, 18rem) !important; }

          /* Permanence chapter — keep seal small + tucked, watermark dominates */
          .permanence-seal {
            width: clamp(86px, 22vw, 120px) !important;
            top: 0 !important;
            right: 0 !important;
          }

          /* Continue chapter — primary CTA full width, secondary stacks */
          .continue-cta-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.75rem !important;
          }
          .continue-cta-primary {
            width: 100% !important;
            font-size: 1.05rem !important;
          }
        }
        @media (max-width: 480px) {
          .v-grid {
            grid-template-columns: repeat(12, 1fr) !important;
            gap: 4px !important;
          }
          .chapter-ghost-num { display: none !important; }
        }
      `}</style>

      <RightRail active={active} visible={visibleChapters} />
      <ChapterDots active={active} chapters={CHAPTERS.filter(c => visibleChapters.includes(c.id))} />

      {/* Source banner */}
      {connected < sources.length && (
        <div style={{
          padding: `0.85rem ${pad}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '1.5rem',
          borderBottom: `1px solid ${PALETTE.border}`,
          flexWrap: 'wrap',
          maxWidth: 1200, margin: '0 auto',
        }}>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '11px',
            letterSpacing: '0.12em', color: PALETTE.inkFaint,
            textTransform: 'uppercase',
          }}>
            Analysis based on ChatGPT export only
          </p>
          <button onClick={() => setPage('sources')}
            style={{
              fontFamily: TYPE.mono, fontSize: '11px',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: PALETTE.inkMuted, background: 'none',
              border: `1px solid ${PALETTE.border}`,
              padding: '0.4rem 0.8rem', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Add more sources →
          </button>
        </div>
      )}

      {/* Chapters */}
      <main>
        <ArrivalChapter name={primaryName} date={today} onActive={handleActive} />
        {messageCount > 0 && <VolumeChapter count={messageCount} days={days} dayHourMatrix={dayHourMatrix} onActive={handleActive} />}
        {inferences.length > 0 && <InferenceChapter inferences={inferences} onActive={handleActive} />}
        {excerpt && <DisclosureChapter excerpt={excerpt} date={excerptDate} onActive={handleActive} />}
        {namesAll.length > 0 && <NetworkChapter names={namesAll} onActive={handleActive} />}
        <ScoreChapter score={score} onActive={handleActive} />
        <PermanenceChapter onActive={handleActive} />
        <ContinueChapter setPage={setPage} />
      </main>

    </>
  );
}
