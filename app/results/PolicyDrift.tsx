'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// POLICY DRIFT - Three-column ToS comparison
// Shows what changed between OpenAI's 2023, 2025, and 2026 privacy policies.
// The argument: what you consented to in 2023 is not what you consented to now.
// ============================================================================

interface DriftClause {
  topic: string;
  description: string;
  v2023: string | null;
  v2025: string | null;
  v2026: string | null;
  change: 'expanded' | 'new' | 'restructured' | 'unchanged';
  severity: 'critical' | 'significant' | 'minor';
}

const DRIFT_CLAUSES: DriftClause[] = [
  {
    topic: 'Data collected from you',
    description: 'What categories of personal data OpenAI says it collects.',
    v2023: 'Account info, user content, payment info, communications.',
    v2025: 'Account info, user content (now explicitly includes files, images, audio), log data, usage data, device info, location info, cookies.',
    v2026: 'All of 2025, plus: Contact Data (your device address book), browser data if using Atlas browser, data from connected services, Sora character data.',
    change: 'expanded',
    severity: 'critical',
  },
  {
    topic: 'Data received from third parties',
    description: 'Information OpenAI receives about you from sources other than you.',
    v2023: null,
    v2025: null,
    v2026: 'Marketing vendors, advertisers, data partners. Includes purchase data, browsing signals, and publicly available internet data used for model training.',
    change: 'new',
    severity: 'critical',
  },
  {
    topic: 'Advertising',
    description: 'Whether and how your data is used for advertising.',
    v2023: null,
    v2025: null,
    v2026: 'Free and Go users: data used to personalise ads shown within the service and measure ad effectiveness. Advertisers may share data about you back to OpenAI.',
    change: 'new',
    severity: 'critical',
  },
  {
    topic: 'Third-party disclosure',
    description: 'Who OpenAI can share your personal data with.',
    v2023: 'Vendors and service providers, business transfers.',
    v2025: 'Vendors, affiliates, business account administrators, users you interact with.',
    v2026: 'All of 2025, plus: Government authorities, parent or guardian of a teen, explicitly named: advertisers and data partners.',
    change: 'expanded',
    severity: 'significant',
  },
  {
    topic: 'Business account access',
    description: 'Whether your employer or institution can access your conversations.',
    v2023: null,
    v2025: 'Administrators of Enterprise or business accounts may access and control your OpenAI account, including your Content.',
    v2026: 'Unchanged. Access includes conversation Content.',
    change: 'restructured',
    severity: 'significant',
  },
  {
    topic: 'Model training on your data',
    description: 'Whether your conversations are used to train AI models.',
    v2023: 'May use Content you provide to improve Services, for example to train the models that power ChatGPT.',
    v2025: 'Same phrasing. Opt-out available via Data Controls.',
    v2026: 'Same phrasing. De-identified data exempt from deletion requests once used for training. Publicly available internet data also used.',
    change: 'expanded',
    severity: 'critical',
  },
  {
    topic: 'Deletion rights',
    description: 'What happens when you delete your data or account.',
    v2023: 'Retained as long as needed for legitimate business purposes.',
    v2025: 'Temporary chats kept up to 30 days for safety. Some services allow deletion.',
    v2026: 'Deletion within 30 days unless needed longer - or already de-identified and used for model training, in which case deletion does not apply.',
    change: 'expanded',
    severity: 'critical',
  },
  {
    topic: 'Contact list upload',
    description: 'Whether OpenAI can access your phone or device contacts.',
    v2023: null,
    v2025: null,
    v2026: 'If you connect your device contacts, OpenAI uploads your address book and checks which contacts use the service.',
    change: 'new',
    severity: 'significant',
  },
  {
    topic: 'Policy scope',
    description: 'Who the policy covers and which jurisdictions it applies to.',
    v2023: 'Global policy.',
    v2025: 'Global policy. Separate EEA/UK addendum.',
    v2026: 'US-specific policy. Non-US users directed to separate regional policies. Scope has been regionalised and subdivided.',
    change: 'restructured',
    severity: 'minor',
  },
];

const CHANGE_LABELS: Record<DriftClause['change'], string> = {
  expanded: 'Expanded',
  new: 'New in 2026',
  restructured: 'Restructured',
  unchanged: 'Unchanged',
};

const CHANGE_COLORS: Record<DriftClause['change'], string> = {
  expanded: PALETTE.amber,
  new: PALETTE.red,
  restructured: PALETTE.inkMuted,
  unchanged: PALETTE.inkFaint,
};

const SEVERITY_COLORS: Record<DriftClause['severity'], string> = {
  critical: PALETTE.red,
  significant: PALETTE.amber,
  minor: PALETTE.inkFaint,
};

const YEARS = ['2023', '2025', '2026'] as const;

// ============================================================================
// COLUMN HEADER
// ============================================================================

function ColumnHeader({ year, clauseCount }: { year: string; clauseCount: number; [key: string]: any }) {
  const isLatest = year === '2026';
  return (
    <div style={{
      padding: '1.4rem 1.6rem',
      borderBottom: `1px solid ${PALETTE.border}`,
      background: isLatest ? PALETTE.bgElevated : PALETTE.bgPanel,
      position: 'sticky',
      top: 52,
      zIndex: 10,
      borderTop: isLatest ? `2px solid rgba(190,40,30,0.4)` : `2px solid transparent`,
      boxShadow: isLatest ? `0 -1px 0 rgba(190,40,30,0.15), inset 0 1px 0 rgba(190,40,30,0.05)` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
          color: isLatest ? PALETTE.ink : PALETTE.inkMuted,
          letterSpacing: '-0.02em',
          fontWeight: 400,
        }}>{year}</span>
        {isLatest && (
          <span style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.18em',
            color: PALETTE.red,
            textTransform: 'uppercase',
            border: `1px solid ${PALETTE.redMuted}`,
            padding: '2px 6px',
          }}>Current</span>
        )}
      </div>
      <p style={{
        fontFamily: TYPE.mono,
        fontSize: '11px',
        letterSpacing: '0.12em',
        color: PALETTE.inkFaint,
        textTransform: 'uppercase',
      }}>
        {year === '2023' ? 'June - Privacy Policy' : year === '2025' ? 'June - Privacy Policy' : 'April - US Privacy Policy'}
      </p>
    </div>
  );
}

// ============================================================================
// SINGLE CLAUSE ROW
// ============================================================================

function ClauseRow({ clause, index, isInView }: {
  clause: DriftClause;
  index: number;
  isInView: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const cells: (string | null)[] = [clause.v2023, clause.v2025, clause.v2026];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.5 }}
      style={{ borderBottom: `1px solid ${PALETTE.border}` }}
    >
      {/* Topic header row - full width */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '1.2rem 1.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          textAlign: 'left',
          borderBottom: `1px solid ${PALETTE.border}`,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = PALETTE.bgHover}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
          {/* Severity dot */}
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: SEVERITY_COLORS[clause.severity],
            boxShadow: clause.severity === 'critical' ? `0 0 6px ${PALETTE.red}` : 'none',
          }} />
          <div style={{ minWidth: 0 }}>
            <span style={{
              fontFamily: TYPE.serif,
              fontSize: '1rem',
              color: PALETTE.ink,
              display: 'block',
              lineHeight: 1.3,
            }}>{clause.topic}</span>
            <span style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: PALETTE.inkFaint,
              display: 'block',
              marginTop: '0.15rem',
            }}>{clause.description}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
          <span style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.16em',
            color: CHANGE_COLORS[clause.change],
            textTransform: 'uppercase',
            border: `1px solid ${CHANGE_COLORS[clause.change]}`,
            padding: '2px 6px',
            opacity: 0.85,
          }}>{CHANGE_LABELS[clause.change]}</span>
          <span style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            color: PALETTE.inkFaint,
            transform: expanded ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>+</span>
        </div>
      </button>

      {/* Expandable three-column cells */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              background: PALETTE.border,
            }}>
              {cells.map((cell, i) => {
                const year = YEARS[i];
                const isNew = clause.change === 'new' && i < 2 && cell === null;
                const isLatest = year === '2026';
                return (
                  <div
                    key={year}
                    style={{
                      padding: '1.4rem 1.6rem',
                      background: isLatest ? PALETTE.bgElevated : PALETTE.bgPanel,
                      position: 'relative',
                    }}
                  >
                    <p style={{
                      fontFamily: TYPE.mono,
                      fontSize: '11px',
                      letterSpacing: '0.16em',
                      color: isLatest ? PALETTE.redMuted : PALETTE.inkFaint,
                      textTransform: 'uppercase',
                      marginBottom: '0.8rem',
                    }}>{year}</p>

                    {cell === null ? (
                      <p style={{
                        fontFamily: TYPE.mono,
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        color: PALETTE.inkFaint,
                        lineHeight: 1.6,
                      }}>
                        {isNew ? 'Not present in this version.' : 'Not yet introduced.'}
                      </p>
                    ) : (
                      <p style={{
                        fontFamily: TYPE.serif,
                        fontSize: '0.95rem',
                        color: isLatest ? PALETTE.ink : PALETTE.inkMuted,
                        lineHeight: 1.7,
                      }}>
                        {cell}
                      </p>
                    )}

                    {/* Highlight new additions in 2026 */}
                    {isLatest && clause.change === 'new' && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 2,
                        height: '100%',
                        background: PALETTE.red,
                      }} />
                    )}
                    {isLatest && clause.change === 'expanded' && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 2,
                        height: '100%',
                        background: PALETTE.amber,
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

// ============================================================================
// SUMMARY STATS BAR
// ============================================================================

function DriftSummary({ isInView }: { isInView: boolean }) {
  const newClauses = DRIFT_CLAUSES.filter(c => c.change === 'new').length;
  const expanded = DRIFT_CLAUSES.filter(c => c.change === 'expanded').length;
  const critical = DRIFT_CLAUSES.filter(c => c.severity === 'critical').length;

  const stats = [
    { value: newClauses.toString(), label: 'Clauses added since 2023', color: PALETTE.red },
    { value: expanded.toString(), label: 'Clauses significantly expanded', color: PALETTE.amber },
    { value: critical.toString(), label: 'Classified as critical changes', color: PALETTE.red },
    { value: '0', label: 'Clauses that reduced data collection', color: PALETTE.inkFaint },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '1px',
      background: PALETTE.border,
      marginBottom: 'clamp(2rem, 4vw, 3rem)',
    }}>
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: i * 0.1, duration: 0.6 }}
          style={{ background: PALETTE.bgPanel, padding: '1.6rem' }}
        >
          <p style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            color: stat.color,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: '0.5rem',
          }}>{stat.value}</p>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            lineHeight: 1.4,
          }}>{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PolicyDrift({ onAdvance }: { onAdvance?: () => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [activeFilter, setActiveFilter] = useState<DriftClause['change'] | 'all'>('all');

  const filtered = activeFilter === 'all'
    ? DRIFT_CLAUSES
    : DRIFT_CLAUSES.filter(c => c.change === activeFilter);

  const filters: { id: DriftClause['change'] | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All changes', count: DRIFT_CLAUSES.length },
    { id: 'new', label: 'New clauses', count: DRIFT_CLAUSES.filter(c => c.change === 'new').length },
    { id: 'expanded', label: 'Expanded', count: DRIFT_CLAUSES.filter(c => c.change === 'expanded').length },
    { id: 'restructured', label: 'Restructured', count: DRIFT_CLAUSES.filter(c => c.change === 'restructured').length },
  ];

  return (
    <div ref={ref} style={{ maxWidth: 1080, margin: '0 auto' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        style={{ marginBottom: 'clamp(2rem, 4vw, 3.5rem)', position: 'relative' }}
      >
        {/* Timeline marker - three points connected, growing rightward */}
        <svg style={{
          position: 'absolute', right: 0, top: '50%',
          transform: 'translateY(-50%)',
          width: '200px', height: '60px', pointerEvents: 'none', overflow: 'visible',
          opacity: 0.7,
        }}>
          {/* Connecting line */}
          <line x1={20} y1={30} x2={180} y2={30} stroke="rgba(26,24,20,0.08)" strokeWidth="1" />
          {/* 2023 - smallest dot */}
          <circle cx={20} cy={30} r={4} fill="none" stroke="rgba(26,24,20,0.2)" strokeWidth="1" />
          <text x={20} y={20} textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="8" fill="rgba(26,24,20,0.25)" letterSpacing="1">2023</text>
          {/* 2025 - medium */}
          <circle cx={100} cy={30} r={6} fill="none" stroke="rgba(160,100,0,0.25)" strokeWidth="1" />
          <text x={100} y={20} textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="8" fill="rgba(160,100,0,0.3)" letterSpacing="1">2025</text>
          {/* 2026 - largest, red */}
          <circle cx={180} cy={30} r={9} fill="rgba(190,40,30,0.06)" stroke="rgba(190,40,30,0.35)" strokeWidth="1" />
          <circle cx={180} cy={30} r={3} fill="rgba(190,40,30,0.4)" />
          <text x={180} y={20} textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="8" fill="rgba(190,40,30,0.5)" letterSpacing="1">2026</text>
        </svg>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.8rem' }}>
          <span style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.25em',
            color: PALETTE.redMuted,
            textTransform: 'uppercase',
          }}>Module 06</span>
          <span style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
          }}>Policy Drift</span>
        </div>
        <h2 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 400,
          color: PALETTE.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginBottom: '1rem',
        }}>
          What you consented to in 2023<br />
          is not what you consent to now.
        </h2>
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: '1.1rem',
          color: PALETTE.inkMuted,
          lineHeight: 1.7,
          maxWidth: 600,
        }}>
          OpenAI's privacy policy has been updated multiple times since ChatGPT launched. Each update expanded what they collect, who they share it with, and how they use it. You were not asked to re-consent. The terms changed around you.
        </p>
      </motion.div>

      {/* Stats */}
      <DriftSummary isInView={isInView} />

      {/* Column header labels - desktop only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="policy-drift-table"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(3, 1fr)',
          gap: '1px',
          background: PALETTE.border,
          marginBottom: '1px',
        }}
      >
        {/* Filter controls in the first column */}
        <div style={{
          background: PALETTE.bgPanel,
          padding: '1rem 1.6rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '0.4rem',
          }}>Filter</p>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.2rem 0',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{
                fontFamily: TYPE.mono,
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: activeFilter === f.id ? PALETTE.ink : PALETTE.inkFaint,
                textTransform: 'uppercase',
                transition: 'color 0.15s',
              }}>{f.label}</span>
              <span style={{
                fontFamily: TYPE.mono,
                fontSize: '12px',
                color: activeFilter === f.id ? PALETTE.ink : PALETTE.inkFaint,
              }}>({f.count})</span>
            </button>
          ))}
        </div>

        {/* Year column headers */}
        {YEARS.map(year => (
          <ColumnHeader key={year} year={year} clauseCount={DRIFT_CLAUSES.length} />
        ))}
      </motion.div>

      {/* Clause rows */}
      <div style={{ background: PALETTE.bg }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filtered.map((clause, i) => (
              <ClauseRow
                key={clause.topic}
                clause={clause}
                index={i}
                isInView={isInView}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Closing argument */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8, duration: 0.7 }}
        style={{
          borderTop: `1px solid ${PALETTE.border}`,
          padding: 'clamp(2rem, 4vw, 3rem) 0',
          marginTop: '0',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(1.5rem, 3vw, 2.5rem)',
        }}>
          <div>
            <p style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: PALETTE.redMuted,
              textTransform: 'uppercase',
              marginBottom: '0.8rem',
            }}>The consent problem</p>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: '1.1rem',
              color: PALETTE.inkMuted,
              lineHeight: 1.75,
            }}>
              In contract law, consent is specific. You agree to particular terms at a particular moment. When those terms change materially - as these have - consent to the original terms does not extend to the new ones. But that is precisely what continued use is treated as: ongoing consent to whatever the current policy says.
            </p>
          </div>
          <div>
            <p style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: PALETTE.redMuted,
              textTransform: 'uppercase',
              marginBottom: '0.8rem',
            }}>What changed most</p>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: '1.1rem',
              color: PALETTE.inkMuted,
              lineHeight: 1.75,
            }}>
              The 2026 policy introduces advertising - OpenAI now receives data about you from advertisers and uses your data to measure ad effectiveness. This category did not exist in 2023. Neither did contact list upload, browser data collection, or the carve-out that exempts de-identified training data from your deletion rights.
            </p>
          </div>
          <div>
            <p style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: PALETTE.redMuted,
              textTransform: 'uppercase',
              marginBottom: '0.8rem',
            }}>The deletion carve-out</p>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: '1.1rem',
              color: PALETTE.inkMuted,
              lineHeight: 1.75,
            }}>
              The 2026 policy explicitly states: data that has been de-identified and used for model training is exempt from deletion. You can delete your account. You cannot delete your cognitive pattern from a trained model. In 2023, this exception was not stated explicitly. Now it is.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Advance CTA */}
      {onAdvance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'center', paddingBottom: 'clamp(2rem, 5vw, 4rem)' }}
        >
          <button
            onClick={onAdvance}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              background: PALETTE.ink,
              color: PALETTE.bg,
              border: `1px solid ${PALETTE.ink}`,
              padding: '1rem 2.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = PALETTE.ink;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = PALETTE.ink;
              e.currentTarget.style.color = PALETTE.bg;
            }}
          >
            What you can do about it →
          </button>
        </motion.div>
      )}
    </div>
  );
}
