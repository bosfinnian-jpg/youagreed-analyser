'use client';

import { useState, useEffect, useRef } from 'react';
import { getPageColorHex } from './DataThread';
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

export type DashPage = 'overview' | 'profile' | 'commercial-profile' | 'sources' | 'risk' | 'understand' | 'terms' | 'permanent' | 'resist' | 'sources-detail';

// ============================================================================
// FOUR-ACT STRUCTURE
// ============================================================================
const ACTS = [
  {
    id: 'record',
    label: 'Record',
    roman: 'I',
    title: 'The Record',
    pages: [
      { id: 'overview' as DashPage, label: 'Overview', short: '01', desc: 'What was extracted' },
    ],
  },
  {
    id: 'infer',
    label: 'Infer',
    roman: 'II',
    title: 'The Inference',
    pages: [
      { id: 'profile' as DashPage, label: 'Personal Profile', short: '02', desc: 'What the patterns reveal about you' },
      { id: 'commercial-profile' as DashPage, label: 'Commercial Profile', short: '03', desc: 'How your data is valued' },
      { id: 'risk' as DashPage, label: 'Risk', short: '04', desc: 'What the record enables' },
    ],
  },
  {
    id: 'delete',
    label: 'Delete',
    roman: 'III',
    title: 'The Permanence',
    pages: [
      { id: 'permanent' as DashPage, label: 'Permanent', short: '05', desc: 'Why it cannot be removed' },
      { id: 'terms' as DashPage, label: 'Terms', short: '06', desc: 'What you agreed to' },
    ],
  },
  {
    id: 'resist',
    label: 'Resist',
    roman: 'IV',
    title: 'After',
    pages: [
      { id: 'understand' as DashPage, label: 'Understand', short: '07', desc: 'How inference works' },
      { id: 'resist' as DashPage, label: 'Resist', short: '08', desc: 'What remains possible' },
    ],
  },
] as const;

// ============================================================================
// SHARED NARRATIVE COMPONENTS
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

// ============================================================================
// HAMBURGER ICON
// ============================================================================
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" style={{ display: 'block' }}>
      <motion.line
        x1="0" y1="1" x2="20" y2="1" stroke={PALETTE.ink} strokeWidth="1.2"
        animate={open ? { y1: 7, y2: 7, rotate: 45 } : { y1: 1, y2: 1, rotate: 0 }}
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
        animate={open ? { y1: 7, y2: 7, rotate: -45 } : { y1: 13, y2: 13, rotate: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </svg>
  );
}

// ============================================================================
// ACT DROPDOWN — hover panel beneath each act label
// ============================================================================
function ActDropdown({ act, currentPage, onNav, visible }: {
  act: typeof ACTS[number];
  currentPage: DashPage;
  onNav: (id: DashPage) => void;
  visible: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '0px',
            background: PALETTE.bgPanel,
            border: `1px solid ${PALETTE.border}`,
            minWidth: act.pages.length === 1 ? '180px' : '220px',
            zIndex: 300,
            boxShadow: '0 8px 24px rgba(26,24,20,0.08)',
          }}
        >
          {/* Act header */}
          <div style={{
            padding: '0.6rem 1rem 0.5rem',
            borderBottom: `1px solid ${PALETTE.border}`,
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.35em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
              ACT {act.roman}
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
              {act.title}
            </span>
          </div>
          {/* Pages */}
          {act.pages.map(p => {
            const isActive = currentPage === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onNav(p.id)}
                style={{
                  width: '100%', background: isActive ? PALETTE.bgElevated : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  padding: '0.7rem 1rem',
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'background 0.12s',
                  borderBottom: `1px solid ${PALETTE.border}`,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = PALETTE.bgElevated; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <div>
                  <span style={{
                    display: 'block',
                    fontFamily: TYPE.serif,
                    fontSize: '1rem',
                    color: isActive ? PALETTE.ink : PALETTE.inkMuted,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}>
                    {p.label}
                    {isActive && (
                      <span style={{
                        display: 'inline-block', width: '4px', height: '4px',
                        borderRadius: '50%', background: PALETTE.red,
                        marginLeft: '0.5rem', verticalAlign: 'middle',
                      }} />
                    )}
                  </span>
                  <span style={{
                    display: 'block',
                    fontFamily: TYPE.mono, fontSize: '9px',
                    color: PALETTE.inkFaint, letterSpacing: '0.06em',
                    marginTop: '2px',
                  }}>
                    {p.desc}
                  </span>
                </div>
                <span style={{
                  fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
                  color: isActive ? PALETTE.redMuted : PALETTE.inkGhost,
                  textTransform: 'uppercase', flexShrink: 0,
                }}>
                  {p.short}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// NAV
// ============================================================================
function Nav({ page, setPage, results, exposureScore }: {
  page: DashPage;
  setPage: (p: DashPage) => void;
  results: any;
  exposureScore: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredAct, setHoveredAct] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => { setMenuOpen(false); }, [page]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const userName = results?.findings?.personalInfo?.names?.[0]?.name;
  const scoreColor = exposureScore >= 70 ? PALETTE.red : exposureScore >= 40 ? PALETTE.amber : PALETTE.green;

  const handleNav = (id: DashPage) => {
    setPage(id);
    setMenuOpen(false);
    setHoveredAct(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const currentAct = ACTS.find(a => a.pages.some(p => p.id === page));

  const handleActEnter = (actId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredAct(actId);
  };

  const handleActLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredAct(null), 120);
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
          borderBottom: `1px solid ${menuOpen || scrolled ? PALETTE.border : 'transparent'}`,
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

        {/* Desktop act nav — hover dropdowns */}
        <div
          className="nav-desktop"
          style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: 1, justifyContent: 'center', gap: '0' }}
        >
          {ACTS.map((act) => {
            const isCurrentAct = currentAct?.id === act.id;
            const isHovered = hoveredAct === act.id;

            return (
              <div
                key={act.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => handleActEnter(act.id)}
                onMouseLeave={handleActLeave}
              >
                <button
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '0 1.1rem', height: '56px',
                    fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: isCurrentAct ? PALETTE.ink : isHovered ? PALETTE.inkMuted : PALETTE.inkFaint,
                    transition: 'color 0.15s',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}
                >
                  <span style={{
                    fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em',
                    color: isCurrentAct ? PALETTE.redMuted : PALETTE.inkGhost,
                    transition: 'color 0.15s',
                  }}>
                    {act.roman}
                  </span>
                  {act.label}
                  {isCurrentAct && (
                    <motion.div
                      layoutId="nav-active"
                      style={{
                        position: 'absolute', bottom: 0, left: '0.6rem', right: '0.6rem',
                        height: '1px', background: PALETTE.ink, opacity: 0.35,
                      }}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                </button>

                <ActDropdown
                  act={act}
                  currentPage={page}
                  onNav={handleNav}
                  visible={isHovered}
                />
              </div>
            );
          })}
        </div>

        {/* Right side */}
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.6rem, 2.5vw, 1.4rem)', flexShrink: 0 }}>
          {/* Exposure score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
            <span className="nav-exposure-score" style={{ fontFamily: TYPE.mono, fontSize: '13px', color: scoreColor, fontWeight: 600, lineHeight: 1 }}>
              {exposureScore}<span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 400 }}>/100</span>
            </span>
            <span className="nav-exposure-label" style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 1 }}>
              exposure
            </span>
          </div>

          {/* Name — desktop only */}
          {userName && (
            <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
              <div style={{ width: '1px', height: '16px', background: PALETTE.border }} />
              <span style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>
                {userName}
              </span>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '44px', minHeight: '44px',
              marginLeft: '0.2rem',
            }}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>

        {/* Scroll progress */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: `${scrollPct * 100}%`, height: '1px',
          background: getPageColorHex(page),
          opacity: scrollPct > 0.01 && !menuOpen ? 0.65 : 0,
          transition: 'width 0.12s linear, opacity 0.3s',
          pointerEvents: 'none',
        }} />
      </motion.nav>

      {/* DRAWER */}
      <AnimatePresence>
        {menuOpen && (
          <>
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

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 190,
                width: 'min(320px, 88vw)',
                background: PALETTE.bgPanel,
                borderLeft: `1px solid ${PALETTE.border}`,
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Drawer header */}
              <div style={{
                height: '56px', padding: '0 1.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${PALETTE.border}`,
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
                  The argument
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <HamburgerIcon open={true} />
                </button>
              </div>

              {/* Acts */}
              <div style={{ flex: 1, padding: '0.25rem 0 1.5rem' }}>
                {ACTS.map((act, actIdx) => (
                  <div key={act.id}>
                    {/* Act label row */}
                    <div style={{
                      padding: '1rem 1.75rem 0.3rem',
                      display: 'flex', alignItems: 'center', gap: '0.65rem',
                    }}>
                      <span style={{
                        fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.4em',
                        color: PALETTE.redMuted, textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>
                        {act.roman}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
                      <span style={{
                        fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.25em',
                        color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>
                        {act.title}
                      </span>
                    </div>

                    {/* Pages */}
                    {act.pages.map((p, i) => {
                      const isActive = page === p.id;
                      return (
                        <motion.button
                          key={p.id}
                          initial={{ opacity: 0, x: 14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.04 + actIdx * 0.06 + i * 0.04, duration: 0.28 }}
                          onClick={() => handleNav(p.id)}
                          style={{
                            width: '100%', background: isActive ? PALETTE.bgElevated : 'none',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                            padding: '0.7rem 1.75rem',
                            minHeight: '44px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'background 0.13s',
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = PALETTE.bgElevated; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? PALETTE.bgElevated : 'none'; }}
                        >
                          <div>
                            <span style={{
                              display: 'block',
                              fontFamily: TYPE.serif,
                              fontSize: 'clamp(1.15rem, 2.5vw, 1.45rem)',
                              color: isActive ? PALETTE.ink : PALETTE.inkMuted,
                              letterSpacing: '-0.02em', lineHeight: 1.2,
                            }}>
                              {p.label}
                              {isActive && (
                                <span style={{
                                  display: 'inline-block', width: '4px', height: '4px',
                                  borderRadius: '50%', background: PALETTE.red,
                                  marginLeft: '0.5rem', verticalAlign: 'middle',
                                }} />
                              )}
                            </span>
                            <span style={{
                              display: 'block',
                              fontFamily: TYPE.mono, fontSize: '9px',
                              color: PALETTE.inkFaint, letterSpacing: '0.05em',
                              marginTop: '2px',
                            }}>
                              {p.desc}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
                            color: isActive ? PALETTE.redMuted : PALETTE.inkGhost,
                            textTransform: 'uppercase',
                          }}>
                            {p.short}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ))}

                {/* Sources — utility */}
                <div style={{ marginTop: '0.75rem', borderTop: `1px solid ${PALETTE.border}` }}>
                  <button
                    onClick={() => handleNav('sources')}
                    style={{
                      width: '100%', background: page === 'sources' ? PALETTE.bgElevated : 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      padding: '0.8rem 1.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.13s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.bgElevated; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = page === 'sources' ? PALETTE.bgElevated : 'none'; }}
                  >
                    <span style={{
                      fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em',
                      color: PALETTE.inkFaint, textTransform: 'uppercase',
                    }}>
                      Sources
                    </span>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkGhost }}>03</span>
                  </button>
                </div>
              </div>

              {/* Footer score */}
              <div style={{
                padding: '1.5rem 1.75rem',
                borderTop: `1px solid ${PALETTE.border}`,
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Exposure index
                    </p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '2rem', color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {exposureScore}
                      <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, letterSpacing: '0.1em', marginLeft: '4px' }}>/100</span>
                    </p>
                  </div>
                  {userName && (
                    <span style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>
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
        html {
          scroll-behavior: smooth;
          /* Prevent horizontal scroll surprises from oversized SVG/text */
          overflow-x: hidden;
          /* Better text rendering on mobile */
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }
        body {
          background: ${PALETTE.bg};
          color: ${PALETTE.ink};
          margin: 0;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          /* Better tap highlight for buttons */
          -webkit-tap-highlight-color: rgba(190,40,30,0.12);
        }

        /* Improve interactive element feedback on touch */
        button, a, [role="button"] {
          -webkit-tap-highlight-color: rgba(190,40,30,0.12);
          touch-action: manipulation;
        }

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

        /* On mobile, hide native scrollbar entirely — visual chrome handles it */
        @media (max-width: 768px) {
          ::-webkit-scrollbar { display: none; }
          html { scrollbar-width: none; }
        }

        .nav-desktop { display: flex !important; }
        @media (max-width: 700px) {
          .nav-desktop { display: none !important; }
        }

        /* ────────────────────────────────────────────────────────
           DYNAMIC VIEWPORT HEIGHT — fixes iOS Safari URL bar collapse
           Use .full-height-screen instead of minHeight: 100vh.
           ──────────────────────────────────────────────────────── */
        .full-height-screen {
          min-height: 100vh;
          min-height: 100dvh;
        }
        .full-height-fixed {
          height: 100vh;
          height: 100dvh;
        }

        /* ────────────────────────────────────────────────────────
           MOBILE NAV — name hidden, exposure score compacted
           ──────────────────────────────────────────────────────── */
        @media (max-width: 700px) {
          .nav-exposure-label { display: none !important; }
          .nav-exposure-score { font-size: 12px !important; }
        }

        /* ────────────────────────────────────────────────────────
           TABLET / SMALL DESKTOP (640–768px)
           ──────────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          /* Hide all desktop-only side rails on smaller screens */
          .ov-right-rail, .resist-right-rail { display: none !important; }
        }

        /* ────────────────────────────────────────────────────────
           MOBILE BREAKPOINT (≤640px)
           ──────────────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .dash-page-inner {
            padding-left: 1.25rem !important;
            padding-right: 1.25rem !important;
          }
          .ov-two-col { grid-template-columns: 1fr !important; }
          .mob-stack { grid-template-columns: 1fr !important; flex-direction: column !important; }
          .sources-header-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .etl-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .understand-inference-grid { grid-template-columns: 1fr !important; }
          .understand-inference-grid > *:nth-child(2) { display: none !important; }
          .tells-row { grid-template-columns: 1fr !important; }
          .tells-row > *:last-child { display: none !important; }
          .demo-grid { grid-template-columns: 1fr auto !important; gap: 0.8rem !important; }
          .demo-grid > *:nth-child(3) { display: none !important; }

          /* ProfilePage demographic predictions: stack attribute + value + bar across full row width */
          .prof-demo-row {
            grid-template-columns: 1fr 24px !important;
            grid-template-areas:
              "attr  plus"
              "value plus"
              "conf  conf" !important;
            gap: 0.4rem 0.75rem !important;
            row-gap: 0.55rem !important;
          }
          .prof-demo-row .prof-demo-attr { grid-area: attr; }
          .prof-demo-row .prof-demo-val  { grid-area: value; font-size: 1.15rem !important; }
          .prof-demo-row .prof-demo-conf { grid-area: conf; }
          .prof-demo-row .prof-demo-plus { grid-area: plus; align-self: center; text-align: right; }
          .nav-strip-card { padding: 1.4rem 1.2rem !important; }
          .findings-row { gap: 1rem !important; }
          .bid-row-seg { display: none !important; }
          .policy-drift-table { min-width: 0; overflow-x: auto; }
          .score-hero { font-size: clamp(3rem, 15vw, 5rem) !important; }
          .deco-svg { display: none !important; }
          .stat-strip { gap: 1.5rem !important; flex-wrap: wrap !important; }

          /* Touch-friendly tap target sizing */
          button, a {
            min-height: 44px;
          }
          /* But not for tiny inline elements */
          button.inline-tight, a.inline-tight {
            min-height: 0;
          }

          /* Inference module 2 grid (UnderstandPage 1fr/80px/1fr) becomes a stack */
          .understand-inference-headers {
            grid-template-columns: 1fr !important;
          }
          .understand-inference-headers > *:nth-child(2) { display: none !important; }
          .understand-inference-header-right { display: none !important; }
          .understand-inference-row {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
          .understand-inference-arrow {
            justify-content: flex-start !important;
            padding: 0.4rem 0 !important;
            height: 28px;
          }
          .understand-inference-arrow svg {
            width: 28px !important;
            height: 28px !important;
            transform: rotate(90deg);
          }
        }

        @media (max-width: 480px) {
          .section-ghost-num { display: none !important; }
        }

        /* ────────────────────────────────────────────────────────
           SAFE AREA INSET helpers — for notch / home indicator
           Used by sticky bottom bars across pages
           ──────────────────────────────────────────────────────── */
        .safe-pb {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        .safe-bottom-nav {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
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
