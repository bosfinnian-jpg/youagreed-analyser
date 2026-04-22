'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// COMING SOON SOURCES — what's planned but not yet implemented
// ============================================================================

const COMING_SOON = [
  {
    id: 'google',
    label: 'Google Takeout',
    company: 'Google',
    fileType: '.json / .zip',
    description: 'Search history, location timeline, YouTube watch history. Builds a behavioural map across years of activity.',
    reveals: ['Location history', 'Search patterns', 'Daily routines', 'Interest graph'],
    severity: 'high',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    company: 'Meta',
    fileType: '.json / .zip',
    description: 'Message content, post history, story interactions, account connections. Reveals your social graph and relationship patterns.',
    reveals: ['Social graph', 'Message patterns', 'Relationship history', 'Location tags'],
    severity: 'high',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    company: 'Spotify AB',
    fileType: '.json',
    description: 'Listening history and temporal patterns. Music correlates strongly with emotional state — mood cycles, sleep patterns, stress responses.',
    reveals: ['Emotional cycles', 'Sleep patterns', 'Stress indicators', 'Taste profile'],
    severity: 'medium',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    company: 'Microsoft',
    fileType: '.zip',
    description: 'Professional network, job search history, message content. Used directly by employment screening algorithms.',
    reveals: ['Professional network', 'Career anxiety', 'Salary signals', 'Skill gaps'],
    severity: 'medium',
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    company: 'X Corp',
    fileType: '.zip',
    description: 'Tweets, DMs, likes, search history. Political views and social behaviour are inferred and sold to data brokers.',
    reveals: ['Political signals', 'Opinion patterns', 'Social behaviour', 'Network map'],
    severity: 'medium',
  },
];

const SEV_COLOR: Record<string, string> = {
  critical: PALETTE.red,
  high: PALETTE.amber,
  medium: PALETTE.inkMuted,
};

// ============================================================================
// COMING SOON CARD
// ============================================================================

function ComingSoonCard({ source, index }: { source: typeof COMING_SOON[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const sc = SEV_COLOR[source.severity] || PALETTE.inkFaint;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.6 }}
      style={{
        borderBottom: `1px solid ${PALETTE.border}`,
        paddingTop: '1.8rem',
        paddingBottom: '1.8rem',
        opacity: 0.72,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          {/* Label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
              color: PALETTE.ink,
            }}>{source.label}</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
            }}>{source.company}</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em',
              color: sc, textTransform: 'uppercase',
              padding: '2px 6px', border: `1px solid ${sc}35`,
            }}>{source.severity}</span>
          </div>

          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
            color: PALETTE.inkMuted, lineHeight: 1.75,
            maxWidth: '52ch', marginBottom: '1rem',
          }}>
            {source.description}
          </p>

          {/* Reveals */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {source.reveals.map((r, i) => (
              <span key={i} style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: PALETTE.inkFaint,
                padding: '2px 7px', border: `1px solid ${PALETTE.border}`,
              }}>{r}</span>
            ))}
          </div>
        </div>

        {/* Coming soon badge */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
            display: 'block', whiteSpace: 'nowrap',
          }}>
            Coming soon
          </span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
            display: 'block', marginTop: '0.2rem',
          }}>
            {source.fileType}
          </span>
        </div>
      </div>
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
  const ref = useRef(null);
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div style={{
      maxWidth: 1000, margin: '0 auto',
      padding: `0 ${pad}`,
      paddingBottom: 'clamp(4rem, 10vw, 8rem)',
      position: 'relative',
    }}>

      {/* Background geometry — network nodes */}
      <svg style={{
        position: 'absolute', top: 0, right: 0,
        width: '260px', height: '260px',
        pointerEvents: 'none', overflow: 'visible',
      }}>
        <circle cx={200} cy={80} r={5} fill="none" stroke="rgba(26,24,20,0.12)" strokeWidth="1.5" />
        <circle cx={200} cy={80} r={18} fill="none" stroke="rgba(26,24,20,0.05)" strokeWidth="1" />
        {[
          { x: 155, y: 35 }, { x: 240, y: 30 }, { x: 248, y: 110 },
          { x: 215, y: 148 }, { x: 155, y: 130 },
        ].map((pt, i) => (
          <g key={i}>
            <line x1={200} y1={80} x2={pt.x} y2={pt.y}
              stroke="rgba(26,24,20,0.05)" strokeWidth="1"
              strokeDasharray={i % 2 === 0 ? 'none' : '3 5'} />
            <circle cx={pt.x} cy={pt.y} r={2.5}
              fill="none" stroke="rgba(26,24,20,0.08)" strokeWidth="1" />
          </g>
        ))}
      </svg>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
            color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
          }}
        >
          03 / Sources
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2.5rem' }}
        >
          <span style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            fontWeight: 400, color: PALETTE.red,
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>1</span>
          <div>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block',
            }}>source connected</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block', marginTop: '2px',
            }}>of 6 planned</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
            fontWeight: 400, color: PALETTE.ink,
            letterSpacing: '-0.02em', lineHeight: 1.25,
            maxWidth: 600, marginBottom: '1.5rem',
          }}
        >
          ChatGPT is already enough.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)',
            color: PALETTE.inkMuted, lineHeight: 1.8,
            fontStyle: 'italic', maxWidth: 560,
          }}
        >
          A single conversation export reveals more than most people expect. Additional sources compound the exposure — each one adds a new dimension to the profile that already exists about you. More sources are coming.
        </motion.p>
      </motion.div>

      {/* CHATGPT — the one live source */}
      <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
        }}>
          Active source
        </p>

        <div style={{
          borderLeft: `3px solid ${PALETTE.green}`,
          paddingLeft: 'clamp(2rem, 4vw, 3rem)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <span style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
              color: PALETTE.ink,
            }}>ChatGPT</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
            }}>OpenAI</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
              color: PALETTE.green, textTransform: 'uppercase',
              padding: '2px 7px', border: `1px solid ${PALETTE.green}35`,
            }}>Connected</span>
          </div>

          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
            color: PALETTE.inkMuted, lineHeight: 1.8,
            maxWidth: '55ch', marginBottom: '1.2rem',
          }}>
            Your full conversation history — the most revealing source. Contains your reasoning patterns, emotional disclosures, vulnerability windows, and the cognitive fingerprint that cannot be deleted from a trained model.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {['Cognitive profile', 'Emotional patterns', 'Vulnerability windows', 'Personal relationships', 'Sensitive disclosures'].map((r, i) => (
              <span key={i} style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: PALETTE.inkMuted,
                padding: '2px 7px', border: `1px solid ${PALETTE.border}`,
              }}>{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* COMING SOON */}
      <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          marginBottom: 'clamp(2rem, 4vw, 3rem)',
        }}>
          <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>In development</p>
        </div>

        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
          color: PALETTE.inkMuted, lineHeight: 1.8,
          fontStyle: 'italic', maxWidth: '55ch',
          marginBottom: 'clamp(2rem, 4vw, 3rem)',
        }}>
          Each of these sources adds a distinct layer to the profile. Together they make the argument undeniable — that modern surveillance is not a single database but an aggregate of dozens, each one legal, each one consented to in a terms of service nobody reads.
        </p>

        <div ref={ref}>
          {COMING_SOON.map((source, i) => (
            <ComingSoonCard key={source.id} source={source} index={i} />
          ))}
        </div>
      </div>

      {/* LOCAL PROCESSING NOTE */}
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
