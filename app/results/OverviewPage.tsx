'use client';

// ============================================================================
// OVERVIEW PAGE — Act I: The Record
// anime.js handles: score ring draw, spring counter, text scramble,
// section line draws, scroll-stagger findings, spring dots, progress rail.
// Framer Motion handles: simple entrance fades where sufficient.
// Every animation choice is load-bearing. None is decorative.
// ============================================================================

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { animate, stagger, onScroll, createDrawable, createSpring } from 'animejs';
import { PALETTE, TYPE, type DashPage, ActLabel, ThreadSentence } from './DashboardLayout';
import DataProductSummary from './DataProductSummary';
import EmotionalTimelineChart from './EmotionalTimelineChart';
import { ConfidenceLimitations, getActiveEmptyStates, EmptyStateNotice } from './EmptyStatesAndLimitations';
import ClosureSection from './ClosureSection';
import { RetainedTag } from './CannotBeDeletedPage';

const RING_R = 106;
const RING_C = 2 * Math.PI * RING_R;
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%&*';

// ─── Scroll progress rail ────────────────────────────────────────────────────
// A thin red line on the left edge that fills as the user scrolls.
// Scroll depth = exposure depth. The metaphor is literal.
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
    <div style={{ position: 'fixed', left: 'clamp(10px,1.8vw,22px)', top: 0, bottom: 0, width: 1, zIndex: 100, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,24,20,0.07)' }} />
      <div ref={fillRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'rgba(190,40,30,0.55)', transformOrigin: 'top center', transform: 'scaleY(0)' }} />
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'rgba(26,24,20,0.15)' }} />
    </div>
  );
}

// ─── Score ring ──────────────────────────────────────────────────────────────
// SVG arc draws in on load. Number counts up with a spring overshoot.
// The machine is calculating — not a designed reveal, a process completing.
function ScoreRing({ score, color }: { score: number; color: string }) {
  const ringRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const ring = ringRef.current;
    const num = numRef.current;
    if (!ring || !num) return;
    ring.style.strokeDasharray = `${RING_C}`;
    ring.style.strokeDashoffset = `${RING_C}`;
    const obj = { v: 0 };
    const anim = animate(obj, {
      v: score,
      ease: createSpring({ stiffness: 52, damping: 11 }).ease,
      duration: 2400,
      delay: 700,
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
    return () => { anim.cancel(); };
  }, [score]);

  const label = score >= 70 ? 'Severe' : score >= 40 ? 'Moderate' : 'Limited';
  const ticks = Array.from({ length: 60 });
  return (
    <div style={{ position: 'relative', width: 'clamp(220px,28vw,300px)', aspectRatio: '1', flexShrink: 0 }}>
      <svg viewBox="0 0 280 280" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {ticks.map((_, i) => {
          const angle = (i / 60) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const isMajor = i % 15 === 0;
          const isMinor = i % 5 === 0;
          const rInner = RING_R + (isMajor ? 10 : isMinor ? 12 : 13);
          const rOuter = RING_R + (isMajor ? 18 : isMinor ? 17 : 14.5);
          return (
            <line key={i}
              x1={140 + Math.cos(rad) * rInner} y1={140 + Math.sin(rad) * rInner}
              x2={140 + Math.cos(rad) * rOuter} y2={140 + Math.sin(rad) * rOuter}
              stroke={`rgba(26,24,20,${isMajor ? 0.22 : isMinor ? 0.10 : 0.05})`}
              strokeWidth={isMajor ? 1.5 : 0.75}
            />
          );
        })}
        {[70, 85, 100].map((r, i) => (
          <circle key={r} cx={140} cy={140} r={r} fill="none"
            stroke={`rgba(26,24,20,${i === 2 ? 0.05 : 0.03})`} strokeWidth={0.5}
          />
        ))}
        <circle cx={140} cy={140} r={RING_R} fill="none" stroke="rgba(26,24,20,0.08)" strokeWidth={5} />
        <circle ref={ringRef} cx={140} cy={140} r={RING_R}
          fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          transform="rotate(-90 140 140)"
        />
        {[{ val: '0', a: -90 }, { val: '50', a: 90 }, { val: '25', a: 0 }, { val: '75', a: 180 }].map(({ val, a }) => {
          const rad = (a * Math.PI) / 180;
          const lr = RING_R + 26;
          return (
            <text key={val} x={140 + Math.cos(rad) * lr} y={140 + Math.sin(rad) * lr + 3.5}
              textAnchor="middle" fontSize="8" letterSpacing="0.05em"
              fill="rgba(26,24,20,0.20)" fontFamily="'Courier Prime', monospace"
            >{val}</text>
          );
        })}
        <line x1={135} y1={140} x2={145} y2={140} stroke="rgba(26,24,20,0.10)" strokeWidth={0.75} />
        <line x1={140} y1={135} x2={140} y2={145} stroke="rgba(26,24,20,0.10)" strokeWidth={0.75} />
        <circle cx={140} cy={140} r={1.5} fill="rgba(190,40,30,0.40)" />
        <circle cx={140} cy={140} r={5} fill="none" stroke="rgba(190,40,30,0.12)" strokeWidth={0.75} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
        <span ref={numRef} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.8rem,6vw,4.2rem)', fontWeight: 400, color, letterSpacing: '-0.04em', lineHeight: 1 }}>0</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>/ 100</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em', color, textTransform: 'uppercase', marginTop: '0.15rem' }}>{label}</span>
      </div>
    </div>
  );
}

// ─── Ghost text canvas ───────────────────────────────────────────────────────
// The user's own words drift upward behind the hero. Barely visible at first.
// Opacity multiplier tied to scroll progress — words crowd in as they descend.
function GhostText({ results }: { results: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const intensity = useRef(1);
  useEffect(() => {
    const tick = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      intensity.current = 1 + Math.min(window.scrollY / (max * 0.45), 1) * 4.5;
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
    results?.findings?.sensitiveTopics?.forEach((t: any) => { if (t.excerpt) raw.push(t.excerpt.substring(0, 40)); });
    results?.findings?.repetitiveThemes?.forEach((t: any) => { if (t.theme) raw.push(t.theme); });
    const fb = ["I've been feeling", "my doctor said", "I can't stop thinking", "what should I do", "I'm struggling with", "nobody else knows", "I haven't told anyone", "how do I deal with", "I keep worrying about", "it's been getting worse", "I need help", "I don't know how to"];
    const frags = raw.length >= 6 ? raw : fb;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    const ghosts = Array.from({ length: 26 }, (_, i) => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      text: frags[i % frags.length], speed: 8 + Math.random() * 14,
      opacity: 0.022 + Math.random() * 0.030, size: 10 + Math.random() * 7,
      tilt: (Math.random() - 0.5) * 0.05,
    }));
    let last = 0;
    const draw = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (const g of ghosts) {
        g.y -= g.speed * dt;
        if (g.y < -30) { g.y = H + 20; g.x = Math.random() * W; g.text = frags[Math.floor(Math.random() * frags.length)]; }
        ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.tilt);
        ctx.font = `${g.size}px "EB Garamond", Georgia, serif`;
        ctx.fillStyle = `rgba(26,24,20,${g.opacity * intensity.current})`;
        ctx.fillText(g.text, 0, 0); ctx.restore();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [results]);
  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ─── Scramble text ───────────────────────────────────────────────────────────
// Characters cycle through noise before landing. Decoded, not faded.
// Used on moments of revelation: the user's name, the worst excerpt.
function ScrambleText({ text, delay = 0, style }: { text: string; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;
    const chars = Array.from(text);
    const resolved = new Array(chars.length).fill(false);
    let rafId: number;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const t0 = setTimeout(() => {
      const resolveChar = (idx: number) => {
        if (idx >= chars.length) return;
        resolved[idx] = true;
        const gap = chars[idx] === ' ' ? 0 : 36 + idx * 0.7;
        timeouts.push(setTimeout(() => resolveChar(idx + 1), gap));
      };
      resolveChar(0);
      const drawLoop = () => {
        if (resolved.every(r => r)) { el.textContent = text; return; }
        el.textContent = chars.map((c, i) => {
          if (resolved[i]) return c;
          if (c === ' ') return ' ';
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join('');
        rafId = requestAnimationFrame(drawLoop);
      };
      rafId = requestAnimationFrame(drawLoop);
    }, delay);
    return () => { clearTimeout(t0); timeouts.forEach(clearTimeout); cancelAnimationFrame(rafId); };
  }, [text, delay]);
  return <span ref={ref} style={style}>{text}</span>;
}

// ─── Animated section rule ───────────────────────────────────────────────────
// Draws in from the left when it enters the viewport.
// A dossier page being laid in front of you. Each line earns its place.
function AnimatedRule({ label }: { label?: string }) {
  const lineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);
  useEffect(() => {
    const line = lineRef.current;
    const container = containerRef.current;
    if (!line || !container) return;
    line.style.transform = 'scaleX(0)';
    const observer = onScroll({
      target: container,
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        animate(line, { scaleX: [0, 1], duration: 1100, ease: 'outQuint' });
      },
    });
    return () => { observer.revert(); };
  }, []);
  return (
    <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
      <div ref={lineRef} style={{ flex: 1, height: '1px', background: PALETTE.border, transformOrigin: 'left center' }} />
      {label && <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</p>}
    </div>
  );
}

// ─── Overview hero ───────────────────────────────────────────────────────────
function OverviewHero({ score, stats, results }: { score: number; stats: any; results: any }) {
  const scoreColor = score >= 70 ? PALETTE.red : score >= 40 ? PALETTE.amber : PALETTE.green;
  const primaryName = results?.findings?.personalInfo?.names?.[0]?.name;
  const headline = primaryName
    ? `${primaryName}, this was extracted from your conversations.`
    : 'This was extracted from your conversations.';
  const messages = results?.totalUserMessages || stats?.userMessages || 0;
  const timeSpan = stats?.timeSpan || (results?.timespan?.days ? `${results.timespan.days} days` : null);
  const statItems = [
    messages > 0 && { label: 'Messages analysed', value: messages.toLocaleString() },
    timeSpan && { label: 'Time span', value: timeSpan },
    stats?.avgMessageLength && { label: 'Avg message', value: `${stats.avgMessageLength} chars` },
  ].filter(Boolean) as { label: string; value: string }[];
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const els = statRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    els.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(10px)'; });
    const t = setTimeout(() => {
      animate(els, { opacity: [0, 1], translateY: [10, 0], delay: stagger(90), duration: 700, ease: 'outQuint' });
    }, 1900);
    return () => clearTimeout(t);
  }, [statItems.length]);

  return (
    <div style={{ position: 'relative', minHeight: '88vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 'clamp(4rem,8vw,7rem)', paddingBottom: 'clamp(4rem,8vw,7rem)', overflow: 'hidden' }}>
      <GhostText results={results} />
      {/* Watermark — massive, very faint. Fearless at scale, invisible at small. */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingRight: 'clamp(0.5rem,3vw,2rem)', paddingBottom: '0.5rem', pointerEvents: 'none', zIndex: 0 }}>
        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8, duration: 3.5 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(5rem,18vw,15rem)', fontWeight: 400, color: 'rgba(26,24,20,0.026)', letterSpacing: '-0.05em', lineHeight: 1, userSelect: 'none', whiteSpace: 'nowrap' }}
        >EXTRACTED</motion.span>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          <ActLabel roman="I" title="The Record" pageLabel="01 / Overview" />
          <ThreadSentence>You agreed to terms that described this. They did not describe it fully.</ThreadSentence>
        </motion.div>
        {/* Ring + headline */}
        <div className="ov-hero-ring" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2.5rem,6vw,5rem)', marginTop: 'clamp(2.5rem,5vw,4rem)', flexWrap: 'wrap' }}>
          <ScoreRing score={score} color={scoreColor} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}>
              <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.7rem,3.8vw,2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                <ScrambleText text={headline} delay={900} />
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 1.4 }}
              style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem,1.7vw,1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.78, maxWidth: 540, marginBottom: '1.25rem' }}
            >
              You agreed to terms that described this process. They did not describe it fully.
              What follows is a record of what was taken — patterns of thought, disclosed
              vulnerabilities, named people, mapped locations. Each item is permanent.
              None of it can be returned.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.9 }}
              style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}
            >Act I of IV. The record.</motion.p>
          </div>
        </div>
        {/* Stat strip — anime.js stagger */}
        {statItems.length > 0 && (
          <div style={{ marginTop: 'clamp(3rem,6vw,4.5rem)', paddingTop: 'clamp(1.5rem,3vw,2rem)', borderTop: `1px solid ${PALETTE.border}`, display: 'flex', gap: 'clamp(2.5rem,6vw,5rem)', flexWrap: 'wrap' }}>
            {statItems.map((stat, i) => (
              <div key={i} ref={el => { statRefs.current[i] = el; }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{stat.label}</p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem,3vw,2.2rem)', color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1 }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}
        {/* Scroll invitation */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 2.5, delay: 3.2, repeat: Infinity, repeatDelay: 2.5 }}
          style={{ marginTop: 'clamp(2.5rem,5vw,3.5rem)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div style={{ width: 1, height: 28, background: PALETTE.border }} />
          <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Scroll to read the record</span>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Most exposing moment ────────────────────────────────────────────────────
// Red border draws downward — a line being crossed.
// Blockquote scrambles in when it enters the viewport: decoded, not revealed.
function MostExposingMoment({ results }: { results: any }) {
  const moment = results?.juiciestMoments?.[0];
  if (!moment) return null;
  const containerRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<SVGLineElement>(null);
  const quoteRef = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);
  const date = moment.timestamp
    ? new Date(moment.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const excerpt = moment.excerpt
    ? `${moment.excerpt.substring(0, 280)}${moment.excerpt.length > 280 ? '\u2026' : ''}`
    : '';

  useEffect(() => {
    const container = containerRef.current;
    const border = borderRef.current;
    const quote = quoteRef.current;
    if (!container || !border || !quote) return;
    const drawables = createDrawable(border);
    const observer = onScroll({
      target: container,
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        if (drawables.length) {
          animate(drawables, { draw: ['0 0', '0 1'], duration: 900, ease: 'outQuart' });
        }
        const chars = Array.from(excerpt);
        const resolved = new Array(chars.length).fill(false);
        let rafId: number;
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        const resolveChar = (idx: number) => {
          if (idx >= chars.length) return;
          resolved[idx] = true;
          const gap = chars[idx] === ' ' ? 0 : 30 + idx * 0.4;
          timeouts.push(setTimeout(() => resolveChar(idx + 1), gap));
        };
        resolveChar(0);
        const drawScramble = () => {
          if (resolved.every(r => r)) { quote.textContent = `\u201c${excerpt}\u201d`; return; }
          quote.textContent = '\u201c' + chars.map((c, i) => {
            if (resolved[i]) return c;
            if (c === ' ') return ' ';
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }).join('') + '\u201d';
          rafId = requestAnimationFrame(drawScramble);
        };
        rafId = requestAnimationFrame(drawScramble);
        return () => { timeouts.forEach(clearTimeout); cancelAnimationFrame(rafId); };
      },
    });
    return () => { observer.revert(); };
  }, [excerpt]);

  return (
    <div ref={containerRef} style={{ position: 'relative', paddingLeft: 'clamp(1.5rem,4vw,3rem)', paddingTop: '0.5rem', paddingBottom: '0.5rem', marginBottom: 'clamp(4rem,10vw,8rem)' }}>
      <svg style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 3 100">
        <line ref={borderRef} x1={1.5} y1={0} x2={1.5} y2={100} stroke={PALETTE.red} strokeWidth={3} vectorEffect="non-scaling-stroke" />
      </svg>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Most exposing moment</p>
      <blockquote style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem,2.5vw,1.55rem)', color: PALETTE.ink, lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: 700, fontStyle: 'italic' }}>
        <span ref={quoteRef}>&ldquo;{excerpt}&rdquo;</span>
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {date && <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{date}</p>}
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
          \u25cf Retained in model weights \u2014 cannot be unlearned
        </p>
      </div>
    </div>
  );
}

// ─── Key findings ────────────────────────────────────────────────────────────
// Rows animate in with random stagger — not human-ordered, machine-ordered.
// The randomness is the point. A system populating, not a designer revealing.
function KeyFindings({ results, setPage }: { results: any; setPage: (p: DashPage) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const numRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const triggered = useRef(false);
  const emptyStates = results ? getActiveEmptyStates(results) : [];

  const topStats = [
    results?.findings?.sensitiveTopics?.length > 0 && { n: results.findings.sensitiveTopics.length, label: 'sensitive disclosures', color: PALETTE.red },
    results?.findings?.personalInfo?.names?.length > 0 && { n: results.findings.personalInfo.names.length, label: 'people identified', color: PALETTE.ink },
    results?.lifeEvents?.length > 0 && { n: results.lifeEvents.length, label: 'life events detected', color: PALETTE.ink },
  ].filter(Boolean) as { n: number; label: string; color: string }[];

  const rows = [
    results?.findings?.personalInfo?.names?.length > 0 && {
      label: 'People identified',
      value: `${results.findings.personalInfo.names.length} individuals`,
      detail: results.findings.personalInfo.names.slice(0, 3).map((n: any) => n.name).join(', '),
      page: 'profile' as DashPage,
    },
    results?.findings?.personalInfo?.locations?.length > 0 && {
      label: 'Locations mapped',
      value: `${results.findings.personalInfo.locations.length} places`,
      detail: results.findings.personalInfo.locations.slice(0, 2).map((l: any) => l.location).join(', '),
      page: 'profile' as DashPage,
    },
    results?.findings?.sensitiveTopics?.length > 0 && {
      label: 'Sensitive disclosures',
      value: `${results.findings.sensitiveTopics.length} instances`,
      detail: [...new Set(results.findings.sensitiveTopics.slice(0, 3).map((t: any) => t.category?.replace('_', ' ')))].join(', '),
      page: 'profile' as DashPage,
    },
    results?.lifeEvents?.length > 0 && {
      label: 'Life events detected',
      value: `${results.lifeEvents.length} event${results.lifeEvents.length > 1 ? 's' : ''}`,
      detail: results.lifeEvents.slice(0, 2).map((e: any) => e.label).join(', '),
      page: 'risk' as DashPage,
    },
    results?.findings?.repetitiveThemes?.length > 0 && {
      label: 'Recurring themes',
      value: `${results.findings.repetitiveThemes.length} patterns`,
      detail: results.findings.repetitiveThemes.slice(0, 3).map((t: any) => t.theme).join(', '),
      page: 'profile' as DashPage,
    },
  ].filter(Boolean) as any[];

  useEffect(() => {
    const section = sectionRef.current;
    const rowEls = rowsRef.current.filter(Boolean) as HTMLButtonElement[];
    const numEls = numRefs.current.filter(Boolean) as HTMLParagraphElement[];
    if (!section) return;
    rowEls.forEach(r => { r.style.opacity = '0'; r.style.transform = 'translateX(-14px)'; });
    numEls.forEach(n => { n.style.opacity = '0'; n.style.transform = 'translateY(8px)'; });
    const observer = onScroll({
      target: section,
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        if (numEls.length) animate(numEls, { opacity: [0, 1], translateY: [8, 0], delay: stagger(80), duration: 600, ease: 'outQuint' });
        if (rowEls.length) animate(rowEls, { opacity: [0, 1], translateX: [-14, 0], delay: stagger(70, { from: 'random' }), duration: 650, ease: 'outQuint' });
      },
    });
    return () => { observer.revert(); };
  }, [results]);

  return (
    <div ref={sectionRef}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem' }}>Key findings</p>
      {rows.length === 0 ? (
        emptyStates.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {emptyStates.slice(0, 3).map((state: any) => <EmptyStateNotice key={state.key} state={state} />)}
          </div>
        ) : (
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted, lineHeight: 1.7 }}>Insufficient data to generate findings.</p>
        )
      ) : (
        <>
          {topStats.length > 0 && (
            <div style={{ display: 'flex', gap: 'clamp(2rem,5vw,3.5rem)', flexWrap: 'wrap', paddingBottom: 'clamp(1.5rem,4vw,2.5rem)', marginBottom: 'clamp(1.5rem,4vw,2.5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
              {topStats.map((s, i) => (
                <div key={i}>
                  <p ref={el => { numRefs.current[i] = el; }} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem,5vw,3.2rem)', color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.3rem' }}>{s.n}</p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((row: any, i: number) => (
              <button key={i} ref={el => { rowsRef.current[i] = el; }} onClick={() => setPage(row.page)}
                style={{ background: 'none', border: 'none', borderBottom: `1px solid ${PALETTE.border}`, padding: '1.2rem 0', cursor: 'pointer', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '2rem', transition: 'padding-left 0.18s cubic-bezier(0.22,1,0.36,1)', width: '100%' }}
                onMouseEnter={e => { e.currentTarget.style.paddingLeft = '0.6rem'; }}
                onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; }}
              >
                <div>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.35rem' }}>{row.label}</p>
                  <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem,2vw,1.35rem)', color: PALETTE.ink, letterSpacing: '-0.01em', marginBottom: '0.2rem' }}>{row.value}</p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '12px', color: PALETTE.inkMuted, textTransform: 'capitalize', lineHeight: 1.5 }}>{row.detail}</p>
                </div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '14px', color: PALETTE.inkFaint, flexShrink: 0 }}>\u2192</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Active risks ────────────────────────────────────────────────────────────
// Dots spring into view — not faded, sprung. Alive, not static.
function ActiveRisks({ results, score, setPage }: { results: any; score: number; setPage: (p: DashPage) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const triggered = useRef(false);
  const risks = [
    { label: 'Insurance profiling', active: (results?.findings?.sensitiveTopics?.length || 0) > 0 },
    { label: 'Employment screening', active: (results?.totalUserMessages || results?.stats?.userMessages || 0) > 300 },
    { label: 'Breach exposure risk', active: (results?.nighttimeRatio || 0) > 0.05 || (results?.findings?.vulnerabilityPatterns?.length || 0) > 0 },
    { label: 'Data breach exposure', active: score > 40 },
  ];
  const activeCount = risks.filter(r => r.active).length;

  useEffect(() => {
    const section = sectionRef.current;
    const dots = dotRefs.current.filter(Boolean) as HTMLDivElement[];
    const rows = rowRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!section) return;
    dots.forEach(d => { d.style.transform = 'scale(0)'; d.style.opacity = '0'; });
    rows.forEach(r => { r.style.opacity = '0'; });
    const springEase = createSpring({ stiffness: 280, damping: 18 }).ease;
    const observer = onScroll({
      target: section,
      onEnter: () => {
        if (triggered.current) return;
        triggered.current = true;
        animate(rows, { opacity: [0, 1], delay: stagger(80), duration: 500, ease: 'outQuint' });
        animate(dots, { scale: [0, 1], opacity: [0, 1], delay: stagger(100), ease: springEase, duration: 900 });
      },
    });
    return () => { observer.revert(); };
  }, [results, score]);

  return (
    <div ref={sectionRef}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem' }}>Risk categories</p>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem,5vw,3.2rem)', color: activeCount >= 3 ? PALETTE.red : activeCount >= 1 ? PALETTE.amber : PALETTE.green, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.3rem' }}>{activeCount}</p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>active risk{activeCount !== 1 ? 's' : ''} of {risks.length}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2.5rem' }}>
        {risks.map((risk, i) => (
          <div key={i} ref={el => { rowRefs.current[i] = el; }} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div ref={el => { dotRefs.current[i] = el; }} style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: risk.active ? (activeCount >= 3 ? PALETTE.red : PALETTE.amber) : 'transparent', border: risk.active ? 'none' : '1px solid rgba(26,24,20,0.22)' }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '12px', letterSpacing: '0.1em', color: risk.active ? PALETTE.ink : PALETTE.inkFaint, textTransform: 'uppercase' }}>{risk.label}</span>
          </div>
        ))}
      </div>
      <button onClick={() => setPage('risk')}
        style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.ink, textTransform: 'uppercase', background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.65rem 1.1rem', cursor: 'pointer', transition: 'border-color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
      >Full risk assessment \u2192</button>
    </div>
  );
}

// ─── Bottom CTAs ─────────────────────────────────────────────────────────────
function BottomCTAs({ setPage }: { setPage: (p: DashPage) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ duration: 0.7 }}
      style={{ paddingTop: 'clamp(2rem,5vw,3.5rem)', borderTop: `1px solid ${PALETTE.border}` }}
    >
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem,1.8vw,1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 540, marginBottom: '1.5rem', fontStyle: 'italic' }}>
        The record shows what was extracted. Act II shows what the patterns of that record reveal about who you are.
      </p>
      <div style={{ display: 'flex', gap: 'clamp(0.75rem,2vw,1.25rem)', flexWrap: 'wrap' }}>
        <button onClick={() => setPage('profile')}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem,2vw,1.15rem)', letterSpacing: '-0.01em', color: PALETTE.ink, background: 'none', border: `1px solid ${PALETTE.border}`, padding: 'clamp(0.85rem,2vw,1.25rem) clamp(1.25rem,2.5vw,2rem)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', textAlign: 'left', lineHeight: 1.3 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; e.currentTarget.style.background = PALETTE.bgPanel; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; e.currentTarget.style.background = 'none'; }}
        >
          <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.35rem' }}>ACT II</span>
          The inference \u2192
        </button>
        <button onClick={() => setPage('terms')}
          style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em', color: PALETTE.inkFaint, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', padding: 'clamp(0.85rem,2vw,1.25rem) 0', textDecoration: 'underline', textDecorationColor: PALETTE.border }}
        >Skip to: the terms \u2192</button>
      </div>
    </motion.div>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────
export default function OverviewPage({ results, sources, setPage }: { results: any; sources: any[]; setPage: (p: DashPage) => void }) {
  const score = results?.privacyScore || 0;
  const stats = results?.rawStats || results?.stats;
  const hasDeepData = !!(results?.emotionalTimeline && results?.commercialProfile);
  const connected = sources.filter((s: any) => s.connected).length;
  const pad = 'clamp(2rem,6vw,5rem)';

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .ov-two-col { grid-template-columns: 1fr !important; }
          .ov-hero-ring { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
      <ScrollRail />
      <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 'clamp(4rem,10vw,8rem)' }}>
        {connected < sources.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ padding: '0.85rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', borderBottom: `1px solid ${PALETTE.border}`, flexWrap: 'wrap' }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Analysis based on ChatGPT export only</p>
            <button onClick={() => setPage('sources')}
              style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.inkMuted, background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.4rem 0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; }}
            >Add more sources \u2192</button>
          </motion.div>
        )}
        <OverviewHero score={score} stats={stats} results={results} />
        <AnimatedRule />
        {results?.juiciestMoments?.[0] && <MostExposingMoment results={results} />}
        <div className="ov-two-col" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'clamp(3rem,8vw,6rem)', marginBottom: 'clamp(4rem,10vw,8rem)', alignItems: 'start' }}>
          <KeyFindings results={results} setPage={setPage} />
          <ActiveRisks results={results} score={score} setPage={setPage} />
        </div>
        {hasDeepData && results.emotionalTimeline?.weeks?.length > 2 && (
          <div style={{ marginBottom: 'clamp(4rem,10vw,8rem)' }}>
            <AnimatedRule label="Emotional pattern over time" />
            <EmotionalTimelineChart timeline={results.emotionalTimeline} totalMessages={results.totalUserMessages || 0} />
          </div>
        )}
        {hasDeepData && (
          <div style={{ marginBottom: 'clamp(4rem,10vw,8rem)' }}>
            <AnimatedRule label="Commercial profile" />
            <DataProductSummary analysis={results} />
          </div>
        )}
        <div style={{ marginBottom: 'clamp(4rem,10vw,6rem)' }}>
          <BottomCTAs setPage={setPage} />
        </div>
        <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '2rem', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <ConfidenceLimitations />
        </div>
        {hasDeepData && <ClosureSection analysis={results} setPage={setPage} />}
      </div>
    </>
  );
}
