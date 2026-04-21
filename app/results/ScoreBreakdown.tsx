'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import { computeScoreBreakdown, type ScoreFactor } from './generateInsights';
import type { DeepAnalysis } from './deepParser';

const CATEGORY_LABELS: Record<ScoreFactor['category'], string> = {
  disclosure: 'What you said',
  behavioural: 'How you behaved',
  volume: 'How much you shared',
  commercial: 'What you are worth',
};

const CATEGORY_ORDER: ScoreFactor['category'][] = ['disclosure', 'behavioural', 'commercial', 'volume'];

export default function ScoreBreakdown({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const factors = computeScoreBreakdown(analysis);

  if (factors.length === 0) return null;

  const grouped = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      factors: factors.filter(f => f.category === cat),
      subtotal: factors.filter(f => f.category === cat).reduce((s, f) => s + f.contribution, 0),
    }))
    .filter(g => g.factors.length > 0);

  return (
    <div ref={ref}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem',
        }}>
          Score composition
        </p>
        <h2 style={{
          fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)',
          fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.01em',
        }}>
          Why your score is {analysis.privacyScore}
        </h2>
      </div>

      {grouped.map((group, gi) => (
        <motion.div
          key={group.category}
          initial={{ opacity: 0, y: 6 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: gi * 0.12, duration: 0.5 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '0.6rem', paddingBottom: '0.4rem',
            borderBottom: `1px solid ${PALETTE.border}`,
          }}>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
              color: PALETTE.inkFaint, textTransform: 'uppercase',
            }}>
              {group.label}
            </p>
            <p style={{
              fontFamily: TYPE.mono, fontSize: '10px',
              color: group.subtotal > 20 ? PALETTE.red : PALETTE.inkMuted,
            }}>
              +{group.subtotal}
            </p>
          </div>

          {group.factors.map((factor) => (
            <div
              key={factor.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 50px',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.6rem 0',
              }}
            >
              <div>
                <p style={{
                  fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink,
                  marginBottom: '0.2rem',
                }}>
                  {factor.label}
                </p>
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint,
                  letterSpacing: '0.04em', lineHeight: 1.5,
                }}>
                  {factor.explanation}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: TYPE.mono, fontSize: '11px',
                  color: factor.contribution >= 15 ? PALETTE.red
                    : factor.contribution >= 8 ? PALETTE.amber
                    : PALETTE.inkMuted,
                }}>
                  +{factor.contribution}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: grouped.length * 0.12 + 0.2 }}
        style={{
          padding: '1rem 0', borderTop: `1px solid ${PALETTE.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          Computed exposure index
        </p>
        <p style={{
          fontFamily: TYPE.serif, fontSize: '1.3rem',
          color: analysis.privacyScore >= 70 ? PALETTE.red : PALETTE.ink,
          letterSpacing: '-0.02em',
        }}>
          {analysis.privacyScore}/100
        </p>
      </motion.div>
    </div>
  );
}
