'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

// ============================================================================
// CANNOT BE DELETED - the central argument of the site
// The thesis: machine unlearning is unsolved. Deletion of your account is not
// deletion from the model. The GDPR right to erasure cannot be technically
// fulfilled. Your conversations are inside the weights now.
// ============================================================================

// ============================================================================
// RETAINED TAG - reusable stamp for extracted data items
// ============================================================================
export function RetainedTag({ variant = 'inline' }: { variant?: 'inline' | 'block' }) {
  if (variant === 'block') {
    return (
      <span style={{
        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em',
        color: PALETTE.redMuted, textTransform: 'uppercase',
        display: 'block', marginTop: '0.35rem',
      }}>
        ● Retained in model weights
      </span>
    );
  }
  return (
    <span style={{
      fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
      color: PALETTE.redMuted, textTransform: 'uppercase',
      marginLeft: '0.75rem', verticalAlign: 'middle', whiteSpace: 'nowrap',
    }}>
      ● Retained
    </span>
  );
}

// ============================================================================
// ONE-WAY FLOW DIAGRAM
// ============================================================================
function OneWayFlow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const steps = [
    { label: 'You typed', sub: 'A message in the interface' },
    { label: 'Transmitted', sub: 'Sent to OpenAI servers' },
    { label: 'Stored', sub: 'Retained for up to 30 days' },
    { label: 'Selected', sub: 'Included in training batch' },
    { label: 'Gradient computed', sub: 'Your text becomes mathematics' },
  ];

  return (
    <div ref={ref} style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)' }}>
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        The pipeline
      </p>
      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
        color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 540,
        marginBottom: 'clamp(2rem, 5vw, 3rem)',
      }}>
        Every conversation you had followed this sequence. It had no reverse function built into it.
      </p>

      {/* Flow - horizontal on desktop, vertical on mobile */}
      <style>{`
        @media (max-width: 640px) {
          .flow-row { flex-direction: column !important; }
          .flow-arrow { transform: rotate(90deg); }
          .flow-final-arrow { flex-direction: column !important; align-items: center !important; }
          .cbd-2col { grid-template-columns: 1fr !important; }
          .cbd-3col { grid-template-columns: 1fr !important; }
          .cbd-table-3col { grid-template-columns: 1fr !important; }
          .cbd-table-3col > div + div { border-top: 1px dashed ${PALETTE.border}; }
        }
      `}</style>

      <div className="flow-row" style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'nowrap', overflowX: 'auto' }}>
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <div style={{
              border: `1px solid ${PALETTE.border}`,
              padding: 'clamp(0.75rem, 2vw, 1.25rem)',
              minWidth: 'clamp(90px, 12vw, 130px)',
              background: PALETTE.bgPanel,
            }}>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                color: PALETTE.ink, letterSpacing: '-0.01em', marginBottom: '0.35rem',
                lineHeight: 1.2,
              }}>{step.label}</p>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em',
                color: PALETTE.inkFaint, lineHeight: 1.5,
              }}>{step.sub}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flow-arrow" style={{ padding: '0 clamp(0.3rem, 1vw, 0.6rem)', color: PALETTE.inkFaint, fontSize: '1.1rem', flexShrink: 0 }}>
                →
              </div>
            )}
          </motion.div>
        ))}

        {/* Final step - red, permanent */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: steps.length * 0.15, duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          <div className="flow-arrow" style={{ padding: '0 clamp(0.3rem, 1vw, 0.6rem)', color: PALETTE.red, fontSize: '1.1rem', flexShrink: 0 }}>→</div>
          <div style={{
            border: `1px solid ${PALETTE.red}`,
            padding: 'clamp(0.75rem, 2vw, 1.25rem)',
            minWidth: 'clamp(90px, 12vw, 130px)',
            background: PALETTE.redFaint,
          }}>
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              color: PALETTE.red, letterSpacing: '-0.01em', marginBottom: '0.35rem',
              lineHeight: 1.2,
            }}>Weights adjusted</p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em',
              color: PALETTE.redMuted, lineHeight: 1.5,
            }}>Billions of parameters shifted</p>
          </div>
        </motion.div>
      </div>

      {/* No return arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: (steps.length + 1) * 0.15 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          marginTop: '1.5rem', paddingLeft: '0.5rem',
        }}
      >
        <div style={{
          position: 'relative', width: 120, height: 2,
          background: PALETTE.border,
        }}>
          {/* Struck-through return arrow */}
          <div style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            fontFamily: TYPE.mono, fontSize: '0.9rem', color: PALETTE.inkFaint,
          }}>←</div>
          {/* Red strike */}
          <div style={{
            position: 'absolute', inset: '-4px 0',
            background: PALETTE.red,
            opacity: 0.6,
            height: '2px',
            top: '50%',
            transform: 'rotate(-4deg)',
          }} />
        </div>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em',
          color: PALETTE.red, textTransform: 'uppercase',
        }}>
          No return function
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================================
// SECTION - What weights actually are
// ============================================================================
function WhatWeightsAre() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', paddingBottom: 'clamp(3rem, 6vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        What "in the weights" means
      </p>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem',
      }}>
        A model weight is a number. GPT-4 has hundreds of billions of them. When your conversations were processed, those numbers shifted - fractionally, across all of them simultaneously. Your data did not go into a box labelled with your name.
      </p>
      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem',
      }}>
        It dissolved into the mathematics of the system.
      </p>
      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
        color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: 660,
      }}>
        There is no box to open. There is no row to delete. There is no "Finn-shaped" region of the model. Your influence is distributed across every parameter - everywhere and nowhere - and that distribution is mathematically indistinguishable from the influence of every other conversation the model processed.
      </p>
    </motion.div>
  );
}

// ============================================================================
// SECTION - Machine unlearning impossibility
// ============================================================================
function MachineUnlearning() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', paddingBottom: 'clamp(3rem, 6vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        Machine unlearning - the state of the science
      </p>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem',
      }}>
        Machine unlearning is the technical discipline of removing specific training examples from a trained model. It is formally defined as: given model M trained on dataset D, produce model M′ that behaves as if trained on D minus your specific data.
      </p>

      {/* Two approaches */}
      <div className="cbd-2col" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px',
        background: PALETTE.border, marginBottom: '2rem',
      }}>
        {[
          {
            label: 'Exact unlearning',
            body: 'Retrain the model from scratch without your data. Computationally prohibitive. Training GPT-4 cost an estimated $100 million and took months of compute time.',
            verdict: 'Not implemented',
            red: false,
          },
          {
            label: 'Approximate unlearning',
            body: 'Use algorithmic shortcuts to simulate the effect of retraining without actually retraining. Fast. Cheap. Available.',
            verdict: 'Provably incomplete',
            red: true,
          },
        ].map((approach, i) => (
          <div key={i} style={{ background: PALETTE.bgPanel, padding: 'clamp(1rem, 3vw, 1.75rem)' }}>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
              color: approach.red ? PALETTE.red : PALETTE.inkFaint,
              textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>{approach.label}</p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
              color: PALETTE.inkMuted, lineHeight: 1.7, marginBottom: '1rem',
            }}>{approach.body}</p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
              color: approach.red ? PALETTE.red : PALETTE.inkMuted,
              textTransform: 'uppercase',
            }}>■ {approach.verdict}</p>
          </div>
        ))}
      </div>

      {/* Cooper et al. pullquote */}
      <div style={{
        borderLeft: `3px solid ${PALETTE.red}`,
        paddingLeft: 'clamp(1.25rem, 3vw, 2rem)',
        marginBottom: '1.5rem',
      }}>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          color: PALETTE.ink, lineHeight: 1.75, marginBottom: '0.75rem',
        }}>
          "Removing information from a model's training data does not guarantee the model cannot reproduce or reflect that information. There is no production system, at this scale, that implements unlearning."
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          Cooper et al., 2024 - Machine Unlearning for Large Language Models
        </p>
      </div>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
        color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: 640,
      }}>
        The delete button on your ChatGPT account removes your conversations from your account view. This is a separate operation from unlearning. These are categorically different. One is a database query. The other is an unsolved problem in machine learning research.
      </p>
    </motion.div>
  );
}

// ============================================================================
// SECTION - The legal gap
// ============================================================================
function LegalGap() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const rows = [
    {
      right: 'Right to erasure (Article 17 UK GDPR)',
      openai: 'Delete your account and conversation history',
      gap: 'Account deletion does not alter model weights. Data retained 30 days post-deletion for abuse monitoring. Model unchanged.',
    },
    {
      right: 'Right to know your data is being processed (Article 13)',
      openai: 'Privacy Policy disclosure that data may be used for training',
      gap: 'Disclosure does not explain: permanent embedding in weights; impossibility of removal; inability to quantify your contribution.',
    },
    {
      right: 'Right to object to processing (Article 21)',
      openai: 'Opt-out toggle in settings for future training',
      gap: 'Opt-out applies to new conversations only. Data already used for training is already embedded. There is no retroactive opt-out.',
    },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', paddingBottom: 'clamp(3rem, 6vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        The legal gap
      </p>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '2rem',
      }}>
        In March 2023, Italy's data protection authority - the Garante - temporarily banned ChatGPT from operating in Italy. The central concern: OpenAI could not demonstrate that users' personal data, once embedded in model weights, had been or could be erased on request. OpenAI added opt-out controls and the ban was lifted. The underlying technical problem was not resolved.
      </p>

      {/* Rights vs reality table */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <div style={{ minWidth: 500 }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1px', background: PALETTE.border, marginBottom: '1px',
          }}>
            {['Your legal right', 'What OpenAI offers', 'The gap'].map((h, i) => (
              <div key={i} style={{ background: PALETTE.bgPanel, padding: '0.7rem 1rem' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{h}</p>
              </div>
            ))}
          </div>
          {/* Rows */}
          {rows.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1px', background: PALETTE.border, marginBottom: '1px',
              }}
            >
              <div style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, lineHeight: 1.55 }}>{row.right}</p>
              </div>
              <div style={{ background: PALETTE.bgPanel, padding: '0.9rem 1rem' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, lineHeight: 1.55 }}>{row.openai}</p>
              </div>
              <div style={{ background: PALETTE.redFaint, padding: '0.9rem 1rem' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.red, lineHeight: 1.65, letterSpacing: '0.04em' }}>{row.gap}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* OpenAI's own words */}
      <div style={{
        background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`,
        padding: 'clamp(1rem, 3vw, 1.75rem)', marginBottom: '1.5rem',
      }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.75rem',
        }}>
          OpenAI Help Centre - verbatim
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
          color: PALETTE.inkMuted, lineHeight: 1.75, marginBottom: '0.75rem',
        }}>
          "Models do not store or retain copies of the data they are trained on."
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em',
          color: PALETTE.red, lineHeight: 1.65,
        }}>
          This is technically accurate. It is also structurally evasive. The model does not store a copy. It absorbed the data into its parameters. The distinction allows OpenAI to claim compliance with deletion requests while the model - and your contribution to it - remains entirely unchanged.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SECTION - The consent failure
// ============================================================================
function ConsentFailure() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', paddingBottom: 'clamp(3rem, 6vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        What you were told vs what you agreed to
      </p>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
        color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem',
      }}>
        The terms you agreed to stated that your conversations might be used to train AI models. This disclosure was accurate. It was not comprehensible.
      </p>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
        color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: 640, marginBottom: '1.5rem',
      }}>
        "Training" sounds like a process. It sounds temporary. It implies a stage that concludes. The terms did not state: your specific patterns of thought will become part of the permanent architecture of a commercial AI system. They did not state: deleting your account will not remove your contribution. They did not state: there is no known method by which your contribution can be removed.
      </p>

      {/* Nissenbaum */}
      <div style={{
        borderLeft: `3px solid ${PALETTE.border}`,
        paddingLeft: 'clamp(1.25rem, 3vw, 2rem)',
        marginBottom: '1.5rem',
      }}>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
          color: PALETTE.inkMuted, lineHeight: 1.75, marginBottom: '0.75rem',
        }}>
          Disclosure without comprehension is not consent. The more complex the system, the more precise the disclosure must be to constitute genuine informed consent. AI training - diffuse, irreversible, invisible - exceeds the complexity threshold at which any current disclosure mechanism is adequate.
        </p>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          Nissenbaum, 2011 - A Contextual Approach to Privacy Online
        </p>
      </div>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
        color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: 640,
      }}>
        McDonald and Cranor (2008) estimated that reading the privacy policies of every website an average American visits would take 76 work days per year. OpenAI's Terms of Service run to approximately 3,800 words. The academic consensus is that no one reads them. The legal consensus is that clicking "I agree" constitutes consent anyway.
      </p>
    </motion.div>
  );
}

// ============================================================================
// SECTION - Your data, specifically
// ============================================================================
function YourDataSpecifically({ analysis }: { analysis: DeepAnalysis | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const messages = analysis?.totalUserMessages || 0;
  const days = analysis?.timespan?.days || 0;
  const topics = analysis?.findings?.repetitiveThemes?.slice(0, 3).map(t => t.theme) || [];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 'clamp(4rem, 8vw, 6rem)', paddingBottom: 'clamp(3rem, 6vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        What this means for your data specifically
      </p>

      {messages > 0 ? (
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem',
        }}>
          You sent {messages.toLocaleString()} messages over {days > 0 ? `${days} days` : 'this period'}. {topics.length > 0 && `Your dominant patterns - ${topics.join(', ')} - `}These conversations shaped, in some small but real way, how the model that processed them now responds to questions in those areas. That influence cannot be measured, located, or removed.
        </p>
      ) : (
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          color: PALETTE.ink, lineHeight: 1.8, maxWidth: 660, marginBottom: '1.5rem',
        }}>
          The conversations you uploaded to this tool have already been processed by an AI model. Their patterns - how you think, what you disclose, how you phrase things under pressure - are now part of that model's understanding of human language.
        </p>
      )}

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
        color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: 640, marginBottom: '1.5rem',
      }}>
        OpenAI allows you to delete your account. This removes your access to your conversations. The model does not change. The model does not know you deleted your account. The model does not have a record of you at all - only an influence from you, diffused into its parameters, permanent and unlocalised.
      </p>

      {/* The three facts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {[
          { num: '01', text: 'You cannot request the removal of your data from trained model weights. OpenAI cannot technically fulfil such a request even if they wanted to.' },
          { num: '02', text: 'You cannot know what specifically your conversations contributed. The contribution is distributed. It cannot be quantified or localised.' },
          { num: '03', text: 'The model that learned from your conversations will continue operating for the foreseeable future. Your influence outlasts your account.' },
        ].map((fact, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.1 }}
            style={{
              display: 'grid', gridTemplateColumns: '3rem 1fr',
              background: PALETTE.bgPanel, padding: 'clamp(1rem, 2.5vw, 1.5rem)',
              gap: '1rem', alignItems: 'start',
            }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', paddingTop: '4px' }}>{fact.num}</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: PALETTE.ink, lineHeight: 1.7 }}>{fact.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// CLOSING STATEMENT
// ============================================================================

// ── THE RETRAINING BAR ─────────────────────────────────────────────────────
// Pudding principle: show impossibility through time the reader can feel.
// 90 real days to retrain GPT-4. The bar counts up in actual seconds.
// It will always show 0.000%.

function RetrainingBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isInView) return;
    startRef.current = Date.now();
    const id = setInterval(() => { setElapsed((Date.now() - startRef.current!) / 1000); }, 80);
    return () => clearInterval(id);
  }, [isInView]);

  const RETRAIN_SECS = 90 * 24 * 3600;
  const pct = (elapsed / RETRAIN_SECS) * 100;
  const pctStr = pct.toFixed(7);

  // July 22 2026 = April 23 + 90 days
  const completionStr = '22 July 2026';

  const facts = [
    { value: '~90 days', label: 'Full GPT-4 retraining time' },
    { value: '$100M+', label: 'Estimated compute cost' },
    { value: '1.8T', label: 'Parameters to update' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        borderTop: `1px solid ${PALETTE.border}`,
        paddingTop: 'clamp(2.5rem, 5vw, 4rem)',
        marginTop: 'clamp(2.5rem, 5vw, 4rem)',
        marginBottom: 'clamp(3rem, 6vw, 5rem)',
      }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        The only real alternative - full model retraining
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, marginBottom: '2.5rem' }}>
        The only way to guarantee removal of your data is to retrain the model from scratch - excluding your conversations. For GPT-4, that takes approximately 90 days of continuous compute. If OpenAI began retraining at the exact moment you started reading this page, this is how far along they would be.
      </p>

      <div className="cbd-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: PALETTE.border, marginBottom: '2rem' }}>
        {facts.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.2 + i * 0.1 }} style={{ background: PALETTE.bgPanel, padding: '1.4rem' }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.4rem' }}>{f.value}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{f.label}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
            Retraining progress - from the moment you opened this page
          </span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '13px', color: PALETTE.red, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
            {pctStr}%
          </span>
        </div>
        <div style={{ height: '8px', background: PALETTE.bgElevated, border: `1px solid ${PALETTE.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.min(pct, 100)}%`,
            background: `rgba(190,40,30,0.5)`,
            transition: 'width 0.08s linear',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.08em' }}>
          Est. completion if started now: <span style={{ color: PALETTE.inkMuted }}>{completionStr}</span>
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.redMuted, letterSpacing: '0.06em', fontStyle: 'italic' }}>
          New training data is added continuously. That date is a fiction.
        </p>
      </div>
    </motion.div>
  );
}

function ClosingStatement({ setPage }: { setPage: (p: any) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
      style={{
        paddingTop: 'clamp(3rem, 6vw, 5rem)',
        paddingBottom: 'clamp(4rem, 8vw, 6rem)',
      }}
    >
      <p style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)',
        color: PALETTE.ink,
        letterSpacing: '-0.02em', lineHeight: 1.3,
        maxWidth: 600, marginBottom: '2rem',
        fontWeight: 400,
      }}>
        You can delete your conversations.<br />
        You cannot delete what they taught.
      </p>
      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
        color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: 560, marginBottom: '3rem',
      }}>
        This is not a policy failure. It is a consequence of the physics of the technology. The model learned from you. Learning is not reversible. The next question is what you consented to - and whether the terms you agreed to were ever legible.
      </p>

      <button
        onClick={() => setPage('terms')}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          letterSpacing: '-0.01em',
          color: PALETTE.ink,
          background: 'none',
          border: `1px solid ${PALETTE.border}`,
          padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(1.5rem, 3vw, 2.5rem)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          display: 'block',
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
        <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>06 / Terms</span>
        What you agreed to →
      </button>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function CannotBeDeletedPage({ results, setPage }: {
  results: any;
  setPage: (p: any) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const messages = results?.totalUserMessages || 0;
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{
      maxWidth: 1000, margin: '0 auto',
      padding: `0 ${pad}`,
      paddingBottom: 'clamp(4rem, 10vw, 8rem)',
    }}>
      {/* Hero */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
        style={{
          padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.6 }}
          style={{ marginBottom: '0.75rem' }}
        >
          <ActLabel roman="III" title="The Permanence" pageLabel="05 / Permanent" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.25, duration: 0.7 }}
        >
          <ThreadSentence>Deletion is a different operation from removal. The gap between them is where you live now.</ThreadSentence>
        </motion.div>

        {/* Hero number - message count or a fixed weight count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ marginBottom: '2rem' }}
        >
          {messages > 0 ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(4rem, 12vw, 8rem)',
                fontWeight: 400, color: PALETTE.red,
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>
                {messages.toLocaleString()}
              </span>
              <div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block' }}>messages</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', display: 'block', marginTop: '3px' }}>all permanent</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <span style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(4rem, 12vw, 8rem)',
                fontWeight: 400, color: PALETTE.red,
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>∞</span>
              <div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', display: 'block' }}>no return function</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.55, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
            fontWeight: 400, color: PALETTE.ink,
            letterSpacing: '-0.025em', lineHeight: 1.2,
            maxWidth: 700, marginBottom: '1.25rem',
          }}
        >
          Your conversations cannot be unlearned.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.85, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
            color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 580,
          }}
        >
          Not because OpenAI will not remove them. Because the process by which AI models learn - gradient descent across billions of parameters - has no reverse function. Deletion of your account is a different operation from removal from the model. This page explains the difference, and why it matters.
        </motion.p>
      </motion.div>

      {/* Sections */}
      <OneWayFlow />
      <WhatWeightsAre />
      <MachineUnlearning />
      <RetrainingBar />
      <LegalGap />
      <ConsentFailure />
      <YourDataSpecifically analysis={results} />
      <ClosingStatement setPage={setPage} />
    </div>
  );
}
