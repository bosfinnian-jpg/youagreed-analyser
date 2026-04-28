'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, type DashPage } from './DashboardLayout';

// ============================================================================
// ABOUT — trace.ai
// Not a credits page. A context page.
// Explains the frame so the tool lands correctly.
// ============================================================================

const THEORISTS = [
  {
    name: 'Shoshana Zuboff',
    work: 'The Age of Surveillance Capitalism (2019)',
    contribution: 'The framework for understanding AI data extraction as a two-stage process: Stage 1 (reversible behavioural tracking) and Stage 2 (irreversible cognitive extraction). Cookie-era consent was designed for Stage 1 and was never adequate for Stage 2.',
  },
  {
    name: 'Helen Nissenbaum',
    work: 'A Contextual Approach to Privacy Online (2011)',
    contribution: 'The contextual integrity argument: consent frameworks fail not because users lie, but because the context in which data is collected is structurally different from the context in which it is used. Notice-and-consent was broken before AI arrived.',
  },
  {
    name: 'Cooper et al.',
    work: 'Challenges and Opportunities of Machine Unlearning (2022)',
    contribution: 'The machine unlearning impossibility argument: removing information from a model\'s training data does not guarantee the model cannot reproduce or reflect that information. The GDPR right to erasure was written for databases, not neural networks.',
  },
  {
    name: 'Gumusel et al.',
    work: 'User Privacy Harms and Risks in Conversational AI (2024)',
    contribution: 'A taxonomy of privacy harms specific to conversational AI: inference harms, aggregation harms, and secondary use harms. The framework used to structure the dossier you just read.',
  },
];

function Block({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage({ setPage }: { setPage: (p: DashPage) => void }) {
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 'clamp(4rem, 10vw, 8rem)' }}>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(2.5rem, 5vw, 4rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}
      >
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.4em', color: PALETTE.inkGhost, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
          trace.ai
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.2rem' }}>
          About this tool
        </p>
        <h1 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.025em', lineHeight: 1.15,
          marginBottom: '1.5rem', maxWidth: '24ch',
        }}>
          A tool for reading what you agreed to.
        </h1>
        <div style={{ borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1.25rem', maxWidth: '56ch' }}>
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
            color: PALETTE.inkMuted, fontStyle: 'italic',
            lineHeight: 1.75, margin: 0,
          }}>
            trace.ai analyses your ChatGPT conversation export and produces a structured account of what was extracted — what was inferred, what was disclosed, and what cannot be removed. The dossier is not a prediction. It is a demonstration of what commercial AI inference produces from conversational data.
          </p>
        </div>
      </motion.div>

      {/* What this is */}
      <Block>
        <div style={{ marginBottom: 'clamp(3.5rem, 7vw, 5rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            What this is
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem' }}>
            The analysis runs entirely in your browser. No conversation data is sent to a server. The AI enrichment calls use your session only — nothing is stored, logged, or retained beyond the current session.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem' }}>
            The inferences produced are speculative demonstrations. They show what commercial profiling systems can plausibly derive from language patterns — they are not claims about any specific individual's psychology, identity, or intentions. The categories used (vulnerability windows, cognitive fingerprint, commercial segments) are drawn from documented industry profiling frameworks.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660 }}>
            The argument of the tool is structural, not personal. The question it asks is not "what does this reveal about you specifically?" but "what does this reveal about the system you agreed to participate in?"
          </p>
        </div>
      </Block>

      {/* The argument */}
      <Block delay={0.05}>
        <div style={{ marginBottom: 'clamp(3.5rem, 7vw, 5rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            The argument
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem' }}>
            Consent frameworks — GDPR, cookie banners, privacy policies — were designed for reversible behavioural tracking. The data they govern can be deleted, corrected, or withdrawn. The right to erasure makes technical sense.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem' }}>
            Conversational AI training is not reversible. A sentence passed through a model during training is dissolved into incremental weight adjustments across hundreds of billions of parameters. There is no record to delete. There is no bounded object to return. The right to erasure cannot be technically fulfilled for training data.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660 }}>
            The gap between these two paradigms is not a policy failure. It is an architectural one. trace.ai makes that gap visible.
          </p>
        </div>
      </Block>

      {/* Theoretical sources */}
      <Block delay={0.08}>
        <div style={{ marginBottom: 'clamp(3.5rem, 7vw, 5rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Theoretical grounding
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {THEORISTS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{
                  padding: 'clamp(1.2rem, 2.5vw, 1.75rem) 0',
                  borderBottom: i < THEORISTS.length - 1 ? `1px solid ${PALETTE.border}` : 'none',
                  display: 'grid',
                  gridTemplateColumns: 'clamp(160px, 22%, 220px) 1fr',
                  gap: 'clamp(1rem, 3vw, 2.5rem)',
                  alignItems: 'start',
                }}
              >
                <div>
                  <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.ink, marginBottom: '0.2rem', lineHeight: 1.3 }}>
                    {t.name}
                  </p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.12em', color: PALETTE.inkFaint, lineHeight: 1.5 }}>
                    {t.work}
                  </p>
                </div>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.7, fontStyle: 'italic' }}>
                  {t.contribution}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Block>

      {/* Data & privacy */}
      <Block delay={0.1}>
        <div style={{ marginBottom: 'clamp(3.5rem, 7vw, 5rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Your data
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
            {[
              { label: 'Processing', detail: 'All analysis runs client-side in your browser. Your conversations are never uploaded to any server.' },
              { label: 'AI enrichment', detail: 'The synthesis and enrichment calls are made via the Anthropic API during your session only. No conversation content is logged or retained.' },
              { label: 'Storage', detail: 'Results are stored in your browser\'s sessionStorage for the duration of this session. They are removed when you close the tab.' },
              { label: 'Sharing', detail: 'Nothing is shared with any third party. The dossier exists only in your current browser session.' },
            ].map(item => (
              <div key={item.label} style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, padding: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  {item.label}
                </p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.7 }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Block>

      {/* Built by */}
      <Block delay={0.12}>
        <div style={{ paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Built by
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 560, marginBottom: '0.75rem' }}>
            trace.ai is a critical practice project by Finn Bostrom, a Digital Media student at the University of Leeds.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, fontStyle: 'italic' }}>
            The tool is the argument. Using it is the point.
          </p>
        </div>
      </Block>

      {/* Navigation out */}
      <div style={{ paddingTop: 'clamp(2rem, 4vw, 3rem)', borderTop: `1px solid ${PALETTE.border}`, display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setPage('overview')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: PALETTE.ink, background: 'none',
            border: `1px solid ${PALETTE.borderHover}`,
            padding: '0.55rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = PALETTE.bgPanel; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          Back to overview →
        </button>
        <button
          onClick={() => setPage('understand')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: PALETTE.inkFaint, background: 'none',
            border: `1px solid ${PALETTE.border}`,
            padding: '0.55rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = PALETTE.borderHover; e.currentTarget.style.color = PALETTE.ink; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = PALETTE.border; e.currentTarget.style.color = PALETTE.inkFaint; }}
        >
          Understand the mechanism →
        </button>
      </div>

    </div>
  );
}
