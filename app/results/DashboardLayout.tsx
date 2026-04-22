'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
export const PALETTE = {
  bg: '#eeece5',
  bgPanel: '#faf9f7',
  bgElevated: '#f0ede8',
  bgHover: '#f5f3ef',
  border: 'rgba(26,24,20,0.14)',
  borderHover: 'rgba(26,24,20,0.22)',
  ink: '#1a1816',
  inkMuted: 'rgba(26,24,20,0.58)',
  inkFaint: 'rgba(26,24,20,0.40)',
  inkGhost: 'rgba(26,24,20,0.07)',
  red: 'rgba(190,40,30,0.92)',
  redMuted: 'rgba(190,40,30,0.50)',
  redFaint: 'rgba(190,40,30,0.10)',
  green: 'rgba(30,130,55,0.90)',
  greenFaint: 'rgba(30,130,55,0.10)',
  amber: 'rgba(160,100,0,0.88)',
  amberFaint: 'rgba(160,100,0,0.10)',
};

export const TYPE = {
  serif: '"EB Garamond", Georgia, serif',
  mono: '"Courier Prime", "Courier New", monospace',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

export type DashPage = 'overview' | 'profile' | 'sources' | 'risk' | 'understand' | 'resist' | 'sources-detail';

// ============================================================================
// NAV
// ============================================================================
const NAV_ITEMS: { id: DashPage; label: string; short: string }[] = [
  { id: 'overview',  label: 'Overview',       short: '01' },
  { id: 'profile',   label: 'Profile',    short: '02' },
  { id: 'sources',   label: 'Sources',    short: '03' },
  { id: 'risk',      label: 'Risk',       short: '04' },
  { id: 'understand',label: 'Understand', short: '05' },
  { id: 'resist',    label: 'Resist',         short: '06' },
];

function Nav({ page, setPage, results, exposureScore }: {
  page: DashPage;
  setPage: (p: DashPage) => void;
  results: any;
  exposureScore: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setScrollPct(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const userName = results?.findings?.personalInfo?.names?.[0]?.name;
  const scoreColor = exposureScore >= 70 ? PALETTE.red : exposureScore >= 40 ? PALETTE.amber : PALETTE.green;

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.2 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(238,236,229,0.96)' : PALETTE.bg,
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'background 0.4s, border-color 0.4s',
        borderBottom: `1px solid ${scrolled ? PALETTE.border : 'transparent'}`,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        padding: '0 clamp(1.5rem, 4vw, 3rem)',
        height: '56px',
      }}
    >
      {/* Wordmark — serif, elegant */}
      <button
        onClick={() => setPage('overview')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: '3rem', flexShrink: 0 }}
      >
        <span style={{ fontFamily: TYPE.serif, fontSize: '1.15rem', letterSpacing: '-0.02em', color: PALETTE.ink, fontWeight: 400 }}>
          trace
        </span>
        <span style={{ fontFamily: TYPE.serif, fontSize: '1.15rem', letterSpacing: '-0.02em', color: PALETTE.red }}>
          .ai
        </span>
      </button>

      {/* Centre — nav items */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 1rem', height: '56px',
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.11em',
              textTransform: 'uppercase',
              color: page === item.id ? PALETTE.ink : PALETTE.inkFaint,
              transition: 'color 0.18s',
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.color = PALETTE.inkMuted; }}
            onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.color = PALETTE.inkFaint; }}
          >
            <span className="nav-label-full">{item.label}</span>
            <span className="nav-label-short">{item.short}</span>
            {page === item.id && (
              <motion.div
                layoutId="nav-active"
                style={{
                  position: 'absolute', bottom: 0, left: '0.6rem', right: '0.6rem',
                  height: '1px', background: PALETTE.ink, opacity: 0.45,
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Right — score + name, minimal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '13px', letterSpacing: '0.02em',
            color: scoreColor, fontWeight: 600, lineHeight: 1,
          }}>
            {exposureScore}<span style={{ fontSize: '10px', opacity: 0.55, fontWeight: 400 }}>/100</span>
          </span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 1 }}>
            exposure
          </span>
        </div>

        {userName && <>
          <div style={{ width: '1px', height: '16px', background: PALETTE.border }} />
          <span className="nav-username" style={{
            fontFamily: TYPE.serif, fontSize: '0.9rem',
            color: PALETTE.inkMuted, fontStyle: 'italic',
            letterSpacing: '-0.01em',
          }}>
            {userName}
          </span>
        </>}
      </div>

      {/* Scroll progress line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: `${scrollPct * 100}%`,
        height: '1px', background: scoreColor,
        opacity: scrollPct > 0.01 ? 0.55 : 0,
        transition: 'width 0.12s linear, opacity 0.3s',
        pointerEvents: 'none',
      }} />
    </motion.nav>
  );
}


// ============================================================================
// DASHBOARD LAYOUT WRAPPER
// ============================================================================
export default function DashboardLayout({ results, children, page, setPage }: {
  results: any;
  children: React.ReactNode;
  page: DashPage;
  setPage: (p: DashPage) => void;
}) {
  const exposureScore = results?.privacyScore || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${PALETTE.bg}; color: ${PALETTE.ink}; margin: 0; }
        body::before {
          content:''; position:fixed; inset:0; z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.018; pointer-events:none;
        }
        body::after {
          content:''; position:fixed; inset:0; z-index:0;
          background-image: radial-gradient(circle, rgba(26,24,20,0.09) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 1; pointer-events:none;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        ::selection { background: rgba(190,40,30,0.20); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(26,24,20,0.15); border-radius: 2px; }
        @media (max-width: 640px) {
          .nav-label-full { display: none !important; }
          .nav-label-short { display: inline !important; }
          .nav-username { display: none !important; }
        }
        @media (min-width: 641px) {
          .nav-label-short { display: none !important; }
        }
      `}</style>

      <Nav page={page} setPage={setPage} results={results} exposureScore={exposureScore} />

      <main style={{ paddingTop: '64px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
