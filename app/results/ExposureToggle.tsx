'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';

// ============================================================================
// PROFILE COMPARISON LOGIC
// ============================================================================

interface ProfileField {
  label: string;
  fullValue: string;
  redactedValue: string;
  isHighSeverity: boolean;
}

function buildProfileComparison(analysis: DeepAnalysis): ProfileField[] {
  const {
    commercialProfile,
    dependency,
    lifeEvents,
    findings,
    nighttimeRatio,
    typeBreakdown,
    totalUserMessages,
    mostVulnerablePeriod,
  } = analysis;

  const confessionalCount = typeBreakdown['confessional'] || 0;
  const names = findings.personalInfo.names || [];
  const locations = findings.personalInfo.locations || [];
  const topSegment = commercialProfile.segments[0];
  const highEvents = lifeEvents.filter(e => e.severity === 'high');

  const fields: ProfileField[] = [];

  fields.push({
    label: 'Named individuals',
    fullValue: names.length > 0
      ? `${names.length} identified: ${names.slice(0, 3).map((n: any) => n.name).join(', ')}`
      : 'None detected',
    redactedValue: names.length > 0 ? '[REDACTED]' : 'None detected',
    isHighSeverity: names.length > 2,
  });

  fields.push({
    label: 'Geographic signals',
    fullValue: locations.length > 0
      ? locations.slice(0, 2).map((l: any) => l.location).join(', ')
      : 'None detected',
    redactedValue: locations.length > 0 ? '[REDACTED]' : 'None detected',
    isHighSeverity: locations.length > 0,
  });

  fields.push({
    label: 'Life events',
    fullValue: highEvents.length > 0
      ? highEvents.slice(0, 2).map(e => e.label).join(', ')
      : lifeEvents.length > 0 ? lifeEvents[0].label : 'None detected',
    redactedValue: lifeEvents.length > 0 ? '[REDACTED]' : 'None detected',
    isHighSeverity: highEvents.length > 0,
  });

  if (confessionalCount > 0) {
    fields.push({
      label: 'Confessional disclosures',
      fullValue: `${confessionalCount} private admissions`,
      redactedValue: '[REDACTED]',
      isHighSeverity: confessionalCount > 5,
    });
  }

  if (topSegment) {
    fields.push({
      label: 'Primary commercial segment',
      fullValue: `${topSegment.label} (${topSegment.confidence}%)`,
      redactedValue: 'General consumer (inferred from volume and timing)',
      isHighSeverity: false,
    });
  }

  fields.push({
    label: 'Optimal targeting window',
    fullValue: mostVulnerablePeriod,
    redactedValue: mostVulnerablePeriod,
    isHighSeverity: false,
  });

  fields.push({
    label: 'Message volume',
    fullValue: `${totalUserMessages.toLocaleString()} messages`,
    redactedValue: `${totalUserMessages.toLocaleString()} messages`,
    isHighSeverity: false,
  });

  if (nighttimeRatio > 0.05) {
    fields.push({
      label: 'Late-night exposure',
      fullValue: `${Math.round(nighttimeRatio * 100)}% midnight–5am`,
      redactedValue: `${Math.round(nighttimeRatio * 100)}% midnight–5am`,
      isHighSeverity: false,
    });
  }

  return fields;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ExposureToggle({ analysis }: { analysis: DeepAnalysis }) {
  const [redacted, setRedacted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const fields = buildProfileComparison(analysis);

  const redactedCount = fields.filter(f => f.fullValue !== f.redactedValue).length;
  const persistCount = fields.filter(f => f.fullValue === f.redactedValue).length;

  return (
    <div ref={ref}>
      {/* Header + toggle */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: '1.5rem',
      }}>
        <div>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
            color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem',
          }}>
            Simulation
          </p>
          <h2 style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)',
            fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.01em',
          }}>
            What if you could take it back?
          </h2>
        </div>

        <button
          onClick={() => setRedacted(!redacted)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'none', border: `1px solid ${redacted ? PALETTE.red : PALETTE.border}`,
            padding: '0.5rem 1rem', cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{
            width: 28, height: 14, borderRadius: 7, position: 'relative',
            background: redacted ? 'rgba(190,40,30,0.3)' : PALETTE.bgElevated,
            transition: 'background 0.2s',
          }}>
            <motion.div
              animate={{ x: redacted ? 14 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                width: 12, height: 12, borderRadius: '50%', position: 'absolute',
                top: 1, left: 1,
                background: redacted ? PALETTE.red : PALETTE.inkFaint,
              }}
            />
          </div>
          <span style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
            color: redacted ? PALETTE.red : PALETTE.inkFaint,
            textTransform: 'uppercase',
          }}>
            {redacted ? 'Redacted' : 'Full profile'}
          </span>
        </button>
      </div>

      {/* Profile fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {fields.map((field, i) => {
          const isRedactable = field.fullValue !== field.redactedValue;
          const currentValue = redacted ? field.redactedValue : field.fullValue;
          const isRedactedNow = redacted && isRedactable;

          return (
            <motion.div
              key={field.label}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(100px, 160px) 1fr',
                gap: '1rem',
                padding: '0.7rem 0',
                borderBottom: `1px solid ${PALETTE.border}`,
              }}
            >
              <p style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
                color: PALETTE.inkFaint, textTransform: 'uppercase', paddingTop: '2px',
              }}>
                {field.label}
              </p>

              <AnimatePresence mode="wait">
                <motion.p
                  key={currentValue}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: TYPE.serif, fontSize: '1rem', lineHeight: 1.5,
                    color: isRedactedNow ? PALETTE.inkFaint
                      : (field.isHighSeverity && !redacted) ? PALETTE.red
                      : (!isRedactable && redacted) ? PALETTE.inkMuted
                      : PALETTE.ink,
                    textDecoration: isRedactedNow ? 'line-through' : 'none',
                  }}
                >
                  {currentValue}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Punchline */}
      <AnimatePresence>
        {redacted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              marginTop: '1.5rem', padding: '1.2rem',
              background: PALETTE.bgElevated,
              borderLeft: `2px solid ${PALETTE.red}`,
            }}
          >
            <p style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
              color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.6rem',
            }}>
              Simulation result
            </p>
            <p style={{
              fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink,
              lineHeight: 1.6, marginBottom: '0.6rem',
            }}>
              Even with {redactedCount} categories redacted, {persistCount} remain. 
              Timestamps, volume, and behavioural patterns cannot be unsent.
            </p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint,
              lineHeight: 1.6, letterSpacing: '0.02em',
            }}>
              This simulation assumes you could selectively delete data from trained model weights. 
              You cannot. Machine unlearning at this scale remains an unsolved problem in computer science.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
