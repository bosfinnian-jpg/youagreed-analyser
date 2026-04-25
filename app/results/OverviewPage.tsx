'use client';

// ============================================================================
// OVERVIEW PAGE — Act I: The Record
//
// Architecture (identical to ResistPage pattern):
//   600vh container → position:sticky 100vh panel
//   Left: text phases (Framer AnimatePresence)
//   Right: anime.js visual stage — four distinct techniques
//   Fixed right rail: phase labels
//
// anime.js techniques per phase:
//   SCORE    — createTimeline(), strokeDashoffset, createSpring counter
//   DATA     — stagger with grid:[15,8] from:'center', spring ease
//   MOMENT   — createDrawable SVG left border + word-by-word opacity
//   RISK     — createSpring dots, stagger from:'random'
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { animate, stagger, onScroll, createDrawable, createSpring, createTimeline } from 'animejs';
import { PALETTE, TYPE, type DashPage, ActLabel, ThreadSentence } from './DashboardLayout';
import DataProductSummary from './DataProductSummary';
import EmotionalTimelineChart from './EmotionalTimelineChart';
import { ConfidenceLimitations, getActiveEmptyStates, EmptyStateNotice } from './EmptyStatesAndLimitations';
import ClosureSection from './ClosureSection';
import { RetainedTag } from './CannotBeDeletedPage';

// ── Constants ─────────────────────────────────────────────────────────────────
const RING_R   = 90;
const RING_C   = 2 * Math.PI * RING_R;
const PHASES   = ['SCORE', 'DATA', 'MOMENT', 'RISK'] as const;
type Phase     = typeof PHASES[number];
const PHASE_LABELS: Record<Phase, string> = {
  SCORE:  'Exposure score',
  DATA:   'The record',
  MOMENT: 'Most exposed',
  RISK:   'Risk profile',
};

// Phase thresholds (fraction of scroll through the 600vh container)
const PHASE_AT: [number, Phase][] = [
  [0.00, 'SCORE'],
  [0.25, 'DATA'],
  [0.52, 'MOMENT'],
  [0.76, 'RISK'],
];

function getPhase(p: number): Phase {
  let current: Phase = 'SCORE';
  for (const [threshold, name] of PHASE_AT) {
    if (p >= threshold) current = name;
  }
  return current;
}

// ── Right rail ────────────────────────────────────────────────────────────────
// Fixed vertical label bar — same pattern as ResistPage ProgressRail.
function RightRail({ phase }: { phase: Phase }) {
  return (
    <div style={{
      position: 'fixed',
      right: 'clamp(1rem, 2.5vw, 2rem)',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      pointerEvents: 'none',
    }}>
      {PHASES.map((p, i) => {
        const active = p === phase;
        return (
          <div key={p} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: active ? 1 : 0.28,
            transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <span style={{
              fontFamily: TYPE.mono,
              fontSize: '8px',
              letterSpacing: '0.28em',
              color: active ? PALETTE.ink : PALETTE.inkFaint,
              textTransform: 'uppercase',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              height: active ? '72px' : '48px',
              textAlign: 'center',
              transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s',
              overflow: 'hidden',
            }}>
              {PHASE_LABELS[p]}
            </span>
            <div style={{
              width: '1px',
              height: active ? '56px' : '8px',
              background: active ? PALETTE.ink : PALETTE.border,
              transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Left scroll progress rail ─────────────────────────────────────────────────
function ScrollRail() {
  const fillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    const tick = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      fill.style.transform = `scaleY(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener('scroll', tick, { passive: true });
    return () => window.removeEventListener('scroll', tick);
  }, []);
  return (
    <div style={{ position: 'fixed', left: 'clamp(10px,1.8vw,20px)', top: 0, bottom: 0, width: 1, zIndex: 40, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,24,20,0.07)' }} />
      <div ref={fillRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'rgba(190,40,30,0.60)', transformOrigin: 'top center', transform: 'scaleY(0)' }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RIGHT SIDE VISUAL STAGES
// Each phase renders a different anime.js-powered visual.
// ══════════════════════════════════════════════════════════════════════════════

// ── Phase 0: SCORE ────────────────────────────────────────────────────────────
// createTimeline() chains ring draw → spring counter → bezel ticks
// The spring overshoot on the number is a machine calculating, not a reveal.
function ScoreStage({ score, color, active }: { score: number; color: string; active: boolean }) {
  const ringRef  = useRef<SVGCircleElement>(null);
  const numRef   = useRef<HTMLSpanElement>(null);
  const fired    = useRef(false);
  const ticks    = Array.from({ length: 60 });

  useEffect(() => {
    if (!active || fired.current) return;
    fired.current = true;
    const ring = ringRef.current;
    const num  = numRef.current;
    if (!ring || !num) return;

    ring.style.strokeDasharray  = `${RING_C}`;
    ring.style.strokeDashoffset = `${RING_C}`;

    const obj = { v: 0 };
    const tl  = createTimeline({ defaults: { ease: 'outQuint' } });

    // 1. Ring draws in
    tl.add(obj, {
      v: score,
      ease: createSpring({ stiffness: 52, damping: 11 }).ease,
      duration: 2200,
      delay: 200,
      onUpdate: () => {
        const t = Math.max(0, Math.min(obj.v, 100)) / 100;
        ring.style.strokeDashoffset = `${RING_C * (1 - t)}`;
        if (num) num.textContent = String(Math.round(obj.v));
      },
      onComplete: () => {
        ring.style.strokeDashoffset = `${RING_C * (1 - score / 100)}`;
        if (num) num.textContent = String(score);
      },
    });

    return () => { tl.pause(); };
  }, [active, score]);

  const label = score >= 70 ? 'Severe' : score >= 40 ? 'Moderate' : 'Limited';
  return (
    <div style={{ position: 'relative', width: 'clamp(240px,30vw,320px)', aspectRatio: '1', margin: '0 auto' }}>
      <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {ticks.map((_, i) => {
          const angle = (i / 60) * 360 - 90;
          const rad   = (angle * Math.PI) / 180;
          const isMaj = i % 15 === 0;
          const isMin = i % 5 === 0;
          const r0    = RING_R + (isMaj ? 10 : isMin ? 12 : 13);
          const r1    = RING_R + (isMaj ? 20 : isMin ? 17 : 15);
          return (
            <line key={i}
              x1={140 + Math.cos(rad) * r0} y1={140 + Math.sin(rad) * r0}
              x2={140 + Math.cos(rad) * r1} y2={140 + Math.sin(rad) * r1}
              stroke={`rgba(26,24,20,${isMaj ? 0.20 : isMin ? 0.09 : 0.04})`}
              strokeWidth={isMaj ? 1.5 : 0.75}
            />
          );
        })}
        {[65, 78, 90].map((r, i) => (
          <circle key={r} cx={140} cy={140} r={r} fill="none"
            stroke={`rgba(26,24,20,${[0.04, 0.03, 0.025][i]})`} strokeWidth={0.5} />
        ))}
        <circle cx={140} cy={140} r={RING_R} fill="none" stroke="rgba(26,24,20,0.08)" strokeWidth={4.5} />
        <circle ref={ringRef} cx={140} cy={140} r={RING_R}
          fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round"
          transform="rotate(-90 140 140)"
        />
        {[{ v:'0', a:-90 }, { v:'25', a:0 }, { v:'50', a:90 }, { v:'75', a:180 }].map(({ v, a }) => {
          const rad = (a * Math.PI) / 180;
          const lr  = RING_R + 28;
          return (
            <text key={v} x={140 + Math.cos(rad) * lr} y={140 + Math.sin(rad) * lr + 4}
              textAnchor="middle" fontSize="7.5" letterSpacing="0.06em"
              fill="rgba(26,24,20,0.18)" fontFamily="'Courier Prime', monospace"
            >{v}</text>
          );
        })}
        <line x1={135} y1={140} x2={145} y2={140} stroke="rgba(26,24,20,0.12)" strokeWidth={0.75} />
        <line x1={140} y1={135} x2={140} y2={145} stroke="rgba(26,24,20,0.12)" strokeWidth={0.75} />
        <circle cx={140} cy={140} r={1.5} fill="rgba(190,40,30,0.45)" />
        <circle cx={140} cy={140} r={6}   fill="none" stroke="rgba(190,40,30,0.10)" strokeWidth={0.75} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
        <span ref={numRef} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3.5rem,7vw,5rem)', fontWeight: 400, color, letterSpacing: '-0.05em', lineHeight: 1 }}>0</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>/ 100</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em', color, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</span>
      </div>
    </div>
  );
}

// ── Phase 1: DATA ─────────────────────────────────────────────────────────────
// stagger with grid:[15,8] from:'center' — a field of dots representing
// every message you sent. Each one a data point in someone else's model.
// Spring ease makes them feel like they're alive, not placed.
const GRID_COLS = 15;
const GRID_ROWS = 8;
const DOT_COUNT = GRID_COLS * GRID_ROWS;

function DataStage({ count, active }: { count: number; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fired        = useRef(false);

  useEffect(() => {
    if (!active || fired.current) return;
    const container = containerRef.current;
    if (!container) return;
    fired.current = true;

    const dots = Array.from(container.querySelectorAll('.data-dot'));
    if (!dots.length) return;

    // Set initial state
    dots.forEach(d => {
      (d as HTMLElement).style.transform = 'scale(0)';
      (d as HTMLElement).style.opacity   = '0';
    });

    const springEase = createSpring({ stiffness: 320, damping: 22 }).ease;

    animate(dots, {
      scale:   [0, 1],
      opacity: [0, 1],
      delay:   stagger(18, { grid: [GRID_COLS, GRID_ROWS], from: 'center' }),
      ease:    springEase,
      duration: 700,
    });
  }, [active]);

  // How many dots are "active" (sent messages vs total grid)
  const activeDots = count > 0
    ? Math.min(Math.round((count / 5000) * DOT_COUNT), DOT_COUNT)
    : Math.floor(DOT_COUNT * 0.6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <div ref={containerRef}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gap: '8px',
          padding: '1rem',
        }}
      >
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <div key={i} className="data-dot" style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i < activeDots ? 'rgba(190,40,30,0.75)' : 'rgba(26,24,20,0.12)',
            flexShrink: 0,
          }} />
        ))}
      </div>
      {count > 0 && (
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', textAlign: 'center' }}>
          {count.toLocaleString()} messages · each dot a permanent record
        </p>
      )}
    </div>
  );
}

// ── Phase 2: MOMENT ───────────────────────────────────────────────────────────
// The most exposing excerpt. Words appear left to right, no scramble —
// just clean sequential opacity. createDrawable draws the left border.
// Simple. Authoritative. The content does the work.
function MomentStage({ results, active }: { results: any; active: boolean }) {
  const borderRef    = useRef<SVGLineElement>(null);
  const wordsRef     = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fired        = useRef(false);

  const moment  = results?.juiciestMoments?.[0];
  const excerpt = moment?.excerpt
    ? moment.excerpt.substring(0, 220)
    : 'You disclosed things here you have not told many people.';
  const words   = excerpt.split(' ');

  useEffect(() => {
    if (!active || fired.current) return;
    const border = borderRef.current;
    const wrap   = wordsRef.current;
    if (!border || !wrap) return;
    fired.current = true;

    // Border draws downward — createDrawable
    const drawables = createDrawable(border);
    if (drawables.length) {
      animate(drawables, { draw: ['0 0', '0 1'], duration: 1100, ease: 'outQuart', delay: 100 });
    }

    // Words appear sequentially
    const wordEls = Array.from(wrap.querySelectorAll('.m-word'));
    wordEls.forEach(w => { (w as HTMLElement).style.opacity = '0'; });
    animate(wordEls, {
      opacity: [0, 1],
      delay:   stagger(55),
      duration: 350,
      ease:    'outQuint',
    });
  }, [active]);

  return (
    <div ref={containerRef} style={{ position: 'relative', paddingLeft: '2rem', maxWidth: 480 }}>
      <svg style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', overflow: 'visible' }}
        preserveAspectRatio="none" viewBox="0 0 3 100">
        <line ref={borderRef} x1={1.5} y1={0} x2={1.5} y2={100}
          stroke={PALETTE.red} strokeWidth={3} vectorEffect="non-scaling-stroke" />
      </svg>
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.25rem' }}>
        Most exposing moment
      </p>
      <div ref={wordsRef} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem,2vw,1.35rem)', color: PALETTE.ink, lineHeight: 1.78, fontStyle: 'italic' }}>
        <span style={{ marginRight: '0.15em' }}>&ldquo;</span>
        {words.map((word, i) => (
          <span key={i} className="m-word" style={{ display: 'inline', marginRight: '0.28em' }}>
            {word}
          </span>
        ))}
        <span>&rdquo;</span>
      </div>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.redMuted, textTransform: 'uppercase', marginTop: '1.5rem' }}>
        ● Retained in model weights
      </p>
    </div>
  );
}

// ── Phase 3: RISK ─────────────────────────────────────────────────────────────
// Risk indicators. Dots spring in with stagger from:'random' — machine-ordering.
// Each one that's active blooms with a stronger spring.
function RiskStage({ results, score, active }: { results: any; score: number; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fired        = useRef(false);

  const risks = [
    { label: 'Insurance profiling',  active: (results?.findings?.sensitiveTopics?.length || 0) > 0 },
    { label: 'Employment screening', active: (results?.totalUserMessages || 0) > 300 },
    { label: 'Breach exposure',      active: score > 40 },
    { label: 'Identity inference',   active: (results?.findings?.personalInfo?.names?.length || 0) > 1 },
    { label: 'Location tracking',    active: (results?.findings?.personalInfo?.locations?.length || 0) > 0 },
    { label: 'Behavioural profile',  active: score > 30 },
  ];
  const activeCount = risks.filter(r => r.active).length;

  useEffect(() => {
    if (!active || fired.current) return;
    const container = containerRef.current;
    if (!container) return;
    fired.current = true;

    const items = Array.from(container.querySelectorAll('.risk-item'));
    const dots  = Array.from(container.querySelectorAll('.risk-dot'));

    items.forEach(el => { (el as HTMLElement).style.opacity = '0'; (el as HTMLElement).style.transform = 'translateY(8px)'; });
    dots.forEach(d  => { (d  as HTMLElement).style.transform = 'scale(0)'; });

    const springEase = createSpring({ stiffness: 380, damping: 20 }).ease;

    animate(items, {
      opacity:    [0, 1],
      translateY: [8, 0],
      delay:      stagger(60, { from: 'random' }),
      duration:   500,
      ease:       'outQuint',
    });

    animate(dots, {
      scale:   [0, 1],
      delay:   stagger(80, { from: 'random' }),
      ease:    springEase,
      duration: 700,
    });
  }, [active]);

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
        <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3rem,6vw,4rem)', color: activeCount >= 4 ? PALETTE.red : activeCount >= 2 ? PALETTE.amber : PALETTE.green, letterSpacing: '-0.04em', lineHeight: 1 }}>{activeCount}</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>active risk{activeCount !== 1 ? 's' : ''} / {risks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {risks.map((risk, i) => (
          <div key={i} className="risk-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="risk-dot" style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: risk.active ? (activeCount >= 4 ? PALETTE.red : PALETTE.amber) : 'transparent',
              border: risk.active ? 'none' : '1px solid rgba(26,24,20,0.20)',
              boxShadow: risk.active && activeCount >= 4 ? '0 0 0 3px rgba(190,40,30,0.12)' : 'none',
            }} />
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em',
              color: risk.active ? PALETTE.ink : PALETTE.inkFaint,
              textTransform: 'uppercase',
            }}>{risk.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEFT SIDE TEXT — content per phase
// ══════════════════════════════════════════════════════════════════════════════
function PhaseText({ phase, results, score, setPage }: {
  phase: Phase;
  results: any;
  score: number;
  setPage: (p: DashPage) => void;
}) {
  const scoreColor = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;
  const primaryName = results?.findings?.personalInfo?.names?.[0]?.name;

  const content: Record<Phase, { kicker: string; headline: string; body: string; cta?: { label: string; page: DashPage; act?: string } }> = {
    SCORE: {
      kicker:   '01 — The record',
      headline: primaryName
        ? `${primaryName}, this is your exposure score.`
        : 'This is your exposure score.',
      body: 'This number represents the density of cognitive patterns extracted from your conversations. Not what you said — how you think. The methods used to extract it are not disclosed in the terms you agreed to.',
    },
    DATA: {
      kicker:   '02 — Volume',
      headline: 'Every message you sent became a data point.',
      body: 'Each one is a permanent fixture in a model that will never forget it. The terms you agreed to do not specify which of your messages were used for training. The technical impossibility of selective deletion is not mentioned.',
    },
    MOMENT: {
      kicker:   '03 — Disclosure',
      headline: 'This is the most exposing thing you wrote.',
      body: 'It was processed, classified, and used to weight a model. You cannot request its removal from the weights. The right to erasure, as defined in the terms, does not extend to what has already been learned.',
    },
    RISK: {
      kicker:   '04 — Consequences',
      headline: 'These are the active risk categories.',
      body: 'Insurance companies, employers, and data brokers use language pattern analysis to make decisions. Your conversation history contains the raw material. You agreed to terms that do not prevent this.',
      cta: { label: 'Full risk assessment', page: 'risk' },
    },
  };

  const c = content[phase];

  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.32em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        {c.kicker}
      </p>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.028em', lineHeight: 1.15, marginBottom: '1.5rem', maxWidth: '22ch' }}>
        {c.headline}
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem,1.65vw,1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: '42ch', marginBottom: '2rem' }}>
        {c.body}
      </p>
      {c.cta && (
        <button onClick={() => setPage(c.cta!.page)}
          style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.ink, textTransform: 'uppercase', background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.7rem 1.2rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
        >
          {c.cta.label} →
        </button>
      )}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GHOST TEXT — user's words drift upward behind the sticky panel
// Canvas, opacity tied to scroll
// ══════════════════════════════════════════════════════════════════════════════
function GhostText({ results }: { results: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const intens    = useRef(1);

  useEffect(() => {
    const tick = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      intens.current = 1 + Math.min(window.scrollY / (max * 0.5), 1) * 3.5;
    };
    window.addEventListener('scroll', tick, { passive: true });
    return () => window.removeEventListener('scroll', tick);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const raw: string[] = [];
    results?.juiciestMoments?.forEach((m: any) => {
      if (m.excerpt) {
        const words = m.excerpt.split(' ');
        for (let i = 0; i < words.length - 3; i += 3) raw.push(words.slice(i, i + 4).join(' '));
      }
    });
    results?.findings?.sensitiveTopics?.forEach((t: any) => { if (t.excerpt) raw.push(t.excerpt.substring(0, 35)); });
    results?.findings?.repetitiveThemes?.forEach((t: any) => { if (t.theme) raw.push(t.theme); });
    const fb = ["I've been feeling", "my doctor said", "I can't stop thinking", "what should I do", "I'm struggling with", "nobody else knows", "I haven't told anyone", "I keep worrying about", "it's been getting worse", "I need help with this"];
    const frags = raw.length >= 6 ? raw : fb;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const ghosts = Array.from({ length: 22 }, (_, i) => ({
      x:       Math.random() * (canvas.width || 800),
      y:       Math.random() * (canvas.height || 600),
      text:    frags[i % frags.length],
      speed:   6 + Math.random() * 12,
      opacity: 0.018 + Math.random() * 0.025,
      size:    10 + Math.random() * 7,
      tilt:    (Math.random() - 0.5) * 0.04,
    }));

    let last = 0;
    const draw = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      const W = canvas.width || 800, H = canvas.height || 600;
      ctx.clearRect(0, 0, W, H);
      for (const g of ghosts) {
        g.y -= g.speed * dt;
        if (g.y < -30) { g.y = H + 20; g.x = Math.random() * W; g.text = frags[Math.floor(Math.random() * frags.length)]; }
        ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.tilt);
        ctx.font = `${g.size}px "EB Garamond", Georgia, serif`;
        ctx.fillStyle = `rgba(26,24,20,${g.opacity * intens.current})`;
        ctx.fillText(g.text, 0, 0); ctx.restore();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [results]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCROLLYTELLING SECTION — the 600vh engine
// ══════════════════════════════════════════════════════════════════════════════
function ScrollStory({ results, score, setPage }: { results: any; score: number; setPage: (p: DashPage) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('SCORE');
  const [pRaw, setPRaw]   = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const smoothP = useSpring(scrollYProgress, { stiffness: 50, damping: 22, mass: 0.6 });

  useMotionValueEvent(smoothP, 'change', v => {
    setPRaw(v);
    setPhase(getPhase(v));
  });

  const scoreColor  = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;
  const msgCount    = results?.totalUserMessages || results?.stats?.userMessages || 0;
  const scrollNudge = pRaw < 0.04;

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '600vh' }}>
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
      }}>
        {/* Left: ghost text background + text panel */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: 'clamp(2rem,5vw,5rem) clamp(1.5rem,4vw,4rem)' }}>
          <GhostText results={results} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>
            {/* Header — only on first phase */}
            {pRaw < 0.08 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                style={{ marginBottom: '2.5rem' }}
              >
                <ActLabel roman="I" title="The Record" pageLabel="01 / Overview" />
                <ThreadSentence>You agreed to terms that described this. They did not describe it fully.</ThreadSentence>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              <PhaseText phase={phase} results={results} score={score} setPage={setPage} key={phase} />
            </AnimatePresence>
            {/* Scroll nudge */}
            <AnimatePresence>
              {scrollNudge && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.5 }}
                  style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <div style={{ width: 1, height: 24, background: PALETTE.border }} />
                  <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Scroll slowly</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: visual stage */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(2rem,5vw,5rem) clamp(2rem,5vw,5rem) clamp(2rem,5vw,5rem) clamp(1rem,3vw,3rem)',
          borderLeft: `1px solid ${PALETTE.border}`,
          position: 'relative',
        }}>
          <AnimatePresence mode="wait">
            <motion.div key={phase}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {phase === 'SCORE'  && <ScoreStage  score={score}   color={scoreColor} active={phase === 'SCORE'} />}
              {phase === 'DATA'   && <DataStage   count={msgCount}                   active={phase === 'DATA'}  />}
              {phase === 'MOMENT' && <MomentStage results={results}                  active={phase === 'MOMENT'} />}
              {phase === 'RISK'   && <RiskStage   results={results} score={score}    active={phase === 'RISK'}  />}
            </motion.div>
          </AnimatePresence>

          {/* Phase progress indicator — thin line at bottom of right panel */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: PALETTE.border }}>
            <motion.div style={{
              height: '100%',
              background: PALETTE.red,
              width: `${Math.max(0, Math.min(100, pRaw * 100))}%`,
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AFTER-SCROLL SECTIONS
// These live below the 600vh story — standard page sections
// ══════════════════════════════════════════════════════════════════════════════
function AnimatedRule({ label }: { label?: string }) {
  const lineRef      = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggered    = useRef(false);
  useEffect(() => {
    const line = lineRef.current;
    const cont = containerRef.current;
    if (!line || !cont) return;
    line.style.transform = 'scaleX(0)';
    const obs = onScroll({
      target: cont,
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        animate(line, { scaleX: [0, 1], duration: 1100, ease: 'outQuint' });
      },
    });
    return () => { obs.revert(); };
  }, []);
  return (
    <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
      <div ref={lineRef} style={{ flex: 1, height: '1px', background: PALETTE.border, transformOrigin: 'left center' }} />
      {label && <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</p>}
    </div>
  );
}

function BottomCTAs({ results, setPage }: { results: any; setPage: (p: DashPage) => void }) {
  const rows = [
    results?.findings?.personalInfo?.names?.length > 0    && { label: 'People identified',    value: `${results.findings.personalInfo.names.length} individuals`,    page: 'profile' as DashPage },
    results?.findings?.sensitiveTopics?.length > 0        && { label: 'Sensitive disclosures', value: `${results.findings.sensitiveTopics.length} instances`,         page: 'profile' as DashPage },
    results?.findings?.personalInfo?.locations?.length > 0 && { label: 'Locations mapped',     value: `${results.findings.personalInfo.locations.length} places`,      page: 'profile' as DashPage },
  ].filter(Boolean) as { label: string; value: string; page: DashPage }[];

  const sectionRef = useRef<HTMLDivElement>(null);
  const rowRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const triggered  = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const rowEls  = rowRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!section || !rowEls.length) return;
    rowEls.forEach(r => { r.style.opacity = '0'; r.style.transform = 'translateX(-10px)'; });
    const obs = onScroll({
      target: section,
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        animate(rowEls, { opacity: [0, 1], translateX: [-10, 0], delay: stagger(60, { from: 'random' }), duration: 600, ease: 'outQuint' });
      },
    });
    return () => { obs.revert(); };
  }, [rows.length]);

  return (
    <div style={{ padding: 'clamp(4rem,10vw,8rem) clamp(2rem,6vw,5rem)' }}>
      <AnimatedRule />
      {rows.length > 0 && (
        <div ref={sectionRef} style={{ marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem' }}>What was taken</p>
          {rows.map((row, i) => (
            <div key={i} ref={el => { rowRefs.current[i] = el; }}
              onClick={() => setPage(row.page)}
              style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2rem', borderBottom: `1px solid ${PALETTE.border}`, padding: '1.1rem 0', cursor: 'pointer', transition: 'padding-left 0.18s cubic-bezier(0.22,1,0.36,1)' }}
              onMouseEnter={e => { e.currentTarget.style.paddingLeft = '0.5rem'; }}
              onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
            >
              <div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{row.label}</p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem,2vw,1.35rem)', color: PALETTE.ink, letterSpacing: '-0.01em' }}>{row.value}</p>
              </div>
              <span style={{ fontFamily: TYPE.mono, fontSize: '14px', color: PALETTE.inkFaint }}>→</span>
            </div>
          ))}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem,1.8vw,1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 480, marginBottom: '1.5rem', fontStyle: 'italic' }}>
          Act I shows what was extracted. Act II shows what those extractions reveal about who you are.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => setPage('profile')}
            style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem,2vw,1.15rem)', letterSpacing: '-0.01em', color: PALETTE.ink, background: 'none', border: `1px solid ${PALETTE.border}`, padding: 'clamp(0.85rem,2vw,1.25rem) clamp(1.25rem,2.5vw,2rem)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', textAlign: 'left', lineHeight: 1.3 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; e.currentTarget.style.background = PALETTE.bgPanel; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; e.currentTarget.style.background = 'none'; }}
          >
            <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.35rem' }}>ACT II</span>
            The inference →
          </button>
          <button onClick={() => setPage('terms')}
            style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', padding: 'clamp(0.85rem,2vw,1.25rem) 0', textDecoration: 'underline', textDecorationColor: PALETTE.border }}
          >Skip to: the terms →</button>
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function OverviewPage({ results, sources, setPage }: {
  results: any;
  sources: any[];
  setPage: (p: DashPage) => void;
}) {
  const score        = results?.privacyScore || 0;
  const hasDeepData  = !!(results?.emotionalTimeline && results?.commercialProfile);
  const connected    = sources.filter((s: any) => s.connected).length;
  const [phase, setPhase] = useState<Phase>('SCORE');

  // Expose current phase for the right rail — need to lift it
  // We do this by passing phase setter down into ScrollStory
  // and maintaining state here
  const [railPhase, setRailPhase] = useState<Phase>('SCORE');

  const pad = 'clamp(2rem,6vw,5rem)';

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .ov-story-grid { grid-template-columns: 1fr !important; }
          .ov-story-right { display: none !important; }
          .ov-right-rail { display: none !important; }
        }
      `}</style>

      <ScrollRail />
      <RightRail phase={railPhase} />

      {/* Source banner */}
      {connected < sources.length && (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}` }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ padding: '0.85rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', borderBottom: `1px solid ${PALETTE.border}`, flexWrap: 'wrap' }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Analysis based on ChatGPT export only</p>
            <button onClick={() => setPage('sources')}
              style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.inkMuted, background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.4rem 0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
            >Add more sources →</button>
          </motion.div>
        </div>
      )}

      {/* The 600vh scroll story */}
      <OverviewScrollStory results={results} score={score} setPage={setPage} onPhaseChange={setRailPhase} />

      {/* Below-the-fold content */}
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {hasDeepData && results.emotionalTimeline?.weeks?.length > 2 && (
          <div style={{ padding: `0 ${pad}`, marginBottom: 'clamp(4rem,10vw,8rem)' }}>
            <AnimatedRule label="Emotional pattern over time" />
            <EmotionalTimelineChart timeline={results.emotionalTimeline} totalMessages={results.totalUserMessages || 0} />
          </div>
        )}
        {hasDeepData && (
          <div style={{ padding: `0 ${pad}`, marginBottom: 'clamp(4rem,10vw,8rem)' }}>
            <AnimatedRule label="Commercial profile" />
            <DataProductSummary analysis={results} />
          </div>
        )}
        <BottomCTAs results={results} setPage={setPage} />
        <div style={{ padding: `0 ${pad}`, borderTop: `1px solid ${PALETTE.border}`, paddingTop: '2rem', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <ConfidenceLimitations />
        </div>
        {hasDeepData && <div style={{ padding: `0 ${pad}` }}><ClosureSection analysis={results} setPage={setPage} /></div>}
      </div>
    </>
  );
}

// Wrapper to pass phase up to export
function OverviewScrollStory({ results, score, setPage, onPhaseChange }: {
  results: any;
  score: number;
  setPage: (p: DashPage) => void;
  onPhaseChange: (p: Phase) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('SCORE');
  const [pRaw, setPRaw]   = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const smoothP = useSpring(scrollYProgress, { stiffness: 50, damping: 22, mass: 0.6 });

  useMotionValueEvent(smoothP, 'change', v => {
    setPRaw(v);
    const newPhase = getPhase(v);
    setPhase(newPhase);
    onPhaseChange(newPhase);
  });

  const scoreColor = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;
  const msgCount   = results?.totalUserMessages || results?.stats?.userMessages || 0;
  const scrollNudge = pRaw < 0.04;

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '600vh' }}>
      <div style={{
        position: 'sticky', top: 0,
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
      }}>
        {/* Left: text */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: 'clamp(2rem,5vw,5rem) clamp(1.5rem,4vw,4rem)' }}>
          <GhostText results={results} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>
            {pRaw < 0.08 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                style={{ marginBottom: '2.5rem' }}
              >
                <ActLabel roman="I" title="The Record" pageLabel="01 / Overview" />
                <ThreadSentence>You agreed to terms that described this. They did not describe it fully.</ThreadSentence>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              <PhaseText phase={phase} results={results} score={score} setPage={setPage} key={phase} />
            </AnimatePresence>
            <AnimatePresence>
              {scrollNudge && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.5 }}
                  style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <div style={{ width: 1, height: 24, background: PALETTE.border }} />
                  <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Scroll slowly</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: visual stage */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(2rem,5vw,5rem) clamp(3rem,6vw,6rem) clamp(2rem,5vw,5rem) clamp(1rem,3vw,3rem)',
          borderLeft: `1px solid ${PALETTE.border}`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Faint EXTRACTED watermark on right side */}
          <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', pointerEvents: 'none', zIndex: 0 }}>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 3 }}
              style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3rem,8vw,7rem)', fontWeight: 400, color: 'rgba(26,24,20,0.030)', letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none', whiteSpace: 'nowrap' }}
            >EXTRACTED</motion.span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={phase}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}
            >
              {phase === 'SCORE'  && <ScoreStage  score={score}    color={scoreColor} active={true} />}
              {phase === 'DATA'   && <DataStage   count={msgCount}                    active={true} />}
              {phase === 'MOMENT' && <MomentStage results={results}                   active={true} />}
              {phase === 'RISK'   && <RiskStage   results={results} score={score}     active={true} />}
            </motion.div>
          </AnimatePresence>

          {/* Phase progress line */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: PALETTE.border }}>
            <div style={{ height: '100%', background: PALETTE.red, width: `${Math.max(0, Math.min(100, pRaw * 100))}%`, transition: 'width 0.08s linear' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
