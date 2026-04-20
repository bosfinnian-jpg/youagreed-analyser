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
  topics.forEach(t => {
    const cat = (t.category || 'unknown').replace(/_/g, ' ');
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
}

function getPeakHour(dist: number[]): number {
  if (!dist || dist.length === 0) return -1;
  return dist.indexOf(Math.max(...dist));
}

function formatHour(h: number): string {
  if (h < 0) return 'unknown';
  return String(h).padStart(2, '0') + ':00';
}

// Fictional but plausible buyer names for the auction
const BUYER_POOL = [
  'PharmaTarget Ltd', 'InsureMetrics Inc', 'TalentScope AI', 'AdVantage DSP',
  'BehaviourGraph plc', 'SegmentIQ', 'ProfileSync Corp', 'DataNexus Group',
  'AudienceForge', 'PredictiveEdge Ltd', 'NeuralBid Systems', 'InferenceHub',
];

// ============================================================================
// SCENARIO GENERATION — fully personalised
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

  const scenarios: RiskScenario[] = [];

  // INSURANCE
  const insuranceRelevance = sensitiveCount * 3 + (anxietyScore > 3 ? 20 : 0) + highSevEvents.length * 10 + (nightPct > 10 ? 8 : 0);
  scenarios.push({
    id: 'insurance',
    severity: insuranceRelevance > 25 ? 'critical' : insuranceRelevance > 10 ? 'high' : 'medium',
    relevance: insuranceRelevance,
    title: 'An insurer you have never contacted already has your risk profile.',
    subtitle: sensitiveCount > 0
      ? 'You made ' + sensitiveCount + ' sensitive disclosure' + (sensitiveCount > 1 ? 's' : '') + '. ' + (topCats.length > 0 ? 'Categories include: ' + topCats.join(', ') + '.' : '')
      : 'Your behavioural patterns alone are sufficient for risk modelling.',
    body: anxietyScore > 3
      ? 'Your average anxiety score across all messages is ' + anxietyScore.toFixed(1) + '/10. Underwriting algorithms treat sustained anxiety indicators as a predictor of future claims. Combined with ' + (nightPct > 5 ? nightPct + '% late-night usage (a secondary stress marker)' : 'your disclosure frequency') + ', your profile would trigger elevated risk classification in automated systems.'
      : 'Even without direct mental health disclosures, your usage patterns ' + (depScore > 50 ? '(dependency score: ' + depScore + '/100) ' : '') + 'and topic distribution provide sufficient signal for actuarial modelling. Insurers do not require a diagnosis. They require a probability.',
    dataPoints: [
      { label: 'Sensitive disclosures', value: String(sensitiveCount), alarming: sensitiveCount > 5 },
      { label: 'Anxiety indicator', value: anxietyScore > 0 ? anxietyScore.toFixed(1) + '/10' : 'Not scored', alarming: anxietyScore > 4 },
      { label: 'Late-night ratio', value: nightPct + '%', alarming: nightPct > 10 },
      { label: 'High-severity events', value: String(highSevEvents.length), alarming: highSevEvents.length > 0 },
    ],
    precedent: {
      source: 'FTC v. BetterHelp, 2023',
      detail: 'BetterHelp shared therapy status data with Facebook and Snapchat for ad targeting. Fine: $7.8 million. Users had been told their data was private.',
    },
  });

  // EMPLOYMENT
  const employRelevance = (totalMsgs > 2000 ? 15 : totalMsgs > 500 ? 8 : 0) + themes.length * 5 + (depScore > 50 ? 12 : 0) + (anxietyScore > 3 ? 10 : 0);
  const careerEvents = lifeEvents.filter(e => ['job_loss', 'job_search'].includes(e.type));
  scenarios.push({
    id: 'employment',
    severity: employRelevance > 25 ? 'critical' : employRelevance > 10 ? 'high' : 'medium',
    relevance: employRelevance,
    title: 'You did not get the interview. You were never told why.',
    subtitle: careerEvents.length > 0
      ? careerEvents.length + ' career-related life event' + (careerEvents.length > 1 ? 's' : '') + ' detected. AI screening tools flag this as instability.'
      : 'Your writing patterns are sufficient for personality inference. No interview required.',
    body: 'You submitted ' + totalMsgs.toLocaleString('en-GB') + ' messages over ' + (r.timespan?.days || '?') + ' days. ' + (themes.length > 0 ? 'Your dominant topics (' + themes.join(', ') + ') ' : 'Your topic distribution ') + 'form a personality signature. Humantic AI claims 78\u201385% accuracy in personality profiling from text alone. ' + (anxietyScore > 3 ? 'Your anxiety indicators (avg ' + anxietyScore.toFixed(1) + '/10) would flag as emotional volatility in screening models.' : 'Volume and consistency patterns alone indicate work habits and reliability.') + (depScore > 60 ? ' Your dependency score (' + depScore + '/100) suggests compulsive tool usage \u2014 a flag for productivity screening.' : ''),
    dataPoints: [
      { label: 'Messages analysed', value: totalMsgs.toLocaleString('en-GB'), alarming: totalMsgs > 2000 },
      { label: 'Career events', value: String(careerEvents.length), alarming: careerEvents.length > 0 },
      { label: 'Dependency score', value: depScore + '/100', alarming: depScore > 50 },
      { label: 'Top themes', value: themes.slice(0, 2).join(', ') || 'None flagged', alarming: false },
    ],
    precedent: {
      source: 'Mobley v. Workday, 2024',
      detail: 'A US federal court allowed a discrimination case to proceed against Workday after a plaintiff was rejected from 100+ jobs by its AI screening tools.',
    },
  });

  // TARGETING
  const segments = r.commercialProfile?.segments || [];
  const targetRelevance = segments.length * 8 + (nightPct > 5 ? 10 : 0) + sensitiveCount * 2;
  scenarios.push({
    id: 'targeting',
    severity: targetRelevance > 25 ? 'critical' : targetRelevance > 10 ? 'high' : 'medium',
    relevance: targetRelevance,
    title: 'You were assigned to ' + (segments.length || 'multiple') + ' advertising segment' + (segments.length === 1 ? '' : 's') + '. You did not know ' + (segments.length === 1 ? 'it' : 'they') + ' existed.',
    subtitle: segments.length > 0
      ? 'Segments: ' + segments.slice(0, 3).map(s => s.label.replace(/_/g, ' ')).join(', ') + (segments.length > 3 ? ' (+' + (segments.length - 3) + ' more)' : '') + '.'
      : 'Behavioural patterns are sufficient for segment assignment without explicit disclosures.',
    body: (nightPct > 5 ? 'You are most vulnerable between midnight and 5am (' + nightPct + '% of your messages). Advertisers purchase these windows specifically because emotional defences are lowest. ' : '') + (segments.length > 0 ? 'Your profile matches ' + segments.length + ' IAB real-time bidding categories. Each time you load a webpage, your segment data enters an auction that completes in under 100 milliseconds. ' : '') + 'The buyer receives your behavioural profile' + (homeLoc ? ', your approximate location (' + homeLoc.location + ')' : '') + ', and a vulnerability score. You receive a targeted advertisement.',
    dataPoints: [
      { label: 'Assigned segments', value: String(segments.length), alarming: segments.length > 3 },
      { label: 'Vulnerability window', value: nightPct > 5 ? '00:00\u201305:00 (' + nightPct + '%)' : 'Not detected', alarming: nightPct > 10 },
      { label: 'Location exposed', value: homeLoc ? homeLoc.location : 'Not detected', alarming: !!homeLoc },
      { label: 'Named contacts', value: String(nameCount), alarming: nameCount > 3 },
    ],
    precedent: {
      source: 'FTC v. Oracle (now Raimondo v. Oracle), 2024',
      detail: 'Oracle settled for $115 million over tracking and selling user data from platforms users never interacted with directly.',
    },
  });

  // BREACH
  const breachRelevance = (r.privacyScore || 0) * 0.5 + nameCount * 3 + locCount * 4 + sensitiveCount * 2;
  scenarios.push({
    id: 'breach',
    severity: breachRelevance > 30 ? 'critical' : breachRelevance > 15 ? 'high' : 'medium',
    relevance: breachRelevance,
    title: 'None of this requires intent. One breach is enough.',
    subtitle: 'Your profile contains ' + nameCount + ' named individual' + (nameCount === 1 ? '' : 's') + ', ' + locCount + ' location' + (locCount === 1 ? '' : 's') + ', and ' + sensitiveCount + ' sensitive disclosure' + (sensitiveCount === 1 ? '' : 's') + '. All would be exposed.',
    body: 'A breach does not release a file with your name at the top. It releases a behavioural signature, a location history, a social graph, and a pattern of emotional disclosure \u2014 none of which can be changed after exposure. ' + (nameCount > 0 ? 'The ' + nameCount + ' people you named are also exposed. Their records are now linked to yours. ' : '') + (r.privacyScore >= 60 ? 'Your exposure index (' + r.privacyScore + '/100) places you in the highest-risk category for identity reconstruction from leaked behavioural data.' : 'Even partial exposure of your behavioural patterns is sufficient for re-identification.'),
    dataPoints: [
      { label: 'Exposure index', value: r.privacyScore + '/100', alarming: r.privacyScore >= 60 },
      { label: 'People exposed', value: String(nameCount), alarming: nameCount > 0 },
      { label: 'Locations exposed', value: String(locCount), alarming: locCount > 0 },
      { label: 'Sensitive records', value: String(sensitiveCount), alarming: sensitiveCount > 0 },
    ],
    precedent: {
      source: 'Equifax breach, 2017',
      detail: '148 million people exposed. Most did not know Equifax held their data. The company simply had it.',
    },
  });

  return scenarios.sort((a, b) => b.relevance - a.relevance);
}

// ============================================================================
// RTB AUCTION SIMULATION
// ============================================================================

interface AuctionBid {
  buyer: string;
  amount: number;
  segment: string;
  timestamp: number;
}

function RTBAuction({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [phase, setPhase] = useState<'idle' | 'running' | 'sold'>('idle');
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [winner, setWinner] = useState<AuctionBid | null>(null);
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
    setPhase('running');
    setBids([]);
    setElapsed(0);
    setWinner(null);

    const allBids: AuctionBid[] = [];
    const usedBuyers = new Set<string>();
    const totalBids = 6 + Math.floor(Math.random() * 4);

    let bidIndex = 0;
    intervalRef.current = setInterval(() => {
      if (bidIndex >= totalBids) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Pick winner
        const sorted = [...allBids].sort((a, b) => b.amount - a.amount);
        const w = sorted[0] || null;
        setWinner(w);
        setPhase('sold');
        return;
      }

      // Generate a bid
      let buyer = BUYER_POOL[Math.floor(Math.random() * BUYER_POOL.length)];
      while (usedBuyers.has(buyer) && usedBuyers.size < BUYER_POOL.length) {
        buyer = BUYER_POOL[Math.floor(Math.random() * BUYER_POOL.length)];
      }
      usedBuyers.add(buyer);

      const seg = segmentLabels[Math.floor(Math.random() * segmentLabels.length)];
      const baseAmount = 0.002 + Math.random() * 0.012;
      const bid: AuctionBid = {
        buyer,
        amount: parseFloat(baseAmount.toFixed(4)),
        segment: seg,
        timestamp: bidIndex * 120 + Math.floor(Math.random() * 80),
      };

      allBids.push(bid);
      setBids(prev => [...prev, bid]);
      setElapsed(bid.timestamp);
      bidIndex++;
    }, 700);
  }, [segmentLabels]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const sevColor = PALETTE.red;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: '1px solid ' + PALETTE.border, position: 'relative' }}
    >
      {/* Header */}
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: sevColor, textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.7 }}>
        {"Real-time bidding simulation"}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {"Your profile, at auction."}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.65, marginBottom: '2rem', maxWidth: 560 }}>
        {"Every time you load a webpage, a process like this runs. Your behavioural profile enters an auction. Advertisers bid. The winner gets to target you. The entire transaction takes less than 100 milliseconds. You are not notified."}
      </p>

      {/* Auction lot card */}
      <div style={{ background: PALETTE.bgElevated, border: '1px solid ' + PALETTE.border, padding: '1.5rem 2rem', marginBottom: '1.5rem', maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '4px' }}>{"Lot item"}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '0.95rem', color: PALETTE.ink }}>{"USR-" + String(results.privacyScore).padStart(3, '0') + "-" + String(totalMsgs % 10000).padStart(4, '0')}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '4px' }}>{"Quality"}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '0.95rem', color: results.privacyScore >= 70 ? sevColor : PALETTE.ink }}>
              {results.privacyScore >= 70 ? 'PREMIUM' : results.privacyScore >= 40 ? 'STANDARD' : 'SPARSE'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {segmentLabels.map(seg => (
            <span key={seg} style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.1em', color: sevColor, padding: '3px 8px', border: '1px solid ' + sevColor + '30', textTransform: 'capitalize' }}>{seg}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          {[
            { l: 'Data points', v: totalMsgs.toLocaleString('en-GB') },
            { l: 'Location', v: homeLoc ? homeLoc.location : 'Inferred' },
            { l: 'Vulnerability', v: nightPct > 5 ? nightPct + '% nocturnal' : 'Standard' },
          ].map(item => (
            <div key={item.l}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '2px' }}>{item.l}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '0.85rem', color: PALETTE.ink }}>{item.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auction trigger / display */}
      {phase === 'idle' && (
        <motion.button
          onClick={runAuction}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: PALETTE.bg, background: sevColor, border: 'none', padding: '0.8rem 2rem', cursor: 'pointer', display: 'block' }}
        >
          {"Run auction"}
        </motion.button>
      )}

      {(phase === 'running' || phase === 'sold') && (
        <div style={{ maxWidth: 600 }}>
          {/* Timer bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
              {phase === 'running' ? 'Bidding in progress' : 'Auction complete'}
            </p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: phase === 'sold' ? sevColor : PALETTE.inkMuted }}>
              {elapsed + 'ms'}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ height: '2px', background: PALETTE.ink + '08', marginBottom: '1.2rem', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              animate={{ scaleX: phase === 'sold' ? 1 : 0.7 }}
              transition={{ duration: 0.5 }}
              style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: phase === 'sold' ? sevColor : PALETTE.inkMuted }}
            />
          </div>

          {/* Bid feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: '1.5rem' }}>
            <AnimatePresence>
              {bids.map((bid, i) => (
                <motion.div
                  key={bid.buyer + i}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid ' + PALETTE.border }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '7px', color: PALETTE.inkFaint, width: '2.5rem' }}>{bid.timestamp + 'ms'}</span>
                    <span style={{ fontFamily: TYPE.serif, fontSize: '0.88rem', color: PALETTE.ink }}>{bid.buyer}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '7px', color: PALETTE.inkFaint, textTransform: 'capitalize' }}>{bid.segment}</span>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '0.9rem', color: sevColor, letterSpacing: '0.04em', width: '4.5rem', textAlign: 'right' }}>
                      {'\u00a3' + bid.amount.toFixed(4)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Winner announcement */}
          <AnimatePresence>
            {phase === 'sold' && winner && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{ background: sevColor + '08', border: '1px solid ' + sevColor + '25', padding: '1.2rem 1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em', color: sevColor, textTransform: 'uppercase', marginBottom: '0.4rem' }}>{"SOLD"}</p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.ink }}>{winner.buyer}</p>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, marginTop: '0.3rem', textTransform: 'capitalize' }}>
                      {"Segment: " + winner.segment}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '1.3rem', color: sevColor, letterSpacing: '0.04em' }}>
                      {'\u00a3' + winner.amount.toFixed(4)}
                    </p>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '7px', color: PALETTE.inkFaint, marginTop: '0.2rem' }}>
                      {elapsed + 'ms elapsed'}
                    </p>
                  </div>
                </div>
                <div style={{ height: '1px', background: PALETTE.border, margin: '1rem 0' }} />
                <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.12em', color: PALETTE.inkFaint, lineHeight: 1.6 }}>
                  {"The buyer now receives: your behavioural profile, your segment classifications, your vulnerability window" + (homeLoc ? ", your approximate location (" + homeLoc.location + ")" : "") + ", and your emotional pattern data. You were not consulted. This transaction is legal."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset */}
          {phase === 'sold' && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => { setPhase('idle'); setBids([]); setElapsed(0); setWinner(null); }}
              style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: PALETTE.inkFaint, background: 'none', border: '1px solid ' + PALETTE.border, padding: '0.5rem 1rem', cursor: 'pointer', marginTop: '1rem' }}
            >
              {"Run again"}
            </motion.button>
          )}
        </div>
      )}
    </motion.section>
  );
}

// ============================================================================
// SCENARIO CARD
// ============================================================================

function ScenarioCard({ scenario, index }: { scenario: RiskScenario; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const [expanded, setExpanded] = useState(false);

  const sevColors: Record<string, string> = {
    critical: PALETTE.red,
    high: PALETTE.amber || 'rgba(255,179,0,0.8)',
    medium: PALETTE.inkMuted,
    low: PALETTE.inkFaint,
  };
  const sc = sevColors[scenario.severity] || PALETTE.inkFaint;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      onClick={() => setExpanded(!expanded)}
      style={{ background: PALETTE.bgPanel, padding: '1.5rem 2rem', borderLeft: '3px solid ' + sc, cursor: 'pointer', transition: 'border-color 0.2s' }}
    >
      {/* Top line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
        <span style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.16em', color: sc, textTransform: 'uppercase', padding: '2px 6px', border: '1px solid ' + sc + '40' }}>
          {scenario.severity}
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          {scenario.id.replace(/_/g, ' ')}
        </span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint, marginLeft: 'auto' }}>
          {expanded ? '\u2212' : '+'}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', fontWeight: 400, color: PALETTE.ink, lineHeight: 1.35, marginBottom: '0.5rem' }}>
        {scenario.title}
      </h3>

      {/* Subtitle — always visible, personalised */}
      <p style={{ fontFamily: TYPE.serif, fontSize: '0.88rem', color: PALETTE.inkMuted, lineHeight: 1.6 }}>
        {scenario.subtitle}
      </p>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Data points grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: PALETTE.border, margin: '1.2rem 0' }}>
              {scenario.dataPoints.map(dp => (
                <div key={dp.label} style={{ background: PALETTE.bgElevated, padding: '0.8rem' }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '3px' }}>{dp.label}</p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '0.9rem', color: dp.alarming ? PALETTE.red : PALETTE.ink }}>{dp.value}</p>
                </div>
              ))}
            </div>

            {/* Body */}
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.7, marginBottom: '1.2rem' }}>
              {scenario.body}
            </p>

            {/* Precedent */}
            <div style={{ padding: '1rem', background: PALETTE.bgElevated, borderRadius: '2px' }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {scenario.precedent.source}
              </p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '0.85rem', fontStyle: 'italic', color: PALETTE.inkFaint, lineHeight: 1.6 }}>
                {scenario.precedent.detail}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
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

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem) clamp(1.5rem, 4vw, 2.5rem)', borderBottom: '1px solid ' + PALETTE.border }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}
        >
          {"04 \u2014 Risk assessment"}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1rem', maxWidth: '70%' }}
        >
          {"This is not theoretical."}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560 }}
        >
          {"Based on " + totalMsgs.toLocaleString('en-GB') + " messages, your profile triggers " + activeCount + " active risk scenario" + (activeCount === 1 ? '' : 's') + ". The following describes systems that are operational today. Each scenario uses your actual data."}
        </motion.p>
      </div>

      {/* RTB Auction — the centrepiece */}
      <RTBAuction results={results} />

      {/* Scenario cards — ranked by relevance */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {scenarios.map((scenario, i) => (
          <ScenarioCard key={scenario.id} scenario={scenario} index={i} />
        ))}
      </div>

      {/* Closing */}
      <div style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)' }}>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '1px', background: PALETTE.ink, transformOrigin: 'left', marginBottom: '2rem', opacity: 0.15 }}
        />
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 520, opacity: 0.55 }}>
          {"These scenarios are not speculative. They describe systems that are operational, legal, and commercially incentivised. The data that powers them was generated by you, collected without meaningful consent, and cannot be recalled."}
        </p>
        <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '2rem', opacity: 0.25 }}>
          {"End of risk assessment."}
        </p>
      </div>
    </div>
  );
}
