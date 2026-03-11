'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownRevealProps {
  onComplete: () => void;
  onConsentDecision?: (consented: boolean) => void;
}

type Phase =
  | 'processing'
  | 'complete'
  | 'reveal'
  | 'hold'
  | 'done';

// Status messages — designed to read like genuine system logs.
// The unsettling quality is in what they describe, not how they look.
const STATUS_MESSAGES = [
  'Parsing conversation threads...',
  'Extracting entity references...',
  'Mapping temporal interaction patterns...',
  'Identifying personal data categories...',
  'Cross-referencing behavioural markers...',
  'Calculating privacy exposure score...',
  'Compiling report...',
];

export default function CountdownReveal({ onComplete, onConsentDecision }: CountdownRevealProps) {
  const [phase, setPhase] = useState<Phase>('processing');
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [showClause, setShowClause] = useState(false);
  const progressRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────
  // Progress bar — fills over ~9 seconds with realistic, uneven speeds.
  // Uses a noise function to simulate real data processing variance.
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'processing') return;

    const TOTAL_DURATION = 9000; // 9 seconds total

    // Pre-generate speed multipliers for segments to create uneven feel.
    // Some segments fast (1.4x), some slow (0.5x), mimicking real I/O.
    const segments = [0.7, 1.3, 0.5, 1.4, 0.8, 1.1, 0.6, 1.2, 0.9, 1.0];

    const tick = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;

      // Calculate progress with uneven segments
      const rawProgress = Math.min(elapsed / TOTAL_DURATION, 1);

      // Apply segment-based speed variation
      const segmentIndex = Math.min(
        Math.floor(rawProgress * segments.length),
        segments.length - 1
      );
      const segmentProgress = rawProgress * segments.length - segmentIndex;
      const segmentStart = segmentIndex / segments.length;
      const segmentWidth = 1 / segments.length;
      const adjustedProgress = segmentStart + segmentProgress * segmentWidth * segments[segmentIndex];

      const clamped = Math.min(Math.max(adjustedProgress, 0), 1);
      progressRef.current = clamped;
      setProgress(clamped * 100);

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        // Hold at 100% for 1.5 seconds of stillness, then transition
        setTimeout(() => setPhase('complete'), 1500);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  // ─────────────────────────────────────────────────────────────────────
  // Status message rotation — changes every ~1.5-2s with slight variance
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'processing') return;

    const advance = () => {
      setStatusIndex((prev) => {
        if (prev < STATUS_MESSAGES.length - 1) return prev + 1;
        return prev; // Stay on last message
      });
    };

    // Slightly randomised interval: 1500–2000ms
    const scheduleNext = () => {
      const delay = 1500 + Math.random() * 500;
      return setTimeout(() => {
        advance();
        timerRef.current = scheduleNext();
      }, delay);
    };

    const timerRef = { current: scheduleNext() };
    return () => clearTimeout(timerRef.current);
  }, [phase]);

  // ─────────────────────────────────────────────────────────────────────
  // Phase progression after processing
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'complete') {
      // "Transfer complete." appears, hold 2 seconds, then show clause
      const t1 = setTimeout(() => setShowClause(true), 2000);
      // Hold both lines for 3 seconds, then finish
      const t2 = setTimeout(() => setPhase('hold'), 5000);
      const t3 = setTimeout(() => {
        // Auto-decline consent (consent prompt removed per brief)
        onConsentDecision?.(false);
        setPhase('done');
        onComplete();
      }, 5500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [phase, onComplete, onConsentDecision]);

  // Show skip after 3 seconds for accessibility
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = useCallback(() => {
    onConsentDecision?.(false);
    setPhase('done');
    onComplete();
  }, [onComplete, onConsentDecision]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #12061c 50%, #0a1020 100%)',
      }}
    >
      {/* Skip — barely visible, for accessibility / repeat visitors */}
      <AnimatePresence>
        {showSkip && phase === 'processing' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onClick={handleSkip}
            className="absolute top-8 right-8 text-sm transition-colors z-50"
            style={{ color: 'rgba(255, 255, 255, 0.2)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.2)')}
          >
            Skip →
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════════════
            PHASE 1: PROCESSING
            Visually indistinguishable from a real SaaS data pipeline.
            No red. No pulse. No urgency. Like waiting for Notion to load.
        ═══════════════════════════════════════════════════════════════ */}
        {phase === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md px-8"
          >
            {/* Label — site's standard subtext style */}
            <p
              className="text-xs uppercase tracking-[0.25em] mb-8 text-center"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              Processing your data
            </p>

            {/* Progress bar — trusted blue, calm, inevitable */}
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: '#2479df',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            {/* Status messages — monospace, system-log register */}
            <div className="mt-6 h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={statusIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-xs text-center"
                  style={{
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                  }}
                >
                  {STATUS_MESSAGES[statusIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PHASE 2: COMPLETE / REVEAL
            Two lines. Plain white. No apology. No explanation. Silence.
        ═══════════════════════════════════════════════════════════════ */}
        {(phase === 'complete' || phase === 'hold') && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center px-8"
          >
            {/* First line — plain, factual, system-notification register */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="text-lg md:text-xl font-normal text-white"
            >
              Your conversations have been queued for public exhibition.
            </motion.p>

            {/* "You consented to this in Clause 19.2..." — subtext opacity */}
            {showClause && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="mt-4 text-sm md:text-base font-normal"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                You consented to this in Clause 19.2 of our Terms of Service.
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
