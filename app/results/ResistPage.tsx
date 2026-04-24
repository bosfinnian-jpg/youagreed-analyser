'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

interface ResistPageProps {
  analysis: DeepAnalysis;
}

// ============================================================================
// SAR GENERATOR
// ============================================================================

function generateSAR(analysis: DeepAnalysis): string {
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '[YOUR FULL NAME]';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const messageCount = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const period = days > 0
    ? `${new Date(analysis.timespan.first).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} to ${new Date(analysis.timespan.last).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
    : '[DATE RANGE]';
  return `${today}\n\nData Protection Officer\nOpenAI, L.L.C.\n3180 18th Street\nSan Francisco, CA 94110\n\nprivacy@openai.com\n\nRe: Subject Access Request under Article 15 UK GDPR / GDPR\n\nDear Data Protection Officer,\n\nI am writing to exercise my right of access under Article 15 of the UK General Data Protection Regulation (UK GDPR).\n\nMy details:\nFull name: ${name}\nAccount email: [YOUR OPENAI ACCOUNT EMAIL]\n\nI request all personal data you hold about me, including:\n\n1. All conversation data and responses (approximately ${messageCount.toLocaleString()} user messages between ${period}).\n2. All inferred attributes, behavioural profiles, or commercial segments derived from my conversation history.\n3. All metadata including timestamps, device identifiers, IP addresses, and usage patterns.\n4. Details of all third parties with whom my data has been shared.\n5. Retention periods for each category, including data used in model training.\n6. The logic of any automated processing or profiling under Article 22 GDPR.\n\nI also request erasure of all personal data under Article 17 UK GDPR to the extent technically feasible. Please confirm in writing whether any of my data has been used for model training and what steps address my erasure rights.\n\nPlease respond within one calendar month as required under Article 12(3) UK GDPR.\n\nYours faithfully,\n\n${name}`;
}

// ============================================================================
// THE ECHO
// ============================================================================

function TheEcho({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [phase, setPhase] = useState<'idle' | 'generating' | 'typing' | 'revealed' | 'error'>('idle');
  const [displayedText, setDisplayedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const characterSummary = analysis?.synthesis?.characterSummary || '';
  const verbatimTells = (analysis?.synthesis?.verbalTells || []).slice(0, 3);
  const writingVoice = (analysis?.psychologicalPortrait as any)?.writingVoice || '';
  const dominantNarrative = ((analysis?.synthesis?.recurringConcerns || []) as any[]).slice(0, 2).map((c: any) => c.concern).join('; ');
  const hasSynthesis = characterSummary.length > 50 || verbatimTells.length > 0;
  const fallbackText = analysis?.juiciestMoments?.[0]?.excerpt || '';

  const runEcho = useCallback(async () => {
    setPhase('generating');
    try {
      let text = '';
      if (hasSynthesis) {
        const prompt = `You are a language model that has learned to write exactly like a specific person. Write ONE short paragraph (80-110 words) in first person on this topic: "something I keep returning to in my mind."

Voice patterns to match exactly:
${characterSummary ? `Character: ${characterSummary.slice(0, 300)}` : ''}
${verbatimTells.length > 0 ? `Writing tells: ${(verbatimTells as any[]).map((t: any) => `"${t.tell}" — ${t.meaning}`).join('; ')}` : ''}
${writingVoice ? `Voice: ${writingVoice}` : ''}
${dominantNarrative ? `Recurring themes: ${dominantNarrative}` : ''}

Rules: Do NOT explain yourself. Do NOT use quotation marks. Do NOT start with "I". Write as a journal entry fragment. Match sentence rhythm, vocabulary register, and emotional texture precisely.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 200,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const data = await response.json();
        text = data.content?.[0]?.text?.trim() || '';
      }
      if (!text && fallbackText) text = fallbackText.slice(0, 250);
      if (!text) throw new Error('Insufficient data to generate a voice sample.');

      setPhase('typing');
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setTimeout(() => setPhase('revealed'), 800); }
      }, 28);
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed.');
      setPhase('error');
    }
  }, [hasSynthesis, fallbackText, characterSummary, verbatimTells, writingVoice, dominantNarrative]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(5rem, 12vw, 9rem)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>01</span>
        <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>The echo</span>
      </div>
      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.2, maxWidth: '20ch', marginBottom: '1.25rem' }}>
        The model learned your voice.
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '52ch', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        Not just what you said. How you say it — your sentence rhythm, vocabulary, patterns of disclosure. Below is a paragraph{hasSynthesis ? ' written by a language model using those patterns' : ' from your most exposing conversation'}. Press generate to see it appear.
      </p>

      <div style={{ position: 'relative', background: PALETTE.bgPanel, border: `1px solid ${phase === 'revealed' ? PALETTE.red : PALETTE.border}`, borderLeft: `3px solid ${phase === 'revealed' ? PALETTE.red : PALETTE.border}`, padding: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: '1.5rem', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'border-color 0.6s' }}>
        {phase === 'idle' && <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)', color: PALETTE.inkGhost, lineHeight: 1.75, fontStyle: 'italic' }}>Press generate to see what the model has learned.</p>}
        {phase === 'generating' && <motion.p animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.4 }} style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>Synthesising voice patterns...</motion.p>}
        {(phase === 'typing' || phase === 'revealed') && (
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.85, fontStyle: 'italic' }}>
            {displayedText}
            {phase === 'typing' && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} style={{ color: PALETTE.red }}>▌</motion.span>}
          </p>
        )}
        {phase === 'error' && <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.15em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>{errorMsg}</p>}
      </div>

      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            style={{ borderLeft: `2px solid ${PALETTE.red}`, paddingLeft: '1.25rem', marginBottom: '2rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {hasSynthesis ? '— not written by you' : '— your words, shown back'}
            </p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '55ch' }}>
              {hasSynthesis ? 'This paragraph was generated by a language model using patterns extracted from your conversations. You did not write it. The model did — from what it learned of you. This is the difference between storage and absorption.' : 'This is text from your own conversations — shown back as a data record. This is what the model holds.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === 'idle' || phase === 'error') && (
        <motion.button onClick={runEcho} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', background: 'transparent', color: PALETTE.ink, border: `1px solid ${PALETTE.ink}`, padding: '0.9rem 2rem', cursor: 'pointer', transition: 'all 0.2s', minHeight: '44px' }}
          onMouseEnter={e => { e.currentTarget.style.background = PALETTE.ink; e.currentTarget.style.color = PALETTE.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = PALETTE.ink; }}>
          Generate →
        </motion.button>
      )}
    </motion.div>
  );
}

// ============================================================================
// THE TIMELINE
// ============================================================================

function TheTimeline({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  const firstDate = analysis?.timespan?.first ? new Date(analysis.timespan.first) : null;
  const lastDate = analysis?.timespan?.last ? new Date(analysis.timespan.last) : null;
  const days = analysis?.timespan?.days || 0;
  const messages = analysis?.totalUserMessages || 0;
  const now = new Date();
  const daysSinceLast = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  if (!firstDate || !lastDate || days === 0) return null;

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(5rem, 12vw, 9rem)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>02</span>
        <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>When it happened</span>
      </div>

      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.2, maxWidth: '22ch', marginBottom: '1.25rem' }}>
        {days.toLocaleString()} days inside the system.
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '52ch', marginBottom: 'clamp(2rem, 4vw, 3.5rem)' }}>
        {messages.toLocaleString()} messages sent. The last one {daysSinceLast > 0 ? `${daysSinceLast.toLocaleString()} days ago` : 'recently'}. Time continued. The model did not.
      </p>

      {/* Timeline bar */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}} transition={{ delay: 0.3, duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ height: '1px', background: PALETTE.border, transformOrigin: 'left' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { label: fmt(firstDate), sub: 'First message', color: PALETTE.inkFaint, delay: 0.5 },
            { label: 'Training ←→', sub: 'Estimated period', color: PALETTE.red, delay: 0.9 },
            { label: fmt(lastDate), sub: 'Last message', color: PALETTE.inkFaint, delay: 0.7 },
            { label: 'Now →', sub: 'Time continues', color: PALETTE.inkMuted, delay: 1.2 },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: m.delay, duration: 0.5 }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.12em', color: m.color, marginBottom: '2px' }}>{m.label}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.1em', color: PALETTE.inkGhost, textTransform: 'uppercase' }}>{m.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stat grid */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.2, duration: 0.8 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1px', background: PALETTE.border, border: `1px solid ${PALETTE.border}`, marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
        {[
          { value: days.toLocaleString(), label: 'Days of history', red: false },
          { value: messages.toLocaleString(), label: 'Messages processed', red: false },
          { value: daysSinceLast > 0 ? `${daysSinceLast.toLocaleString()}d ago` : 'Recent', label: 'Last message', red: true },
        ].map((stat, i) => (
          <div key={i} style={{ background: PALETTE.bg, padding: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: stat.red ? PALETTE.red : PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: '0.4rem' }}>{stat.value}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// THE LETTER
// ============================================================================

function TheLetter({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const sarText = generateSAR(analysis);

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(5rem, 12vw, 9rem)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>03</span>
        <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>The one thing</span>
      </div>

      <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.2, maxWidth: '22ch', marginBottom: '1.25rem' }}>
        Write to them.
      </h2>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '52ch', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        A Subject Access Request under Article 15 UK GDPR forces OpenAI to disclose everything they hold on you — inferred profiles, retention periods, and whether your data was used in training. They have 30 days to respond. This does not undo what has been done. It makes it visible.
      </p>

      <button onClick={() => setOpen(o => !o)}
        style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', background: 'transparent', color: PALETTE.ink, border: `1px solid ${PALETTE.ink}`, padding: '0.9rem 2rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.5rem', minHeight: '44px' }}
        onMouseEnter={e => { e.currentTarget.style.background = PALETTE.ink; e.currentTarget.style.color = PALETTE.bg; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = PALETTE.ink; }}>
        {open ? 'Hide the letter' : 'Generate the letter →'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5 }} style={{ overflow: 'hidden' }}>
            <div style={{ background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, padding: 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: '1rem' }}>
              <pre style={{ fontFamily: TYPE.mono, fontSize: '12px', lineHeight: 1.8, color: PALETTE.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{sarText}</pre>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => { navigator.clipboard.writeText(sarText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: copied ? PALETTE.green : PALETTE.ink, textTransform: 'uppercase', background: 'none', border: `1px solid ${copied ? PALETTE.green : PALETTE.border}`, padding: '0.6rem 1.2rem', cursor: 'pointer', transition: 'all 0.2s', minHeight: '44px' }}>
                {copied ? 'Copied ✓' : 'Copy to clipboard →'}
              </button>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkFaint, lineHeight: 1.6 }}>
                Fill in the bracketed fields. Send to privacy@openai.com. They have 30 days to respond.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// THE CLOSE — inverted palette, full bleed, one sentence
// ============================================================================

function TheClose({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [lineRevealed, setLineRevealed] = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const [exitRevealed, setExitRevealed] = useState(false);

  const name = analysis?.findings?.personalInfo?.names?.[0]?.name || '';
  const messages = analysis?.totalUserMessages || 0;

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setLineRevealed(true), 400);
    const t2 = setTimeout(() => setTextRevealed(true), 1200);
    const t3 = setTimeout(() => setExitRevealed(true), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isInView]);

  return (
    <div ref={ref} style={{
      background: PALETTE.ink,
      margin: '0 calc(-1 * clamp(2rem, 6vw, 5rem))',
      padding: 'clamp(5rem, 14vw, 10rem) clamp(2rem, 6vw, 5rem)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      minHeight: '85vh', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ghost number — message count in background */}
      {messages > 0 && (
        <div style={{ position: 'absolute', right: '3%', top: '50%', transform: 'translateY(-50%)', fontFamily: TYPE.serif, fontSize: 'clamp(8rem, 22vw, 20rem)', color: 'rgba(238,236,229,0.025)', letterSpacing: '-0.05em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
          {messages.toLocaleString()}
        </div>
      )}

      <motion.div initial={{ scaleX: 0 }} animate={lineRevealed ? { scaleX: 1 } : {}} transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        style={{ height: '1px', background: 'rgba(238,236,229,0.14)', width: '100%', transformOrigin: 'left', marginBottom: 'clamp(3rem, 6vw, 5rem)' }} />

      <AnimatePresence>
        {textRevealed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(238,236,229,0.25)', textTransform: 'uppercase', marginBottom: '2rem' }}>
              ACT IV — AFTER — THE END
            </p>
            <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', fontWeight: 400, color: '#eeece5', letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: '18ch', marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
              {name ? `${name}, your words are in there now.` : 'Your words are in there now.'}
            </h2>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', color: 'rgba(238,236,229,0.5)', lineHeight: 1.8, maxWidth: '46ch', marginBottom: 'clamp(2rem, 4vw, 3rem)', fontStyle: 'italic' }}>
              Not in a database with your name on it. In the mathematics of the model — dissolved, irretrievable, permanent. Every person who uses it from now on uses something your conversations helped build.
            </p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.15rem)', color: 'rgba(238,236,229,0.28)', lineHeight: 1.7, maxWidth: '42ch' }}>
              The argument is complete. The record is permanent. You were not warned adequately. Now you know.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exitRevealed && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}
            style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: 'rgba(238,236,229,0.18)', textTransform: 'uppercase', marginTop: 'clamp(4rem, 8vw, 7rem)' }}>
            You can leave now.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function ResistHeader({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
      style={{ padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(4rem, 8vw, 7rem)' }}>
      <ActLabel roman="IV" title="After" pageLabel="08 / Resist" />
      <ThreadSentence>The extraction is complete. The argument is complete. This is what remains.</ThreadSentence>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4, duration: 0.9 }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, maxWidth: '22ch', marginBottom: '1.5rem' }}>
        After the argument.
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.8, duration: 0.8 }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.35rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '50ch' }}>
        The data was extracted. The model was trained. The argument for why it cannot be reversed has been made. What follows is not a solution — it is what remains possible when nothing can be undone.
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// MAIN
// ============================================================================

export default function ResistPage({ analysis }: ResistPageProps) {
  const pad = 'clamp(2rem, 6vw, 5rem)';
  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 0 }}>
      <ResistHeader analysis={analysis} />
      <TheEcho analysis={analysis} />
      <TheTimeline analysis={analysis} />
      <TheLetter analysis={analysis} />
      <TheClose analysis={analysis} />
    </div>
  );
}
