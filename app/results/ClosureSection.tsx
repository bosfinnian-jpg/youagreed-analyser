'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import type { DeepAnalysis } from './deepParser';
import type { DashPage } from './DashboardLayout';

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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
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
  const isInView = useInView(ref, { once: true, margin: '-8%' });
  const messageCount = analysis.totalUserMessages || 0;
  const days = analysis.timespan?.days || 0;
  const score = (analysis as any).privacyScore || 0;

  const mainText = messageCount > 0
    ? `${messageCount.toLocaleString()} messages over ${days > 365 ? `${(days / 365).toFixed(1)} years` : `${days} days`}. Every one of them is now part of a system you cannot inspect, correct, or leave.`
    : `Every message you have ever sent to a conversational AI is now part of a system you cannot inspect, correct, or leave.`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.4 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        marginTop: '1px',
      }}
    >
      {/* Full-bleed dark panel */}
      <div style={{
        background: 'linear-gradient(180deg, #0e0e0d 0%, #111110 100%)',
        borderTop: '1px solid rgba(240,237,232,0.08)',
        padding: 'clamp(5rem, 12vw, 9rem) clamp(2rem, 6vw, 4rem)',
        position: 'relative',
      }}>

        {/* Large ghost score — architectural background element */}
        {score > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 2 }}
            style={{
              position: 'absolute',
              right: '-2%',
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: TYPE.serif,
              fontSize: 'clamp(220px, 28vw, 360px)',
              fontWeight: 400,
              color: 'rgba(240,237,232,0.025)',
              lineHeight: 1,
              letterSpacing: '-0.06em',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {score}
          </motion.div>
        )}

        {/* Thin horizontal rule — full width */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            top: 'clamp(3.5rem, 8vw, 6rem)',
            left: 'clamp(2rem, 6vw, 4rem)',
            right: 'clamp(2rem, 6vw, 4rem)',
            height: '1px',
            background: 'linear-gradient(90deg, rgba(240,237,232,0.08), rgba(240,237,232,0.05) 40%, transparent)',
            transformOrigin: 'left',
          }}
        />

        {/* Section label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 1 }}
          style={{
            fontFamily: TYPE.mono,
            fontSize: '11px',
            letterSpacing: '0.22em',
            color: 'rgba(190,40,30,0.5)',
            textTransform: 'uppercase',
            marginBottom: 'clamp(3rem, 6vw, 5rem)',
          }}
        >
          End of report
        </motion.p>

        {/* Main content — centred column */}
        <div style={{ maxWidth: 720, position: 'relative', zIndex: 1 }}>

          {/* EKG — larger, more presence */}
          <motion.svg
            width="320" height="44" viewBox="0 0 320 44"
            style={{ display: 'block', marginBottom: '3rem', overflow: 'visible' }}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 1 }}
          >
            <defs>
              <filter id="ekgGlowB">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <line x1="0" y1="22" x2="320" y2="22" stroke="rgba(190,40,30,0.06)" strokeWidth="1" />
            <motion.polyline
              points="0,22 32,22 42,8 50,36 58,12 64,30 70,22 116,22 126,5 134,39 142,10 150,32 156,22 200,22 210,10 218,36 226,13 232,31 238,22 280,22 290,7 298,37 306,14 312,30 316,22 320,22"
              fill="none"
              stroke="rgba(190,40,30,0.40)"
              strokeWidth="1.4"
              filter="url(#ekgGlowB)"
              strokeDasharray="800"
              initial={{ strokeDashoffset: 800 }}
              animate={isInView ? { strokeDashoffset: 0 } : {}}
              transition={{ delay: 0.5, duration: 2.4, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.svg>

          {/* The main statement — much bigger */}
          {isInView && (
            <p style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              color: 'rgba(240,237,232,0.92)',
              lineHeight: 1.65,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              marginBottom: '2.5rem',
              maxWidth: 640,
            }}>
              <RevealText text={mainText} delay={0.8} />
            </p>
          )}

          {/* Second line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.4, delay: 2.8 }}
            style={{
              fontFamily: TYPE.serif,
              fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
              color: 'rgba(240,237,232,0.55)',
              lineHeight: 1.8,
              fontStyle: 'italic',
              marginBottom: 'clamp(3rem, 7vw, 5rem)',
              maxWidth: 520,
            }}
          >
            The next time it asks you how you are feeling, consider who is listening.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 3.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}
          >
            <button
              onClick={() => setPage('resist')}
              style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em',
                color: 'rgba(240,237,232,0.90)', textTransform: 'uppercase',
                background: 'none', border: `1px solid rgba(240,237,232,0.2)`,
                padding: '0.85rem 1.8rem', cursor: 'pointer',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(240,237,232,0.5)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(240,237,232,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(240,237,232,0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              What you can do →
            </button>

            <button
              onClick={() => setPage('sources')}
              style={{
                fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em',
                color: 'rgba(240,237,232,0.40)', textTransform: 'uppercase',
                background: 'none', border: 'none',
                borderBottom: '1px solid rgba(240,237,232,0.12)',
                paddingBottom: '2px', cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'rgba(240,237,232,0.70)';
                e.currentTarget.style.borderColor = 'rgba(240,237,232,0.30)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(240,237,232,0.40)';
                e.currentTarget.style.borderColor = 'rgba(240,237,232,0.12)';
              }}
            >
              Add more data sources →
            </button>
          </motion.div>

          {/* Stamp */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 4.2, duration: 1.2 }}
            style={{
              fontFamily: TYPE.mono,
              fontSize: '10px',
              letterSpacing: '0.18em',
              color: 'rgba(240,237,232,0.08)',
              textTransform: 'uppercase',
              marginTop: 'clamp(3rem, 8vw, 6rem)',
            }}
          >
            TRACE.AI / {new Date().getFullYear()} / REPORT COMPLETE
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
