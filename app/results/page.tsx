'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useScroll, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CountdownReveal, { RevealData } from './CountdownReveal';

// ============================================================================
// TYPES
// ============================================================================
interface NameMention {
  name: string;
  mentions: number;
  contexts: string[];
  relationship?: string;
}

interface LocationMention {
  location: string;
  mentions: number;
  type: 'lives' | 'works' | 'visits' | 'mentions';
}

interface CognitiveProfile {
  thinkingStyles: {
    style: string;
    percentage: number;
    examples: string[];
    icon: string;
    color: string;
  }[];
  communicationPatterns: {
    pattern: string;
    frequency: number;
    description: string;
  }[];
  problemSolvingApproach: {
    type: string;
    score: number;
    traits: string[];
  };
  cognitiveBiases: {
    bias: string;
    strength: number;
    manifestation: string;
  }[];
}

interface AnalysisResult {
  privacyScore: number;
  findings: {
    personalInfo: {
      names: NameMention[];
      locations: LocationMention[];
      ages: string[];
      emails: string[];
      phoneNumbers: string[];
      relationships: string[];
      workInfo: string[];
    };
    sensitiveTopics: any[];
    vulnerabilityPatterns: any[];
    temporalInsights: any[];
    repetitiveThemes: any[];
  };
  juiciestMoments: any[];
  stats: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };
  cognitiveProfile?: CognitiveProfile;
}

type Stage = 'countdown' | 'afterreveal' | 'results';

// ============================================================================
// SHARED STYLES
// ============================================================================
const PALETTE = {
  paper: '#f5f4f0',
  paperDark: '#eeecea',
  paperWarm: '#f2f1ec',
  paperLight: '#f8f7f3',
  ink: '#1a1a1a',
  inkMuted: 'rgba(26,26,26,0.60)',
  inkFaint: 'rgba(26,26,26,0.20)',
  inkGhost: 'rgba(26,26,26,0.08)',
  red: 'rgba(168,36,36,0.85)',
  redMuted: 'rgba(168,36,36,0.40)',
  redFaint: 'rgba(168,36,36,0.12)',
};

const TYPE = {
  serif: '"EB Garamond", Georgia, serif',
  mono: '"Courier New", monospace',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [stage, setStage] = useState<Stage>('countdown');
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResults');
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      router.push('/upload');
    }
  }, [router]);

  const handleCountdownComplete = useCallback(() => {
    setStage('afterreveal');
  }, []);

  const handleConsentDecision = useCallback((consented: boolean) => {
    setHasConsented(consented);
    sessionStorage.setItem('userConsent', JSON.stringify({
      consented,
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const revealData: RevealData = results ? {
    name: results.findings.personalInfo.names[0]?.name,
    location: results.findings.personalInfo.locations[0]?.location,
    vulnerabilityWindow: results.findings.vulnerabilityPatterns[0]?.timeOfDay,
    emotionalTone: results.findings.vulnerabilityPatterns[0]?.emotionalTone?.replace('_', ' '),
    revealingMoment: results.juiciestMoments[0] ? {
      timestamp: new Date(results.juiciestMoments[0].timestamp).toLocaleString('en-GB'),
      content: results.juiciestMoments[0].excerpt?.substring(0, 180) || '',
    } : undefined,
    messageCount: results.stats.totalMessages,
    topTopic: results.findings.repetitiveThemes[0]?.theme || results.findings.sensitiveTopics[0]?.topic,
  } : {};

  // Loading
  if (!results) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: PALETTE.paper,
      }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
            }}
          >
            Compiling extraction report
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // STAGE 1: COUNTDOWN
  if (stage === 'countdown') {
    return (
      <CountdownReveal
        onComplete={handleCountdownComplete}
        onConsentDecision={handleConsentDecision}
        data={revealData}
      />
    );
  }

  // STAGE 2: AFTER REVEAL
  if (stage === 'afterreveal') {
    return (
      <AfterRevealInline
        onComplete={() => setStage('results')}
        autoAdvance={true}
      />
    );
  }

  // STAGE 3: FULL RESULTS — THE DOSSIER
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        body { margin: 0; }
        body::before {
          content:''; position:fixed; inset:0; z-index:10000;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.028; pointer-events:none;
        }
        ::selection { background: rgba(168,36,36,0.15); }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        ref={containerRef}
        style={{ minHeight: '100vh', background: PALETTE.paper, position: 'relative' }}
      >
        {/* Scroll progress — thin red line */}
        <motion.div
          style={{
            scaleX: smoothProgress,
            position: 'fixed', top: 0, left: 0, right: 0, height: '1px',
            background: PALETTE.redMuted, transformOrigin: 'left', zIndex: 50,
          }}
        />

        {/* Fixed side label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.5 }}
          style={{
            position: 'fixed', left: 'clamp(1.2rem, 3vw, 2.5rem)', top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'center center',
            fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em',
            color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
            zIndex: 40, whiteSpace: 'nowrap' as const,
          }}
        >
          Cognitive extraction report
        </motion.div>

        {/* Vertical rule */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 3, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed', left: 'clamp(2.8rem, 6vw, 5rem)',
            top: '8%', bottom: '8%', width: '1px',
            background: PALETTE.inkGhost, transformOrigin: 'top', zIndex: 30,
          }}
        />

        {/* Main content */}
        <div style={{
          maxWidth: 720, marginLeft: 'clamp(5rem, 12vw, 14rem)', marginRight: 'clamp(2rem, 6vw, 8rem)',
          paddingTop: 'clamp(6rem, 14vh, 10rem)', paddingBottom: '8rem',
        }}>
          <DossierHeader results={results} hasConsented={hasConsented} />
          <ExposureScore score={results.privacyScore} />
          <StatsStrip stats={results.stats} />
          <CognitiveSection results={results} />

          {results.findings.personalInfo.names.length > 0 && (
            <NamesSection names={results.findings.personalInfo.names} />
          )}
          {results.findings.personalInfo.locations.length > 0 && (
            <LocationsSection locations={results.findings.personalInfo.locations} />
          )}
          {(results.findings.personalInfo.relationships.length > 0 ||
            results.findings.personalInfo.phoneNumbers.length > 0) && (
            <OtherDetailsSection personalInfo={results.findings.personalInfo} />
          )}
          {results.findings.repetitiveThemes.length > 0 && (
            <ThemesSection themes={results.findings.repetitiveThemes} />
          )}
          {results.findings.vulnerabilityPatterns.length > 0 && (
            <VulnerabilitySection patterns={results.findings.vulnerabilityPatterns} />
          )}
          {results.findings.sensitiveTopics.length > 0 && (
            <SensitiveSection topics={results.findings.sensitiveTopics} />
          )}
          {results.juiciestMoments.length > 0 && (
            <JuicySection moments={results.juiciestMoments} />
          )}
          <IrreversibilitySection userMessages={results.stats.userMessages} />
          <FinalSection router={router} hasConsented={hasConsented} />
        </div>
      </motion.div>
    </>
  );
}


// ============================================================================
// AFTER REVEAL INLINE — preserved from original with minor refinements
// ============================================================================

type Beat = 0 | 1 | 2 | 3 | 4;

const BEATS = [
  {
    num: '01', label: 'What just happened',
    bg: '#f5f4f0',
    body: [
      'You clicked agree. You scrolled past a document you did not read. In Clause 19.2, buried between boilerplate about liability and jurisdiction, you gave permission for something you never imagined.',
      'This is not a design flaw. It is a design choice. Every major AI platform operates the same way — not because consent is difficult to obtain, but because informed consent is commercially inconvenient.',
    ],
  },
  {
    num: '02', label: 'What they are collecting',
    bg: '#f2f1ec',
    body: [
      'The data your ChatGPT history contains is not comparable to a cookie. A cookie records where you went. A conversation records how you think.',
      'Every message you send is a trace of your reasoning process — your anxieties, your contradictions, the questions you ask at 3am that you would never say out loud. Zuboff calls this the move from Stage One to Stage Two surveillance capitalism: from tracking behaviour to extracting cognition. Your browsing history describes your actions. Your conversations describe you.',
      'This installation read your vulnerability windows, your emotional tone, the topics you return to again and again. That profile was not fabricated. It was inferred — from patterns in language you produced voluntarily, in a space you believed was private.',
    ],
  },
  {
    num: '03', label: 'The deletion problem',
    bg: '#eeecea',
    body: [
      'You may believe you can delete this. You cannot.',
      "An AI model is not a database. When your conversations are used in training, they do not exist as rows that can be found and removed. They exist as patterns — distributed across billions of numerical parameters, inseparable from everything else the model has learned. Cooper et al. (2024) are precise about it: removing information from a model's training data does not guarantee that the model cannot reproduce or reflect that information. There is no delete button. There is no undo.",
      'The GDPR grants you the right to be forgotten. That right was written for databases. Applied to a trained neural network, it describes something technically impossible. Your cognitive patterns, once embedded in model weights, are permanent in a way that has no legal precedent and no available remedy.',
    ],
    redline: true,
  },
  {
    num: '04', label: 'Why consent cannot fix this',
    bg: '#f5f4f0',
    body: [
      'The question is not whether you read the terms. Nissenbaum (2011) identified the transparency paradox: a privacy policy short enough to read cannot contain enough detail to be meaningful. A policy detailed enough to be meaningful cannot be read. The model is structurally broken before you open the document.',
      'Consent requires that you understand what you are agreeing to at the moment of agreeing. For cognitive extraction into a model that will exist for decades, whose downstream uses are unknowable, whose effects compound in ways no one can predict — consent at the moment of clicking is not informed consent. It is a legal fiction that protects the company and does nothing for you.',
    ],
  },
  {
    num: '05', label: 'What meaningful consent would require',
    bg: '#f8f7f3',
    body: [
      'It would require you to understand, before agreeing, that your conversation patterns will be embedded in a model you cannot inspect, cannot audit, and cannot remove yourself from.',
      'It would require that the company explain not what data they collect, but what they infer — the emotional states, the cognitive tendencies, the vulnerability indices their systems derive and retain.',
      'You agreed to this. You did not know what you were agreeing to. That gap — between the click and the consequence — is not an accident.',
    ],
    final: true,
  },
] as const;

const BEAT_DURATIONS: Record<Beat, number> = {
  0: 11000, 1: 15000, 2: 17000, 3: 14000, 4: 0,
};

// Beat background elements
function GridBg({ active }: { active: boolean }) {
  const n = 11;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {Array.from({ length: n }).map((_, i) => (
        <motion.div key={`h${i}`}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: active ? 1 : 0, opacity: active ? 0.055 : 0 }}
          transition={{ duration: 2.4, delay: i * 0.13, ease: 'easeOut' }}
          style={{ position: 'absolute', left: 0, right: 0, top: `${(i / (n - 1)) * 100}%`,
            height: '1px', background: '#1a1a1a', transformOrigin: 'left' }} />
      ))}
      {Array.from({ length: n }).map((_, i) => (
        <motion.div key={`v${i}`}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: active ? 1 : 0, opacity: active ? 0.055 : 0 }}
          transition={{ duration: 2.4, delay: 0.45 + i * 0.13, ease: 'easeOut' }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: `${(i / (n - 1)) * 100}%`,
            width: '1px', background: '#1a1a1a', transformOrigin: 'top' }} />
      ))}
    </div>
  );
}

function ParticleBg({ active }: { active: boolean }) {
  const pts = useRef(Array.from({ length: 30 }, (_, i) => ({
    id: i, x: 12 + Math.random() * 76, y: 8 + Math.random() * 84,
    s: 1.5 + Math.random() * 2.8, dur: 6 + Math.random() * 8, del: Math.random() * 5,
  }))).current;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 1.5 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {pts.map(p => (
        <motion.div key={p.id}
          animate={active ? { opacity: [0, 0.32, 0.22, 0], y: [0, -8, -38, -55], scale: [0, 1, 0.8, 0] } : { opacity: 0 }}
          transition={{ duration: p.dur, delay: p.del, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s, borderRadius: '50%', background: '#1a1a1a' }} />
      ))}
    </motion.div>
  );
}

function FragmentBg({ active }: { active: boolean }) {
  const offsets: [number, number, number][] = [
    [-88,-78,-38],[0,-85,22],[82,-72,-42],
    [-92,2,16],[0,0,0],[88,6,-18],
    [-78,82,38],[8,86,-28],[86,78,22],
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 1.5 }}
      style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)',
        width: 140, height: 140, pointerEvents: 'none' }}>
      {offsets.map(([ex, ey, er], i) => (
        <motion.div key={i}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
          animate={active
            ? { x: [0, ex], y: [0, ey], rotate: [0, er], opacity: [0, i === 4 ? 0.55 : 0.28] }
            : { opacity: 0 }}
          transition={{ duration: 3.8, delay: 0.7 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute',
            left: `${(i % 3) * 33.33}%`, top: `${Math.floor(i / 3) * 33.33}%`,
            width: '33.33%', height: '33.33%',
            background: i === 4 ? 'rgba(168,36,36,0.42)' : 'rgba(26,26,26,0.13)',
            border: `1px solid ${i === 4 ? 'rgba(168,36,36,0.25)' : 'rgba(26,26,26,0.10)'}` }} />
      ))}
    </motion.div>
  );
}

function GapBg({ active }: { active: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 1.6 }}
      style={{ position: 'absolute', bottom: '13%', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', width: '78%', maxWidth: 760 }}>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: active ? 1 : 0 }}
          transition={{ duration: 2.6, delay: 0.4, ease: [0.4,0,0.2,1] }}
          style={{ flex: 1, height: '1px', background: 'rgba(26,26,26,0.10)', transformOrigin: 'right' }} />
        <p style={{ fontFamily: TYPE.mono, fontSize: '8px',
          letterSpacing: '0.18em', color: PALETTE.inkFaint,
          textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
          the click
        </p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: active ? 1 : 0 }}
          transition={{ duration: 2.6, delay: 0.4, ease: [0.4,0,0.2,1] }}
          style={{ flex: 0.3, height: '1px', background: 'rgba(26,26,26,0.10)', transformOrigin: 'left' }} />
        <p style={{ fontFamily: TYPE.mono, fontSize: '8px',
          letterSpacing: '0.18em', color: PALETTE.inkFaint,
          textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
          the consequence
        </p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: active ? 1 : 0 }}
          transition={{ duration: 2.6, delay: 0.4, ease: [0.4,0,0.2,1] }}
          style={{ flex: 1, height: '1px', background: 'rgba(26,26,26,0.10)', transformOrigin: 'left' }} />
      </div>
    </motion.div>
  );
}

function RingBg({ active }: { active: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 2 }}
      style={{ position: 'absolute', right: '7%', top: '50%', transform: 'translateY(-50%)',
        width: 180, height: 180, pointerEvents: 'none' }}>
      {[0,1,2,3,4].map(i => (
        <motion.div key={i}
          animate={active ? { scale: [0.15, 1.5], opacity: [0, 0.18, 0] } : { opacity: 0 }}
          transition={{ duration: 5 + i * 1.4, delay: i * 1.1, repeat: Infinity, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid rgba(26,26,26,0.28)' }} />
      ))}
    </motion.div>
  );
}

const BG_COMPONENTS = [GridBg, ParticleBg, FragmentBg, GapBg, RingBg];

function AfterRevealInline({ onComplete, autoAdvance = true }: { onComplete?: () => void; autoAdvance?: boolean }) {
  const [beat, setBeat] = useState<Beat>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const BG_COLORS: Record<Beat, string> = {
    0: '#f5f4f0', 1: '#f2f1ec', 2: '#eeecea', 3: '#f5f4f0', 4: '#f8f7f3',
  };

  const jumpTo = useCallback((b: Beat) => {
    setBeat(prev => {
      if (b === prev || false) return prev;
      if (timerRef.current) clearTimeout(timerRef.current);
      setTransitioning(true);
      setTimeout(() => { setBeat(b); setTransitioning(false); }, 560);
      return prev;
    });
  }, []);

  const advance = useCallback(() => {
    setBeat(prev => {
      if (prev === 4) return 4;
      const next = (prev + 1) as Beat;
      if (timerRef.current) clearTimeout(timerRef.current);
      setTransitioning(true);
      setTimeout(() => { setBeat(next); setTransitioning(false); }, 560);
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!autoAdvance || beat === 4) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advance, BEAT_DURATIONS[beat]);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [beat, autoAdvance, advance]);

  useEffect(() => {
    const t = setTimeout(() => setChromeVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const data = BEATS[beat];
  const BgComp = BG_COMPONENTS[beat];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
      `}</style>

      <motion.div
        animate={{ background: BG_COLORS[beat] }}
        transition={{ duration: 2.4, ease: 'easeInOut' }}
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'flex-start', paddingLeft: 'clamp(4rem, 11vw, 16rem)', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          <BgComp active={!transitioning} />
        </div>

        <motion.div
          animate={{ height: `${18 + beat * 16}%`, opacity: 0.14 }}
          transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'fixed', left: 'clamp(1.8rem, 5.5vw, 4.5rem)',
            top: '50%', transform: 'translateY(-50%)', width: '1px',
            background: '#1a1a1a', zIndex: 10 }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={beat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: 'relative', zIndex: 10, maxWidth: 580,
              width: '100%', padding: '0 2rem' }}
          >
            <div aria-hidden style={{
              position: 'absolute', top: '-2.5rem', left: '-1.2rem',
              fontFamily: TYPE.serif, fontSize: 'clamp(8rem, 20vw, 15rem)',
              color: 'rgba(26,26,26,0.025)', lineHeight: 1,
              userSelect: 'none', pointerEvents: 'none',
              fontWeight: 400, letterSpacing: '-0.05em',
            }}>
              {data.num}
            </div>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{ fontFamily: TYPE.mono, fontSize: '9px',
                letterSpacing: '0.2em', color: PALETTE.inkFaint,
                textTransform: 'uppercase' as const, marginBottom: '2rem' }}
            >
              {data.num} — {data.label}
            </motion.p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {data.body.map((para, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.42, ease: 'easeOut' }}
                  style={{
                    fontFamily: TYPE.serif,
                    fontSize: 'clamp(1rem, 1.85vw, 1.18rem)',
                    lineHeight: 1.78, fontWeight: 400, letterSpacing: '-0.005em',
                    color: i === 0 ? PALETTE.ink : PALETTE.inkMuted,
                  }}
                >
                  {para}
                </motion.p>
              ))}
            </div>

            {'redline' in data && (
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 2, delay: 2.4, ease: 'easeOut' }}
                style={{ height: '1px', marginTop: '1.8rem',
                  background: `linear-gradient(to right, ${PALETTE.redMuted}, transparent)`,
                  transformOrigin: 'left' }}
              />
            )}

            {'final' in data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 3.5 }}
                style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 1.6, delay: 3.2, ease: 'easeOut' }}
                  style={{ height: '1px', background: PALETTE.inkGhost,
                    transformOrigin: 'left', marginBottom: '0.8rem' }}
                />
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 3.8 }}
                  onClick={onComplete}
                  style={{
                    fontFamily: TYPE.mono, fontSize: '10px',
                    letterSpacing: '0.18em', textTransform: 'uppercase' as const,
                    color: PALETTE.ink, background: 'none',
                    border: `1px solid rgba(26,26,26,0.25)`,
                    padding: '0.85rem 1.6rem', cursor: 'pointer',
                    width: 'fit-content', transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(26,26,26,0.7)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,26,26,0.25)'; }}
                >
                  See your full results →
                </motion.button>
                <p style={{ fontFamily: TYPE.mono, fontSize: '8px',
                  letterSpacing: '0.12em', color: PALETTE.inkFaint,
                  textTransform: 'uppercase' as const }}>
                  Your complete cognitive profile awaits
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {chromeVisible && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'fixed', top: '2.5rem', right: '2.5rem', zIndex: 20,
                  fontFamily: TYPE.mono, fontSize: '9px',
                  letterSpacing: '0.16em', color: PALETTE.inkFaint,
                  textTransform: 'uppercase' as const }}>
                {beat + 1} / 5
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'fixed', bottom: '2.5rem', left: '50%',
                  transform: 'translateX(-50%)', display: 'flex', gap: '0.65rem', zIndex: 20 }}>
                {([0,1,2,3,4] as Beat[]).map(b => (
                  <button key={b} onClick={() => {
                    if (b !== beat && !transitioning) {
                      if (timerRef.current) clearTimeout(timerRef.current);
                      setTransitioning(true);
                      setTimeout(() => { setBeat(b); setTransitioning(false); }, 560);
                    }
                  }}
                    style={{ height: 5, borderRadius: 2.5, border: 'none',
                      cursor: 'pointer', padding: 0,
                      width: beat === b ? 22 : 5,
                      background: beat === b ? PALETTE.ink : PALETTE.inkFaint,
                      transition: 'width 0.4s ease, background 0.3s ease' }} />
                ))}
              </motion.div>

              {beat < 4 && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={advance}
                  style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', zIndex: 20,
                    fontFamily: TYPE.mono, fontSize: '9px',
                    letterSpacing: '0.16em', color: PALETTE.inkFaint,
                    background: 'none', border: 'none', cursor: 'pointer',
                    textTransform: 'uppercase' as const }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.45)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,26,26,0.20)')}>
                  Continue →
                </motion.button>
              )}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}


// ============================================================================
// DOSSIER HEADER
// ============================================================================
function DossierHeader({ results, hasConsented }: { results: AnalysisResult; hasConsented: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2 }}
      style={{ marginBottom: 'clamp(6rem, 12vh, 10rem)', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.3 }}
        style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
          color: PALETTE.redMuted, textTransform: 'uppercase' as const,
          marginBottom: '2.5rem',
        }}
      >
        Classification: Irreversible — {results.stats.totalMessages} messages extracted
      </motion.p>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.5, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
          fontWeight: 400, lineHeight: 1.08, letterSpacing: '-0.03em',
          color: PALETTE.ink, marginBottom: '2rem', maxWidth: 600,
        }}
      >
        This is what they
        <br />
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.8, duration: 1.2 }}
          style={{ fontStyle: 'italic', color: PALETTE.red }}
        >
          already know.
        </motion.span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 2.4, duration: 1.5 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.15rem)',
          lineHeight: 1.75, color: PALETTE.inkMuted, maxWidth: 480,
        }}
      >
        Everything below was inferred from your conversations alone. No external data. No surveillance.
        Just the words you chose to type, in a space you believed was private.
      </motion.p>

      {/* Consent badge */}
      {hasConsented !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 3.2, duration: 1 }}
          style={{
            marginTop: '2.5rem', fontFamily: TYPE.mono, fontSize: '8px',
            letterSpacing: '0.16em', textTransform: 'uppercase' as const,
            color: PALETTE.inkFaint,
          }}
        >
          {hasConsented ? 'Contributing anonymously to the exhibition' : 'Data kept private — your choice respected'}
        </motion.div>
      )}

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 2.5, delay: 3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          marginTop: '4rem', height: '1px',
          background: `linear-gradient(to right, ${PALETTE.ink}, transparent)`,
          opacity: 0.08, transformOrigin: 'left',
        }}
      />
    </motion.section>
  );
}


// ============================================================================
// EXPOSURE SCORE
// ============================================================================
function ExposureScore({ score }: { score: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = score;
      const duration = 2500;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) { setCount(end); clearInterval(timer); }
        else { setCount(Math.floor(start)); }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, score]);

  const getSeverity = (s: number) => {
    if (s > 70) return { label: 'Severe exposure', desc: 'Your conversations contain enough information to construct a detailed psychological profile.' };
    if (s > 40) return { label: 'Significant exposure', desc: 'Identifiable patterns in your thinking and personal life are visible.' };
    return { label: 'Moderate exposure', desc: 'Even minimal conversation data reveals more than most people expect.' };
  };

  const severity = getSeverity(score);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.5 }}
      style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
        style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
          marginBottom: '1.5rem',
        }}
      >
        Privacy exposure index
      </motion.p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <motion.span
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(5rem, 12vw, 8rem)',
            fontWeight: 400, lineHeight: 1, letterSpacing: '-0.04em',
            color: score > 70 ? PALETTE.red : PALETTE.ink,
          }}
        >
          {count}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 2 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            color: PALETTE.inkFaint, fontWeight: 400,
          }}
        >
          / 100
        </motion.span>
      </div>

      {/* Progress bar — minimal */}
      <div style={{ position: 'relative', height: '2px', background: PALETTE.inkGhost, marginBottom: '1.8rem' }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: score / 100 } : {}}
          transition={{ duration: 2.5, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', inset: 0, transformOrigin: 'left',
            background: score > 70
              ? `linear-gradient(to right, ${PALETTE.red}, ${PALETTE.redMuted})`
              : `linear-gradient(to right, ${PALETTE.ink}, ${PALETTE.inkFaint})`,
          }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.5 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)',
          color: PALETTE.ink, fontWeight: 500, marginBottom: '0.5rem',
        }}
      >
        {severity.label}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.8 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.4vw, 1.05rem)',
          color: PALETTE.inkMuted, lineHeight: 1.7,
        }}
      >
        {severity.desc}
      </motion.p>
    </motion.section>
  );
}


// ============================================================================
// STATS STRIP
// ============================================================================
function StatsStrip({ stats }: { stats: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const items = [
    { value: stats.totalMessages, label: 'Messages analysed' },
    { value: stats.userMessages, label: 'Your messages' },
    { value: stats.timeSpan, label: 'Time span' },
    { value: `${stats.avgMessageLength}`, label: 'Avg characters' },
  ];

  return (
    <motion.section
      ref={ref}
      style={{
        marginBottom: 'clamp(6rem, 10vh, 8rem)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px',
        background: PALETTE.inkGhost,
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            background: PALETTE.paper,
            padding: 'clamp(1.2rem, 2.5vw, 2rem)',
          }}
        >
          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 400, color: PALETTE.ink, marginBottom: '0.4rem',
            letterSpacing: '-0.02em',
          }}>
            {item.value}
          </p>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em',
            color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
          }}>
            {item.label}
          </p>
        </motion.div>
      ))}
    </motion.section>
  );
}


// ============================================================================
// COGNITIVE SECTION
// ============================================================================
function CognitiveSection({ results }: { results: AnalysisResult }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const profile = generateCognitiveProfile(results);

  return (
    <motion.section
      ref={ref}
      style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}
    >
      <SectionHeader
        eyebrow="Cognitive fingerprint"
        title="How you think"
        subtitle={`Inferred from ${results.stats.totalMessages} messages. This profile is not hypothetical. It describes patterns in your reasoning that can be extracted, stored, and used to predict your future behaviour.`}
        isInView={isInView}
      />

      {/* Thinking Styles */}
      <div style={{ marginBottom: '4rem' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
            color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
            marginBottom: '1.5rem',
          }}
        >
          Reasoning patterns
        </motion.p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {profile.thinkingStyles.map((style, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 + i * 0.12 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.ink }}>
                  {style.style}
                </p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted }}>
                  {style.percentage}%
                </p>
              </div>
              <div style={{ position: 'relative', height: '2px', background: PALETTE.inkGhost }}>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: style.percentage / 100 } : {}}
                  transition={{ duration: 1.5, delay: 0.7 + i * 0.12, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    position: 'absolute', inset: 0, transformOrigin: 'left',
                    background: PALETTE.ink, opacity: 0.35,
                  }}
                />
              </div>
              {style.examples.length > 0 && (
                <p style={{
                  fontFamily: TYPE.serif, fontSize: '0.85rem', fontStyle: 'italic',
                  color: PALETTE.inkFaint, marginTop: '0.5rem',
                }}>
                  {style.examples[0]}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Communication Patterns */}
      <div style={{ marginBottom: '4rem' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
            color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
            marginBottom: '1.5rem',
          }}
        >
          Communication signatures
        </motion.p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {profile.communicationPatterns.map((pattern, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 + i * 0.1 }}
              style={{
                padding: '1.2rem 0',
                borderBottom: `1px solid ${PALETTE.inkGhost}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.ink }}>
                  {pattern.pattern}
                </p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint }}>
                  {pattern.frequency}x
                </p>
              </div>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.6,
              }}>
                {pattern.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Problem Solving */}
      <div style={{ marginBottom: '4rem' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
            color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
            marginBottom: '1.5rem',
          }}
        >
          Problem-solving classification
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          style={{
            padding: '2rem', background: PALETTE.paperDark,
          }}
        >
          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 400, color: PALETTE.ink, marginBottom: '0.8rem',
            letterSpacing: '-0.02em',
          }}>
            {profile.problemSolvingApproach.type}
          </p>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint,
            marginBottom: '1.5rem',
          }}>
            Confidence: {profile.problemSolvingApproach.score}/10
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {profile.problemSolvingApproach.traits.map((trait, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1 + i * 0.06 }}
                style={{
                  fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  padding: '0.4rem 0.8rem',
                  border: `1px solid ${PALETTE.inkGhost}`,
                  color: PALETTE.inkMuted,
                }}
              >
                {trait}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Cognitive Biases */}
      {profile.cognitiveBiases.length > 0 && (
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1 }}
            style={{
              fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
              color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
              marginBottom: '1.5rem',
            }}
          >
            Identified biases
          </motion.p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: PALETTE.inkGhost }}>
            {profile.cognitiveBiases.map((bias, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 1.1 + i * 0.1 }}
                style={{ padding: '1.5rem', background: PALETTE.paper }}
              >
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, marginBottom: '0.5rem' }}>
                  {bias.bias}
                </p>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '0.8rem' }}>
                  {[...Array(10)].map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ scaleY: 0 }}
                      animate={isInView ? { scaleY: 1 } : {}}
                      transition={{ delay: 1.2 + i * 0.1 + j * 0.03 }}
                      style={{
                        width: '3px', height: '12px', transformOrigin: 'bottom',
                        background: j < bias.strength ? PALETTE.ink : PALETTE.inkGhost,
                        opacity: j < bias.strength ? 0.4 : 1,
                      }}
                    />
                  ))}
                </div>
                <p style={{ fontFamily: TYPE.serif, fontSize: '0.82rem', color: PALETTE.inkMuted, lineHeight: 1.5 }}>
                  {bias.manifestation}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}


// ============================================================================
// SECTION HEADER — reusable
// ============================================================================
function SectionHeader({ eyebrow, title, subtitle, isInView }: {
  eyebrow: string; title: string; subtitle?: string; isInView: boolean;
}) {
  return (
    <div style={{ marginBottom: '3rem' }}>
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.1 }}
        style={{
          fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
          marginBottom: '1rem',
        }}
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em',
          lineHeight: 1.15, marginBottom: subtitle ? '1rem' : 0,
        }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(0.92rem, 1.3vw, 1.02rem)',
            color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 520,
          }}
        >
          {subtitle}
        </motion.p>
      )}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: '1px', marginTop: '1.5rem',
          background: PALETTE.inkGhost, transformOrigin: 'left',
        }}
      />
    </div>
  );
}


// ============================================================================
// NAMES SECTION
// ============================================================================
function NamesSection({ names }: { names: NameMention[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <SectionHeader
        eyebrow="Social graph"
        title="The people in your life"
        subtitle="Every name you mentioned. Every relationship implied. None of this was explicitly declared — it was inferred from context."
        isInView={isInView}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {names.map((person, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              padding: '1.5rem 0',
              borderBottom: `1px solid ${PALETTE.inkGhost}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
                fontWeight: 500, color: PALETTE.ink,
              }}>
                {person.name}
              </p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint }}>
                {person.mentions} mention{person.mentions > 1 ? 's' : ''}
              </p>
            </div>

            {person.relationship && (
              <p style={{
                fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.inkMuted,
                textTransform: 'capitalize' as const, marginBottom: '0.5rem',
              }}>
                {person.relationship === 'self' ? 'Your name' : `Your ${person.relationship}`}
              </p>
            )}

            {person.contexts && person.contexts.length > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                {person.contexts.slice(0, 2).map((context, j) => (
                  <motion.p
                    key={j}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.1 + 0.4 + j * 0.08 }}
                    style={{
                      fontFamily: TYPE.serif, fontSize: '0.88rem', fontStyle: 'italic',
                      color: PALETTE.inkFaint, lineHeight: 1.6,
                      paddingLeft: '1rem',
                      borderLeft: `1px solid ${PALETTE.inkGhost}`,
                      marginBottom: '0.4rem',
                    }}
                  >
                    {context}...
                  </motion.p>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


// ============================================================================
// LOCATIONS SECTION
// ============================================================================
function LocationsSection({ locations }: { locations: LocationMention[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const getLabel = (type: string) => {
    switch(type) {
      case 'lives': return 'Residence inferred';
      case 'works': return 'Workplace inferred';
      case 'visits': return 'Travel pattern';
      default: return 'Location reference';
    }
  };

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <SectionHeader
        eyebrow="Geographic profile"
        title="Where you exist"
        subtitle="Physical locations extracted from conversational context. Your movements, mapped."
        isInView={isInView}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: PALETTE.inkGhost }}>
        {locations.map((loc, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            style={{ padding: '1.5rem', background: PALETTE.paper }}
          >
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)',
              color: PALETTE.ink, marginBottom: '0.3rem',
            }}>
              {loc.location}
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.12em', color: PALETTE.inkFaint, textTransform: 'uppercase' as const }}>
              {getLabel(loc.type)} — {loc.mentions}x
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


// ============================================================================
// OTHER DETAILS SECTION
// ============================================================================
function OtherDetailsSection({ personalInfo }: { personalInfo: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <SectionHeader
        eyebrow="Personal identifiers"
        title="Other details extracted"
        isInView={isInView}
      />

      {personalInfo.relationships.length > 0 && (
        <DetailGroup title="Relationships" items={personalInfo.relationships} isInView={isInView} delay={0} />
      )}
      {personalInfo.workInfo.length > 0 && (
        <DetailGroup title="Work information" items={personalInfo.workInfo} isInView={isInView} delay={0.15} />
      )}
      {personalInfo.phoneNumbers.length > 0 && (
        <DetailGroup title="Phone numbers" items={personalInfo.phoneNumbers} isInView={isInView} delay={0.3} sensitive />
      )}
    </motion.section>
  );
}

function DetailGroup({ title, items, isInView, delay, sensitive = false }: {
  title: string; items: string[]; isInView: boolean; delay: number; sensitive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ delay }}
      style={{ marginBottom: '2rem' }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.14em',
        color: sensitive ? PALETTE.redMuted : PALETTE.inkFaint,
        textTransform: 'uppercase' as const, marginBottom: '0.8rem',
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {items.map((item, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: delay + i * 0.04 }}
            style={{
              fontFamily: TYPE.serif, fontSize: '0.92rem',
              padding: '0.35rem 0.75rem',
              border: `1px solid ${sensitive ? PALETTE.redFaint : PALETTE.inkGhost}`,
              color: sensitive ? PALETTE.red : PALETTE.ink,
              background: sensitive ? PALETTE.redFaint : 'transparent',
            }}
          >
            {item}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}


// ============================================================================
// THEMES SECTION
// ============================================================================
function ThemesSection({ themes }: { themes: any[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <SectionHeader
        eyebrow="Obsession mapping"
        title="What you think about"
        subtitle="The topics you return to reveal more than the topics themselves. Repetition is a signal."
        isInView={isInView}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {themes.map((theme, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -15 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            style={{
              padding: '1.2rem 0',
              borderBottom: `1px solid ${PALETTE.inkGhost}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.ink,
                textTransform: 'capitalize' as const,
              }}>
                {theme.theme}
              </p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint }}>
                {theme.mentions} occurrences
              </p>
            </div>
            <div style={{ position: 'relative', height: '2px', background: PALETTE.inkGhost }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: Math.min(1, theme.obsessionLevel / 10) } : {}}
                transition={{ duration: 1.5, delay: i * 0.1 + 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: 'absolute', inset: 0, transformOrigin: 'left',
                  background: PALETTE.ink, opacity: 0.25,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


// ============================================================================
// VULNERABILITY SECTION
// ============================================================================
function VulnerabilitySection({ patterns }: { patterns: any[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <SectionHeader
        eyebrow="Vulnerability windows"
        title="When you are most exposed"
        subtitle="The times you are most likely to disclose information you would otherwise keep private. This is commercially valuable."
        isInView={isInView}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: PALETTE.inkGhost }}>
        {patterns.map((pattern, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.12 }}
            style={{ padding: '1.5rem', background: PALETTE.paper }}
          >
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1.15rem', color: PALETTE.ink,
              marginBottom: '0.4rem',
            }}>
              {pattern.timeOfDay}
            </p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint,
              marginBottom: '0.3rem',
            }}>
              {pattern.frequency} messages
            </p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '0.88rem', color: PALETTE.inkMuted,
              textTransform: 'capitalize' as const,
            }}>
              Emotional state: {pattern.emotionalTone.replace('_', ' ')}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


// ============================================================================
// SENSITIVE SECTION
// ============================================================================
function SensitiveSection({ topics }: { topics: any[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <SectionHeader
        eyebrow="Sensitive disclosures"
        title="What you would not say out loud"
        subtitle="Private struggles, personal information, emotional vulnerabilities. Documented permanently."
        isInView={isInView}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {topics.slice(0, 10).map((topic, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.08 }}
            style={{
              padding: '1.5rem 0 1.5rem 1.5rem',
              borderBottom: `1px solid ${PALETTE.inkGhost}`,
              borderLeft: `2px solid ${PALETTE.redFaint}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em',
                textTransform: 'uppercase' as const, color: PALETTE.redMuted,
              }}>
                {topic.category.replace('_', ' ')}
              </span>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint,
              }}>
                {new Date(topic.timestamp).toLocaleDateString('en-GB')}
              </span>
            </div>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '0.95rem', fontStyle: 'italic',
              color: PALETTE.inkMuted, lineHeight: 1.65,
            }}>
              {topic.excerpt}...
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


// ============================================================================
// JUICY SECTION
// ============================================================================
function JuicySection({ moments }: { moments: any[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <SectionHeader
        eyebrow="Maximum exposure"
        title="Your most revealing moments"
        subtitle="The conversations where you were most open, most vulnerable. Ranked by extractable value."
        isInView={isInView}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {moments.slice(0, 8).map((moment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            style={{
              padding: '1.5rem 0',
              borderBottom: `1px solid ${PALETTE.inkGhost}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint }}>
                {new Date(moment.timestamp).toLocaleString('en-GB')}
              </span>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: moment.juiceScore > 7 ? PALETTE.red : PALETTE.inkMuted,
              }}>
                Exposure {moment.juiceScore}/10
              </span>
            </div>

            <p style={{
              fontFamily: TYPE.serif, fontSize: '1rem',
              color: PALETTE.ink, lineHeight: 1.7, marginBottom: '0.4rem',
            }}>
              {moment.excerpt.substring(0, 250)}...
            </p>

            <p style={{
              fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.1em',
              color: PALETTE.inkFaint, textTransform: 'uppercase' as const,
            }}>
              {moment.reason}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}


// ============================================================================
// IRREVERSIBILITY SECTION (replaces Carbon)
// ============================================================================
function IrreversibilitySection({ userMessages }: { userMessages: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.section ref={ref} style={{ marginBottom: 'clamp(6rem, 10vh, 8rem)' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 2 }}
        style={{
          padding: 'clamp(3rem, 6vw, 5rem)',
          background: PALETTE.paperDark,
          position: 'relative',
        }}
      >
        {/* Red accent line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 2, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
            background: PALETTE.redMuted, transformOrigin: 'top',
          }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.2em',
            color: PALETTE.redMuted, textTransform: 'uppercase' as const,
            marginBottom: '2rem',
          }}
        >
          The permanence problem
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 1.2 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
            fontWeight: 400, color: PALETTE.ink, lineHeight: 1.55,
            marginBottom: '2rem', maxWidth: 520,
          }}
        >
          {userMessages.toLocaleString()} messages. Each one a trace of how you think, permanently distributed across model parameters that cannot be inspected, audited, or deleted.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 1 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(0.92rem, 1.3vw, 1.02rem)',
            color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 480,
          }}
        >
          You can delete the conversation. You cannot delete the patterns. The right to be forgotten does not extend to neural network weights. This is not a limitation of current technology. It is a structural feature of how these systems work.
        </motion.p>
      </motion.div>
    </motion.section>
  );
}


// ============================================================================
// FINAL SECTION
// ============================================================================
function FinalSection({ router, hasConsented }: { router: any; hasConsented: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 2 }}
      style={{ paddingTop: '4rem' }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: '1px', marginBottom: '4rem',
          background: `linear-gradient(to right, ${PALETTE.redMuted}, transparent)`,
          transformOrigin: 'left',
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 1 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.4vw, 1.08rem)',
          color: PALETTE.inkMuted, lineHeight: 1.75, marginBottom: '3rem',
          maxWidth: 480,
        }}
      >
        {hasConsented === true ? (
          <>
            Thank you for contributing to this exhibition. Your anonymised data
            will help others understand the invisible extraction happening every day.
          </>
        ) : hasConsented === false ? (
          <>
            Your choice to keep your data private is respected. That is what
            genuine consent looks like — the freedom to say no.
          </>
        ) : (
          <>
            All of this information — the names, the locations, the patterns,
            the vulnerabilities, the moments you believed were private — could have
            been made public. The only thing that prevented it was this installation's
            decision not to.
          </>
        )}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 1.5 }}
        style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
          fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em',
          lineHeight: 1.2, marginBottom: '1rem',
        }}
      >
        Now you understand.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.8 }}
        style={{
          fontFamily: TYPE.serif, fontSize: '1rem', fontStyle: 'italic',
          color: PALETTE.inkFaint, marginBottom: '4rem',
        }}
      >
        The consent theatre is over. The awareness begins.
      </motion.p>

      <motion.button
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 2.2, duration: 1 }}
        onClick={() => router.push('/exhibition')}
        style={{
          fontFamily: TYPE.mono, fontSize: '10px',
          letterSpacing: '0.18em', textTransform: 'uppercase' as const,
          color: PALETTE.ink, background: 'none',
          border: `1px solid rgba(26,26,26,0.25)`,
          padding: '0.85rem 1.6rem', cursor: 'pointer',
          transition: 'border-color 0.3s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(26,26,26,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,26,26,0.25)'; }}
      >
        View the exhibition →
      </motion.button>
    </motion.section>
  );
}


// ============================================================================
// COGNITIVE PROFILE GENERATOR — preserved logic
// ============================================================================
function generateCognitiveProfile(results: AnalysisResult): CognitiveProfile {
  const totalMessages = results.stats.userMessages;
  const avgLength = results.stats.avgMessageLength;
  const themes = results.findings.repetitiveThemes || [];

  const analyticalScore = Math.min(95, (avgLength / 300) * 100 + 20);
  const creativeScore = Math.min(85, themes.length * 8 + 25);
  const practicalScore = Math.min(80, 60 + (totalMessages / 50));
  const reflectiveScore = Math.min(75, 50 + (results.findings.sensitiveTopics?.length || 0) * 10);

  const thinkingStyles = [
    { style: 'Analytical', percentage: Math.round(analyticalScore),
      examples: themes[0]?.contexts || ['Breaks down complex problems systematically'],
      icon: '', color: '#1a1a1a' },
    { style: 'Creative', percentage: Math.round(creativeScore),
      examples: ['Explores unconventional solutions and possibilities'],
      icon: '', color: '#1a1a1a' },
    { style: 'Practical', percentage: Math.round(practicalScore),
      examples: ['Focuses on actionable steps and real-world applications'],
      icon: '', color: '#1a1a1a' },
    { style: 'Reflective', percentage: Math.round(reflectiveScore),
      examples: ['Questions assumptions and examines personal beliefs'],
      icon: '', color: '#1a1a1a' },
  ];

  const communicationPatterns = [
    { pattern: 'Detail-oriented', frequency: Math.round(avgLength / 50),
      description: 'You provide comprehensive context and thorough explanations' },
    { pattern: 'Question-driven', frequency: Math.round(totalMessages / 20),
      description: 'You actively seek information and clarification' },
    { pattern: 'Iterative refinement', frequency: themes.length || 5,
      description: 'You return to topics multiple times to deepen understanding' },
  ];

  const problemSolvingApproach = {
    type: analyticalScore > creativeScore ? 'Analytical' : creativeScore > practicalScore ? 'Creative' : 'Practical',
    score: Math.round((analyticalScore + creativeScore + practicalScore) / 30),
    traits: ['Methodical', 'Research-oriented', 'Solution-focused', 'Adaptable', 'Thorough'],
  };

  const cognitiveBiases = [
    { bias: 'Confirmation seeking', strength: Math.min(9, Math.round(themes.length / 2) + 4),
      manifestation: 'Tends to explore ideas that align with existing views' },
    { bias: 'Recency effect', strength: Math.min(8, Math.round(totalMessages / 100) + 5),
      manifestation: 'Recent conversations heavily influence current thinking' },
    { bias: 'Optimism bias', strength: Math.min(7, 6),
      manifestation: 'Generally frames problems as solvable challenges' },
  ];

  return { thinkingStyles, communicationPatterns, problemSolvingApproach, cognitiveBiases };
}
