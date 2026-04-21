'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// DESIGN SYSTEM
// ============================================================================
export const PALETTE = {
  bg: '#0e0e0d',
  bgPanel: '#141413',
  bgElevated: '#1a1a18',
  bgHover: '#1f1f1d',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  ink: '#f0ede8',
  inkMuted: 'rgba(240,237,232,0.55)',
  inkFaint: 'rgba(240,237,232,0.38)',
  inkGhost: 'rgba(240,237,232,0.08)',
  red: 'rgba(220,60,50,0.90)',
  redMuted: 'rgba(220,60,50,0.45)',
  redFaint: 'rgba(220,60,50,0.10)',
  green: 'rgba(52,199,89,0.85)',
  greenFaint: 'rgba(52,199,89,0.10)',
  amber: 'rgba(255,179,0,0.85)',
  amberFaint: 'rgba(255,179,0,0.10)',
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
  { id: 'profile',   label: 'My Profile',     short: '02' },
  { id: 'sources',   label: 'Data Sources',   short: '03' },
  { id: 'risk',      label: 'Risk Assessment',short: '04' },
  { id: 'understand',label: 'Understand This',short: '05' },
  { id: 'resist',    label: 'Resist',         short: '06' },
];

function Nav({ page, setPage, results, exposureScore }: {
  page: DashPage;
  setPage: (p: DashPage) => void;
  results: any;
  exposureScore: number;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const userName = results?.findings?.personalInfo?.names?.[0]?.name;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(14,14,13,0.96)' : PALETTE.bg,
        borderBottom: `1px solid ${scrolled ? PALETTE.border : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 0.3s, border-color 0.3s',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(1.5rem, 4vw, 3rem)',
        height: '52px',
        gap: '0',
      }}
    >
      {/* Wordmark */}
      <button
        onClick={() => setPage('overview')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: '2.5rem', flexShrink: 0 }}
      >
        <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.ink, textTransform: 'uppercase' }}>
          trace
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
          .ai
        </span>
      </button>

      {/* Nav items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0 0.8rem', height: '52px',
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: page === item.id ? PALETTE.ink : PALETTE.inkFaint,
              borderBottom: page === item.id ? `1px solid ${PALETTE.ink}` : '1px solid transparent',
              transition: 'color 0.2s, border-color 0.2s',
              position: 'relative', top: '1px',
            }}
            onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.color = PALETTE.inkMuted; }}
            onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.color = PALETTE.inkFaint; }}
          >
            <span className="nav-label-full">{item.label}</span>
            <span className="nav-label-short">{item.short}</span>
          </button>
        ))}
      </div>

      {/* Right: user + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.inkMuted, textTransform: 'uppercase' }}>
            Exposure
          </span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '12px', letterSpacing: '0.08em',
            color: exposureScore >= 70 ? PALETTE.red : exposureScore >= 40 ? PALETTE.amber : PALETTE.green,
            fontWeight: 700,
          }}>
            {exposureScore}/100
          </span>
        </div>

        {userName && (
          <div className="nav-username" style={{
            padding: '0.3rem 0.8rem',
            border: `1px solid ${PALETTE.border}`,
          }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em', color: PALETTE.inkMuted, textTransform: 'uppercase' }}>
              {userName}
            </span>
          </div>
        )}
      </div>
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
          background-image: radial-gradient(circle, rgba(240,237,232,0.07) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 1; pointer-events:none;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        ::selection { background: rgba(220,60,50,0.20); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
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

      <main style={{ paddingTop: '52px', position: 'relative', zIndex: 1 }}>
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
