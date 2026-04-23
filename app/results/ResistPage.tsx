'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

// ============================================================================
// TYPES
// ============================================================================

interface ResistPageProps {
  analysis: DeepAnalysis;
}

// ============================================================================
// DATA
// ============================================================================

const SETTINGS_STEPS = [
  {
    id: 'training',
    label: 'Disable training on your data',
    path: 'Settings → Data Controls → Improve the model for everyone',
    covers: 72,
    gap: 'Does not affect data already used in training. Only applies to future conversations.',
    actionUrl: 'https://chat.openai.com/',
    actionLabel: 'Open ChatGPT Settings',
  },
  {
    id: 'memory',
    label: 'Disable memory',
    path: 'Settings → Personalisation → Memory',
    covers: 18,
    gap: 'Prevents future memory storage only. Existing memories must be manually deleted.',
    actionUrl: 'https://chat.openai.com/',
    actionLabel: 'Open ChatGPT Settings',
  },
  {
    id: 'tempchat',
    label: 'Use temporary chats',
    path: 'New chat → Temporary chat (top of sidebar)',
    covers: 31,
    gap: 'Retained up to 30 days for safety review. Not end-to-end encrypted.',
    actionUrl: 'https://chat.openai.com/',
    actionLabel: 'Open ChatGPT',
  },
  {
    id: 'history',
    label: 'Delete your conversation history',
    path: 'Settings → Data Controls → Delete all chats',
    covers: 44,
    gap: 'Removes from your account. Does not remove from model weights if already trained.',
    actionUrl: 'https://chat.openai.com/',
    actionLabel: 'Open ChatGPT Settings',
  },
  {
    id: 'datarequest',
    label: 'Export your data first',
    path: 'Settings → Data Controls → Export data',
    covers: 0,
    gap: 'This is what you already did. It does not reduce exposure — it reveals it.',
    actionUrl: 'https://chat.openai.com/',
    actionLabel: 'Open ChatGPT Settings',
    isCompleted: true,
  },
];

const ORGS = [
  {
    name: 'noyb',
    full: 'None of Your Business',
    country: 'EU / Austria',
    description: 'Filed GDPR complaints against OpenAI in multiple EU states. Operates on behalf of individuals.',
    url: 'https://noyb.eu',
    tag: 'Active litigation',
    tagColor: PALETTE.red,
  },
  {
    name: 'ICO',
    full: 'Information Commissioner\'s Office',
    country: 'United Kingdom',
    description: 'UK data protection authority. You can file a complaint if OpenAI has not responded to a SAR within one month.',
    url: 'https://ico.org.uk/make-a-complaint/',
    tag: 'File a complaint',
    tagColor: PALETTE.amber,
  },
  {
    name: 'Privacy International',
    full: 'Privacy International',
    country: 'Global',
    description: 'Challenges surveillance and data exploitation through research, litigation, and policy advocacy.',
    url: 'https://privacyinternational.org',
    tag: 'Research & advocacy',
    tagColor: PALETTE.inkMuted,
  },
  {
    name: 'Big Brother Watch',
    full: 'Big Brother Watch',
    country: 'United Kingdom',
    description: 'UK civil liberties organisation focused on surveillance and privacy. Runs public campaigns and policy submissions.',
    url: 'https://bigbrotherwatch.org.uk',
    tag: 'UK campaigns',
    tagColor: PALETTE.inkMuted,
  },
  {
    name: 'EFF',
    full: 'Electronic Frontier Foundation',
    country: 'USA',
    description: 'Defends digital privacy and free expression through litigation, policy, and technology projects.',
    url: 'https://eff.org',
    tag: 'Legal defence',
    tagColor: PALETTE.amber,
  },
];

const ALTERNATIVES = [
  {
    name: 'Ollama',
    description: 'Run open-source models (Llama 3, Mistral, Gemma) locally. No data leaves your machine.',
    url: 'https://ollama.com',
    privacy: 100,
  },
  {
    name: 'LM Studio',
    description: 'Local model runner with a clean UI. Runs entirely on your hardware — zero telemetry.',
    url: 'https://lmstudio.ai',
    privacy: 100,
  },
  {
    name: 'Mistral Le Chat',
    description: 'EU-based AI with stronger GDPR commitments and explicit no-training opt-out for all users.',
    url: 'https://chat.mistral.ai',
    privacy: 61,
  },
  {
    name: 'Claude (Anthropic)',
    description: 'Does not train on free-tier conversations by default. Constitutional AI methodology.',
    url: 'https://claude.ai',
    privacy: 54,
  },
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

  return `${today}

Data Protection Officer
OpenAI, L.L.C.
3180 18th Street
San Francisco, CA 94110
United States

privacy@openai.com

Re: Subject Access Request under Article 15 UK GDPR / GDPR

Dear Data Protection Officer,

I am writing to exercise my right of access under Article 15 of the UK General Data Protection Regulation (UK GDPR) and, where applicable, the EU General Data Protection Regulation (GDPR).

My details are as follows:
Full name: ${name}
Account email: [YOUR OPENAI ACCOUNT EMAIL]
Date of birth: [YOUR DATE OF BIRTH]
Account created approximately: [APPROXIMATE DATE]

I request copies of all personal data you hold about me, including but not limited to:

1. All conversation data, prompts, and responses associated with my account (approximately ${messageCount.toLocaleString()} user messages between ${period}).

2. All inferred attributes, behavioural profiles, psychological classifications, or commercial segments derived from my conversation history.

3. All metadata associated with my use of the service, including timestamps, device identifiers, IP addresses, and usage patterns.

4. Details of all third parties with whom my personal data has been shared, including the legal basis for each disclosure.

5. The retention periods applied to each category of data, including any data that has been de-identified or incorporated into model training.

6. The specific logic and significance of any automated processing applied to my data, including any profiling under Article 22 GDPR.

I also request, under Article 17 UK GDPR, the erasure of all personal data you hold about me, to the extent that such erasure is technically feasible. I am aware that you may argue that data incorporated into model weights cannot be erased without retraining the model. I request that you confirm in writing whether any of my data has been used for model training, when, and what steps — if any — are taken to address my erasure rights in this context.

Please respond within one calendar month as required under Article 12(3) UK GDPR. If you are unable to comply with any aspect of this request, please explain the reasons in writing.

I reserve the right to escalate this matter to the Information Commissioner's Office (ICO) and relevant data protection authorities if I do not receive a satisfactory response within the statutory timeframe.

Yours faithfully,

${name}`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SectionHeader({ index, label, title, subtitle }: {
  index: string;
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)', position: 'relative' }}>
      {/* Ghost number — large, behind */}
      <span style={{
        position: 'absolute', top: '-1.5rem', left: '-0.5rem',
        fontFamily: TYPE.serif,
        fontSize: 'clamp(5rem, 12vw, 9rem)',
        fontWeight: 400,
        color: 'rgba(26,24,20,0.07)',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
      }}>{index.replace('0', '')}</span>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.8rem' }}>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em',
            color: PALETTE.redMuted, textTransform: 'uppercase',
          }}>{index}</span>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
          }}>{label}</span>
        </div>
        <h2 style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
          fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em',
          lineHeight: 1.2, marginBottom: '0.8rem',
        }}>{title}</h2>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)', color: PALETTE.inkMuted,
          lineHeight: 1.75, fontStyle: 'italic', maxWidth: 560,
        }}>{subtitle}</p>
      </div>
    </div>
  );
}

function CoverageBar({ coverage, label }: { coverage: number; label?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const gapColor = coverage === 0 ? PALETTE.red : coverage < 40 ? PALETTE.redMuted : coverage < 70 ? PALETTE.amber : PALETTE.green;

  return (
    <div ref={ref} style={{ marginTop: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          {label || 'Protection coverage'}
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em', color: gapColor }}>
          {coverage}%
        </span>
      </div>
      <div style={{ height: 2, background: PALETTE.border, position: 'relative', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${coverage}%` } : {}}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
          style={{ height: '100%', background: gapColor, position: 'absolute', left: 0, top: 0 }}
        />
        {/* Shimmer — sweeps once after fill */}
        <motion.div
          initial={{ left: '-20%', opacity: 0 }}
          animate={isInView ? { left: '110%', opacity: [0, 0.6, 0] } : {}}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 1.5 }}
          style={{
            position: 'absolute', top: 0, width: '20%', height: '100%',
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// TIER 1 — IMMEDIATE ACTIONS
// ============================================================================

function TierImmediate({ analysis }: { analysis: DeepAnalysis }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  const totalCoverage = Math.round(
    SETTINGS_STEPS.filter(s => !s.isCompleted).reduce((acc, s) => acc + s.covers, 0) /
    SETTINGS_STEPS.filter(s => !s.isCompleted).length
  );

  return (
    <div ref={ref}>
      <SectionHeader
        index="01"
        label="Immediate"
        title="What you can do today."
        subtitle="Real settings. Real steps. With honest notes on what they actually cover."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {SETTINGS_STEPS.map((step, i) => {
          const isOpen = expanded === step.id;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              style={{ borderTop: `1px solid ${PALETTE.border}` }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : step.id)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '1.4rem 0',
                  display: 'grid', gridTemplateColumns: '1fr auto',
                  gap: '2rem', alignItems: 'center', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', marginTop: '0.5rem', flexShrink: 0,
                    background: step.isCompleted ? PALETTE.green : step.covers > 50 ? PALETTE.amber : PALETTE.red,
                    boxShadow: 'none',
                  }} />
                  <div>
                    <p style={{
                      fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)', color: step.isCompleted ? PALETTE.inkMuted : PALETTE.ink,
                      textDecoration: step.isCompleted ? 'line-through' : 'none', lineHeight: 1.3,
                    }}>
                      {step.label}
                    </p>
                    <p style={{
                      fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint,
                      letterSpacing: '0.08em', marginTop: '0.2rem',
                    }}>
                      {step.path}
                    </p>
                  </div>
                </div>
                <span style={{
                  fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint,
                  letterSpacing: '0.12em', transition: 'transform 0.2s',
                  transform: isOpen ? 'rotate(45deg)' : 'none', display: 'inline-block',
                }}>+</span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      paddingBottom: '1.6rem', paddingLeft: '1.4rem',
                      display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                      <div style={{
                        background: PALETTE.bgPanel, padding: '1rem 1.2rem',
                        borderLeft: `2px solid ${PALETTE.redMuted}`,
                      }}>
                        <p style={{
                          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em',
                          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem',
                        }}>What this doesn't cover</p>
                        <p style={{
                          fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.inkMuted,
                          lineHeight: 1.7,
                        }}>{step.gap}</p>
                      </div>

                      {!step.isCompleted && (
                        <CoverageBar coverage={step.covers} label="Estimated protection coverage" />
                      )}

                      {!step.isCompleted && (
                        <a
                          href={step.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
                            color: PALETTE.ink, textTransform: 'uppercase',
                            border: `1px solid ${PALETTE.border}`,
                            padding: '0.6rem 1rem', textDecoration: 'none',
                            transition: 'border-color 0.2s, color 0.2s',
                            alignSelf: 'flex-start',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = PALETTE.inkMuted;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = PALETTE.border;
                          }}
                        >
                          {step.actionLabel} →
                        </a>
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
          <p style={{
            fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.inkFaint,
            lineHeight: 1.7, marginTop: '1rem',
          }}>
            Even completing every step above, the data already embedded in trained model weights remains. These actions only limit future exposure.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TIER 2 — LEGAL RIGHTS
// ============================================================================

function TierLegal({ analysis }: { analysis: DeepAnalysis }) {
  const [sarVisible, setSarVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const sarText = generateSAR(analysis);

  const rights = [
    {
      article: 'Art. 15',
      title: 'Right of access',
      description: 'You can request all personal data OpenAI holds about you, including inferred profiles.',
      honest: 'OpenAI will send a data export. It may not include inferred attributes or model training logs.',
      coverage: 58,
    },
    {
      article: 'Art. 17',
      title: 'Right to erasure',
      description: 'You can request deletion of your personal data.',
      honest: 'The hardest right to enforce against AI companies. Data embedded in model weights is not erased by deleting your account. OpenAI\'s position is that this data has been de-identified.',
      coverage: 21,
    },
    {
      article: 'Art. 22',
      title: 'Right against automated profiling',
      description: 'You can object to decisions made solely by automated processing.',
      honest: 'Applies most clearly to high-stakes decisions (credit, employment). OpenAI disputes that its processing constitutes automated decision-making under Art. 22.',
      coverage: 34,
    },
    {
      article: 'Art. 77',
      title: 'Right to lodge a complaint',
      description: 'You can complain to your national data protection authority at any time.',
      honest: 'The most actionable right. The ICO, Irish DPC, and Italian Garante have all investigated OpenAI. Complaints take months to years.',
      coverage: 72,
    },
  ];

  return (
    <div ref={ref}>
      <SectionHeader
        index="02"
        label="Legal"
        title="Your rights on paper."
        subtitle="What the law says you can do — and what that actually means when you try."
      />

      {/* Rights grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
        gap: '1px',
        background: PALETTE.border,
        marginBottom: 'clamp(2rem, 4vw, 3.5rem)',
      }}>
        {rights.map((right, i) => (
          <motion.div
            key={right.article}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            style={{ background: PALETTE.bg, padding: '1.6rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', marginBottom: '0.6rem' }}>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
                color: PALETTE.redMuted, textTransform: 'uppercase',
              }}>{right.article}</span>
              <span style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2vw, 1.4rem)', color: PALETTE.ink, fontWeight: 400,
              }}>{right.title}</span>
            </div>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.inkMuted,
              lineHeight: 1.65, marginBottom: '1rem',
            }}>{right.description}</p>
            <div style={{
              background: PALETTE.bgPanel, padding: '0.8rem 1rem',
              borderLeft: `2px solid ${PALETTE.border}`, marginBottom: '1rem',
            }}>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em',
                color: PALETTE.inkFaint, lineHeight: 1.6,
              }}>{right.honest}</p>
            </div>
            <CoverageBar coverage={right.coverage} label="Real-world enforceability" />
          </motion.div>
        ))}
      </div>

      {/* SAR Generator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          border: `1px solid ${PALETTE.border}`,
          background: PALETTE.bgPanel,
        }}
      >
        <div style={{
          padding: '1.6rem 1.8rem',
          borderBottom: sarVisible ? `1px solid ${PALETTE.border}` : 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem',
            }}>Subject Access Request</p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.ink,
            }}>A letter to OpenAI, drafted from your data.</p>
          </div>
          <button
            onClick={() => setSarVisible(!sarVisible)}
            style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
              color: PALETTE.ink, textTransform: 'uppercase',
              background: 'none', border: `1px solid ${PALETTE.border}`,
              padding: '0.6rem 1rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = PALETTE.inkMuted}
            onMouseLeave={e => e.currentTarget.style.borderColor = PALETTE.border}
          >
            {sarVisible ? 'Close' : 'Generate letter →'}
          </button>
        </div>

        <AnimatePresence>
          {sarVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '1.8rem' }}>
                <pre style={{
                  fontFamily: TYPE.mono, fontSize: '12px', lineHeight: 1.8,
                  color: PALETTE.ink, letterSpacing: '0.02em',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  maxHeight: 400, overflowY: 'auto',
                  borderLeft: `2px solid ${PALETTE.border}`,
                  paddingLeft: '1.2rem',
                }}>
                  {sarText}
                </pre>

                <div style={{
                  display: 'flex', gap: '1rem', marginTop: '1.4rem',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sarText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{
                      fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
                      color: copied ? PALETTE.green : PALETTE.ink,
                      textTransform: 'uppercase',
                      background: 'none', border: `1px solid ${copied ? PALETTE.green : PALETTE.border}`,
                      padding: '0.6rem 1rem', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? 'Copied ✓' : 'Copy to clipboard →'}
                  </button>
                  <a
                    href="https://privacy.openai.com/policies"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
                      color: PALETTE.inkFaint, textTransform: 'uppercase',
                      border: `1px solid ${PALETTE.border}`,
                      padding: '0.6rem 1rem', textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    OpenAI privacy portal →
                  </a>
                </div>

                <p style={{
                  fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.inkFaint,
                  lineHeight: 1.7, marginTop: '1.2rem',
                }}>
                  Fill in the bracketed fields before sending. Send to privacy@openai.com with the subject line: "Subject Access Request — Article 15 UK GDPR". They have 30 days to respond.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================================
// TIER 3 — STRUCTURAL / ALTERNATIVES
// ============================================================================

function TierStructural() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  return (
    <div ref={ref}>
      <SectionHeader
        index="03"
        label="Structural"
        title="What individual action cannot fix."
        subtitle="The organisations, tools, and political levers that operate at the level where the problem actually lives."
      />

      {/* Honest framing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        style={{
          borderLeft: `2px solid ${PALETTE.redMuted}`,
          paddingLeft: '1.4rem',
          marginBottom: 'clamp(2rem, 4vw, 3rem)',
        }}
      >
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
          color: PALETTE.inkMuted, lineHeight: 1.7,
        }}>
          The data you have already given is in a trained model. No setting change, no letter, no opt-out reverses that. The EU AI Act, the ICO's ongoing investigation, and the Italian DPA's actions are the mechanisms operating at that level — not your individual choices. What follows is where that work is happening.
        </p>
      </motion.div>

      {/* Organisations */}
      <div style={{ marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
          color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.4rem',
        }}>Organisations you can support or contact</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {ORGS.map((org, i) => (
            <motion.div
              key={org.name}
              initial={{ opacity: 0, x: -8 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{
                borderTop: `1px solid ${PALETTE.border}`,
                padding: '1.3rem 0',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '2rem',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                  <span style={{
                    fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.ink,
                  }}>{org.name}</span>
                  <span style={{
                    fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
                    color: org.tagColor, textTransform: 'uppercase',
                    border: `1px solid ${org.tagColor}`, padding: '1px 5px',
                  }}>{org.tag}</span>
                </div>
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.04em',
                  color: PALETTE.inkFaint, lineHeight: 1.6,
                }}>{org.country} — {org.description}</p>
              </div>
              <a
                href={org.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
                  color: PALETTE.inkFaint, textTransform: 'uppercase',
                  textDecoration: 'none', flexShrink: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = PALETTE.ink}
                onMouseLeave={e => e.currentTarget.style.color = PALETTE.inkFaint}
              >
                Visit →
              </a>
            </motion.div>
          ))}
          <div style={{ borderTop: `1px solid ${PALETTE.border}` }} />
        </div>
      </div>

      {/* Local alternatives */}
      <div>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
          color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.4rem',
        }}>Alternatives that don't extract</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))',
          gap: '1px',
          background: PALETTE.border,
        }}>
          {ALTERNATIVES.map((alt, i) => (
            <motion.div
              key={alt.name}
              initial={{ opacity: 0, y: 6 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.07, duration: 0.5 }}
              style={{ background: PALETTE.bg, padding: '1.4rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: TYPE.serif, fontSize: '1.2rem', color: PALETTE.ink }}>{alt.name}</span>
                {alt.privacy === 100 && (
                  <span style={{
                    fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.14em',
                    color: PALETTE.green, textTransform: 'uppercase',
                    border: `1px solid ${PALETTE.green}`, padding: '1px 5px',
                  }}>Local</span>
                )}
              </div>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted,
                lineHeight: 1.7, marginBottom: '1rem',
              }}>{alt.description}</p>
              <CoverageBar coverage={alt.privacy} label="Data stays on device" />
              <a
                href={alt.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', marginTop: '0.8rem',
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
                  color: PALETTE.inkFaint, textDecoration: 'none', textTransform: 'uppercase',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = PALETTE.ink}
                onMouseLeave={e => e.currentTarget.style.color = PALETTE.inkFaint}
              >
                Learn more →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OPENING HEADER
// ============================================================================

function ResistHeader({ analysis }: { analysis: DeepAnalysis }) {
  const days = analysis?.timespan?.days || 0;
  const messages = analysis?.totalUserMessages || 0;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Animated counter
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView || days === 0) return;
    const duration = 1800;
    const steps = 60;
    const increment = days / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= days) { setCount(days); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, days]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Fragmenting geometry — broken grid pieces, top right */}
      <svg style={{
        position: 'absolute', top: 0, right: 0,
        width: '260px', height: '260px', pointerEvents: 'none', overflow: 'visible',
      }}>
        {/* Intact square */}
        <rect x={160} y={20} width={60} height={60} fill="none" stroke="rgba(26,24,20,0.05)" strokeWidth="1" />
        {/* Fragmenting — partial lines breaking apart */}
        <line x1={160} y1={100} x2={200} y2={100} stroke="rgba(26,24,20,0.04)" strokeWidth="1" />
        <line x1={210} y1={95} x2={230} y2={95} stroke="rgba(26,24,20,0.03)" strokeWidth="1" />
        <line x1={160} y1={110} x2={185} y2={110} stroke="rgba(26,24,20,0.03)" strokeWidth="1" />
        {/* Small displaced squares */}
        <rect x={168} y={130} width={20} height={20} fill="none" stroke="rgba(190,40,30,0.08)" strokeWidth="1" />
        <rect x={198} y={122} width={14} height={14} fill="none" stroke="rgba(26,24,20,0.04)" strokeWidth="1" />
        <rect x={185} y={148} width={8} height={8} fill="none" stroke="rgba(26,24,20,0.03)" strokeWidth="1" />
        {/* Tiny floating dots */}
        <circle cx={220} cy={140} r={1.5} fill="rgba(190,40,30,0.2)" />
        <circle cx={235} cy={128} r={1} fill="rgba(26,24,20,0.1)" />
        <circle cx={175} cy={162} r={1} fill="rgba(26,24,20,0.08)" />
      </svg>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.7 }}
        style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
        }}
      >
        07 / Resist
      </motion.p>

      {/* Counter block */}
      {days > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            display: 'flex', alignItems: 'baseline', gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          <span style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(2.8rem, 10vw, 7rem)',
            fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.04em',
            lineHeight: 1,
          }}>
            {count.toLocaleString()}
          </span>
          <div>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block',
            }}>days of data</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
              color: PALETTE.red, textTransform: 'uppercase', display: 'block',
            }}>embedded permanently</span>
          </div>
        </motion.div>
      )}

      {/* Main statement */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.9 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
          fontWeight: 400, color: PALETTE.ink,
          letterSpacing: '-0.02em', lineHeight: 1.25,
          maxWidth: 680, marginBottom: '1.5rem',
        }}
      >
        You cannot undo what has already been extracted. But there is a structure to what you can still do.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1, duration: 0.8 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)',
          color: PALETTE.inkMuted, lineHeight: 1.8,
          maxWidth: 580,
        }}
      >
        Three tiers. Immediate actions that limit future exposure. Legal rights and how to exercise them. And the structural reality that no individual action can fix.
      </motion.p>

      {/* Stats strip */}
      {messages > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.3, duration: 0.6 }}
          style={{
            display: 'flex', gap: 'clamp(1.5rem, 4vw, 3rem)', marginTop: '2.5rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'Messages in corpus', value: messages.toLocaleString() },
            { label: 'Days of history', value: days.toLocaleString() },
            { label: 'Model training likely', value: 'Yes' },
            { label: 'Deletion possible', value: 'No' },
          ].map(stat => (
            <div key={stat.label}>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                color: stat.value === 'No' ? PALETTE.red : stat.value === 'Yes' ? PALETTE.amber : PALETTE.ink,
                letterSpacing: '-0.01em', lineHeight: 1,
              }}>{stat.value}</p>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
                color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.3rem',
              }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// CLOSING
// ============================================================================

function ResistClosing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2 }}
      style={{
        padding: 'clamp(3rem, 8vw, 5rem) 0',
        borderTop: `1px solid ${PALETTE.border}`,
        marginTop: 'clamp(3rem, 6vw, 5rem)',
        maxWidth: 620,
      }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
        style={{
          width: 32, height: 1, background: PALETTE.inkFaint,
          marginBottom: '2.5rem', transformOrigin: 'left',
        }}
      />
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.9 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
          color: PALETTE.ink, lineHeight: 1.75, marginBottom: '1.5rem',
        }}
      >
        The purpose of this page is not to suggest that the problem is solvable through individual action. It is not. The purpose is to be honest about what each action covers, so that when you take it, you understand exactly what you are and are not changing.
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.1, duration: 0.8 }}
        style={{
          fontFamily: TYPE.serif, fontSize: '1.1rem',
          color: PALETTE.inkMuted, lineHeight: 1.7,
        }}
      >
        The system was not designed to be reversible.
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ResistPage({ analysis }: ResistPageProps) {
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{
      maxWidth: 1000, margin: '0 auto',
      padding: `0 ${pad}`,
      paddingBottom: 'clamp(4rem, 10vw, 8rem)',
    }}>
      <ResistHeader analysis={analysis} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4rem, 10vw, 8rem)' }}>
        <TierImmediate analysis={analysis} />
        <TierLegal analysis={analysis} />
        <TierStructural />
      </div>

      <ResistClosing />
    </div>
  );
}
