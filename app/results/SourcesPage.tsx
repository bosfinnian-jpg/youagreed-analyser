'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// DATA
// ============================================================================

const ACTIVE_SOURCES = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    company: 'OpenAI Inc.',
    hq: 'San Francisco, CA',
    founded: '2015',
    fileType: '.json',
    severity: 'critical',
    reveals: ['Cognitive profile', 'Emotional patterns', 'Vulnerability windows', 'Personal relationships', 'Sensitive disclosures'],
    description: 'Full conversation history. The most revealing source — contains your reasoning patterns, emotional disclosures, and the cognitive fingerprint that cannot be deleted from a trained model.',
    exportPath: 'Settings → Data Controls → Export Data → conversations.json',
  },
  {
    id: 'claude',
    label: 'Claude',
    company: 'Anthropic PBC',
    hq: 'San Francisco, CA',
    founded: '2021',
    fileType: '.json',
    severity: 'critical',
    reveals: ['Reasoning patterns', 'Emotional disclosures', 'Cognitive fingerprint', 'Value system', 'Sensitive disclosures'],
    description: 'Full conversation history exported directly from claude.ai. Anthropic trains on conversations by default — the same extraction problem, different company.',
    exportPath: 'claude.ai → Settings → Export Data → conversations.json',
  },
];

const COMING_SOON = [
  {
    id: 'google',
    label: 'Google Takeout',
    company: 'Alphabet Inc.',
    hq: 'Mountain View, CA',
    founded: '1998',
    fileType: '.json / .zip',
    severity: 'high',
    reveals: ['Location history', 'Search patterns', 'Daily routines', 'Interest graph', 'Media consumption'],
    description: 'Search history, location timeline, YouTube watch history. Builds a behavioural map across years of activity across dozens of products.',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    company: 'Meta Platforms Inc.',
    hq: 'Menlo Park, CA',
    founded: '2010',
    fileType: '.json / .zip',
    severity: 'high',
    reveals: ['Social graph', 'Message patterns', 'Relationship history', 'Location tags', 'Emotional tone'],
    description: 'Message content, post history, story interactions. Reveals your social graph and emotional relationship patterns at scale.',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    company: 'Spotify AB',
    hq: 'Stockholm, Sweden',
    founded: '2006',
    fileType: '.json',
    severity: 'medium',
    reveals: ['Emotional cycles', 'Sleep patterns', 'Stress indicators', 'Taste profile', 'Listening windows'],
    description: 'Listening history and temporal patterns. Music correlates strongly with emotional state — mood cycles, stress responses, and sleep visible in the data.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    company: 'Microsoft Corp.',
    hq: 'Sunnyvale, CA',
    founded: '2002',
    fileType: '.zip',
    severity: 'medium',
    reveals: ['Professional network', 'Career anxiety', 'Salary signals', 'Skill gaps', 'Job search history'],
    description: 'Professional network, job search history, message content. Used directly by employment screening algorithms — the same data you gave to get hired.',
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    company: 'X Corp.',
    hq: 'San Francisco, CA',
    founded: '2006',
    fileType: '.zip',
    severity: 'medium',
    reveals: ['Political signals', 'Opinion patterns', 'Social behaviour', 'Network map', 'Interest graph'],
    description: 'Tweets, DMs, likes, search history. Political views and social behaviour inferred and made available to data brokers and advertisers.',
  },
];

const SEV_COLOR: Record<string, string> = {
  critical: PALETTE.red,
  high: PALETTE.amber,
  medium: PALETTE.inkMuted,
  low: PALETTE.inkFaint,
};

// ============================================================================
// ACTIVE SOURCE ROW — connected, live
// ============================================================================

function ActiveSourceRow({ source, index }: { source: typeof ACTIVE_SOURCES[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const sc = SEV_COLOR[source.severity];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ delay: index * 0.1, duration: 0.7 }}
      style={{ borderBottom: `1px solid ${PALETTE.border}` }}
    >
      {/* Main row */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          padding: '1.4rem 0',
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        {/* Company + name */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
            color: PALETTE.ink,
          }}>{source.label}</span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
          }}>{source.company}</span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
          }}>{source.hq}</span>
        </div>

        {/* Severity */}
        <span style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: sc, textTransform: 'uppercase',
          padding: '2px 6px', border: `1px solid ${sc}40`,
          whiteSpace: 'nowrap',
        }}>{source.severity}</span>

        {/* Status */}
        <span style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.green, textTransform: 'uppercase',
          padding: '2px 6px', border: `1px solid ${PALETTE.green}35`,
          whiteSpace: 'nowrap',
        }}>Live</span>

        {/* Toggle */}
        <span style={{
          fontFamily: TYPE.mono, fontSize: '1.1rem',
          color: PALETTE.inkFaint,
          transition: 'transform 0.2s',
          display: 'block',
          transform: open ? 'rotate(45deg)' : 'none',
        }}>+</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            overflow: 'hidden',
            paddingBottom: '2rem',
            paddingLeft: '0',
          }}
        >
          {/* Detail strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '1px', background: PALETTE.border,
            marginBottom: '1.5rem',
          }}>
            {[
              { l: 'Founded', v: source.founded },
              { l: 'Export format', v: source.fileType },
              { l: 'Data type', v: 'Conversation history' },
              { l: 'Retention', v: 'Permanent (model weights)' },
            ].map(item => (
              <div key={item.l} style={{ background: PALETTE.bgPanel, padding: '0.9rem 1.1rem' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{item.l}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '12px', color: PALETTE.ink }}>{item.v}</p>
              </div>
            ))}
          </div>

          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
            color: PALETTE.inkMuted, lineHeight: 1.8,
            maxWidth: '55ch', marginBottom: '1.2rem',
          }}>{source.description}</p>

          {/* Reveals */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
            {source.reveals.map((r, i) => (
              <span key={i} style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: PALETTE.inkMuted,
                padding: '2px 7px', border: `1px solid ${PALETTE.border}`,
              }}>{r}</span>
            ))}
          </div>

          {/* Export path */}
          <div style={{
            borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1.2rem',
          }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>How to export</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '12px', color: PALETTE.inkMuted, lineHeight: 1.7 }}>{source.exportPath}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// COMING SOON ROW — dimmed, no interaction
// ============================================================================

function ComingSoonRow({ source, index }: { source: typeof COMING_SOON[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const sc = SEV_COLOR[source.severity];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 0.55 } : { opacity: 0 }}
      transition={{ delay: index * 0.07, duration: 0.6 }}
      style={{
        borderBottom: `1px solid ${PALETTE.border}`,
        padding: '1.2rem 0',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)', color: PALETTE.ink }}>
          {source.label}
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          {source.company}
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          {source.hq}
        </span>
      </div>

      <span style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
        color: sc, textTransform: 'uppercase',
        padding: '2px 6px', border: `1px solid ${sc}35`,
        whiteSpace: 'nowrap',
      }}>{source.severity}</span>

      <span style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
        color: PALETTE.inkFaint, textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>Q3 2025</span>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function SourcesPage({ connectedSources }: {
  connectedSources: Record<string, boolean>;
  onUpload: (id: string, file: File) => void;
}) {
  const pad = 'clamp(2rem, 6vw, 5rem)';
  const totalPlanned = ACTIVE_SOURCES.length + COMING_SOON.length;

  return (
    <div style={{
      maxWidth: 1000, margin: '0 auto',
      padding: `0 ${pad}`,
      paddingBottom: 'clamp(4rem, 10vw, 8rem)',
    }}>

      {/* HEADER — deliberately different. No big serif number. Feels like an index. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          paddingTop: 'clamp(3rem, 8vw, 6rem)',
          paddingBottom: 'clamp(2rem, 5vw, 3.5rem)',
          marginBottom: 'clamp(2rem, 5vw, 3.5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
        }}
      >
        {/* Page label */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
            color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2.5rem',
          }}
        >
          03 / Sources
        </motion.p>

        {/* Compact header — different register to other pages */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'end',
          gap: '3rem',
          flexWrap: 'wrap',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            <h1 style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)',
              fontWeight: 400, color: PALETTE.ink,
              letterSpacing: '-0.025em', lineHeight: 1.15,
              marginBottom: '1rem', maxWidth: '22ch',
            }}>
              Every platform you use is building a file on you.
            </h1>
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
              color: PALETTE.inkMuted, lineHeight: 1.8,
              fontStyle: 'italic', maxWidth: '50ch',
            }}>
              The argument does not depend on any single company. It depends on all of them, simultaneously, and the fact that no one told you the files were being compiled.
            </p>
          </motion.div>

          {/* Compact stats block — top right, tabular */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              fontFamily: TYPE.mono,
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
              alignItems: 'flex-end',
              flexShrink: 0,
            }}
          >
            {[
              { l: 'Sources live', v: String(ACTIVE_SOURCES.length) },
              { l: 'In development', v: String(COMING_SOON.length) },
              { l: 'Total planned', v: String(totalPlanned) },
            ].map(item => (
              <div key={item.l} style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{item.l}</span>
                <span style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: PALETTE.ink, letterSpacing: '-0.02em', fontFamily: TYPE.serif, minWidth: '1.5rem', textAlign: 'right' }}>{item.v}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ACTIVE SOURCES — ledger style */}
      <div style={{ marginBottom: 'clamp(3rem, 8vw, 6rem)' }}>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: '2rem',
          paddingBottom: '0.8rem',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 0,
        }}>
          {['Platform / Company', 'Severity', 'Status', ''].map((h, i) => (
            <span key={i} style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
              textAlign: i > 0 ? 'right' : 'left',
            }}>{h}</span>
          ))}
        </div>

        {ACTIVE_SOURCES.map((source, i) => (
          <ActiveSourceRow key={source.id} source={source} index={i} />
        ))}
      </div>

      {/* IN DEVELOPMENT — same ledger, dimmed */}
      <div style={{ marginBottom: 'clamp(3rem, 8vw, 6rem)' }}>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          marginBottom: '1rem',
        }}>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>In development</p>
          <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
        </div>

        {/* Column headers — same grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '2rem',
          paddingBottom: '0.8rem',
          borderBottom: `1px solid ${PALETTE.border}`,
        }}>
          {['Platform / Company', 'Severity', 'Est.'].map((h, i) => (
            <span key={i} style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
              textAlign: i > 0 ? 'right' : 'left', opacity: 0.6,
            }}>{h}</span>
          ))}
        </div>

        {COMING_SOON.map((source, i) => (
          <ComingSoonRow key={source.id} source={source} index={i} />
        ))}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
            fontStyle: 'italic', color: PALETTE.inkFaint, lineHeight: 1.8,
            maxWidth: '52ch', marginTop: '1.5rem',
          }}
        >
          Each addition compounds the exposure. Together they make the argument undeniable — modern surveillance is not a single database but an aggregate, each source consented to in a terms of service nobody reads.
        </motion.p>
      </div>

      {/* FOOTER NOTE */}
      <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '2rem' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.8rem',
        }}>
          About your data
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
          color: PALETTE.inkFaint, lineHeight: 1.8, maxWidth: '52ch',
        }}>
          All analysis runs locally in your browser. Your exports are never transmitted to any server. This tool was built to show you what exists — not to collect it.
        </p>
      </div>

    </div>
  );
}
