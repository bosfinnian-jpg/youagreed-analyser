'use client';

import { motion, useAnimationFrame, animate } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

const COLOR = {
  bg: '#eeece5',
  ink: '#1a1816',
  inkMuted: 'rgba(26,24,20,0.55)',
  inkFaint: 'rgba(26,24,20,0.32)',
  inkTrace: 'rgba(26,24,20,0.10)',
  inkGhost: 'rgba(26,24,20,0.05)',
  rule: 'rgba(26,24,20,0.15)',
  accent: 'rgba(190,40,30,0.90)',
  accentGlow: 'rgba(190,40,30,0.12)',
} as const;

const SERIF = "'EB Garamond', 'Times New Roman', Georgia, serif";
const MONO = "'Courier Prime', 'Courier New', ui-monospace, monospace";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Slowly rotating radar ────────────────────────────────────────────────────
function RadarBg() {
  const rotRef = useRef<SVGGElement>(null);
  const sweepRef = useRef<SVGPathElement>(null);
  const angle = useRef(0);

  useAnimationFrame((_, delta) => {
    angle.current += delta * 0.003;
    if (rotRef.current) {
      rotRef.current.style.transform = `rotate(${angle.current}deg)`;
    }
    // sweep line follows rotation
    if (sweepRef.current) {
      const a = (angle.current * Math.PI) / 180;
      const x2 = Math.cos(a) * 520;
      const y2 = Math.sin(a) * 520;
      sweepRef.current.setAttribute('d', `M 0 0 L ${x2} ${y2}`);
    }
  });

  const rings = [100, 200, 320, 440, 540];

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="rfade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(26,24,20,0.06)" />
          <stop offset="60%" stopColor="rgba(26,24,20,0.02)" />
          <stop offset="100%" stopColor="rgba(26,24,20,0)" />
        </radialGradient>
        {/* sweep trail gradient */}
        <radialGradient id="sweepGrad" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="rgba(190,40,30,0.12)" />
          <stop offset="100%" stopColor="rgba(190,40,30,0)" />
        </radialGradient>
      </defs>

      <g style={{ transform: 'translate(50%, 50%)' }}>
        {/* Rings */}
        {rings.map((r, i) => (
          <circle key={r} cx={0} cy={0} r={r}
            fill="none"
            stroke={`rgba(26,24,20,${i === 0 ? 0.08 : 0.04})`}
            strokeWidth={i === 0 ? 1 : 0.75}
          />
        ))}

        {/* Static axis lines */}
        <line x1={-580} y1={0} x2={580} y2={0} stroke="rgba(26,24,20,0.06)" strokeWidth={0.75} />
        <line x1={0} y1={-580} x2={0} y2={580} stroke="rgba(26,24,20,0.06)" strokeWidth={0.75} />

        {/* Rotating group */}
        <g ref={rotRef} style={{ transformOrigin: '0 0' }}>
          {/* 8 faint spokes */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line key={i} x1={0} y1={0}
                x2={Math.cos(a) * 540} y2={Math.sin(a) * 540}
                stroke="rgba(26,24,20,0.04)" strokeWidth={0.75}
              />
            );
          })}
        </g>

        {/* Sweep line */}
        <path ref={sweepRef} d="M 0 0 L 520 0"
          stroke="rgba(190,40,30,0.2)" strokeWidth={1}
        />

        {/* Sweep wedge - trailing glow */}
        <circle cx={0} cy={0} r={200} fill="none"
          stroke="rgba(190,40,30,0.03)" strokeWidth={40}
          strokeDasharray={`${0.15 * 2 * Math.PI * 200} ${2 * Math.PI * 200}`}
          strokeDashoffset={0}
          transform="rotate(-8)"
        />

        {/* Inner ring ticks - compass marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const inner = i % 9 === 0 ? 93 : 96;
          return (
            <line key={i}
              x1={Math.cos(a) * inner} y1={Math.sin(a) * inner}
              x2={Math.cos(a) * 100} y2={Math.sin(a) * 100}
              stroke={`rgba(26,24,20,${i % 9 === 0 ? 0.14 : 0.06})`}
              strokeWidth={i % 9 === 0 ? 1 : 0.5}
            />
          );
        })}

        {/* Centre pip */}
        <circle cx={0} cy={0} r={2.5} fill="rgba(190,40,30,0.6)" />
        <circle cx={0} cy={0} r={6} fill="none" stroke="rgba(190,40,30,0.2)" strokeWidth={1} />
        <circle cx={0} cy={0} r={14} fill="none" stroke="rgba(190,40,30,0.07)" strokeWidth={0.75} />
      </g>
    </svg>
  );
}

// ── Letter-by-letter title reveal ────────────────────────────────────────────
function AnimatedTitle() {
  const word1 = 'trace';
  const word2 = '.ai';

  return (
    <h1 style={{
      fontFamily: SERIF, fontWeight: 400,
      fontSize: 'clamp(72px, 13vw, 168px)',
      lineHeight: 0.95, letterSpacing: '-0.02em',
      margin: 0, color: COLOR.ink,
    }}>
      {word1.split('').map((ch, i) => (
        <motion.span key={i}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.3 + i * 0.06, ease: EASE }}
          style={{ display: 'inline-block' }}
        >{ch}</motion.span>
      ))}
      {word2.split('').map((ch, i) => (
        <motion.span key={i}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.6 + i * 0.07, ease: EASE }}
          style={{ display: 'inline-block', color: COLOR.accent }}
        >{ch}</motion.span>
      ))}
    </h1>
  );
}

// ── Sweep-fill CTA button ────────────────────────────────────────────────────
function CTAButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href="/terms"
      style={{
        display: 'inline-block', fontFamily: MONO, fontSize: '12px',
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: hovered ? COLOR.bg : COLOR.ink,
        textDecoration: 'none', padding: '14px 32px',
        border: `1px solid ${hovered ? COLOR.ink : COLOR.rule}`,
        position: 'relative', overflow: 'hidden',
        transition: 'color 0.4s ease, border-color 0.4s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Sweep fill */}
      <motion.span
        animate={{ x: hovered ? '0%' : '-105%' }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute', inset: 0,
          background: COLOR.ink,
          display: 'block',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>
        Upload your data →
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
        html, body { background: ${COLOR.bg}; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        body { -webkit-tap-highlight-color: rgba(190,40,30,0.12); -webkit-text-size-adjust: 100%; }
        ::selection { background: ${COLOR.accent}; color: ${COLOR.bg}; }
        @media (max-width: 640px) {
          .ya-header, .ya-footer { padding-left: 24px !important; padding-right: 24px !important; font-size: 10px !important; }
          .ya-header .ya-header-meta { display: none !important; }
          .ya-hero { padding: 32px 20px !important; }
          .ya-corner-meta { display: none !important; }
        }
        .ya-page { min-height: 100vh; min-height: 100dvh; }
      `}</style>

      <main className="ya-page" style={{
        background: COLOR.bg, color: COLOR.ink,
        fontFamily: SERIF, display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Radar */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RadarBg />
        </div>

        {/* Radial light bloom behind title - pulses once */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 3.5, delay: 0.8, times: [0, 0.3, 1] }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600, height: 300,
            background: 'radial-gradient(ellipse, rgba(190,40,30,0.06) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 1,
          }}
        />

        {/* Corner meta labels */}
        {[
          { style: { top: 80, left: 40 }, text: '51.5074°N' },
          { style: { top: 80, right: 40 }, text: '0.1278°W' },
          { style: { bottom: 60, left: 40 }, text: 'INITIATED' },
          { style: { bottom: 60, right: 40 }, text: 'TRACE.AI / 2026' },
        ].map((m, i) => (
          <motion.div key={i}
            className="ya-corner-meta"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 2.2 + i * 0.1, duration: 1 }}
            style={{
              position: 'absolute', ...m.style,
              fontFamily: MONO, fontSize: '9px', letterSpacing: '0.18em',
              color: 'rgba(26,24,20,0.15)', textTransform: 'uppercase', zIndex: 2,
            }}
          >{m.text}</motion.div>
        ))}

        {/* Header */}
        <motion.header className="ya-header"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
          style={{
            padding: '0 48px', height: '52px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'relative', zIndex: 2,
            borderBottom: `1px solid ${COLOR.inkTrace}`,
          }}
        >
          {/* Wordmark - matches dashboard */}
          <span style={{ fontFamily: SERIF, fontSize: '1.1rem', letterSpacing: '-0.02em', color: COLOR.ink }}>
            trace<span style={{ color: COLOR.accent }}>.ai</span>
          </span>

          {/* Right - minimal classification meta */}
          <div className="ya-header-meta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: COLOR.inkFaint }}>
              Critical web tool
            </span>
            <div style={{ width: '1px', height: '12px', background: COLOR.inkTrace }} />
            <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: COLOR.inkFaint }}>
              2026
            </span>
          </div>
        </motion.header>

        {/* Vertical margin rules - printed document feel */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.4 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
        >
          <div style={{
            position: 'absolute', top: '15%', bottom: '15%',
            left: 'clamp(20px, 5vw, 80px)',
            width: '1px',
            background: 'linear-gradient(180deg, transparent, rgba(26,24,20,0.08) 30%, rgba(26,24,20,0.08) 70%, transparent)',
          }} />
          <div style={{
            position: 'absolute', top: '15%', bottom: '15%',
            right: 'clamp(20px, 5vw, 80px)',
            width: '1px',
            background: 'linear-gradient(180deg, transparent, rgba(26,24,20,0.08) 30%, rgba(26,24,20,0.08) 70%, transparent)',
          }} />
        </motion.div>

        {/* Hero */}
        <section className="ya-hero" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          padding: '80px 48px', position: 'relative', zIndex: 2,
        }}>
          <div style={{ maxWidth: '720px', width: '100%', textAlign: 'center' }}>

            <div style={{ marginBottom: '64px' }}>
              <AnimatedTitle />
            </div>

            {/* Rule */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.4, delay: 1.0, ease: EASE }}
              style={{ position: 'relative', width: '80px', margin: '0 auto 56px', transformOrigin: 'center' }}
            >
              <div style={{ height: '1px', background: COLOR.rule }} />
              <div style={{ position: 'absolute', left: 0, top: '-2px', width: '4px', height: '4px', border: `1px solid ${COLOR.rule}` }} />
              <div style={{ position: 'absolute', right: 0, top: '-2px', width: '4px', height: '4px', border: `1px solid ${COLOR.rule}` }} />
            </motion.div>

            {/* Statement */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 1.3, ease: EASE }}
              style={{ maxWidth: '580px', margin: '0 auto' }}
            >
              <p style={{
                fontFamily: SERIF, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
                lineHeight: 1.75, color: 'rgba(26,24,20,0.78)',
                margin: '0 0 1.6rem',
              }}>
                This is a critical web tool. It takes your exported
                ChatGPT history and produces the dossier a data broker would build from it.
              </p>
              <p style={{
                fontFamily: SERIF, fontSize: 'clamp(1rem, 1.7vw, 1.2rem)',
                lineHeight: 1.75, color: 'rgba(26,24,20,0.50)',
                margin: 0,
                fontStyle: 'italic',
              }}>
                The analysis runs in your browser. Nothing is uploaded.
                What you learn is not reversible.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.7, ease: EASE }}
              style={{ marginTop: '72px' }}
            >
              <CTAButton />
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 2.1, duration: 0.8 }}
                style={{
                  marginTop: '20px', fontFamily: MONO, fontSize: '11px',
                  letterSpacing: '0.15em', textTransform: 'uppercase', color: COLOR.inkFaint,
                }}
              >
                You will first review the terms of service.
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <motion.footer className="ya-footer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.6, ease: EASE }}
          style={{
            height: '44px', padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: COLOR.inkFaint,
            borderTop: `1px solid ${COLOR.inkTrace}`, position: 'relative', zIndex: 2,
          }}
        >
          <span>No data leaves your browser during analysis</span>
          <span>University of Leeds / 2026</span>
        </motion.footer>
      </main>
    </>
  );
}
