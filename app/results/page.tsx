'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CountdownReveal, { RevealData } from './CountdownReveal';
import DashboardLayout, { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import OverviewPage from './OverviewPage';
import SourcesPage from './SourcesPage';
import UnderstandPage from './UnderstandPage';

// ============================================================================
// TYPES
// ============================================================================
interface AnalysisResult {
  privacyScore: number;
  findings: {
    personalInfo: {
      names: any[];
      locations: any[];
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
}

type Stage = 'countdown' | 'dashboard';

const DEFAULT_SOURCES = [
  { id: 'chatgpt', label: 'ChatGPT', connected: false },
  { id: 'google', label: 'Google', connected: false },
  { id: 'instagram', label: 'Instagram', connected: false },
  { id: 'spotify', label: 'Spotify', connected: false },
  { id: 'linkedin', label: 'LinkedIn', connected: false },
  { id: 'twitter', label: 'X', connected: false },
];

// ============================================================================
// PROFILE PAGE
// ============================================================================
function ProfilePage({ results }: { results: AnalysisResult }) {
  return (
    <div style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)', maxWidth: 1280, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>02 — My profile</p>
        <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Your cognitive fingerprint.
        </h1>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1px', background: PALETTE.border }}>

        {/* Thinking styles */}
        <div style={{ gridColumn: 'span 5', background: PALETTE.bgPanel, padding: '2rem' }}>
          <ProfileSection eyebrow="Reasoning patterns" results={results} type="thinking" />
        </div>

        {/* Themes */}
        <div style={{ gridColumn: 'span 4', background: PALETTE.bgPanel, padding: '2rem' }}>
          <ProfileSection eyebrow="What keeps you up at night" results={results} type="themes" />
        </div>

        {/* Social graph */}
        <div style={{ gridColumn: 'span 3', background: PALETTE.bgPanel, padding: '2rem' }}>
          <ProfileSection eyebrow="People in your life" results={results} type="names" />
        </div>

        {/* Sensitive disclosures */}
        <div style={{ gridColumn: 'span 8', background: PALETTE.bgPanel, padding: '2rem' }}>
          <ProfileSection eyebrow="Sensitive disclosures" results={results} type="sensitive" />
        </div>

        {/* Locations */}
        <div style={{ gridColumn: 'span 4', background: PALETTE.bgPanel, padding: '2rem' }}>
          <ProfileSection eyebrow="Where you can be found" results={results} type="locations" />
        </div>

        {/* Vulnerability windows */}
        <div style={{ gridColumn: 'span 12', background: PALETTE.bgPanel, padding: '2rem' }}>
          <ProfileSection eyebrow="When you are easiest to manipulate" results={results} type="vulnerability" />
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ eyebrow, results, type }: { eyebrow: string; results: AnalysisResult; type: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const profile = generateCognitiveProfile(results);

  return (
    <div ref={ref}>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }}
        style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        {eyebrow}
      </motion.p>

      {type === 'thinking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {profile.thinkingStyles.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.1 + i * 0.1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink }}>{s.style}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkMuted }}>{s.percentage}%</p>
              </div>
              <div style={{ height: '2px', background: PALETTE.bgElevated, position: 'relative' }}>
                <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: s.percentage / 100 } : {}}
                  transition={{ duration: 1.4, delay: 0.3 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: PALETTE.inkMuted, opacity: 0.6 }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {type === 'themes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {results.findings.repetitiveThemes.slice(0, 8).map((theme: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.07 }}
              style={{ padding: '0.8rem 0', borderBottom: `1px solid ${PALETTE.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.ink, textTransform: 'capitalize' }}>{theme.theme}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint }}>{theme.mentions || theme.count}x</p>
            </motion.div>
          ))}
        </div>
      )}

      {type === 'names' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {results.findings.personalInfo.names.slice(0, 6).map((n: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.08 }}
              style={{ padding: '0.8rem 0', borderBottom: `1px solid ${PALETTE.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.ink }}>{n.name}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint }}>{n.mentions}x</p>
              </div>
              {n.relationship && <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, textTransform: 'capitalize', marginTop: '2px' }}>{n.relationship}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {type === 'sensitive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {results.findings.sensitiveTopics.slice(0, 8).map((t: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.07 }}
              style={{ padding: '1rem 0 1rem 1rem', borderBottom: `1px solid ${PALETTE.border}`, borderLeft: `2px solid ${PALETTE.redFaint}`, marginBottom: '1px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.12em', color: PALETTE.redMuted, textTransform: 'uppercase' }}>{t.category?.replace('_', ' ')}</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint }}>{new Date(t.timestamp).toLocaleDateString('en-GB')}</span>
              </div>
              <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', fontStyle: 'italic', color: PALETTE.inkMuted, lineHeight: 1.6 }}>{t.excerpt?.substring(0, 160)}...</p>
            </motion.div>
          ))}
        </div>
      )}

      {type === 'locations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {results.findings.personalInfo.locations.map((l: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.08 }}
              style={{ padding: '0.8rem 0', borderBottom: `1px solid ${PALETTE.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.ink }}>{l.location}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, textTransform: 'capitalize' }}>{l.type === 'lives' ? 'Home' : l.type === 'works' ? 'Work' : 'Mentioned'} — {l.mentions}x</p>
            </motion.div>
          ))}
        </div>
      )}

      {type === 'vulnerability' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: PALETTE.border }}>
          {results.findings.vulnerabilityPatterns.map((p: any, i: number) => {
            const count = p.messageCount || p.frequency || 0;
            const isNight = (p.timeOfDay || '').toLowerCase().includes('late') || (p.timeOfDay || '').toLowerCase().includes('night');
            return (
              <motion.div key={i} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.1 }}
                style={{ background: PALETTE.bgElevated, padding: '1.5rem', borderTop: isNight ? `2px solid ${PALETTE.red}` : `2px solid transparent` }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, marginBottom: '0.4rem' }}>{p.timeOfDay}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '1.2rem', color: isNight ? PALETTE.red : PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>{count.toLocaleString()}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>messages</p>
                {isNight && <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.redMuted, marginTop: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Highest value</p>}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RISK PAGE
// ============================================================================
function RiskPage({ results }: { results: AnalysisResult }) {
  return (
    <div style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>04 — Risk assessment</p>
        <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '1rem' }}>
          This is not theoretical.
        </h1>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.4vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 600 }}>
          The data in your profile is commercially valuable. The following scenarios describe what companies already do — and are legally permitted to do — with data of this kind.
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {RISK_SCENARIOS.map((scenario, i) => (
          <RiskBlock key={scenario.id} scenario={scenario} index={i} results={results} />
        ))}
      </div>
    </div>
  );
}

const RISK_SCENARIOS = [
  {
    id: 'insurance',
    label: 'Insurance pricing',
    severity: 'critical',
    heading: 'An insurer you have never spoken to already knows.',
    body: 'Insurance companies feed behavioural inference data — emotional patterns, anxiety indicators, financial distress signals — directly into underwriting models. Your premium is not set by a person reviewing your file. It is set by an algorithm that assigns you a risk score based on patterns in data you produced elsewhere.',
    precedent: 'In 2023, the FTC fined BetterHelp $7.8 million after it shared sensitive mental health data — including the fact users had previously been in therapy — with Facebook and Snapchat for advertising. BetterHelp had told every user: "Rest assured — any information provided will stay private between you and your counsellor."',
    check: (r: AnalysisResult) => (r.findings.sensitiveTopics?.length || 0) > 0,
  },
  {
    id: 'employment',
    label: 'Employment screening',
    severity: 'critical',
    heading: 'You did not get the interview. You were never told why.',
    body: 'In 2024, a US federal court allowed a case against Workday to proceed — a plaintiff had applied to over 100 jobs using Workday\'s AI screening tools and was rejected from every single one. The claim: the system detected indicators of anxiety and depression. 83% of employers now use automated tools at some point in hiring.',
    precedent: 'Humantic AI generates personality profiles from written language alone, claiming 78-85% accuracy. No test required. No consent requested. If your conversation data has been used in model training, the patterns are embedded in the model that reads your next cover letter.',
    check: (r: AnalysisResult) => (r.stats.userMessages || 0) > 200,
  },
  {
    id: 'targeting',
    label: 'Precision targeting',
    severity: 'high',
    heading: 'You were assigned to a segment. You did not know it existed.',
    body: 'The data broker market was valued at $278 billion in 2024. Companies purchase inferred audience segments — "financially distressed 18-34", "mental health help-seeker" — and use them to time advertising to moments of maximum vulnerability. Your vulnerability windows are commercially documented.',
    precedent: 'Oracle Data Cloud paid $115 million in 2024 to settle a case for tracking and selling user data without consent, assembling profiles on hundreds of millions of people from platforms those users visited with no awareness Oracle was involved.',
    check: (r: AnalysisResult) => (r.findings.vulnerabilityPatterns?.length || 0) > 0,
  },
  {
    id: 'breach',
    label: 'Breach exposure',
    severity: 'high',
    heading: 'None of this requires intent. One breach is enough.',
    body: '73% of enterprises reported at least one AI-related security incident in 2024. A breach does not release a file with your name at the top. It releases patterns and inferences that cannot be un-released, corrected, or deleted from the systems that received them.',
    precedent: 'The Equifax breach of 2017 exposed the financial data of 148 million people. Those people did not consent to Equifax holding their data. Most did not know Equifax existed. The company simply had it.',
    check: (r: AnalysisResult) => (r.privacyScore || 0) > 40,
  },
];

const SEVERITY_COLOR: Record<string, string> = {
  critical: PALETTE.red,
  high: PALETTE.amber,
  medium: 'rgba(120,180,255,0.85)',
};

function RiskBlock({ scenario, index, results }: { scenario: typeof RISK_SCENARIOS[0]; index: number; results: AnalysisResult }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTriggered, setAiTriggered] = useState(false);
  const active = scenario.check(results);

  useEffect(() => {
    if (isInView && !aiTriggered && active) {
      setAiTriggered(true);
      generateAI();
    }
  }, [isInView]);

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const summary = {
        userMessages: results.stats.userMessages,
        topThemes: results.findings.repetitiveThemes?.slice(0, 4).map((t: any) => t.theme),
        sensitiveTopics: results.findings.sensitiveTopics?.slice(0, 3).map((t: any) => t.category),
        lateNightMessages: results.findings.vulnerabilityPatterns?.find((p: any) =>
          (p.timeOfDay || '').toLowerCase().includes('late') || (p.timeOfDay || '').toLowerCase().includes('night')
        )?.messageCount,
        exposingMoment: results.juiciestMoments?.[0]?.excerpt?.substring(0, 80),
        financialDisclosures: results.findings.sensitiveTopics?.filter((t: any) => (t.category || '').includes('financ')).length,
        mentalHealthDisclosures: results.findings.sensitiveTopics?.filter((t: any) => (t.category || '').includes('mental')).length,
      };

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are writing copy for a critical art installation about AI data extraction.

Write ONE paragraph (max 70 words, 3 sentences) connecting this person's real data to this specific risk: "${scenario.heading}"

Their data: ${JSON.stringify(summary)}

Rules: Cold, clinical, specific. Use their actual numbers. At least one sentence starts with "Your". Past tense. No em dashes. No preamble. Just the paragraph.`,
          }],
        }),
      });
      const data = await res.json();
      setAiText(data?.content?.[0]?.text?.trim() || '');
    } catch { setAiText(''); }
    setAiLoading(false);
  };

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
      style={{ background: PALETTE.bgPanel, padding: '2rem 2.5rem', borderLeft: `3px solid ${active ? SEVERITY_COLOR[scenario.severity] : PALETTE.border}` }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        {/* Left */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: active ? SEVERITY_COLOR[scenario.severity] : PALETTE.inkFaint, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${active ? SEVERITY_COLOR[scenario.severity] + '40' : PALETTE.border}` }}>
              {active ? 'Active risk' : 'Low risk'}
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
              {scenario.label}
            </span>
          </div>

          <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.45rem)', fontWeight: 400, color: PALETTE.ink, lineHeight: 1.35, marginBottom: '1.2rem' }}>
            {scenario.heading}
          </h3>

          <p style={{ fontFamily: TYPE.serif, fontSize: '0.97rem', color: PALETTE.inkMuted, lineHeight: 1.75 }}>
            {scenario.body}
          </p>
        </div>

        {/* Right */}
        <div>
          <div style={{ padding: '1.2rem', background: PALETTE.bgElevated, borderRadius: '2px', marginBottom: '1.2rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Documented precedent</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.88rem', fontStyle: 'italic', color: PALETTE.inkFaint, lineHeight: 1.65 }}>{scenario.precedent}</p>
          </div>

          {active && (
            <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '1.2rem' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Your profile</p>
              {aiLoading ? (
                <motion.p animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }}
                  style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
                  Analysing your data
                </motion.p>
              ) : aiText ? (
                <p style={{ fontFamily: TYPE.serif, fontSize: '0.92rem', fontStyle: 'italic', color: PALETTE.red, lineHeight: 1.7 }}>{aiText}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ============================================================================
// COGNITIVE PROFILE GENERATOR
// ============================================================================
function generateCognitiveProfile(results: AnalysisResult) {
  const totalMessages = results.stats.userMessages;
  const avgLength = results.stats.avgMessageLength;
  const themes = results.findings.repetitiveThemes || [];
  const analyticalScore = Math.min(95, (avgLength / 300) * 100 + 20);
  const creativeScore = Math.min(85, themes.length * 8 + 25);
  const practicalScore = Math.min(80, 60 + (totalMessages / 50));
  const reflectiveScore = Math.min(75, 50 + (results.findings.sensitiveTopics?.length || 0) * 10);
  return {
    thinkingStyles: [
      { style: 'Analytical', percentage: Math.round(analyticalScore) },
      { style: 'Creative', percentage: Math.round(creativeScore) },
      { style: 'Practical', percentage: Math.round(practicalScore) },
      { style: 'Reflective', percentage: Math.round(reflectiveScore) },
    ],
  };
}

// ============================================================================
// MAIN PAGE — CountdownReveal then Dashboard
// ============================================================================
export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [stage, setStage] = useState<Stage>('countdown');
  const [page, setPage] = useState<DashPage>('overview');
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResults');
    if (stored) {
      const parsed = JSON.parse(stored);
      setResults(parsed);
      // Mark ChatGPT as connected since we have results
      setSources(prev => prev.map(s => s.id === 'chatgpt' ? { ...s, connected: true } : s));
    } else {
      router.push('/upload');
    }
  }, [router]);

  const handleUpload = useCallback((sourceId: string, file: File) => {
    // For exhibition: just mark as connected
    // In production: parse the file and merge data into results
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, connected: true } : s));
    // TODO: parse file and enrich results
  }, []);

  if (!results) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e0d' }}>
        <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.4, repeat: Infinity }}
          style={{ fontFamily: '"Courier Prime", monospace', fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(240,237,232,0.2)', textTransform: 'uppercase' }}>
          Loading
        </motion.p>
      </div>
    );
  }

  if (stage === 'countdown') {
    const revealData: RevealData = {
      name: results.findings.personalInfo.names[0]?.name,
      location: results.findings.personalInfo.locations[0]?.location,
      vulnerabilityWindow: results.findings.vulnerabilityPatterns[0]?.timeOfDay,
      revealingMoment: results.juiciestMoments[0] ? {
        timestamp: new Date(results.juiciestMoments[0].timestamp).toLocaleString('en-GB'),
        content: results.juiciestMoments[0].excerpt?.substring(0, 180) || '',
      } : undefined,
      messageCount: results.stats.totalMessages,
      topTopic: results.findings.repetitiveThemes[0]?.theme,
    };

    return (
      <CountdownReveal
        onComplete={() => setStage('dashboard')}
        data={revealData}
      />
    );
  }

  const connectedSources = sources.reduce((acc, s) => ({ ...acc, [s.id]: s.connected }), {} as Record<string, boolean>);

  return (
    <DashboardLayout results={results} page={page} setPage={setPage}>
      {page === 'overview' && <OverviewPage results={results} sources={sources} setPage={setPage} />}
      {page === 'profile' && <ProfilePage results={results} />}
      {page === 'sources' && <SourcesPage connectedSources={connectedSources} onUpload={handleUpload} />}
      {page === 'risk' && <RiskPage results={results} />}
      {page === 'understand' && <UnderstandPage />}
    </DashboardLayout>
  );
}
