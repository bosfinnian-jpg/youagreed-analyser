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
    url: 'https://www.publicaffairsbooks.com/titles/shoshana-zuboff/the-age-of-surveillance-capitalism/9781610395694/',
    contribution: 'The Stage 1 / Stage 2 distinction: cookie-era consent was designed for reversible behavioural tracking. Conversational AI training is irreversible cognitive extraction. The consent architecture was never adequate for Stage 2 — its failure here is structural, not incidental.',
  },
  {
    name: 'Helen Nissenbaum',
    work: 'A Contextual Approach to Privacy Online. Daedalus 140(4):32–48 (2011)',
    url: 'https://doi.org/10.1162/DAED_a_00113',
    contribution: 'Contextual integrity: privacy is violated not when data is collected, but when it flows outside the context in which it was shared. A conversation with a chatbot flows into a training corpus, a weight update, and a commercial product. That flow was never consented to.',
  },
  {
    name: 'A. Feder Cooper et al.',
    work: 'Machine Unlearning Doesn\'t Do What You Think. arXiv:2412.06966 (NeurIPS 2024)',
    url: 'https://arxiv.org/abs/2412.06966',
    contribution: 'The technical basis for the permanence argument: machine unlearning methods cannot guarantee removal of a data point\'s influence from a trained model. The GDPR right to erasure was written for databases with rows to delete. Neural networks have no equivalent operation.',
  },
  {
    name: 'Gumusel, Zhou & Sanfilippo',
    work: 'User Privacy Harms and Risks in Conversational AI: A Proposed Framework. arXiv:2402.09716 (2024)',
    url: 'https://arxiv.org/abs/2402.09716',
    contribution: 'A taxonomy of 9 privacy harms and 9 privacy risks specific to conversational AI systems, across four interaction stages. The framework that structures the inference categories used throughout this analysis — including disclosure harms, aggregation harms, and secondary use.',
  },
  {
    name: 'McDonald & Cranor',
    work: 'The Cost of Reading Privacy Policies. I/S: A Journal of Law and Policy 4(3):543–568 (2008)',
    url: 'https://lorrie.cranor.org/pubs/readingPolicyCost-authorDraft.pdf',
    contribution: 'Empirical basis for the consent failure argument: reading the privacy policies of every site an average American visits would require 76 working days per year. Notice-and-consent is not meaningfully possible at this scale. The system relies on that impossibility.',
  },
  {
    name: 'Daniel J. Solove',
    work: 'A Taxonomy of Privacy. University of Pennsylvania Law Review 154(3):477–564 (2006)',
    url: 'https://scholarship.law.gwu.edu/cgi/viewcontent.cgi?article=2074&context=faculty_publications',
    contribution: 'The foundational privacy taxonomy extended by Gumusel et al. to conversational AI. The categorical framework for disclosure harms, aggregation harms, and secondary use — all three of which are structurally present in AI training pipelines.',
  },
  {
    name: 'Hickman et al.',
    work: 'Automated Text-Based Assessment of Psychological Constructs: A Systematic Review. Psychological Bulletin 148(12):1–30 (2022)',
    url: 'https://doi.org/10.1037/bul0000362',
    contribution: 'Systematic review of text-based personality and psychological inference at scale, finding 78–85% accuracy claims across commercial systems. The empirical basis for the employment screening scenario: personality inference from language patterns is operational, not theoretical.',
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
          A tool that makes the consent gap visible.
        </h1>
        <div style={{ borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1.25rem', maxWidth: '56ch' }}>
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
            color: PALETTE.inkMuted, fontStyle: 'italic',
            lineHeight: 1.75, margin: 0,
          }}>
            trace.ai analyses your ChatGPT conversation export and produces a structured account of what that data makes possible: what was inferred, what was disclosed, and what cannot be removed. The outputs are demonstrations of inference logic, not definitive claims about any individual. The argument is about the system, not about you.
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
            The inference analysis runs in your browser. The AI enrichment calls, which extract psychological signals from your messages, are made via the Anthropic API during your session only. Conversation content is not logged or retained beyond your current session.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem' }}>
            The inferences are demonstrations of inference mechanics, not definitive claims. They show what commercial profiling systems plausibly derive from language patterns — using the same categorical frameworks documented in industry practice and academic research. The confidence scores are derived from signal intensity, not diagnostic certainty.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660 }}>
            The question this tool asks is not "what does this reveal about you?" It is: "what kind of system produces outputs like these — and what did you agree to when you signed up?"
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
            Consent frameworks — GDPR, cookie banners, privacy policies — were designed for reversible behavioural tracking. The data they govern can be deleted, corrected, or withdrawn. The right to erasure makes technical sense in that context.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem' }}>
            Conversational AI training is not reversible. A sentence processed during training dissolves into weight adjustments across hundreds of billions of parameters — distributed, non-contiguous, structurally non-isolable. Cooper et al. (2024) demonstrate that no current machine unlearning method can guarantee removal. The right to erasure cannot be technically fulfilled for training data.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660 }}>
            That gap is not a policy failure. It is an architectural one. The consent framework was applied to a system it was never designed for. trace.ai makes the gap visible.
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
                  {t.url ? (
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.12em', color: PALETTE.inkFaint, lineHeight: 1.5, textDecoration: 'none', borderBottom: `1px solid ${PALETTE.border}`, paddingBottom: '1px' }}
                    >
                      {t.work} →
                    </a>
                  ) : (
                    <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.12em', color: PALETTE.inkFaint, lineHeight: 1.5 }}>
                      {t.work}
                    </p>
                  )}
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
              { label: 'Processing', detail: 'All inference analysis runs in your browser. Your conversations are never uploaded to a server.' },
              { label: 'AI enrichment', detail: 'Enrichment calls are made via the Anthropic API during your session only. No conversation content is logged or retained by trace.ai.' },
              { label: 'Storage', detail: "Results are stored in your browser's sessionStorage for the duration of your session. They are removed when you close the tab." },
              { label: 'Sharing', detail: 'Nothing is shared with any third party. The dossier exists only in your browser session.' },
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
            trace.ai is a critical practice project by Finn Bostrom, Digital Media, University of Leeds.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, fontStyle: 'italic' }}>
            The tool is the argument.
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
