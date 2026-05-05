'use client';

// ============================================================================
// OVERVIEW PAGE - Act I: The Record
// ============================================================================
// Architecture: full-viewport snap scroll. Each chapter is a true 100dvh
// section. The nav is 56px fixed - only the arrival chapter offsets for it
// (paddingTop). All other chapters use justifyContent:center so content sits
// in the true visual middle of the screen, not pushed to the top.
//
// Seven chapters:
//   00 ARRIVAL    - title, thread sentence, scroll cue
//   01 VOLUME     - message count + day-of-week bar chart
//   02 INFERENCE  - tap-to-reveal attribute cards
//   03 DISCLOSURE - most exposing excerpt with animated border
//   04 NETWORK    - named people constellation
//   05 SCORE      - the climax gauge ring
//   06 PERMANENCE - RETAINED watermark + seal
//   07 CONTINUE   - act footer / navigation onward
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  animate,
  stagger,
  createDrawable,
  createSpring,
  createTimeline,
} from 'animejs';
import {
  PALETTE,
  TYPE,
  type DashPage,
  ActLabel,
  PageFooter,
} from '../../shared/layout/DashboardLayout';

// ── Constants ────────────────────────────────────────────────────────────────
const NAV_H = 56; // px - must match DashboardLayout nav height

const CHAPTERS = [
  { id: 'arrival',    label: 'Arrival'    },
  { id: 'volume',     label: 'Volume'     },
  { id: 'inference',  label: 'Inference'  },
  { id: 'disclosure', label: 'Disclosure' },
  { id: 'network',    label: 'Network'    },
  { id: 'score',      label: 'Score'      },
  { id: 'permanence', label: 'Permanence' },
  { id: 'continue',   label: 'Continue'   },
] as const;
type ChapterId = typeof CHAPTERS[number]['id'];

const fmt = (n: number | null | undefined) =>
  typeof n === 'number' ? n.toLocaleString('en-GB') : '-';

// ── Scroll trigger hook ──────────────────────────────────────────────────────
function useScrollTrigger(
  ref: React.RefObject<HTMLElement | null>,
  fn: () => void,
  deps: any[] = []
) {
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    fired.current = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          fn();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER SHELL
// Each chapter fills exactly the viewport. Content is centred vertically.
// The first chapter (arrival) offsets for the fixed nav.
// ════════════════════════════════════════════════════════════════════════════
function ChapterShell({
  id, num, label, children, onActive, isFirst = false, hideLabel = false,
}: {
  id: ChapterId;
  num?: string;
  label: string;
  children: React.ReactNode;
  onActive: (id: ChapterId) => void;
  isFirst?: boolean;
  hideLabel?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onActive(id);
        setIsActive(entry.isIntersecting);
      },
      { rootMargin: '-35% 0px -35% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, onActive]);

  return (
    <section
      ref={ref}
      id={`chapter-${id}`}
      className="chapter-snap"
      style={{
        height: 'calc(100dvh - 64px)',
        paddingTop:    isFirst ? 'clamp(3.5rem, 7vh, 5rem)' : '0',
        paddingBottom: '2rem',
        paddingLeft:   'clamp(1.5rem, 7vw, 6rem)',
        paddingRight:  'clamp(1.5rem, 7vw, 6rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isFirst ? 'flex-start' : 'center',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Ghost chapter number */}
      {num && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-0.04em',
            top: '50%',
            transform: `translateY(-50%) scale(${isActive ? 1 : 0.94})`,
            fontFamily: TYPE.serif,
            fontSize: 'clamp(10rem, 28vw, 22rem)',
            fontWeight: 400,
            color: `rgba(26,24,20,${isActive ? 0.038 : 0.006})`,
            lineHeight: 1,
            letterSpacing: '-0.05em',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'color 1.4s ease, transform 1.6s cubic-bezier(0.25,0.1,0.25,1)',
          }}
        >
          {num}
        </div>
      )}

      {/* Inner - max-width container, centred */}
      <div style={{ maxWidth: 860, width: '100%', position: 'relative', zIndex: 1, margin: '0 auto' }}>
        {/* Chapter label row */}
        {(num || label) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: 'clamp(1rem, 2vw, 1.75rem)',
              opacity: hideLabel ? 0 : isActive ? 1 : 0.2,
              transform: `translateX(${isActive ? 0 : -8}px)`,
              transition: 'opacity 0.9s ease, transform 1s cubic-bezier(0.25,0.1,0.25,1)',
              pointerEvents: hideLabel ? 'none' : 'auto',
            }}
          >
            {num && (
              <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.32em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
                {num}
              </span>
            )}
            {num && <span style={{ flex: '0 0 48px', height: 1, background: PALETTE.border }} />}
            <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.32em', color: PALETTE.ink, textTransform: 'uppercase' }}>
              {label}
            </span>
          </div>
        )}

        {children}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RIGHT RAIL - fixed chapter index (desktop only)
// ════════════════════════════════════════════════════════════════════════════
function RightRail({ active, visible }: { active: ChapterId; visible: ChapterId[] }) {
  return (
    <div
      className="ov-right-rail"
      style={{
        position: 'fixed', right: 'clamp(1rem, 2.5vw, 2rem)', top: '50%',
        transform: 'translateY(-50%)', zIndex: 40,
        display: 'flex', flexDirection: 'column', gap: '16px', pointerEvents: 'none',
      }}
    >
      {CHAPTERS.filter(c => visible.includes(c.id)).map(c => {
        const isActive = c.id === active;
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isActive ? 1 : 0.2, transition: 'opacity 0.6s' }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.3em', color: isActive ? PALETTE.ink : PALETTE.inkFaint, textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: isActive ? '72px' : '40px', textAlign: 'center', transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1), color 0.4s', overflow: 'hidden' }}>
              {c.label}
            </span>
            <div style={{ width: isActive ? '2px' : '1px', height: isActive ? '56px' : '6px', background: isActive ? PALETTE.red : PALETTE.border, transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER DOTS - bottom progress indicator
// ════════════════════════════════════════════════════════════════════════════
function ChapterDots({ active, chapters }: { active: ChapterId; chapters: typeof CHAPTERS[number][] }) {
  const handleJump = (id: ChapterId) => {
    document.getElementById(`chapter-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div
      className="ov-chapter-dots"
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))', paddingTop: '0.5rem',
      }}
    >
      <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.28em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
        {chapters.find(c => c.id === active)?.label ?? ''}
      </span>
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', pointerEvents: 'auto' }}>
        {chapters.map(c => {
          const isActive = c.id === active;
          return (
            <button key={c.id} onClick={() => handleJump(c.id)} aria-label={`Jump to ${c.label}`} className="inline-tight" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px 4px', display: 'flex', alignItems: 'center' }}>
              <span style={{ display: 'block', height: 4, width: isActive ? 20 : 4, borderRadius: 2, background: isActive ? PALETTE.ink : 'rgba(26,24,20,0.18)', transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1), background 0.3s' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 00 - ARRIVAL
// ════════════════════════════════════════════════════════════════════════════
// Pulse rings - three concentric circles that breathe outward
function PulseRings() {
  return (
    <div style={{ position: 'absolute', right: 'clamp(-2rem, 5vw, 4rem)', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 0 }}>
      <svg width="340" height="340" viewBox="0 0 340 340" style={{ overflow: 'visible', opacity: 0.18 }}>
        {[60, 110, 160].map((r, i) => (
          <motion.circle
            key={r}
            cx={170} cy={170} r={r}
            fill="none"
            stroke={PALETTE.ink}
            strokeWidth={i === 0 ? 1 : 0.5}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [0.85, 1.08, 0.85], opacity: [0, 0.9, 0] }}
            transition={{ duration: 4 + i * 1.2, delay: i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '170px 170px' }}
          />
        ))}
        {/* Cross-hairs */}
        <line x1={170} y1={100} x2={170} y2={240} stroke={PALETTE.ink} strokeWidth={0.4} opacity={0.4} />
        <line x1={100} y1={170} x2={240} y2={170} stroke={PALETTE.ink} strokeWidth={0.4} opacity={0.4} />
        <circle cx={170} cy={170} r={3} fill={PALETTE.red} opacity={0.7} />
        {/* Data tick marks around outer ring */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const isMaj = i % 6 === 0;
          const r0 = 155; const r1 = isMaj ? 168 : 163;
          return (
            <line key={i}
              x1={170 + Math.cos(angle) * r0} y1={170 + Math.sin(angle) * r0}
              x2={170 + Math.cos(angle) * r1} y2={170 + Math.sin(angle) * r1}
              stroke={PALETTE.ink} strokeWidth={isMaj ? 1 : 0.5} opacity={0.5}
            />
          );
        })}
      </svg>
    </div>
  );
}

function ArrivalChapter({ date, onActive, setPage }: {
  date: string;
  onActive: (id: ChapterId) => void;
  setPage: (p: DashPage) => void;
}) {
  // Character-by-character reveal on the main heading
  const line1 = 'The Record';
  const line2 = 'of You.';

  return (
    <ChapterShell id="arrival" label="File 01" hideLabel onActive={onActive} isFirst>
      {/* Background pulse rings */}
      <PulseRings />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }} style={{ marginBottom: 'clamp(0.5rem, 1vw, 0.85rem)', position: 'relative', zIndex: 1 }}>
        <ActLabel roman="I" title="The Record" pageLabel="01 / Overview" />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }} style={{ borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1.25rem', marginBottom: 'clamp(1rem, 2vw, 1.5rem)', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.9rem, 1.3vw, 1rem)', color: PALETTE.inkMuted, lineHeight: 1.72, maxWidth: 480, fontStyle: 'italic' }}>
          You agreed to terms that permitted this. What follows is what those terms made possible.
        </p>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.32em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)', position: 'relative', zIndex: 1 }}>
        Compiled · {date}
      </motion.p>

      {/* Main heading - chars stagger in */}
      <h1 className="arrival-heading" style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3.5rem, 11vw, 7.5rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 'clamp(1rem, 2vw, 1.5rem)', position: 'relative', zIndex: 1 }}>
        <span style={{ display: 'block' }}>
          {line1.split('').map((ch, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 + i * 0.04, ease: [0.2, 0, 0.2, 1] }} style={{ display: 'inline-block', whiteSpace: ch === ' ' ? 'pre' : 'normal' }}>
              {ch}
            </motion.span>
          ))}
        </span>
        <span style={{ display: 'block' }}>
          {line2.split('').map((ch, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 + (line1.length + i) * 0.04, ease: [0.2, 0, 0.2, 1] }} style={{ display: 'inline-block', whiteSpace: ch === ' ' ? 'pre' : 'normal' }}>
              {ch}
            </motion.span>
          ))}
        </span>
      </h1>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.25 }} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.5vw, 1.08rem)', color: PALETTE.inkMuted, lineHeight: 1.72, maxWidth: '44ch', marginBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)', position: 'relative', zIndex: 1 }}>
        What follows was inferred from your conversations.
        Each item is effectively persistent. Most of it cannot currently be returned.
      </motion.p>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.5 }} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.82rem, 1.1vw, 0.9rem)', color: PALETTE.inkFaint, lineHeight: 1.7, maxWidth: '44ch', marginBottom: 'clamp(0.85rem, 1.75vw, 1.5rem)', position: 'relative', zIndex: 1 }}>
        Consent mechanisms were designed for reversible data. AI training is not reversible.
        What follows is what that gap made possible.
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.75 }} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, opacity: 0.6 }}>
          This is a work of critical design.{' '}
          <span onClick={() => setPage('method')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
            A note on method →
          </span>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 28, height: 1, background: PALETTE.ink }} />
          <motion.span animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
            Scroll to begin
          </motion.span>
        </div>
      </motion.div>
    </ChapterShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 01 - VOLUME
// ════════════════════════════════════════════════════════════════════════════
function VolumeChapter({ count, days, dayHourMatrix, onActive }: {
  count: number; days: number; dayHourMatrix: number[][]; onActive: (id: ChapterId) => void;
}) {
  const numRef     = useRef<HTMLSpanElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const barRefs    = useRef<HTMLDivElement[]>([]);
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals  = dayHourMatrix.map(row => row.reduce((s, v) => s + v, 0));
  const maxDay     = Math.max(...dayTotals, 1);
  const peakDay    = dayTotals.indexOf(maxDay);

  useScrollTrigger(sectionRef as any, () => {
    const num = numRef.current;
    if (num) {
      const obj = { v: 0 };
      animate(obj, { v: count, ease: createSpring({ stiffness: 60, damping: 14 }).ease, duration: 2000, onUpdate: () => { num.textContent = fmt(Math.round(obj.v)); } });
    }
    barRefs.current.filter(Boolean).forEach((el, i) => {
      el.style.width = '0%';
      setTimeout(() => {
        animate(el, { width: [`0%`, `${Math.max(2, (dayTotals[i] / maxDay) * 100)}%`], duration: 800, ease: createSpring({ stiffness: 120, damping: 18 }).ease });
      }, 80 + i * 55);
    });
  }, [count, JSON.stringify(dayTotals)]);

  return (
    <div ref={sectionRef}>
      <ChapterShell id="volume" num="01" label="Volume" onActive={onActive}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
          <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3.5rem, 9vw, 5.5rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.05em', lineHeight: 0.92, margin: 0 }}>
            <span ref={numRef}>0</span>
          </h2>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, fontStyle: 'italic', lineHeight: 1.3, margin: 0 }}>
            messages{days > 0 ? `, across ${days} days` : ''}.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 580, marginBottom: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
          {DAY_LABELS.map((label, d) => {
            const val = dayTotals[d]; const isPeak = d === peakDay;
            return (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: isPeak ? PALETTE.ink : PALETTE.inkFaint, textTransform: 'uppercase', width: '28px', flexShrink: 0, fontWeight: isPeak ? 700 : 400 }}>{label}</span>
                <div style={{ flex: 1, height: isPeak ? 10 : 6, background: 'rgba(26,24,20,0.07)', position: 'relative', borderRadius: '1px' }}>
                  <div ref={el => { if (el) barRefs.current[d] = el; }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '0%', background: isPeak ? PALETTE.red : val > 0 ? 'rgba(26,24,20,0.45)' : 'transparent', borderRadius: '1px' }} />
                </div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.1em', color: isPeak ? PALETTE.red : val > 0 ? PALETTE.inkFaint : 'rgba(26,24,20,0.18)', width: '18px', textAlign: 'right', flexShrink: 0 }}>{val > 0 ? val : '-'}</span>
              </div>
            );
          })}
        </div>

        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: '46ch', marginBottom: '0.4rem' }}>
          Each one a record of unknown persistence.{' '}
          <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecorationColor: 'rgba(26,24,20,0.35)' }}>
            OpenAI's Privacy Policy
          </a>{' '}
          permits use of conversation content to improve its models - no public version specifies which conversations may have been used, or when.
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', opacity: 0.6 }}>
          OpenAI Privacy Policy, June 2023 - April 2026
        </p>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 02 - INFERENCE
// ════════════════════════════════════════════════════════════════════════════
function InferenceCard({ inf, index, revealed, onReveal }: {
  inf: { attribute: string; value: string; confidence: number };
  index: number; revealed: boolean; onReveal: (i: number) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef  = useRef<HTMLDivElement>(null);
  const confRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!revealed) return;
    const card = cardRef.current; const bar = barRef.current;
    if (!card || !bar) return;
    animate(card, { scale: [0.96, 1], opacity: [0.6, 1], rotate: ['-1.5deg', '0deg'], duration: 500, ease: createSpring({ stiffness: 220, damping: 14 }).ease });
    bar.style.transform = 'scaleX(0)';
    animate(bar, { scaleX: [0, 1], duration: 700, ease: 'outQuart', delay: 80 });
    if (confRef.current) {
      const obj = { v: 0 };
      setTimeout(() => { animate(obj, { v: inf.confidence, duration: 700, ease: 'outQuart', onUpdate: () => { if (confRef.current) confRef.current.textContent = obj.v.toFixed(2); } }); }, 120);
    }
  }, [revealed, inf.confidence]);

  return (
    <div
      ref={cardRef}
      onClick={() => !revealed && onReveal(index)}
      style={{ border: `1px solid ${revealed ? PALETTE.border : 'rgba(26,24,20,0.10)'}`, padding: 'clamp(1rem, 2vw, 1.3rem)', background: revealed ? PALETTE.bgPanel : 'rgba(26,24,20,0.02)', cursor: revealed ? 'default' : 'pointer', transformOrigin: 'center', transition: 'background 0.3s, border-color 0.3s', minHeight: '5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      onMouseEnter={e => { if (!revealed) (e.currentTarget as HTMLDivElement).style.background = 'rgba(26,24,20,0.05)'; }}
      onMouseLeave={e => { if (!revealed) (e.currentTarget as HTMLDivElement).style.background = 'rgba(26,24,20,0.02)'; }}
    >
      {!revealed ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{inf.attribute}</span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', opacity: 0.7 }}>tap to reveal →</span>
        </div>
      ) : (
        <>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{inf.attribute}</p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.ink, letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: '0.85rem' }}>{inf.value}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,24,20,0.10)', position: 'relative' }}>
              <div ref={barRef} style={{ position: 'absolute', inset: 0, background: PALETTE.red, transformOrigin: 'left center', width: `${Math.max(8, Math.min(100, inf.confidence * 100))}%` }} />
            </div>
            <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em', color: PALETTE.inkFaint }}><span ref={confRef}>0.00</span></span>
          </div>
        </>
      )}
    </div>
  );
}

function InferenceChapter({ inferences, onActive }: {
  inferences: { attribute: string; value: string; confidence: number }[]; onActive: (id: ChapterId) => void;
}) {
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const capped = inferences.slice(0, 4);
  useEffect(() => { setRevealed(Array(capped.length).fill(false)); }, [capped.length]);
  const allRevealed = revealed.every(Boolean) && revealed.length > 0;

  return (
    <ChapterShell id="inference" num="02" label="Inference" onActive={onActive}>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.4rem', maxWidth: '22ch' }}>
        From these messages, the model learned:
      </h2>
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: 'clamp(0.85rem, 1.5vw, 1.25rem)', opacity: allRevealed ? 0 : 1, transition: 'opacity 0.6s' }}>
        {revealed.filter(Boolean).length} of {capped.length} revealed
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 'clamp(0.5rem, 1.2vw, 0.85rem)', marginBottom: 'clamp(1rem, 2vw, 1.5rem)' }}>
        {capped.map((inf, i) => (
          <InferenceCard key={i} inf={inf} index={i} revealed={revealed[i] ?? false} onReveal={i => setRevealed(prev => prev.map((v, idx) => idx === i ? true : v))} />
        ))}
      </div>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: '50ch', opacity: allRevealed ? 1 : 0.3, transition: 'opacity 0.8s ease', marginBottom: '0.4rem' }}>
        None of these attributes were stated. All were inferred.{' '}
        <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecorationColor: 'rgba(26,24,20,0.35)' }}>
          OpenAI's terms
        </a>{' '}
        permit use of conversation content to improve its models - but say nothing about what is inferred in the process, or what that inference produces.
      </p>
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', opacity: 0.6 }}>
        OpenAI Terms of Service, 2023 · OpenAI Privacy Policy, 2026
      </p>
    </ChapterShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 03 - DISCLOSURE
// ════════════════════════════════════════════════════════════════════════════
function DisclosureChapter({ excerpt, date, onActive }: {
  excerpt: string; date: string | null; onActive: (id: ChapterId) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const borderRef  = useRef<SVGLineElement>(null);
  const wordsRef   = useRef<HTMLDivElement>(null);
  const stampRef   = useRef<HTMLDivElement>(null);
  const words      = excerpt.split(' ');

  useScrollTrigger(sectionRef as any, () => {
    if (borderRef.current) {
      const drawables = createDrawable(borderRef.current);
      if (drawables.length) animate(drawables, { draw: ['0 0', '0 1'], duration: 1200, ease: 'outQuart', delay: 100 });
    }
    if (wordsRef.current) {
      const wEls = Array.from(wordsRef.current.querySelectorAll('.d-word'));
      wEls.forEach(w => { (w as HTMLElement).style.opacity = '0'; });
      animate(wEls, { opacity: [0, 1], delay: stagger(40, { start: 500 }), duration: 320, ease: 'outQuint' });
    }
    if (stampRef.current) {
      stampRef.current.style.opacity = '0';
      stampRef.current.style.transform = 'scale(0.9) rotate(-3deg)';
      setTimeout(() => {
        if (stampRef.current) animate(stampRef.current, { opacity: [0, 1], scale: [0.9, 1], rotate: ['-3deg', '-1.5deg'], duration: 600, ease: createSpring({ stiffness: 200, damping: 12 }).ease });
      }, 500 + words.length * 40 + 200);
    }
  }, [excerpt]);

  return (
    <div ref={sectionRef}>
      <ChapterShell id="disclosure" num="03" label="Disclosure" onActive={onActive}>
        <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 'clamp(0.85rem, 1.75vw, 1.4rem)', maxWidth: '22ch' }}>
          The most exposing thing you wrote:
        </h2>
        <div style={{ position: 'relative', paddingLeft: 'clamp(1.5rem, 3.5vw, 2.5rem)', marginBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)', maxWidth: 720 }}>
          <svg style={{ position: 'absolute', left: 0, top: 0, width: 4, height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 4 100">
            <line ref={borderRef} x1={2} y1={0} x2={2} y2={100} stroke={PALETTE.red} strokeWidth={4} vectorEffect="non-scaling-stroke" />
          </svg>
          <div ref={wordsRef} className="disclosure-quote" style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.4rem, 4.5vw, 2rem)', color: PALETTE.ink, lineHeight: 1.5, fontStyle: 'italic', letterSpacing: '-0.012em', maxWidth: '60ch', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            <span style={{ marginRight: '0.15em' }}>&ldquo;</span>
            {words.map((word, i) => <span key={i} className="d-word" style={{ display: 'inline', marginRight: '0.3em' }}>{word}</span>)}
            <span>&rdquo;</span>
          </div>
          <div ref={stampRef} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.25rem', padding: '0.5rem 0.85rem', border: `1.5px solid ${PALETTE.red}`, transformOrigin: 'left center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PALETTE.red, flexShrink: 0 }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.red, textTransform: 'uppercase', fontWeight: 700 }}>Retained in model weights</span>
          </div>
        </div>
        {date && <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.25rem' }}>- {date}</p>}
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: '50ch', marginBottom: '0.4rem' }}>
          It was processed, classified, and - under OpenAI's training policy - may have been used to adjust model weights.{' '}
          <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecorationColor: 'rgba(26,24,20,0.35)' }}>
            OpenAI's April 2026 Privacy Policy
          </a>{' '}
          contains an explicit carve-out: data already used in model training is exempt from the{' '}
          <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecorationColor: 'rgba(26,24,20,0.35)' }}>
            right to deletion
          </a>.
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', opacity: 0.6 }}>
          OpenAI Privacy Policy, April 2026 (US) - deletion carve-out
        </p>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 04 - NETWORK
// ════════════════════════════════════════════════════════════════════════════
function NetworkChapter({ names, onActive }: {
  names: string[]; onActive: (id: ChapterId) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgRef     = useRef<SVGSVGElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update(); mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const displayed = names.slice(0, 8);
  const cx = isMobile ? 220 : 360; const cy = isMobile ? 280 : 220;
  const orbitR = isMobile ? 115 : 150;
  const viewBox = isMobile ? '0 0 440 560' : '0 0 720 440';
  const aspectRatio = isMobile ? '4.4 / 5.6' : '72 / 44';

  const positions = displayed.map((_, i) => {
    if (displayed.length === 1) return { x: cx, y: cy };
    const angle = (i / displayed.length) * Math.PI * 2 - Math.PI / 2;
    const r = orbitR + (i % 2) * (isMobile ? 18 : 25);
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  useScrollTrigger(sectionRef as any, () => {
    const svg = svgRef.current; if (!svg) return;
    const nodes = Array.from(svg.querySelectorAll('.n-node'));
    const labels = Array.from(svg.querySelectorAll('.n-label'));
    const lines = Array.from(svg.querySelectorAll('.n-line'));
    nodes.forEach(n => { (n as SVGElement).setAttribute('opacity', '0'); });
    labels.forEach(l => { (l as SVGElement).setAttribute('opacity', '0'); });
    animate(nodes, { opacity: [0, 1], scale: [0, 1], delay: stagger(100), ease: createSpring({ stiffness: 220, damping: 14 }).ease, duration: 700 });
    animate(labels, { opacity: [0, 1], delay: stagger(100, { start: 220 }), duration: 450, ease: 'outQuint' });
    const drawables = lines.flatMap(l => createDrawable(l as SVGGeometryElement));
    if (drawables.length) animate(drawables, { draw: ['0 0', '0 1'], delay: stagger(60, { start: 700, from: 'random' }), duration: 800, ease: 'outQuart' });
  }, [names, isMobile]);

  if (!displayed.length) {
    return (
      <ChapterShell id="network" num="04" label="Network" onActive={onActive}>
        <p style={{ fontFamily: TYPE.serif, fontSize: '1.15rem', color: PALETTE.inkMuted, lineHeight: 1.78 }}>No named individuals detected in this dataset.</p>
      </ChapterShell>
    );
  }

  return (
    <div ref={sectionRef}>
      <ChapterShell id="network" num="04" label="Network" onActive={onActive}>
        <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)', maxWidth: '22ch' }}>
          The {displayed.length} {displayed.length === 1 ? 'person' : 'people'} you named:
        </h2>
        <div style={{ width: '100%', maxWidth: isMobile ? 380 : 640, aspectRatio, marginBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)' }}>
          <svg ref={svgRef} viewBox={viewBox} style={{ width: '100%', height: '100%' }}>
            {positions.map((p1, i) => positions.slice(i + 1).map((p2, j) => (
              <line key={`${i}-${j}`} className="n-line" x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(26,24,20,0.15)" strokeWidth={0.75} />
            )))}
            <circle cx={cx} cy={cy} r={isMobile ? 4 : 3.5} fill={PALETTE.red} opacity={0.6} />
            <circle cx={cx} cy={cy} r={isMobile ? 11 : 9} fill="none" stroke={PALETTE.red} strokeOpacity={0.18} strokeWidth={0.75} />
            {positions.map((p, i) => (
              <g key={i}>
                <circle className="n-node" cx={p.x} cy={p.y} r={isMobile ? 6 : 5} fill={PALETTE.ink} />
                <circle className="n-node" cx={p.x} cy={p.y} r={isMobile ? 12 : 10} fill="none" stroke="rgba(26,24,20,0.18)" strokeWidth={0.75} />
                <text className="n-label" x={p.x} y={p.y + (p.y > cy ? (isMobile ? 30 : 24) : -(isMobile ? 18 : 14))} textAnchor="middle" fontSize={isMobile ? 15 : 12} fill={PALETTE.ink} fontFamily="EB Garamond, Georgia, serif" fontStyle="italic">{displayed[i]}</text>
              </g>
            ))}
          </svg>
        </div>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: '50ch', marginBottom: '0.4rem' }}>
          These individuals did not consent to being named in a training dataset. OpenAI's terms govern only the account holder - not the people mentioned in their conversations.
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', opacity: 0.6 }}>
          OpenAI Privacy Policy, 2023 - third-party data
        </p>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 05 - SCORE
// ════════════════════════════════════════════════════════════════════════════
const RING_R = 120;
const RING_C = 2 * Math.PI * RING_R;

function ScoreChapter({ score, onActive, setPage }: {
  score: number; onActive: (id: ChapterId) => void; setPage: (p: DashPage) => void;
}) {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const ringRef      = useRef<SVGCircleElement>(null);
  const numRef       = useRef<HTMLSpanElement>(null);
  const labelRef     = useRef<HTMLSpanElement>(null);
  const ticksRef     = useRef<SVGGElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const color = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;
  const label = score >= 70 ? 'Severe' : score >= 40 ? 'Moderate' : 'Limited';

  useScrollTrigger(sectionRef as any, () => {
    const ring = ringRef.current; const num = numRef.current;
    if (!ring || !num) return;
    ring.style.strokeDasharray = `${RING_C}`; ring.style.strokeDashoffset = `${RING_C}`;
    if (ticksRef.current) Array.from(ticksRef.current.children).forEach(t => (t as SVGElement).setAttribute('opacity', '0'));
    const tl = createTimeline();
    if (ticksRef.current) tl.add(Array.from(ticksRef.current.children) as any, { opacity: [0, 1], delay: stagger(8, { from: 'center' }), duration: 400, ease: 'outQuint' });
    const obj = { v: 0 };
    tl.add(obj, {
      v: score, ease: createSpring({ stiffness: 50, damping: 11 }).ease, duration: 2400,
      onUpdate: () => { const t = Math.max(0, Math.min(obj.v, 100)) / 100; ring.style.strokeDashoffset = `${RING_C * (1 - t)}`; if (num) num.textContent = String(Math.round(obj.v)); },
      onComplete: () => { ring.style.strokeDashoffset = `${RING_C * (1 - score / 100)}`; if (num) num.textContent = String(score); },
    }, 200);
    if (labelRef.current) { labelRef.current.style.opacity = '0'; tl.add(labelRef.current, { opacity: [0, 1], translateY: [6, 0], duration: 600, ease: 'outQuint' }, '-=300'); }
    setTimeout(() => {
      const container = particlesRef.current; if (!container) return;
      const dots = Array.from(container.children) as HTMLElement[];
      animate(dots, {
        opacity: [0.9, 0],
        translateX: (_el: any, i: number) => { const a = (i / 24) * Math.PI * 2; return [0, Math.cos(a) * (60 + (i % 4) * 18)]; },
        translateY: (_el: any, i: number) => { const a = (i / 24) * Math.PI * 2; return [0, Math.sin(a) * (60 + (i % 4) * 18)]; },
        scale: [1, 0], delay: stagger(16), duration: 700, ease: 'outQuart',
      });
    }, 1800);
  }, [score]);

  return (
    <div ref={sectionRef}>
      <ChapterShell id="score" num="05" label="Score" onActive={onActive}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2rem, 5vw, 4rem)', flexWrap: 'wrap' }}>
          {/* Ring */}
          <div style={{ position: 'relative', width: 'min(48vw, clamp(160px, 26vw, 260px))', aspectRatio: '1', flexShrink: 0 }}>
            <svg viewBox="0 0 320 320" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <g ref={ticksRef}>
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i / 60) * 360 - 90; const rad = (angle * Math.PI) / 180;
                  const isMaj = i % 15 === 0; const isMin = i % 5 === 0;
                  const r0 = RING_R + (isMaj ? 13 : isMin ? 15 : 16); const r1 = RING_R + (isMaj ? 24 : isMin ? 20 : 18);
                  return <line key={i} x1={160 + Math.cos(rad) * r0} y1={160 + Math.sin(rad) * r0} x2={160 + Math.cos(rad) * r1} y2={160 + Math.sin(rad) * r1} stroke={`rgba(26,24,20,${isMaj ? 0.28 : isMin ? 0.12 : 0.05})`} strokeWidth={isMaj ? 1.6 : 0.8} />;
                })}
              </g>
              {[70, 90, 110].map((r, i) => <circle key={r} cx={160} cy={160} r={r} fill="none" stroke={`rgba(26,24,20,${[0.04, 0.03, 0.02][i]})`} strokeWidth={0.5} />)}
              <circle cx={160} cy={160} r={RING_R} fill="none" stroke="rgba(26,24,20,0.09)" strokeWidth={6} />
              <circle ref={ringRef} cx={160} cy={160} r={RING_R} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" transform="rotate(-90 160 160)" />
              {[{v:'0',a:-90},{v:'25',a:0},{v:'50',a:90},{v:'75',a:180}].map(({v,a}) => {
                const rad = (a * Math.PI) / 180; const lr = RING_R + 34;
                return <text key={v} x={160 + Math.cos(rad) * lr} y={160 + Math.sin(rad) * lr + 4} textAnchor="middle" fontSize="9" letterSpacing="0.06em" fill="rgba(26,24,20,0.20)" fontFamily="'Courier Prime', monospace">{v}</text>;
              })}
              <line x1={152} y1={160} x2={168} y2={160} stroke="rgba(26,24,20,0.10)" strokeWidth={0.85} />
              <line x1={160} y1={152} x2={160} y2={168} stroke="rgba(26,24,20,0.10)" strokeWidth={0.85} />
              <circle cx={160} cy={160} r={2} fill="rgba(190,40,30,0.50)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <span ref={numRef} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3.5rem, 8vw, 5.5rem)', fontWeight: 400, color, letterSpacing: '-0.05em', lineHeight: 1 }}>0</span>
              <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.24em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>/ 100</span>
              <span ref={labelRef} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.24em', color, textTransform: 'uppercase', marginTop: '0.25rem' }}>{label}</span>
            </div>
            <div ref={particlesRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {Array.from({ length: 24 }).map((_, i) => <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3, height: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3, borderRadius: '50%', background: color, opacity: 0, transform: 'translate(-50%, -50%)' }} />)}
            </div>
          </div>

          {/* Copy beside ring */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 'clamp(0.75rem, 1.5vw, 1.25rem)', maxWidth: '20ch' }}>
              Combined into a single value:
            </h2>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: '44ch', marginBottom: '0.75rem' }}>
              A composite measure of the personal information recoverable from your conversation history - derived from what OpenAI's systems were permitted to collect, retain, and learn from.
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem', opacity: 0.6 }}>
              Based on OpenAI Privacy Policy categories, June 2023 - April 2026
            </p>
            <button onClick={() => setPage('score-breakdown')} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: PALETTE.redMuted, background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${PALETTE.redMuted}50`, paddingBottom: '1px' }} onMouseEnter={e => { e.currentTarget.style.color = PALETTE.red; }} onMouseLeave={e => { e.currentTarget.style.color = PALETTE.redMuted; }}>
              How did we work this out? →
            </button>
          </div>
        </div>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 06 - PERMANENCE
// ════════════════════════════════════════════════════════════════════════════
function PermanenceChapter({ onActive }: { onActive: (id: ChapterId) => void }) {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const wmRef        = useRef<HTMLDivElement>(null);
  const sealRef      = useRef<SVGCircleElement>(null);
  const sealInnerRef = useRef<SVGCircleElement>(null);
  const sealTextRef  = useRef<SVGGElement>(null);
  const headlineRef  = useRef<HTMLHeadingElement>(null);

  useScrollTrigger(sectionRef as any, () => {
    if (wmRef.current) { wmRef.current.style.opacity = '0'; animate(wmRef.current, { opacity: [0, 1], duration: 2400, ease: 'outQuart', delay: 200 }); }
    if (sealRef.current && sealInnerRef.current) {
      const drawables = [...createDrawable(sealRef.current), ...createDrawable(sealInnerRef.current)];
      animate(drawables, { draw: ['0 0', '0 1'], duration: 1400, delay: stagger(150, { start: 400 }), ease: 'outQuart' });
    }
    if (sealTextRef.current) { sealTextRef.current.style.opacity = '0'; animate(sealTextRef.current, { opacity: [0, 1], rotate: ['-12deg', '0deg'], duration: 800, ease: createSpring({ stiffness: 150, damping: 15 }).ease, delay: 1400 }); }
    if (headlineRef.current) {
      const wEls = Array.from(headlineRef.current.querySelectorAll('.p-word'));
      wEls.forEach(w => { (w as HTMLElement).style.opacity = '0'; });
      animate(wEls, { opacity: [0, 1], translateY: [10, 0], delay: stagger(75, { start: 600 }), duration: 700, ease: 'outQuint' });
    }
  });

  const words = 'None of this can be retracted.'.split(' ');

  return (
    <div ref={sectionRef}>
      <ChapterShell id="permanence" num="06" label="Permanence" onActive={onActive}>
        <div style={{ position: 'relative' }}>
          {/* RETAINED watermark */}
          <div ref={wmRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(4rem, 18vw, 14rem)', fontWeight: 400, color: 'rgba(190,40,30,0.065)', letterSpacing: '-0.05em', lineHeight: 1, userSelect: 'none', whiteSpace: 'nowrap' }}>RETAINED</span>
          </div>

          {/* Seal */}
          <div className="permanence-seal" style={{ position: 'absolute', top: 0, right: 0, width: 'clamp(90px, 14vw, 160px)', aspectRatio: '1', zIndex: 1 }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <circle ref={sealRef} cx={100} cy={100} r={96} fill="none" stroke={PALETTE.red} strokeWidth={1.5} />
              <circle ref={sealInnerRef} cx={100} cy={100} r={84} fill="none" stroke={PALETTE.red} strokeWidth={0.75} />
              <g ref={sealTextRef}>
                <defs><path id="seal-circle" d="M 100,100 m -72,0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0" /></defs>
                <text fontFamily="'Courier Prime', monospace" fontSize="11" fill={PALETTE.red} letterSpacing="4">
                  <textPath href="#seal-circle" startOffset="0">NON-RETRACTABLE · MODEL WEIGHT INSTANCE · RETAINED ·</textPath>
                </text>
                <text x={100} y={94} textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="9" letterSpacing="3" fill={PALETTE.red}>PERMANENT</text>
                <text x={100} y={110} textAnchor="middle" fontFamily="EB Garamond, Georgia, serif" fontSize="14" fontStyle="italic" fill={PALETTE.red}>Record</text>
                <text x={100} y={126} textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="9" letterSpacing="3" fill={PALETTE.red}>CLOSED</text>
              </g>
            </svg>
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, paddingTop: 'clamp(0.75rem, 2.5vw, 2rem)', paddingBottom: 'clamp(0.75rem, 2.5vw, 2rem)' }}>
            <h2 ref={headlineRef} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.035em', lineHeight: 1.04, marginBottom: 'clamp(0.85rem, 1.75vw, 1.4rem)', maxWidth: '14ch' }}>
              {words.map((w, i) => <span key={i} className="p-word" style={{ display: 'inline-block', marginRight: '0.25em', color: w === 'retracted.' ? PALETTE.red : PALETTE.ink }}>{w}</span>)}
            </h2>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: '48ch', marginBottom: '0.4rem' }}>
              <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecorationColor: 'rgba(26,24,20,0.35)' }}>
                OpenAI's April 2026 Privacy Policy
              </a>{' '}
              explicitly exempts training data from the right to deletion. Deleting your account removes your data from OpenAI's servers. It does not remove your contribution from the model's weights - those are different operations, and the latter remains an{' '}
              <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecorationColor: 'rgba(26,24,20,0.35)' }}>
                unsolved problem in machine learning research
              </a>.
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase', opacity: 0.6 }}>
              OpenAI Privacy Policy, April 2026 · Cooper et al., 2024 (machine unlearning)
            </p>
          </div>
        </div>
      </ChapterShell>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CHAPTER 07 - CONTINUE
// Final snap chapter: closing statement + nav cards to Act II/III
// ════════════════════════════════════════════════════════════════════════════
function ContinueChapter({ setPage, onActive }: {
  setPage: (p: DashPage) => void;
  onActive: (id: ChapterId) => void;
}) {
  const NAV_ITEMS = [
    { page: 'profile' as DashPage, act: 'Act II', label: 'What you are worth', body: 'The commercial valuation of this profile - segments, pricing, and market position.' },
    { page: 'risk'    as DashPage, act: 'Act II', label: 'What it enables',    body: 'The scenarios that become possible once this record exists.' },
    { page: 'terms'   as DashPage, act: 'Act III', label: 'Why it persists',   body: 'Why this profile is not easily removed - even if you delete your account.' },
  ];

  return (
    <ChapterShell id="continue" label="Continue" onActive={onActive}>
      {/* Closing statement */}
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.45, maxWidth: '52ch', marginBottom: '0.85rem', fontWeight: 400 }}>
        What you have seen is a record assembled from conversations you believed were private. The data was not taken - it was given, under terms designed to obscure what giving it meant.
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '52ch', fontStyle: 'italic', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        The record exists. It is not easily closed.
      </p>

      {/* Nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: PALETTE.border, marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.page}
            onClick={() => setPage(item.page)}
            style={{ background: PALETTE.bgPanel, border: 'none', cursor: 'pointer', padding: 'clamp(1.25rem, 2.5vw, 1.75rem)', textAlign: 'left', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = PALETTE.bgElevated)}
            onMouseLeave={e => (e.currentTarget.style.background = PALETTE.bgPanel)}
          >
            <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{item.act}</span>
            <span style={{ display: 'block', fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.ink, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: '0.4rem' }}>{item.label} →</span>
            <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.06em', color: PALETTE.inkFaint, lineHeight: 1.55 }}>{item.body}</span>
          </button>
        ))}
      </div>

      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
        End of Act I.
      </p>
    </ChapterShell>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════════
export default function OverviewPage({ results, sources, setPage }: {
  results: any; sources: any[]; setPage: (p: DashPage) => void;
}) {
  const [active, setActive] = useState<ChapterId>('arrival');
  const handleActive = useCallback((id: ChapterId) => setActive(id), []);

  // ── Locked chapter scroll ──────────────────────────────────────────────────
  // Intercept wheel + touch so each gesture moves exactly one chapter.
  // No inertia drift, no mid-chapter resting.
  const visibleIdsRef = useRef<ChapterId[]>([]);
  const isScrollingRef = useRef(false);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    // Disable browser snap - we handle it manually
    document.documentElement.style.scrollSnapType = 'none';

    function getChapterEls(ids: ChapterId[]) {
      return ids.map(id => document.getElementById(`chapter-${id}`)).filter(Boolean) as HTMLElement[];
    }

    function getCurrentIndex(ids: ChapterId[]) {
      const els = getChapterEls(ids);
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      els.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - mid);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      return best;
    }

    function scrollToChapter(idx: number, ids: ChapterId[]) {
      if (isScrollingRef.current) return;
      const els = getChapterEls(ids);
      const el = els[idx];
      if (!el) return;
      isScrollingRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { isScrollingRef.current = false; }, 1000);
    }

    // Fire immediately on first wheel event above threshold.
    // Track cumulative delta to ignore trailing momentum events.
    let cumulativeDelta = 0;
    let lastWheelTime = 0;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const now = Date.now();
      // Reset accumulator if it's been a while - new gesture
      if (now - lastWheelTime > 400) cumulativeDelta = 0;
      lastWheelTime = now;
      if (isScrollingRef.current) return;
      cumulativeDelta += e.deltaY;
      // Require at least 20px of intent before firing
      if (Math.abs(cumulativeDelta) < 20) return;
      const ids = visibleIdsRef.current;
      const cur = getCurrentIndex(ids);
      const next = cumulativeDelta > 0 ? Math.min(cur + 1, ids.length - 1) : Math.max(cur - 1, 0);
      cumulativeDelta = 0;
      if (next !== cur) scrollToChapter(next, ids);
    }

    function onTouchStart(e: TouchEvent) {
      touchStartYRef.current = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      if (isScrollingRef.current) return;
      const dy = touchStartYRef.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 30) return; // ignore taps
      const ids = visibleIdsRef.current;
      const cur = getCurrentIndex(ids);
      const next = dy > 0 ? Math.min(cur + 1, ids.length - 1) : Math.max(cur - 1, 0);
      if (next !== cur) scrollToChapter(next, ids);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space'].includes(e.key)) return;
      e.preventDefault();
      if (isScrollingRef.current) return;
      const ids = visibleIdsRef.current;
      const cur = getCurrentIndex(ids);
      const down = ['ArrowDown', 'PageDown', 'Space'].includes(e.key);
      const next = down ? Math.min(cur + 1, ids.length - 1) : Math.max(cur - 1, 0);
      if (next !== cur) scrollToChapter(next, ids);
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.documentElement.style.scrollSnapType = '';
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const score        = results?.privacyScore ?? 0;
  const messageCount = results?.totalUserMessages || results?.rawStats?.userMessages || 0;
  const days         = results?.timespan?.days || 0;
  const namesAll     = (results?.findings?.personalInfo?.names || []).map((n: any) => n.name);
  const dayHourMatrix: number[][] = results?.dayHourMatrix || Array.from({ length: 7 }, () => Array(24).fill(0));
  const today        = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  let inferences: { attribute: string; value: string; confidence: number }[] = [];
  const synth   = results?.synthesis;
  const portrait = results?.psychologicalPortrait;
  if (synth?.demographicPredictions?.length) {
    inferences = synth.demographicPredictions.slice(0, 4).map((d: any) => ({ attribute: d.attribute || 'Attribute', value: d.value || '-', confidence: typeof d.confidence === 'number' ? d.confidence : 0.7 }));
  } else if (portrait) {
    const candidates = [
      portrait.emotionalBaselineLabel && { attribute: 'Emotional baseline', value: portrait.emotionalBaselineLabel, confidence: 0.82 },
      portrait.writingVoice && { attribute: 'Writing voice', value: portrait.writingVoice, confidence: 0.78 },
      portrait.communicationPattern && { attribute: 'Communication pattern', value: portrait.communicationPattern, confidence: 0.75 },
      portrait.primaryCopingMechanism && { attribute: 'Primary coping', value: portrait.primaryCopingMechanism, confidence: 0.71 },
    ].filter(Boolean) as any[];
    inferences = candidates.slice(0, 4);
  }

  const moment      = results?.juiciestMoments?.[0];
  const excerpt     = moment?.excerpt ? moment.excerpt.substring(0, 120).trim() + (moment.excerpt.length > 120 ? '…' : '') : null;
  const excerptDate = moment?.timestamp ? new Date(moment.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const visibleChapters: ChapterId[] = [
    'arrival',
    ...(messageCount > 0 ? ['volume' as ChapterId] : []),
    ...(inferences.length > 0 ? ['inference' as ChapterId] : []),
    ...(excerpt ? ['disclosure' as ChapterId] : []),
    ...(namesAll.length > 0 ? ['network' as ChapterId] : []),
    'score',
    'permanence',
    'continue',
  ];

  // Keep scroll controller in sync with which chapters are rendered
  const visibleChaptersKey = visibleChapters.join(',');
  useEffect(() => {
    visibleIdsRef.current = visibleChapters;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleChaptersKey]);

  const connected = sources.filter((s: any) => s.connected).length;

  return (
    <>
      <style>{`
        .chapter-snap {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        #chapter-continue {
          scroll-snap-align: none;
        }
        @media (max-width: 768px) {
          .ov-right-rail { display: none !important; }
        }
        .ov-chapter-dots {
          padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
        }
        @media (max-width: 640px) {
          .permanence-seal { width: clamp(72px, 18vw, 110px) !important; }
          .arrival-heading { font-size: clamp(2.8rem, 11vw, 4.5rem) !important; }
          .disclosure-quote { font-size: clamp(1.2rem, 4.5vw, 1.6rem) !important; }
        }
        @media (max-width: 380px) {
          .arrival-heading { font-size: clamp(2.4rem, 10vw, 3.5rem) !important; }
        }
      `}</style>

      <RightRail active={active} visible={visibleChapters} />
      <ChapterDots active={active} chapters={CHAPTERS.filter(c => visibleChapters.includes(c.id))} />

      {connected < sources.length && (
        <div style={{ position: 'fixed', top: `${NAV_H}px`, right: 'clamp(1.5rem, 7vw, 6rem)', zIndex: 30, padding: '0.5rem 0' }}>
          <button onClick={() => setPage('sources')} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.inkMuted, background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.35rem 0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Add more sources →
          </button>
        </div>
      )}

      <main>
        <ArrivalChapter date={today} onActive={handleActive} setPage={setPage} />
        {messageCount > 0 && <VolumeChapter count={messageCount} days={days} dayHourMatrix={dayHourMatrix} onActive={handleActive} />}
        {inferences.length > 0 && <InferenceChapter inferences={inferences} onActive={handleActive} />}
        {excerpt && <DisclosureChapter excerpt={excerpt} date={excerptDate} onActive={handleActive} />}
        {namesAll.length > 0 && <NetworkChapter names={namesAll} onActive={handleActive} />}
        <ScoreChapter score={score} onActive={handleActive} setPage={setPage} />
        <PermanenceChapter onActive={handleActive} />
        <ContinueChapter setPage={setPage} onActive={handleActive} />
      </main>
    </>
  );
}
