'use client';

import { motion } from 'framer-motion';
import { PALETTE, TYPE, type DashPage, PageFooter } from './layout/DashboardLayout';

// ============================================================================
// ABOUT - trace.ai
// ============================================================================

export default function AboutPage({ setPage }: { setPage: (p: DashPage) => void }) {
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 'clamp(4rem, 10vw, 8rem)' }}>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          padding: 'clamp(3.5rem, 9vw, 7rem) 0 clamp(3rem, 6vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 7vw, 5rem)',
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
            trace.ai - critical digital media practice
          </span>
          <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
        </motion.div>

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
          Trace.ai is a critical art installation and interactive web experience examining how consent frameworks designed for reversible behavioural tracking fail when applied to irreversible AI cognitive extraction.
        </motion.p>
      </motion.div>

      {/* BODY */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{ maxWidth: 640, marginBottom: 'clamp(3rem, 7vw, 5rem)' }}
      >
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.85, marginBottom: '1.5rem' }}>
          This tool analyses your ChatGPT or Claude conversation export and produces a structured account of what that data makes possible - what was inferred, what was disclosed, and what cannot be removed. It is not a privacy scanner. It is an argument about the structural inadequacy of consent.
        </p>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.85, marginBottom: '1.5rem' }}>
          Cookie-era consent was designed for reversible behavioural tracking. You could delete a cookie. You could withdraw consent and the record would go with it. AI training is different: a sentence processed during training dissolves into weight adjustments across hundreds of billions of parameters - distributed, non-contiguous, structurally non-isolable. There is no row to delete. The right to erasure, as written, cannot be technically fulfilled.
        </p>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.85 }}>
          Trace.ai was built with AI in order to critique it. The tool is the argument. The experience is the critique.
        </p>
      </motion.div>

      {/* YOUR DATA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        style={{ marginBottom: 'clamp(3rem, 7vw, 5rem)', borderTop: `1px solid ${PALETTE.border}`, paddingTop: 'clamp(2rem, 5vw, 3.5rem)' }}
      >
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          Your data
        </p>
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
      </motion.div>

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
