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

export type DashPage = 'overview' | 'profile' | 'sources' | 'risk' | 'understand' | 'permanent' | 'resist' | 'sources-detail';

// ============================================================================
// NAV
// ============================================================================
const NAV_ITEMS: { id: DashPage; label: string; short: string }[] = [
  { id: 'overview',  label: 'Overview',   short: '01' },
  { id: 'profile',   label: 'Profile',    short: '02' },
  { id: 'risk',      label: 'Risk',       short: '04' },
  { id: 'understand',label: 'Understand', short: '05' },
  { id: 'permanent', label: 'Permanent',  short: '06' },
  { id: 'resist',    label: 'Resist',     short: '07' },
  { id: 'sources',   label: 'Sources',   short: '03' },
];

// Four-act structure for the hamburger drawer
const ACT_STRUCTURE = [
  { roman: 'I',   label: 'The Record',      ids: ['overview'] as DashPage[] },
  { roman: 'II',  label: 'The Inference',   ids: ['profile', 'risk', 'understand'] as DashPage[] },
  { roman: 'III', label: 'The Permanence',  ids: ['permanent'] as DashPage[] },
  { roman: 'IV',  label: 'After',           ids: ['resist'] as DashPage[] },
] as const;

// ============================================================================
// SHARED NARRATIVE COMPONENTS — exported for use across all result pages
// ============================================================================
export function ActLabel({ roman, title, pageLabel }: { roman: string; title: string; pageLabel: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.4em',
        color: PALETTE.inkGhost, textTransform: 'uppercase', marginBottom: '0.2rem',
      }}>
        ACT {roman} — {title}
      </p>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase',
      }}>
        {pageLabel}
      </p>
    </div>
  );
}

export function ThreadSentence({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: `2px solid ${PALETTE.border}`,
      paddingLeft: '1.25rem',
      marginTop: '0.75rem',
      marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
    }}>
      <p style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
        color: PALETTE.inkMuted,
        lineHeight: 1.75,
        maxWidth: 560,
        fontStyle: 'italic',
      }}>
        {children}
      </p>
    </div>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" style={{ display: 'block' }}>
      <motion.line
        x1="0" y1="1" x2="20" y2="1" stroke={PALETTE.ink} strokeWidth="1.2"
        animate={open ? { y1: 7, y2: 7, rotate: 45, originX: '50%', originY: '50%' } : { y1: 1, y2: 1, rotate: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <motion.line
        x1="0" y1="7" x2="20" y2="7" stroke={PALETTE.ink} strokeWidth="1.2"
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.2 }}
        style={{ transformOrigin: 'left center' }}
      />
      <motion.line
        x1="0" y1="13" x2="20" y2="13" stroke={PALETTE.ink} strokeWidth="1.2"
        animate={open ? { y1: 7, y2: 7, rotate: -45, originX: '50%', originY: '50%' } : { y1: 13, y2: 13, rotate: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </svg>
  );
}

function Nav({ page, setPage, results, exposureScore }: {
  page: DashPage;
  setPage: (p: DashPage) => void;
  results: any;
  exposureScore: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on page change
  useEffect(() => { setMenuOpen(false); }, [page]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const userName = results?.findings?.personalInfo?.names?.[0]?.name;
  const scoreColor = exposureScore >= 70 ? PALETTE.red : exposureScore >= 40 ? PALETTE.amber : PALETTE.green;

  const handleNav = (id: DashPage) => {
    setPage(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: menuOpen ? PALETTE.bgPanel : scrolled ? 'rgba(238,236,229,0.96)' : PALETTE.bg,
          backdropFilter: scrolled && !menuOpen ? 'blur(16px)' : 'none',
          transition: 'background 0.3s',
          borderBottom: `1px solid ${menuOpen ? PALETTE.border : scrolled ? PALETTE.border : 'transparent'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(1.5rem, 4vw, 3rem)',
          height: '56px',
        }}
      >
        {/* Wordmark */}
        <button
          onClick={() => handleNav('overview')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        >
          <span style={{ fontFamily: TYPE.serif, fontSize: '1.15rem', letterSpacing: '-0.02em', color: PALETTE.ink }}>trace</span>
          <span style={{ fontFamily: TYPE.serif, fontSize: '1.15rem', letterSpacing: '-0.02em', color: PALETTE.red }}>.ai</span>
        </button>

        {/* Desktop nav items — hidden on mobile */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, justifyContent: 'center' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 0.9rem', height: '56px',
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
              {item.label}
              {page === item.id && (
                <motion.div
                  layoutId="nav-active"
                  style={{ position: 'absolute', bottom: 0, left: '0.5rem', right: '0.5rem', height: '1px', background: PALETTE.ink, opacity: 0.4 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right side — score (always) + hamburger (always) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', flexShrink: 0 }}>
          {/* Exposure score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '13px', color: scoreColor, fontWeight: 600, lineHeight: 1 }}>
              {exposureScore}<span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 400 }}>/100</span>
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 1 }}>
              exposure
            </span>
          </div>

          {/* Divider + name — desktop only */}
          {userName && (
            <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
              <div style={{ width: '1px', height: '16px', background: PALETTE.border }} />
              <span style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>
                {userName}
              </span>
            </div>
          )}

          {/* Hamburger — visible always, but especially useful on mobile */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: '0.4rem',
            }}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>

        {/* Scroll progress line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: `${scrollPct * 100}%`, height: '1px',
          background: scoreColor,
          opacity: scrollPct > 0.01 && !menuOpen ? 0.5 : 0,
          transition: 'width 0.12s linear, opacity 0.3s',
          pointerEvents: 'none',
        }} />
      </motion.nav>

      {/* DRAWER — full-screen overlay menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 150,
                background: 'rgba(26,24,20,0.15)',
                backdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer panel — slides in from right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 190,
                width: 'min(340px, 85vw)',
                background: PALETTE.bgPanel,
                borderLeft: `1px solid ${PALETTE.border}`,
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Drawer header */}
              <div style={{
                height: '56px', padding: '0 clamp(1.5rem, 4vw, 2.5rem)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${PALETTE.border}`,
                flexShrink: 0,
              }}>
                <div>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block' }}>
                    The argument
                  </span>
                  <span style={{ fontFamily: TYPE.serif, fontSize: '11px', color: PALETTE.inkFaint, fontStyle: 'italic', letterSpacing: '0.02em' }}>
                    four acts
                  </span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <HamburgerIcon open={true} />
                </button>
              </div>

              {/* Nav — four acts */}
              <div style={{ flex: 1, paddingTop: '0.5rem', paddingBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
                {ACT_STRUCTURE.map((act, actIdx) => (
                  <div key={act.roman}>
                    {/* Act divider */}
                    <div style={{
                      padding: '0.85rem clamp(1.5rem, 4vw, 2.5rem) 0.4rem',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                      <p style={{
                        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.35em',
                        color: PALETTE.inkGhost, textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>ACT {act.roman}</p>
                      <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
                      <p style={{
                        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em',
                        color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>{act.label}</p>
                    </div>
                    {/* Act items */}
                    {act.ids.map((id, i) => {
                      const item = NAV_ITEMS.find(n => n.id === id)!;
                      const isActive = page === item.id;
                      const globalIdx = actIdx * 3 + i;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + globalIdx * 0.05, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          onClick={() => handleNav(item.id)}
                          style={{
                            width: '100%', background: 'none', border: 'none',
                            cursor: 'pointer', textAlign: 'left',
                            padding: '0.85rem clamp(1.5rem, 4vw, 2.5rem)',
                            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = PALETTE.bgElevated; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                        >
                          <span style={{
                            fontFamily: TYPE.serif,
                            fontSize: 'clamp(1.25rem, 2.8vw, 1.6rem)',
                            color: isActive ? PALETTE.ink : PALETTE.inkMuted,
                            letterSpacing: '-0.02em',
                          }}>
                            {item.label}
                            {isActive && (
                              <span style={{
                                display: 'inline-block', width: '4px', height: '4px',
                                borderRadius: '50%', background: PALETTE.red,
                                marginLeft: '0.6rem', verticalAlign: 'middle',
                              }} />
                            )}
                          </span>
                          <span style={{
                            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                            color: isActive ? PALETTE.redMuted : PALETTE.inkFaint,
                            textTransform: 'uppercase',
                          }}>
                            {item.short}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
                {/* Sources — utility */}
                <div style={{
                  marginTop: '0.5rem',
                  borderTop: `1px solid ${PALETTE.border}`,
                  padding: '0.5rem 0 0',
                }}>
                  {(['sources'] as DashPage[]).map(id => {
                    const item = NAV_ITEMS.find(n => n.id === id)!;
                    const isActive = page === item.id;
                    return (
                      <button
                        key={id}
                        onClick={() => handleNav(item.id)}
                        style={{
                          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                          textAlign: 'left', padding: '0.75rem clamp(1.5rem, 4vw, 2.5rem)',
                          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.bgElevated; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span style={{
                          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em',
                          color: isActive ? PALETTE.ink : PALETTE.inkFaint, textTransform: 'uppercase',
                        }}>
                          {item.label}
                          {isActive && <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: PALETTE.red, marginLeft: '0.5rem', verticalAlign: 'middle' }} />}
                        </span>
                        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{item.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer footer — score */}
              <div style={{
                padding: 'clamp(1.5rem, 4vw, 2rem) clamp(1.5rem, 4vw, 2.5rem)',
                borderTop: `1px solid ${PALETTE.border}`,
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Exposure index
                    </p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '2rem', color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {exposureScore}
                      <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.1em', marginLeft: '4px' }}>/100</span>
                    </p>
                  </div>
                  {userName && (
                    <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>
                      {userName}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
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

        /* Nav desktop items — hide on mobile */
        .nav-desktop { display: flex !important; }
        @media (max-width: 700px) {
          .nav-desktop { display: none !important; }
        }

        /* ── Mobile responsive overrides ── */
        @media (max-width: 640px) {
          /* Page padding */
          .dash-page-inner {
            padding-left: 1.25rem !important;
            padding-right: 1.25rem !important;
          }

          /* Two-column grids → single column */
          .ov-two-col { grid-template-columns: 1fr !important; }
          .mob-stack { grid-template-columns: 1fr !important; flex-direction: column !important; }
          .sources-header-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }

          /* Understand inference grid — 3col → stack */
          .understand-inference-grid {
            grid-template-columns: 1fr !important;
          }
          .understand-inference-grid > *:nth-child(2) {
            display: none !important;
          }

          /* Verbal tells — hide frequency badge, it crowds */
          .tells-row { grid-template-columns: 1fr !important; }
          .tells-row > *:last-child { display: none !important; }

          /* Demographic predictions — hide evidence expand, simplify grid */
          .demo-grid {
            grid-template-columns: 1fr auto !important;
            gap: 0.8rem !important;
          }
          .demo-grid > *:nth-child(3) { display: none !important; }

          /* Nav strip cards — reduce padding */
          .nav-strip-card { padding: 1.4rem 1.2rem !important; }

          /* Key findings row — tighter */
          .findings-row { gap: 1rem !important; }

          /* RTB auction — hide segment label on bid rows */
          .bid-row-seg { display: none !important; }

          /* Policy drift comparison — make scrollable rather than breaking */
          .policy-drift-table {
            min-width: 0;
            overflow-x: auto;
          }

          /* Large serif numbers (score hero) — clamp aggressively */
          .score-hero { font-size: clamp(3rem, 15vw, 5rem) !important; }

          /* Remove decorative SVGs on very small screens */
          .deco-svg { display: none !important; }

          /* Stat strip — wrap freely */
          .stat-strip { gap: 1.5rem !important; flex-wrap: wrap !important; }
        }

        /* Section ghost numbers — hide on small screens */
        @media (max-width: 480px) {
          .section-ghost-num { display: none !important; }
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
