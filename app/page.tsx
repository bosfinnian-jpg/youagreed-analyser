'use client';

import { motion, useAnimationFrame } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState } from 'react';

const COLOR = {
  bg: '#0e0e0d',
  ink: 'rgba(240,238,232,0.92)',
  inkMuted: 'rgba(240,238,232,0.55)',
  inkFaint: 'rgba(240,238,232,0.30)',
  inkTrace: 'rgba(240,238,232,0.12)',
  inkGhost: 'rgba(240,238,232,0.05)',
  rule: 'rgba(240,238,232,0.18)',
  accent: 'rgba(220,60,50,0.85)',
  accentFaint: 'rgba(220,60,50,0.12)',
} as const;

const SERIF = "'EB Garamond', 'Times New Roman', Georgia, serif";
const MONO = "'Courier Prime', 'Courier New', ui-monospace, monospace";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Slowly rotating radar grid ──────────────────────────────────────────────
function RadarBg() {
  const ref = useRef<SVGGElement>(null);
  const angle = useRef(0);
  useAnimationFrame((_, delta) => {
    angle.current += delta * 0.004;
    if (ref.current) ref.current.style.transform = `rotate(${angle.current}deg)`;
  });

  const rings = [120, 220, 320, 420, 520];
  const spokes = 12;

  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="radarFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={COLOR.inkGhost} stopOpacity="1" />
          <stop offset="100%" stopColor={COLOR.inkGhost} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Static outer rings */}
      <g style={{ transform: 'translate(50%, 50%)' }}>
        {rings.map(r => (
          <circle key={r} cx={0} cy={0} r={r}
            fill="none" stroke="rgba(240,238,232,0.04)" strokeWidth="1" />
        ))}
        {/* Rotating spoke group */}
        <g ref={ref} style={{ transformOrigin: '0 0' }}>
          {Array.from({ length: spokes }).map((_, i) => {
            const a = (i / spokes) * Math.PI * 2;
            return (
              <line key={i}
                x1={0} y1={0}
                x2={Math.cos(a) * 600} y2={Math.sin(a) * 600}
                stroke="rgba(240,238,232,0.025)" strokeWidth="1"
              />
            );
          })}
        </g>
        {/* Crosshair */}
        <line x1={-600} y1={0} x2={600} y2={0} stroke="rgba(240,238,232,0.03)" strokeWidth="1" />
        <line x1={0} y1={-600} x2={0} y2={600} stroke="rgba(240,238,232,0.03)" strokeWidth="1" />
        {/* Red accent arc — top-right quadrant only */}
        <path
          d={`M ${Math.cos(-0.3) * 220} ${Math.sin(-0.3) * 220} A 220 220 0 0 1 ${Math.cos(0.8) * 220} ${Math.sin(0.8) * 220}`}
          fill="none" stroke="rgba(220,60,50,0.18)" strokeWidth="1.5"
        />
        {/* Centre dot */}
        <circle cx={0} cy={0} r={3} fill="rgba(220,60,50,0.35)" />
        <circle cx={0} cy={0} r={7} fill="none" stroke="rgba(220,60,50,0.15)" strokeWidth="1" />
      </g>
    </svg>
  );
}

// ── Corner coordinate marks ──────────────────────────────────────────────────
function CornerMarks() {
  const marks = [
    { x: 32, y: 80, label: '00.000°N' },
    { x: 'calc(100% - 32px)', y: 80, label: '00.000°E', right: true },
  ];
  return (
    <>
      {marks.map((m, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: m.y,
          left: m.right ? undefined : (m.x as number),
          right: m.right ? 32 : undefined,
          fontFamily: MONO,
          fontSize: '9px',
          letterSpacing: '0.16em',
          color: 'rgba(240,238,232,0.12)',
          textTransform: 'uppercase',
          zIndex: 2,
        }}>{m.label}</div>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
        html, body { background: ${COLOR.bg}; margin: 0; padding: 0;
          -webkit-font-smoothing: antialiased; }
        ::selection { background: ${COLOR.accent}; color: ${COLOR.bg}; }
        @media (max-width: 640px) {
          .ya-header, .ya-footer { padding-left: 24px !important; padding-right: 24px !important; font-size: 10px !important; }
          .ya-hero { padding: 48px 24px !important; }
        }
      `}</style>

      <main style={{
        minHeight: '100vh', background: COLOR.bg, color: COLOR.ink,
        fontFamily: SERIF, display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>

        {/* Radar background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RadarBg />
        </div>

        {/* Corner coordinate labels */}
        <CornerMarks />

        {/* Scan line — horizontal sweep, one pass */}
        <motion.div
          initial={{ top: '-2px', opacity: 0.6 }}
          animate={{ top: '100vh', opacity: 0 }}
          transition={{ duration: 3.5, delay: 0.5, ease: 'linear' }}
          style={{
            position: 'absolute', left: 0, right: 0, height: '1px',
            background: `linear-gradient(90deg, transparent, rgba(220,60,50,0.4), transparent)`,
            zIndex: 1, pointerEvents: 'none',
          }}
        />

        {/* Header */}
        <motion.header className="ya-header"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          style={{
            padding: '32px 48px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontFamily: MONO, fontSize: '11px',
            letterSpacing: '0.15em', textTransform: 'uppercase', color: COLOR.inkFaint,
            borderBottom: `1px solid ${COLOR.inkTrace}`, position: 'relative', zIndex: 2,
          }}
        >
          <span>trace.ai</span>
          <span>A critical web tool</span>
        </motion.header>

        {/* Hero */}
        <section className="ya-hero" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          padding: '80px 48px', position: 'relative', zIndex: 2,
        }}>
          <div style={{ maxWidth: '720px', width: '100%' }}>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
              style={{ textAlign: 'center', marginBottom: '64px' }}
            >
              <h1 style={{
                fontFamily: SERIF, fontWeight: 400,
                fontSize: 'clamp(72px, 13vw, 168px)',
                lineHeight: 0.95, letterSpacing: '-0.02em', margin: 0, color: COLOR.ink,
              }}>
                trace<span style={{ color: COLOR.accent }}>.ai</span>
              </h1>
            </motion.div>

            {/* Rule with endpoint marks */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.1, ease: EASE }}
              style={{ position: 'relative', width: '80px', margin: '0 auto 56px', transformOrigin: 'center' }}
            >
              <div style={{ height: '1px', background: COLOR.rule }} />
              <div style={{ position: 'absolute', left: 0, top: '-2px', width: '4px', height: '4px', border: `1px solid ${COLOR.rule}` }} />
              <div style={{ position: 'absolute', right: 0, top: '-2px', width: '4px', height: '4px', border: `1px solid ${COLOR.rule}` }} />
            </motion.div>

            {/* Statement */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 1.4, ease: EASE }}
              style={{
                fontFamily: SERIF, fontSize: 'clamp(17px, 1.6vw, 20px)',
                lineHeight: 1.65, color: COLOR.inkMuted,
                maxWidth: '560px', margin: '0 auto', textAlign: 'center',
              }}
            >
              <p style={{ margin: '0 0 24px 0' }}>
                This is a critical web tool. It takes your exported
                ChatGPT history and produces the dossier a data broker would build from it.
              </p>
              <p style={{ margin: 0 }}>
                The analysis runs in your browser. Nothing is uploaded.
                What you learn is not reversible.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.6, ease: EASE }}
              style={{ marginTop: '80px', textAlign: 'center' }}
            >
              <Link
                href="/terms"
                style={{
                  display: 'inline-block', fontFamily: MONO, fontSize: '12px',
                  letterSpacing: '0.2em', textTransform: 'uppercase', color: COLOR.ink,
                  textDecoration: 'none', padding: '14px 28px',
                  border: `1px solid ${COLOR.rule}`,
                  transition: 'background 400ms ease, border-color 400ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,238,232,0.04)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(240,238,232,0.40)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = COLOR.rule;
                }}
              >
                Upload your data →
              </Link>
              <div style={{
                marginTop: '20px', fontFamily: MONO, fontSize: '11px',
                letterSpacing: '0.15em', textTransform: 'uppercase', color: COLOR.inkFaint,
              }}>
                You will first review the terms of service.
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <motion.footer className="ya-footer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.6, ease: EASE }}
          style={{
            padding: '28px 48px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontFamily: MONO, fontSize: '10px',
            letterSpacing: '0.15em', textTransform: 'uppercase', color: COLOR.inkFaint,
            borderTop: `1px solid ${COLOR.inkTrace}`, position: 'relative', zIndex: 2,
          }}
        >
          <span>MMXXVI</span>
        </motion.footer>
      </main>
    </>
  );
}
