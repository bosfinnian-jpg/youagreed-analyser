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
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', paddingTop: '2px' }}>
        {label}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: redValue ? PALETTE.red : PALETTE.ink, lineHeight: 1.5 }}>
        {value}
      </p>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function DataProductSummary({ analysis }: DataProductSummaryProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });

  const { commercialProfile, dependency, lifeEvents, findings, nighttimeRatio, mostVulnerablePeriod } = analysis;
  const topSegment = commercialProfile.segments[0];
  const refId = useRef(`DS-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`).current;

  return (
    <div ref={ref}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Data broker profile
          </p>
          <h2 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.01em' }}>
            You, as a commercial product.
          </h2>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.12em' }}>REF: {refId}</p>
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, letterSpacing: '0.12em', marginTop: '2px' }}>
            CLASSIFICATION: {commercialProfile.overallValue.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Immediate data fields */}
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
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Segment evidence
          </p>
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted, letterSpacing: '0.04em' }}>
            {topSegment.evidence}
          </p>
        </motion.div>
      )}

      {/* All segments breakdown */}
      {commercialProfile.segments.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          style={{ marginTop: '1.5rem' }}
        >
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
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
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em', color: PALETTE.inkMuted }}>{seg.label}</p>
                <div style={{ position: 'relative', height: '2px', background: PALETTE.bgElevated }}>
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
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: seg.confidence > 70 ? PALETTE.red : PALETTE.inkFaint }}>
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
