'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// METHOD — Act V, final page
// Framing statement: epistemological status of the system.
// The last thing the user reads. Simple. Still. Heavy.
// ============================================================================

const PARAGRAPHS = [
  {
    body: `Trace.ai is a critical reconstruction, not a forensic simulation. It compresses and amplifies — by design.`,
    isLead: true,
  },
  {
    body: `The system condenses several distinct technical processes: data transmission, storage, statistical training, inference, and downstream commercial use. These processes are temporally separated, architecturally distinct, and distributed across different institutional actors. Trace.ai presents them as a single, continuous extraction. This compression is a deliberate design strategy, not a technical error.`,
    isLead: false,
  },
  {
    body: `The project amplifies irreversibility. In reality, machine learning systems are statistical and distributed; they do not store identifiable personal data as a discrete, localisable object. No model contains you in any literal sense. What the system does contain is influence — diffuse, non-traceable, structurally non-withdrawable. Trace.ai may overstate the permanence of identifiable data. It accurately reflects the loss of user control, traceability, and the practical impossibility of meaningful withdrawal.`,
    isLead: false,
  },
  {
    body: `The technical reality of modern AI training is not intuitively legible. Gradient descent, weight distributions, and approximate unlearning are not experientially accessible concepts. This project translates them into a form that is — prioritising experiential legibility over technical fidelity. The psychological profiles produced here are plausible reconstructions, not accurate records. They are demonstrations of what inference can do, and of how system authority makes that inference feel inevitable and exposing.`,
    isLead: false,
  },
  {
    body: `The underlying argument is precise: contemporary consent frameworks are structurally misaligned with AI systems. User input becomes distributed statistical influence that cannot be meaningfully traced, understood, or fully withdrawn. The mechanisms designed to protect that process — notice, consent, erasure — were built for a different kind of data entirely.`,
    isLead: false,
  },
  {
    body: `What matters is not whether this system is literally accurate. What matters is that it reveals something true about how people experience data systems they cannot see, cannot understand, and cannot leave.`,
    isLead: true,
    isFinal: true,
  },
];

function FadeParagraph({ text, delay, isLead, isFinal }: {
  text: string; delay: number; isLead?: boolean; isFinal?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay }}
      style={{
        fontFamily: TYPE.serif,
        fontSize: isFinal
          ? 'clamp(1.2rem, 2.2vw, 1.5rem)'
          : isLead
          ? 'clamp(1.1rem, 2vw, 1.35rem)'
          : 'clamp(1rem, 1.7vw, 1.15rem)',
        color: isFinal ? PALETTE.ink : isLead ? PALETTE.ink : PALETTE.inkMuted,
        lineHeight: 1.85,
        letterSpacing: isFinal ? '-0.01em' : 'normal',
        fontStyle: isFinal ? 'italic' : 'normal',
        maxWidth: isFinal ? '46ch' : '58ch',
        borderLeft: isFinal ? `2px solid ${PALETTE.red}` : 'none',
        paddingLeft: isFinal ? 'clamp(1.25rem, 3vw, 2rem)' : 0,
      }}
    >
      {text}
    </motion.p>
  );
}

export default function MethodPage({ setPage }: { setPage: (p: string) => void }) {
  const heroRef = useRef(null);
  const isInView = useInView(heroRef, { once: true });
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div
      className="dash-page-inner"
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: `0 ${pad}`,
        paddingBottom: 'clamp(6rem, 14vw, 12rem)',
      }}
    >
      {/* Hero */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          padding: 'clamp(4rem, 10vw, 8rem) 0 clamp(3rem, 7vw, 6rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(4rem, 8vw, 7rem)',
        }}
      >
        {/* Act label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
          }}
        >
          Act V · After · A note on method
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
            fontWeight: 400,
            color: PALETTE.ink,
            letterSpacing: '-0.04em',
            lineHeight: 0.97,
            marginBottom: 'clamp(2rem, 4vw, 3rem)',
            maxWidth: '16ch',
          }}
        >
          A Note<br />on Method.
        </motion.h1>

        {/* Thin rule */}
        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{ height: '1px', background: PALETTE.border, maxWidth: 320 }}
        />
      </motion.div>

      {/* Body paragraphs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
        {PARAGRAPHS.map((p, i) => (
          <FadeParagraph
            key={i}
            text={p.body}
            delay={i * 0.05}
            isLead={p.isLead}
            isFinal={p.isFinal}
          />
        ))}
      </div>

      {/* Footer — minimal, no nav. This is the end. */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 1 }}
        style={{
          marginTop: 'clamp(5rem, 10vw, 9rem)',
          paddingTop: 'clamp(2rem, 4vw, 3rem)',
          borderTop: `1px solid ${PALETTE.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Finnian Bos
          </p>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
            Digital Media · University of Leeds · 2026
          </p>
        </div>

        <button
          onClick={() => setPage('overview')}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: PALETTE.inkFaint,
            background: 'none',
            border: `1px solid ${PALETTE.border}`,
            padding: '0.55rem 1.1rem',
            cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = PALETTE.ink; e.currentTarget.style.borderColor = PALETTE.ink; }}
          onMouseLeave={e => { e.currentTarget.style.color = PALETTE.inkFaint; e.currentTarget.style.borderColor = PALETTE.border; }}
        >
          ← Return to the beginning
        </button>
      </motion.div>
    </div>
  );
}
