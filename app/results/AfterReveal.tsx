'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AfterRevealProps {
  onComplete?: () => void;
  autoAdvance?: boolean;
}

type Beat = 0 | 1 | 2 | 3 | 4;

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const BEATS = [
  {
    num: '01', label: 'What just happened',
    bg: '#f5f4f0',
    body: [
      'You clicked agree. You scrolled past a document you did not read. In Clause 19.2, buried between boilerplate about liability and jurisdiction, you gave permission for something you never imagined.',
      'This is not a design flaw. It is a design choice. Every major AI platform operates the same way — not because consent is difficult to obtain, but because informed consent is commercially inconvenient.',
    ],
  },
  {
    num: '02', label: 'What they are collecting',
    bg: '#f2f1ec',
    body: [
      'The data your ChatGPT history contains is not comparable to a cookie. A cookie records where you went. A conversation records how you think.',
      'Every message you send is a trace of your reasoning process — your anxieties, your contradictions, the questions you ask at 3am that you would never say out loud. Zuboff calls this the move from Stage One to Stage Two surveillance capitalism: from tracking behaviour to extracting cognition. Your browsing history describes your actions. Your conversations describe you.',
      'This installation read your vulnerability windows, your emotional tone, the topics you return to again and again. That profile was not fabricated. It was inferred — from patterns in language you produced voluntarily, in a space you believed was private.',
    ],
  },
  {
    num: '03', label: 'The deletion problem',
    bg: '#eeecea',
    body: [
      'You may believe you can delete this. You cannot.',
      'An AI model is not a database. When your conversations are used in training, they do not exist as rows that can be found and removed. They exist as patterns — distributed across billions of numerical parameters, inseparable from everything else the model has learned. Cooper et al. (2024) are precise about it: removing information from a model\'s training data does not guarantee that the model cannot reproduce or reflect that information. There is no delete button. There is no undo.',
      'The GDPR grants you the right to be forgotten. That right was written for databases. Applied to a trained neural network, it describes something technically impossible. Your cognitive patterns, once embedded in model weights, are permanent in a way that has no legal precedent and no available remedy.',
    ],
    redline: true,
  },
  {
    num: '04', label: 'Why consent cannot fix this',
    bg: '#f5f4f0',
    body: [
      'The question is not whether you read the terms. Nissenbaum (2011) identified the transparency paradox: a privacy policy short enough to read cannot contain enough detail to be meaningful. A policy detailed enough to be meaningful cannot be read. The model is structurally broken before you open the document.',
      'Consent requires that you understand what you are agreeing to at the moment of agreeing. For cognitive extraction into a model that will exist for decades, whose downstream uses are unknowable, whose effects compound in ways no one can predict — consent at the moment of clicking is not informed consent. It is a legal fiction that protects the company and does nothing for you.',
    ],
  },
  {
    num: '05', label: 'What meaningful consent would require',
    bg: '#f8f7f3',
    body: [
      'It would require you to understand, before agreeing, that your conversation patterns will be embedded in a model you cannot inspect, cannot audit, and cannot remove yourself from.',
      'It would require that the company explain not what data they collect, but what they infer — the emotional states, the cognitive tendencies, the vulnerability indices their systems derive and retain.',
      'You agreed to this. You did not know what you were agreeing to. That gap — between the click and the consequence — is not an accident.',
    ],
  },
] as const;

const DURATIONS: Record<Beat, number> = { 0: 11000, 1: 15000, 2: 17000, 3: 14000, 4: 0 };

// ─────────────────────────────────────────────────────────────────────────────
// BEAT BACKGROUND ELEMENTS
// ─────────────────────────────────────────────────────────────────────────────

function GridBg({ visible }: { visible: boolean }) {
  const n = 11;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 1.5 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => (
        <motion.div key={`h${i}`}
          initial={{ scaleX: 0 }} animate={{ scaleX: visible ? 1 : 0 }}
          transition={{ duration: 2.4, delay: i * 0.14, ease: 'easeOut' }}
          style={{ position: 'absolute', left: 0, right: 0, top: `${(i/(n-1))*100}%`,
            height: '1px', background: '#1a1a1a', opacity: 0.055, transformOrigin: 'left' }} />
      ))}
      {Array.from({ length: n }).map((_, i) => (
        <motion.div key={`v${i}`}
          initial={{ scaleY: 0 }} animate={{ scaleY: visible ? 1 : 0 }}
          transition={{ duration: 2.4, delay: 0.45 + i * 0.14, ease: 'easeOut' }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i/(n-1))*100}%`,
            width: '1px', background: '#1a1a1a', opacity: 0.055, transformOrigin: 'top' }} />
      ))}
    </motion.div>
  );
}

function ParticleBg({ visible }: { visible: boolean }) {
  const pts = Array.from({ length: 30 }, (_, i) => ({
    id: i, x: 12 + Math.random() * 76, y: 8 + Math.random() * 84,
    s: 1.5 + Math.random() * 2.8, dur: 6 + Math.random() * 8, del: Math.random() * 5,
  }));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 1.5 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {pts.map(p => (
        <motion.div key={p.id}
          animate={visible ? { opacity: [0, 0.32, 0.22, 0], y: [0, -8, -38, -55], scale: [0, 1, 0.8, 0] } : { opacity: 0 }}
          transition={{ duration: p.dur, delay: p.del, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s, borderRadius: '50%', background: '#1a1a1a' }} />
      ))}
    </motion.div>
  );
}

function FragmentBg({ visible }: { visible: boolean }) {
  const offsets = [[-88,-78,-38],[0,-85,22],[82,-72,-42],[-92,2,16],[0,0,0],[88,6,-18],[-78,82,38],[8,86,-28],[86,78,22]];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 1.5 }}
      style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)',
        width: 140, height: 140, pointerEvents: 'none' }}>
      {offsets.map(([ex, ey, er], i) => (
        <motion.div key={i}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
          animate={visible ? { x: [0, ex], y: [0, ey], rotate: [0, er], opacity: [0, i === 4 ? 0.55 : 0.28] } : { opacity: 0 }}
          transition={{ duration: 3.8, delay: 0.7 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', left: `${(i%3)*33.33}%`, top: `${Math.floor(i/3)*33.33}%`,
            width: '33.33%', height: '33.33%',
            background: i === 4 ? 'rgba(168,36,36,0.42)' : 'rgba(26,26,26,0.13)',
            border: `1px solid ${i === 4 ? 'rgba(168,36,36,0.25)' : 'rgba(26,26,26,0.10)'}` }} />
      ))}
    </motion.div>
  );
}

function GapBg({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 1.6 }}
      style={{ position: 'absolute', bottom: '13%', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', width: '78%', maxWidth: 760 }}>
        {['the click', 'the consequence'].flatMap((word, wi) => [
          <motion.div key={`r${wi}`}
            initial={{ scaleX: 0 }} animate={{ scaleX: visible ? 1 : 0 }}
            transition={{ duration: 2.6, delay: 0.4, ease: [0.4,0,0.2,1] }}
            style={{ flex: 1, height: '1px', background: 'rgba(26,26,26,0.10)',
              transformOrigin: wi === 0 ? 'right' : 'left' }} />,
          <p key={`w${wi}`} style={{ fontFamily: '"Courier New", monospace', fontSize: '8px',
            color: 'rgba(26,26,26,0.20)', letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {word}
          </p>,
        ])}
        <motion.div
          initial={{ scaleX: 0 }} animate={{ scaleX: visible ? 1 : 0 }}
          transition={{ duration: 2.6, delay: 0.4, ease: [0.4,0,0.2,1] }}
          style={{ flex: 1, height: '1px', background: 'rgba(26,26,26,0.10)', transformOrigin: 'left' }} />
      </div>
    </motion.div>
  );
}

function RingBg({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 2 }}
      style={{ position: 'absolute', right: '7%', top: '50%', transform: 'translateY(-50%)',
        width: 180, height: 180, pointerEvents: 'none' }}>
      {[0,1,2,3,4].map(i => (
        <motion.div key={i}
          animate={visible ? { scale: [0.15, 1.5], opacity: [0, 0.18, 0] } : { opacity: 0 }}
          transition={{ duration: 5 + i * 1.4, delay: i * 1.1, repeat: Infinity, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(26,26,26,0.28)' }} />
      ))}
    </motion.div>
  );
}

const BG_COMPONENTS = [GridBg, ParticleBg, FragmentBg, GapBg, RingBg];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function AfterReveal({ onComplete, autoAdvance = true }: AfterRevealProps) {
  const [beat, setBeat] = useState<Beat>(0);
  const [prevBeat, setPrevBeat] = useState<Beat | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BgComponent = BG_COMPONENTS[beat];

  const advance = useCallback(() => {
    setBeat(prev => {
      if (prev === 4) { onComplete?.(); return 4; }
      return (prev + 1) as Beat;
    });
  }, [onComplete]);

  useEffect(() => {
    if (!autoAdvance || beat === 4) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advance, DURATIONS[beat]);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [beat, autoAdvance, advance]);

  useEffect(() => {
    const t = setTimeout(() => setChromeVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const jumpTo = (b: Beat) => {
    if (b === beat || transitioning) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTransitioning(true);
    setPrevBeat(beat);
    setTimeout(() => { setBeat(b); setTransitioning(false); }, 560);
  };

  const data = BEATS[beat];

  const BG_COLORS: Record<Beat, string> = { 0: '#f5f4f0', 1: '#f2f1ec', 2: '#eeecea', 3: '#f5f4f0', 4: '#f8f7f3' };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        body::before {
          content:''; position:fixed; inset:0; z-index:1000;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.028; pointer-events:none;
        }
      `}</style>

      <motion.div
        animate={{ background: BG_COLORS[beat] }}
        transition={{ duration: 2.4, ease: 'easeInOut' }}
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'flex-start', paddingLeft: 'clamp(4rem, 11vw, 16rem)', overflow: 'hidden' }}
      >
        {/* Bg element */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          <BgComponent visible={!transitioning} />
        </div>

        {/* Vertical rule — grows with beat */}
        <motion.div
          animate={{ height: `${18 + beat * 16}%`, opacity: 0.14 }}
          transition={{ duration: 2.2, ease: [0.4,0,0.2,1] }}
          style={{ position: 'fixed', left: 'clamp(1.8rem,5.5vw,4.5rem)', top: '50%',
            transform: 'translateY(-50%)', width: '1px', background: '#1a1a1a', zIndex: 10 }}
        />

        {/* Beat content */}
        <motion.div
          key={beat}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 1.2, ease: [0.25,0.1,0.25,1] }}
          style={{ position: 'relative', zIndex: 10, maxWidth: 580, width: '100%', padding: '0 2rem' }}
        >
          {/* Ghost number */}
          <div aria-hidden style={{ position: 'absolute', top: '-2.5rem', left: '-1.2rem',
            fontFamily: '"EB Garamond", Georgia, serif', fontSize: 'clamp(8rem,20vw,15rem)',
            color: 'rgba(26,26,26,0.025)', lineHeight: 1, userSelect: 'none',
            pointerEvents: 'none', fontWeight: 400, letterSpacing: '-0.05em' }}>
            {data.num}
          </div>

          {/* Eyebrow */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}
            style={{ fontFamily: '"Courier New", monospace', fontSize: '9px',
              letterSpacing: '0.2em', color: 'rgba(26,26,26,0.20)',
              textTransform: 'uppercase', marginBottom: '2rem' }}>
            {data.num} — {data.label}
          </motion.p>

          {/* Paragraphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {data.body.map((para, i) => (
              <motion.p key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 0.4 + i * 0.42, ease: 'easeOut' }}
                style={{ fontFamily: '"EB Garamond", Georgia, serif',
                  fontSize: 'clamp(1rem, 1.85vw, 1.18rem)',
                  lineHeight: 1.78, fontWeight: 400, letterSpacing: '-0.005em',
                  color: i === 0 ? '#1a1a1a' : 'rgba(26,26,26,0.60)' }}>
                {para}
              </motion.p>
            ))}
          </div>

          {/* Red line — beat 2 only */}
          {'redline' in data && (data as any).redline && (
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 2, delay: 2.4, ease: 'easeOut' }}
              style={{ height: '1px', marginTop: '1.8rem',
                background: 'linear-gradient(to right, rgba(168,36,36,0.40), transparent)',
                transformOrigin: 'left' }} />
          )}
        </motion.div>

        {/* Chrome */}
        <AnimatePresence>
          {chromeVisible && (
            <>
              {/* Counter */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'fixed', top: '2.5rem', right: '2.5rem', zIndex: 20,
                  fontFamily: '"Courier New", monospace', fontSize: '9px',
                  letterSpacing: '0.16em', color: 'rgba(26,26,26,0.20)', textTransform: 'uppercase' }}>
                {beat + 1} / 5
              </motion.div>

              {/* Dots */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'fixed', bottom: '2.5rem', left: '50%',
                  transform: 'translateX(-50%)', display: 'flex', gap: '0.65rem', zIndex: 20 }}>
                {([0,1,2,3,4] as Beat[]).map(b => (
                  <button key={b} onClick={() => jumpTo(b)}
                    style={{ height: 5, borderRadius: 2.5, border: 'none', cursor: 'pointer', padding: 0,
                      width: beat === b ? 22 : 5,
                      background: beat === b ? '#1a1a1a' : 'rgba(26,26,26,0.20)',
                      transition: 'width 0.4s ease, background 0.3s ease' }} />
                ))}
              </motion.div>

              {/* Nav */}
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={beat < 4 ? advance : onComplete}
                style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', zIndex: 20,
                  fontFamily: '"Courier New", monospace', fontSize: '9px',
                  letterSpacing: '0.16em', color: 'rgba(26,26,26,0.20)',
                  background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.45)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.20)')}>
                {beat < 4 ? 'Continue →' : 'Leave ↗'}
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
