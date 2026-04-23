'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

interface ResistPageProps {
  analysis: DeepAnalysis;
}

// ============================================================================
// DATA
// ============================================================================

const SETTINGS_STEPS = [
  { id: 'training', label: 'Disable training on your data', path: 'Settings → Data Controls → Improve the model for everyone', covers: 72, gap: 'Does not affect data already used in training. Only applies to future conversations.', actionUrl: 'https://chat.openai.com/', actionLabel: 'Open ChatGPT Settings' },
  { id: 'memory', label: 'Disable memory', path: 'Settings → Personalisation → Memory', covers: 18, gap: 'Prevents future memory storage only. Existing memories must be manually deleted.', actionUrl: 'https://chat.openai.com/', actionLabel: 'Open ChatGPT Settings' },
  { id: 'tempchat', label: 'Use temporary chats', path: 'New chat → Temporary chat (top of sidebar)', covers: 31, gap: 'Retained up to 30 days for safety review. Not end-to-end encrypted.', actionUrl: 'https://chat.openai.com/', actionLabel: 'Open ChatGPT' },
  { id: 'history', label: 'Delete your conversation history', path: 'Settings → Data Controls → Delete all chats', covers: 44, gap: 'Removes from your account. Does not remove from model weights if already trained.', actionUrl: 'https://chat.openai.com/', actionLabel: 'Open ChatGPT Settings' },
  { id: 'datarequest', label: 'Export your data first', path: 'Settings → Data Controls → Export data', covers: 0, gap: 'This is what you already did. It does not reduce exposure — it reveals it.', actionUrl: 'https://chat.openai.com/', actionLabel: 'Open ChatGPT Settings', isCompleted: true },
];

const ORGS = [
  { name: 'noyb', full: 'None of Your Business', country: 'EU / Austria', description: 'Filed GDPR complaints against OpenAI in multiple EU states. Operates on behalf of individuals.', url: 'https://noyb.eu', tag: 'Active litigation', tagColor: PALETTE.red },
  { name: 'ICO', full: 'Information Commissioner\'s Office', country: 'United Kingdom', description: 'UK data protection authority. You can file a complaint if OpenAI has not responded to a SAR within one month.', url: 'https://ico.org.uk/make-a-complaint/', tag: 'File a complaint', tagColor: PALETTE.amber },
  { name: 'Privacy International', full: 'Privacy International', country: 'Global', description: 'Challenges surveillance and data exploitation through research, litigation, and policy advocacy.', url: 'https://privacyinternational.org', tag: 'Research & advocacy', tagColor: PALETTE.inkMuted },
  { name: 'Big Brother Watch', full: 'Big Brother Watch', country: 'United Kingdom', description: 'UK civil liberties organisation focused on surveillance and privacy. Runs public campaigns and policy submissions.', url: 'https://bigbrotherwatch.org.uk', tag: 'UK campaigns', tagColor: PALETTE.inkMuted },
  { name: 'EFF', full: 'Electronic Frontier Foundation', country: 'USA', description: 'Defends digital privacy and free expression through litigation, policy, and technology projects.', url: 'https://eff.org', tag: 'Legal defence', tagColor: PALETTE.amber },
];

const ALTERNATIVES = [
  { name: 'Ollama', description: 'Run open-source models (Llama 3, Mistral, Gemma) locally. No data leaves your machine.', url: 'https://ollama.com', privacy: 100 },
  { name: 'LM Studio', description: 'Local model runner with a clean UI. Runs entirely on your hardware — zero telemetry.', url: 'https://lmstudio.ai', privacy: 100 },
  { name: 'Mistral Le Chat', description: 'EU-based AI with stronger GDPR commitments and explicit no-training opt-out for all users.', url: 'https://chat.mistral.ai', privacy: 61 },
  { name: 'Claude (Anthropic)', description: 'Does not train on free-tier conversations by default. Constitutional AI methodology.', url: 'https://claude.ai', privacy: 54 },
];

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
// SHARED UI
// ============================================================================

function CoverageBar({ coverage, label }: { coverage: number; label?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const gapColor = coverage === 0 ? PALETTE.red : coverage < 40 ? PALETTE.redMuted : coverage < 70 ? PALETTE.amber : PALETTE.green;
  return (
    <div ref={ref} style={{ marginTop: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{label || 'Protection coverage'}</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: gapColor }}>{coverage}%</span>
      </div>
      <div style={{ height: 2, background: PALETTE.border, position: 'relative', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={isInView ? { width: `${coverage}%` } : {}} transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }} style={{ height: '100%', background: gapColor, position: 'absolute', left: 0, top: 0 }} />
      </div>
    </div>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
      <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>{index}</span>
      <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
      <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ============================================================================
// EXPOSURE COVERAGE GRID
// ============================================================================

function ExposureGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const ACTIONS = [
    { label: 'Disable training', cells: 31, color: 'rgba(107,203,119,0.8)', description: 'Prevents future training use' },
    { label: 'Delete history', cells: 22, color: 'rgba(78,205,196,0.8)', description: 'Removes from account view' },
    { label: 'Temp chats', cells: 18, color: 'rgba(187,134,252,0.75)', description: 'Limits new data retention' },
    { label: 'Memory off', cells: 8, color: 'rgba(255,183,77,0.8)', description: 'Stops profile memory' },
  ];
  const PERMANENT = 21;
  const cellColors: (string | null)[] = new Array(100).fill(null);
  let cursor = 0;
  ACTIONS.forEach(a => { for (let i = 0; i < a.cells; i++) cellColors[cursor++] = a.color; });
  for (let i = 79; i < 100; i++) cellColors[i] = 'perm';

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: 'clamp(2.5rem, 5vw, 4rem)', marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Exposure coverage — all actions taken</p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.inkFaint, lineHeight: 1.7, maxWidth: 520, marginBottom: '2rem' }}>Each cell is 1% of your data exposure surface. Even completing every action, these remain.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '3px', maxWidth: 420, marginBottom: '1.75rem' }}>
        {cellColors.map((color, i) => {
          const isPerm = color === 'perm';
          return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.3 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.02 + (i / 100) * 0.6, duration: 0.3, type: 'spring', stiffness: 400 }}
              style={{ aspectRatio: '1', background: isPerm ? 'rgba(190,40,30,0.75)' : color || PALETTE.bgElevated, border: isPerm ? `1px solid rgba(190,40,30,0.4)` : `1px solid ${PALETTE.border}`, borderRadius: '2px', boxShadow: isPerm ? '0 0 4px rgba(190,40,30,0.25)' : 'none' }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem', maxWidth: 440 }}>
        {ACTIONS.map((a, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: 10, height: 10, background: a.color, borderRadius: '2px', flexShrink: 0 }} /><span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em', color: PALETTE.inkMuted, textTransform: 'uppercase' }}>{a.label} — {a.cells} cells — {a.description}</span></div>))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: 10, height: 10, background: 'rgba(190,40,30,0.75)', borderRadius: '2px', flexShrink: 0 }} /><span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em', color: PALETTE.red, textTransform: 'uppercase' }}>Already in model weights — {PERMANENT} cells — unreachable</span></div>
      </div>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.7, maxWidth: 560, fontStyle: 'italic', borderLeft: `3px solid ${PALETTE.red}`, paddingLeft: '1rem' }}>
        {PERMANENT}% of your exposure surface cannot be reduced by any action available to you. Those cells are the cognitive patterns already embedded in model weights — the part of you that cannot be retrieved.
      </p>
    </motion.div>
  );
}

// ============================================================================
// ─── SEND-OFF PIECE 1: THE MIRROR ───────────────────────────────────────────
// The user's actual inferred profile, written as advertising copy.
// From the system's perspective. Uses their real data.
// ============================================================================

function buildMirrorText(analysis: DeepAnalysis): string[] {
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name;
  const msgs = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const topics = analysis?.findings?.sensitiveTopics || [];
  const themes = analysis?.findings?.repetitiveThemes || [];
  const locations = analysis?.findings?.personalInfo?.locations || [];
  const hasMentalHealth = topics.some((t: any) => ['mental_health','anxiety','depression','therapy','stress'].some(k => (t.category||'').toLowerCase().includes(k)));
  const hasFinancial = topics.some((t: any) => ['financial','money','debt','employment'].some(k => (t.category||'').toLowerCase().includes(k)));
  const hasHealth = topics.some((t: any) => ['medical','health','hospital','medication'].some(k => (t.category||'').toLowerCase().includes(k)));
  const hasRelationship = topics.some((t: any) => ['relationship','family','partner'].some(k => (t.category||'').toLowerCase().includes(k)));
  const nighttime = (analysis?.nighttimeRatio || 0) > 0.08;
  const firstLoc = locations[0]?.location;
  const topTheme = themes[0]?.theme;
  const synth = (analysis as any).synthesis;

  const lines: string[] = [];

  lines.push(name ? `${name}.` : 'Subject profile.');

  const yearsFraction = days > 365 ? `${(days / 365).toFixed(1)} years` : `${Math.round(days / 30)} months`;
  lines.push(`${msgs.toLocaleString()} messages. ${yearsFraction} of recorded thought.`);

  if (hasMentalHealth && hasFinancial) {
    lines.push('Elevated anxiety indicators present alongside financial stress signals. A high-value segment for wellness, financial services, and pharmaceutical targeting.');
  } else if (hasMentalHealth) {
    lines.push('Mental health signals detected across the corpus. Classified under therapeutic, pharmaceutical, and crisis-support targeting categories.');
  } else if (hasFinancial) {
    lines.push('Financial vulnerability signals present. Matches categories used by lenders, debt consolidation services, and employment platforms.');
  }

  if (hasHealth) {
    lines.push('Medical disclosures identified. Insurance profiling applicable. Health data is among the most commercially sensitive categories in existence.');
  }

  if (hasRelationship) {
    lines.push('Relationship data present — partners, family, named individuals. Each name expands the social graph without their consent.');
  }

  if (nighttime) {
    lines.push('Late-night usage pattern detected. Users at this hour are statistically more emotionally unguarded. This window commands a premium in behavioural advertising markets.');
  }

  if (firstLoc) {
    lines.push(`Location signals present. ${firstLoc} identified. Geographic targeting applies.`);
  }

  if (topTheme) {
    lines.push(`Dominant preoccupation: ${topTheme}. This pattern repeats across the corpus. Repetition signals genuine concern — the kind advertisers pay to reach.`);
  }

  if (synth?.characterSummary) {
    const summary = synth.characterSummary;
    if (summary.length > 20) {
      lines.push(`Psychological profile note: "${summary.substring(0, 120)}${summary.length > 120 ? '...' : ''}"`);
    }
  }

  lines.push('This profile was not submitted. It was extracted.');

  return lines;
}

function TheMirror({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [revealed, setRevealed] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const lines = buildMirrorText(analysis);

  useEffect(() => {
    if (!revealed) return;
    if (lineIndex >= lines.length) return;
    const delay = lineIndex === 0 ? 600 : lineIndex === lines.length - 1 ? 1400 : 900;
    const t = setTimeout(() => setLineIndex(i => i + 1), delay);
    return () => clearTimeout(t);
  }, [revealed, lineIndex, lines.length]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #0c0b0a 0%, #111009 100%)',
        margin: '0 calc(-1 * clamp(2rem, 6vw, 5rem))',
        padding: 'clamp(4rem, 10vw, 7rem) clamp(2rem, 6vw, 5rem)',
        overflow: 'hidden',
      }}
    >
      {/* Subtle paper texture overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', opacity: 0.025, pointerEvents: 'none' }} />

      {/* Ghost score — background */}
      {(analysis as any).privacyScore > 0 && (
        <div style={{ position: 'absolute', right: '-2%', top: '50%', transform: 'translateY(-50%)', fontFamily: TYPE.serif, fontSize: 'clamp(180px, 25vw, 320px)', fontWeight: 400, color: 'rgba(240,237,232,0.018)', lineHeight: 1, letterSpacing: '-0.06em', pointerEvents: 'none', userSelect: 'none' }}>
          {(analysis as any).privacyScore}
        </div>
      )}

      {/* Section label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 1 }}
        style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(190,40,30,0.5)', textTransform: 'uppercase', marginBottom: 'clamp(2rem, 5vw, 3.5rem)' }}
      >
        Advertiser profile — system output
      </motion.p>

      {!revealed ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6, duration: 0.8 }}>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.8vw, 1.8rem)', color: 'rgba(240,237,232,0.7)', lineHeight: 1.7, maxWidth: 580, marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            This is the profile the analysis built from your conversations. Written as the system sees you — not as who you are, but as what you are worth and what you can be sold.
          </p>
          <button
            onClick={() => { setRevealed(true); setLineIndex(0); setTimeout(() => setLineIndex(1), 400); }}
            style={{ fontFamily: TYPE.mono, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', background: 'none', border: '1px solid rgba(240,237,232,0.2)', color: 'rgba(240,237,232,0.8)', padding: '1rem 2rem', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,237,232,0.5)'; e.currentTarget.style.color = 'rgba(240,237,232,1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,237,232,0.2)'; e.currentTarget.style.color = 'rgba(240,237,232,0.8)'; }}
          >
            Show me the profile →
          </button>
        </motion.div>
      ) : (
        <div style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
          {lines.slice(0, lineIndex).map((line, i) => {
            const isLast = i === lines.length - 1;
            const isFirst = i === 0;
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  fontFamily: isFirst ? TYPE.serif : isLast ? TYPE.mono : TYPE.serif,
                  fontSize: isFirst ? 'clamp(2rem, 4.5vw, 3rem)' : isLast ? '11px' : 'clamp(1.1rem, 2vw, 1.3rem)',
                  color: isFirst ? 'rgba(240,237,232,0.95)' : isLast ? 'rgba(190,40,30,0.65)' : 'rgba(240,237,232,0.72)',
                  lineHeight: isFirst ? 1.15 : 1.8,
                  letterSpacing: isFirst ? '-0.03em' : isLast ? '0.18em' : '0',
                  textTransform: isLast ? 'uppercase' : 'none',
                  fontStyle: i > 0 && !isLast && i < lines.length - 2 ? 'italic' : 'normal',
                  marginBottom: isFirst ? 'clamp(1.5rem, 3vw, 2rem)' : isLast ? 0 : '1.25rem',
                  maxWidth: isLast ? 'none' : 640,
                  borderTop: isLast ? '1px solid rgba(190,40,30,0.2)' : 'none',
                  paddingTop: isLast ? '1.5rem' : 0,
                  marginTop: isLast ? '1.5rem' : 0,
                }}
              >
                {line}
              </motion.p>
            );
          })}

          {/* Blinking cursor while lines are appearing */}
          {lineIndex < lines.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse' }}
              style={{ display: 'inline-block', width: 2, height: '1.2em', background: 'rgba(190,40,30,0.6)', marginLeft: 4, verticalAlign: 'middle' }}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// ─── SEND-OFF PIECE 2: THE LAST TRANSMISSION ────────────────────────────────
// Their most exposing moment, shown transmitting in real time.
// Character by character. Then it dissolves.
// ============================================================================

function LastTransmission({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const moment = analysis?.juiciestMoments?.[0];
  const [phase, setPhase] = useState<'idle' | 'typing' | 'processing' | 'embedded' | 'done'>('idle');
  const [charIndex, setCharIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const excerpt = moment?.excerpt?.substring(0, 220) || 'I\'ve been feeling really anxious lately and I haven\'t told anyone about it. I don\'t know who else to talk to.';

  const STEPS = [
    { label: 'TRANSMITTING', color: 'rgba(255,183,77,0.8)', duration: 600 },
    { label: 'RECEIVED — OPENAI SERVERS', color: 'rgba(255,183,77,0.8)', duration: 700 },
    { label: 'TOKENISED', color: 'rgba(78,205,196,0.8)', duration: 500 },
    { label: 'SELECTED FOR TRAINING', color: 'rgba(255,100,72,0.85)', duration: 800 },
    { label: 'GRADIENT COMPUTED — 1.8T PARAMETERS UPDATED', color: 'rgba(190,40,30,0.85)', duration: 900 },
    { label: 'EMBEDDED. NO RETURN FUNCTION.', color: 'rgba(190,40,30,0.9)', duration: 1000 },
  ];

  const startTransmission = useCallback(() => {
    setPhase('typing');
    setCharIndex(0);
    setStepIndex(0);
  }, []);

  // Typing effect
  useEffect(() => {
    if (phase !== 'typing') return;
    if (charIndex >= excerpt.length) {
      setTimeout(() => { setPhase('processing'); setStepIndex(0); }, 400);
      return;
    }
    const speed = charIndex < 20 ? 25 : charIndex < 80 ? 18 : 12;
    const t = setTimeout(() => setCharIndex(i => i + 1), speed);
    return () => clearTimeout(t);
  }, [phase, charIndex, excerpt]);

  // Processing steps
  useEffect(() => {
    if (phase !== 'processing') return;
    if (stepIndex >= STEPS.length) {
      setTimeout(() => setPhase('embedded'), 600);
      return;
    }
    const t = setTimeout(() => setStepIndex(i => i + 1), STEPS[stepIndex]?.duration || 700);
    return () => clearTimeout(t);
  }, [phase, stepIndex]);

  const textOpacity = phase === 'embedded' ? 0.15 : 1;

  if (!isInView && phase === 'idle') {
    return <div ref={ref} style={{ height: '4px' }} />;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        border: `1px solid ${PALETTE.border}`,
        background: PALETTE.bgPanel,
        padding: 'clamp(2rem, 4vw, 3.5rem)',
        marginTop: 'clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Terminal scan line */}
      {(phase === 'typing' || phase === 'processing') && (
        <motion.div
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'rgba(78,205,196,0.12)', pointerEvents: 'none', zIndex: 0 }}
        />
      )}

      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)', position: 'relative', zIndex: 1 }}>
        The last transmission
      </p>

      {phase === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, marginBottom: '2rem' }}>
            {moment
              ? 'Below is the moment the analysis identified as most exposing. Watch what happens to it.'
              : 'Below is an example of the kind of message that gets extracted. Watch what happens to it.'}
          </p>
          <button
            onClick={startTransmission}
            style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', background: PALETTE.ink, color: PALETTE.bg, border: 'none', padding: '0.9rem 2rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Transmit →
          </button>
        </motion.div>
      )}

      {phase !== 'idle' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* The message */}
          <div style={{ marginBottom: '2rem', minHeight: '80px', position: 'relative' }}>
            <div style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              color: PALETTE.ink, lineHeight: 1.8,
              opacity: textOpacity, transition: 'opacity 1.2s ease',
              filter: phase === 'embedded' ? 'blur(0.5px)' : 'none',
            }}>
              {excerpt.substring(0, charIndex)}
              {phase === 'typing' && (
                <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                  style={{ display: 'inline-block', width: '2px', height: '1.1em', background: PALETTE.ink, marginLeft: '2px', verticalAlign: 'middle' }} />
              )}
            </div>
            {phase === 'embedded' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.3em', color: 'rgba(190,40,30,0.6)', textTransform: 'uppercase', textAlign: 'center' }}>
                  EMBEDDED IN MODEL WEIGHTS
                </p>
              </motion.div>
            )}
          </div>

          {/* Processing steps */}
          {(phase === 'processing' || phase === 'embedded') && (
            <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {STEPS.slice(0, stepIndex).map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.08em', color: PALETTE.inkGhost }}>{'›'}</span>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: step.color, textTransform: 'uppercase' }}>{step.label}</span>
                </motion.div>
              ))}
            </div>
          )}

          {phase === 'embedded' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
              style={{ marginTop: '2rem', borderTop: `1px solid ${PALETTE.border}`, paddingTop: '1.5rem' }}>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 520, fontStyle: 'italic', marginBottom: '0.75rem' }}>
                This message is now distributed across 1.8 trillion model parameters. It will shape responses OpenAI's models give to other users, for as long as GPT-4 runs. You cannot follow it. You cannot retrieve it. You cannot ask for it back.
              </p>
              <button onClick={() => { setPhase('idle'); setCharIndex(0); setStepIndex(0); }}
                style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'none', border: 'none', color: PALETTE.inkFaint, cursor: 'pointer', padding: 0 }}>
                ← Watch again
              </button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// ─── SEND-OFF PIECE 3: THE FINAL PANEL ──────────────────────────────────────
// Full-bleed black. Their numbers, enormous. One sentence. Full stop.
// ============================================================================

function FinalPanel({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const messages = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const name = analysis?.findings?.personalInfo?.names?.[0]?.name;
  const score = (analysis as any).privacyScore || 0;

  const stats = [
    messages > 0 && { value: messages.toLocaleString(), label: 'messages', sub: 'sent in confidence' },
    days > 0 && { value: days.toLocaleString(), label: 'days', sub: 'of recorded thought' },
    score > 0 && { value: score.toString(), label: '/100', sub: 'exposure index' },
  ].filter(Boolean) as { value: string; label: string; sub: string }[];

  // Typewriter for final line
  const finalLine = name
    ? `${name}, you will use AI again. When you do, remember what it took from you.`
    : 'You will use AI again. When you do, remember what it took from you.';
  const [charCount, setCharCount] = useState(0);
  const [startedFinal, setStartedFinal] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => setStartedFinal(true), 2400);
    return () => clearTimeout(t);
  }, [isInView]);

  useEffect(() => {
    if (!startedFinal) return;
    if (charCount >= finalLine.length) return;
    const t = setTimeout(() => setCharCount(i => i + 1), 38);
    return () => clearTimeout(t);
  }, [startedFinal, charCount, finalLine.length]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.4 }}
      style={{
        position: 'relative', overflow: 'hidden',
        margin: '0 calc(-1 * clamp(2rem, 6vw, 5rem))',
        marginTop: 'clamp(3rem, 8vw, 6rem)',
      }}
    >
      <div style={{
        background: 'linear-gradient(180deg, #080807 0%, #0d0c0b 50%, #050504 100%)',
        borderTop: '1px solid rgba(240,237,232,0.04)',
        padding: 'clamp(5rem, 14vw, 10rem) clamp(2rem, 6vw, 5rem)',
        position: 'relative',
        minHeight: '80vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {/* Noise texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', opacity: 0.02, pointerEvents: 'none' }} />

        {/* Horizontal rule */}
        <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}} transition={{ duration: 2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ position: 'absolute', top: 'clamp(3.5rem, 8vw, 6rem)', left: 'clamp(2rem, 6vw, 5rem)', right: 'clamp(2rem, 6vw, 5rem)', height: '1px', background: 'linear-gradient(90deg, rgba(240,237,232,0.06), rgba(240,237,232,0.04) 40%, transparent)', transformOrigin: 'left' }} />

        {/* Section label */}
        <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5, duration: 1 }}
          style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: 'rgba(190,40,30,0.45)', textTransform: 'uppercase', marginBottom: 'clamp(3rem, 8vw, 6rem)', position: 'relative', zIndex: 1 }}>
          End of report
        </motion.p>

        {/* Stats — enormous numbers revealed one by one */}
        {stats.length > 0 && (
          <div style={{ display: 'flex', gap: 'clamp(3rem, 8vw, 7rem)', marginBottom: 'clamp(3rem, 8vw, 6rem)', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6 + i * 0.5, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 400, color: 'rgba(240,237,232,0.9)', letterSpacing: '-0.05em', lineHeight: 1 }}>{stat.value}</span>
                  <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', color: 'rgba(240,237,232,0.35)', letterSpacing: '-0.03em' }}>{stat.label}</span>
                </div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(240,237,232,0.2)', textTransform: 'uppercase', marginTop: '0.4rem' }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* EKG flatline → spike → flatline */}
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 1.8, duration: 1 }}
          style={{ marginBottom: 'clamp(2.5rem, 6vw, 4.5rem)', position: 'relative', zIndex: 1 }}>
          <svg width="340" height="44" viewBox="0 0 340 44" style={{ display: 'block', overflow: 'visible' }}>
            <line x1="0" y1="22" x2="340" y2="22" stroke="rgba(190,40,30,0.05)" strokeWidth="1" />
            <motion.polyline
              points="0,22 40,22 50,8 58,36 66,12 72,30 78,22 140,22 150,5 158,39 166,11 172,31 178,22 250,22 260,10 268,36 276,14 282,30 288,22 340,22"
              fill="none" stroke="rgba(190,40,30,0.35)" strokeWidth="1.4"
              strokeDasharray="800" initial={{ strokeDashoffset: 800 }}
              animate={isInView ? { strokeDashoffset: 0 } : {}}
              transition={{ delay: 2, duration: 2.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </svg>
        </motion.div>

        {/* Final typewriter line */}
        <div style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: 'rgba(240,237,232,0.88)', lineHeight: 1.65, fontWeight: 400, letterSpacing: '-0.02em', minHeight: '3em' }}>
            {finalLine.substring(0, charCount)}
            {startedFinal && charCount < finalLine.length && (
              <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                style={{ display: 'inline-block', width: '2px', height: '1.1em', background: 'rgba(190,40,30,0.6)', marginLeft: '2px', verticalAlign: 'middle' }} />
            )}
          </p>

          {/* Closing stamp — appears after final line */}
          {charCount >= finalLine.length && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1.5 }}
              style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(240,237,232,0.06)', textTransform: 'uppercase', marginTop: 'clamp(4rem, 10vw, 8rem)' }}>
              TRACE.AI / {new Date().getFullYear()} / REPORT COMPLETE
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// TIERS
// ============================================================================

function TierImmediate({ analysis }: { analysis: DeepAnalysis }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const totalCoverage = Math.round(SETTINGS_STEPS.filter(s => !s.isCompleted).reduce((acc, s) => acc + s.covers, 0) / SETTINGS_STEPS.filter(s => !s.isCompleted).length);

  return (
    <div ref={ref}>
      <SectionLabel index="01" label="Immediate actions" />
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 540, marginBottom: 'clamp(2rem, 4vw, 3rem)', fontStyle: 'italic' }}>
        Real settings. Real steps. With honest notes on what each one actually covers — and what it doesn't.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {SETTINGS_STEPS.map((step, i) => {
          const isOpen = expanded === step.id;
          return (
            <motion.div key={step.id} initial={{ opacity: 0, y: 8 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.07, duration: 0.5 }} style={{ borderTop: `1px solid ${PALETTE.border}` }}>
              <button onClick={() => setExpanded(isOpen ? null : step.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '1.4rem 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: '0.5rem', flexShrink: 0, background: step.isCompleted ? PALETTE.green : step.covers > 50 ? PALETTE.amber : PALETTE.red }} />
                  <div>
                    <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)', color: step.isCompleted ? PALETTE.inkMuted : PALETTE.ink, textDecoration: step.isCompleted ? 'line-through' : 'none', lineHeight: 1.3 }}>{step.label}</p>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, letterSpacing: '0.08em', marginTop: '0.2rem' }}>{step.path}</p>
                  </div>
                </div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.12em', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                    <div style={{ paddingBottom: '1.6rem', paddingLeft: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ background: PALETTE.bgPanel, padding: '1rem 1.2rem', borderLeft: `2px solid ${PALETTE.redMuted}` }}>
                        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>What this doesn't cover</p>
                        <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.inkMuted, lineHeight: 1.7 }}>{step.gap}</p>
                      </div>
                      {!step.isCompleted && <CoverageBar coverage={step.covers} label="Estimated protection coverage" />}
                      {!step.isCompleted && (
                        <a href={step.actionUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.ink, textTransform: 'uppercase', border: `1px solid ${PALETTE.border}`, padding: '0.6rem 1rem', textDecoration: 'none', alignSelf: 'flex-start', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = PALETTE.inkMuted} onMouseLeave={e => e.currentTarget.style.borderColor = PALETTE.border}>{step.actionLabel} →</a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '1.4rem' }}>
          <CoverageBar coverage={totalCoverage} label="Combined coverage across all steps" />
          <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.inkFaint, lineHeight: 1.7, marginTop: '1rem' }}>Even completing every step above, the data already embedded in trained model weights remains. These actions only limit future exposure.</p>
        </div>
      </div>
    </div>
  );
}

function TierLegal({ analysis }: { analysis: DeepAnalysis }) {
  const [sarVisible, setSarVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const sarText = generateSAR(analysis);

  const rights = [
    { article: 'Art. 15', title: 'Right of access', description: 'Request all personal data OpenAI holds about you, including inferred profiles.', honest: 'OpenAI will send a data export. It may not include inferred attributes or model training logs.', coverage: 58 },
    { article: 'Art. 17', title: 'Right to erasure', description: 'Request deletion of your personal data.', honest: 'Data embedded in model weights is not erased by deleting your account. OpenAI\'s position is that this data has been de-identified.', coverage: 21 },
    { article: 'Art. 22', title: 'Right against automated profiling', description: 'Object to decisions made solely by automated processing.', honest: 'OpenAI disputes that its processing constitutes automated decision-making under Art. 22.', coverage: 34 },
    { article: 'Art. 77', title: 'Right to lodge a complaint', description: 'Complain to your national data protection authority at any time.', honest: 'The most actionable right. The ICO, Irish DPC, and Italian Garante have all investigated OpenAI. Complaints take months to years.', coverage: 72 },
  ];

  return (
    <div ref={ref}>
      <SectionLabel index="02" label="Legal rights" />
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 540, marginBottom: 'clamp(2rem, 4vw, 3rem)', fontStyle: 'italic' }}>
        What the law says you can do — and what that actually means when you try.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1px', background: PALETTE.border, marginBottom: 'clamp(2rem, 4vw, 3.5rem)' }}>
        {rights.map((right, i) => (
          <motion.div key={right.article} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.1, duration: 0.6 }} style={{ background: PALETTE.bg, padding: '1.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', marginBottom: '0.6rem' }}>
              <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>{right.article}</span>
              <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)', color: PALETTE.ink }}>{right.title}</span>
            </div>
            <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, lineHeight: 1.65, marginBottom: '1rem' }}>{right.description}</p>
            <div style={{ background: PALETTE.bgPanel, padding: '0.8rem 1rem', borderLeft: `2px solid ${PALETTE.border}`, marginBottom: '1rem' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em', color: PALETTE.inkFaint, lineHeight: 1.6 }}>{right.honest}</p>
            </div>
            <CoverageBar coverage={right.coverage} label="Real-world enforceability" />
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, duration: 0.6 }} style={{ border: `1px solid ${PALETTE.border}`, background: PALETTE.bgPanel }}>
        <div style={{ padding: '1.6rem 1.8rem', borderBottom: sarVisible ? `1px solid ${PALETTE.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Subject Access Request</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.ink }}>A letter to OpenAI, drafted from your data.</p>
          </div>
          <button onClick={() => setSarVisible(!sarVisible)} style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.ink, textTransform: 'uppercase', background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.6rem 1rem', cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = PALETTE.inkMuted} onMouseLeave={e => e.currentTarget.style.borderColor = PALETTE.border}>{sarVisible ? 'Close' : 'Generate letter →'}</button>
        </div>
        <AnimatePresence>
          {sarVisible && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4 }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '1.8rem' }}>
                <pre style={{ fontFamily: TYPE.mono, fontSize: '12px', lineHeight: 1.8, color: PALETTE.ink, letterSpacing: '0.02em', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400, overflowY: 'auto', borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1.2rem' }}>{sarText}</pre>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.4rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { navigator.clipboard.writeText(sarText); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: copied ? PALETTE.green : PALETTE.ink, textTransform: 'uppercase', background: 'none', border: `1px solid ${copied ? PALETTE.green : PALETTE.border}`, padding: '0.6rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}>{copied ? 'Copied ✓' : 'Copy to clipboard →'}</button>
                </div>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkFaint, lineHeight: 1.7, marginTop: '1.2rem' }}>Fill in the bracketed fields. Send to privacy@openai.com — subject line: "Subject Access Request — Article 15 UK GDPR". They have 30 days to respond.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function TierStructural() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  return (
    <div ref={ref}>
      <SectionLabel index="03" label="Structural action" />
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 540, marginBottom: 'clamp(2rem, 4vw, 3rem)', fontStyle: 'italic' }}>
        The organisations and tools operating at the level where the problem actually lives.
      </p>
      <div style={{ borderLeft: `2px solid ${PALETTE.redMuted}`, paddingLeft: '1.4rem', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.7 }}>The data you have already given is in a trained model. No setting change, no letter, no opt-out reverses that. The EU AI Act, the ICO's ongoing investigation, and the Italian DPA's actions are the mechanisms operating at that level.</p>
      </div>
      <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.4rem' }}>Organisations you can support or contact</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {ORGS.map((org, i) => (
            <motion.div key={org.name} initial={{ opacity: 0, x: -8 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.08, duration: 0.5 }} style={{ borderTop: `1px solid ${PALETTE.border}`, padding: '1.3rem 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.ink }}>{org.name}</span>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em', color: org.tagColor, textTransform: 'uppercase', border: `1px solid ${org.tagColor}`, padding: '1px 5px' }}>{org.tag}</span>
                </div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.04em', color: PALETTE.inkFaint, lineHeight: 1.6 }}>{org.country} — {org.description}</p>
              </div>
              <a href={org.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', textDecoration: 'none', flexShrink: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = PALETTE.ink} onMouseLeave={e => e.currentTarget.style.color = PALETTE.inkFaint}>Visit →</a>
            </motion.div>
          ))}
          <div style={{ borderTop: `1px solid ${PALETTE.border}` }} />
        </div>
      </div>
      <div>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.4rem' }}>Alternatives that don't extract</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '1px', background: PALETTE.border }}>
          {ALTERNATIVES.map((alt, i) => (
            <motion.div key={alt.name} initial={{ opacity: 0, y: 6 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 + i * 0.07, duration: 0.5 }} style={{ background: PALETTE.bg, padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.ink }}>{alt.name}</span>
                {alt.privacy === 100 && <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.14em', color: PALETTE.green, textTransform: 'uppercase', border: `1px solid ${PALETTE.green}`, padding: '1px 5px' }}>Local</span>}
              </div>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, lineHeight: 1.7, marginBottom: '1rem' }}>{alt.description}</p>
              <CoverageBar coverage={alt.privacy} label="Data stays on device" />
              <a href={alt.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.8rem', fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textDecoration: 'none', textTransform: 'uppercase', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = PALETTE.ink} onMouseLeave={e => e.currentTarget.style.color = PALETTE.inkFaint}>Learn more →</a>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function ResistHeader({ analysis }: { analysis: DeepAnalysis }) {
  const days = analysis?.timespan?.days || 0;
  const messages = analysis?.totalUserMessages || 0;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || days === 0) return;
    const duration = 1800, steps = 60, increment = days / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= days) { setCount(days); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, days]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
      style={{ padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)', borderBottom: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(3rem, 6vw, 5rem)', position: 'relative', overflow: 'hidden' }}>
      <ActLabel roman="IV" title="After" pageLabel="08 / Resist" />
      <ThreadSentence>The extraction is complete. The argument is complete. This is what remains.</ThreadSentence>
      {days > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.4, duration: 0.8 }} style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2.5rem' }}>
          <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.8rem, 10vw, 7rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.04em', lineHeight: 1 }}>{count.toLocaleString()}</span>
          <div>
            <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block' }}>days of data</span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.red, textTransform: 'uppercase', display: 'block' }}>embedded permanently</span>
          </div>
        </motion.div>
      )}
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.6, duration: 0.9 }} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.25, maxWidth: 680, marginBottom: '1.5rem' }}>
        The record exists. The inference is complete. It cannot be reversed. What follows is not a solution — it is what remains possible.
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 1, duration: 0.8 }} style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: 580 }}>
        Three tiers of action — not because they undo anything, but because limiting what comes next is the only agency that remains.
      </motion.p>
      {messages > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 1.3, duration: 0.6 }} style={{ display: 'flex', gap: 'clamp(1.5rem, 4vw, 3rem)', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          {[{ label: 'Messages in corpus', value: messages.toLocaleString() }, { label: 'Days of history', value: days.toLocaleString() }, { label: 'Model training likely', value: 'Yes' }, { label: 'Deletion possible', value: 'No' }].map(stat => (
            <div key={stat.label}>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: stat.value === 'No' ? PALETTE.red : stat.value === 'Yes' ? PALETTE.amber : PALETTE.ink, letterSpacing: '-0.01em', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.3rem' }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4rem, 10vw, 8rem)', marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
        <TierImmediate analysis={analysis} />
        <TierLegal analysis={analysis} />
        <TierStructural />
      </div>

      <ExposureGrid />

      {/* THE SEND-OFF — three escalating pieces */}
      <div style={{ marginTop: 'clamp(4rem, 10vw, 8rem)' }}>
        <TheMirror analysis={analysis} />
        <div style={{ padding: `0 ${pad}` }}>
          <LastTransmission analysis={analysis} />
        </div>
      </div>

      <FinalPanel analysis={analysis} />
    </div>
  );
}
