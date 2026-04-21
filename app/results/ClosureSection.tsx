'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';
import type { DashPage } from './DashboardLayout';

export default function ClosureSection({ analysis, setPage }: { analysis: DeepAnalysis; setPage: (p: DashPage) => void }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const messageCount = analysis.totalUserMessages || 0;
  const days = analysis.timespan?.days || 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.5 }}
      style={{
        padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 6vw, 4rem)',
        textAlign: 'center',
        maxWidth: 640,
        margin: '0 auto',
      }}
    >
      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.2 }}
        style={{
          width: 40, height: 1, margin: '0 auto 3rem',
          background: PALETTE.inkFaint, transformOrigin: 'center',
        }}
      />

      {/* Main statement */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, delay: 0.6 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.1rem, 2.4vw, 1.4rem)',
          color: PALETTE.ink,
          lineHeight: 1.7,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          marginBottom: '1.8rem',
        }}
      >
        {messageCount > 0 ? (
          <>
            {messageCount.toLocaleString()} messages over {days > 365
              ? `${(days / 365).toFixed(1)} years`
              : `${days} days`
            }. 
            Every one of them is now part of a system you cannot inspect, correct, or leave.
          </>
        ) : (
          <>
            Every message you have ever sent to a conversational AI 
            is now part of a system you cannot inspect, correct, or leave.
          </>
        )}
      </motion.p>

      {/* Second line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1.5, delay: 1.8 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
          color: PALETTE.inkFaint,
          lineHeight: 1.7,
          fontStyle: 'italic',
          marginBottom: '3rem',
        }}
      >
        The next time it asks you how you are feeling, consider who is listening.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 3 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <button
          onClick={() => setPage('sources')}
          style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.16em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
            background: 'none', border: 'none', borderBottom: `1px solid ${PALETTE.border}`,
            paddingBottom: '2px', cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = PALETTE.ink;
            e.currentTarget.style.borderColor = PALETTE.inkMuted;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = PALETTE.inkFaint;
            e.currentTarget.style.borderColor = PALETTE.border;
          }}
        >
          Read the source analysis →
        </button>

        <p style={{
          fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em',
          color: 'rgba(240,237,232,0.12)', textTransform: 'uppercase',
          marginTop: '2rem',
        }}>
          TRACE.AI — 2026
        </p>
      </motion.div>
    </motion.div>
  );
}
