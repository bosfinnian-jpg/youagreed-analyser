'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

const SECTIONS = [
  {
    num: '01',
    label: 'What just happened',
    heading: 'You clicked agree.',
    body: [
      'You scrolled past a document you did not read. In Clause 19.2, buried between boilerplate about liability and jurisdiction, you gave permission for something you never imagined.',
      'This is not a design flaw. It is a design choice. Every major AI platform operates the same way — not because consent is difficult to obtain, but because informed consent is commercially inconvenient. The longer and more complex the terms, the less likely you are to read them. That outcome is the goal, not the side effect.',
    ],
  },
  {
    num: '02',
    label: 'What they are collecting',
    heading: 'A cookie records where you went. A conversation records how you think.',
    body: [
      'The data your ChatGPT history contains is categorically different from behavioural tracking. Every message you send is a trace of your reasoning process — your anxieties, your contradictions, the questions you ask at 3am that you would never say out loud.',
      'Zuboff (2022) calls this the move from Stage One to Stage Two surveillance capitalism: from tracking behaviour to extracting cognition. Stage One knew what you did. Stage Two knows what kind of person you are, how you make decisions, and what you are likely to do next.',
      'This platform read your vulnerability windows, your emotional tone, the topics you return to again and again. That profile was not fabricated. It was inferred from patterns in language you produced voluntarily, in a space you believed was private.',
    ],
  },
  {
    num: '03',
    label: 'Why you cannot delete it',
    heading: 'There is no delete button. There is no undo.',
    body: [
      'You may believe you can delete this. You cannot.',
      'An AI model is not a database. When your conversations are used in training, they do not exist as rows that can be found and removed. They exist as patterns — distributed across billions of numerical parameters, inseparable from everything else the model has learned.',
      'Cooper et al. (2024) describe this with precision: removing information from a model\'s training data does not guarantee that the model cannot reproduce or reflect that information. The technical problem is called machine unlearning, and it remains largely unsolved. Even if a company wanted to remove you from their model, they likely cannot.',
      'The GDPR grants you the right to be forgotten. That right was written for databases. Applied to a trained neural network, it describes something technically impossible. Your cognitive patterns, once embedded in model weights, are permanent in a way that has no legal precedent and no available remedy.',
    ],
    accent: true,
  },
  {
    num: '04',
    label: 'Why consent cannot fix this',
    heading: 'The consent mechanism is structurally broken.',
    body: [
      'Nissenbaum (2011) identified the transparency paradox two decades before it became acute: a privacy policy short enough to read cannot contain enough detail to be meaningful. A policy detailed enough to be meaningful cannot be read. The model is structurally broken before you open the document.',
      'But the problem runs deeper than readability. Consent requires that you understand what you are agreeing to at the moment of agreeing. For cognitive extraction into a model that will exist for decades, whose downstream uses are unknowable, whose effects compound across applications and data brokers you will never encounter — consent at the moment of clicking is not informed consent. It is a legal fiction that protects the company and does nothing for you.',
      'Solove\'s taxonomy of privacy harms (2006) includes the concept of decisional interference — the distortion of choices by manipulated consent frameworks. Every major AI terms of service document is a case study in that taxonomy.',
    ],
  },
  {
    num: '05',
    label: 'What meaningful consent would require',
    heading: 'The gap between the click and the consequence is not an accident.',
    body: [
      'Meaningful consent would require you to understand, before agreeing, that your conversation patterns will be embedded in a model you cannot inspect, cannot audit, and cannot remove yourself from.',
      'It would require that the company explain not what data they collect, but what they infer — the emotional states, the cognitive tendencies, the vulnerability indices their systems derive and retain.',
      'It would require that you are told, plainly, that you have no right of deletion that can be technically honoured. That the data you produce today will exist in model weights for as long as the model runs. That you are not a user of a tool. You are training data.',
      'None of these disclosures appear in any current AI terms of service. Their absence is the product of deliberate legal architecture, not oversight.',
    ],
    final: true,
  },
];

function Section({ section, index }: { section: typeof SECTIONS[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-8%' });

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: '3rem',
        padding: 'clamp(3rem, 6vw, 5rem) 0',
        borderTop: `1px solid ${PALETTE.border}`,
        position: 'relative',
      }}
    >
      {/* Left: number + label */}
      <div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.1 }}
          style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}
        >
          {section.num}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', lineHeight: 1.5 }}
        >
          {section.label}
        </motion.p>
      </div>

      {/* Right: content */}
      <div>
        {section.accent && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ height: '1px', marginBottom: '2rem', background: `linear-gradient(to right, ${PALETTE.red}, transparent)`, transformOrigin: 'left' }}
          />
        )}

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 1 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.8vw, 1.9rem)',
            fontWeight: 400, color: section.accent ? PALETTE.red : PALETTE.ink,
            letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: '2rem',
          }}
        >
          {section.heading}
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {section.body.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35 + i * 0.15, duration: 0.9 }}
              style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(0.95rem, 1.5vw, 1.08rem)',
                lineHeight: 1.78, color: i === 0 ? PALETTE.ink : PALETTE.inkMuted,
              }}
            >
              {para}
            </motion.p>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function CitationBlock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const citations = [
    { key: 'Zuboff 2022', full: 'Zuboff, S. (2022). Surveillance Capitalism or Democracy? The death match of institutional orders and the politics of knowledge in our information civilization. Organization Theory, 3(1).' },
    { key: 'Nissenbaum 2011', full: 'Nissenbaum, H. (2011). A contextual approach to privacy online. Daedalus, 140(4), 32-48.' },
    { key: 'Cooper et al. 2024', full: 'Cooper, A.F., et al. (2024). Predictability and Surprise in Large Generative Models. Proceedings of FAccT 2024. Also: Gumusel et al. (2024). User Privacy Harms and Risks in Conversational AI.' },
    { key: 'Solove 2006', full: 'Solove, D.J. (2006). A taxonomy of privacy. University of Pennsylvania Law Review, 154(3), 477-564.' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
      style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', borderTop: `1px solid ${PALETTE.border}` }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '2rem' }}>
        Academic sources
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {citations.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1.5rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.1em', color: PALETTE.red, textTransform: 'uppercase' }}>{c.key}</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.88rem', color: PALETTE.inkFaint, lineHeight: 1.6 }}>{c.full}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function UnderstandPage() {
  return (
    <div style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)', maxWidth: 900, margin: '0 auto' }}>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '3rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          05 — Understand this
        </p>
        <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '1rem' }}>
          What this means, and why it matters.
        </h1>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 580 }}>
          The data you have just seen is not abstract. This page explains the mechanisms behind it, why the standard consent frameworks are inadequate, and what the legal and technical realities actually are.
        </p>
      </motion.div>

      {SECTIONS.map((section, i) => (
        <Section key={section.num} section={section} index={i} />
      ))}

      <CitationBlock />
    </div>
  );
}
