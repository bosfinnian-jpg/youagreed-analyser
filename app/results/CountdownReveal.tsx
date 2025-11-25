'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

interface CountdownRevealProps {
  onComplete: () => void;
  onConsentDecision?: (consented: boolean) => void;
}

type Phase = 
  | 'countdown' 
  | 'zero' 
  | 'glitch'
  | 'reveal-line1' 
  | 'reveal-line2' 
  | 'message' 
  | 'consent-prompt'
  | 'complete';

export default function CountdownReveal({ onComplete, onConsentDecision }: CountdownRevealProps) {
  const [count, setCount] = useState(10);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [showSkip, setShowSkip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pulse effect intensity increases as countdown progresses
  const pulseIntensity = useMotionValue(0);
  const backgroundPulse = useTransform(
    pulseIntensity, 
    [0, 1], 
    ['rgba(255, 0, 0, 0)', 'rgba(255, 0, 0, 0.15)']
  );

  // Countdown logic with pulse effect
  useEffect(() => {
    if (phase !== 'countdown') return;
    
    if (count > 0) {
      // Pulse effect - more intense as we get closer to zero
      const intensity = (10 - count) / 10;
      animate(pulseIntensity, intensity, { duration: 0.3 });
      
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase('zero');
    }
  }, [count, phase, pulseIntensity]);

  // Phase progression after zero
  useEffect(() => {
    const timings: Partial<Record<Phase, { next: Phase; delay: number }>> = {
      'zero': { next: 'glitch', delay: 600 },
      'glitch': { next: 'reveal-line1', delay: 800 },
      'reveal-line1': { next: 'reveal-line2', delay: 1800 },
      'reveal-line2': { next: 'message', delay: 2200 },
      'message': { next: 'consent-prompt', delay: 5000 },
    };

    const current = timings[phase];
    if (current) {
      const timer = setTimeout(() => setPhase(current.next), current.delay);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Show skip option after 3 seconds (for accessibility/repeat visitors)
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleConsent = useCallback((consented: boolean) => {
    onConsentDecision?.(consented);
    setPhase('complete');
    setTimeout(onComplete, 500);
  }, [onComplete, onConsentDecision]);

  const handleSkip = useCallback(() => {
    setPhase('consent-prompt');
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #12061c 50%, #0a1020 100%)'
      }}
    >
      {/* Animated background pulse - increases urgency */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: backgroundPulse }}
      />

      {/* Vignette for focus */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Subtle scan lines for dystopian feel */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      {/* Skip button - appears after delay for accessibility */}
      <AnimatePresence>
        {showSkip && phase === 'countdown' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute top-8 right-8 text-white/30 hover:text-white/60 text-sm transition-colors z-50"
          >
            Skip →
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════════════════
            COUNTDOWN PHASE - Building anxiety
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="text-center relative"
          >
            {/* Warning header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6"
                style={{
                  background: 'rgba(255, 60, 60, 0.15)',
                  border: '1px solid rgba(255, 60, 60, 0.3)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm uppercase tracking-[0.3em] font-medium">
                  Upload Initiated
                </span>
              </motion.div>

              <p className="text-xl md:text-2xl lg:text-3xl text-white/70 uppercase tracking-[0.2em] font-light">
                Your data will be uploaded to
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl text-red-400/90 uppercase tracking-[0.2em] font-bold">
                Public Gallery
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl text-white/70 uppercase tracking-[0.2em] font-light mt-1">
                in
              </p>
            </motion.div>
            
            {/* The countdown number - massive and threatening */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={count}
                  initial={{ scale: 1.3, opacity: 0, filter: 'blur(20px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ scale: 0.7, opacity: 0, filter: 'blur(10px)' }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative"
                >
                  {/* Glow layer */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      filter: `blur(${count <= 3 ? 60 : 40}px)`,
                      opacity: count <= 3 ? 0.8 : 0.5,
                    }}
                  >
                    <span 
                      className="text-[10rem] md:text-[14rem] lg:text-[18rem] font-black"
                      style={{ color: count <= 3 ? '#ff2222' : '#ff6666' }}
                    >
                      {count}
                    </span>
                  </div>

                  {/* Main number */}
                  <span
                    className="text-[10rem] md:text-[14rem] lg:text-[18rem] font-black leading-none relative block"
                    style={{
                      background: count <= 3 
                        ? 'linear-gradient(180deg, #ff4444 0%, #cc0000 100%)'
                        : count <= 5
                        ? 'linear-gradient(180deg, #ffffff 0%, #ff6666 100%)'
                        : 'linear-gradient(180deg, #ffffff 20%, #cccccc 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {count}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Urgency indicator - pulses faster as countdown progresses */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ 
                  duration: Math.max(0.3, count / 10), 
                  repeat: Infinity,
                }}
                className="absolute -inset-20 rounded-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${count <= 3 ? 'rgba(255,0,0,0.2)' : 'rgba(255,100,100,0.1)'} 0%, transparent 70%)`,
                }}
              />
            </div>

            {/* Fake progress indicators for extra anxiety */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 space-y-3 max-w-md mx-auto"
            >
              <div className="flex items-center justify-between text-xs text-white/40 uppercase tracking-wider">
                <span>Preparing upload</span>
                <span>{Math.round((10 - count) * 10)}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${(10 - count) * 10}%`,
                    background: count <= 3 
                      ? 'linear-gradient(90deg, #ff4444, #ff0000)'
                      : 'linear-gradient(90deg, #666666, #999999)',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ZERO - The moment of maximum anxiety
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === 'zero' && (
          <motion.div
            key="zero"
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center relative"
          >
            {/* Intense glow */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ filter: 'blur(80px)' }}
            >
              <span className="text-[18rem] font-black text-red-600">0</span>
            </div>

            <span
              className="text-[10rem] md:text-[14rem] lg:text-[18rem] font-black leading-none relative"
              style={{
                background: 'linear-gradient(180deg, #ff0000 0%, #990000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              0
            </span>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xl uppercase tracking-[0.3em] mt-8"
            >
              Uploading...
            </motion.p>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            GLITCH - Brief visual disruption before reveal
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === 'glitch' && (
          <motion.div
            key="glitch"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0, 1, 0, 1] }}
            transition={{ duration: 0.5, times: [0, 0.2, 0.4, 0.6, 1] }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                x: [-2, 2, -2, 0],
                filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(-90deg)', 'hue-rotate(0deg)']
              }}
              transition={{ duration: 0.3, repeat: 2 }}
              className="text-4xl md:text-6xl font-bold text-red-500"
            >
              ERROR
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            REVEAL - The educational transformation
        ═══════════════════════════════════════════════════════════════════ */}
        {(phase === 'reveal-line1' || phase === 'reveal-line2' || phase === 'message') && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center max-w-5xl px-8"
          >
            <motion.h1
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight"
            >
              The upload was never real.
            </motion.h1>
            
            {(phase === 'reveal-line2' || phase === 'message') && (
              <motion.h2
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-6xl lg:text-7xl font-black mb-16 leading-tight"
                style={{
                  background: 'linear-gradient(135deg, #ff4444 0%, #ff8888 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Your agreement was.
              </motion.h2>
            )}
            
            {phase === 'message' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
                  But you <span className="text-white font-bold">DID</span> agree to this in{' '}
                  <span className="text-red-400 font-semibold">Section 11</span> of our Terms.
                </p>
                <p className="text-xl md:text-2xl text-white/60">
                  You didn't read them.
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-lg md:text-xl text-white/40 max-w-3xl mx-auto mt-8"
                >
                  This is what AI companies do—except with them, it's irreversible.
                  <br />
                  Your thoughts, your patterns, your identity—extracted and retained forever.
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            CONSENT PROMPT - Genuine informed consent
        ═══════════════════════════════════════════════════════════════════ */}
        {phase === 'consent-prompt' && (
          <motion.div
            key="consent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center max-w-3xl px-8"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div 
                className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #2479df, #3b9bff)',
                  boxShadow: '0 20px 60px rgba(36, 121, 223, 0.5)',
                }}
              >
                <span className="text-4xl">🤝</span>
              </div>

              <h2 
                className="text-3xl md:text-4xl font-black mb-6"
                style={{
                  background: 'linear-gradient(135deg, #ffffff, #3b9bff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Now, a genuine choice
              </h2>

              <p className="text-white/70 text-lg mb-4 leading-relaxed">
                We believe in <span className="text-white font-semibold">actual</span> informed consent.
              </p>
              
              <p className="text-white/50 text-base mb-10 leading-relaxed">
                Would you like to contribute <span className="text-white/70">anonymized excerpts</span> from 
                your analysis to our exhibition? Your name, identifying details, and any sensitive 
                information will be removed. This helps others understand the scope of AI data extraction.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConsent(true)}
                  className="px-10 py-4 rounded-xl font-bold text-lg transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #2479df, #3b9bff)',
                    color: 'white',
                    boxShadow: '0 10px 40px rgba(36, 121, 223, 0.4)',
                  }}
                >
                  Yes, contribute anonymously
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConsent(false)}
                  className="px-10 py-4 rounded-xl font-bold text-lg transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                  }}
                >
                  No, keep my data private
                </motion.button>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-white/30 text-sm mt-8"
              >
                Either choice is respected. Your analysis will be shown to you regardless.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}