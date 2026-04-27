'use client';

import { motion } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

// ============================================================================
// EMPTY STATES
// ============================================================================

export interface EmptyStateConfig {
  condition: boolean;
  key: string;
  label: string;
  message: string;
}

export function getActiveEmptyStates(analysis: DeepAnalysis): EmptyStateConfig[] {
  const states: EmptyStateConfig[] = [
    {
      condition: analysis.totalUserMessages < 50,
      key: 'low-volume',
      label: 'Limited data sample',
      message: `${analysis.totalUserMessages} messages is a small sample. The patterns identified here are preliminary - but they demonstrate what becomes possible at scale.`,
    },
    {
      condition: (analysis.findings.personalInfo.names?.length || 0) === 0,
      key: 'no-names',
      label: 'No names detected',
      message: 'No identifiable names were found in your messages. This does not mean you are anonymous - behavioural patterns, temporal signatures, and topic clusters are sufficient for identification without a name.',
    },
    {
      condition: (analysis.findings.personalInfo.locations?.length || 0) === 0,
      key: 'no-locations',
      label: 'No locations detected',
      message: 'No explicit locations were identified. Geographic inference remains possible through contextual signals - timezone patterns, local references, cultural markers.',
    },
    {
      condition: (analysis.findings.sensitiveTopics?.length || 0) === 0 && analysis.lifeEvents.length === 0,
      key: 'no-sensitive',
      label: 'No sensitive disclosures flagged',
      message: 'No high-sensitivity disclosures were detected by this analysis. This tool scans for a limited set of patterns - the absence of flags does not indicate the absence of exploitable data.',
    },
    {
      condition: !analysis.timespan || analysis.timespan.days < 7,
      key: 'short-timespan',
      label: 'Insufficient temporal data',
      message: 'Your export covers fewer than seven days. Behavioural patterns, dependency trajectories, and emotional timelines require a longer baseline to compute accurately.',
    },
  ];

  return states.filter(s => s.condition);
}

export function EmptyStateNotice({ state }: { state: EmptyStateConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        padding: '1.2rem 1.4rem',
        background: PALETTE.bgElevated,
        border: `1px solid ${PALETTE.border}`,
        borderLeft: `2px solid ${PALETTE.inkFaint}`,
        marginBottom: '1px',
      }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
        color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem',
      }}>
        {state.label}
      </p>
      <p style={{
        fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted,
        lineHeight: 1.7,
      }}>
        {state.message}
      </p>
    </motion.div>
  );
}

// ============================================================================
// CONFIDENCE & LIMITATIONS
// ============================================================================

export function ConfidenceLimitations() {
  const items = [
    {
      can: true,
      text: 'Identify behavioural patterns, emotional signals, and temporal habits from your message text and timestamps.',
    },
    {
      can: true,
      text: 'Detect names, locations, life events, and sensitive disclosures through lexical analysis of your written messages.',
    },
    {
      can: false,
      text: 'Access the responses you received. This analysis is based solely on what you wrote - not what was returned to you.',
    },
    {
      can: false,
      text: 'See images, files, voice messages, or any content you shared outside of text. Only written prompts are analysed.',
    },
    {
      can: false,
      text: 'Replicate the inference capabilities of a system with access to your full interaction history, metadata, IP address, device fingerprint, and cross-session behavioural data.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
        color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem',
      }}>
        Methodological note
      </p>
      <h3 style={{
        fontFamily: TYPE.serif, fontSize: '1.25rem', fontWeight: 400,
        color: PALETTE.ink, marginBottom: '1.4rem',
      }}>
        What this analysis can and cannot see
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.06 }}
            style={{
              display: 'grid', gridTemplateColumns: '16px 1fr',
              gap: '0.8rem', alignItems: 'flex-start',
            }}
          >
            <span style={{
              fontFamily: TYPE.mono, fontSize: '12px', marginTop: '3px',
              color: item.can ? PALETTE.green : PALETTE.inkFaint,
              fontWeight: 600,
            }}>
              {item.can ? 'CAN' : '-'}
            </span>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1rem',
              color: item.can ? PALETTE.inkMuted : PALETTE.inkFaint,
              lineHeight: 1.7,
            }}>
              {item.text}
            </p>
          </motion.div>
        ))}
      </div>

      <p style={{
        fontFamily: TYPE.serif, fontSize: '1.05rem', fontStyle: 'italic',
        color: PALETTE.inkMuted, lineHeight: 1.7, marginTop: '1.4rem',
        paddingTop: '1rem', borderTop: `1px solid ${PALETTE.border}`,
      }}>
        This tool demonstrates a fraction of what is inferrable from your data. 
        The entity that holds your complete interaction history can see considerably more.
      </p>
    </motion.div>
  );
}
