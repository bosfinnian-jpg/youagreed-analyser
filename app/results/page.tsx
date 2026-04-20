'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';
import DashboardLayout, { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import OverviewPage from './OverviewPage';
import SourcesPage from './SourcesPage';
import UnderstandPage from './UnderstandPage';
import ProfilePage from './ProfilePage';

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
  stats?: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };
  rawStats?: {
    totalMessages: number;
    userMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };
  totalUserMessages?: number;
  timespan?: { first: string; last: string; days: number };
  emotionalTimeline?: any;
  commercialProfile?: any;
  dependency?: any;
  lifeEvents?: any[];
  topicsByPeriod?: { early: string[]; mid: string[]; recent: string[] };
  hourDistribution?: number[];
  dayDistribution?: number[];
  nighttimeRatio?: number;
  avgIntimacy?: number;
  avgAnxiety?: number;
  mostVulnerablePeriod?: string;
  typeBreakdown?: Record<string, number>;
  aiEnriched?: boolean;
}

const DEFAULT_SOURCES = [
  { id: 'chatgpt', label: 'ChatGPT', connected: false },
  { id: 'google', label: 'Google', connected: false },
  { id: 'instagram', label: 'Instagram', connected: false },
  { id: 'spotify', label: 'Spotify', connected: false },
  { id: 'linkedin', label: 'LinkedIn', connected: false },
  { id: 'twitter', label: 'X', connected: false },
];

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
    check: (r: AnalysisResult) => (r.totalUserMessages || r.stats?.userMessages || 0) > 200,
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
  const active = scenario.check(results);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
      style={{ background: PALETTE.bgPanel, padding: '2rem 2.5rem', borderLeft: `3px solid ${active ? SEVERITY_COLOR[scenario.severity] : PALETTE.border}` }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
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

        <div>
          <div style={{ padding: '1.2rem', background: PALETTE.bgElevated, borderRadius: '2px' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Documented precedent</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.88rem', fontStyle: 'italic', color: PALETTE.inkFaint, lineHeight: 1.65 }}>{scenario.precedent}</p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ============================================================================
// COGNITIVE PROFILE GENERATOR
// ============================================================================
function generateCognitiveProfile(results: AnalysisResult) {
  const stats = results.stats || results.rawStats;
  const totalMessages = stats?.userMessages || results.totalUserMessages || 0;
  const avgLength = stats?.avgMessageLength || 0;
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
// MAIN PAGE
// ============================================================================
export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [page, setPage] = useState<DashPage>('overview');
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResults');
    if (stored) {
      const parsed = JSON.parse(stored);
      setResults(parsed);
      setSources(prev => prev.map(s => s.id === 'chatgpt' ? { ...s, connected: true } : s));
    } else {
      router.push('/upload');
    }
  }, [router]);

  const handleUpload = useCallback((sourceId: string, file: File) => {
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, connected: true } : s));
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

  return (
    <DashboardLayout results={results} page={page} setPage={setPage}>
      {page === 'overview' && <OverviewPage results={results} sources={sources} setPage={setPage} />}
      {page === 'profile' && <ProfilePage results={results} />}
      {page === 'sources' && <SourcesPage connectedSources={sources.reduce((acc, s) => ({ ...acc, [s.id]: s.connected }), {} as Record<string, boolean>)} onUpload={handleUpload} />}
      {page === 'risk' && <RiskPage results={results} />}
      {page === 'understand' && <UnderstandPage />}
    </DashboardLayout>
  );
}
