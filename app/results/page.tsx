'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import DashboardLayout, { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import OverviewPage from './OverviewPage';
import ProfilePage from './ProfilePage';
import RiskPage from './RiskPage';
import SourcesPage from './SourcesPage';
import UnderstandPage from './UnderstandPage';
import ResistPage from './ResistPage';

interface AnalysisResult {
  privacyScore: number;
  findings: {
    personalInfo: { names: any[]; locations: any[]; ages: string[]; emails: string[]; phoneNumbers: string[]; relationships: string[]; workInfo: string[]; };
    sensitiveTopics: any[];
    vulnerabilityPatterns: any[];
    temporalInsights: any[];
    repetitiveThemes: any[];
  };
  juiciestMoments: any[];
  stats?: { totalMessages: number; userMessages: number; assistantMessages: number; timeSpan: string; avgMessageLength: number; };
  rawStats?: { totalMessages: number; userMessages: number; timeSpan: string; avgMessageLength: number; };
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

export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [page, setPage] = useState<DashPage>('overview');
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const router = useRouter();

  const handleSetPage = useCallback((p: DashPage) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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
          style={{ fontFamily: '"Courier Prime", monospace', fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(240,237,232,0.2)', textTransform: 'uppercase' }}>
          {"Loading"}
        </motion.p>
      </div>
    );
  }

  return (
    <DashboardLayout results={results} page={page} setPage={handleSetPage}>
      {page === 'overview' && <OverviewPage results={results} sources={sources} setPage={handleSetPage} />}
      {page === 'profile' && <ProfilePage results={results} />}
      {page === 'sources' && <SourcesPage connectedSources={sources.reduce((acc, s) => ({ ...acc, [s.id]: s.connected }), {} as Record<string, boolean>)} onUpload={handleUpload} />}
      {page === 'risk' && <RiskPage results={results} />}
      {page === 'understand' && <UnderstandPage />}
      {page === 'resist' && <ResistPage analysis={results as any} />}
    </DashboardLayout>
  );
}
