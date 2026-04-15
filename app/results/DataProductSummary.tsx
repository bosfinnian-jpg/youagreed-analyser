'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

// ============================================================================
// TYPES
// ============================================================================
interface DataProductSummaryProps {
  analysis: DeepAnalysis;
}

interface BrokerProfile {
  subjectLine: string;
  ageSignal: string;
  locationSignal: string;
  commercialValue: string;
  primarySegments: string[];
  keyVulnerabilities: string[];
  optimalTargetingWindow: string;
  inferredLifeEvents: string[];
  dependencyLevel: string;
  narrativeParagraph: string;
}

// ============================================================================
// BUILD THE PROMPT
// ============================================================================
function buildPrompt(analysis: DeepAnalysis): string {
  const { commercialProfile, dependency, lifeEvents, emotionalTimeline, findings, mostVulnerablePeriod, nighttimeRatio, avgAnxiety, topicsByPeriod, typeBreakdown } = analysis;

  const topSegments = commercialProfile.segments.slice(0, 3).map(s => `${s.label} (confidence: ${s.confidence}%)`).join(', ');
  const topLifeEvents = lifeEvents.slice(0, 3).map(e => `${e.label} (~${e.approximateDate})`).join(', ');
  const topName = findings.personalInfo.names[0]?.name || 'Unknown';
  const topLocation = findings.personalInfo.locations[0]?.location || 'Unknown';
  const recentTopics = topicsByPeriod.recent.join(', ');
  const earlyTopics = topicsByPeriod.early.join(', ');
  const emotionalTrend = emotionalTimeline.emotionalTrend;
  const crisisCount = emotionalTimeline.crisisPeriods.length;
  const confessionalCount = typeBreakdown['confessional'] || 0;
  const validationCount = typeBreakdown['validation'] || 0;
  const trajectoryLabel = dependency.trajectory === 'increasing' ? `${dependency.messagesPerWeekRecent.toFixed(1)} messages/week recently vs ${dependency.messagesPerWeekEarly.toFixed(1)} initially` : `${dependency.messagesPerWeekEarly.toFixed(1)} messages/week initially, now ${dependency.messagesPerWeekRecent.toFixed(1)}`;

  return `You are a data analyst writing an internal profile document for a commercial data broker. Your audience is advertising buyers and risk assessment platforms. Write in a cold, clinical, third-person voice — the voice of someone who has reduced a human being to a data asset. No empathy. No softening. Pure commercial analysis.

Write a profile for this data subject. Structure it exactly as follows — no deviations:

SUBJECT PROFILE
Reference: [generate a plausible-looking ID like DS-2024-XXXXXX]
Classification: [one of: STANDARD / ELEVATED / PREMIUM based on data richness]
Commercial value rating: [LOW / MEDIUM / HIGH / VERY HIGH]

DATA SUMMARY
Messages analysed: ${analysis.totalUserMessages.toLocaleString()}
Timespan: ${analysis.timespan.days} days
Dependency trajectory: ${trajectoryLabel}
Emotional trend: ${emotionalTrend}
Crisis periods detected: ${crisisCount}

SEGMENT ASSIGNMENT
${topSegments || 'General consumer'}

INFERRED PROFILE
Name signal: ${topName}
Location signal: ${topLocation}
Recent preoccupations: ${recentTopics}
Early usage topics: ${earlyTopics}
Detected life events: ${topLifeEvents || 'None identified'}

BEHAVIOURAL INDICATORS
- Confessional messages: ${confessionalCount} (subject shares private information without prompting)
- Validation-seeking messages: ${validationCount} (subject requires external reassurance)
- Late-night usage ratio: ${Math.round(nighttimeRatio * 100)}% of messages sent midnight-5am
- Primary vulnerability window: ${mostVulnerablePeriod}
- Average anxiety signal: ${avgAnxiety.toFixed(1)}/10
- Dependency score: ${dependency.dependencyScore}/100

COMMERCIAL RECOMMENDATION
Write 3-4 sentences. Describe this person as a commercial targeting opportunity. What makes them valuable? What products/services should be targeted at them and when? What emotional state makes them most responsive? Write as if you are advising an advertiser on maximising revenue from this individual. Be specific to their data. Be cold. Be accurate.

End with exactly this line:
"Subject has not been informed of this assessment."`;
}

// ============================================================================
// STREAMING TYPEWRITER
// ============================================================================
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started || !text) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 12);
    return () => clearInterval(interval);
  }, [started, text]);

  return <span>{displayed}{started && displayed.length < text.length ? '█' : ''}</span>;
}

// ============================================================================
// PROFILE FIELD ROW
// ============================================================================
function ProfileRow({ label, value, redValue, delay }: { label: string; value: string; redValue?: boolean; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ delay: delay * 0.08 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: '1rem',
        padding: '0.6rem 0',
        borderBottom: `1px solid ${PALETTE.border}`,
      }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', paddingTop: '2px' }}>
        {label}
      </p>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: redValue ? PALETTE.red : PALETTE.ink, letterSpacing: '0.04em' }}>
        {value}
      </p>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DataProductSummary({ analysis }: DataProductSummaryProps) {
  const [profile, setProfile] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  useEffect(() => {
    if (isInView && !triggered) {
      setTriggered(true);
      generate();
    }
  }, [isInView]);

  const generate = async () => {
    setLoading(true);
    try {
      const prompt = buildPrompt(analysis);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data?.content?.[0]?.text?.trim() || '';
      setProfile(text);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  // Parse the structured profile for display
  const lines = profile.split('\n').filter(l => l.trim());

  // Pre-computed fields from analysis (shown immediately, before AI loads)
  const { commercialProfile, dependency, lifeEvents, findings, nighttimeRatio, mostVulnerablePeriod } = analysis;
  const topSegment = commercialProfile.segments[0];
  const refId = useRef(`DS-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`).current;

  return (
    <div ref={ref}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Data broker profile
          </p>
          <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.01em' }}>
            You, as a commercial product.
          </h2>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, letterSpacing: '0.12em' }}>REF: {refId}</p>
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint, letterSpacing: '0.12em', marginTop: '2px' }}>
            CLASSIFICATION: {commercialProfile.overallValue.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Immediate data fields — no waiting */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ProfileRow label="Commercial value" value={
          commercialProfile.overallValue === 'premium' ? 'HIGH — premium targeting candidate' :
          commercialProfile.overallValue === 'elevated' ? 'MEDIUM — elevated engagement profile' :
          'STANDARD — general consumer'
        } redValue={commercialProfile.overallValue === 'premium'} delay={1} />

        <ProfileRow label="Primary segment"
          value={topSegment ? `${topSegment.label} (${topSegment.confidence}% confidence)` : 'General consumer'}
          redValue={topSegment?.confidence > 60}
          delay={2} />

        {commercialProfile.segments[1] && (
          <ProfileRow label="Secondary segment"
            value={`${commercialProfile.segments[1].label} (${commercialProfile.segments[1].confidence}% confidence)`}
            delay={3} />
        )}

        <ProfileRow label="Vulnerability index"
          value={`${commercialProfile.vulnerabilityIndex}/100`}
          redValue={commercialProfile.vulnerabilityIndex > 60}
          delay={4} />

        <ProfileRow label="Optimal targeting window"
          value={mostVulnerablePeriod}
          delay={5} />

        <ProfileRow label="Late-night exposure"
          value={`${Math.round(nighttimeRatio * 100)}% of messages sent midnight–5am`}
          redValue={nighttimeRatio > 0.1}
          delay={6} />

        <ProfileRow label="Dependency score"
          value={`${dependency.dependencyScore}/100 — ${dependency.trajectory === 'increasing' ? 'usage accelerating' : dependency.trajectory === 'stable' ? 'stable usage pattern' : 'usage declining'}`}
          redValue={dependency.dependencyScore > 60}
          delay={7} />

        {lifeEvents.slice(0, 2).map((event, i) => (
          <ProfileRow
            key={event.type}
            label={i === 0 ? 'Inferred life events' : ''}
            value={`${event.label} — ${event.approximateDate}`}
            redValue={event.severity === 'high'}
            delay={8 + i}
          />
        ))}

        {topSegment && (
          <ProfileRow
            label="Recommended ad categories"
            value={topSegment.adCategories.slice(0, 3).join(' / ')}
            delay={10}
          />
        )}
      </div>

      {/* Evidence for primary segment */}
      {topSegment?.evidence && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.9 }}
          style={{
            padding: '1rem',
            background: PALETTE.bgElevated,
            borderLeft: `2px solid ${PALETTE.redFaint}`,
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Segment evidence
          </p>
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkMuted, letterSpacing: '0.04em' }}>
            {topSegment.evidence}
          </p>
        </motion.div>
      )}

      {/* AI-generated commercial recommendation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        style={{
          padding: '1.5rem',
          background: PALETTE.bgElevated,
          border: `1px solid ${PALETTE.border}`,
          borderTop: `2px solid ${PALETTE.red}`,
          position: 'relative',
        }}
      >
        <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>
          Commercial assessment
        </p>

        {loading ? (
          <div>
            <motion.p
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}
            >
              Generating profile
            </motion.p>
            {/* Skeleton lines */}
            {[0.8, 1, 0.6, 0.9].map((w, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                style={{ height: '10px', background: PALETTE.inkGhost, borderRadius: '2px', marginBottom: '8px', width: `${w * 100}%` }}
              />
            ))}
          </div>
        ) : error ? (
          <p style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint }}>Profile generation unavailable.</p>
        ) : profile ? (
          <div>
            {/* Show the commercial recommendation section from the AI output */}
            {(() => {
              const recommendationStart = profile.indexOf('COMMERCIAL RECOMMENDATION');
              const recommendationText = recommendationStart > -1
                ? profile.slice(recommendationStart + 'COMMERCIAL RECOMMENDATION'.length).trim()
                : profile;

              const paragraphs = recommendationText.split('\n').filter(l => l.trim() && !l.includes('Subject has not been informed'));
              const finalLine = 'Subject has not been informed of this assessment.';

              return (
                <>
                  {paragraphs.map((para, i) => (
                    <p key={i} style={{
                      fontFamily: TYPE.mono, fontSize: '10px',
                      color: PALETTE.inkMuted, lineHeight: 1.75,
                      letterSpacing: '0.02em', marginBottom: '0.8rem',
                    }}>
                      {para}
                    </p>
                  ))}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    style={{
                      fontFamily: TYPE.mono, fontSize: '10px',
                      color: PALETTE.red, letterSpacing: '0.06em',
                      marginTop: '1rem', borderTop: `1px solid ${PALETTE.border}`,
                      paddingTop: '1rem',
                    }}
                  >
                    {finalLine}
                  </motion.p>
                </>
              );
            })()}
          </div>
        ) : null}
      </motion.div>

      {/* All segments breakdown */}
      {commercialProfile.segments.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          style={{ marginTop: '1.5rem' }}
        >
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
            All assigned segments
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {commercialProfile.segments.map((seg, i) => (
              <div
                key={seg.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 1fr',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.7rem 0',
                  borderBottom: `1px solid ${PALETTE.border}`,
                }}
              >
                <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.08em', color: PALETTE.inkMuted }}>{seg.label}</p>
                <div style={{ position: 'relative', height: '2px', background: PALETTE.bgElevated' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: seg.confidence / 100 } : {}}
                    transition={{ duration: 1.2, delay: 1.3 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      position: 'absolute', inset: 0, transformOrigin: 'left',
                      background: seg.confidence > 70 ? PALETTE.red : seg.confidence > 40 ? PALETTE.amber : PALETTE.inkFaint,
                    }}
                  />
                </div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '8px', color: seg.confidence > 70 ? PALETTE.red : PALETTE.inkFaint }}>
                  {seg.confidence}% confidence
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
