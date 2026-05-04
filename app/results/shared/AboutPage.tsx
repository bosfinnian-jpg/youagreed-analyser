'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, type DashPage, PageFooter } from './layout/DashboardLayout';

// ============================================================================
// ABOUT — trace.ai
// ============================================================================

const THEORISTS = [
  {
    name: 'Shoshana Zuboff',
    initials: 'SZ',
    work: 'The Age of Surveillance Capitalism (2019)',
    url: 'https://www.publicaffairsbooks.com/titles/shoshana-zuboff/the-age-of-surveillance-capitalism/9781610395694/',
    tag: 'Surveillance theory',
    color: 'rgba(99,102,241,0.85)',
    colorFaint: 'rgba(99,102,241,0.10)',
    contribution: 'The Stage 1 / Stage 2 distinction: cookie-era consent was designed for reversible behavioural tracking. Conversational AI training is irreversible cognitive extraction. The consent architecture was never adequate for Stage 2 — its failure here is structural, not incidental.',
  },
  {
    name: 'Helen Nissenbaum',
    initials: 'HN',
    work: 'A Contextual Approach to Privacy Online. Daedalus 140(4):32–48 (2011)',
    url: 'https://doi.org/10.1162/DAED_a_00113',
    tag: 'Contextual integrity',
    color: 'rgba(22,130,80,0.88)',
    colorFaint: 'rgba(22,130,80,0.10)',
    contribution: 'Contextual integrity: privacy is violated not when data is collected, but when it flows outside the context in which it was shared. A conversation with a chatbot flows into a training corpus, a weight update, and a commercial product. That flow was never consented to.',
  },
  {
    name: 'A. Feder Cooper et al.',
    initials: 'AFC',
    work: 'Machine Unlearning Doesn\'t Do What You Think. arXiv:2412.06966 (NeurIPS 2024)',
    url: 'https://arxiv.org/abs/2412.06966',
    tag: 'Machine unlearning',
    color: 'rgba(190,40,30,0.92)',
    colorFaint: 'rgba(190,40,30,0.10)',
    contribution: 'The technical basis for the permanence argument: machine unlearning methods cannot guarantee removal of a data point\'s influence from a trained model. The GDPR right to erasure was written for databases with rows to delete. Neural networks have no equivalent operation.',
  },
  {
    name: 'Gumusel, Zhou & Sanfilippo',
    initials: 'GZS',
    work: 'User Privacy Harms and Risks in Conversational AI. arXiv:2402.09716 (2024)',
    url: 'https://arxiv.org/abs/2402.09716',
    tag: 'Privacy taxonomy',
    color: 'rgba(190,120,0,0.90)',
    colorFaint: 'rgba(190,120,0,0.10)',
    contribution: 'A taxonomy of 9 privacy harms and 9 privacy risks specific to conversational AI systems, across four interaction stages. The framework that structures the inference categories used throughout this analysis — including disclosure harms, aggregation harms, and secondary use.',
  },
  {
    name: 'McDonald & Cranor',
    initials: 'MC',
    work: 'The Cost of Reading Privacy Policies. I/S: A Journal of Law and Policy 4(3) (2008)',
    url: 'https://lorrie.cranor.org/pubs/readingPolicyCost-authorDraft.pdf',
    tag: 'Consent failure',
    color: 'rgba(120,60,160,0.85)',
    colorFaint: 'rgba(120,60,160,0.10)',
    contribution: 'Empirical basis for the consent failure argument: reading the privacy policies of every site an average American visits would require 76 working days per year. Notice-and-consent is not meaningfully possible at this scale. The system relies on that impossibility.',
  },
  {
    name: 'Daniel J. Solove',
    initials: 'DS',
    work: 'A Taxonomy of Privacy. University of Pennsylvania Law Review 154(3) (2006)',
    url: 'https://scholarship.law.gwu.edu/cgi/viewcontent.cgi?article=2074&context=faculty_publications',
    tag: 'Privacy law',
    color: 'rgba(22,130,80,0.88)',
    colorFaint: 'rgba(22,130,80,0.10)',
    contribution: 'The foundational privacy taxonomy extended by Gumusel et al. to conversational AI. The categorical framework for disclosure harms, aggregation harms, and secondary use — all three of which are structurally present in AI training pipelines.',
  },
  {
    name: 'Hickman et al.',
    initials: 'HK',
    work: 'Automated Text-Based Assessment of Psychological Constructs. Psychological Bulletin 148(12) (2022)',
    url: 'https://doi.org/10.1037/bul0000362',
    tag: 'Psychological inference',
    color: 'rgba(99,102,241,0.85)',
    colorFaint: 'rgba(99,102,241,0.10)',
    contribution: 'Systematic review of text-based personality and psychological inference at scale, finding 78–85% accuracy claims across commercial systems. The empirical basis for the employment screening scenario: personality inference from language patterns is operational, not theoretical.',
  },
];

function Block({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.55, delay }}>
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
      <div style={{ width: 24, height: '1.5px', background: PALETTE.redMuted }} />
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>{children}</p>
    </div>
  );
}

export default function AboutPage({ setPage }: { setPage: (p: DashPage) => void }) {
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 'clamp(4rem, 10vw, 8rem)' }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          padding: 'clamp(3.5rem, 9vw, 7rem) 0 clamp(3rem, 6vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3.5rem, 7vw, 6rem)',
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}
        >
          About this project
        </motion.p>

        {/* Big name */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{ marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}
        >
          <h1 style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(3rem, 9vw, 6.5rem)',
            fontWeight: 400,
            color: PALETTE.ink,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            marginBottom: '0.5rem',
          }}>
            Finnian Bos
          </h1>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: 'clamp(9px, 1.3vw, 11px)',
            letterSpacing: '0.28em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
          }}>
            Digital Media · University of Leeds · 2026
          </p>
        </motion.div>

        {/* Horizontal rule with project name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            marginBottom: 'clamp(1.75rem, 4vw, 3rem)',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
          <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            trace.ai — critical digital media practice
          </span>
          <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
        </motion.div>

        {/* Intro statement */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.15rem, 2.2vw, 1.4rem)',
            color: PALETTE.inkMuted,
            lineHeight: 1.8,
            maxWidth: '56ch',
            fontStyle: 'italic',
          }}
        >
          Trace.ai is a critical art installation and interactive web experience examining how consent frameworks designed for reversible behavioural tracking fail catastrophically when applied to irreversible AI cognitive extraction.
        </motion.p>
      </motion.div>

      {/* ── WHAT THIS IS ──────────────────────────────────────── */}
      <Block>
        <div style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <SectionLabel>What this is</SectionLabel>

          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 620, marginBottom: '1.25rem' }}>
            This tool analyses your ChatGPT or Claude conversation export and produces a structured account of what that data makes possible: what was inferred, what was disclosed, and what cannot be removed.
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 620 }}>
            The question it asks is not "what does this reveal about you?" It is: "what kind of system produces outputs like these — and what did you agree to when you signed up?"
          </p>
        </div>
      </Block>

      {/* ── THE ARGUMENT ──────────────────────────────────────── */}
      <Block delay={0.05}>
        <div style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <SectionLabel>The argument</SectionLabel>

          {/* Pull quote */}
          <div style={{
            borderLeft: `3px solid ${PALETTE.redMuted}`,
            paddingLeft: 'clamp(1.25rem, 3vw, 2rem)',
            marginBottom: 'clamp(2rem, 4vw, 3rem)',
          }}>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1.3rem, 2.8vw, 1.8rem)',
              color: PALETTE.ink,
              lineHeight: 1.55,
              letterSpacing: '-0.01em',
              maxWidth: '32ch',
            }}>
              The consent framework was applied to a system it was never designed for.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1px', background: PALETTE.border, marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            {[
              {
                heading: 'Cookie-era consent',
                body: 'Consent frameworks — GDPR, cookie banners, privacy policies — were designed for reversible behavioural tracking. The data they govern can be deleted, corrected, or withdrawn. The right to erasure makes technical sense in that context.',
                color: 'rgba(22,130,80,0.88)',
                colorFaint: 'rgba(22,130,80,0.10)',
                tag: 'Works as designed',
              },
              {
                heading: 'AI training',
                body: 'Conversational AI training is not reversible. A sentence processed during training dissolves into weight adjustments across hundreds of billions of parameters — distributed, non-contiguous, structurally non-isolable.',
                color: 'rgba(190,40,30,0.92)',
                colorFaint: 'rgba(190,40,30,0.10)',
                tag: 'Framework fails',
              },
            ].map(card => (
              <div key={card.heading} style={{ background: PALETTE.bgPanel, padding: 'clamp(1.25rem, 3vw, 2rem)', borderTop: `3px solid ${card.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                  <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)', fontWeight: 400, color: PALETTE.ink }}>{card.heading}</h3>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: card.color, textTransform: 'uppercase', background: card.colorFaint, padding: '0.25rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{card.tag}</span>
                </div>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75 }}>{card.body}</p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 600 }}>
            <a href="https://arxiv.org/abs/2412.06966" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', textDecorationColor: 'inherit', cursor: 'pointer' }}>Cooper et al. (2024)</a>{" demonstrate that no current machine unlearning method can guarantee removal. The right to erasure cannot be technically fulfilled for training data. That gap is not a policy failure — it is an architectural one."}
          </p>
        </div>
      </Block>

      {/* ── THEORETICAL GROUNDING ─────────────────────────────── */}
      <Block delay={0.08}>
        <div style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <SectionLabel>Theoretical grounding</SectionLabel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {THEORISTS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                style={{
                  padding: 'clamp(1.25rem, 3vw, 2rem) 0',
                  borderBottom: i < THEORISTS.length - 1 ? `1px solid ${PALETTE.border}` : 'none',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
                  gap: 'clamp(0.75rem, 3vw, 2.5rem)',
                  alignItems: 'start',
                }}
              >
                {/* Left — name + tag + citation */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    {/* Colour dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: t.color, flexShrink: 0,
                    }} />
                    <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.ink, lineHeight: 1.3 }}>
                      {t.name}
                    </p>
                  </div>
                  <span style={{
                    display: 'inline-block',
                    fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em',
                    color: t.color, background: t.colorFaint,
                    padding: '0.2rem 0.5rem',
                    textTransform: 'uppercase',
                    marginBottom: '0.6rem',
                    marginLeft: '1.35rem',
                  }}>
                    {t.tag}
                  </span>
                  <div style={{ marginLeft: '1.35rem' }}>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.1em', color: PALETTE.inkFaint, lineHeight: 1.6, textDecoration: 'none', borderBottom: `1px solid ${PALETTE.border}`, paddingBottom: '1px' }}
                    >
                      {t.work} ↗
                    </a>
                  </div>
                </div>

                {/* Right — contribution */}
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75, fontStyle: 'italic' }}>
                  {t.contribution}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Block>

      {/* ── YOUR DATA ─────────────────────────────────────────── */}
      <Block delay={0.1}>
        <div style={{ paddingBottom: 'clamp(3rem, 7vw, 5rem)', marginBottom: 'clamp(3rem, 7vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
          <SectionLabel>Your data</SectionLabel>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', background: PALETTE.border }}>
            {[
              { label: 'Processing', detail: 'All inference analysis runs in your browser. Your conversations are never uploaded to a server.', icon: '◎' },
              { label: 'AI enrichment', detail: 'Enrichment calls are made via the Anthropic API during your session only. No conversation content is logged or retained by this tool.', icon: '↗' },
              { label: 'Storage', detail: "Results live in your browser's sessionStorage for the duration of your session. They are removed when you close the tab.", icon: '⊗' },
              { label: 'Sharing', detail: 'Nothing is shared with any third party. The dossier exists only in your browser session.', icon: '∅' },
            ].map(item => (
              <div key={item.label} style={{ background: PALETTE.bgPanel, padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '14px', color: PALETTE.redMuted }}>{item.icon}</span>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>{item.label}</p>
                </div>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.7 }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Block>

      {/* ── BUILT BY ──────────────────────────────────────────── */}
      <Block delay={0.12}>
        <div style={{
          paddingBottom: 'clamp(2rem, 4vw, 3rem)',
          marginBottom: 'clamp(3rem, 7vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
        }}>
          <SectionLabel>Built by</SectionLabel>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 'clamp(2rem, 5vw, 4rem)', alignItems: 'end' }}>
            <div>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', color: PALETTE.ink, lineHeight: 1.8, maxWidth: 500, marginBottom: '1rem' }}>
                Finnian Bos is a Digital Media student at the University of Leeds. Trace.ai is a critical practice project that uses AI as both subject and instrument — a tool critical of AI, built with AI.
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, fontStyle: 'italic', maxWidth: 480 }}>
                The tool is the argument. The experience is the critique.
              </p>
            </div>

            {/* Signature block */}
            <div style={{
              textAlign: 'right',
              borderLeft: `1px solid ${PALETTE.border}`,
              paddingLeft: 'clamp(1.5rem, 4vw, 3rem)',
            }}>
              <p style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                color: PALETTE.ink,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: '0.4rem',
                fontStyle: 'italic',
              }}>FB</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Finnian Bos</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8.5px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Leeds, 2026</p>
            </div>
          </div>
        </div>
      </Block>

      <PageFooter
        statement="The tool is the argument."
        followOn="Every claim made in this analysis is grounded in published research and verifiable policy text. The inference is real. The permanence is real. The consent gap is real."
        navItems={[
          { page: 'overview' as DashPage,   act: 'ACT I / 01',   label: 'Back to overview',    body: 'Your data, extracted and mapped.' },
          { page: 'permanent' as DashPage,  act: 'ACT III / 05',  label: 'The permanence',      body: 'Why this profile cannot be removed even if you delete your account.' },
          { page: 'understand' as DashPage, act: 'ACT IV / 08',   label: 'Test the inference',  body: 'Watch the extraction happen on your own words.' },
        ]}
        endLabel="trace.ai / 2026"
        setPage={setPage}
      />

    </div>
  );
}
