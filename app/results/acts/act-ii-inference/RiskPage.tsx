'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence, PageFooter } from '../../shared/layout/DashboardLayout';

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
  precedent: { source: string; detail: string; url: string };
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
      : 'Your behavioural patterns may be sufficient for risk modelling without any direct disclosure.',
    body: anxietyScore > 3
      ? `The analysis detected ${anxietyScore.toFixed(1)}/10 average anxiety signal intensity across your messages. Some underwriting algorithms treat sustained anxiety indicators as a predictor of future claims (Gumusel et al., 2024). Combined with ${nightPct > 5 ? nightPct + '% late-night message volume — associated with stress signals in behavioural actuarial models' : 'your disclosure frequency'}, this pattern could trigger elevated risk classification in automated systems.`
      : `Even without direct mental health disclosures, usage patterns ${depScore > 50 ? '(dependency score: ' + depScore + '/100) ' : ''}and topic distribution may provide sufficient signal for actuarial modelling. OpenAI does not share this with insurers — but data brokers compile equivalent profiles from dozens of sources. If this data were ever exposed, it could fit directly into those systems. Some insurers do not require a diagnosis. They require a pattern.`,
    dataPoints: [
      { label: 'Sensitive disclosures', value: String(sensitiveCount), alarming: sensitiveCount > 5 },
      { label: 'Anxiety indicator', value: anxietyScore > 0 ? anxietyScore.toFixed(1) + '/10' : 'Not scored', alarming: anxietyScore > 4 },
      { label: 'Late-night ratio', value: nightPct + '%', alarming: nightPct > 10 },
      { label: 'High-severity events', value: String(highSevEvents.length), alarming: highSevEvents.length > 0 },
    ],
    precedent: { source: 'FTC v. BetterHelp, 2023', detail: 'BetterHelp shared therapy status data with Facebook and Snapchat for ad targeting. Fine: $7.8 million. Users had been told their data was private.', url: 'https://www.ftc.gov/news-events/news/press-releases/2023/03/ftc-ban-betterhelp-revealing-consumers-data-including-sensitive-mental-health-information-facebook' },
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
    body: `The corpus contains ${totalMsgs.toLocaleString('en-GB')} messages over ${r.timespan?.days || '?'} days. ${themes.length > 0 ? 'Dominant topic clusters (' + themes.join(', ') + ') ' : 'Topic distribution '}may constitute a text-derived personality signature of the kind targeted by commercial screening tools. Companies including Humantic AI claim 78–85% accuracy in personality profiling from language patterns alone (Hickman et al., 2022). ${anxietyScore > 3 ? 'Detected anxiety signal intensity (avg ' + anxietyScore.toFixed(1) + '/10) falls within the range that some screening models associate with emotional volatility.' : 'Message volume and consistency patterns can be sufficient for work-habit inference even without direct mental health signal.'}${depScore > 60 ? ' Dependency score (' + depScore + '/100) indicates high-frequency tool engagement — a pattern some productivity screening systems flag.' : ''}`,
    dataPoints: [
      { label: 'Messages analysed', value: totalMsgs.toLocaleString('en-GB'), alarming: totalMsgs > 2000 },
      { label: 'Career events', value: String(careerEvents.length), alarming: careerEvents.length > 0 },
      { label: 'Dependency score', value: depScore + '/100', alarming: depScore > 50 },
      { label: 'Top themes', value: themes.slice(0, 2).join(', ') || 'None flagged', alarming: false },
    ],
    precedent: { source: 'Mobley v. Workday, 2024', detail: 'A US federal court allowed a discrimination case to proceed against Workday after a plaintiff was rejected from 100+ jobs by its AI screening tools.', url: 'https://www.seyfarth.com/news-insights/mobley-v-workday-court-holds-ai-service-providers-could-be-directly-liable-for-employment-discrimination-under-agent-theory.html' },
  });

  const targetRelevance = segments.length * 8 + (nightPct > 5 ? 10 : 0) + sensitiveCount * 2;
  scenarios.push({
    id: 'targeting',
    severity: targetRelevance > 25 ? 'critical' : targetRelevance > 10 ? 'high' : 'medium',
    relevance: targetRelevance,
    title: `Your conversations map onto ${segments.length || 'multiple'} data broker category${segments.length === 1 ? '' : 'ies'}. If exposed, this profile could be usable immediately.`,
    subtitle: segments.length > 0
      ? `Categories: ${segments.slice(0, 3).map(s => s.label.replace(/_/g, ' ')).join(', ')}${segments.length > 3 ? ' (+' + (segments.length - 3) + ' more)' : ''}.`
      : 'Behavioural patterns alone are sufficient for vulnerability classification.',
    body: `${nightPct > 5 ? nightPct + '% of messages were sent between midnight and 5am — windows often associated with lower barriers to disclosure, a pattern noted in conversational AI research (Gumusel et al., 2024). ' : ''}OpenAI does not sell conversation data to advertisers. But the patterns these messages contain — vulnerability signals, life circumstances, emotional disclosure frequency — map onto categories that data brokers trade in. A breach, a legal order, or a policy change could expose this profile into systems where it would have immediate market value. The data exists. That is the structural risk.`,
    dataPoints: [
      { label: 'Assigned segments', value: String(segments.length), alarming: segments.length > 3 },
      { label: 'Vulnerability window', value: nightPct > 5 ? `00:00–05:00 (${nightPct}%)` : 'Not detected', alarming: nightPct > 10 },
      { label: 'Location exposed', value: homeLoc ? homeLoc.location : 'Not detected', alarming: !!homeLoc },
      { label: 'Named contacts', value: String(nameCount), alarming: nameCount > 3 },
    ],
    precedent: { source: 'Oracle privacy settlement, 2024', detail: 'Oracle settled a $115 million class-action lawsuit over tracking and selling user data from platforms users never interacted with directly. The 9th Circuit upheld the settlement in February 2026.', url: 'https://www.mediapost.com/publications/article/412807/appeals-court-endorses-oracle-privacy-settlement.html' },
  });

  const breachRelevance = (r.privacyScore || 0) * 0.5 + nameCount * 3 + locCount * 4 + sensitiveCount * 2;
  scenarios.push({
    id: 'breach',
    severity: breachRelevance > 30 ? 'critical' : breachRelevance > 15 ? 'high' : 'medium',
    relevance: breachRelevance,
    title: 'None of this requires intent. One breach is enough.',
    subtitle: `Your profile contains ${nameCount} named individual${nameCount === 1 ? '' : 's'}, ${locCount} location${locCount === 1 ? '' : 's'}, and ${sensitiveCount} sensitive disclosure${sensitiveCount === 1 ? '' : 's'}. All could be exposed.`,
    body: `A breach does not release a file with your name at the top. It releases a behavioural signature, a location history, a social graph, and a pattern of emotional disclosure — none of which can easily be changed after exposure. ${nameCount > 0 ? 'The ' + nameCount + ' people you named could also be implicated. Their information appears alongside yours.' : ''}${r.privacyScore >= 60 ? ' Your exposure index (' + r.privacyScore + '/100) places this profile in a high-risk category for identity reconstruction from leaked behavioural data.' : ' Even partial exposure of your behavioural patterns may be sufficient for re-identification.'}`,
    dataPoints: [
      { label: 'Exposure index', value: r.privacyScore + '/100', alarming: r.privacyScore >= 60 },
      { label: 'People exposed', value: String(nameCount), alarming: nameCount > 0 },
      { label: 'Locations exposed', value: String(locCount), alarming: locCount > 0 },
      { label: 'Sensitive records', value: String(sensitiveCount), alarming: sensitiveCount > 0 },
    ],
    precedent: { source: 'Equifax breach, 2017', detail: '148 million people exposed. Most did not know Equifax held their data. The company simply had it.', url: 'https://www.ftc.gov/enforcement/refunds/equifax-data-breach-settlement' },
  });

  const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  return scenarios.sort((a, b) => {
    const sevDiff = (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3);
    return sevDiff !== 0 ? sevDiff : b.relevance - a.relevance;
  });
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
        fontSize: 'clamp(1.05rem, 1.6vw, 1.18rem)',
        color: PALETTE.inkMuted, lineHeight: 1.75,
        maxWidth: '58ch', marginBottom: 'clamp(2rem, 5vw, 3.5rem)',
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
        <a
          href={scenario.precedent.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
            color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            textDecoration: 'none', borderBottom: `1px solid ${PALETTE.redMuted}60`,
            paddingBottom: '1px', cursor: 'pointer',
          }}
        >
          {scenario.precedent.source}
          <span style={{ fontSize: '9px', opacity: 0.7 }}>↗</span>
        </a>
        <p style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)',
          color: PALETTE.inkMuted, lineHeight: 1.7, marginTop: '0.5rem',
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
              color: PALETTE.inkMuted,
              lineHeight: 1.75, marginTop: '1.2rem', marginBottom: '1.5rem',
              maxWidth: '58ch',
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
              <a
                href={scenario.precedent.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                  color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem',
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  textDecoration: 'none', borderBottom: `1px solid ${PALETTE.redMuted}60`,
                  paddingBottom: '1px', cursor: 'pointer',
                }}
              >
                {scenario.precedent.source}
                <span style={{ fontSize: '9px', opacity: 0.7 }}>↗</span>
              </a>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.5vw, 1.1rem)',
                color: PALETTE.inkFaint, lineHeight: 1.7, marginTop: '0.4rem',
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
        This is what the system allows to happen to a profile like yours if it ever leaves OpenAI’s servers.
      </h2>

      <p style={{
        fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)',
        color: PALETTE.inkMuted, lineHeight: 1.75,
        maxWidth: '58ch', marginBottom: 'clamp(2rem, 5vw, 3.5rem)',
      }}>
        OpenAI does not sell your data. But every time you load a webpage, your behavioural profile — built from sources across the internet — enters a real auction. The vulnerability patterns in your conversations, if ever exposed through a breach or subpoena, could slot directly into that system. This is what that would look like.
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
                    <span className="bid-row-seg" style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, textTransform: 'capitalize' }}>{bid.segment}</span>
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
                  In the real-time bidding ecosystem, a winner receives: a behavioural profile, vulnerability classifications, a targeting window{homeLoc ? `, and an approximate location (${homeLoc.location})` : ''}. OpenAI does not participate in this system. But a profile like yours — if exposed — could be usable within it almost immediately. You would not be notified.
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

// ── BREACH HISTORY TIMELINE ──────────────────────────────────────────────
// Pudding principle: make the threat feel regular, not exceptional.
// Real incidents. Real scales. The question is not IF — it is when.

const BREACHES = [
  { year: 2021, month: 4,  name: 'Facebook',      records: 533,  detail: 'Phone numbers, names, and locations of 533M users published to a hacking forum. Data scraped before a 2019 vulnerability was patched.', url: 'https://www.wired.com/story/facebook-data-leak-500-million-users-phone-numbers/' },
  { year: 2021, month: 6,  name: 'LinkedIn',      records: 700,  detail: '700M user profiles scraped and listed for sale — 92% of total user base. Included emails, phone numbers, professional history.', url: 'https://www.privacysharks.com/exclusive-700-million-linkedin-records-for-sale-on-hacker-forum-june-22nd-2021/' },
  { year: 2021, month: 10, name: 'Twitch',        records: 0.5,  detail: '125GB of source code, creator earnings data, and internal security tools leaked by anonymous hacker. Revenue data for top streamers made public.', url: 'https://www.theverge.com/2021/10/6/22712250/twitch-hack-data-leak-amazon' },
  { year: 2022, month: 8,  name: 'Twitter/X',     records: 400,  detail: '400M unique user records including private email addresses and phone numbers, exploited via a 2021 API vulnerability.', url: 'https://techcrunch.com/2023/01/19/twitters-data-leak-response-is-a-lesson-in-how-not-to-do-cybersecurity/' },
  { year: 2023, month: 3,  name: 'OpenAI',        records: 0.1,  detail: 'A bug in the Redis client library exposed conversation titles, payment info, and the last four digits of credit cards of active users for ~9 hours.', url: 'https://thehackernews.com/2023/03/openai-reveals-redis-bug-behind-chatgpt.html' },
  { year: 2023, month: 6,  name: 'MOVEit',        records: 60,   detail: '60M+ individuals affected across hundreds of organisations — including the BBC, British Airways, and the US Department of Energy — via a zero-day in file transfer software.', url: 'https://en.wikipedia.org/wiki/2023_MOVEit_data_breach' },
  { year: 2024, month: 2,  name: 'Change Health', records: 190,  detail: '190M patient records including diagnoses, medications, and Social Security numbers. Largest US healthcare breach in history. UnitedHealth paid a $22M ransom.', url: 'https://www.wired.com/story/change-healthcare-ransomware-attack-2024/' },
  { year: 2024, month: 5,  name: 'Snowflake',     records: 50,   detail: 'Ticketmaster (560M users), Santander, AT&T, and 160+ other companies breached via stolen cloud credentials. Data sold on criminal forums.', url: 'https://www.wired.com/story/snowflake-breach-advanced-auto-parts-lendingtree/' },
  { year: 2025, month: 1,  name: 'DeepSeek',      records: 1,    detail: 'AI chat logs, API keys, backend data, and system prompts exposed in an unsecured database. One million chat histories accessible without authentication.', url: 'https://techcrunch.com/2025/01/30/deepseek-exposed-internal-database-containing-chat-histories-and-sensitive-data/' },
];

function BreachTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [active, setActive] = useState<typeof BREACHES[number] | null>(null);
  const [svgW, setSvgW] = useState(860);

  useEffect(() => {
    const obs = new ResizeObserver(e => setSvgW(e[0].contentRect.width || 860));
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const maxR = Math.max(...BREACHES.map(b => b.records));
  const minYear = 2021; const maxYear = 2025;
  const PAD_X = 24;
  const BASELINE_Y = 185;
  const chartW = svgW - PAD_X * 2;
  const SVG_H = 380;

  // Alternate breaches above/below baseline to reduce overlap
  const positioned = BREACHES.map((b, i) => {
    const xFrac = (b.year - minYear + (b.month - 1) / 12) / (maxYear - minYear);
    const x = PAD_X + xFrac * chartW;
    const maxRadius = Math.min(70, chartW * 0.09);
    const minRadius = 10;
    const r = minRadius + (b.records / maxR) * (maxRadius - minRadius);
    const above = i % 2 === 0;
    const cy = above ? BASELINE_Y - r - 12 : BASELINE_Y + r + 12;
    const isAI = b.name === 'OpenAI' || b.name === 'DeepSeek';
    return { ...b, x, r, cy, above, isAI };
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      style={{
        paddingTop: 'clamp(2.5rem, 5vw, 4rem)',
        marginTop: 'clamp(2.5rem, 5vw, 4rem)',
        marginBottom: 'clamp(3rem, 7vw, 6rem)',
      }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        Major data incidents — 2021–2025
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.65, maxWidth: 520 }}>
          Circle size = records exposed (millions). Breach is not exceptional — it is the norm. Click any incident for the source.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          {[
            { color: 'rgba(190,40,30,0.7)', label: 'AI platform' },
            { color: 'rgba(255,100,72,0.5)', label: 'Other breach' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG — responsive width */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgW} ${SVG_H}`}
          width="100%"
          style={{ display: 'block', minWidth: 480, overflow: 'visible' }}
        >
          {/* Year tick lines — faint verticals */}
          {[2021, 2022, 2023, 2024, 2025].map(yr => {
            const x = PAD_X + ((yr - minYear) / (maxYear - minYear)) * chartW;
            return (
              <g key={yr}>
                <line x1={x} y1={40} x2={x} y2={SVG_H - 40}
                  stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="2 6" />
                <text x={x} y={SVG_H - 22} textAnchor="middle"
                  style={{ fontFamily: TYPE.mono, fontSize: '11px', fill: 'rgba(26,24,20,0.35)', letterSpacing: '0.1em' }}>
                  {yr}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line x1={PAD_X} y1={BASELINE_Y} x2={PAD_X + chartW} y2={BASELINE_Y}
            stroke={PALETTE.border} strokeWidth={1} />

          {/* Circles */}
          {positioned.map((b, i) => {
            const baseRgb = b.isAI ? '190,40,30' : '200,80,50';
            const isActive = active?.name === b.name;
            return (
              <motion.g
                key={b.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 + i * 0.09, type: 'spring', stiffness: 180, damping: 16 }}
                style={{ transformOrigin: `${b.x}px ${BASELINE_Y}px`, cursor: 'pointer' }}
                onClick={() => window.open(b.url, '_blank', 'noopener noreferrer')}
                onMouseEnter={() => setActive(b)}
                onMouseLeave={() => setActive(null)}
              >
                {/* Stem */}
                <line
                  x1={b.x} y1={BASELINE_Y}
                  x2={b.x} y2={b.above ? b.cy + b.r : b.cy - b.r}
                  stroke={`rgba(${baseRgb},0.2)`} strokeWidth={1} strokeDasharray="2 3"
                />
                {/* Outer glow on hover */}
                {isActive && (
                  <circle cx={b.x} cy={b.cy} r={b.r + 6}
                    fill="none" stroke={`rgba(${baseRgb},0.2)`} strokeWidth={1.5} />
                )}
                {/* Main circle */}
                <circle
                  cx={b.x} cy={b.cy} r={b.r}
                  fill={`rgba(${baseRgb},${isActive ? 0.22 : 0.1})`}
                  stroke={`rgba(${baseRgb},${isActive ? 0.9 : 0.45})`}
                  strokeWidth={b.isAI ? 1.5 : 1}
                />
                {/* Centre dot for AI platforms */}
                {b.isAI && <circle cx={b.x} cy={b.cy} r={3} fill={`rgba(${baseRgb},0.8)`} />}
                {/* Name label — inside if large enough, outside if small */}
                {b.r >= 22 ? (
                  <text x={b.x} y={b.cy + 4} textAnchor="middle"
                    style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: `rgba(${baseRgb},0.9)`, letterSpacing: '0.08em', pointerEvents: 'none' }}>
                    {b.name}
                  </text>
                ) : (
                  <text x={b.x} y={b.above ? b.cy - b.r - 6 : b.cy + b.r + 18} textAnchor="middle"
                    style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: `rgba(${baseRgb},0.75)`, letterSpacing: '0.08em', pointerEvents: 'none' }}>
                    {b.name}
                  </text>
                )}
                {/* Record count */}
                {b.r >= 28 && (
                  <text x={b.x} y={b.cy + 17} textAnchor="middle"
                    style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: `rgba(${baseRgb},0.55)`, pointerEvents: 'none' }}>
                    {b.records >= 1 ? `${b.records}M` : '<1M'}
                  </text>
                )}
                {/* Click indicator */}
                <text x={b.x + b.r - 4} y={b.cy - b.r + 10} textAnchor="middle"
                  style={{ fontFamily: TYPE.mono, fontSize: '9px', fill: `rgba(${baseRgb},0.5)`, pointerEvents: 'none' }}>
                  ↗
                </text>
              </motion.g>
            );
          })}
        </svg>

        {/* Detail panel — appears below chart when active */}
        <AnimatePresence>
          {active && (
            <motion.div
              key={active.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              style={{
                marginTop: '0.75rem',
                padding: '1.25rem 1.5rem',
                background: PALETTE.bgPanel,
                border: `1px solid ${(active.name === 'OpenAI' || active.name === 'DeepSeek') ? PALETTE.red : PALETTE.border}`,
                borderLeft: `3px solid ${(active.name === 'OpenAI' || active.name === 'DeepSeek') ? PALETTE.red : PALETTE.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                gap: '1.5rem', flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: (active.name === 'OpenAI' || active.name === 'DeepSeek') ? PALETTE.red : PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {active.name} — {new Date(active.year, active.month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </p>
                <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.7 }}>
                  {active.detail}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {active.records >= 1 && (
                  <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: PALETTE.red, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.25rem' }}>
                    {active.records}M
                  </p>
                )}
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>records exposed</p>
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.15em',
                    color: PALETTE.redMuted, textTransform: 'uppercase',
                    textDecoration: 'none', borderBottom: `1px solid ${PALETTE.redMuted}60`,
                    paddingBottom: '1px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  Source ↗
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p style={{
        fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted,
        lineHeight: 1.7, maxWidth: 560, marginTop: '1.75rem',
        fontStyle: 'italic', borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1rem',
      }}>
      The question is not whether a breach could expose AI conversation data. The pattern, historically, is consistent. Which breach, and when, is what remains unknown.
      </p>
    </motion.div>
  );
}



export default function RiskPage({ results, setPage }: { results: AnalysisResult; setPage?: (p: string) => void }) {
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
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}
      >
        <ActLabel roman="II" title="The Inference" pageLabel="04 / Risk" />
        <ThreadSentence>What this record makes possible — without leaving the system, without your knowledge.</ThreadSentence>

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
          Such systems exist today.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)',
            color: PALETTE.inkMuted, lineHeight: 1.8,
            maxWidth: 560,
          }}
        >
          Each scenario is built from your actual data. None of this has happened. OpenAI does not sell your data. These scenarios show what becomes possible if it is ever breached, subpoenaed, or acquired. The systems that would process it exist now. The legal frameworks that govern them permit what you are about to read.
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


      {/* BREACH TIMELINE */}
      <BreachTimeline />

      {/* CLOSING */}
      <PageFooter
        statement="These scenarios are grounded in documented practice. Such systems exist, operate legally, and are commercially incentivised."
        followOn="These scenarios assume the record leaves the system. The prior question is whether it can ever be fully removed. Current evidence suggests it cannot — even by those who hold it."
        navItems={[
          { page: 'permanent', act: 'ACT III / 05', label: 'Why it is not easily removed', body: 'Gradient descent has no simple reverse function. Deletion removes your account. It does not straightforwardly remove what the model may have learned.' },
          { page: 'terms',     act: 'ACT III / 06', label: 'What you agreed to',       body: 'The terms that authorised this — and how they changed after you signed.' },
          { page: 'understand', act: 'ACT IV / 08', label: 'How inference works',      body: 'Watch the extraction happen on your own words.' },
        ]}
        endLabel="End of risk assessment."
        setPage={(p) => setPage?.(p)}
      />

    </div>
  );
}
