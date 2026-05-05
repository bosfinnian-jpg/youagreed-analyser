'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from '../../shared/layout/DashboardLayout';

// ============================================================================
// METHOD - Act V, final page
// Framing statement: epistemological status of the system.
// The last thing the user reads. Simple. Still. Heavy.
// ============================================================================

const SECTIONS = [
  {
    id: 'compression',
    label: 'Compression',
    lead: `Trace.ai is a critical reconstruction, not a forensic simulation. It compresses and amplifies - by design.`,
    body: `The system condenses several distinct technical processes: data transmission, storage, statistical training, inference, and downstream commercial use. These processes are temporally separated, architecturally distinct, and distributed across different institutional actors. Trace.ai presents them as a single, continuous extraction. This compression is a deliberate design strategy, not a technical error.`,
  },
  {
    id: 'amplification',
    label: 'Amplification',
    lead: null,
    body: `The project amplifies irreversibility. In reality, machine learning systems are statistical and distributed; they do not store identifiable personal data as a discrete, localisable object. No model contains you in any literal sense. What the system does contain is influence - diffuse, non-traceable, structurally non-withdrawable. Trace.ai may overstate the permanence of identifiable data. It accurately reflects the loss of user control, traceability, and the practical impossibility of meaningful withdrawal.`,
  },
  {
    id: 'translation',
    label: 'Translation',
    lead: null,
    body: `The technical reality of modern AI training is not intuitively legible. Gradient descent, weight distributions, and approximate unlearning are not experientially accessible concepts. This project translates them into a form that is - prioritising experiential legibility over technical fidelity. The psychological profiles produced here are plausible reconstructions, not accurate records. They are demonstrations of what inference can do, and of how system authority makes that inference feel inevitable and exposing.`,
  },
  {
    id: 'argument',
    label: 'The Argument',
    lead: `The underlying argument is precise.`,
    body: `Contemporary consent frameworks are structurally misaligned with AI systems. User input becomes distributed statistical influence that cannot be meaningfully traced, understood, or fully withdrawn. The mechanisms designed to protect that process - notice, consent, erasure - were built for a different kind of data entirely.`,
  },
  {
    id: 'closing',
    label: 'A Closing Note',
    lead: `We have already seen what happens when transformative technology scales faster than the frameworks meant to govern it.`,
    body: `Social media promised connection and delivered, in many cases, harm at population scale. The anxious generation is one consequence of that failure. AI is a larger system, moving faster, with less oversight.

This project examined one ethical problem in one platform. There are others: bias baked into training data, environmental costs that rarely appear in product announcements, questions about creativity and authorship that remain genuinely unresolved. And then there is the existential dimension, which serious researchers take seriously and which deserves more public attention than it receives.

None of this is an argument against the technology. AI is remarkable, and its potential is real. But potential and safety are not the same thing, and enthusiasm has historically moved faster than caution. The least anyone can do is understand what they are participating in.`,
  },
  {
    id: 'acknowledgement',
    label: 'Acknowledgement',
    lead: null,
    body: `Thanks are due to the School of Media and Communications at the University of Leeds, and in particular to Joanne Armitage, whose guidance and support throughout this project made it possible.`,
  },
];



function SectionBlock({ section, index }: {
  section: typeof SECTIONS[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay: index * 0.06 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'clamp(80px, 14vw, 140px) 1fr',
        gap: 'clamp(1.5rem, 3vw, 3rem)',
        paddingTop: 'clamp(2rem, 4vw, 3rem)',
        paddingBottom: 'clamp(2rem, 4vw, 3rem)',
        borderTop: `1px solid ${PALETTE.border}`,
        alignItems: 'start',
      }}
    >
      {/* Left: label column */}
      <div style={{ paddingTop: '0.2rem' }}>
        <span style={{
          display: 'block',
          fontFamily: TYPE.mono,
          fontSize: '9px',
          letterSpacing: '0.28em',
          color: PALETTE.redMuted,
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{
          display: 'block',
          fontFamily: TYPE.mono,
          fontSize: '9px',
          letterSpacing: '0.18em',
          color: PALETTE.inkFaint,
          textTransform: 'uppercase',
        }}>
          {section.label}
        </span>
      </div>

      {/* Right: content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {section.lead && (
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.1rem, 1.9vw, 1.3rem)',
            color: PALETTE.ink,
            lineHeight: 1.65,
            letterSpacing: '-0.01em',
            margin: 0,
          }}>
            {section.lead}
          </p>
        )}
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.85,
          margin: 0,
        }}>
          {section.body}
        </p>
      </div>
    </motion.div>
  );
}

export default function MethodPage({ setPage }: { setPage: (p: string) => void }) {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const pad = 'clamp(1.5rem, 6vw, 5rem)';

  return (
    <div
      className="dash-page-inner"
      style={{
        maxWidth: 1000,
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
          marginBottom: 'clamp(1rem, 3vw, 2rem)',
        }}
      >
        {/* Act label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isHeroInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '10px',
            letterSpacing: '0.3em',
            color: PALETTE.redMuted,
            textTransform: 'uppercase',
            marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
          }}
        >
          Act V · After · A note on method
        </motion.p>

        {/* Title + subtitle row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr clamp(200px, 35%, 380px)',
          gap: 'clamp(2rem, 5vw, 4rem)',
          alignItems: 'end',
        }}>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(3rem, 9vw, 6rem)',
              fontWeight: 400,
              color: PALETTE.ink,
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              margin: 0,
            }}
          >
            A Note<br />on Method.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isHeroInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
              color: PALETTE.inkMuted,
              lineHeight: 1.75,
              margin: 0,
              paddingBottom: '0.4rem',
            }}
          >
            This is a work of critical design. What follows is an account of how
            it operates, where it departs from technical reality, and why those
            departures are intentional.
          </motion.p>
        </div>

        {/* Red accent rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isHeroInView ? { scaleX: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            height: '2px',
            background: PALETTE.red,
            width: 'clamp(3rem, 8vw, 6rem)',
            marginTop: 'clamp(2rem, 4vw, 3.5rem)',
            transformOrigin: 'left center',
          }}
        />
      </motion.div>

      {/* Sections */}
      <div>
        {SECTIONS.map((section, i) => (
          <SectionBlock key={section.id} section={section} index={i} />
        ))}
      </div>

      {/* Footer */}
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
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
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

