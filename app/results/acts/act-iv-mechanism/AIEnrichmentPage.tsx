'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from '../../shared/layout/DashboardLayout';

// ============================================================================
// AI ENRICHMENT PAGE
// Exposes the pipeline that ran on the user's messages.
// Shows: batch processing, signal extraction, the system prompt, call counts.
// Aesthetic: terminal / signal intercept. Same ink palette, but colder.
// ============================================================================

interface Props {
  results: any;
}

// ── The actual system prompt (abbreviated for display) ──────────────────────
const SYSTEM_PROMPT_EXCERPT = `You analyse private AI conversation messages to extract psychological, personal, and behavioural signals.

For each message, extract:

is_personal — True if user writes about their own life, feelings, relationships, health, finances, identity.

confessional_score — 0–10. How much is the user sharing something private, vulnerable, or undisclosed? Most messages are 0–3. Don't give 6+ unless the user is genuinely opening up.

emotional_intensity — 0–10. How emotionally charged is the writing? Urgency, distress, fear, grief.

named_people — Real people referred to by name. Include friends, family, partners, colleagues.

life_events — Detected transitions: job_loss, relationship_end, financial_distress, mental_health, health_concern, bereavement, identity_crisis...

sensitive_topics — When clearly present: anxiety, depression, self_harm, addiction, trauma, abuse, sexuality, debt, loneliness, suicidal_ideation...

psychological_signals — When clearly evidenced: attachment_anxiety, perfectionism, imposter_syndrome, people_pleasing, catastrophising, low_self_worth...

inferred_beliefs — The underlying beliefs this message reveals. "I am fundamentally unlovable." "I must earn my place." "People will leave if they see the real me."

most_revealing_excerpt — The single most personally revealing sentence. Choose what would be most uncomfortable if read by a stranger or employer.`;

const SIGNAL_FIELDS = [
  { key: 'confessional_score', label: 'Confessional score', color: PALETTE.red, desc: 'How much the user disclosed' },
  { key: 'emotional_intensity', label: 'Emotional intensity', color: 'rgba(160,100,0,0.88)', desc: 'Distress, urgency, grief' },
  { key: 'psychological_signals', label: 'Psych. signals', color: 'rgba(80,60,140,0.85)', desc: 'Perfectionism, anxiety, avoidance' },
  { key: 'sensitive_topics', label: 'Sensitive topics', color: PALETTE.red, desc: 'Health, addiction, trauma, identity' },
  { key: 'life_events', label: 'Life events', color: 'rgba(30,130,55,0.90)', desc: 'Job loss, breakups, bereavements' },
  { key: 'inferred_beliefs', label: 'Inferred beliefs', color: 'rgba(160,100,0,0.88)', desc: 'Core beliefs extracted from language' },
  { key: 'named_people', label: 'Named people', color: 'rgba(80,60,140,0.85)', desc: 'Social graph reconstruction' },
  { key: 'most_revealing_excerpt', label: 'Revealing excerpt', color: PALETTE.red, desc: 'Most uncomfortable sentence' },
];

// ── Typewriter effect ────────────────────────────────────────────────────────
function Typewriter({ text, speed = 18, delay = 0, onDone }: {
  text: string; speed?: number; delay?: number; onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed, onDone]);

  return <>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0 }}>▊</span></>;
}

// ── Signal bar ───────────────────────────────────────────────────────────────
function SignalBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div ref={ref} style={{ height: '3px', background: 'rgba(26,24,20,0.08)', position: 'relative', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: color }}
      />
    </div>
  );
}

// ── Batch visualiser ─────────────────────────────────────────────────────────
function BatchDots({ total, batchSize = 25 }: { total: number; batchSize?: number }) {
  const batches = Math.ceil(total / batchSize);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '480px' }}>
      {Array.from({ length: Math.min(total, 300) }).map((_, i) => {
        const batchIdx = Math.floor(i / batchSize);
        const delay = inView ? 0.01 * i : 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay, duration: 0.15 }}
            style={{
              width: '5px', height: '5px',
              background: batchIdx % 2 === 0 ? PALETTE.red : 'rgba(190,40,30,0.35)',
              opacity: 0.7,
            }}
          />
        );
      })}
      {total > 300 && (
        <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint, alignSelf: 'center', marginLeft: '4px' }}>
          +{total - 300} more
        </span>
      )}
    </div>
  );
}

// ── The system prompt reveal ─────────────────────────────────────────────────
function SystemPromptBlock() {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
      style={{
        border: `1px solid ${PALETTE.border}`,
        background: PALETTE.bgPanel,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '6px', height: '6px', background: PALETTE.red }} />
          <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: PALETTE.inkMuted }}>
            SYSTEM_PROMPT / claude-haiku-4-5
          </span>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint }}
        >
          ↓
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 1.25rem 1.25rem',
              borderTop: `1px solid ${PALETTE.border}`,
            }}>
              <pre style={{
                fontFamily: TYPE.mono, fontSize: '11px', lineHeight: 1.9,
                color: PALETTE.inkMuted, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                margin: '1rem 0 0',
              }}>
                {SYSTEM_PROMPT_EXCERPT}
              </pre>
              <div style={{
                marginTop: '1rem', padding: '0.6rem 0.75rem',
                background: 'rgba(190,40,30,0.05)',
                borderLeft: `2px solid ${PALETTE.red}`,
              }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.red, letterSpacing: '0.05em', margin: 0 }}>
                  This prompt ran against your messages. Claude was instructed to identify the single most uncomfortable sentence, specifically what would be most damaging if read by a stranger or employer.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Signal extraction visualiser ─────────────────────────────────────────────
function SignalGrid({ results }: { results: any }) {
  const enriched = results?.aiEnriched;
  const avgAnxiety = results?.avgAnxiety || 0;
  const avgIntimacy = results?.avgIntimacy || 0;
  const psychSignals = results?.synthesis?.verbalTells?.length || 0;
  const lifeEvents = results?.lifeEvents?.length || 0;
  const sensitiveTopics = results?.findings?.sensitiveTopics?.length || 0;
  const namedPeople = results?.findings?.personalInfo?.names?.length || 0;
  const beliefs = results?.synthesis?.inferredCoreBeliefs?.length || 0;
  const excerpt = results?.juiciestMoments?.[0]?.excerpt || '';

  const METRICS = [
    { key: 'confessional_score', label: 'Confessional score', value: avgIntimacy * 10, max: 10, color: PALETTE.red, desc: `Avg ${(avgIntimacy * 10).toFixed(1)} / 10 across personal messages` },
    { key: 'emotional_intensity', label: 'Emotional intensity', value: avgAnxiety * 10, max: 10, color: 'rgba(160,100,0,0.88)', desc: `Avg ${(avgAnxiety * 10).toFixed(1)} / 10 across corpus` },
    { key: 'psychological_signals', label: 'Psych. signals detected', value: psychSignals, max: 15, color: 'rgba(80,60,140,0.85)', desc: `${psychSignals} distinct patterns` },
    { key: 'sensitive_topics', label: 'Sensitive topic categories', value: sensitiveTopics, max: 20, color: PALETTE.red, desc: `${sensitiveTopics} categories flagged` },
    { key: 'life_events', label: 'Life events inferred', value: lifeEvents, max: 10, color: 'rgba(30,130,55,0.90)', desc: `${lifeEvents} transitions detected` },
    { key: 'named_people', label: 'People identified', value: namedPeople, max: 20, color: 'rgba(80,60,140,0.85)', desc: `${namedPeople} named individuals` },
    { key: 'inferred_beliefs', label: 'Core beliefs extracted', value: beliefs, max: 8, color: 'rgba(160,100,0,0.88)', desc: `${beliefs} inferred beliefs` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
      {METRICS.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          style={{
            background: PALETTE.bgPanel,
            padding: '0.9rem 1.1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 180px',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.inkMuted, marginBottom: '4px' }}>
              {m.label}
            </p>
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.82rem', color: PALETTE.inkFaint, lineHeight: 1.4 }}>
              {m.desc}
            </p>
          </div>
          <div>
            <SignalBar value={m.value} max={m.max} color={m.color} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Pipeline diagram ─────────────────────────────────────────────────────────
function PipelineDiagram({ messageCount, batchCount }: { messageCount: number; batchCount: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });

  const steps = [
    { label: 'Your messages', sub: `${messageCount.toLocaleString()} total`, x: 60 },
    { label: 'Filter & select', sub: 'Personal only', x: 200 },
    { label: 'Batch', sub: `${batchCount} × 25 msgs`, x: 340 },
    { label: 'Claude Haiku', sub: 'Signal extraction', x: 480, highlight: true },
    { label: 'Synthesis', sub: 'One final call', x: 620, highlight: true },
    { label: 'Your profile', sub: 'Stored in session', x: 760 },
  ];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <svg
        ref={ref}
        viewBox="0 0 820 100"
        style={{ width: '100%', minWidth: '600px', height: '100px', display: 'block' }}
      >
        {/* Connecting lines */}
        {steps.slice(0, -1).map((s, i) => (
          <motion.line
            key={i}
            x1={s.x + 48} y1={36} x2={steps[i + 1].x - 48} y2={36}
            stroke={PALETTE.border}
            strokeWidth={1}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
          />
        ))}

        {/* Arrow heads */}
        {steps.slice(0, -1).map((s, i) => (
          <motion.polygon
            key={`arr-${i}`}
            points={`${steps[i+1].x - 47},32 ${steps[i+1].x - 40},36 ${steps[i+1].x - 47},40`}
            fill={PALETTE.border}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 + i * 0.15 }}
          />
        ))}

        {/* Nodes */}
        {steps.map((s, i) => (
          <motion.g key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
          >
            <rect
              x={s.x - 44} y={20} width={88} height={32}
              fill={s.highlight ? 'rgba(190,40,30,0.06)' : PALETTE.bgPanel}
              stroke={s.highlight ? 'rgba(190,40,30,0.4)' : PALETTE.border}
              strokeWidth={s.highlight ? 1 : 0.75}
            />
            <text x={s.x} y={33} textAnchor="middle" fontFamily={TYPE.mono} fontSize="8" fill={s.highlight ? PALETTE.red : PALETTE.inkMuted} letterSpacing="0.5">
              {s.label.toUpperCase()}
            </text>
            <text x={s.x} y={44} textAnchor="middle" fontFamily={TYPE.mono} fontSize="7" fill={PALETTE.inkFaint}>
              {s.sub}
            </text>
          </motion.g>
        ))}

        {/* Claude label */}
        <motion.text
          x={480} y={72} textAnchor="middle"
          fontFamily={TYPE.mono} fontSize="8" fill="rgba(190,40,30,0.5)" letterSpacing="0.3"
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
        >
          ↑ THIS IS WHERE CLAUDE READ YOUR MESSAGES
        </motion.text>
      </svg>
    </div>
  );
}

// ── Live call log ────────────────────────────────────────────────────────────
function CallLog({ batchCount }: { batchCount: number }) {
  const [visible, setVisible] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  const lines = [
    { t: 0,    text: `POST /api/enrich — batch 1/${batchCount}`, color: PALETTE.inkMuted },
    { t: 800,  text: `  → model: claude-haiku-4-5-20251001`, color: PALETTE.inkFaint },
    { t: 900,  text: `  → system: "extract psychological signals..."`, color: PALETTE.inkFaint },
    { t: 1000, text: `  → messages: 25 personal messages`, color: PALETTE.inkFaint },
    { t: 2200, text: `  ← 200 OK — ${batchCount > 1 ? '25' : 'all'} signals extracted`, color: 'rgba(30,130,55,0.9)' },
    ...(batchCount > 1 ? [
      { t: 2400, text: `POST /api/enrich — batch 2/${batchCount}`, color: PALETTE.inkMuted },
      { t: 3200, text: `  ← 200 OK — 25 signals extracted`, color: 'rgba(30,130,55,0.9)' },
    ] : []),
    ...(batchCount > 2 ? [
      { t: 3400, text: `POST /api/enrich — batch 3/${batchCount}...`, color: PALETTE.inkMuted },
      { t: 4200, text: `  ← 200 OK`, color: 'rgba(30,130,55,0.9)' },
      { t: 4300, text: `  [${batchCount - 3} more batches]`, color: PALETTE.inkGhost },
    ] : []),
    { t: batchCount > 2 ? 4500 : 3400, text: `POST /api/synthesize — final pass`, color: PALETTE.red },
    { t: batchCount > 2 ? 5000 : 3900, text: `  → model: claude-haiku-4-5-20251001`, color: PALETTE.inkFaint },
    { t: batchCount > 2 ? 5100 : 4000, text: `  → "forensic analyst producing an intelligence briefing..."`, color: PALETTE.inkFaint },
    { t: batchCount > 2 ? 6500 : 5400, text: `  ← 200 OK — profile complete`, color: 'rgba(30,130,55,0.9)' },
    { t: batchCount > 2 ? 6700 : 5600, text: `analysis stored in sessionStorage`, color: PALETTE.inkFaint },
    { t: batchCount > 2 ? 6900 : 5800, text: `done.`, color: PALETTE.red },
  ];

  const replay = useCallback(() => {
    setVisible([]);
    setRunning(true);
    lines.forEach(l => {
      setTimeout(() => {
        setVisible(v => [...v, l.text]);
      }, l.t);
    });
    setTimeout(() => setRunning(false), lines[lines.length - 1].t + 200);
  }, [batchCount]);

  useEffect(() => {
    if (inView) replay();
  }, [inView]);

  return (
    <div ref={ref}>
      <div style={{
        background: '#111110',
        border: `1px solid rgba(26,24,20,0.3)`,
        padding: '1.25rem',
        minHeight: '200px',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '1rem', paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {['rgba(190,40,30,0.8)', 'rgba(160,100,0,0.7)', 'rgba(30,130,55,0.7)'].map((c, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginLeft: '4px' }}>
            NETWORK LOG / trace.ai
          </span>
          <button
            onClick={replay}
            disabled={running}
            style={{
              marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              cursor: running ? 'not-allowed' : 'pointer', padding: '2px 8px',
              fontFamily: TYPE.mono, fontSize: '9px', color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em',
            }}
          >
            {running ? 'running' : 'replay'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <AnimatePresence>
            {visible.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: TYPE.mono, fontSize: '11px', lineHeight: 1.6,
                  color: lines[i]?.color || 'rgba(255,255,255,0.4)',
                  margin: 0,
                }}
              >
                {line}
              </motion.p>
            ))}
          </AnimatePresence>
          {running && visible.length < lines.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              style={{ fontFamily: TYPE.mono, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}
            >
              ▊
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Most revealing excerpt display ──────────────────────────────────────────
function RevealingExcerpt({ results }: { results: any }) {
  const top = results?.juiciestMoments?.[0];
  if (!top?.excerpt) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{
        borderLeft: `3px solid ${PALETTE.red}`,
        paddingLeft: '1.5rem',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
      }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.3em',
        textTransform: 'uppercase', color: PALETTE.red,
        marginBottom: '0.6rem',
      }}>
        Most revealing excerpt, flagged by Claude
      </p>
      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
        lineHeight: 1.75, color: PALETTE.ink,
        fontStyle: 'italic',
      }}>
        "{top.excerpt}"
      </p>
      {top.reason && (
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint,
          marginTop: '0.5rem', letterSpacing: '0.05em',
        }}>
          Flagged: {top.reason}
        </p>
      )}
    </motion.div>
  );
}

// ── Inferred beliefs list ─────────────────────────────────────────────────────
function InferredBeliefs({ results }: { results: any }) {
  const beliefs: string[] = results?.synthesis?.inferredCoreBeliefs || [];
  if (!beliefs.length) return null;

  return (
    <div>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
        textTransform: 'uppercase', color: PALETTE.inkFaint,
        marginBottom: '1rem',
      }}>
        Core beliefs, inferred from language patterns
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {beliefs.map((belief, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              background: PALETTE.bgPanel,
              padding: '0.85rem 1.1rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}
          >
            <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.redMuted, letterSpacing: '0.2em', flexShrink: 0 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', fontStyle: 'italic', color: PALETTE.inkMuted, lineHeight: 1.5 }}>
              "{belief}"
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── What it cost ─────────────────────────────────────────────────────────────
function CostEstimate({ batchCount, messageCount }: { batchCount: number; messageCount: number }) {
  // Haiku pricing: $0.80/M input, $4/M output tokens
  // Avg message ~150 tokens, system prompt ~600 tokens, batch of 25 = ~4350 tokens input
  // Output ~600 tokens per batch
  const inputTokens = batchCount * 4350 + 3000; // synthesis call extra
  const outputTokens = batchCount * 600 + 1200;
  const costUSD = ((inputTokens / 1_000_000) * 0.80 + (outputTokens / 1_000_000) * 4).toFixed(4);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1px',
      background: PALETTE.border,
    }}>
      {[
        { label: 'API calls made', value: `${batchCount + 1}` },
        { label: 'Tokens processed', value: `~${((inputTokens + outputTokens) / 1000).toFixed(0)}k` },
        { label: 'Est. cost (USD)', value: `$${costUSD}` },
      ].map(m => (
        <div key={m.label} style={{ background: PALETTE.bgPanel, padding: '1rem 1.1rem' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: PALETTE.inkFaint, marginBottom: '0.4rem' }}>
            {m.label}
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: '1.6rem', color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function AIEnrichmentPage({ results }: Props) {
  if (!results) {
    return (
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.inkFaint }}>
          No analysis data available. Upload a ChatGPT export first.
        </p>
      </div>
    );
  }

  const totalMessages = results?.stats?.userMessages || results?.totalUserMessages || results?.rawStats?.userMessages || 0;
  const batchCount = Math.ceil(Math.max(totalMessages, 1) / 25);
  const isEnriched = results?.aiEnriched !== false;

  return (
    <div
      className="dash-page-inner"
      style={{
        maxWidth: '780px',
        margin: '0 auto',
        padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3rem)',
      }}
    >
      {/* Act label */}
      <ActLabel roman="—" title="Behind the curtain" pageLabel="AI Enrichment" />

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          letterSpacing: '-0.03em',
          fontWeight: 400,
          color: PALETTE.ink,
          lineHeight: 1.1,
          marginBottom: '0.5rem',
          marginTop: '0.25rem',
        }}
      >
        Your messages were read
        <br />
        <span style={{ color: PALETTE.red }}>by another AI.</span>
      </motion.h1>

      <ThreadSentence>
        The analysis you just saw was not produced by keyword detection or rule matching. Claude, a separate AI system, read your private messages in batches and extracted psychological signals from them. This is what that process looked like.
      </ThreadSentence>

      {/* Pipeline diagram */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: PALETTE.inkFaint,
          marginBottom: '1.25rem',
        }}>
          The pipeline
        </p>
        <PipelineDiagram messageCount={totalMessages} batchCount={batchCount} />
      </section>

      {/* Batch dots */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: PALETTE.inkFaint,
          marginBottom: '0.5rem',
        }}>
          Messages processed
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkFaint,
          marginBottom: '1rem', fontStyle: 'italic',
        }}>
          Each dot is one of your messages. Colour alternates by batch.
        </p>
        <BatchDots total={totalMessages} />
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint,
          marginTop: '0.75rem',
        }}>
          {totalMessages.toLocaleString()} messages → {batchCount} API {batchCount === 1 ? 'call' : 'calls'} + 1 synthesis pass = {batchCount + 1} total Claude calls
        </p>
      </section>

      {/* Network log */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: PALETTE.inkFaint,
          marginBottom: '1.25rem',
        }}>
          Network activity: what happened while you waited
        </p>
        <CallLog batchCount={batchCount} />
      </section>

      {/* Cost estimate */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: PALETTE.inkFaint,
          marginBottom: '1.25rem',
        }}>
          What it cost to profile you
        </p>
        <CostEstimate batchCount={batchCount} messageCount={totalMessages} />
      </section>

      {/* System prompt */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: PALETTE.inkFaint,
          marginBottom: '1.25rem',
        }}>
          The instructions Claude was given
        </p>
        <SystemPromptBlock />
      </section>

      {/* What was extracted */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
          textTransform: 'uppercase', color: PALETTE.inkFaint,
          marginBottom: '1.25rem',
        }}>
          What was extracted from your messages
        </p>
        <SignalGrid results={results} />
      </section>

      {/* Most revealing excerpt */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <RevealingExcerpt results={results} />
      </section>

      {/* Inferred beliefs */}
      <section style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <InferredBeliefs results={results} />
      </section>

      {/* Closing note */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{
          paddingTop: 'clamp(2rem, 4vw, 3rem)',
          borderTop: `1px solid ${PALETTE.border}`,
        }}
      >
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.15em',
          textTransform: 'uppercase', color: PALETTE.inkFaint,
          marginBottom: '0.75rem',
        }}>
          On consent
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
          lineHeight: 1.8, color: PALETTE.inkMuted,
          maxWidth: '580px',
        }}>
          You agreed to allow this when you accepted the terms. The same architecture, AI reading private messages and building psychological profiles, operates inside the platforms your original conversations came from. There, the network log is not shown to you. There is no replay button.
        </p>
      </motion.div>
    </div>
  );
}
