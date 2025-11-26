'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Link from 'next/link';

/**
 * You Agreed — Museum-Quality Landing Page
 * 
 * Architecture:
 * - Single scroll container with fixed height
 * - All sections pinned to viewport center
 * - Raw scroll progress for opacity (instant response)
 * - Subtle eased transforms for polish
 * - GPU-accelerated with will-change and transform3d
 * - Pointer-events disabled on invisible sections
 */

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  blue: '#2479df',
  skyBlue: '#3b9bff',
  softPink: '#ffccee',
  purple: '#b0c3fd',
  white: '#ffffff',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const GradientOrb = ({ 
  className, 
  colors, 
  delay = 0 
}: { 
  className: string; 
  colors: string[]; 
  delay?: number;
}) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.08, 1],
      opacity: [0.3, 0.45, 0.3],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    style={{
      background: `radial-gradient(circle at 30% 30%, ${colors[0]}, ${colors[1]}, transparent 70%)`,
      filter: 'blur(80px)',
      willChange: 'transform, opacity',
    }}
  />
);

const GlassCard = ({ 
  children, 
  className = '',
  hover = true,
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) => (
  <motion.div
    whileHover={hover ? { 
      y: -4, 
      transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
    } : undefined}
    className={`
      relative overflow-hidden rounded-[2rem] p-8 md:p-10
      bg-white/[0.03] backdrop-blur-2xl
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]
      ${className}
    `}
  >
    <div 
      className="absolute inset-0 rounded-[2rem] opacity-40 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 50%)',
      }}
    />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// Pinned section with GPU optimization
const PinnedSection = ({ 
  children, 
  opacity,
  y,
  zIndex,
  scale,
}: { 
  children: React.ReactNode;
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  zIndex: number;
  scale?: MotionValue<number>;
}) => {
  // Derive pointer-events from opacity
  const pointerEvents = useTransform(opacity, (v) => v > 0.1 ? 'auto' : 'none');
  
  return (
    <motion.section
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        opacity,
        y,
        scale: scale || 1,
        zIndex,
        pointerEvents,
        willChange: 'transform, opacity',
        transform: 'translate3d(0, 0, 0)', // Force GPU layer
      }}
    >
      {children}
    </motion.section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCROLL TRANSFORMS
  // 
  // Total scroll: 600vh (6 screen heights)
  // Each section: ~100vh of "active" time with crossfade buffers
  // 
  // Using raw scrollYProgress (no spring) for opacity = instant response
  // Subtle Y transforms add polish without lag
  // ─────────────────────────────────────────────────────────────────────────

  // Hero: visible 0-12%, fade out 12-18%
  const heroOpacity = useTransform(
    scrollYProgress, 
    [0, 0.12, 0.18], 
    [1, 1, 0]
  );
  const heroScale = useTransform(
    scrollYProgress, 
    [0, 0.12, 0.18], 
    [1, 1, 0.97]
  );
  const heroY = useTransform(
    scrollYProgress, 
    [0, 0.18], 
    [0, -30]
  );

  // Section 1: fade in 14-20%, visible 20-30%, fade out 30-36%
  const s1Opacity = useTransform(
    scrollYProgress, 
    [0.14, 0.20, 0.30, 0.36], 
    [0, 1, 1, 0]
  );
  const s1Y = useTransform(
    scrollYProgress, 
    [0.14, 0.20, 0.30, 0.36], 
    [50, 0, 0, -30]
  );

  // Section 2: fade in 32-38%, visible 38-52%, fade out 52-58%
  const s2Opacity = useTransform(
    scrollYProgress, 
    [0.32, 0.38, 0.52, 0.58], 
    [0, 1, 1, 0]
  );
  const s2Y = useTransform(
    scrollYProgress, 
    [0.32, 0.38, 0.52, 0.58], 
    [50, 0, 0, -30]
  );

  // Section 3: fade in 54-60%, visible 60-72%, fade out 72-78%
  const s3Opacity = useTransform(
    scrollYProgress, 
    [0.54, 0.60, 0.72, 0.78], 
    [0, 1, 1, 0]
  );
  const s3Y = useTransform(
    scrollYProgress, 
    [0.54, 0.60, 0.72, 0.78], 
    [50, 0, 0, -30]
  );

  // CTA: fade in 74-82%, stays visible
  const ctaOpacity = useTransform(
    scrollYProgress, 
    [0.74, 0.82, 1], 
    [0, 1, 1]
  );
  const ctaY = useTransform(
    scrollYProgress, 
    [0.74, 0.82], 
    [40, 0]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────────────────────────────────────

  const insights = [
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="16" cy="16" r="5" fill="currentColor" opacity="0.3"/>
          <circle cx="16" cy="16" r="2" fill="currentColor"/>
        </svg>
      ),
      title: "Privacy Exposure",
      description: "Every name, location, health detail, and financial fragment you've shared — mapped and visualised.",
      gradient: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.skyBlue})`,
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
          <path d="M4 24L12 16L18 22L28 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="28" cy="8" r="2.5" fill="currentColor" opacity="0.4"/>
        </svg>
      ),
      title: "Conversation Patterns",
      description: "Your topics, habits, and evolving relationship with AI — transformed into beautiful data narratives.",
      gradient: `linear-gradient(135deg, ${COLORS.skyBlue}, ${COLORS.purple})`,
    },
    {
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M16 5C16 5 9 10 9 16C9 22 16 27 16 27" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M16 5C16 5 23 10 23 16C23 22 16 27 16 27" stroke="currentColor" strokeWidth="1.5"/>
          <ellipse cx="16" cy="16" rx="11" ry="4.5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      title: "Carbon Footprint",
      description: "The environmental cost of each conversation — contextualised against everyday activities.",
      gradient: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.softPink})`,
    },
  ];

  const features = [
    { icon: "◐", label: "100% Local", detail: "Browser-only processing" },
    { icon: "◉", label: "Zero Upload", detail: "Your data never leaves" },
    { icon: "◈", label: "Instant", detail: "Results in seconds" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          ATMOSPHERIC BACKGROUND — Fixed, lowest layer
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(240, 30%, 4%) 0%, hsl(250, 40%, 5%) 50%, hsl(260, 35%, 4%) 100%)',
          }}
        />
        
        <GradientOrb 
          className="w-[800px] h-[800px] -top-[250px] -left-[250px]"
          colors={[COLORS.blue, COLORS.skyBlue]}
        />
        <GradientOrb 
          className="w-[900px] h-[900px] -top-[150px] -right-[350px]"
          colors={[COLORS.purple, COLORS.skyBlue]}
          delay={7}
        />
        <GradientOrb 
          className="w-[700px] h-[700px] bottom-[5%] left-[15%]"
          colors={[COLORS.softPink, COLORS.purple]}
          delay={14}
        />

        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 70%)',
          }}
        />

        {/* Film grain */}
        <div 
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          NAVIGATION — Fixed, highest layer
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 right-0 px-6 py-5"
        style={{ zIndex: 100 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.skyBlue})`,
                boxShadow: `0 4px 20px ${COLORS.blue}40`,
              }}
            >
              <span className="text-white font-semibold text-base">Y</span>
            </div>
            <span className="text-white/80 font-medium tracking-tight text-sm">You Agreed</span>
          </div>
          
          <Link href="/terms">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-full text-sm font-medium
                bg-white/[0.06] backdrop-blur-xl border border-white/[0.08]
                transition-colors duration-300"
            >
              Start Analysis
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════════════════
          SCROLL CONTAINER — Creates the scrollable height
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        ref={containerRef}
        className="relative bg-transparent text-white selection:bg-white/20"
        style={{ height: '600vh' }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════════════ */}
        <PinnedSection 
          opacity={heroOpacity} 
          y={heroY} 
          scale={heroScale}
          zIndex={10}
        >
          <div className="text-center px-6 w-full max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="mb-8"
            >
              <span 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-medium uppercase tracking-[0.2em]
                  bg-white/[0.05] border border-white/[0.06] text-white/50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                COMM3705 Digital Media Project
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="text-[clamp(4rem,14vw,11rem)] font-semibold tracking-[-0.04em] leading-[0.95] mb-10"
            >
              <span 
                className="block"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.purple} 60%, ${COLORS.skyBlue} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                You
              </span>
              <span 
                className="block"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.skyBlue} 0%, ${COLORS.softPink} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Agreed.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="text-lg md:text-xl text-white/40 font-light max-w-md mx-auto leading-relaxed"
            >
              Discover what you've shared with AI.
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-3"
              >
                <span className="text-white/25 text-[10px] tracking-[0.25em] uppercase">Scroll</span>
                <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
              </motion.div>
            </motion.div>
          </div>
        </PinnedSection>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: THE REVELATION
        ═══════════════════════════════════════════════════════════════════ */}
        <PinnedSection opacity={s1Opacity} y={s1Y} zIndex={20}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium tracking-widest uppercase
                bg-white/[0.04] border border-white/[0.06] text-white/40 mb-8"
            >
              The Revelation
            </span>

            <h2 className="text-[clamp(2.2rem,7vw,5rem)] font-semibold tracking-[-0.03em] leading-[1.1] mb-8">
              <span 
                className="block"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.white} 20%, ${COLORS.purple} 90%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Every conversation
              </span>
              <span 
                className="block"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.softPink} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                tells a story about you.
              </span>
            </h2>

            <p className="text-base md:text-lg text-white/35 font-light max-w-xl mx-auto leading-relaxed">
              Upload your ChatGPT export and see the patterns, privacy exposure, 
              and environmental cost of your AI interactions — visualised beautifully.
            </p>
          </div>
        </PinnedSection>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: TRUST SIGNALS
        ═══════════════════════════════════════════════════════════════════ */}
        <PinnedSection opacity={s2Opacity} y={s2Y} zIndex={30}>
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="text-center mb-14">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium tracking-widest uppercase
                  bg-white/[0.04] border border-white/[0.06] text-white/40 mb-8"
              >
                Privacy First
              </span>

              <h2 className="text-[clamp(2rem,6vw,4rem)] font-semibold tracking-[-0.02em] leading-[1.15] mb-5">
                <span 
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.skyBlue} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Your data never leaves your device.
                </span>
              </h2>

              <p className="text-base text-white/35 font-light max-w-lg mx-auto">
                Complete analysis happens entirely in your browser. 
                No servers. No accounts. No tracking.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl
                    bg-white/[0.025] border border-white/[0.05] backdrop-blur-xl"
                >
                  <span className="text-xl" style={{ color: COLORS.skyBlue }}>
                    {feature.icon}
                  </span>
                  <div className="text-left">
                    <div className="text-white/80 font-medium text-sm">{feature.label}</div>
                    <div className="text-white/35 text-xs">{feature.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insight cards */}
            <div className="grid md:grid-cols-3 gap-5">
              {insights.map((insight, i) => (
                <GlassCard key={i} className="text-left">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ 
                      background: insight.gradient,
                      boxShadow: `0 8px 24px ${COLORS.blue}25`,
                      color: COLORS.white,
                    }}
                  >
                    {insight.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">{insight.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm">{insight.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </PinnedSection>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3: THE TENSION
        ═══════════════════════════════════════════════════════════════════ */}
        <PinnedSection opacity={s3Opacity} y={s3Y} zIndex={40}>
          <div className="max-w-4xl mx-auto px-6 w-full">
            <GlassCard hover={false} className="text-center py-14 md:py-20">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-[11px] font-medium tracking-widest uppercase
                  bg-white/[0.04] border border-white/[0.06] text-white/40 mb-10"
              >
                The Critical Tension
              </span>

              <blockquote className="text-[clamp(1.3rem,3.5vw,2rem)] font-light leading-[1.5] text-white/70 mb-10 max-w-2xl mx-auto">
                <span className="text-white/20">"</span>
                Surveillance capitalism doesn't look threatening. 
                It looks polished, professional, even <em className="text-white/90 font-normal">beautiful</em>.
                <span className="text-white/20">"</span>
              </blockquote>

              <p className="text-white/35 text-sm max-w-lg mx-auto leading-relaxed">
                This installation uses the visual language of the systems it critiques — 
                the same friendly blues and approachable design that facilitate extraction.
              </p>

              {/* Decorative dots */}
              <div className="mt-10 flex justify-center gap-1.5">
                {[COLORS.blue, COLORS.skyBlue, COLORS.purple, COLORS.softPink].map((color, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: color, opacity: 0.5 }}
                  />
                ))}
              </div>
            </GlassCard>
          </div>
        </PinnedSection>

        {/* ═══════════════════════════════════════════════════════════════════
            CTA
        ═══════════════════════════════════════════════════════════════════ */}
        <PinnedSection opacity={ctaOpacity} y={ctaY} zIndex={50}>
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[clamp(2.5rem,9vw,7rem)] font-semibold tracking-[-0.04em] leading-[0.95] mb-10">
              <span 
                style={{
                  background: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.skyBlue} 50%, ${COLORS.softPink} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Ready to see?
              </span>
            </h2>

            <p className="text-base md:text-lg text-white/35 font-light max-w-md mx-auto mb-12 leading-relaxed">
              Upload your ChatGPT export and discover the truth about your AI conversations.
            </p>

            <Link href="/terms">
              <motion.button
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: `0 20px 50px ${COLORS.blue}35`,
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-10 py-4 rounded-full text-base font-semibold overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.skyBlue})`,
                  boxShadow: `0 10px 35px ${COLORS.blue}25`,
                }}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative z-10 text-white">Begin Analysis</span>
              </motion.button>
            </Link>

            {/* Footer */}
            <div className="mt-20 flex flex-col items-center gap-5">
              <div className="flex items-center gap-3 text-white/20 text-xs tracking-wide">
                <span>University of Leeds</span>
                <span className="w-0.5 h-0.5 rounded-full bg-current" />
                <span>COMM3705</span>
                <span className="w-0.5 h-0.5 rounded-full bg-current" />
                <span>May 2026</span>
              </div>
              
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.blue}15, ${COLORS.skyBlue}15)`,
                  border: `1px solid ${COLORS.blue}20`,
                }}
              >
                <span className="text-white/30 font-semibold text-xs">Y</span>
              </div>
            </div>
          </div>
        </PinnedSection>
      </div>
    </>
  );
}