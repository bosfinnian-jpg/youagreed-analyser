'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';
import type { DashPage } from './DashboardLayout';

// Word-by-word animated reveal for the final statement
function RevealText({ text, delay = 0, style }: {
  text: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const words = text.split(' ');
  return (
    <span style={{ ...style, display: 'inline' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.04,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export default function ClosureSection({ analysis, setPage }: {
  analysis: DeepAnalysis;
  setPage: (p: DashPage) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const messageCount = analysis.totalUserMessages || 0;
  const days = analysis.timespan?.days || 0;

  const mainText = messageCount > 0
    ? `${messageCount.toLocaleString()} messages over ${days > 365 ? `${(days / 365).toFixed(1)} years` : `${days} days`}. Every one of them is now part of a system you cannot inspect, correct, or leave.`
    : `Every message you have ever sent to a conversational AI is now part of a system you cannot inspect, correct, or leave.`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2 }}
      style={{
        padding: 'clamp(3rem, 8vw, 6rem) clamp(2rem, 6vw, 4rem)',
        textAlign: 'center',
        maxWidth: 660,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* EKG waveform — animated draw-in */}
      <motion.svg
        width="280" height="36" viewBox="0 0 280 36"
        style={{ display: 'block', margin: '0 auto 2.4rem', overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 1 }}
      >
        <defs>
          <filter id="ekgGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Baseline */}
        <line x1="0" y1="18" x2="280" y2="18" stroke="rgba(220,60,50,0.07)" strokeWidth="1" />
        {/* Waveform — draw in via strokeDashoffset */}
        <motion.polyline
          points="0,18 28,18 36,7 42,29 48,11 54,25 58,18 100,18 108,5 114,31 120,9 126,27 130,18 172,18 180,9 186,29 192,11 198,25 202,18 244,18 252,7 258,29 264,13 268,23 272,18 280,18"
          fill="none"
          stroke="rgba(220,60,50,0.35)"
          strokeWidth="1.2"
          filter="url(#ekgGlow)"
          strokeDasharray="600"
          initial={{ strokeDashoffset: 600 }}
          animate={isInView ? { strokeDashoffset: 0 } : {}}
          transition={{ delay: 0.4, duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
        />
        {/* Flatline — appears after waveform */}
        <motion.line
          x1="272" y1="18" x2="280" y2="18"
          stroke="rgba(220,60,50,0.15)" strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 2.6, duration: 0.4 }}
        />
      </motion.svg>

      {/* Divider with endpoint squares */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{ position: 'relative', width: 44, margin: '0 auto 3rem', transformOrigin: 'center' }}
      >
        <div style={{ height: 1, background: PALETTE.inkFaint }} />
        <div style={{ position: 'absolute', left: -2, top: -2, width: 4, height: 4, border: `1px solid ${PALETTE.inkFaint}` }} />
        <div style={{ position: 'absolute', right: -2, top: -2, width: 4, height: 4, border: `1px solid ${PALETTE.inkFaint}` }} />
      </motion.div>

      {/* Main statement — word by word */}
      {isInView && (
        <p style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.1rem, 2.4vw, 1.4rem)',
          color: PALETTE.ink,
          lineHeight: 1.75,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          marginBottom: '2rem',
        }}>
          <RevealText text={mainText} delay={0.7} />
        </p>
      )}

      {/* Second line — fades in whole */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 2.2 }}
        style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1rem, 1.8vw, 1.1rem)',
          color: PALETTE.inkMuted,
          lineHeight: 1.75,
          fontStyle: 'italic',
          marginBottom: '3.5rem',
        }}
      >
        The next time it asks you how you are feeling, consider who is listening.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 2.8 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <button
          onClick={() => setPage('resist')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
            color: PALETTE.ink, textTransform: 'uppercase',
            background: 'none', border: `1px solid ${PALETTE.border}`,
            padding: '0.7rem 1.4rem', cursor: 'pointer',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = PALETTE.inkMuted;
            e.currentTarget.style.boxShadow = `0 0 12px rgba(240,237,232,0.06)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = PALETTE.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          What you can do →
        </button>

        <button
          onClick={() => setPage('sources')}
          style={{
            fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
            color: PALETTE.inkFaint, textTransform: 'uppercase',
            background: 'none', border: 'none',
            borderBottom: `1px solid ${PALETTE.border}`,
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
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em',
          color: 'rgba(240,237,232,0.1)', textTransform: 'uppercase',
          marginTop: '2.5rem',
        }}>
          TRACE.AI / 2026
        </p>
      </motion.div>
    </motion.div>
  );
}
