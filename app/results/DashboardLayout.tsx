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
  inkMuted: 'rgba(26,24,20,0.62)',
  inkFaint: 'rgba(26,24,20,0.48)',
  inkGhost: 'rgba(26,24,20,0.22)',
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

export type DashPage = 'overview' | 'profile' | 'commercial-profile' | 'sources' | 'risk' | 'understand' | 'terms' | 'permanent' | 'how-it-works' | 'sources-detail' | 'about' | 'policy-drift' | 'resist' | 'method';

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
      { id: 'overview' as DashPage, label: 'Overview', short: '01', desc: 'Your data, extracted and mapped' },
    ],
  },
  {
    id: 'infer',
    label: 'Infer',
    roman: 'II',
    title: 'The Inference',
    pages: [
      { id: 'profile' as DashPage, label: 'Personal Profile', short: '02', desc: 'What the pattern reveals about you' },
      { id: 'commercial-profile' as DashPage, label: 'Commercial Profile', short: '03', desc: 'The product version of you, priced' },
      { id: 'risk' as DashPage, label: 'Risk', short: '04', desc: 'What this record makes possible' },
    ],
  },
  {
    id: 'delete',
    label: 'Delete',
    roman: 'III',
    title: 'The Permanence',
    pages: [
      { id: 'permanent' as DashPage, label: 'Permanent', short: '05', desc: 'Why deletion changes nothing' },
      { id: 'terms' as DashPage, label: 'Terms', short: '06', desc: 'What you agreed to — and when it changed' },
    ],
  },
  {
    id: 'understand',
    label: 'Understand',
    roman: 'IV',
    title: 'The Mechanism',
    pages: [
      { id: 'how-it-works' as DashPage, label: 'How It Works', short: '07', desc: 'Why the inference is permanent' },
      { id: 'understand' as DashPage, label: 'Test', short: '08', desc: 'Watch the extraction happen live' },
    ],
  },
  {
    id: 'resist',
    label: 'After',
    roman: 'V',
    title: 'After',
    pages: [
      { id: 'resist' as DashPage, label: 'After', short: '09', desc: 'What remains. What you can do.' },
      { id: 'method' as DashPage, label: 'Method', short: '10', desc: 'A note on how this system should be read.' },
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
        color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.2rem',
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
// PAGE FOOTER — shared closing section used by every results page.
// Closing text → italic follow-on → nav grid cards → end label.
// ============================================================================
export type FooterNavItem = {
  page: string;
  act: string;       // e.g. "ACT III / 05"
  label: string;     // e.g. "Why it cannot be removed"
  body: string;      // one-line description
};

export function PageFooter({
  statement,
  followOn,
  navItems,
  endLabel,
  setPage,
}: {
  statement?: string;
  followOn?: string;
  navItems: FooterNavItem[];
  endLabel: string;
  setPage: (p: string) => void;
}) {
  return (
    <div style={{
      paddingTop: 'clamp(3rem, 7vw, 5rem)',
      paddingBottom: 'clamp(4rem, 10vw, 7rem)',
    }}>

      {/* Closing statement */}
      {statement && (
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)',
          color: PALETTE.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.45,
          maxWidth: '52ch',
          marginBottom: '1rem',
          fontWeight: 400,
        }}>
          {statement}
        </p>
      )}
      {followOn && (
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.75,
          maxWidth: '52ch',
          fontStyle: 'italic',
          marginBottom: 'clamp(2rem, 4vw, 3rem)',
        }}>
          {followOn}
        </p>
      )}

      {/* Nav grid */}
      <div
        className="page-footer-nav"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1px',
        background: PALETTE.border,
        marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
      }}>
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setPage(item.page)}
            className="nav-strip-card"
            style={{
              background: PALETTE.bgPanel, border: 'none', cursor: 'pointer',
              padding: 'clamp(1.25rem, 3vw, 1.75rem)', textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = PALETTE.bgElevated)}
            onMouseLeave={e => (e.currentTarget.style.background = PALETTE.bgPanel)}
          >
            <span style={{
              display: 'block', fontFamily: TYPE.mono, fontSize: '9px',
              letterSpacing: '0.25em', color: PALETTE.redMuted,
              textTransform: 'uppercase', marginBottom: '0.6rem',
            }}>
              {item.act}
            </span>
            <span style={{
              display: 'block', fontFamily: TYPE.serif,
              fontSize: 'clamp(1rem, 1.8vw, 1.1rem)',
              color: PALETTE.ink, letterSpacing: '-0.01em',
              lineHeight: 1.2, marginBottom: '0.5rem',
            }}>
              {item.label} →
            </span>
            <span style={{
              display: 'block', fontFamily: TYPE.mono, fontSize: '9px',
              letterSpacing: '0.06em', color: PALETTE.inkFaint, lineHeight: 1.55,
            }}>
              {item.body}
            </span>
          </button>
        ))}
      </div>

      {/* End label */}
      <p style={{
        fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em',
        color: PALETTE.inkFaint, textTransform: 'uppercase',
      }}>
        {endLabel}
      </p>
    </div>
  );
}

// ============================================================================
// SHARE BUTTON — Web Share API with clipboard fallback
// ============================================================================
function ShareButton({ exposureScore, userName }: { exposureScore: number; userName?: string }) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const name = userName ? `${userName}'s` : 'My';
    const text = `${name} trace.ai exposure score: ${exposureScore}/100. Find out what your AI conversations reveal about you.`;
    const url = 'https://youagreed.co.uk';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'trace.ai: your data dossier', text, url });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch {
        // user dismissed — no-op
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch {
        // clipboard blocked — silent fail
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      style={{
        width: '100%', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left',
        padding: '0.7rem 1.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.13s', borderTop: `1px solid ${PALETTE.border}`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.bgElevated; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      <span style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em',
        color: shared ? PALETTE.red : PALETTE.inkFaint,
        textTransform: 'uppercase', transition: 'color 0.3s',
      }}>
        {shared ? 'Copied' : 'Share your score'}
      </span>
      <motion.span
        animate={{ rotate: shared ? 360 : 0 }}
        transition={{ duration: 0.4 }}
        style={{ fontFamily: TYPE.mono, fontSize: '9px', color: shared ? PALETTE.redMuted : PALETTE.inkGhost }}
      >
        {shared ? '✓' : '↗'}
      </motion.span>
    </button>
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
            minWidth: act.pages.length === 1 ? '200px' : '240px',
            zIndex: 300,
            boxShadow: '0 4px 20px rgba(26,24,20,0.10), 0 1px 4px rgba(26,24,20,0.06)',
          }}
        >
          {/* Act header */}
          <div style={{
            padding: '0.6rem 1rem 0.5rem',
            borderBottom: `1px solid ${PALETTE.border}`,
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.35em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>
              ACT {act.roman}
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
              {act.title}
            </span>
          </div>
          {/* Pages */}
          {act.pages.map((p, idx) => {
            const isActive = currentPage === p.id;
            const isLast = idx === act.pages.length - 1;
            return (
              <button
                key={p.id}
                onClick={() => onNav(p.id)}
                style={{
                  width: '100%', background: isActive ? PALETTE.bgElevated : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  padding: '0.65rem 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'background 0.12s',
                  borderBottom: isLast ? 'none' : `1px solid ${PALETTE.border}`,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = PALETTE.bgElevated; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    fontFamily: TYPE.serif,
                    fontSize: '0.95rem',
                    color: isActive ? PALETTE.ink : PALETTE.inkMuted,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}>
                    {p.label}
                    {isActive && (
                      <span style={{
                        display: 'inline-block', width: '3px', height: '3px',
                        borderRadius: '50%', background: PALETTE.red, flexShrink: 0,
                      }} />
                    )}
                  </span>
                  <span style={{
                    display: 'block',
                    fontFamily: TYPE.mono, fontSize: '9px',
                    color: PALETTE.inkFaint, letterSpacing: '0.04em',
                    marginTop: '2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.desc}
                  </span>
                </div>
                <span style={{
                  fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em',
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
// ============================================================================
// FURTHER READING — collapsible dropdown inside the drawer
// ============================================================================
const FURTHER_ITEMS = [
  { id: 'about' as DashPage, label: 'About', desc: 'The theoretical basis' },
  { id: 'sources' as DashPage, label: 'Sources', desc: 'Every claim, sourced' },
  { id: 'policy-drift' as DashPage, label: 'Policy drift', desc: 'How the terms shifted over time' },
] as const;

function FurtherReading({ page, onNav }: { page: DashPage; onNav: (p: DashPage) => void }) {
  const [open, setOpen] = useState(false);
  const isActive = FURTHER_ITEMS.some(i => i.id === page);

  return (
    <div style={{ marginTop: '0.5rem', borderTop: `1px solid rgba(26,24,20,0.07)` }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,24,20,0.025)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: isActive ? PALETTE.inkMuted : 'rgba(26,24,20,0.28)',
          }}>
            Further reading
          </span>
          {isActive && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: PALETTE.red }} />}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ fontFamily: TYPE.mono, fontSize: '9px', color: 'rgba(26,24,20,0.2)', lineHeight: 1 }}
        >
          ↓
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {FURTHER_ITEMS.map((item) => {
              const isItemActive = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  style={{
                    width: '100%', background: isItemActive ? 'rgba(26,24,20,0.05)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    padding: '0.55rem 1.5rem 0.55rem 2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.12s',
                    borderLeft: isItemActive ? `2px solid ${PALETTE.red}` : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isItemActive) (e.currentTarget as HTMLElement).style.background = 'rgba(26,24,20,0.025)'; }}
                  onMouseLeave={e => { if (!isItemActive) (e.currentTarget as HTMLElement).style.background = 'none'; }}
                >
                  <div>
                    <span style={{
                      display: 'block', fontFamily: TYPE.serif, fontSize: '0.95rem',
                      color: isItemActive ? PALETTE.ink : PALETTE.inkMuted,
                      letterSpacing: '-0.01em', lineHeight: 1.2,
                    }}>
                      {item.label}
                    </span>
                    <span style={{
                      display: 'block', fontFamily: TYPE.mono, fontSize: '9px',
                      color: 'rgba(26,24,20,0.25)', letterSpacing: '0.04em', marginTop: '1px',
                    }}>
                      {item.desc}
                    </span>
                  </div>
                  {isItemActive && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: PALETTE.red, flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
                    fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
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
                background: 'rgba(26,24,20,0.18)',
                backdropFilter: 'blur(6px)',
              }}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 190,
                width: 'min(300px, 88vw)',
                background: '#f7f6f2',
                borderLeft: `1px solid rgba(26,24,20,0.12)`,
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                height: '56px', padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid rgba(26,24,20,0.08)`,
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', letterSpacing: '-0.01em', color: PALETTE.ink }}>trace</span>
                  <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', letterSpacing: '-0.01em', color: PALETTE.red }}>.ai</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '12px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <HamburgerIcon open={true} />
                </button>
              </div>

              {/* Score strip */}
              <div style={{
                padding: '1rem 1.5rem',
                borderBottom: `1px solid rgba(26,24,20,0.08)`,
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: PALETTE.inkGhost, display: 'block', marginBottom: '0.15rem' }}>
                    Exposure score
                  </span>
                  <span style={{ fontFamily: TYPE.serif, fontSize: '1.6rem', color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {exposureScore}<span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkGhost, marginLeft: '2px' }}>/100</span>
                  </span>
                </div>
                {userName && (
                  <span style={{ fontFamily: TYPE.serif, fontSize: '0.85rem', color: PALETTE.inkFaint, fontStyle: 'italic' }}>
                    {userName}
                  </span>
                )}
              </div>

              {/* Navigation */}
              <div style={{ flex: 1, padding: '0.5rem 0' }}>
                {ACTS.map((act, actIdx) => (
                  <div key={act.id}>
                    {/* Act divider */}
                    <div style={{
                      padding: '0.7rem 1.5rem 0.2rem',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                      <span style={{
                        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.45em',
                        color: 'rgba(190,40,30,0.4)', textTransform: 'uppercase',
                      }}>
                        {act.roman}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(26,24,20,0.07)' }} />
                      <span style={{
                        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
                        color: 'rgba(26,24,20,0.38)', textTransform: 'uppercase',
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
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.03 + actIdx * 0.05 + i * 0.035, duration: 0.24 }}
                          onClick={() => handleNav(p.id)}
                          style={{
                            width: '100%', background: isActive ? 'rgba(26,24,20,0.05)' : 'none',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                            padding: '0.45rem 1.5rem',
                            minHeight: '44px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'background 0.12s',
                            borderLeft: isActive ? `2px solid ${PALETTE.red}` : '2px solid transparent',
                          }}
                          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(26,24,20,0.03)'; } }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none'; }}
                        >
                          <div>
                            <span style={{
                              display: 'block',
                              fontFamily: TYPE.serif,
                              fontSize: '1.05rem',
                              color: isActive ? PALETTE.ink : PALETTE.inkMuted,
                              letterSpacing: '-0.015em', lineHeight: 1.2,
                            }}>
                              {p.label}
                            </span>
                            <span style={{
                              display: 'block',
                              fontFamily: TYPE.mono, fontSize: '9px',
                              color: isActive ? 'rgba(26,24,20,0.35)' : PALETTE.inkGhost,
                              letterSpacing: '0.04em',
                              marginTop: '1px',
                            }}>
                              {p.desc}
                            </span>
                          </div>
                          {isActive && (
                            <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: PALETTE.red, flexShrink: 0 }} />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}

                {/* Further reading — collapsible */}
                <FurtherReading page={page} onNav={handleNav} />
              </div>

              {/* Footer */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: `1px solid rgba(26,24,20,0.08)`,
                flexShrink: 0,
              }}>
                <ShareButton exposureScore={exposureScore} userName={userName} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// CONTEXT RAIL — right-side "find out more" links, buried but findable
// ============================================================================
const CONTEXT_LINKS: Partial<Record<DashPage, Array<{ label: string; desc: string; page: DashPage }>>> = {
  overview: [
    { label: 'How it works', desc: 'Why the inference is permanent', page: 'how-it-works' },
    { label: 'Test', desc: 'Watch the extraction live', page: 'understand' },
  ],
  profile: [
    { label: 'How it works', desc: 'Where these signals come from', page: 'how-it-works' },
    { label: 'Test', desc: 'See it work on raw text', page: 'understand' },
  ],
  'commercial-profile': [
    { label: 'Policy drift', desc: 'When the terms authorised this', page: 'policy-drift' },
    { label: 'Sources', desc: 'Legal basis for each finding', page: 'sources' },
  ],
  risk: [
    { label: 'Test', desc: 'Watch inference happen', page: 'understand' },
    { label: 'Sources', desc: 'Policy basis for each risk', page: 'sources' },
    { label: 'Policy drift', desc: 'When the terms changed', page: 'policy-drift' },
  ],
  permanent: [
    { label: 'How it works', desc: 'The technical reason deletion fails', page: 'how-it-works' },
    { label: 'Sources', desc: 'The clauses that permit this', page: 'sources' },
    { label: 'Policy drift', desc: 'How permanence entered the terms', page: 'policy-drift' },
  ],
  terms: [
    { label: 'Policy drift', desc: '2023 → 2025 → 2026', page: 'policy-drift' },
    { label: 'Sources', desc: 'Clause-by-clause', page: 'sources' },
  ],
  'policy-drift': [
    { label: 'Sources', desc: 'Every clause, sourced', page: 'sources' },
    { label: 'Permanent', desc: 'What the changes mean', page: 'permanent' },
  ],
  sources: [
    { label: 'Policy drift', desc: 'How the terms evolved', page: 'policy-drift' },
    { label: 'About', desc: 'The theoretical basis', page: 'about' },
  ],
};

const DEFAULT_CONTEXT_LINKS = [
  { label: 'About', desc: 'The theoretical basis', page: 'about' as DashPage },
  { label: 'Sources', desc: 'Every claim, sourced', page: 'sources' as DashPage },
];

function ContextRail({ page, setPage }: { page: DashPage; setPage: (p: DashPage) => void }) {
  const links = CONTEXT_LINKS[page] || DEFAULT_CONTEXT_LINKS;
  return (
    <div className="context-rail" style={{
      position: 'fixed',
      right: 'clamp(1rem, 2vw, 2rem)',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 40,
      width: '140px',
    }}>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.28em',
        textTransform: 'uppercase', color: PALETTE.inkGhost,
        marginBottom: '0.75rem',
      }}>
        Find out more
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {links.map(link => (
          <button
            key={link.page}
            onClick={() => setPage(link.page)}
            style={{
              background: PALETTE.bgPanel, border: 'none', cursor: 'pointer',
              textAlign: 'left', padding: '0.65rem 0.75rem',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.bgElevated; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = PALETTE.bgPanel; }}
          >
            <p style={{
              fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: PALETTE.inkMuted, marginBottom: '2px',
            }}>
              {link.label}
            </p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '0.82rem',
              lineHeight: 1.4, color: PALETTE.inkFaint,
            }}>
              {link.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
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

        /* ────────────────────────────────────────────────────────
           DESIGN TOKENS — single source of truth
           All pages inherit these. Override only for intentional
           deviations (e.g. dark ResistPage sections).
           ──────────────────────────────────────────────────────── */
        :root {
          /* Spacing scale */
          --space-xs:   clamp(0.5rem,  1vw,   0.75rem);
          --space-sm:   clamp(0.75rem, 1.5vw, 1rem);
          --space-md:   clamp(1rem,    2vw,   1.5rem);
          --space-lg:   clamp(1.5rem,  3vw,   2.5rem);
          --space-xl:   clamp(2.5rem,  5vw,   4rem);
          --space-2xl:  clamp(3.5rem,  7vw,   6rem);
          --space-3xl:  clamp(5rem,   10vw,   8rem);

          /* Section rhythm — consistent between-section gap */
          --section-gap: clamp(3rem, 7vw, 5.5rem);

          /* Content widths */
          --prose-width:   60ch;
          --content-width: 1000px;
          --wide-width:    1200px;

          /* Typography — body prose */
          --text-body:    clamp(1rem,   1.6vw, 1.1rem);
          --text-body-lg: clamp(1.1rem, 2vw,  1.25rem);
          --text-sm:      clamp(0.9rem, 1.4vw, 1rem);
          --text-label:   10px;
          --text-meta:    9px;

          /* Line heights */
          --lh-body:    1.78;
          --lh-heading: 1.12;
          --lh-label:   1.4;
        }

        /* ────────────────────────────────────────────────────────
           UTILITY CLASSES — use instead of inline style duplication
           ──────────────────────────────────────────────────────── */

        /* Section label — the 10px mono red uppercase */
        .section-label {
          font-family: 'Courier Prime', 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(190,40,30,0.50);
          display: block;
          margin-bottom: var(--space-lg);
        }

        /* Body prose */
        .prose {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: var(--text-body-lg);
          line-height: var(--lh-body);
          color: rgba(26,24,20,0.85);
          max-width: var(--prose-width);
        }

        /* Page inner container */
        .page-inner {
          max-width: var(--content-width);
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 4rem);
          padding-bottom: clamp(5rem, 12vw, 9rem);
        }

        /* Section block — full-width divided section */
        .section-block {
          padding: var(--section-gap) 0;
          border-bottom: 1px solid rgba(26,24,20,0.14);
        }
        .section-block:last-child {
          border-bottom: none;
        }

        /* Source link — small mono underline */
        .source-link {
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          color: rgba(26,24,20,0.40);
          text-decoration: none;
          border-bottom: 1px solid rgba(26,24,20,0.14);
          padding-bottom: 1px;
          transition: color 0.15s, border-color 0.15s;
        }
        .source-link:hover {
          color: rgba(190,40,30,0.80);
          border-color: rgba(190,40,30,0.40);
        }

        /* Stat / metric label */
        .metric-label {
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(26,24,20,0.40);
        }

        /* List last-child border removal — apply to list containers */
        .bordered-list > *:last-child {
          border-bottom: none !important;
        }
        .bordered-list > *:first-child {
          border-top: none !important;
        }

        /* ────────────────────────────────────────────────────────
           PROSE RHYTHM — paragraph spacing inside prose blocks
           ──────────────────────────────────────────────────────── */
        .prose-block p + p {
          margin-top: var(--space-md);
        }
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
          .ov-right-rail, .resist-right-rail, .context-rail { display: none !important; }
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
           MOBILE-SPECIFIC IMPROVEMENTS
           ──────────────────────────────────────────────────────── */

        /* Better font rendering on mobile */
        @media (max-width: 640px) {
          /* Force text to wrap nicely on narrow screens */
          h1, h2, h3 {
            overflow-wrap: break-word;
            word-break: break-word;
            hyphens: auto;
          }

          /* Wider prose on mobile — remove overly tight max-width constraints */
          .prose {
            max-width: 100% !important;
            font-size: clamp(1.05rem, 4vw, 1.1rem) !important;
          }

          /* FooterNav cards — single column on tiny screens */
          .page-footer-nav {
            grid-template-columns: 1fr !important;
          }

          /* SAR letter bar full-width buttons */
          .sar-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .sar-bar button {
            width: 100% !important;
            text-align: center !important;
          }

          /* Profile page waffle grid tighter columns */
          .waffle-grid {
            grid-template-columns: repeat(10, 1fr) !important;
          }

          /* Chapter shell inner — keep content in bounds */
          .chapter-content-inner {
            max-width: 100% !important;
          }

          /* Disclosure chapter - quote text smaller on mobile */
          .disclosure-quote {
            font-size: clamp(1.2rem, 4.5vw, 1.6rem) !important;
          }

          /* Score ring — mobile sizing */
          .score-ring-container {
            width: min(72vw, 280px) !important;
          }

          /* Policy drift table scrolls horizontally */
          .policy-drift-3col {
            grid-template-columns: 1fr !important;
          }

          /* Resist page action steps — no truncation */
          .action-step-platform {
            font-size: 9px !important;
            letter-spacing: 0.12em !important;
          }
          .action-step-path {
            font-size: 9px !important;
            word-break: break-all !important;
          }

          /* ProfilePage demographic row stacking handled by prof-demo-row */

          /* Prevent NavBar score from eating too much space */
          .nav-score-block {
            gap: 0 !important;
          }
        }

        @media (max-width: 380px) {
          /* Ultra-small phones — reduce base padding further */
          .dash-page-inner {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          /* OverviewPage arrival heading */
          .arrival-heading {
            font-size: clamp(2.8rem, 12vw, 4rem) !important;
          }

          /* Nav: only show score number, nothing else */
          .nav-exposure-score {
            font-size: 11px !important;
          }
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

        /* ────────────────────────────────────────────────────────
           BORDERED LIST — removes orphan first/last borders
           Apply .bordered-list to the wrapper of any list where
           items have borderBottom. CSS handles the rest.
           ──────────────────────────────────────────────────────── */
        .bordered-list > *:last-child,
        .bordered-list > *:last-child > * {
          border-bottom: none !important;
        }
        .bordered-list > *:first-child,
        .bordered-list > *:first-child > * {
          border-top: none !important;
        }

        /* ────────────────────────────────────────────────────────
           FOCUS VISIBLE — keyboard nav accessibility
           ──────────────────────────────────────────────────────── */
        :focus-visible {
          outline: 2px solid rgba(190,40,30,0.6);
          outline-offset: 2px;
        }
        :focus:not(:focus-visible) {
          outline: none;
        }

        /* ────────────────────────────────────────────────────────
           SMOOTH IMAGE RENDERING
           ──────────────────────────────────────────────────────── */
        img, svg {
          display: block;
          max-width: 100%;
        }

        /* ────────────────────────────────────────────────────────
           PREVENT LAYOUT SHIFT from scrollbar appearance
           ──────────────────────────────────────────────────────── */
        html {
          scrollbar-gutter: stable;
        }
        @media (max-width: 768px) {
          html { scrollbar-gutter: auto; }
        }

        /* ────────────────────────────────────────────────────────
           MONO NUMBERS — tabular figures for aligned metrics
           ──────────────────────────────────────────────────────── */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }

        /* ────────────────────────────────────────────────────────
           DASH PAGE INNER — standard page container
           Replaces scattered maxWidth: 1000 / margin: auto
           ──────────────────────────────────────────────────────── */
        .dash-page-inner {
          max-width: var(--content-width, 1000px);
          margin: 0 auto;
          padding-left:  clamp(1.5rem, 5vw, 4rem);
          padding-right: clamp(1.5rem, 5vw, 4rem);
          padding-bottom: clamp(5rem, 12vw, 9rem);
        }

        /* ────────────────────────────────────────────────────────
           SECTION DIVIDER — consistent ruled sections
           ──────────────────────────────────────────────────────── */
        .section-block {
          padding-top:    var(--section-gap, clamp(3rem, 7vw, 5.5rem));
          padding-bottom: var(--section-gap, clamp(3rem, 7vw, 5.5rem));
          border-bottom:  1px solid rgba(26,24,20,0.14);
        }
        .section-block:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        /* ────────────────────────────────────────────────────────
           TRANSITION CONSISTENCY — all interactive elements
           ──────────────────────────────────────────────────────── */
        button, a {
          transition: color 0.15s, background 0.15s, border-color 0.15s, opacity 0.15s;
        }
      `}</style>

      <Nav page={page} setPage={setPage} results={results} exposureScore={exposureScore} />

      <main style={{ paddingTop: '64px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
