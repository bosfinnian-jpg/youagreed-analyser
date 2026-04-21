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
      {/* Waveform — data being recorded, permanently */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.3 }}
        style={{ marginBottom: '2rem' }}
      >
        <svg width="240" height="32" viewBox="0 0 240 32" style={{ display: 'block', margin: '0 auto' }}>
          {/* Flat EKG-style waveform — active data collection signal */}
          <polyline
            points={[
              '0,16', '30,16', '38,6', '44,26', '50,10', '56,22', '60,16',
              '90,16', '98,4', '104,28', '110,8', '116,24', '120,16',
              '150,16', '158,8', '164,26', '170,10', '176,22', '180,16',
              '210,16', '218,6', '224,26', '230,12', '234,20', '240,16',
            ].join(' ')}
            fill="none"
            stroke="rgba(220,60,50,0.18)"
            strokeWidth="1"
          />
          {/* Flat line after last beat — signal terminating */}
          <line x1="234" y1="16" x2="240" y2="16" stroke="rgba(220,60,50,0.1)" strokeWidth="1" />
        </svg>
      </motion.div>

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
        transition={{ duration: 1.2, delay: 1.4 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 1.8vw, 1.1rem)',
          color: PALETTE.inkMuted,
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
        transition={{ duration: 1, delay: 2 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <button
          onClick={() => setPage('resist')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
            color: PALETTE.ink, textTransform: 'uppercase',
            background: 'none', border: `1px solid ${PALETTE.border}`,
            padding: '0.7rem 1.2rem', cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = PALETTE.inkMuted;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = PALETTE.border;
          }}
        >
          What you can do →
        </button>

        <button
          onClick={() => setPage('sources')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
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
          Add more data sources →
        </button>

        <p style={{
          fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em',
          color: 'rgba(240,237,232,0.12)', textTransform: 'uppercase',
          marginTop: '2rem',
        }}>
          TRACE.AI / 2026
        </p>
      </motion.div>
    </motion.div>
  );
}
