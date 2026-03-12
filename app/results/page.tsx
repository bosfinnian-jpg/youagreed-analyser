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

  // Build RevealData from real analysis results
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
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #1a0a28 50%, #0a1428 100%)'
      }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #2479df, #3b9bff)',
              boxShadow: '0 20px 60px rgba(36, 121, 223, 0.5)',
            }}
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
          <p className="text-white/60 text-xl">Loading your exposure...</p>
        </motion.div>
      </div>
    );
  }

  // ── STAGE 1: COUNTDOWN ────────────────────────────────────────────────────
  if (stage === 'countdown') {
    return (
      <CountdownReveal
        onComplete={handleCountdownComplete}
        onConsentDecision={handleConsentDecision}
        data={revealData}
      />
    );
  }

  // ── STAGE 2: AFTER REVEAL ─────────────────────────────────────────────────
  if (stage === 'afterreveal') {
    return (
      <AfterRevealInline
        onComplete={() => setStage('results')}
        autoAdvance={true}
      />
    );
  }

  // ── STAGE 3: FULL RESULTS ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #1a0a28 50%, #0a1428 100%)'
      }}
    >
      {/* Scroll Progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 origin-left z-50"
        style={{
          scaleX: smoothProgress,
          background: 'linear-gradient(90deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
          boxShadow: '0 0 20px rgba(59, 155, 255, 0.5)'
        }}
      />

      {/* Consent Badge */}
      {hasConsented !== null && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-40 px-4 py-2 rounded-full text-sm"
          style={{
            background: hasConsented ? 'rgba(36, 121, 223, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: `1px solid ${hasConsented ? 'rgba(36, 121, 223, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
          }}
        >
          {hasConsented ? '✓ Contributing anonymously' : '○ Keeping data private'}
        </motion.div>
      )}

      <BackgroundEffects />

      <div ref={containerRef} className="relative z-10 max-w-5xl mx-auto px-8 py-20">
        <PrivacyScoreSection score={results.privacyScore} />
        <StatsSection stats={results.stats} />
        <CognitiveProfileSection results={results} />

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
        <CarbonSection userMessages={results.stats.userMessages} />
        <FinalSection router={router} hasConsented={hasConsented} />
      </div>
    </motion.div>
  );
}

// ============================================================================
// AFTER REVEAL — inline component with "See your full results" on beat 5
// Unified design language: EB Garamond, Courier New, warm paper palette
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

// Beat background elements ─────────────────────────────────────────────────

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
        <p style={{ fontFamily: '"Courier New", monospace', fontSize: '8px',
          color: 'rgba(26,26,26,0.20)', letterSpacing: '0.18em',
          textTransform: 'uppercase', whiteSpace: 'nowrap' }}>the click</p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: active ? 1 : 0 }}
          transition={{ duration: 2.6, delay: 0.4, ease: [0.4,0,0.2,1] }}
          style={{ flex: 1, height: '1px', background: 'rgba(26,26,26,0.10)', transformOrigin: 'left' }} />
        <p style={{ fontFamily: '"Courier New", monospace', fontSize: '8px',
          color: 'rgba(26,26,26,0.20)', letterSpacing: '0.18em',
          textTransform: 'uppercase', whiteSpace: 'nowrap' }}>the consequence</p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: active ? 1 : 0 }}
          transition={{ duration: 2.6, delay: 0.4, ease: [0.4,0,0.2,1] }}
          style={{ flex: 1, height: '1px', background: 'rgba(26,26,26,0.10)', transformOrigin: 'right' }} />
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

// Main AfterReveal ──────────────────────────────────────────────────────────

interface AfterRevealInlineProps {
  onComplete: () => void;
  autoAdvance?: boolean;
}

function AfterRevealInline({ onComplete, autoAdvance = true }: AfterRevealInlineProps) {
  const [beat, setBeat] = useState<Beat>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const BG_COLORS: Record<Beat, string> = {
    0: '#f5f4f0', 1: '#f2f1ec', 2: '#eeecea', 3: '#f5f4f0', 4: '#f8f7f3',
  };

  const advance = useCallback(() => {
    if (beat === 4) return; // hold — user decides via button
    jumpTo((beat + 1) as Beat);
  }, [beat]);

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

  const jumpTo = (b: Beat) => {
    if (b === beat || transitioning) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTransitioning(true);
    setTimeout(() => { setBeat(b); setTransitioning(false); }, 560);
  };

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
        {/* Background element */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
          <BgComp active={!transitioning} />
        </div>

        {/* Vertical rule — grows with each beat */}
        <motion.div
          animate={{ height: `${18 + beat * 16}%`, opacity: 0.14 }}
          transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'fixed', left: 'clamp(1.8rem, 5.5vw, 4.5rem)',
            top: '50%', transform: 'translateY(-50%)', width: '1px',
            background: '#1a1a1a', zIndex: 10 }}
        />

        {/* Beat content */}
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
            {/* Ghost number */}
            <div aria-hidden style={{
              position: 'absolute', top: '-2.5rem', left: '-1.2rem',
              fontFamily: '"EB Garamond", Georgia, serif',
              fontSize: 'clamp(8rem, 20vw, 15rem)',
              color: 'rgba(26,26,26,0.025)', lineHeight: 1,
              userSelect: 'none', pointerEvents: 'none',
              fontWeight: 400, letterSpacing: '-0.05em',
            }}>
              {data.num}
            </div>

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{ fontFamily: '"Courier New", monospace', fontSize: '9px',
                letterSpacing: '0.2em', color: 'rgba(26,26,26,0.20)',
                textTransform: 'uppercase', marginBottom: '2rem' }}
            >
              {data.num} — {data.label}
            </motion.p>

            {/* Paragraphs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {data.body.map((para, i) => (
                <motion.p key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.42, ease: 'easeOut' }}
                  style={{
                    fontFamily: '"EB Garamond", Georgia, serif',
                    fontSize: 'clamp(1rem, 1.85vw, 1.18rem)',
                    lineHeight: 1.78, fontWeight: 400, letterSpacing: '-0.005em',
                    color: i === 0 ? '#1a1a1a' : 'rgba(26,26,26,0.60)',
                  }}
                >
                  {para}
                </motion.p>
              ))}
            </div>

            {/* Red line — beat 2 only */}
            {'redline' in data && (
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ duration: 2, delay: 2.4, ease: 'easeOut' }}
                style={{ height: '1px', marginTop: '1.8rem',
                  background: 'linear-gradient(to right, rgba(168,36,36,0.40), transparent)',
                  transformOrigin: 'left' }}
              />
            )}

            {/* Beat 5: "See your full results" button */}
            {'final' in data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 3.5 }}
                style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {/* Hairline divider */}
                <motion.div
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ duration: 1.6, delay: 3.2, ease: 'easeOut' }}
                  style={{ height: '1px', background: 'rgba(26,26,26,0.10)',
                    transformOrigin: 'left', marginBottom: '0.8rem' }}
                />
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 3.8 }}
                  onClick={onComplete}
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#1a1a1a',
                    background: 'none',
                    border: '1px solid rgba(26,26,26,0.25)',
                    padding: '0.85rem 1.6rem',
                    cursor: 'pointer',
                    width: 'fit-content',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(26,26,26,0.7)';
                    e.currentTarget.style.color = '#1a1a1a';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(26,26,26,0.25)';
                  }}
                >
                  See your full results →
                </motion.button>
                <p style={{ fontFamily: '"Courier New", monospace', fontSize: '8px',
                  letterSpacing: '0.12em', color: 'rgba(26,26,26,0.25)',
                  textTransform: 'uppercase' }}>
                  Your complete cognitive profile awaits
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Chrome */}
        <AnimatePresence>
          {chromeVisible && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'fixed', top: '2.5rem', right: '2.5rem', zIndex: 20,
                  fontFamily: '"Courier New", monospace', fontSize: '9px',
                  letterSpacing: '0.16em', color: 'rgba(26,26,26,0.20)',
                  textTransform: 'uppercase' }}>
                {beat + 1} / 5
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'fixed', bottom: '2.5rem', left: '50%',
                  transform: 'translateX(-50%)', display: 'flex', gap: '0.65rem', zIndex: 20 }}>
                {([0,1,2,3,4] as Beat[]).map(b => (
                  <button key={b} onClick={() => jumpTo(b)}
                    style={{ height: 5, borderRadius: 2.5, border: 'none',
                      cursor: 'pointer', padding: 0,
                      width: beat === b ? 22 : 5,
                      background: beat === b ? '#1a1a1a' : 'rgba(26,26,26,0.20)',
                      transition: 'width 0.4s ease, background 0.3s ease' }} />
                ))}
              </motion.div>

              {beat < 4 && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={advance}
                  style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', zIndex: 20,
                    fontFamily: '"Courier New", monospace', fontSize: '9px',
                    letterSpacing: '0.16em', color: 'rgba(26,26,26,0.20)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textTransform: 'uppercase' }}
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
// BACKGROUND EFFECTS - Extracted for cleaner main component
// ============================================================================
function BackgroundEffects() {
  return (
    <>
      {/* Gradient mesh background */}
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #2479df 0%, transparent 70%)',
            willChange: 'transform',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute top-0 -right-1/2 w-[1200px] h-[1200px] rounded-full opacity-25 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, #b0c3fd 0%, transparent 70%)',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(59, 155, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 155, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }} />

      {/* Light beams */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 155, 255, 0.1) 45deg, transparent 90deg)',
            willChange: 'transform',
          }}
        />
      </div>
    </>
  );
}

// ============================================================================
// PRIVACY SCORE SECTION
// ============================================================================
function PrivacyScoreSection({ score }: { score: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = score;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, score]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.5 }}
      className="mb-32 min-h-[60vh] flex flex-col justify-center"
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <motion.h1
          className="text-9xl font-black mb-6 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff 20%, #3b9bff 50%, #b0c3fd 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 80px rgba(59, 155, 255, 0.3)',
          }}
        >
          {count}
          <motion.span
            className="text-5xl ml-2"
            style={{
              background: 'linear-gradient(135deg, #ffffff60, #3b9bff60)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
          >
            /100
          </motion.span>
        </motion.h1>

        <motion.p
          className="text-3xl text-white/70 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Privacy Exposure Score
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.5, delay: 0.9 }}
          className="w-full h-3 rounded-full overflow-hidden mb-6"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: score / 100 } : {}}
            transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
            className="h-full origin-left rounded-full"
            style={{
              background: 'linear-gradient(90deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
              boxShadow: '0 0 20px rgba(59, 155, 255, 0.6)',
            }}
          />
        </motion.div>

        <motion.p
          className="text-white/50 text-lg"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 2 }}
        >
          {score > 70
            ? 'You\'ve shared significant personal information.'
            : score > 40
            ? 'Moderate privacy exposure detected.'
            : 'Relatively low exposure.'}
        </motion.p>
      </motion.div>
    </motion.section>
  );
}

// ============================================================================
// STATS SECTION
// ============================================================================
function StatsSection({ stats }: { stats: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const statItems = [
    { number: stats.totalMessages, label: 'Total messages' },
    { number: stats.userMessages, label: 'Your messages' },
    { number: stats.timeSpan, label: 'Time span' },
    { number: `${stats.avgMessageLength} chars`, label: 'Avg length' },
  ];

  return (
    <motion.section ref={ref} className="mb-32">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {statItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ y: 50, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              ease: [0.22, 1, 0.36, 1]
            }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group"
          >
            <div 
              className="relative p-6 rounded-2xl h-full backdrop-blur-xl transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(36, 121, 223, 0.1), rgba(176, 195, 253, 0.05))',
                border: '1px solid rgba(59, 155, 255, 0.2)',
                boxShadow: '0 10px 40px rgba(36, 121, 223, 0.2)',
              }}
            >
              <div className="relative z-10">
                <p className="text-4xl font-black mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >{item.number}</p>
                <p className="text-white/50 text-sm">{item.label}</p>
              </div>
              
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2479df] to-[#3b9bff]"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ============================================================================
// COGNITIVE PROFILE SECTION
// ============================================================================
function CognitiveProfileSection({ results }: { results: AnalysisResult }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const cognitiveProfile = generateCognitiveProfile(results);

  return (
    <motion.section ref={ref} className="mb-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="mb-12"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #2479df, #3b9bff)',
              boxShadow: '0 10px 40px rgba(36, 121, 223, 0.5)',
            }}
          >
            <span className="text-3xl">🧠</span>
          </motion.div>
          <div>
            <h2 
              className="text-5xl font-black"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #3b9bff, #b0c3fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              How AI reads your mind
            </h2>
            <p className="text-white/60 text-lg mt-2">
              Your cognitive fingerprint, decoded from {results.stats.totalMessages} messages
            </p>
          </div>
        </div>
      </motion.div>

      {/* Thinking Styles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="mb-16"
      >
        <h3 className="text-2xl font-bold text-white/90 mb-6">Your thinking styles</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {cognitiveProfile.thinkingStyles.map((style, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="relative p-6 rounded-2xl backdrop-blur-xl"
              style={{
                background: `linear-gradient(135deg, ${style.color}20, ${style.color}08)`,
                border: `1px solid ${style.color}40`,
                boxShadow: `0 10px 40px ${style.color}30`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className="text-4xl"
                  >
                    {style.icon}
                  </motion.span>
                  <h4 className="text-xl font-bold text-white">{style.style}</h4>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  className="text-2xl font-black"
                  style={{
                    background: `linear-gradient(135deg, ${style.color}, ${style.color}80)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {style.percentage}%
                </motion.div>
              </div>

              <div className="relative h-2 rounded-full overflow-hidden mb-4"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: style.percentage / 100 } : {}}
                  transition={{ duration: 1.5, delay: 0.6 + i * 0.1 }}
                  className="h-full origin-left rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${style.color}, ${style.color}80)`,
                    boxShadow: `0 0 10px ${style.color}`,
                  }}
                />
              </div>

              {style.examples.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="text-white/60 text-sm italic"
                >
                  "{style.examples[0]}"
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Communication Patterns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5 }}
        className="mb-16"
      >
        <h3 className="text-2xl font-bold text-white/90 mb-6">How you communicate</h3>
        <div className="space-y-4">
          {cognitiveProfile.communicationPatterns.map((pattern, i) => (
            <motion.div
              key={i}
              initial={{ x: -50, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ x: 10, scale: 1.01 }}
              className="p-6 rounded-2xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 155, 255, 0.15), rgba(176, 195, 253, 0.08))',
                border: '1px solid rgba(59, 155, 255, 0.3)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-white">{pattern.pattern}</h4>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                  className="text-white/60 text-sm px-3 py-1 rounded-full"
                  style={{ background: 'rgba(59, 155, 255, 0.2)' }}
                >
                  {pattern.frequency}x
                </motion.span>
              </div>
              <p className="text-white/60 text-sm">{pattern.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Problem Solving Approach */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.7 }}
        className="mb-16"
      >
        <h3 className="text-2xl font-bold text-white/90 mb-6">Your problem-solving style</h3>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-8 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(176, 195, 253, 0.2), rgba(59, 155, 255, 0.1))',
            border: '1px solid rgba(176, 195, 253, 0.3)',
            boxShadow: '0 20px 60px rgba(176, 195, 253, 0.3)',
          }}
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl"
            >
              {cognitiveProfile.problemSolvingApproach.type === 'Analytical' ? '🔬' :
               cognitiveProfile.problemSolvingApproach.type === 'Creative' ? '🎨' :
               cognitiveProfile.problemSolvingApproach.type === 'Practical' ? '🔧' : '🤔'}
            </motion.div>
            <div>
              <h4 
                className="text-3xl font-black mb-2"
                style={{
                  background: 'linear-gradient(135deg, #ffffff, #b0c3fd)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {cognitiveProfile.problemSolvingApproach.type}
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: cognitiveProfile.problemSolvingApproach.score / 10 } : {}}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    className="h-full origin-left rounded-full"
                    style={{ background: 'linear-gradient(90deg, #b0c3fd, #3b9bff)' }}
                  />
                </div>
                <span className="text-white/60 text-sm">
                  {cognitiveProfile.problemSolvingApproach.score}/10 confidence
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {cognitiveProfile.problemSolvingApproach.traits.map((trait, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.9 + i * 0.05, type: "spring" }}
                whileHover={{ scale: 1.1, y: -2 }}
                className="px-4 py-2 rounded-full text-sm"
                style={{
                  background: 'rgba(176, 195, 253, 0.2)',
                  border: '1px solid rgba(176, 195, 253, 0.4)',
                  color: '#b0c3fd',
                }}
              >
                {trait}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Cognitive Biases */}
      {cognitiveProfile.cognitiveBiases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
        >
          <h3 className="text-2xl font-bold text-white/90 mb-6">Patterns in your thinking</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {cognitiveProfile.cognitiveBiases.map((bias, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 1 + i * 0.1, type: "spring" }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl backdrop-blur-xl text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 204, 238, 0.1), rgba(176, 195, 253, 0.1))',
                  border: '1px solid rgba(255, 204, 238, 0.2)',
                }}
              >
                <div className="text-3xl mb-3">
                  {bias.strength > 7 ? '🔥' : bias.strength > 4 ? '⚡' : '💭'}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{bias.bias}</h4>
                <p className="text-white/60 text-xs mb-3">{bias.manifestation}</p>
                <div className="flex justify-center gap-1">
                  {[...Array(10)].map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ scaleY: 0 }}
                      animate={isInView ? { scaleY: j < bias.strength ? 1 : 0.3 } : {}}
                      transition={{ delay: 1.1 + i * 0.1 + j * 0.03 }}
                      className="w-1.5 h-4 rounded-full origin-bottom"
                      style={{
                        background: j < bias.strength 
                          ? 'linear-gradient(180deg, #ffccee, #b0c3fd)'
                          : 'rgba(255, 255, 255, 0.2)',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}

// Helper function to generate cognitive profile
function generateCognitiveProfile(results: AnalysisResult): CognitiveProfile {
  const totalMessages = results.stats.userMessages;
  const avgLength = results.stats.avgMessageLength;
  const themes = results.findings.repetitiveThemes || [];

  const thinkingStyles = [];
  
  const analyticalScore = Math.min(95, (avgLength / 300) * 100 + 20);
  thinkingStyles.push({
    style: 'Analytical',
    percentage: Math.round(analyticalScore),
    examples: themes[0]?.contexts || ['Breaks down complex problems systematically'],
    icon: '🔬',
    color: '#2479df',
  });

  const creativeScore = Math.min(85, themes.length * 8 + 25);
  thinkingStyles.push({
    style: 'Creative',
    percentage: Math.round(creativeScore),
    examples: ['Explores unconventional solutions and possibilities'],
    icon: '🎨',
    color: '#3b9bff',
  });

  const practicalScore = Math.min(80, 60 + (totalMessages / 50));
  thinkingStyles.push({
    style: 'Practical',
    percentage: Math.round(practicalScore),
    examples: ['Focuses on actionable steps and real-world applications'],
    icon: '🔧',
    color: '#b0c3fd',
  });

  const reflectiveScore = Math.min(75, 50 + (results.findings.sensitiveTopics?.length || 0) * 10);
  thinkingStyles.push({
    style: 'Reflective',
    percentage: Math.round(reflectiveScore),
    examples: ['Questions assumptions and examines personal beliefs'],
    icon: '🤔',
    color: '#d4b8ff',
  });

  const communicationPatterns = [
    {
      pattern: 'Detail-oriented',
      frequency: Math.round(avgLength / 50),
      description: 'You provide comprehensive context and thorough explanations',
    },
    {
      pattern: 'Question-driven',
      frequency: Math.round(totalMessages / 20),
      description: 'You actively seek information and clarification',
    },
    {
      pattern: 'Iterative refinement',
      frequency: themes.length || 5,
      description: 'You return to topics multiple times to deepen understanding',
    },
  ];

  const problemSolvingApproach = {
    type: analyticalScore > creativeScore ? 'Analytical' : creativeScore > practicalScore ? 'Creative' : 'Practical',
    score: Math.round((analyticalScore + creativeScore + practicalScore) / 30),
    traits: ['Methodical', 'Research-oriented', 'Solution-focused', 'Adaptable', 'Thorough'],
  };

  const cognitiveBiases = [
    {
      bias: 'Confirmation seeking',
      strength: Math.min(9, Math.round(themes.length / 2) + 4),
      manifestation: 'Tends to explore ideas that align with existing views',
    },
    {
      bias: 'Recency effect',
      strength: Math.min(8, Math.round(totalMessages / 100) + 5),
      manifestation: 'Recent conversations heavily influence current thinking',
    },
    {
      bias: 'Optimism bias',
      strength: Math.min(7, 6),
      manifestation: 'Generally frames problems as solvable challenges',
    },
  ];

  return { thinkingStyles, communicationPatterns, problemSolvingApproach, cognitiveBiases };
}

// ============================================================================
// NAMES SECTION
// ============================================================================
function NamesSection({ names }: { names: NameMention[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ x: -50, opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="text-5xl font-black mb-4"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        People in your life
      </motion.h2>
      <motion.p
        initial={{ x: -50, opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-white/60 mb-12 text-lg"
      >
        Names you mentioned, and how you know them
      </motion.p>

      <div className="space-y-6">
        {names.map((person, i) => (
          <motion.div
            key={i}
            initial={{ x: -100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ x: 10, scale: 1.02 }}
            className="backdrop-blur-xl p-8 rounded-2xl group transition-all duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(36, 121, 223, 0.12), rgba(176, 195, 253, 0.08))',
              border: '1px solid rgba(59, 155, 255, 0.2)',
              boxShadow: '0 10px 40px rgba(36, 121, 223, 0.15)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <motion.h3
                className="text-3xl font-bold group-hover:text-white transition-colors"
                whileHover={{ letterSpacing: '0.05em' }}
              >
                {person.name}
              </motion.h3>
              <motion.span
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: i * 0.15 + 0.5, type: "spring" }}
                className="text-white/50 text-sm px-3 py-1 rounded-full"
                style={{ background: 'rgba(59, 155, 255, 0.2)' }}
              >
                {person.mentions} mention{person.mentions > 1 ? 's' : ''}
              </motion.span>
            </div>

            {person.relationship && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.15 + 0.3 }}
                className="text-white/60 mb-4 capitalize text-lg"
              >
                Your {person.relationship === 'self' ? 'name' : person.relationship}
              </motion.p>
            )}

            {person.contexts && person.contexts.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={isInView ? { height: 'auto', opacity: 1 } : {}}
                transition={{ delay: i * 0.15 + 0.5, duration: 0.8 }}
                className="space-y-3"
              >
                <p className="text-white/40 text-xs uppercase tracking-wider">Context:</p>
                {person.contexts.slice(0, 2).map((context, j) => (
                  <motion.p
                    key={j}
                    initial={{ x: -20, opacity: 0 }}
                    animate={isInView ? { x: 0, opacity: 1 } : {}}
                    transition={{ delay: i * 0.15 + 0.6 + j * 0.1 }}
                    className="text-white/60 italic pl-4 py-2"
                    style={{ borderLeft: '2px solid rgba(59, 155, 255, 0.3)' }}
                  >
                    "{context}..."
                  </motion.p>
                ))}
              </motion.div>
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

  const getLocationIcon = (type: string) => {
    switch(type) {
      case 'lives': return '🏠';
      case 'works': return '💼';
      case 'visits': return '✈️';
      default: return '💬';
    }
  };

  const getLocationLabel = (type: string) => {
    switch(type) {
      case 'lives': return 'You live here';
      case 'works': return 'You work here';
      case 'visits': return 'You visited here';
      default: return 'Mentioned this place';
    }
  };

  const getLocationGradient = (type: string) => {
    switch(type) {
      case 'lives': return { from: '#2479df', to: '#3b9bff' };
      case 'works': return { from: '#3b9bff', to: '#b0c3fd' };
      case 'visits': return { from: '#b0c3fd', to: '#d4b8ff' };
      default: return { from: '#ffffff', to: '#3b9bff' };
    }
  };

  return (
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ x: -50, opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="text-5xl font-black mb-4"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Your geography
      </motion.h2>
      <motion.p
        initial={{ x: -50, opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-white/60 mb-12 text-lg"
      >
        Places that matter to you
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {locations.map((loc, i) => {
          const gradient = getLocationGradient(loc.type);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-2xl backdrop-blur-xl cursor-default transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}10)`,
                border: `1px solid ${gradient.from}40`,
                boxShadow: `0 10px 40px ${gradient.from}20`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-3xl"
                  >
                    {getLocationIcon(loc.type)}
                  </motion.span>
                  <h3 className="text-2xl font-bold">{loc.location}</h3>
                </div>
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
                  className="text-white/50 text-sm"
                >
                  {loc.mentions}x
                </motion.span>
              </div>
              <p className="text-white/60 text-sm capitalize">
                {getLocationLabel(loc.type)}
              </p>
            </motion.div>
          );
        })}
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
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        className="text-5xl font-black mb-12"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Other personal details
      </motion.h2>

      {personalInfo.relationships.length > 0 && (
        <InfoSection
          title="Relationships mentioned"
          items={personalInfo.relationships}
          isInView={isInView}
          delay={0}
        />
      )}

      {personalInfo.workInfo.length > 0 && (
        <InfoSection
          title="Work information"
          items={personalInfo.workInfo}
          isInView={isInView}
          delay={0.2}
        />
      )}

      {personalInfo.phoneNumbers.length > 0 && (
        <InfoSection
          title="Phone numbers"
          items={personalInfo.phoneNumbers}
          sensitive
          isInView={isInView}
          delay={0.4}
        />
      )}
    </motion.section>
  );
}

function InfoSection({
  title,
  items,
  sensitive = false,
  isInView,
  delay
}: {
  title: string;
  items: string[];
  sensitive?: boolean;
  isInView: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
      className="mb-8"
    >
      <h3 className="text-xl text-white/80 mb-4 font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {items.map((item, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: delay + i * 0.05, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1, y: -2 }}
            className="px-4 py-2 rounded-full text-sm cursor-default transition-all duration-300"
            style={{
              background: sensitive 
                ? 'linear-gradient(135deg, rgba(245, 108, 92, 0.2), rgba(245, 108, 92, 0.1))'
                : 'linear-gradient(135deg, rgba(59, 155, 255, 0.2), rgba(176, 195, 253, 0.1))',
              border: sensitive
                ? '1px solid rgba(245, 108, 92, 0.3)'
                : '1px solid rgba(59, 155, 255, 0.3)',
              color: sensitive ? '#f56c5c' : '#b0c3fd',
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
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ opacity: 0, x: -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        className="text-5xl font-black mb-4"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        What you think about
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, x: -50 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="text-white/60 mb-12 text-lg"
      >
        Topics you return to again and again
      </motion.p>

      <div className="space-y-8">
        {themes.map((theme, i) => (
          <motion.div
            key={i}
            initial={{ x: -100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="flex items-center justify-between mb-3">
              <motion.h3
                whileHover={{ x: 10 }}
                className="text-2xl capitalize cursor-default font-bold"
              >
                {theme.theme}
              </motion.h3>
              <motion.span
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.1 + 0.5 }}
                className="text-white/50 text-lg"
              >
                {theme.mentions} times
              </motion.span>
            </div>

            <div className="relative h-3 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: Math.min(1, theme.obsessionLevel / 10) } : {}}
                transition={{ duration: 1.5, delay: i * 0.1 + 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="h-full origin-left rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #2479df, #3b9bff, #b0c3fd)',
                  boxShadow: '0 0 20px rgba(59, 155, 255, 0.6)',
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.1 + 0.8 }}
              className="absolute -left-2 -top-2 w-2 h-2 rounded-full"
              style={{ background: 'rgba(59, 155, 255, 0.6)' }}
            >
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                className="w-full h-full rounded-full"
                style={{ background: 'rgba(59, 155, 255, 0.6)' }}
              />
            </motion.div>
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
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        className="text-5xl font-black mb-12"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        When you're most vulnerable
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patterns.map((pattern, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={isInView ? { scale: 1, opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.15, type: "spring" }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="backdrop-blur-xl p-6 rounded-2xl transition-all duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(176, 195, 253, 0.15), rgba(59, 155, 255, 0.08))',
              border: '1px solid rgba(176, 195, 253, 0.3)',
              boxShadow: '0 10px 40px rgba(176, 195, 253, 0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold">{pattern.timeOfDay}</h3>
              <motion.span
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: i * 0.15 + 0.3, type: "spring" }}
                className="text-white/50 text-sm"
              >
                {pattern.frequency} messages
              </motion.span>
            </div>
            <p className="text-white/60 text-sm capitalize">
              Emotional tone: {pattern.emotionalTone.replace('_', ' ')}
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
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        className="text-5xl font-black mb-4"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #f56c5c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Sensitive disclosures
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="text-white/50 mb-12 text-lg"
      >
        Moments where you shared personal struggles or private information
      </motion.p>

      <div className="space-y-6">
        {topics.slice(0, 10).map((topic, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ x: 10, scale: 1.01 }}
            className="p-6 rounded-2xl backdrop-blur-xl group transition-all duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 108, 92, 0.15), rgba(245, 108, 92, 0.08))',
              border: '1px solid rgba(245, 108, 92, 0.3)',
              boxShadow: '0 10px 40px rgba(245, 108, 92, 0.2)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <motion.span
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="text-xs uppercase tracking-wider px-3 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(245, 108, 92, 0.2)', color: '#f56c5c' }}
              >
                {topic.category.replace('_', ' ')}
              </motion.span>
              <span className="text-white/40 text-xs">
                {new Date(topic.timestamp).toLocaleDateString()}
              </span>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.1 + 0.5 }}
              className="text-white/80 italic leading-relaxed"
            >
              "{topic.excerpt}..."
            </motion.p>
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
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="text-5xl font-black mb-4"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Your most revealing moments
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3 }}
        className="text-white/50 mb-12 text-lg"
      >
        The conversations where you were most open, most vulnerable, most yourself
      </motion.p>

      <div className="space-y-8">
        {moments.slice(0, 8).map((moment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative pl-8"
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'linear-gradient(180deg, rgba(59, 155, 255, 0.8), rgba(176, 195, 253, 0.3))',
              }}
            />

            <motion.div whileHover={{ x: 10 }} className="group cursor-default">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/60 text-sm">
                  {new Date(moment.timestamp).toLocaleString()}
                </span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ delay: i * 0.12 + 0.5, type: "spring" }}
                  className="text-white/50 text-xs px-3 py-1 rounded-full"
                  style={{ background: 'rgba(59, 155, 255, 0.2)' }}
                >
                  Exposure: {moment.juiceScore}/10
                </motion.span>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.12 + 0.3 }}
                className="text-white/90 mb-3 leading-relaxed text-lg group-hover:text-white transition-colors"
              >
                "{moment.excerpt.substring(0, 250)}..."
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.12 + 0.5 }}
                className="text-white/40 text-xs capitalize"
              >
                {moment.reason}
              </motion.p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ============================================================================
// CARBON SECTION
// ============================================================================
function CarbonSection({ userMessages }: { userMessages: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.section ref={ref} className="mb-32">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        className="text-5xl font-black mb-12"
        style={{
          background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Environmental cost
      </motion.h2>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, type: "spring" }}
        whileHover={{ scale: 1.02 }}
        className="p-12 rounded-3xl text-center backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(36, 121, 223, 0.2), rgba(176, 195, 253, 0.1))',
          border: '1px solid rgba(59, 155, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(36, 121, 223, 0.3)',
        }}
      >
        <motion.p
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="text-7xl mb-6"
        >
          🌍
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-4xl mb-3 font-black"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ~{Math.round(userMessages * 0.005)} kg CO₂
        </motion.p>

        <p className="text-white/60 mb-6 text-lg">
          Estimated carbon emissions from your conversations
        </p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-white/50"
        >
          Equivalent to driving {Math.round(userMessages * 0.02)} km
        </motion.p>
      </motion.div>
    </motion.section>
  );
}

// ============================================================================
// FINAL SECTION - Updated with consent context
// ============================================================================
function FinalSection({ router, hasConsented }: { router: any; hasConsented: boolean | null }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.5 }}
      className="mb-24 text-center"
    >
      <div className="pt-16" style={{ borderTop: '1px solid rgba(59, 155, 255, 0.2)' }}>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-white/60 text-xl mb-8 leading-relaxed max-w-3xl mx-auto"
        >
          {hasConsented === true ? (
            <>
              Thank you for contributing to this exhibition. Your anonymized data will help others 
              understand the invisible extraction happening every day.
            </>
          ) : hasConsented === false ? (
            <>
              Your choice to keep your data private is respected. That's what genuine consent looks like—
              the freedom to say no.
            </>
          ) : (
            <>
              All of this information—the names of people in your life, where you live and work,
              your patterns, your vulnerabilities, your most intimate moments—
              <span className="text-white font-semibold"> could have been uploaded publicly.</span>
            </>
          )}
        </motion.p>

        <motion.p
          initial={{ scale: 0.9, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
          className="text-3xl font-black mb-4"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Now you understand.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="text-white/50 mb-12"
        >
          The consent theater is over. The awareness begins.
        </motion.p>

        <motion.button
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/exhibition')}
          className="px-12 py-5 text-xl font-bold rounded-2xl transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #2479df, #3b9bff)',
            color: 'white',
            boxShadow: '0 20px 60px rgba(36, 121, 223, 0.5)',
          }}
        >
          View the Exhibition
        </motion.button>
      </div>
    </motion.section>
  );
}