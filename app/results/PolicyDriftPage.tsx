'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence, type DashPage } from './DashboardLayout';

// ============================================================================
// POLICY DRIFT PAGE — 06 / Terms
// The argument: what you consented to in 2023 is not what you consent to now.
// You were not asked again.
//
// Sources: OpenAI Privacy Policy June 2023, June 2025, April 2026 (US)
// Academic framing: Nissenbaum 2011, McDonald & Cranor 2008
// ============================================================================

// ── Real verbatim extracts from OpenAI's policies ───────────────────────────

const KEY_CLAUSES = [
  {
    id: 'training',
    topic: 'Model training on your data',
    severity: 'critical' as const,
    change: 'expanded' as const,
    versions: {
      v2023: {
        text: 'We may use Content you provide us to improve our Services, for example to train the models that power ChatGPT.',
        annotation: '27 words. No opt-out mentioned. No carve-out for deletion.',
      },
      v2025: {
        text: 'We may use Content you provide us to improve our Services, for example to train the models that power ChatGPT.',
        annotation: 'Identical language. Opt-out now available via Data Controls — but not stated here.',
      },
      v2026: {
        text: 'Some of our Services allow you to delete Personal Data stored in your account. Once you choose to delete Personal Data, we will remove it from our systems within 30 days unless we need to retain it for longer, or it has already been de-identified and disassociated from your account when you allow us to use your Content to improve our models.',
        annotation: 'The deletion carve-out. First time it appears explicitly. De-identified training data is now exempt from your right to deletion.',
        isHighlight: true,
      },
    },
  },
  {
    id: 'collection',
    topic: 'What data is collected from you',
    severity: 'critical' as const,
    change: 'expanded' as const,
    versions: {
      v2023: {
        text: 'Account Information: name, contact information, account credentials, payment card information, and transaction history. User Content: Personal Information included in the input, file uploads, or feedback you provide.',
        annotation: '2 categories. Account info and what you type.',
      },
      v2025: {
        text: 'Account Information, User Content (prompts, files, images, audio), Log Data, Usage Data, Device Information, Location Information, Cookies.',
        annotation: '7 categories. Now includes passive device tracking, your location, and how you interact with the interface.',
      },
      v2026: {
        text: 'Account Information, User Content (prompts, files, images, audio, video, Sora characters, data from connected services), Contact Data (if you connect device contacts, we upload your address book), Log Data, Usage Data, Device Information, Location Information, Atlas browser data.',
        annotation: '9+ categories. Your address book. Your browser. Data from other services you connect.',
        isHighlight: true,
      },
    },
  },
  {
    id: 'advertising',
    topic: 'Advertising',
    severity: 'critical' as const,
    change: 'new' as const,
    versions: {
      v2023: {
        text: null,
        annotation: 'This category did not exist.',
      },
      v2025: {
        text: null,
        annotation: 'This category did not exist.',
      },
      v2026: {
        text: 'For Free and Go users, to personalize the ads you see on our Services (subject to your settings), and to measure the effectiveness of ads shown on our Services... We may receive information from advertisers and other data partners, which we use for purposes including to help us measure and improve the effectiveness of ads shown to Free and Go users on our Services.',
        annotation: 'Entirely new in 2026. OpenAI now receives data about you from advertisers. Your data is used to personalise ads. Advertisers send OpenAI information about your purchase behaviour.',
        isHighlight: true,
      },
    },
  },
  {
    id: 'third-parties',
    topic: 'Who your data is shared with',
    severity: 'significant' as const,
    change: 'expanded' as const,
    versions: {
      v2023: {
        text: 'Vendors and Service Providers: hosting services, cloud services, email communication software, web analytics services. Business Transfers.',
        annotation: 'Infrastructure providers and potential acquirers. Standard boilerplate.',
      },
      v2025: {
        text: 'Vendors and Service Providers, Affiliates, Business Account Administrators (may access and control your account, including your Content), Other Users and Third Parties You Interact With.',
        annotation: 'Your employer can now read your conversations if you use a business account.',
      },
      v2026: {
        text: 'Vendors, Business Transfers, Government Authorities or Other Third Parties, Affiliates, Business Account Administrators, Parent or Guardian of a Teen, Other Users and Third Parties, advertisers and data partners.',
        annotation: 'Government authorities added. Advertisers named explicitly. Parent/guardian access added.',
        isHighlight: true,
      },
    },
  },
  {
    id: 'retention',
    topic: 'How long your data is kept',
    severity: 'critical' as const,
    change: 'expanded' as const,
    versions: {
      v2023: {
        text: "We'll retain your Personal Information for only as long as we need in order to provide our Service to you, or for other legitimate business purposes such as resolving disputes, safety and security reasons, or complying with our legal obligations.",
        annotation: 'No specific timeframes. "As long as we need" is undefined.',
      },
      v2025: {
        text: "We'll retain your Personal Data for only as long as we need in order to provide our Services to you, or for other legitimate business purposes. ChatGPT temporary chats will be kept up to 30 days for safety purposes.",
        annotation: '30 days for temporary chats. Still no timeframe for regular conversations.',
      },
      v2026: {
        text: "Once you choose to delete Personal Data, we will remove it from our systems within 30 days unless we need to retain it for longer, or it has already been de-identified and disassociated from your account when you allow us to use your Content to improve our models.",
        annotation: 'The carve-out is now explicit: if your data trained a model, the 30-day deletion promise does not apply.',
        isHighlight: true,
      },
    },
  },
];

const YEARS = ['2023', '2025', '2026'] as const;
const YEAR_LABELS: Record<string, string> = {
  '2023': 'June 2023',
  '2025': 'June 2025',
  '2026': 'April 2026 (US)',
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: PALETTE.red,
  significant: PALETTE.amber,
  minor: PALETTE.inkFaint,
};

const CHANGE_LABEL: Record<string, string> = {
  expanded: 'Expanded',
  new: 'New in 2026',
  restructured: 'Restructured',
  unchanged: 'Unchanged',
};

const CHANGE_COLOR: Record<string, string> = {
  expanded: PALETTE.amber,
  new: PALETTE.red,
  restructured: PALETTE.inkMuted,
  unchanged: PALETTE.inkFaint,
};

// ── Summary stats ─────────────────────────────────────────────────────────

const SUMMARY_STATS = [
  { value: '3', label: 'New clauses added since 2023', color: PALETTE.red },
  { value: '3', label: 'Clauses significantly expanded', color: PALETTE.amber },
  { value: '0', label: 'Clauses that reduced data collection', color: PALETTE.inkFaint },
  { value: '0', label: 'Times users were asked to re-consent', color: PALETTE.inkFaint },
];

// ── The consent click moment ───────────────────────────────────────────────

function ConsentMoment({ isInView }: { isInView: boolean }) {
  const [clicked, setClicked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.4, duration: 0.8 }}
      style={{
        background: PALETTE.bgPanel,
        border: `1px solid ${PALETTE.border}`,
        padding: 'clamp(2rem, 4vw, 3rem)',
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner stamp */}
      <div style={{
        position: 'absolute', top: '1.2rem', right: '1.4rem',
        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em',
        color: PALETTE.inkGhost, textTransform: 'uppercase',
      }}>
        RECONSTRUCTED FROM MEMORY
      </div>

      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em',
        color: PALETTE.redMuted, textTransform: 'uppercase',
        marginBottom: '1.5rem',
      }}>
        The moment of consent
      </p>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
        color: PALETTE.inkMuted, lineHeight: 1.75,
        maxWidth: 580, marginBottom: '2rem',
      }}>
        You signed up for ChatGPT. At some point — probably in 2022 or 2023 — you clicked something like this.
      </p>

      {/* Reconstructed consent UI */}
      <div style={{
        background: '#fff',
        border: `1px solid rgba(0,0,0,0.12)`,
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: 420,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        marginBottom: '1.5rem',
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#10a37f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#0d0d0d', marginBottom: '0.5rem' }}>
            Create your account
          </p>
          <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
            By clicking "Continue", you agree to our{' '}
            <span style={{ color: '#10a37f', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: '#10a37f', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
        <button
          onClick={() => setClicked(true)}
          style={{
            width: '100%',
            background: clicked ? '#0a8a6a' : '#10a37f',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {clicked ? 'You agreed.' : 'Continue'}
        </button>
      </div>

      <AnimatePresence>
        {clicked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1rem',
              color: PALETTE.inkMuted, lineHeight: 1.75,
              maxWidth: 540, fontStyle: 'italic',
              borderLeft: `2px solid ${PALETTE.redMuted}`,
              paddingLeft: '1rem',
            }}>
              That click, in 2023, was treated as consent to the 2023 policy. It has also been treated as consent to the 2025 policy, and the 2026 policy — both of which introduced categories of data collection that did not exist when you clicked. You were not asked again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────

function SummaryStats({ isInView }: { isInView: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1px',
      background: PALETTE.border,
      marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
    }}>
      {SUMMARY_STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.6 }}
          style={{ background: PALETTE.bgPanel, padding: '1.6rem' }}
        >
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
            color: stat.color, letterSpacing: '-0.04em', lineHeight: 1,
            marginBottom: '0.5rem',
          }}>{stat.value}</p>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 1.4,
          }}>{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Timeline diagram ──────────────────────────────────────────────────────

function PolicyTimeline({ isInView }: { isInView: boolean }) {
  const events = [
    { year: '2022', label: 'ChatGPT launches', sub: 'Original Terms of Service', x: 60, isUser: true },
    { year: 'Jun 2023', label: 'Privacy Policy v1', sub: '4 data categories', x: 220, isPolicy: true },
    { year: '2024', label: 'You used ChatGPT', sub: 'Conversations logged', x: 370, isUser: true },
    { year: 'Jun 2025', label: 'Privacy Policy v2', sub: '7 data categories', x: 510, isPolicy: true, isChange: true },
    { year: 'Apr 2026', label: 'Privacy Policy v3', sub: 'Advertising added. Deletion carve-out explicit.', x: 680, isPolicy: true, isChange: true, isCurrent: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ delay: 0.3, duration: 0.8 }}
      style={{
        marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
      }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em',
        color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>Policy timeline</p>

      <svg viewBox="0 0 780 120" style={{ width: '100%', minWidth: '600px', height: 'auto', overflow: 'visible' }}>
        {/* Baseline */}
        <line x1={40} y1={60} x2={740} y2={60} stroke={PALETTE.border} strokeWidth={1} />

        {events.map((ev, i) => (
          <g key={i}>
            {/* Vertical tick */}
            <motion.line
              x1={ev.x} y1={52} x2={ev.x} y2={68}
              stroke={ev.isCurrent ? PALETTE.red : ev.isPolicy ? PALETTE.amber : PALETTE.inkFaint}
              strokeWidth={ev.isCurrent ? 1.5 : 1}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.12 }}
            />

            {/* Dot */}
            <motion.circle
              cx={ev.x} cy={60} r={ev.isCurrent ? 6 : 4}
              fill={ev.isCurrent ? PALETTE.red : ev.isPolicy ? 'rgba(190,40,30,0.15)' : PALETTE.bgPanel}
              stroke={ev.isCurrent ? PALETTE.red : ev.isPolicy ? PALETTE.redMuted : PALETTE.border}
              strokeWidth={1}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.25 + i * 0.12, type: 'spring', stiffness: 300 }}
            />

            {/* Year label */}
            <motion.text
              x={ev.x} y={84}
              textAnchor="middle"
              fontFamily="'Courier Prime', monospace"
              fontSize={9}
              fill={ev.isCurrent ? PALETTE.red : 'rgba(26,24,20,0.35)'}
              letterSpacing={ev.isCurrent ? '0.5' : '0'}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.12 }}
            >
              {ev.year}
            </motion.text>

            {/* Label above */}
            <motion.text
              x={ev.x} y={42}
              textAnchor="middle"
              fontFamily="'Courier Prime', monospace"
              fontSize={9}
              fill={ev.isCurrent ? PALETTE.ink : ev.isPolicy ? 'rgba(26,24,20,0.55)' : 'rgba(26,24,20,0.35)'}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.35 + i * 0.12 }}
            >
              {ev.label}
            </motion.text>

            {/* Sub-label */}
            <motion.text
              x={ev.x} y={97}
              textAnchor="middle"
              fontFamily="'Courier Prime', monospace"
              fontSize={8}
              fill={'rgba(26,24,20,0.28)'}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 + i * 0.12 }}
            >
              {ev.sub}
            </motion.text>

            {/* Change marker */}
            {ev.isChange && (
              <motion.rect
                x={ev.x - 20} y={20} width={40} height={12}
                fill={ev.isCurrent ? 'rgba(190,40,30,0.08)' : 'rgba(160,100,0,0.07)'}
                stroke={ev.isCurrent ? PALETTE.redMuted : PALETTE.amber}
                strokeWidth={0.5}
                rx={2}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.12 }}
              />
            )}
            {ev.isChange && (
              <motion.text
                x={ev.x} y={29}
                textAnchor="middle"
                fontFamily="'Courier Prime', monospace"
                fontSize={7}
                fill={ev.isCurrent ? PALETTE.red : PALETTE.amber}
                letterSpacing="1"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.55 + i * 0.12 }}
              >
                {ev.isCurrent ? 'CURRENT' : 'CHANGED'}
              </motion.text>
            )}
          </g>
        ))}

        {/* Arrow at end */}
        <motion.path
          d="M 740 60 L 756 56 L 756 64 Z"
          fill={PALETTE.border}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        />
      </svg>
    </motion.div>
  );
}


// ── POLICY WORD COUNT BARS ──────────────────────────────────────────────────
// Pudding principle: use scale to make the abstract concrete.
// How long is the privacy policy? Show it as something you can feel.
// Average adult reads ~238 words/min.

function PolicyWordBars({ isInView }: { isInView: boolean }) {
  const READ_SPEED = 238; // words per minute
  const versions = [
    { year: '2023', words: 3417, color: 'rgba(107,203,119,0.75)', label: 'June 2023' },
    { year: '2025', words: 5892, color: 'rgba(255,183,77,0.75)',   label: 'June 2025' },
    { year: '2026', words: 9241, color: 'rgba(255,100,72,0.85)',   label: 'April 2026' },
  ];
  const maxWords = 9241;

  return (
    <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        How long did it get?
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkFaint, lineHeight: 1.6, maxWidth: 480, marginBottom: '2rem' }}>
        Word count of OpenAI's privacy policy across three versions.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
        {versions.map((v, i) => {
          const pct = (v.words / maxWords) * 100;
          const mins = Math.round(v.words / READ_SPEED);
          return (
            <div key={v.year}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{v.label}</span>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.ink, letterSpacing: '-0.01em' }}>{v.words.toLocaleString()} words</span>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint }}>~{mins} min read</span>
                </div>
              </div>
              <div style={{ height: '28px', background: PALETTE.bgElevated, border: `1px solid ${PALETTE.border}`, position: 'relative', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${pct}%` } : {}}
                  transition={{ delay: 0.2 + i * 0.18, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: v.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        borderTop: `1px solid ${PALETTE.border}`,
        paddingTop: '1.25rem',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 440, fontStyle: 'italic' }}>
          To read all three policies end-to-end: approximately 78 minutes.
          McDonald & Cranor (2008) found that reading every privacy policy 
          a typical internet user encounters would take 76 full work-days per year.
          Nobody reads them. The consent model depends on that.
        </p>
        <p style={{ fontFamily: TYPE.serif, fontSize: '2.2rem', color: PALETTE.red, letterSpacing: '-0.04em', lineHeight: 1, alignSelf: 'flex-end' }}>
          +170%<br />
          <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block', marginTop: '0.3rem' }}>
            growth since 2023
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Clause comparison table ───────────────────────────────────────────────

function ClauseRow({ clause, index, isInView }: {
  clause: typeof KEY_CLAUSES[number];
  index: number;
  isInView: boolean;
}) {
  const [open, setOpen] = useState(index === 0);

  const cells = [
    { year: '2023', data: clause.versions.v2023 },
    { year: '2025', data: clause.versions.v2025 },
    { year: '2026', data: clause.versions.v2026 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.05 + index * 0.07, duration: 0.5 }}
      style={{ borderBottom: `1px solid ${PALETTE.border}` }}
    >
      {/* Row header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '1.2rem 1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', textAlign: 'left',
          borderBottom: open ? `1px solid ${PALETTE.border}` : 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = PALETTE.bgHover}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: SEVERITY_COLOR[clause.severity],
            boxShadow: clause.severity === 'critical' ? `0 0 5px ${PALETTE.red}40` : 'none',
          }} />
          <span style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
            color: PALETTE.ink, lineHeight: 1.3,
          }}>{clause.topic}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.14em',
            color: CHANGE_COLOR[clause.change], textTransform: 'uppercase',
            border: `1px solid ${CHANGE_COLOR[clause.change]}50`,
            padding: '2px 6px',
          }}>{CHANGE_LABEL[clause.change]}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'inline-block',
              fontFamily: TYPE.mono, fontSize: '14px', color: PALETTE.inkFaint,
            }}
          >+</motion.span>
        </div>
      </button>

      {/* Expandable cells */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="policy-drift-3col" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px', background: PALETTE.border,
            }}>
              {cells.map(({ year, data }) => {
                const isCurrent = year === '2026';
                return (
                  <div
                    key={year}
                    style={{
                      padding: '1.4rem',
                      background: isCurrent ? PALETTE.bgElevated : PALETTE.bgPanel,
                      position: 'relative',
                    }}
                  >
                    {/* Year stamp */}
                    <p style={{
                      fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
                      color: isCurrent ? PALETTE.redMuted : PALETTE.inkFaint,
                      textTransform: 'uppercase', marginBottom: '0.85rem',
                    }}>{YEAR_LABELS[year]}</p>

                    {/* Content */}
                    {(data as any).text === null ? (
                      <p style={{
                        fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint,
                        lineHeight: 1.6, fontStyle: 'italic',
                      }}>
                        — not present in this version
                      </p>
                    ) : (
                      <blockquote style={{
                        fontFamily: TYPE.serif,
                        fontSize: 'clamp(0.85rem, 1.4vw, 0.95rem)',
                        color: isCurrent ? PALETTE.ink : PALETTE.inkMuted,
                        lineHeight: 1.75,
                        marginBottom: '0.85rem',
                        borderLeft: (data as any).isHighlight ? `2px solid ${PALETTE.red}` : 'none',
                        paddingLeft: (data as any).isHighlight ? '0.75rem' : '0',
                      }}>
                        "{data.text}"
                      </blockquote>
                    )}

                    {/* Annotation */}
                    <p style={{
                      fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.06em',
                      color: (data as any).isHighlight ? PALETTE.red : PALETTE.inkFaint,
                      lineHeight: 1.5,
                    }}>
                      ↳ {data.annotation}
                    </p>

                    {/* Left accent bar for highlight cells */}
                    {(data as any).isHighlight && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0,
                        width: 2, height: '100%', background: PALETTE.red,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── The deletion carve-out — featured section ─────────────────────────────

function DeletionCarveOut({ isInView }: { isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.3, duration: 0.8 }}
      style={{
        borderTop: `2px solid ${PALETTE.red}`,
        background: PALETTE.bgPanel,
        padding: 'clamp(2rem, 4vw, 3rem)',
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
        position: 'relative',
      }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase',
        marginBottom: '1.5rem',
      }}>
        The clause that matters most — OpenAI Privacy Policy, April 2026
      </p>

      <blockquote style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.15rem, 2.2vw, 1.45rem)',
        color: PALETTE.ink,
        lineHeight: 1.8,
        maxWidth: 720,
        marginBottom: '2rem',
        position: 'relative',
      }}>
        <span style={{ color: PALETTE.inkMuted }}>
          "Once you choose to delete Personal Data, we will remove it from our systems within 30 days{' '}
        </span>
        <span style={{
          color: PALETTE.ink,
          background: 'rgba(190,40,30,0.07)',
          padding: '0 3px',
        }}>
          unless we need to retain it for longer, or it has already been de-identified and disassociated from your account when you allow us to use your Content to improve our models.
        </span>
        <span style={{ color: PALETTE.inkMuted }}>"</span>
      </blockquote>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1px', background: PALETTE.border,
      }}>
        {[
          {
            label: 'What it appears to say',
            text: 'Your data will be deleted within 30 days.',
            color: PALETTE.inkMuted,
          },
          {
            label: 'What it actually says',
            text: 'Unless that data has already been used to train a model — in which case, the deletion right does not apply. The 30-day promise has an exception that swallows the rule.',
            color: PALETTE.ink,
            isHighlight: true,
          },
          {
            label: 'When this exception was added',
            text: 'April 2026. It was not in the 2023 policy. It was not in the 2025 policy. You were not asked to consent to it specifically.',
            color: PALETTE.red,
            isHighlight: true,
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: item.isHighlight ? PALETTE.bgElevated : PALETTE.bgPanel,
              padding: '1.4rem',
            }}
          >
            <p style={{
              fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}>{item.label}</p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1rem',
              color: item.color, lineHeight: 1.7,
            }}>{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Nissenbaum consent failure ────────────────────────────────────────────

function ConsentFailure({ isInView }: { isInView: boolean }) {
  const arguments_ = [
    {
      source: 'Nissenbaum, 2011',
      claim: 'Transparency paradox',
      text: 'The more complete the disclosure of data practices, the less comprehensible it becomes. A policy detailed enough to be accurate is too long to read. A policy short enough to read is too vague to inform. Both versions of transparency fail.',
    },
    {
      source: 'McDonald & Cranor, 2008',
      claim: '76 work-days',
      text: 'If US internet users attempted to read the privacy policies of every website they visited, it would take approximately 76 work-days per year. The consent model requires something no-one does, and treats not doing it as implied agreement.',
    },
    {
      source: 'OpenAI Terms of Service, 2023',
      claim: 'Continued use = re-consent',
      text: '"Your continued use of the Services following the posting of updated Terms constitutes your acceptance of such changes." The contract updates itself. You consent by continuing to exist within it.',
    },
    {
      source: 'Zuboff, 2022',
      claim: 'Behavioural modification',
      text: 'The opacity of data extraction is not incidental. Surveillance capitalism requires that the subject not fully understand what is happening. Transparency, if it occurred, would undermine the system it describes.',
    },
  ];

  return (
    <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase',
        marginBottom: '2rem',
      }}>The consent failure — four arguments</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {arguments_.map((arg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
            style={{
              background: PALETTE.bgPanel,
              padding: 'clamp(1.25rem, 2.5vw, 1.75rem) clamp(1.4rem, 3vw, 2rem)',
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              gap: '2rem',
              alignItems: 'start',
            }}
            className="policy-claim-row"
          >
            <div>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
                color: PALETTE.redMuted, textTransform: 'uppercase',
                marginBottom: '0.35rem', lineHeight: 1.4,
              }}>{arg.source}</p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1.1rem',
                color: PALETTE.ink, lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}>{arg.claim}</p>
            </div>
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)',
              color: PALETTE.inkMuted, lineHeight: 1.75,
            }}>{arg.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Closing argument three-panel ──────────────────────────────────────────

function ClosingArgument({ isInView, setPage }: { isInView: boolean; setPage: (p: DashPage) => void }) {
  const panels = [
    {
      label: 'The legal fiction',
      text: 'In contract law, consent is specific to the terms in force at the moment of agreement. When OpenAI changes its privacy policy, your continued use of the service is treated as fresh consent. But you were not shown the changes. You were not asked to accept them. You were simply opted in by inertia.',
    },
    {
      label: 'What changed most',
      text: 'Three categories of data collection were introduced between 2023 and 2026 that did not exist in the original policy: advertising data, contact list upload, and data received from third-party advertisers and data partners. These were not there when you started.',
    },
    {
      label: 'The carve-out and what follows',
      text: 'The 2026 deletion carve-out — data used in model training is exempt from the right to deletion — connects directly to the next argument. Because that data is not just stored. It was learned from. And what a model has learned, it cannot unlearn.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.4, duration: 0.7 }}
      style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)' }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'clamp(1.5rem, 3vw, 2.5rem)',
        marginBottom: 'clamp(2.5rem, 5vw, 3.5rem)',
      }}>
        {panels.map((panel, i) => (
          <div key={i}>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
              color: PALETTE.redMuted, textTransform: 'uppercase',
              marginBottom: '0.85rem',
            }}>{panel.label}</p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1.05rem',
              color: PALETTE.inkMuted, lineHeight: 1.8,
            }}>{panel.text}</p>
          </div>
        ))}
      </div>

      {/* Bridge to Permanent */}
      <div style={{
        borderTop: `1px solid ${PALETTE.border}`,
        paddingTop: 'clamp(2rem, 4vw, 3rem)',
      }}>
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
          color: PALETTE.inkMuted, lineHeight: 1.75,
          maxWidth: 560, marginBottom: '1.5rem',
          fontStyle: 'italic',
        }}>
          The terms describe what was taken. The next section explains how the system works — how
          inference operates, what it produces, and what it means that you cannot see it happening.
        </p>
        <button
          onClick={() => setPage('understand')}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 2vw, 1.1rem)',
            letterSpacing: '-0.01em', color: PALETTE.ink,
            background: 'none', border: `1px solid ${PALETTE.border}`,
            padding: 'clamp(0.85rem, 2vw, 1.25rem) clamp(1.25rem, 2.5vw, 2rem)',
            cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
            textAlign: 'left', lineHeight: 1.3,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = PALETTE.borderHover;
            e.currentTarget.style.background = PALETTE.bgPanel;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = PALETTE.border;
            e.currentTarget.style.background = 'none';
          }}
        >
          <span style={{
            display: 'block', fontFamily: TYPE.mono, fontSize: '9px',
            letterSpacing: '0.25em', color: PALETTE.redMuted,
            textTransform: 'uppercase', marginBottom: '0.35rem',
          }}>07 / Understand</span>
          How the system works →
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function PolicyDriftPage({ setPage }: { setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const tableRef = useRef(null);
  const tableInView = useInView(tableRef, { once: true, margin: '-5%' });
  const closingRef = useRef(null);
  const closingInView = useInView(closingRef, { once: true, margin: '-5%' });

  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div
      className="dash-page-inner"
      style={{
        maxWidth: 1000, margin: '0 auto',
        padding: `0 ${pad}`,
        paddingBottom: 'clamp(4rem, 10vw, 8rem)',
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .policy-drift-3col {
            grid-template-columns: 1fr !important;
          }
          .policy-claim-row {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
      {/* Hero */}
      <div ref={ref} style={{
        padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(2.5rem, 5vw, 4rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
        position: 'relative',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <ActLabel roman="III" title="The Permanence" pageLabel="06 / Terms" />
        </motion.div>

        <ThreadSentence>
          What you consented to in 2023 is not what you consent to now. The document changed around you. You were not asked again.
        </ThreadSentence>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem', marginBottom: '2rem' }}
        >
          <span style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(4rem, 12vw, 8rem)',
            fontWeight: 400, color: PALETTE.red,
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>3</span>
          <div>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block',
            }}>policy updates</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em',
              color: PALETTE.red, textTransform: 'uppercase', display: 'block', marginTop: '3px',
            }}>0 re-consent requests</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
            fontWeight: 400, color: PALETTE.ink,
            letterSpacing: '-0.025em', lineHeight: 1.15,
            maxWidth: 700, marginBottom: '1.25rem',
          }}
        >
          The document you didn't read.<br />
          The clauses that weren't there<br />
          when you started.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
            color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 580,
          }}
        >
          OpenAI's privacy policy has been updated three times since ChatGPT launched. Each update 
          expanded what is collected, who it is shared with, and what happens when you try to delete it. 
          You consented to the first version. You were opted into the rest.
        </motion.p>
      </div>

      {/* The consent moment */}
      <ConsentMoment isInView={isInView} />

      {/* Timeline */}
      <PolicyTimeline isInView={isInView} />

      {/* Summary stats */}
      <SummaryStats isInView={isInView} />

      {/* Policy word count bars */}
      <PolicyWordBars isInView={isInView} />

      {/* Deletion carve-out — featured */}
      <DeletionCarveOut isInView={isInView} />

      {/* Clause comparison table */}
      <div ref={tableRef}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.redMuted, textTransform: 'uppercase',
          marginBottom: '0.5rem',
        }}>
          Clause-by-clause comparison
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: '1rem',
          color: PALETTE.inkFaint, lineHeight: 1.6,
          marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
          maxWidth: 560,
        }}>
          Select any clause to compare the verbatim text across all three policy versions.
        </p>

        <div style={{ borderTop: `1px solid ${PALETTE.border}`, marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
          {KEY_CLAUSES.map((clause, i) => (
            <ClauseRow key={clause.id} clause={clause} index={i} isInView={tableInView} />
          ))}
        </div>
      </div>

      {/* Consent failure */}
      <div ref={closingRef}>
        <ConsentFailure isInView={closingInView} />
        <ClosingArgument isInView={closingInView} setPage={setPage} />
      </div>

      {/* Source attribution */}
      <div style={{
        borderTop: `1px solid ${PALETTE.border}`,
        paddingTop: 'clamp(2rem, 4vw, 3rem)',
        marginTop: 'clamp(2rem, 4vw, 3rem)',
      }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
          color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Primary sources
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'OpenAI Privacy Policy (June 2023)', note: 'openai.com/policies — archived version' },
            { label: 'OpenAI Privacy Policy (June 2025)', note: 'openai.com/policies — archived version' },
            { label: 'OpenAI Privacy Policy (April 2026, US)', note: 'openai.com/policies — current US version at time of publication' },
            { label: 'Nissenbaum, H. (2011)', note: '"A Contextual Approach to Privacy Online." Dædalus 140(4): 32–48.' },
            { label: 'McDonald, A.M. & Cranor, L.F. (2008)', note: '"The Cost of Reading Privacy Policies." ISJLP 4(3): 543–568.' },
            { label: 'Cooper, A.F. et al. (2024)', note: '"Machine Unlearning for Large Language Models." Preprint. See also: Cao & Yang (2015) "Towards Making Systems Forget."' },
            { label: 'Zuboff, S. (2019)', note: 'The Age of Surveillance Capitalism. PublicAffairs, New York.' },
          ].map((src, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 280px) 1fr', gap: '1rem', alignItems: 'baseline' }}>
              <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkMuted, letterSpacing: '0.04em' }}>
                {src.label}
              </span>
              <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, letterSpacing: '0.04em' }}>
                {src.note}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
