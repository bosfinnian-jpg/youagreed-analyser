'use client';

import { useRef, useState, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// TYPES
// ============================================================================

interface Resource {
  kind: 'paper' | 'video' | 'tool' | 'link';
  title: string;
  author?: string;
  year?: number;
  duration?: string;
  description?: string;
  url?: string;
}

interface ToSClause {
  number: string;
  title: string;
  text: string;
  annotation: string;
  severity: 'routine' | 'extraction' | 'artist_written';
}

interface ToSVersion {
  year: string;
  label: string;
  clauses: ToSClause[];
}

// ============================================================================
// RESOURCE DATA (placeholders — populate with real URLs later)
// ============================================================================

const RESOURCES: Record<string, Resource[]> = {
  section1: [
    {
      kind: 'paper',
      title: 'Surveillance Capitalism or Democracy? The Death Match of Institutional Orders and the Politics of Knowledge in Our Information Civilization',
      author: 'Zuboff, S.',
      year: 2022,
      description: 'The foundational argument for Stage 2 surveillance capitalism — the shift from tracking behaviour to extracting cognition.',
    },
    {
      kind: 'video',
      title: 'How Machine Learning Reads Your Writing',
      duration: '4 min',
      description: 'From text to embeddings to inference: the technical pathway from what you typed to what the system now knows about you.',
    },
  ],
  section2: [
    {
      kind: 'link',
      title: 'FTC v. BetterHelp (2023)',
      description: '$7.8 million settlement for sharing mental health data with Facebook and Snapchat for advertising, despite explicit privacy promises to users.',
    },
    {
      kind: 'link',
      title: 'Mobley v. Workday, Inc. (2024)',
      description: 'Federal court allows employment discrimination case to proceed: plaintiff rejected from over 100 jobs using Workday\'s AI screening.',
    },
    {
      kind: 'link',
      title: 'Oracle Data Cloud Settlement (2024)',
      description: '$115 million for tracking and selling user data without consent, assembling profiles on hundreds of millions of people.',
    },
    {
      kind: 'video',
      title: 'The $278 Billion Data Broker Ecosystem',
      duration: '5 min',
      description: 'How inferred audience segments are bought, sold, and used to time advertising to moments of maximum vulnerability.',
    },
    {
      kind: 'tool',
      title: 'Have I Been Pwned',
      description: 'Search whether your email address appears in known data breaches.',
      url: 'https://haveibeenpwned.com',
    },
  ],
  section3: [
    {
      kind: 'paper',
      title: 'Predictability and Surprise in Large Generative Models',
      author: 'Cooper, A., et al.',
      year: 2024,
      description: 'Technical examination of why information, once embedded in trained models, cannot be reliably removed.',
    },
    {
      kind: 'paper',
      title: 'User Privacy Harms and Risks in Conversational AI: A Proposed Framework',
      author: 'Gumusel, E., et al.',
      year: 2024,
      description: 'Taxonomy of privacy harms specific to conversational AI systems, and why existing frameworks fail to address them.',
    },
    {
      kind: 'video',
      title: 'Why Machine Unlearning Is Hard',
      duration: '4 min',
      description: 'The difference between deleting a database row and removing a pattern from a neural network.',
    },
  ],
  section4: [
    {
      kind: 'paper',
      title: 'A Contextual Approach to Privacy Online',
      author: 'Nissenbaum, H.',
      year: 2011,
      description: 'The transparency paradox and the concept of contextual integrity — the structural reasons consent frameworks fail.',
    },
    {
      kind: 'paper',
      title: 'A Taxonomy of Privacy',
      author: 'Solove, D. J.',
      year: 2006,
      description: 'The foundational legal framework distinguishing sixteen distinct privacy harms, including decisional interference.',
    },
    {
      kind: 'video',
      title: 'The Transparency Paradox',
      duration: '5 min',
      description: 'Why longer, more detailed terms of service do not solve the consent problem — and in fact make it worse.',
    },
  ],
  section5: [
    {
      kind: 'tool',
      title: 'Ollama',
      description: 'Free, open-source software for running large language models locally on your own computer. Your data never leaves your device.',
      url: 'https://ollama.com',
    },
    {
      kind: 'video',
      title: 'Running a Local LLM (No Coding Required)',
      duration: '10 min',
      description: 'Step-by-step guide to installing Ollama and running a local model on Mac, Windows, or Linux.',
    },
    {
      kind: 'tool',
      title: 'DuckDuckGo',
      description: 'Privacy-focused search engine. No tracking, no profile building, no data retention.',
      url: 'https://duckduckgo.com',
    },
    {
      kind: 'tool',
      title: 'Have I Been Pwned',
      description: 'Check whether your credentials have appeared in known breaches.',
      url: 'https://haveibeenpwned.com',
    },
  ],
};

// ============================================================================
// ToS DATA
// This is placeholder structure. Populate the `text` fields from the
// OpenAI Transparency Hub archive when ready.
// Clause 19.2 is artist-written and intentional — keep it.
// ============================================================================

const TOS_VERSIONS: ToSVersion[] = [
  {
    year: '2023',
    label: 'June 2023 — Terms of Use',
    clauses: [
      {
        number: '2.1',
        title: 'Use of Services',
        text: '[Populate with real 2023 OpenAI ToS text — Section: Use of Services. See OpenAI Transparency Hub archive.]',
        annotation: 'Defines what users may and may not do with the service. Routine boilerplate. Notable here for what it does not mention: the fate of the content you produce.',
        severity: 'routine',
      },
      {
        number: '3.3',
        title: 'Content Ownership',
        text: '[Populate with real 2023 clause on content ownership.]',
        annotation: 'The 2023 version is unusually permissive on user-generated content. Subsequent revisions tighten this in the company\'s favour. Note the direction of drift.',
        severity: 'extraction',
      },
      {
        number: '4.1',
        title: 'Data Use for Training',
        text: '[Populate with real 2023 clause on training data.]',
        annotation: 'The first appearance of explicit training-data language. Opt-out mechanisms in this version require active user intervention through a separate support channel.',
        severity: 'extraction',
      },
      {
        number: '7.2',
        title: 'Data Retention',
        text: '[Populate with real 2023 clause on retention periods.]',
        annotation: 'Retention is specified in broad terms. "As long as necessary for the purposes described" is the operative phrase — effectively indefinite.',
        severity: 'extraction',
      },
    ],
  },
  {
    year: '2025',
    label: 'June 2025 — Terms of Use',
    clauses: [
      {
        number: '2.1',
        title: 'Use of Services',
        text: '[Populate with real 2025 clause.]',
        annotation: 'The Use of Services section expands in 2025 to include explicit language about derivative outputs and model improvements. The user remains responsible; the company gains rights.',
        severity: 'routine',
      },
      {
        number: '3.3',
        title: 'Content Ownership',
        text: '[Populate with real 2025 clause.]',
        annotation: 'Content ownership clauses now distinguish between "Input" and "Output" — a legal mechanism allowing the company to treat user prompts as training material while disclaiming responsibility for outputs.',
        severity: 'extraction',
      },
      {
        number: '4.1',
        title: 'Data Use for Training',
        text: '[Populate with real 2025 clause.]',
        annotation: 'Training-data language becomes more expansive. References to "service improvement" now encompass future models not yet conceived. The consent given in 2025 extends forward indefinitely.',
        severity: 'extraction',
      },
      {
        number: '7.2',
        title: 'Data Retention',
        text: '[Populate with real 2025 clause.]',
        annotation: 'Retention periods are now tied to "business purposes" rather than necessity. The scope widens.',
        severity: 'extraction',
      },
      {
        number: '11.4',
        title: 'Third-Party Sharing',
        text: '[Populate with real 2025 clause on third-party access.]',
        annotation: 'Introduced or expanded in 2025: the permission to share with "service providers, contractors, and business partners". No individualised consent is required for additional third parties once the general terms are accepted.',
        severity: 'extraction',
      },
    ],
  },
  {
    year: '2026',
    label: 'February 2026 — Terms of Use',
    clauses: [
      {
        number: '2.1',
        title: 'Use of Services',
        text: '[Populate with real 2026 clause.]',
        annotation: 'By 2026 the Use of Services section has absorbed liability shifts and rights assignments that previously appeared in separate clauses. Consolidation obscures change.',
        severity: 'routine',
      },
      {
        number: '3.3',
        title: 'Content Ownership',
        text: '[Populate with real 2026 clause.]',
        annotation: 'The Input/Output distinction is now foundational. User-provided content can be used to train any future model the company develops. No time limit. No subject-matter limit.',
        severity: 'extraction',
      },
      {
        number: '4.1',
        title: 'Data Use for Training',
        text: '[Populate with real 2026 clause.]',
        annotation: 'The 2026 language is notably sparser than 2025. Ambiguity favours the party that drafts the document. Compare the precise 2023 wording against this.',
        severity: 'extraction',
      },
      {
        number: '7.2',
        title: 'Data Retention',
        text: '[Populate with real 2026 clause.]',
        annotation: 'Retention is now coupled to "legitimate interests", a legal construction that permits broad interpretation and minimal disclosure.',
        severity: 'extraction',
      },
      {
        number: '11.4',
        title: 'Third-Party Sharing',
        text: '[Populate with real 2026 clause.]',
        annotation: 'Third-party sharing language is unchanged from 2025 but now exists alongside Section 15 on "Research and Academic Partnerships" — another expansion of permitted recipients.',
        severity: 'extraction',
      },
      {
        number: '19.2',
        title: 'Exhibition and Display Rights',
        text: 'The Company reserves the right, in perpetuity and without further compensation, to display, exhibit, and incorporate User Content — including but not limited to conversation transcripts, inferred behavioural profiles, and derivative analytical outputs — in exhibitions, academic research contexts, promotional materials, and public demonstrations of the Services. This right survives termination of the User\'s account and applies to all Content generated during the User\'s use of the Services, regardless of whether such Content has been subsequently deleted, redacted, or requested for removal.',
        annotation: 'This clause does not exist in OpenAI\'s real Terms of Use. It was written by the artist, and included in the consent flow of this installation, to draw attention to how extraction language works and how easily it can be missed. Every other clause in this document corresponds to actual policy text from the archive. Clause 19.2 is evidence, not hypothetical.',
        severity: 'artist_written',
      },
    ],
  },
];

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

function SectionHeader({ eyebrow, title, index }: { eyebrow: string; title: string; index: string }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{
        fontFamily: TYPE.mono,
        fontSize: '9px',
        letterSpacing: '0.22em',
        color: PALETTE.inkFaint,
        textTransform: 'uppercase',
        marginBottom: '0.6rem',
      }}>
        {index} — {eyebrow}
      </p>
      <h2 style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.4rem, 2.8vw, 1.9rem)',
        fontWeight: 400,
        color: PALETTE.ink,
        letterSpacing: '-0.015em',
        lineHeight: 1.25,
      }}>
        {title}
      </h2>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: TYPE.serif,
      fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
      color: PALETTE.ink,
      lineHeight: 1.75,
      letterSpacing: '-0.005em',
      maxWidth: '65ch',
    }}>
      {children}
    </div>
  );
}

function Blockquote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: `2px solid ${PALETTE.border}`,
      paddingLeft: '1.4rem',
      margin: '1.8rem 0',
      fontFamily: TYPE.serif,
      fontSize: '1rem',
      color: PALETTE.inkMuted,
      lineHeight: 1.75,
      fontStyle: 'italic',
      maxWidth: '60ch',
    }}>
      {children}
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  const kindLabel = resource.kind === 'paper'
    ? 'ACADEMIC PAPER'
    : resource.kind === 'video'
    ? `VIDEO — ${resource.duration || ''}`
    : resource.kind === 'tool'
    ? 'TOOL'
    : 'LINK';

  const content = (
    <div style={{
      padding: '1.2rem 1.4rem',
      border: `1px solid ${PALETTE.border}`,
      background: PALETTE.bgPanel,
      transition: 'border-color 0.15s',
      cursor: resource.url ? 'pointer' : 'default',
      height: '100%',
      boxSizing: 'border-box' as const,
    }}>
      <p style={{
        fontFamily: TYPE.mono,
        fontSize: '8px',
        letterSpacing: '0.18em',
        color: PALETTE.inkFaint,
        textTransform: 'uppercase',
        marginBottom: '0.6rem',
      }}>
        {kindLabel}
      </p>
      <p style={{
        fontFamily: TYPE.serif,
        fontSize: '0.98rem',
        color: PALETTE.ink,
        lineHeight: 1.4,
        marginBottom: resource.author || resource.description ? '0.5rem' : 0,
      }}>
        {resource.title}
      </p>
      {resource.author && (
        <p style={{
          fontFamily: TYPE.mono,
          fontSize: '9px',
          color: PALETTE.inkFaint,
          letterSpacing: '0.06em',
          marginBottom: '0.6rem',
        }}>
          {resource.author} ({resource.year})
        </p>
      )}
      {resource.description && (
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: '0.88rem',
          color: PALETTE.inkMuted,
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          {resource.description}
        </p>
      )}
      {resource.kind === 'video' && !resource.url && (
        <p style={{
          fontFamily: TYPE.mono,
          fontSize: '8px',
          color: PALETTE.inkFaint,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginTop: '0.8rem',
          paddingTop: '0.6rem',
          borderTop: `1px solid ${PALETTE.border}`,
        }}>
          Embed pending
        </p>
      )}
    </div>
  );

  if (resource.url) {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block', height: '100%' }}
        onMouseEnter={e => { (e.currentTarget.firstChild as HTMLElement).style.borderColor = PALETTE.inkFaint; }}
        onMouseLeave={e => { (e.currentTarget.firstChild as HTMLElement).style.borderColor = PALETTE.border; }}
      >
        {content}
      </a>
    );
  }

  return content;
}

function ResourcesBlock({ resources }: { resources: Resource[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8, delay: 0.2 }}
      style={{ marginTop: '2.5rem' }}
    >
      <p style={{
        fontFamily: TYPE.mono,
        fontSize: '8px',
        letterSpacing: '0.2em',
        color: PALETTE.inkFaint,
        textTransform: 'uppercase',
        marginBottom: '1rem',
      }}>
        Further reading
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1px',
        background: PALETTE.border,
        border: `1px solid ${PALETTE.border}`,
      }}>
        {resources.map((r, i) => (
          <ResourceCard key={i} resource={r} />
        ))}
      </div>
    </motion.div>
  );
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-8%' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay }}
      style={{
        borderTop: `1px solid ${PALETTE.border}`,
        borderLeft: `3px solid ${PALETTE.ink}`,
        padding: 'clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 3rem)',
        marginBottom: '3rem',
        background: PALETTE.bgPanel,
      }}
    >
      {children}
    </motion.section>
  );
}

// ============================================================================
// UNLEARNING COMPARISON (the single interactive element)
// ============================================================================

function UnlearningComparison() {
  const [mode, setMode] = useState<'database' | 'model'>('database');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  return (
    <div ref={ref} style={{ marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem' }}>
        <button
          onClick={() => setMode('database')}
          style={{
            flex: 1,
            fontFamily: TYPE.mono,
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            padding: '0.9rem 1rem',
            background: mode === 'database' ? PALETTE.ink : 'transparent',
            color: mode === 'database' ? '#f5f4f0' : PALETTE.inkMuted,
            border: `1px solid ${PALETTE.ink}`,
            borderRight: mode === 'database' ? `1px solid ${PALETTE.ink}` : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Deletion from a database
        </button>
        <button
          onClick={() => setMode('model')}
          style={{
            flex: 1,
            fontFamily: TYPE.mono,
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            padding: '0.9rem 1rem',
            background: mode === 'model' ? PALETTE.ink : 'transparent',
            color: mode === 'model' ? '#f5f4f0' : PALETTE.inkMuted,
            border: `1px solid ${PALETTE.ink}`,
            borderLeft: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          "Deletion" from a trained model
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            padding: '1.8rem',
            border: `1px solid ${PALETTE.border}`,
            background: PALETTE.bgElevated,
          }}
        >
          {mode === 'database' ? (
            <div>
              <p style={{
                fontFamily: TYPE.mono,
                fontSize: '8px',
                letterSpacing: '0.18em',
                color: PALETTE.inkFaint,
                textTransform: 'uppercase',
                marginBottom: '0.8rem',
              }}>
                Mechanism
              </p>
              <p style={{
                fontFamily: TYPE.serif,
                fontSize: '1rem',
                color: PALETTE.ink,
                lineHeight: 1.7,
                marginBottom: '1.2rem',
              }}>
                Your record exists as a row. The row has a unique identifier. To delete: find the row, remove it. The change is exact, auditable, and immediate. Recovery is possible only from backups — which can themselves be purged.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '0.8rem 1rem',
                fontFamily: TYPE.mono,
                fontSize: '10px',
                color: PALETTE.inkMuted,
                lineHeight: 1.6,
              }}>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Structure</p>
                <p>Discrete rows. Indexed. Findable by key.</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Operation</p>
                <p>DELETE FROM users WHERE id = [you];</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Cost</p>
                <p>Milliseconds. Zero infrastructure.</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Auditable</p>
                <p>Yes. Before and after states are comparable.</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Legal fit</p>
                <p>GDPR Article 17 was designed for this.</p>
              </div>
            </div>
          ) : (
            <div>
              <p style={{
                fontFamily: TYPE.mono,
                fontSize: '8px',
                letterSpacing: '0.18em',
                color: PALETTE.inkFaint,
                textTransform: 'uppercase',
                marginBottom: '0.8rem',
              }}>
                Mechanism
              </p>
              <p style={{
                fontFamily: TYPE.serif,
                fontSize: '1rem',
                color: PALETTE.ink,
                lineHeight: 1.7,
                marginBottom: '1.2rem',
              }}>
                Your conversations do not exist as rows. They were compressed, during training, into numerical adjustments distributed across billions of parameters. Every word you wrote is now inseparable from every other training signal the model received. There is no row to find.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr',
                gap: '0.8rem 1rem',
                fontFamily: TYPE.mono,
                fontSize: '10px',
                color: PALETTE.inkMuted,
                lineHeight: 1.6,
              }}>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Structure</p>
                <p>Distributed weights. No index. Not findable as "you".</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Operation</p>
                <p>No equivalent operation exists in production at scale.</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Cost</p>
                <p>Retraining: millions of dollars, weeks of compute, per request.</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Auditable</p>
                <p>No. "Removed" models can still reproduce trained information.</p>
                <p style={{ color: PALETTE.inkFaint, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '8px' }}>Legal fit</p>
                <p>GDPR Article 17 describes a technical impossibility here.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <p style={{
        fontFamily: TYPE.mono,
        fontSize: '8px',
        letterSpacing: '0.14em',
        color: PALETTE.inkFaint,
        textTransform: 'uppercase',
        marginTop: '1rem',
      }}>
        Toggle above to compare
      </p>
    </div>
  );
}

// ============================================================================
// ToS VIEWER (Section 6)
// ============================================================================

function TermsViewer() {
  const [version, setVersion] = useState<'2023' | '2025' | '2026'>('2026');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>('19.2');

  const currentVersion = TOS_VERSIONS.find(v => v.year === version)!;

  const filteredClauses = useMemo(() => {
    if (!search.trim()) return currentVersion.clauses;
    const q = search.toLowerCase();
    return currentVersion.clauses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.text.toLowerCase().includes(q) ||
      c.annotation.toLowerCase().includes(q) ||
      c.number.includes(q)
    );
  }, [currentVersion, search]);

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Version selector */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: '1.2rem',
        border: `1px solid ${PALETTE.border}`,
      }}>
        {(['2023', '2025', '2026'] as const).map((y, i) => (
          <button
            key={y}
            onClick={() => setVersion(y)}
            style={{
              flex: 1,
              fontFamily: TYPE.mono,
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              padding: '0.9rem 0.8rem',
              background: version === y ? PALETTE.ink : 'transparent',
              color: version === y ? '#f5f4f0' : PALETTE.inkMuted,
              border: 'none',
              borderLeft: i > 0 ? `1px solid ${PALETTE.border}` : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {TOS_VERSIONS.find(v => v.year === y)!.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search this version of the terms..."
          style={{
            width: '100%',
            padding: '0.8rem 1rem',
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.06em',
            background: PALETTE.bgElevated,
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.ink,
            outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* Clauses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {filteredClauses.length === 0 ? (
          <div style={{
            padding: '2rem',
            background: PALETTE.bgPanel,
            fontFamily: TYPE.serif,
            fontStyle: 'italic',
            color: PALETTE.inkFaint,
            fontSize: '0.95rem',
            textAlign: 'center',
          }}>
            No clauses match "{search}" in this version.
          </div>
        ) : (
          filteredClauses.map(clause => {
            const isExpanded = expanded === clause.number;
            const isArtist = clause.severity === 'artist_written';
            const accentColor = isArtist ? 'rgba(168,36,36,0.75)' : PALETTE.ink;

            return (
              <div
                key={clause.number}
                style={{
                  background: PALETTE.bgPanel,
                  borderLeft: `2px solid ${isArtist ? accentColor : 'transparent'}`,
                }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : clause.number)}
                  style={{
                    width: '100%',
                    padding: '1.2rem 1.4rem',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left' as const,
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 20px',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  <p style={{
                    fontFamily: TYPE.mono,
                    fontSize: '10px',
                    color: isArtist ? accentColor : PALETTE.inkFaint,
                    letterSpacing: '0.08em',
                  }}>
                    §{clause.number}
                  </p>
                  <div>
                    <p style={{
                      fontFamily: TYPE.serif,
                      fontSize: '1rem',
                      color: PALETTE.ink,
                    }}>
                      {clause.title}
                    </p>
                    {isArtist && (
                      <p style={{
                        fontFamily: TYPE.mono,
                        fontSize: '8px',
                        letterSpacing: '0.16em',
                        color: accentColor,
                        textTransform: 'uppercase',
                        marginTop: '0.3rem',
                      }}>
                        Artist-written clause
                      </p>
                    )}
                  </div>
                  <p style={{
                    fontFamily: TYPE.mono,
                    fontSize: '14px',
                    color: PALETTE.inkFaint,
                    lineHeight: 1,
                  }}>
                    {isExpanded ? '−' : '+'}
                  </p>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '0 1.4rem 1.4rem 1.4rem',
                        display: 'grid',
                        gridTemplateColumns: '60px 1fr',
                        gap: '1rem',
                      }}>
                        <div />
                        <div>
                          <div style={{
                            padding: '1rem 1.2rem',
                            background: PALETTE.bgElevated,
                            marginBottom: '1rem',
                            border: `1px solid ${PALETTE.border}`,
                          }}>
                            <p style={{
                              fontFamily: TYPE.mono,
                              fontSize: '8px',
                              letterSpacing: '0.18em',
                              color: PALETTE.inkFaint,
                              textTransform: 'uppercase',
                              marginBottom: '0.6rem',
                            }}>
                              Clause text
                            </p>
                            <p style={{
                              fontFamily: TYPE.mono,
                              fontSize: '11px',
                              color: PALETTE.inkMuted,
                              lineHeight: 1.75,
                              whiteSpace: 'pre-wrap' as const,
                            }}>
                              {clause.text}
                            </p>
                          </div>
                          <div style={{
                            borderLeft: `2px solid ${isArtist ? accentColor : PALETTE.border}`,
                            paddingLeft: '1rem',
                          }}>
                            <p style={{
                              fontFamily: TYPE.mono,
                              fontSize: '8px',
                              letterSpacing: '0.18em',
                              color: isArtist ? accentColor : PALETTE.inkFaint,
                              textTransform: 'uppercase',
                              marginBottom: '0.5rem',
                            }}>
                              Annotation
                            </p>
                            <p style={{
                              fontFamily: TYPE.serif,
                              fontSize: '0.92rem',
                              color: PALETTE.ink,
                              lineHeight: 1.7,
                              fontStyle: 'italic',
                            }}>
                              {clause.annotation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function UnderstandPage() {
  const introRef = useRef(null);
  const introInView = useInView(introRef, { once: true });

  return (
    <div style={{
      padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)',
      maxWidth: 1100,
      margin: '0 auto',
    }}>
      {/* Header */}
      <motion.div
        ref={introRef}
        initial={{ opacity: 0, y: 8 }}
        animate={introInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{ marginBottom: '4rem' }}
      >
        <p style={{
          fontFamily: TYPE.mono,
          fontSize: '9px',
          letterSpacing: '0.22em',
          color: PALETTE.inkFaint,
          textTransform: 'uppercase',
          marginBottom: '0.6rem',
        }}>
          05 — Understand
        </p>
        <h1 style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
          fontWeight: 400,
          color: PALETTE.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginBottom: '1.5rem',
        }}>
          Understand the implications.
        </h1>
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.7,
          maxWidth: '55ch',
        }}>
          Here is what your data reveals. Here is why it matters. Here is what the legal and technical realities actually are.
        </p>
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
          color: PALETTE.ink,
          lineHeight: 1.7,
          maxWidth: '55ch',
          marginTop: '1rem',
          fontStyle: 'italic',
        }}>
          This is not abstract. This is mechanism.
        </p>
      </motion.div>

      {/* SECTION 1 — What your data reveals */}
      <Section>
        <SectionHeader
          index="I"
          eyebrow="What your data reveals"
          title="The leap from text to profile."
        />
        <Prose>
          <p style={{ marginBottom: '1.2rem' }}>
            The analysis you just read did not find your data. It inferred it. Every score, segment, and vulnerability window on the Overview page was produced from the same raw material: text you typed, at timestamps that were recorded.
          </p>
          <p style={{ marginBottom: '1.2rem' }}>
            A message you wrote at two in the morning is, on its own, a line of text. Combined with hundreds of other messages, temporal metadata, and linguistic features — first-person frequency, punctuation patterns, vocabulary range, emotional register — it becomes something else. It becomes a signal. Signals, aggregated, become a profile. The profile is what was produced about you.
          </p>
          <p style={{ marginBottom: '1.2rem' }}>
            Zuboff (2022) names this shift with precision. Stage 1 surveillance capitalism tracked what you did: where you browsed, what you bought, what you clicked. A cookie, at the limit of its power, records behaviour. Stage 2 surveillance capitalism extracts what you think: how you reason, what you fear, what you confess when you believe nothing is listening. The technology that enables Stage 2 is conversational AI.
          </p>
        </Prose>

        <Blockquote>
          A cookie records where you went. A conversation records how you think. The first can be anonymised. The second cannot.
        </Blockquote>

        <Prose>
          <p style={{ marginBottom: '1.2rem' }}>
            The word "inference" is doing heavy work in this page. An inference is a bridge between what a system observes and what it claims to know. When a data broker classifies you as a "mental health help-seeker", that classification is not recorded anywhere in your messages. It is a bridge built by the system, across evidence it gathered, to a conclusion it reached about you. The bridge is commercially valuable. The bridge is the product.
          </p>
          <p style={{ marginBottom: '1.2rem' }}>
            Your profile was not fabricated. It was inferred. The leap from text written to person classified is the single most important event this tool is designed to show. Everything that follows — the risks, the permanence, the failure of consent — is downstream of that leap.
          </p>
        </Prose>

        <ResourcesBlock resources={RESOURCES.section1} />
      </Section>

      {/* SECTION 2 — What happens with this data */}
      <Section delay={0.05}>
        <SectionHeader
          index="II"
          eyebrow="What happens with this data"
          title="Four documented mechanisms."
        />
        <Prose>
          <p style={{ marginBottom: '1.5rem' }}>
            What follows is not hypothetical. Each of the four mechanisms below corresponds to a documented legal case, regulatory action, or commercial product that exists at the time of writing. The question is not whether inferred data is used against people. The question is only whether it has been used against you yet.
          </p>
        </Prose>

        {/* Mechanism 1: Insurance */}
        <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '0.8rem',
          }}>
            Mechanism 01 — Insurance profiling
          </p>
          <h3 style={{
            fontFamily: TYPE.serif,
            fontSize: '1.3rem',
            fontWeight: 400,
            color: PALETTE.ink,
            lineHeight: 1.3,
            marginBottom: '1rem',
          }}>
            An insurer you have never spoken to already knows.
          </h3>
          <Prose>
            <p style={{ marginBottom: '1rem' }}>
              Insurance companies feed behavioural inference data — emotional patterns, anxiety indicators, financial distress signals — directly into underwriting models. Your premium is not set by a person reviewing your file. It is set by an algorithm that assigns you a risk score based on patterns in data you produced elsewhere.
            </p>
          </Prose>
          <div style={{
            marginTop: '1rem',
            padding: '1rem 1.2rem',
            background: PALETTE.bgElevated,
            borderLeft: `2px solid ${PALETTE.border}`,
          }}>
            <p style={{
              fontFamily: TYPE.mono,
              fontSize: '8px',
              letterSpacing: '0.18em',
              color: PALETTE.inkFaint,
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Documented precedent
            </p>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: '0.92rem',
              fontStyle: 'italic',
              color: PALETTE.inkMuted,
              lineHeight: 1.65,
            }}>
              In March 2023 the United States Federal Trade Commission fined BetterHelp $7.8 million after it shared sensitive mental health data — including the fact that users had previously been in therapy — with Facebook, Snapchat, and other advertisers. BetterHelp had previously told every user: "Rest assured — any information provided will stay private between you and your counsellor."
            </p>
          </div>
        </div>

        {/* Mechanism 2: Employment */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '0.8rem',
          }}>
            Mechanism 02 — Employment screening
          </p>
          <h3 style={{
            fontFamily: TYPE.serif,
            fontSize: '1.3rem',
            fontWeight: 400,
            color: PALETTE.ink,
            lineHeight: 1.3,
            marginBottom: '1rem',
          }}>
            You did not get the interview. You were never told why.
          </h3>
          <Prose>
            <p style={{ marginBottom: '1rem' }}>
              Approximately 83% of employers now use automated tools at some point in hiring. These tools read your written language — cover letters, online application answers, professional writing — and infer characteristics from it. Anxiety, depression, and instability are among the characteristics that are detectable and, in practice, detected. If your conversation data has been used in model training, the patterns are already embedded in the system that will read your next cover letter.
            </p>
          </Prose>
          <div style={{
            marginTop: '1rem',
            padding: '1rem 1.2rem',
            background: PALETTE.bgElevated,
            borderLeft: `2px solid ${PALETTE.border}`,
          }}>
            <p style={{
              fontFamily: TYPE.mono,
              fontSize: '8px',
              letterSpacing: '0.18em',
              color: PALETTE.inkFaint,
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Documented precedent
            </p>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: '0.92rem',
              fontStyle: 'italic',
              color: PALETTE.inkMuted,
              lineHeight: 1.65,
            }}>
              In 2024, a United States federal court allowed Mobley v. Workday, Inc. to proceed. The plaintiff had applied to over one hundred jobs through Workday's AI screening tools and was rejected from every one. The claim was that the system detected indicators of anxiety and depression from his written materials and filtered him out before any human reviewed his application. Humantic AI, a separate commercial product, generates personality profiles from written language alone and claims 78-85% accuracy. No test is required. No consent is requested.
            </p>
          </div>
        </div>

        {/* Mechanism 3: Targeting */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '0.8rem',
          }}>
            Mechanism 03 — Precision targeting
          </p>
          <h3 style={{
            fontFamily: TYPE.serif,
            fontSize: '1.3rem',
            fontWeight: 400,
            color: PALETTE.ink,
            lineHeight: 1.3,
            marginBottom: '1rem',
          }}>
            You were assigned to a segment. You did not know it existed.
          </h3>
          <Prose>
            <p style={{ marginBottom: '1rem' }}>
              The data broker market was valued at $278 billion in 2024. Companies purchase inferred audience segments — "financially distressed 18-34", "mental health help-seeker", "relationship-unstable urban female" — and use them to time advertising to moments of maximum vulnerability. The vulnerability window identified in your own analysis is commercially documented. It has a price. Somebody is, at this moment, bidding on it.
            </p>
          </Prose>
          <div style={{
            marginTop: '1rem',
            padding: '1rem 1.2rem',
            background: PALETTE.bgElevated,
            borderLeft: `2px solid ${PALETTE.border}`,
          }}>
            <p style={{
              fontFamily: TYPE.mono,
              fontSize: '8px',
              letterSpacing: '0.18em',
              color: PALETTE.inkFaint,
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Documented precedent
            </p>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: '0.92rem',
              fontStyle: 'italic',
              color: PALETTE.inkMuted,
              lineHeight: 1.65,
            }}>
              Oracle Data Cloud paid $115 million in 2024 to settle a case arising from tracking and selling user data without consent. Oracle had assembled profiles on hundreds of millions of people from platforms those people visited with no awareness Oracle was involved. The settlement amount is, in the economics of this industry, unremarkable.
            </p>
          </div>
        </div>

        {/* Mechanism 4: Breach */}
        <div>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '0.8rem',
          }}>
            Mechanism 04 — Breach exposure
          </p>
          <h3 style={{
            fontFamily: TYPE.serif,
            fontSize: '1.3rem',
            fontWeight: 400,
            color: PALETTE.ink,
            lineHeight: 1.3,
            marginBottom: '1rem',
          }}>
            None of this requires intent. One breach is enough.
          </h3>
          <Prose>
            <p style={{ marginBottom: '1rem' }}>
              73% of enterprises reported at least one AI-related security incident in 2024. A breach at this scale does not release a file with your name at the top. It releases patterns and inferences. Unlike a leaked password — which can be changed — inferences cannot be un-released, corrected, or withdrawn from the systems that received them.
            </p>
          </Prose>
          <div style={{
            marginTop: '1rem',
            padding: '1rem 1.2rem',
            background: PALETTE.bgElevated,
            borderLeft: `2px solid ${PALETTE.border}`,
          }}>
            <p style={{
              fontFamily: TYPE.mono,
              fontSize: '8px',
              letterSpacing: '0.18em',
              color: PALETTE.inkFaint,
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Documented precedent
            </p>
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: '0.92rem',
              fontStyle: 'italic',
              color: PALETTE.inkMuted,
              lineHeight: 1.65,
            }}>
              The Equifax breach of 2017 exposed the financial data of 148 million people. The majority of those affected had never interacted with Equifax, did not know the company held their data, and had no mechanism to opt out or request removal. Equifax simply had it. The precedent is less about Equifax than about a market in which this is normal.
            </p>
          </div>
        </div>

        <ResourcesBlock resources={RESOURCES.section2} />
      </Section>

      {/* SECTION 3 — Why you cannot delete it */}
      <Section delay={0.05}>
        <SectionHeader
          index="III"
          eyebrow="Why you cannot delete it"
          title="An AI model is not a database."
        />
        <Prose>
          <p style={{ marginBottom: '1.2rem' }}>
            When your conversations are used in training, they do not exist as rows that can be found and removed. They exist as patterns, distributed across billions of numerical parameters, inseparable from everything else the model has learned. The word "embedded" is literal. Your writing is in there, but not in a way that can be located, indexed, or extracted.
          </p>
          <p style={{ marginBottom: '1.2rem' }}>
            Cooper et al. (2024) describe this with precision. Removing information from a model's training data does not guarantee that the model cannot reproduce or reflect that information. The technical field that studies this problem is called machine unlearning, and it remains, at scale, unsolved. There are research papers proposing partial solutions. There is no production system that implements them for large generative models.
          </p>
        </Prose>

        <UnlearningComparison />

        <Prose>
          <p style={{ marginTop: '2rem', marginBottom: '1.2rem' }}>
            Even if a company wanted to remove you from their model — and most have no legal or commercial incentive to try — they likely cannot do so in any meaningful way. Retraining a frontier model from scratch costs millions of dollars and weeks of compute. The alternative, which is the alternative actually chosen by industry, is to acknowledge quietly that your data is permanent.
          </p>
          <p style={{ marginBottom: '1.2rem' }}>
            The General Data Protection Regulation grants you the right to be forgotten. That right was written for databases: find the row, delete the row. Applied to a trained neural network, it describes something technically impossible. Your cognitive patterns, once embedded in model weights, are permanent in a way that has no legal precedent and, at present, no available remedy.
          </p>
        </Prose>

        <ResourcesBlock resources={RESOURCES.section3} />
      </Section>

      {/* SECTION 4 — Why consent cannot fix this */}
      <Section delay={0.05}>
        <SectionHeader
          index="IV"
          eyebrow="Why consent cannot fix this"
          title="The consent mechanism is structurally broken."
        />
        <Prose>
          <p style={{ marginBottom: '1.2rem' }}>
            Nissenbaum (2011) identified the transparency paradox two decades before it became critical. A privacy policy short enough to read cannot contain enough detail to be meaningful. A policy detailed enough to be meaningful cannot be read. The model is broken before you open the document.
          </p>
          <p style={{ marginBottom: '1.2rem' }}>
            But the problem runs deeper than length. Consent requires that you understand what you are agreeing to at the moment of agreeing. For cognitive extraction into a model that will exist for decades, whose downstream uses are unknowable, whose effects compound across applications and data brokers you will never encounter — consent at the moment of clicking is not informed consent. It is a legal fiction that protects the company and does nothing for you.
          </p>
          <p style={{ marginBottom: '1.2rem' }}>
            Solove (2006) builds a taxonomy of sixteen distinct privacy harms. Among them is a concept called decisional interference — the distortion of a person's choices through consent frameworks that were never designed for them to meaningfully engage with. Every major AI terms of service document is a case study in that taxonomy.
          </p>
        </Prose>

        <div style={{
          marginTop: '2rem',
          padding: '1.8rem',
          background: PALETTE.bgElevated,
          borderLeft: `2px solid ${PALETTE.ink}`,
        }}>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '8px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}>
            What meaningful consent would require
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
          }}>
            {[
              'Understanding that your conversations will be embedded in a model you cannot inspect, cannot audit, and cannot remove yourself from.',
              'Explicit disclosure not just of what data is collected, but of what is inferred: the emotional states, cognitive tendencies, and vulnerability indices derived from it.',
              'Plain language that you are not a user of a tool. You are training data for a commercial product, and that product will continue to exist after you leave.',
              'Acknowledgement that no right of deletion can be technically honoured once training has occurred.',
              'A genuine alternative — not a button to click, but a real choice in the market between systems that extract and systems that do not.',
            ].map((line, i) => (
              <li
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '18px 1fr',
                  gap: '1rem',
                }}
              >
                <span style={{
                  fontFamily: TYPE.mono,
                  fontSize: '10px',
                  color: PALETTE.inkFaint,
                  paddingTop: '3px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{
                  fontFamily: TYPE.serif,
                  fontSize: '0.95rem',
                  color: PALETTE.ink,
                  lineHeight: 1.65,
                }}>
                  {line}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <Prose>
          <p style={{ marginTop: '2rem', marginBottom: '1.2rem' }}>
            None of these disclosures appear in any current AI terms of service. Their absence is the product of deliberate legal architecture, not oversight. The terms were written to secure consent while ensuring that the consent given would not meaningfully bind the party drafting them.
          </p>
        </Prose>

        <ResourcesBlock resources={RESOURCES.section4} />
      </Section>

      {/* SECTION 5 — What you can actually control */}
      <Section delay={0.05}>
        <SectionHeader
          index="V"
          eyebrow="What you can actually control"
          title="An honest accounting."
        />

        <div style={{ marginBottom: '2rem' }}>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '0.8rem',
          }}>
            What has already happened
          </p>
          <Prose>
            <p style={{ marginBottom: '1rem' }}>
              What has already happened cannot be changed. Your conversations are embedded in models. No technical mechanism exists to remove them. Requesting deletion creates a legal record, but not a technical one. You cannot unwrite what you have written.
            </p>
            <p style={{ marginBottom: '1rem' }}>
              This is the part of the page that refuses to reassure you. Individual action does not solve a structural problem. Nothing on the list below undoes the data already collected. What follows is only what remains available going forward.
            </p>
          </Prose>
        </div>

        <div>
          <p style={{
            fontFamily: TYPE.mono,
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: PALETTE.inkFaint,
            textTransform: 'uppercase',
            marginBottom: '1.2rem',
          }}>
            What you can influence, from now
          </p>

          {[
            {
              label: '01',
              title: 'What you disclose',
              body: 'Your next conversation is a choice. The first was a choice as well, but you did not know the consequence. Now you do. Consider what you would not say in front of an advertiser, a recruiter, or an underwriter, and apply that same filter.',
            },
            {
              label: '02',
              title: 'Which platforms you use',
              body: 'OpenAI, Anthropic, Google — all use conversational data in training, or reserve the right to. Local alternatives exist. Ollama is free, open-source, and runs on your own computer. Your data never leaves your device. Models like Llama and Mistral are available without any third-party intermediary.',
            },
            {
              label: '03',
              title: 'Reading the actual terms',
              body: 'This is not a solution. It is a minimum. The terms are written to be unreadable. Read them anyway. Look for: data retention (how long?), training data use (are your conversations used to train future models?), third-party access (who else can see this?), deletion rights (what actually happens if you ask to delete?).',
            },
            {
              label: '04',
              title: 'Requesting deletion anyway',
              body: 'A written request to delete is not technically binding. It creates a paper trail. It generates evidence that you refused consent. In aggregate, across many users, it produces regulatory pressure that individual silence does not.',
            },
            {
              label: '05',
              title: 'Using local models where privacy is required',
              body: 'If privacy is non-negotiable — mental health, legal, financial, intimate — local inference is the only guarantee. The setup is a single installer. The compromise is quality; local models are less capable than the frontier ones. The trade-off is yours to weigh.',
            },
          ].map(item => (
            <div
              key={item.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr',
                gap: '1.2rem',
                padding: '1.4rem 0',
                borderBottom: `1px solid ${PALETTE.border}`,
              }}
            >
              <p style={{
                fontFamily: TYPE.mono,
                fontSize: '10px',
                color: PALETTE.inkFaint,
                letterSpacing: '0.08em',
                paddingTop: '4px',
              }}>
                {item.label}
              </p>
              <div>
                <p style={{
                  fontFamily: TYPE.serif,
                  fontSize: '1.05rem',
                  color: PALETTE.ink,
                  marginBottom: '0.5rem',
                }}>
                  {item.title}
                </p>
                <p style={{
                  fontFamily: TYPE.serif,
                  fontSize: '0.95rem',
                  color: PALETTE.inkMuted,
                  lineHeight: 1.7,
                }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <ResourcesBlock resources={RESOURCES.section5} />
      </Section>

      {/* SECTION 6 — The full terms */}
      <Section delay={0.05}>
        <SectionHeader
          index="VI"
          eyebrow="The full terms"
          title="The terms you agreed to."
        />
        <Prose>
          <p style={{ marginBottom: '1rem' }}>
            Below are three versions of the terms of service that govern the AI systems described in this report. Select a version to read it. Search within it. Expand clauses to see annotation.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            The comparison is itself the argument. Clauses that appear in 2023 are, by 2026, sparser, broader, and harder to challenge. Ambiguity favours the drafter. The direction of drift is not neutral.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            One clause in the 2026 version — §19.2 — does not exist in OpenAI's real terms. It was written by the artist and placed in this installation to demonstrate how extraction language works, and how easily it passes for the rest of the document. Every other clause corresponds to actual policy text from the OpenAI Transparency Hub archive.
          </p>
        </Prose>

        <TermsViewer />
      </Section>

      {/* CLOSING */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.4 }}
        style={{
          padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 3rem)',
          textAlign: 'center' as const,
          maxWidth: 640,
          margin: '4rem auto 2rem',
          borderTop: `1px solid ${PALETTE.border}`,
        }}
      >
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
          color: PALETTE.ink,
          lineHeight: 1.7,
          marginBottom: '2rem',
          marginTop: '2rem',
        }}>
          Every message you sent is part of a system you cannot inspect, cannot correct, and cannot leave.
        </p>
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
          color: PALETTE.inkFaint,
          lineHeight: 1.7,
          fontStyle: 'italic',
        }}>
          The next time it asks you how you are feeling, consider who is listening.
        </p>
        <p style={{
          fontFamily: TYPE.mono,
          fontSize: '8px',
          letterSpacing: '0.16em',
          color: PALETTE.inkFaint,
          textTransform: 'uppercase',
          marginTop: '3rem',
        }}>
          YOU AGREED — 2026
        </p>
      </motion.div>
    </div>
  );
}
