'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE, ActLabel } from './DashboardLayout';
import type { DeepAnalysis } from '@/lib/analysis/deepParser';

interface ResistPageProps {
  analysis: DeepAnalysis;
}

// ============================================================================
// SAR LETTER GENERATOR
// ============================================================================
function generateSAR(analysis: DeepAnalysis): string {
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '[YOUR FULL NAME]';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const messageCount = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const period = days > 0
    ? `${new Date(analysis.timespan.first).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} to ${new Date(analysis.timespan.last).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
    : '[DATE RANGE]';

  return `${today}

Data Protection Officer
OpenAI, L.L.C.
3180 18th Street
San Francisco, CA 94110

privacy@openai.com

Re: Subject Access Request under Article 15 UK GDPR / GDPR

Dear Data Protection Officer,

I am writing to exercise my right of access under Article 15 of the UK General Data Protection Regulation (UK GDPR).

My details:
Full name: ${name}
Account email: [YOUR OPENAI ACCOUNT EMAIL]

I request all personal data you hold about me, including:

1. All conversation data and responses (approximately ${messageCount.toLocaleString()} user messages between ${period}).
2. All inferred attributes, behavioural profiles, or commercial segments derived from my conversation history.
3. All metadata including timestamps, device identifiers, IP addresses, and usage patterns.
4. Details of all third parties with whom my data has been shared.
5. Retention periods for each category, including data used in model training.
6. The logic of any automated processing or profiling under Article 22 GDPR.

I also request erasure of all personal data under Article 17 UK GDPR to the extent technically feasible. Please confirm in writing whether any of my data has been used for model training and what steps address my erasure rights.

Please respond within one calendar month as required under Article 12(3) UK GDPR.

Yours faithfully,

${name}`;
}

// ============================================================================
// ANIMATED SECTION NUMBER — giant faint digit behind section heading
// ============================================================================
function SectionMark({ n }: { n: string }) {
  return (
    <div style={{
      fontFamily: TYPE.serif,
      fontSize: 'clamp(7rem, 15vw, 11rem)',
      fontWeight: 400,
      color: 'rgba(26,24,20,0.045)',
      lineHeight: 1,
      userSelect: 'none',
      pointerEvents: 'none',
      letterSpacing: '-0.04em',
      marginBottom: '-1.5rem',
    }}>
      {n}
    </div>
  );
}

// ============================================================================
// DOES / DOESN'T — honest two-column caveat
// ============================================================================
function DoesDoesnt({ does, doesnt }: { does: string; doesnt: string }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1px',
      background: PALETTE.border,
      border: `1px solid ${PALETTE.border}`,
      marginTop: '2rem',
    }}>
      {[
        { label: 'This does', text: does, ok: true },
        { label: "This doesn't", text: doesnt, ok: false },
      ].map(({ label, text, ok }) => (
        <div key={label} style={{ background: PALETTE.bgPanel, padding: '1.25rem 1.4rem' }}>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '9px',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: ok ? PALETTE.green : PALETTE.redMuted,
            marginBottom: '0.6rem',
          }}>
            {label}
          </p>
          <p style={{
            fontFamily: TYPE.serif, fontSize: '0.95rem',
            color: PALETTE.inkMuted, lineHeight: 1.65,
          }}>
            {text}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// DIVIDER
// ============================================================================
function Divider() {
  return (
    <div style={{ height: '1px', background: PALETTE.border, margin: 'clamp(3rem, 7vw, 5rem) 0' }} />
  );
}

// ============================================================================
// ACTION 01 — LIMIT EXPOSURE GOING FORWARD
// ============================================================================
function ActionOptOut() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  const steps = [
    { platform: 'ChatGPT', path: 'Settings → Data Controls → "Improve the model for everyone"', action: 'Turn off', url: 'https://chat.openai.com/#settings/DataControls' },
    { platform: 'Claude', path: 'Settings → Privacy → "Help improve Claude"', action: 'Turn off', url: 'https://claude.ai/settings' },
    { platform: 'Gemini', path: 'My Activity → gemini.google.com/app → Auto-delete → shortest period', action: 'Set limit', url: 'https://myactivity.google.com/product/gemini' },
  ];

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <SectionMark n="01" />
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: PALETTE.redMuted, marginBottom: '0.6rem' }}>
        Limit exposure going forward
      </p>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem', maxWidth: '26ch' }}>
        Turn off training in your settings.
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.12rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '58ch', marginBottom: '2rem' }}>
        Every major AI platform defaults to using your conversations to train future models.
        This is buried in settings, not the sign-up flow. You can turn it off.
        It takes under two minutes and requires no technical knowledge.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border, border: `1px solid ${PALETTE.border}` }}>
        {steps.map((s, i) => (
          <motion.a
            key={s.platform}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(80px,110px) 1fr auto', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.4rem', background: PALETTE.bgPanel, textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = PALETTE.bgHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = PALETTE.bgPanel; }}
          >
            <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: PALETTE.ink, fontWeight: 700 }}>
              {s.platform}
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em', color: PALETTE.inkFaint }}>
              {s.path}
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: PALETTE.green, whiteSpace: 'nowrap' }}>
              {s.action} →
            </span>
          </motion.a>
        ))}
      </div>

      <DoesDoesnt
        does="Stop your future conversations from being used as training data."
        doesnt="Remove what the model already learned from your previous conversations. That data is in the weights. It cannot be located or extracted."
      />
    </motion.section>
  );
}

// ============================================================================
// ACTION 02 — SUBJECT ACCESS REQUEST
// ============================================================================
function ActionSAR({ analysis }: { analysis: DeepAnalysis }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const sar = generateSAR(analysis);
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name;
  const messageCount = analysis?.totalUserMessages || 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(sar);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <SectionMark n="02" />
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: PALETTE.redMuted, marginBottom: '0.6rem' }}>
        Exercise your legal rights
      </p>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem', maxWidth: '26ch' }}>
        Send a Subject Access Request.
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.12rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '58ch', marginBottom: '2rem' }}>
        Under Article 15 of the UK GDPR, you have the right to demand that OpenAI disclose
        every piece of data they hold about you — inferred profiles, retention periods, and whether
        your conversations were used to train a model. They have 30 days to respond.
        {name && messageCount > 0
          ? ` The letter below is pre-filled with your name and approximate message count (${messageCount.toLocaleString()}).`
          : ' The letter below is ready to send — fill in your name and email address.'}
      </p>

      {/* The letter */}
      <div style={{ border: `1px solid ${PALETTE.border}`, background: PALETTE.bgPanel }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${PALETTE.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE.red, opacity: 0.7 }} />
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: PALETTE.inkFaint }}>
              Subject Access Request — OpenAI
            </span>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: PALETTE.inkFaint, background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0' }}
          >
            {expanded ? 'Collapse ↑' : 'View full letter ↓'}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <pre style={{ fontFamily: TYPE.mono, fontSize: 'clamp(10px, 1.4vw, 12px)', lineHeight: 1.8, color: PALETTE.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '1.75rem', margin: 0, borderBottom: `1px solid ${PALETTE.border}`, maxHeight: '400px', overflowY: 'auto' }}>
                {sar}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.97 }}
            style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', background: copied ? PALETTE.green : PALETTE.ink, color: PALETTE.bg, border: 'none', padding: '0.8rem 1.5rem', cursor: 'pointer', transition: 'background 0.3s', minWidth: 160 }}
          >
            {copied ? 'Copied ✓' : 'Copy letter'}
          </motion.button>
          <div>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: PALETTE.inkFaint, marginBottom: '0.2rem' }}>
              Send to
            </p>
            <a href="mailto:privacy@openai.com" style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em', color: PALETTE.ink, textDecoration: 'none', borderBottom: `1px solid ${PALETTE.border}` }}>
              privacy@openai.com
            </a>
          </div>
        </div>
      </div>

      {/* What to expect */}
      <div style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem', background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, borderLeft: `3px solid ${PALETTE.amber}` }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.26em', textTransform: 'uppercase', color: PALETTE.amber, marginBottom: '0.75rem' }}>
          What to expect
        </p>
        <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: '64ch' }}>
          OpenAI will send a data export and respond to the erasure request.
          They will almost certainly confirm that data used in model training cannot be individually
          removed — this is the technical reality this tool documents. The value of the letter
          is not retrieval. It is forcing them to state the limitation in writing.
        </p>
      </div>

      <DoesDoesnt
        does="Force OpenAI to disclose what they hold, confirm retention periods, and state in writing what your rights around training data actually are."
        doesnt="Delete your data from trained model weights. Under current GDPR interpretation, OpenAI is not required to retrain models to accommodate individual erasure requests."
      />
    </motion.section>
  );
}

// ============================================================================
// ACTION 03 — CONSIDER ALTERNATIVES
// ============================================================================
function ActionAlternatives() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  const categories = [
    {
      label: 'Fully local — nothing leaves your machine',
      color: PALETTE.green,
      items: [
        { name: 'Ollama', url: 'https://ollama.com', desc: 'Run open-source models (Llama, Mistral, Gemma) on your own hardware. No account. No telemetry. Conversations never leave your device.' },
        { name: 'LM Studio', url: 'https://lmstudio.ai', desc: 'Desktop app for local models with a ChatGPT-style interface. Works offline. No data collection.' },
        { name: 'Jan', url: 'https://jan.ai', desc: 'Fully offline, open source, explicitly no telemetry. Built for privacy as a first principle.' },
      ],
    },
    {
      label: 'Cloud-based with better defaults',
      color: PALETTE.amber,
      items: [
        { name: 'Mistral Le Chat', url: 'https://chat.mistral.ai', desc: 'EU-based. Does not train on conversations by default. Subject to stronger EU data protection law.' },
        { name: 'Claude (opt out)', url: 'https://claude.ai/settings', desc: "Opt out in Settings → Privacy. Anthropic's data retention policy is more explicit than OpenAI's." },
        { name: 'Perplexity', url: 'https://perplexity.ai', desc: 'Search-focused. Conversations not used for model training by default. Different use case but worth knowing.' },
      ],
    },
  ];

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <SectionMark n="03" />
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.32em', textTransform: 'uppercase', color: PALETTE.redMuted, marginBottom: '0.6rem' }}>
        Change what you use
      </p>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.9rem, 3.6vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem', maxWidth: '26ch' }}>
        Tools that don't require this trade-off.
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.7vw, 1.12rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '58ch', marginBottom: '2.5rem' }}>
        The problem is not AI. It is the default assumption that your conversations belong
        to the platform. Local models and privacy-respecting cloud tools exist and are ready to use now.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {categories.map((cat, ci) => (
          <div key={cat.label}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: cat.color, marginBottom: '0.75rem' }}>
              {cat.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border, border: `1px solid ${PALETTE.border}` }}>
              {cat.items.map((item, i) => (
                <motion.a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.15 + ci * 0.1 + i * 0.08, duration: 0.5 }}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(80px,110px) 1fr', gap: '1rem', alignItems: 'start', padding: '1.1rem 1.4rem', background: PALETTE.bgPanel, textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = PALETTE.bgHover; }}
                  onMouseLeave={e => { e.currentTarget.style.background = PALETTE.bgPanel; }}
                >
                  <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: PALETTE.ink, fontWeight: 700, paddingTop: '0.1rem' }}>
                    {item.name} →
                  </span>
                  <span style={{ fontFamily: TYPE.serif, fontSize: '0.98rem', color: PALETTE.inkMuted, lineHeight: 1.65 }}>
                    {item.desc}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <DoesDoesnt
        does="Prevent future conversations from entering any commercial training pipeline. Local models are entirely air-gapped from their developers."
        doesnt="Reach what has already been extracted. The analysis you just ran is based on what is already inside the model. Switching tools cannot change that."
      />
    </motion.section>
  );
}

// ============================================================================
// CLOSING — honest, not dramatic
// ============================================================================
function Closing({ messageCount, days, setPage }: { messageCount: number; days: number; setPage?: (p: string) => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2, delay: 0.4 }}
      style={{ padding: 'clamp(4rem, 9vw, 7rem) 0 clamp(6rem, 12vw, 9rem)', borderTop: `1px solid ${PALETTE.border}`, maxWidth: '60ch' }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: PALETTE.inkGhost, marginBottom: '1.5rem' }}>
        End of record
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.4rem)', color: PALETTE.inkMuted, lineHeight: 1.8, marginBottom: '1.25rem' }}>
        {messageCount > 0
          ? `${messageCount.toLocaleString()} messages over ${days} days are already inside the model. None of the actions above change that.`
          : 'The data already inside the model cannot be removed. None of the actions above change that.'}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.75vw, 1.2rem)', color: PALETTE.inkGhost, lineHeight: 1.8 }}>
        What they change is what happens next. That is still a choice you have.
      </p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.8, duration: 1.2 }}
        style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(26,24,20,0.15)', marginTop: '3.5rem' }}
      >
        YOU AGREED · TRACE.AI · 2026
      </motion.p>
      {setPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 2.4, duration: 1 }}
          style={{ marginTop: '3rem' }}
        >
          <button
            onClick={() => setPage('method')}
            style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
              textTransform: 'uppercase', background: 'none', border: '1px solid rgba(26,24,20,0.15)',
              color: 'rgba(26,24,20,0.35)', padding: '0.6rem 1.2rem', cursor: 'pointer',
              transition: 'color 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(26,24,20,0.7)'; e.currentTarget.style.borderColor = 'rgba(26,24,20,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(26,24,20,0.35)'; e.currentTarget.style.borderColor = 'rgba(26,24,20,0.15)'; }}
          >
            A note on method →
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function ResistPage({ analysis, setPage }: ResistPageProps & { setPage?: (p: string) => void }) {
  const messageCount = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div
      className="dash-page-inner"
      style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 0 }}
    >
      {/* Header */}
      <div style={{ padding: 'clamp(3rem, 8vw, 5.5rem) 0 clamp(2.5rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(3rem, 7vw, 5rem)' }}>
        <ActLabel roman="V" title="After" pageLabel="09 / What you can do" />
        <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.028em', lineHeight: 1.1, maxWidth: '22ch', marginTop: '1.5rem', marginBottom: '1.25rem' }}>
          Three things you can still do.
        </h1>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.22rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '54ch' }}>
          None of them undo what has already been extracted.
          All of them limit what happens from this point forward.
        </p>
      </div>

      {/* Three actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3.5rem, 8vw, 6rem)' }}>
        <ActionOptOut />
        <Divider />
        <ActionSAR analysis={analysis} />
        <Divider />
        <ActionAlternatives />
      </div>

      <Closing messageCount={messageCount} days={days} setPage={setPage} />
    </div>
  );
}
