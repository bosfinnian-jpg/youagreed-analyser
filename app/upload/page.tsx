'use client';
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { analyseChatHistory } from '@/lib/analyser';

// CSS Keyframes injected once - much more performant than JS animations
const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes gradient-rotate {
      0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
      50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.15); }
      100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
    }
    
    @keyframes gradient-rotate-reverse {
      0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
      50% { transform: translate(-50%, -50%) rotate(-180deg) scale(1.2); }
      100% { transform: translate(-50%, -50%) rotate(-360deg) scale(1); }
    }
    
    @keyframes light-sweep {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.7; }
      100% { transform: scale(1.8); opacity: 0; }
    }
    
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    
    @keyframes breathe {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    
    .gradient-orb-1 {
      animation: gradient-rotate 30s ease-in-out infinite;
      will-change: transform;
      contain: strict;
    }
    
    .gradient-orb-2 {
      animation: gradient-rotate-reverse 35s ease-in-out infinite;
      animation-delay: -5s;
      will-change: transform;
      contain: strict;
    }
    
    .light-sweep {
      animation: light-sweep 60s linear infinite;
      will-change: transform;
      contain: strict;
    }
    
    .pulse-ring {
      animation: pulse-ring 2s ease-out infinite;
      will-change: transform, opacity;
    }
    
    .spin-slow {
      animation: spin-slow 3s linear infinite;
      will-change: transform;
    }
    
    .shimmer {
      animation: shimmer 1.5s linear infinite;
      will-change: transform;
    }
    
    .breathe {
      animation: breathe 2s ease-in-out infinite;
    }
    
    /* Optimized backdrop blur - only where essential */
    .glass-subtle {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .glass-medium {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    
    /* GPU acceleration hints */
    .gpu-accelerated {
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    
    /* Contain paint for complex elements */
    .contain-paint {
      contain: paint;
    }
  `}</style>
);

// Memoized static background - never re-renders
const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradient orbs - CSS animated, GPU accelerated */}
    <div
      className="gradient-orb-1 absolute top-1/2 left-1/4"
      style={{
        width: '1000px',
        height: '1000px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(36, 121, 223, 0.35) 0%, transparent 70%)',
        filter: 'blur(80px)',
        contain: 'strict',
      }}
    />
    <div
      className="gradient-orb-2 absolute top-1/4 right-0"
      style={{
        width: '1200px',
        height: '1200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(176, 195, 253, 0.3) 0%, transparent 70%)',
        filter: 'blur(100px)',
        contain: 'strict',
      }}
    />
    
    {/* Static grid - no animation needed */}
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(59, 155, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 155, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }}
    />
    
    {/* Light sweep - CSS animated */}
    <div 
      className="light-sweep absolute top-1/2 left-1/2 opacity-20"
      style={{
        width: '800px',
        height: '800px',
        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 155, 255, 0.15) 45deg, transparent 90deg)',
        contain: 'strict',
      }}
    />
  </div>
);

// Memoized feature card component
const FeatureCard = ({ feature, index }: { feature: typeof FEATURES[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
    whileHover={{ y: -8 }}
    className="relative group gpu-accelerated"
  >
    <div 
      className="relative p-8 rounded-3xl h-full glass-subtle transition-all duration-300 group-hover:border-white/20"
      style={{
        boxShadow: `0 10px 40px ${feature.glowColor}`,
      }}
    >
      <div className="relative z-10">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${feature.colors[0]}20, ${feature.colors[1]}20)`,
            boxShadow: `0 10px 30px ${feature.glowColor}`,
          }}
        >
          {feature.emoji}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
        <p className="text-white/70 leading-relaxed">{feature.description}</p>
      </div>
      
      {/* Bottom accent - CSS transition only */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl transition-transform duration-500 origin-left scale-x-0 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${feature.colors[0]}, ${feature.colors[1]})` }}
      />
    </div>
  </motion.div>
);

// Static data - defined outside component to prevent recreation
const STAGES = [
  'Reading file...',
  'Parsing conversations...',
  'Extracting patterns...',
  'Analysing vulnerability...',
  'Finding sensitive data...',
  'Finalising results...'
];

const FEATURES = [
  {
    emoji: '🔐',
    title: 'Privacy insights',
    description: "See exactly what personal data you've shared with AI and get actionable privacy recommendations.",
    colors: ['#2479df', '#5eb3ff'],
    glowColor: 'rgba(36, 121, 223, 0.25)',
  },
  {
    emoji: '📊',
    title: 'Conversation patterns',
    description: 'Beautiful visualizations of your topics, habits, and engagement over time.',
    colors: ['#3b9bff', '#b0c3fd'],
    glowColor: 'rgba(59, 155, 255, 0.25)',
  },
  {
    emoji: '🌍',
    title: 'Carbon footprint',
    description: 'Calculate your environmental impact and see how it compares to real-world activities.',
    colors: ['#b0c3fd', '#ffccee'],
    glowColor: 'rgba(176, 195, 253, 0.25)',
  },
];

const STATS = [
  { number: '40', label: 'Credit project', colors: ['#2479df', '#3b9bff'] },
  { number: 'May', label: '2026 Exhibition', colors: ['#3b9bff', '#b0c3fd'] },
  { number: '100%', label: 'Browser-local', colors: ['#b0c3fd', '#d4b8ff'] },
];

const ANALYSIS_STEPS = [
  { emoji: '📊', label: 'Parsing', color: '#2479df', threshold: 30 },
  { emoji: '🔍', label: 'Patterns', color: '#3b9bff', threshold: 60 },
  { emoji: '🌍', label: 'Impact', color: '#b0c3fd', threshold: 90 },
];

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  // Memoized animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: prefersReducedMotion ? 0 : 0.5 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.3 }
    }
  }), [prefersReducedMotion]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsAnalysing(true);
    setProgress(0);
    setStage(STAGES[0]);

    try {
      const text = await file.text();
      setProgress(15);
      setStage(STAGES[1]);
      await new Promise(resolve => setTimeout(resolve, 250));

      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file. Please upload a ChatGPT export.');
      }
      setProgress(30);
      setStage(STAGES[2]);
      await new Promise(resolve => setTimeout(resolve, 250));

      setProgress(45);
      setStage(STAGES[3]);
      await new Promise(resolve => setTimeout(resolve, 250));

      const results = analyseChatHistory(jsonData);
      setProgress(70);
      setStage(STAGES[4]);
      await new Promise(resolve => setTimeout(resolve, 250));

      setProgress(85);
      setStage(STAGES[5]);
      await new Promise(resolve => setTimeout(resolve, 250));

      sessionStorage.setItem('analysisResults', JSON.stringify(results));
      setProgress(100);

      setTimeout(() => {
        router.push('/results');
      }, 600);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyse file';
      setError(message);
      setIsAnalysing(false);
      setProgress(0);
      setStage('');
    }
  }, [router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        handleFile(file);
      } else {
        setError('Please upload a JSON file');
      }
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #1a0a28 50%, #0a1428 100%)'
      }}
    >
      <GlobalStyles />
      <BackgroundEffects />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!isAnalysing ? (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-[1400px] mx-auto px-6 py-16"
            >
              {/* Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-8"
                  style={{
                    background: 'linear-gradient(135deg, rgba(36, 121, 223, 0.2), rgba(176, 195, 253, 0.2))',
                    border: '1px solid rgba(59, 155, 255, 0.3)',
                    boxShadow: '0 0 40px rgba(59, 155, 255, 0.15)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full spin-slow"
                    style={{
                      background: 'linear-gradient(135deg, #3b9bff, #b0c3fd)',
                      boxShadow: '0 0 10px rgba(59, 155, 255, 0.5)',
                    }}
                  />
                  <span className="text-white font-semibold text-sm">
                    COMM3705 Digital Media Project — University of Leeds
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-7xl md:text-8xl font-black mb-6 tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 20%, #3b9bff 50%, #b0c3fd 80%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Discover what
                  <br />
                  you've shared
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                  Visualize your AI conversations. Understand your privacy. Calculate your impact.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-wrap items-center justify-center gap-8 text-white/60"
                >
                  {['⚡ Instant', '🔒 Private', '✓ Free'].map((item, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-2 text-lg font-medium transition-colors duration-200 hover:text-white/90"
                    >
                      {item}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* Upload section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="max-w-5xl mx-auto mb-20"
              >
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      relative p-16 rounded-[32px] overflow-hidden group
                      transition-all duration-300 ease-out
                      ${isDragging ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
                    `}
                    style={{
                      background: isDragging
                        ? 'linear-gradient(135deg, rgba(36, 121, 223, 0.15), rgba(59, 155, 255, 0.15))'
                        : 'linear-gradient(135deg, rgba(36, 121, 223, 0.08), rgba(176, 195, 253, 0.08))',
                      boxShadow: isDragging 
                        ? '0 30px 90px rgba(59, 155, 255, 0.35), 0 0 0 2px rgba(59, 155, 255, 0.4)'
                        : '0 20px 60px rgba(36, 121, 223, 0.25), 0 0 0 1px rgba(59, 155, 255, 0.2)',
                    }}
                  >
                    {/* Hover gradient border effect */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[32px]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 155, 255, 0.3), rgba(176, 195, 253, 0.3), rgba(255, 204, 238, 0.3))',
                        padding: '2px',
                        maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'xor',
                      }}
                    />

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      <div className={`mb-10 inline-block transition-transform duration-300 ${isDragging ? '-translate-y-4' : ''}`}>
                        <div 
                          className="relative w-32 h-32 rounded-3xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: 'linear-gradient(135deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
                            boxShadow: '0 25px 70px rgba(36, 121, 223, 0.5), inset 0 2px 30px rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          <div className={`transition-transform duration-300 ${isDragging ? 'rotate-180' : ''}`}>
                            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>

                          {/* Pulse ring - CSS animated */}
                          <div 
                            className="absolute inset-0 rounded-3xl pulse-ring"
                            style={{ 
                              border: '2px solid rgba(59, 155, 255, 0.5)',
                              pointerEvents: 'none',
                            }}
                          />
                        </div>
                      </div>

                      <h3 
                        className="text-4xl font-bold mb-4"
                        style={{
                          background: 'linear-gradient(135deg, #ffffff, #b0c3fd)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        Drop your conversations.json
                      </h3>
                      <p className="text-white/60 text-xl mb-10">
                        or click to browse
                      </p>

                      <div 
                        className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl glass-subtle"
                      >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #3b9bff, #b0c3fd)',
                            boxShadow: '0 4px 16px rgba(59, 155, 255, 0.3)',
                          }}
                        >
                          <span className="text-xl">💡</span>
                        </div>
                        <div className="text-left">
                          <div className="text-white/90 font-medium">Export from ChatGPT</div>
                          <div className="text-white/50 text-sm">Settings → Data Controls → Export Data</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </motion.div>

              {/* Feature cards */}
              <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-20">
                {FEATURES.map((feature, i) => (
                  <FeatureCard key={i} feature={feature} index={i} />
                ))}
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="max-w-5xl mx-auto mb-16"
              >
                <div className="grid grid-cols-3 gap-6">
                  {STATS.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + i * 0.1, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative p-6 rounded-2xl glass-subtle text-center gpu-accelerated"
                    >
                      <div 
                        className="text-5xl font-black mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${stat.colors[0]}, ${stat.colors[1]})`,                        
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {stat.number}
                      </div>
                      <div className="text-white/70 font-medium">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Privacy notice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="max-w-3xl mx-auto"
              >
                <div 
                  className="relative p-8 rounded-3xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(36, 121, 223, 0.12), rgba(176, 195, 253, 0.12))',
                    border: '1px solid rgba(59, 155, 255, 0.3)',
                    boxShadow: '0 20px 60px rgba(36, 121, 223, 0.15)',
                  }}
                >
                  <div className="relative z-10 flex items-start gap-5">
                    <div 
                      className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #2479df, #3b9bff)',
                        boxShadow: '0 8px 24px rgba(36, 121, 223, 0.4)',
                      }}
                    >
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white text-xl font-bold mb-3">
                        Your data stays yours
                      </h4>
                      <p className="text-white/70 leading-relaxed">
                        All processing happens locally in your browser. By uploading, you consent 
                        to anonymised excerpts being displayed in our exhibition space (Section 19, Terms of Service).
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="max-w-2xl mx-auto mt-8"
                  >
                    <div 
                      className="p-6 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245, 108, 92, 0.15), rgba(245, 108, 92, 0.1))',
                        border: '1px solid rgba(245, 108, 92, 0.3)',
                        boxShadow: '0 10px 40px rgba(245, 108, 92, 0.2)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(245, 108, 92, 0.2)' }}
                        >
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <div>
                          <h4 className="text-[#f56c5c] font-bold mb-1 text-lg">Upload failed</h4>
                          <p className="text-[#f56c5c]/90">{error}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Analysis state */
            <motion.div
              key="analysing"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center justify-center min-h-screen px-6"
            >
              <div className="max-w-2xl w-full text-center">
                {/* Animated icon */}
                <div className="relative inline-block mb-12">
                  <div
                    className="w-40 h-40 rounded-3xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
                      boxShadow: '0 30px 80px rgba(36, 121, 223, 0.5)',
                    }}
                  >
                    <div className="spin-slow">
                      <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>

                    <div 
                      className="absolute inset-0 rounded-3xl pulse-ring"
                      style={{ border: '2px solid rgba(59, 155, 255, 0.6)' }}
                    />
                  </div>
                </div>

                <h2 
                  className="text-6xl font-black mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff, #3b9bff, #b0c3fd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Analysing your data
                </h2>
                <p className="text-white/60 text-xl mb-16">{stage}</p>

                {/* Progress bar */}
                <div className="mb-16">
                  <div 
                    className="h-4 rounded-full overflow-hidden mb-4"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div
                      className="h-full relative transition-[width] duration-300 ease-out"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
                        boxShadow: '0 0 30px rgba(59, 155, 255, 0.8)',
                      }}
                    >
                      <div
                        className="absolute inset-0 shimmer"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold breathe"
                    style={{
                      background: 'linear-gradient(135deg, #3b9bff, #b0c3fd)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {progress}%
                  </div>
                </div>

                {/* Analysis steps */}
                <div className="grid grid-cols-3 gap-6">
                  {ANALYSIS_STEPS.map((step, i) => {
                    const isActive = progress > step.threshold;
                    return (
                      <div
                        key={i}
                        className="p-6 rounded-2xl transition-all duration-300"
                        style={{
                          opacity: isActive ? 1 : 0.3,
                          transform: isActive ? 'scale(1)' : 'scale(0.95)',
                          background: isActive 
                            ? `linear-gradient(135deg, ${step.color}30, ${step.color}15)`
                            : 'rgba(255, 255, 255, 0.03)',
                          border: isActive 
                            ? `1px solid ${step.color}40`
                            : '1px solid rgba(255, 255, 255, 0.05)',
                          boxShadow: isActive 
                            ? `0 10px 30px ${step.color}25`
                            : 'none',
                        }}
                      >
                        <div className="text-4xl mb-3">{step.emoji}</div>
                        <div className="text-white/80 font-semibold">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}