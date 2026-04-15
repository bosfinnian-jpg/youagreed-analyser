'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import { generateSummary } from './generateInsights';
import type { DeepAnalysis } from './deepParser';

export default function PersonalisedSummary({ analysis }: { analysis: DeepAnalysis }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const summary = generateSummary(analysis);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <p style={{
        fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.2em',
        color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem',
      }}>
        Assessment summary
      </p>

      <p style={{
        fontFamily: TYPE.serif,
        fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)',
        color: PALETTE.ink,
        lineHeight: 1.75,
        letterSpacing: '-0.005em',
      }}>
        {summary}
      </p>

      <p style={{
        fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em',
        color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '1.2rem',
        paddingTop: '0.8rem', borderTop: `1px solid ${PALETTE.border}`,
      }}>
        Generated from your exported data — no external inference applied
      </p>
    </motion.div>
  );
}
