'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

// ============================================================================
// RECOMMENDATION LOGIC
// ============================================================================

interface Recommendation {
  id: string;
  title: string;
  body: string;
  severity: 'high' | 'medium' | 'low';
}

function generateRecommendations(analysis: DeepAnalysis): Recommendation[] {
  const recs: Recommendation[] = [];
  const {
    typeBreakdown,
    nighttimeRatio,
    dependency,
    lifeEvents,
    findings,
    totalUserMessages,
    avgAnxiety,
  } = analysis;

  const confessionalCount = typeBreakdown['confessional'] || 0;
  const validationCount = typeBreakdown['validation'] || 0;
  const names = findings.personalInfo.names || [];
  const locations = findings.personalInfo.locations || [];

  if (confessionalCount > 3) {
    recs.push({
      id: 'confessional',
      title: 'Stop treating AI as a confidant',
      body: `You made ${confessionalCount} confessional disclosures — private admissions, secrets, things you say you haven't told anyone else. Every one is stored permanently and cannot be deleted from trained model weights.`,
      severity: 'high',
    });
  }

  if (names.length > 2) {
    recs.push({
      id: 'names',
      title: 'Remove other people from your prompts',
      body: `You named ${names.length} individuals (${names.slice(0, 3).map((n: any) => n.name).join(', ')}${names.length > 3 ? ', and others' : ''}). Their data is now linked to your behavioural profile without their knowledge or consent.`,
      severity: 'high',
    });
  }

  if (nighttimeRatio > 0.08) {
    recs.push({
      id: 'latenight',
      title: 'Avoid late-night sessions',
      body: `${Math.round(nighttimeRatio * 100)}% of your messages were sent between midnight and 5am. Messages in this window show elevated emotional disclosure and reduced self-censorship — producing the most exploitable data.`,
      severity: 'medium',
    });
  }

  if (validationCount > 8) {
    recs.push({
      id: 'validation',
      title: 'Recognise when you are seeking reassurance',
      body: `${validationCount} of your messages sought validation or approval. This pattern is detectable from writing alone and would classify you as susceptible to social-proof marketing — a high-value segment for subscription products and influencer campaigns.`,
      severity: 'medium',
    });
  }

  const highSeverityEvents = lifeEvents.filter(e => e.severity === 'high');
  if (highSeverityEvents.length > 0) {
    recs.push({
      id: 'lifeevents',
      title: 'Never disclose life crises to AI',
      body: `${highSeverityEvents.length} high-severity life event${highSeverityEvents.length > 1 ? 's were' : ' was'} detected (${highSeverityEvents.slice(0, 2).map(e => e.label.toLowerCase()).join(', ')}). Crisis data is the single most commercially valuable category — it identifies you as vulnerable and targetable.`,
      severity: 'high',
    });
  }

  if (dependency.trajectory === 'increasing' || totalUserMessages > 3000) {
    recs.push({
      id: 'volume',
      title: 'Reduce your overall usage volume',
      body: `${totalUserMessages.toLocaleString()} messages over ${Math.round(analysis.timespan.days / 30)} months${dependency.trajectory === 'increasing' ? ', with usage accelerating' : ''}. Cumulative data volume dramatically increases profiling accuracy — each additional message makes your cognitive fingerprint more precise.`,
      severity: 'medium',
    });
  }

  if (locations.length > 2) {
    recs.push({
      id: 'locations',
      title: 'Strip location references from prompts',
      body: `${locations.length} locations were identified in your data (${locations.slice(0, 2).map((l: any) => l.location).join(', ')}). Combined with temporal patterns, this enables geographic profiling without GPS access.`,
      severity: 'medium',
    });
  }

  if (recs.length < 4 && avgAnxiety > 3) {
    recs.push({
      id: 'anxiety',
      title: 'Pause before typing when distressed',
      body: `Your average anxiety signal is ${avgAnxiety.toFixed(1)}/10. Messages written in emotional distress contain the highest concentration of exploitable personal data. The system does not forget what you say in those moments.`,
      severity: 'low',
    });
  }

  return recs.slice(0, 6);
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReduceExposure({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const recs = generateRecommendations(analysis);

  if (recs.length === 0) return null;

  return (
    <div ref={ref}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem',
        }}>
          Countermeasures
        </p>
        <h2 style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)',
          fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.01em',
        }}>
          Reduce your exposure
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {recs.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 6 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            style={{
              padding: '1.4rem 0',
              borderBottom: `1px solid ${PALETTE.border}`,
              display: 'grid',
              gridTemplateColumns: '6px 1fr',
              gap: '1.2rem',
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', marginTop: '0.45rem',
              background: rec.severity === 'high' ? PALETTE.red
                : rec.severity === 'medium' ? PALETTE.amber
                : PALETTE.inkFaint,
              boxShadow: rec.severity === 'high' ? `0 0 6px ${PALETTE.red}` : 'none',
            }} />
            <div>
              <p style={{
                fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.ink,
                marginBottom: '0.4rem', lineHeight: 1.35,
              }}>
                {rec.title}
              </p>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkMuted,
                lineHeight: 1.7, letterSpacing: '0.02em',
              }}>
                {rec.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: recs.length * 0.08 + 0.3 }}
        style={{
          fontFamily: TYPE.serif, fontSize: '1rem', fontStyle: 'italic',
          color: PALETTE.inkFaint, lineHeight: 1.6, marginTop: '1.5rem',
        }}
      >
        These recommendations address future exposure only. The data already collected cannot be retrieved.
      </motion.p>
    </div>
  );
}
