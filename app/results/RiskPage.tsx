'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// TYPES
// ============================================================================

interface AnalysisResult {
  privacyScore: number;
  findings: {
    personalInfo: {
      names: { name: string; mentions: number; relationship?: string }[];
      locations: { location: string; type: string; mentions: number }[];
      ages: string[]; emails: string[]; phoneNumbers: string[]; relationships: string[]; workInfo: string[];
    };
    sensitiveTopics: { category: string; excerpt: string; timestamp: string | number }[];
    vulnerabilityPatterns: { timeOfDay: string; messageCount?: number; frequency?: number }[];
    temporalInsights: unknown[];
    repetitiveThemes: { theme: string; mentions?: number; count?: number }[];
  };
  juiciestMoments: { timestamp: string; excerpt: string; juiceScore: number; reason: string }[];
  stats?: { totalMessages: number; userMessages: number; assistantMessages: number; timeSpan: string; avgMessageLength: number };
  rawStats?: { totalMessages: number; userMessages: number; timeSpan: string; avgMessageLength: number };
  totalUserMessages?: number;
  timespan?: { first: string; last: string; days: number };
  commercialProfile?: { segments: { label: string; confidence: number }[] };
  dependency?: { dependencyScore: number; trajectory: string };
  lifeEvents?: { type: string; label: string; severity: string; approximateDate?: string }[];
  hourDistribution?: number[];
  nighttimeRatio?: number;
  avgAnxiety?: number;
  typeBreakdown?: Record<string, number>;
  emotionalTimeline?: unknown;
  mostVulnerablePeriod?: string;
}

// ============================================================================
// DATA HELPERS
// ============================================================================

function getTopCategories(topics: { category: string }[]): string[] {
  const counts: Record<string, number> = {};
  topics.forEach(t => { const cat = (t.category || 'unknown').replace(/_/g, ' '); counts[cat] = (counts[cat] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
}

const BUYER_POOL = [
  'PharmaTarget Ltd', 'InsureMetrics Inc', 'TalentScope AI', 'AdVantage DSP',
  'BehaviourGraph plc', 'SegmentIQ', 'ProfileSync Corp', 'DataNexus Group',
  'AudienceForge', 'PredictiveEdge Ltd', 'NeuralBid Systems', 'InferenceHub',
];

// ============================================================================
// SCENARIO GENERATION
// ============================================================================

interface RiskScenario {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  relevance: number;
  title: string;
  subtitle: string;
  body: string;
  dataPoints: { label: string; value: string; alarming: boolean }[];
  precedent: { source: string; detail: string };
}

function generateScenarios(r: AnalysisResult): RiskScenario[] {
  const stats = r.stats || r.rawStats;
  const totalMsgs = r.totalUserMessages || stats?.userMessages || 0;
  const sensitiveCount = r.findings.sensitiveTopics?.length || 0;
  const nameCount = r.findings.personalInfo.names?.length || 0;
  const locCount = r.findings.personalInfo.locations?.length || 0;
  const topCats = getTopCategories(r.findings.sensitiveTopics || []);
  const themes = (r.findings.repetitiveThemes || []).slice(0, 3).map(t => t.theme);
  const nightPct = Math.round((r.nighttimeRatio || 0) * 100);
  const anxietyScore = r.avgAnxiety || 0;
  const depScore = r.dependency?.dependencyScore || 0;
  const lifeEvents = r.lifeEvents || [];
  const highSevEvents = lifeEvents.filter(e => e.severity === 'high');
  const homeLoc = r.findings.personalInfo.locations.find(l => l.type === 'lives');
  const segments = r.commercialProfile?.segments || [];
  const scenarios: RiskScenario[] = [];

  const insuranceRelevance = sensitiveCount * 3 + (anxietyScore > 3 ? 20 : 0) + highSevEvents.length * 10 + (nightPct > 10 ? 8 : 0);
  scenarios.push({
    id: 'insurance',
    severity: insuranceRelevance > 25 ? 'critical' : insuranceRelevance > 10 ? 'high' : 'medium',
    relevance: insuranceRelevance,
    title: 'An insurer could reconstruct your risk profile from data like this.',
    subtitle: sensitiveCount > 0
      ? `You made ${sensitiveCount} sensitive disclosure${sensitiveCount > 1 ? 's' : ''}${topCats.length > 0 ? '. Categories include: ' + topCats.join(', ') : ''}.`
      : 'Your behavioural patterns alone are sufficient for risk modelling.',
    body: anxietyScore > 3
      ? `Your average anxiety score across all messages is ${anxietyScore.toFixed(1)}/10. Underwriting algorithms treat sustained anxiety indicators as a predictor of future claims. Combined with ${nightPct > 5 ? nightPct + '% late-night usage (a secondary stress marker)' : 'your disclosure frequency'}, your profile would trigger elevated risk classification in automated systems.`
      : `Even without direct mental health disclosures, your usage patterns ${depScore > 50 ? '(dependency score: ' + depScore + '/100) ' : ''}and topic distribution provide sufficient signal for actuarial modelling. OpenAI does not share this with insurers — but data brokers compile similar profiles from dozens of sources. If this data were ever exposed, it would fit directly into those systems. Insurers do not require a diagnosis. They require a probability.`,
    dataPoints: [
      { label: 'Sensitive disclosures', value: String(sensitiveCount), alarming: sensitiveCount > 5 },
      { label: 'Anxiety indicator', value: anxietyScore > 0 ? anxietyScore.toFixed(1) + '/10' : 'Not scored', alarming: anxietyScore > 4 },
      { label: 'Late-night ratio', value: nightPct + '%', alarming: nightPct > 10 },
      { label: 'High-severity events', value: String(highSevEvents.length), alarming: highSevEvents.length > 0 },
    ],
    precedent: { source: 'FTC v. BetterHelp, 2023', detail: 'BetterHelp shared therapy status data with Facebook and Snapchat for ad targeting. Fine: $7.8 million. Users had been told their data was private.' },
  });

  const careerEvents = lifeEvents.filter(e => ['job_loss', 'job_search'].includes(e.type));
  const employRelevance = (totalMsgs > 2000 ? 15 : totalMsgs > 500 ? 8 : 0) + themes.length * 5 + (depScore > 50 ? 12 : 0) + (anxietyScore > 3 ? 10 : 0);
  scenarios.push({
    id: 'employment',
    severity: employRelevance > 25 ? 'critical' : employRelevance > 10 ? 'high' : 'medium',
    relevance: employRelevance,
    title: 'An employer could screen you out based on data like this.',
    subtitle: careerEvents.length > 0
      ? `${careerEvents.length} career-related life event${careerEvents.length > 1 ? 's' : ''} detected. AI screening tools flag this as instability.`
      : 'Your writing patterns are sufficient for personality inference. No interview required.',
    body: `You submitted ${totalMsgs.toLocaleString('en-GB')} messages over ${r.timespan?.days || '?'} days. ${themes.length > 0 ? 'Your dominant topics (' + themes.join(', ') + ') ' : 'Your topic distribution '}form a personality signature. Companies like Humantic AI claim 78–85% accuracy in personality profiling from text alone. ${anxietyScore > 3 ? 'Your anxiety indicators (avg ' + anxietyScore.toFixed(1) + '/10) would flag as emotional volatility in screening models.' : 'Volume and consistency patterns alone indicate work habits and reliability.'}${depScore > 60 ? ' Your dependency score (' + depScore + '/100) suggests compulsive tool usage — a flag for productivity screening.' : ''}`,
    dataPoints: [
      { label: 'Messages analysed', value: totalMsgs.toLocaleString('en-GB'), alarming: totalMsgs > 2000 },
      { label: 'Career events', value: String(careerEvents.length), alarming: careerEvents.length > 0 },
      { label: 'Dependency score', value: depScore + '/100', alarming: depScore > 50 },
      { label: 'Top themes', value: themes.slice(0, 2).join(', ') || 'None flagged', alarming: false },
    ],
    precedent: { source: 'Mobley v. Workday, 2024', detail: 'A US federal court allowed a discrimination case to proceed against Workday after a plaintiff was rejected from 100+ jobs by its AI screening tools.' },
  });

  const targetRelevance = segments.length * 8 + (nightPct > 5 ? 10 : 0) + sensitiveCount * 2;
  scenarios.push({
    id: 'targeting',
    severity: targetRelevance > 25 ? 'critical' : targetRelevance > 10 ? 'high' : 'medium',
    relevance: targetRelevance,
    title: `Your data matches ${segments.length || 'multiple'} advertising segment${segments.length === 1 ? '' : 's'}. You did not consent to this classification.`,
    subtitle: segments.length > 0
      ? `Segments: ${segments.slice(0, 3).map(s => s.label.replace(/_/g, ' ')).join(', ')}${segments.length > 3 ? ' (+' + (segments.length - 3) + ' more)' : ''}.`
      : 'Behavioural patterns are sufficient for segment assignment without explicit disclosures.',
    body: `${nightPct > 5 ? 'You are most vulnerable between midnight and 5am (' + nightPct + '% of your messages). Data generated during these windows shows the highest concentration of sensitive disclosure. ' : ''}The patterns in your messages map onto ${segments.length > 0 ? segments.length + ' standard IAB advertising categories' : 'standard advertising categories'} used in real-time bidding across the web. OpenAI does not sell this data — but a breach, a legal order, or a future policy change could expose it to systems that do. The profile exists. That is the risk.`,
    dataPoints: [
      { label: 'Assigned segments', value: String(segments.length), alarming: segments.length > 3 },
      { label: 'Vulnerability window', value: nightPct > 5 ? `00:00–05:00 (${nightPct}%)` : 'Not detected', alarming: nightPct > 10 },
      { label: 'Location exposed', value: homeLoc ? homeLoc.location : 'Not detected', alarming: !!homeLoc },
      { label: 'Named contacts', value: String(nameCount), alarming: nameCount > 3 },
    ],
    precedent: { source: 'FTC v. Oracle, 2024', detail: 'Oracle settled for $115 million over tracking and selling user data from platforms users never interacted with directly.' },
  });

  const breachRelevance = (r.privacyScore || 0) * 0.5 + nameCount * 3 + locCount * 4 + sensitiveCount * 2;
  scenarios.push({
    id: 'breach',
    severity: breachRelevance > 30 ? 'critical' : breachRelevance > 15 ? 'high' : 'medium',
    relevance: breachRelevance,
    title: 'None of this requires intent. One breach is enough.',
    subtitle: `Your profile contains ${nameCount} named individual${nameCount === 1 ? '' : 's'}, ${locCount} location${locCount === 1 ? '' : 's'}, and ${sensitiveCount} sensitive disclosure${sensitiveCount === 1 ? '' : 's'}. All would be exposed.`,
    body: `A breach does not release a file with your name at the top. It releases a behavioural signature, a location history, a social graph, and a pattern of emotional disclosure — none of which can be changed after exposure. ${nameCount > 0 ? 'The ' + nameCount + ' people you named are also exposed. Their records are now linked to yours. ' : ''}${r.privacyScore >= 60 ? 'Your exposure index (' + r.privacyScore + '/100) places you in the highest-risk category for identity reconstruction from leaked behavioural data.' : 'Even partial exposure of your behavioural patterns is sufficient for re-identification.'}`,
    dataPoints: [
      { label: 'Exposure index', value: r.privacyScore + '/100', alarming: r.privacyScore >= 60 },
      { label: 'People exposed', value: String(nameCount), alarming: nameCount > 0 },
      { label: 'Locations exposed', value: String(locCount), alarming: locCount > 0 },
      { label: 'Sensitive records', value: String(sensitiveCount), alarming: sensitiveCount > 0 },
    ],
    precedent: { source: 'Equifax breach, 2017', detail: '148 million people exposed. Most did not know Equifax held their data. The company simply had it.' },
  });

  return scenarios.sort((a, b) => b.relevance - a.relevance);
}

// ============================================================================
// SEVERITY COLOURS
// ============================================================================

function sevColor(severity: string) {
  if (severity === 'critical') return PALETTE.red;
  if (severity === 'high') return PALETTE.amber;
  if (severity === 'medium') return PALETTE.inkMuted;
  return PALETTE.inkFaint;
}

// ============================================================================
// HERO SCENARIO — full-width, unboxed, Resist-pattern
// ============================================================================

function HeroScenario({ scenario }: { scenario: RiskScenario }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const sc = sevColor(scenario.severity);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.1 }}
      style={{
        paddingBottom: 'clamp(3rem, 7vw, 5rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
        marginBottom: 'clamp(3rem, 7vw, 5rem)',
      }}
    >
      {/* Severity label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <span style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: sc, textTransform: 'uppercase',
          padding: '3px 8px', border: `1px solid ${sc}40`,
        }}>
          {scenario.severity}
        </span>
        <span style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          {scenario.id} / highest relevance
        </span>
      </div>

      {/* Title — large, declarative */}
      <h2 style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.8rem, 4vw, 3rem)',
        fontWeight: 400, color: PALETTE.ink,
        letterSpacing: '-0.02em', lineHeight: 1.2,
        maxWidth: '22ch', marginBottom: '1.2rem',
      }}>
        {scenario.title}
      </h2>

      <p style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
        color: PALETTE.inkMuted, lineHeight: 1.8,
        maxWidth: '55ch', marginBottom: 'clamp(2rem, 5vw, 3.5rem)',
        fontStyle: 'italic',
      }}>
        {scenario.subtitle}
      </p>

      {/* Data points — horizontal strip, no box around them */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '1px', background: PALETTE.border,
        marginBottom: 'clamp(2rem, 5vw, 3.5rem)',
      }}>
        {scenario.dataPoints.map(dp => (
          <div key={dp.label} style={{ background: PALETTE.bgPanel, padding: '1.2rem 1.4rem' }}>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem',
            }}>{dp.label}</p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.6rem)',
              color: dp.alarming ? PALETTE.red : PALETTE.ink,
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>{dp.value}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
        color: PALETTE.inkMuted, lineHeight: 1.85,
        maxWidth: '62ch', marginBottom: '2rem',
      }}>
        {scenario.body}
      </p>

      {/* Precedent — left-bordered, no heavy box */}
      <div style={{
        borderLeft: `2px solid ${PALETTE.border}`,
        paddingLeft: '1.5rem',
      }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem',
        }}>
          {scenario.precedent.source}
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
          fontStyle: 'italic', color: PALETTE.inkMuted, lineHeight: 1.7,
        }}>
          {scenario.precedent.detail}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// SECONDARY SCENARIO — accordion, clean
// ============================================================================

function ScenarioCard({ scenario, index }: { scenario: RiskScenario; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [expanded, setExpanded] = useState(false);
  const sc = sevColor(scenario.severity);

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      style={{
        borderBottom: `1px solid ${PALETTE.border}`,
        paddingTop: '1.6rem',
        paddingBottom: expanded ? '2rem' : '1.6rem',
        cursor: 'pointer',
        transition: 'padding-bottom 0.2s',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.7rem' }}>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
              color: sc, textTransform: 'uppercase',
              padding: '2px 6px', border: `1px solid ${sc}35`,
            }}>
              {scenario.severity}
            </span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
            }}>
              {scenario.id}
            </span>
          </div>
          <h3 style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)',
            fontWeight: 400, color: PALETTE.ink,
            lineHeight: 1.3, maxWidth: '48ch',
          }}>
            {scenario.title}
          </h3>
        </div>
        <span style={{
          fontFamily: TYPE.mono, fontSize: '1.2rem',
          color: PALETTE.inkFaint, flexShrink: 0,
          marginTop: '1.4rem', transition: 'transform 0.2s',
          transform: expanded ? 'rotate(45deg)' : 'none',
        }}>+</span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
              fontStyle: 'italic', color: PALETTE.inkMuted,
              lineHeight: 1.8, marginTop: '1.2rem', marginBottom: '1.5rem',
              maxWidth: '55ch',
            }}>
              {scenario.subtitle}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1px', background: PALETTE.border,
              marginBottom: '1.5rem',
            }}>
              {scenario.dataPoints.map(dp => (
                <div key={dp.label} style={{ background: PALETTE.bgPanel, padding: '1rem 1.2rem' }}>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em',
                    color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem',
                  }}>{dp.label}</p>
                  <p style={{
                    fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
                    color: dp.alarming ? PALETTE.red : PALETTE.ink,
                    letterSpacing: '-0.02em',
                  }}>{dp.value}</p>
                </div>
              ))}
            </div>

            <p style={{
              fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
              color: PALETTE.inkMuted, lineHeight: 1.85,
              maxWidth: '60ch', marginBottom: '1.5rem',
            }}>
              {scenario.body}
            </p>

            <div style={{ borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1.2rem' }}>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem',
              }}>{scenario.precedent.source}</p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.5vw, 1.1rem)',
                fontStyle: 'italic', color: PALETTE.inkFaint, lineHeight: 1.7,
              }}>{scenario.precedent.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ============================================================================
// RTB AUCTION
// ============================================================================

function RTBAuction({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [phase, setPhase] = useState<'idle' | 'running' | 'sold'>('idle');
  const [bids, setBids] = useState<{ buyer: string; amount: number; segment: string; timestamp: number }[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [winner, setWinner] = useState<{ buyer: string; amount: number; segment: string; timestamp: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const segments = results.commercialProfile?.segments || [];
  const homeLoc = results.findings.personalInfo.locations.find(l => l.type === 'lives');
  const nightPct = Math.round((results.nighttimeRatio || 0) * 100);
  const totalMsgs = results.totalUserMessages || results.stats?.userMessages || 0;

  const segmentLabels = useMemo(() => {
    if (segments.length > 0) return segments.slice(0, 4).map(s => s.label.replace(/_/g, ' '));
    return ['behavioural-profile', 'general-audience'];
  }, [segments]);

  const runAuction = useCallback(() => {
    setPhase('running'); setBids([]); setElapsed(0); setWinner(null);
    const allBids: typeof bids = [];
    const usedBuyers = new Set<string>();
    const totalBidsCount = 6 + Math.floor(Math.random() * 4);
    let bidIndex = 0;
    intervalRef.current = setInterval(() => {
      if (bidIndex >= totalBidsCount) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setWinner([...allBids].sort((a, b) => b.amount - a.amount)[0] || null);
        setPhase('sold');
        return;
      }
      let buyer = BUYER_POOL[Math.floor(Math.random() * BUYER_POOL.length)];
      while (usedBuyers.has(buyer) && usedBuyers.size < BUYER_POOL.length) buyer = BUYER_POOL[Math.floor(Math.random() * BUYER_POOL.length)];
      usedBuyers.add(buyer);
      const bid = { buyer, amount: parseFloat((0.002 + Math.random() * 0.012).toFixed(4)), segment: segmentLabels[Math.floor(Math.random() * segmentLabels.length)], timestamp: bidIndex * 120 + Math.floor(Math.random() * 80) };
      allBids.push(bid);
      setBids(prev => [...prev, bid]);
      setElapsed(bid.timestamp);
      bidIndex++;
    }, 700);
  }, [segmentLabels]);

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        paddingTop: 'clamp(3rem, 7vw, 5rem)',
        paddingBottom: 'clamp(3rem, 7vw, 5rem)',
        borderBottom: `1px solid ${PALETTE.border}`,
        marginBottom: 'clamp(3rem, 7vw, 5rem)',
      }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
        color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
      }}>
        The mechanism
      </p>

      <h2 style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
        fontWeight: 400, color: PALETTE.ink,
        letterSpacing: '-0.02em', lineHeight: 1.2,
        maxWidth: '24ch', marginBottom: '1.2rem',
      }}>
        This is how data like yours gets used once it leaves a system.
      </h2>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
        color: PALETTE.inkMuted, lineHeight: 1.85,
        maxWidth: '55ch', marginBottom: 'clamp(2rem, 5vw, 3.5rem)',
        fontStyle: 'italic',
      }}>
        Every time you load a webpage elsewhere on the internet, your behavioural profile enters a real-time auction. The data fuelling that auction is built from platforms like this one. Advertisers bid in under 100 milliseconds. The winner targets you. You are not notified.
      </p>

      {/* Lot card */}
      <div style={{
        borderLeft: `3px solid ${PALETTE.red}`,
        paddingLeft: 'clamp(1.5rem, 3vw, 2.5rem)',
        marginBottom: 'clamp(2rem, 5vw, 3rem)',
        maxWidth: 520,
      }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem',
        }}>
          Your data lot
        </p>
        <div style={{ display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {[
            { l: 'Lot ID', v: 'USR-' + String(results.privacyScore).padStart(3, '0') + '-' + String(totalMsgs % 10000).padStart(4, '0') },
            { l: 'Quality', v: results.privacyScore >= 70 ? 'PREMIUM' : results.privacyScore >= 40 ? 'STANDARD' : 'SPARSE' },
            { l: 'Location', v: homeLoc ? homeLoc.location : 'Inferred' },
          ].map(item => (
            <div key={item.l}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}>{item.l}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink }}>{item.v}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {segmentLabels.map(seg => (
            <span key={seg} style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em',
              color: PALETTE.red, padding: '3px 8px',
              border: `1px solid ${PALETTE.red}28`, textTransform: 'capitalize',
            }}>{seg}</span>
          ))}
        </div>
      </div>

      {/* Auction */}
      {phase === 'idle' && (
        <button
          onClick={runAuction}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: PALETTE.bgPanel,
            background: PALETTE.red, border: 'none',
            padding: '0.9rem 2.2rem', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Run auction →
        </button>
      )}

      {(phase === 'running' || phase === 'sold') && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
              {phase === 'running' ? 'Bidding in progress' : 'Auction complete'}
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: phase === 'sold' ? PALETTE.red : PALETTE.inkMuted }}>{elapsed}ms</p>
          </div>
          <div style={{ height: '1px', background: PALETTE.border, marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              animate={{ scaleX: phase === 'sold' ? 1 : 0.7 }}
              transition={{ duration: 0.5 }}
              style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: phase === 'sold' ? PALETTE.red : PALETTE.inkMuted }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
            <AnimatePresence>
              {bids.map((bid, i) => (
                <motion.div
                  key={bid.buyer + i}
                  initial={{ opacity: 0, x: -12, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0', borderBottom: `1px solid ${PALETTE.border}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, width: '2.5rem' }}>{bid.timestamp}ms</span>
                    <span style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.ink }}>{bid.buyer}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, textTransform: 'capitalize' }}>{bid.segment}</span>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '1rem', color: PALETTE.red, width: '4.5rem', textAlign: 'right' }}>£{bid.amount.toFixed(4)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {phase === 'sold' && winner && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{
                  borderLeft: `3px solid ${PALETTE.red}`,
                  paddingLeft: '1.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.25em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Sold</p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', color: PALETTE.ink, marginBottom: '0.3rem' }}>{winner.buyer}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '1.2rem', color: PALETTE.red, letterSpacing: '0.02em', marginBottom: '0.8rem' }}>£{winner.amount.toFixed(4)}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em', color: PALETTE.inkFaint, lineHeight: 1.65 }}>
                  In a real auction, the winner receives: a behavioural profile, segment classifications, a vulnerability window{homeLoc ? `, your approximate location (${homeLoc.location})` : ''}, and your emotional pattern data. You were not consulted. This transaction is legal.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {phase === 'sold' && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              onClick={() => { setPhase('idle'); setBids([]); setElapsed(0); setWinner(null); }}
              style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
                textTransform: 'uppercase', color: PALETTE.inkFaint,
                background: 'none', border: `1px solid ${PALETTE.border}`,
                padding: '0.5rem 1rem', cursor: 'pointer',
              }}
            >
              Run again
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN RISK PAGE
// ============================================================================

export default function RiskPage({ results }: { results: AnalysisResult }) {
  const scenarios = useMemo(() => generateScenarios(results), [results]);
  const stats = results.stats || results.rawStats;
  const totalMsgs = results.totalUserMessages || stats?.userMessages || 0;
  const activeCount = scenarios.filter(s => s.severity === 'critical' || s.severity === 'high').length;
  const heroScenario = scenarios[0];
  const secondaryScenarios = scenarios.slice(1);
  const pad = 'clamp(2rem, 6vw, 5rem)';

  return (
    <div className="dash-page-inner" style={{
      maxWidth: 1000, margin: '0 auto',
      padding: `0 ${pad}`,
      paddingBottom: 'clamp(4rem, 10vw, 8rem)',
      position: 'relative',
    }}>

      {/* Background geometry — top right, faint crosshair */}
      <svg className="deco-svg" style={{
        position: 'absolute', top: 0, right: 0,
        width: '260px', height: '260px',
        pointerEvents: 'none', overflow: 'visible',
      }}>
        <g transform="translate(200, 100)">
          <circle cx={0} cy={0} r={55} fill="none" stroke="rgba(190,40,30,0.12)" strokeWidth="1" />
          <circle cx={0} cy={0} r={35} fill="none" stroke="rgba(190,40,30,0.08)" strokeWidth="1" />
          <circle cx={0} cy={0} r={3} fill="none" stroke="rgba(190,40,30,0.25)" strokeWidth="1" />
          <line x1={-70} y1={0} x2={-8} y2={0} stroke="rgba(190,40,30,0.15)" strokeWidth="1" />
          <line x1={8} y1={0} x2={70} y2={0} stroke="rgba(190,40,30,0.15)" strokeWidth="1" />
          <line x1={0} y1={-70} x2={0} y2={-8} stroke="rgba(190,40,30,0.15)" strokeWidth="1" />
          <line x1={0} y1={8} x2={0} y2={70} stroke="rgba(190,40,30,0.15)" strokeWidth="1" />
        </g>
      </svg>

      {/* HEADER — Resist pattern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          padding: 'clamp(3rem, 8vw, 6rem) 0 clamp(3rem, 6vw, 5rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(3rem, 7vw, 5rem)',
        }}
      >
        {/* Page label */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
            color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem',
          }}
        >
          04 / Risk
        </motion.p>

        {/* Active count — the big number */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '2.5rem' }}
        >
          <span style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            fontWeight: 400,
            color: activeCount > 2 ? PALETTE.red : PALETTE.amber,
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {activeCount}
          </span>
          <div>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block',
            }}>active risk scenarios</span>
            <span style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
              color: PALETTE.inkFaint, textTransform: 'uppercase', display: 'block', marginTop: '2px',
            }}>from {totalMsgs.toLocaleString('en-GB')} messages</span>
          </div>
        </motion.div>

        {/* Statement */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.9 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
            fontWeight: 400, color: PALETTE.ink,
            letterSpacing: '-0.02em', lineHeight: 1.25,
            maxWidth: 600, marginBottom: '1.5rem',
          }}
        >
          These systems are operational today.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)',
            color: PALETTE.inkMuted, lineHeight: 1.8,
            fontStyle: 'italic', maxWidth: 560,
          }}
        >
          Each scenario below uses your actual data. None is hypothetical. The systems described are running now, and the legal frameworks governing them permit what you are about to read.
        </motion.p>
      </motion.div>

      {/* HERO SCENARIO */}
      {heroScenario && <HeroScenario scenario={heroScenario} />}

      {/* SECONDARY SCENARIOS */}
      {secondaryScenarios.length > 0 && (
        <div style={{ marginBottom: 'clamp(4rem, 10vw, 8rem)' }}>
          {secondaryScenarios.map((scenario, i) => (
            <ScenarioCard key={scenario.id} scenario={scenario} index={i} />
          ))}
        </div>
      )}

      {/* RTB AUCTION */}
      <RTBAuction results={results} />

      {/* CLOSING */}
      <div>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '1px', background: PALETTE.ink, transformOrigin: 'left', marginBottom: '2.5rem', opacity: 0.10 }}
        />
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif,
            fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
            color: PALETTE.ink, lineHeight: 1.55,
            maxWidth: '42ch', marginBottom: '1rem',
          }}
        >
          These scenarios are not speculative.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)',
            color: PALETTE.inkMuted, lineHeight: 1.85,
            maxWidth: '52ch', marginBottom: '2.5rem',
          }}
        >
          They describe systems that are operational, legal, and commercially incentivised. The data that powers them was generated by you, collected without meaningful consent, and cannot be recalled.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 1 }}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
          }}
        >
          End of risk assessment.
        </motion.p>
      </div>

    </div>
  );
}
