'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { analyseChatHistory } from '@/lib/analyser';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const router = useRouter();

  const stages = [
    'Reading file...',
    'Parsing conversations...',
    'Extracting patterns...',
    'Analysing vulnerability...',
    'Finding sensitive data...',
    'Finalising results...'
  ];

  const handleFile = async (file: File) => {
    setError(null);
    setIsAnalysing(true);
    setProgress(0);
    setStage(stages[0]);

    try {
      const text = await file.text();
      setProgress(15);
      setStage(stages[1]);
      await new Promise(resolve => setTimeout(resolve, 300));

      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON file. Please upload a ChatGPT export.');
      }
      setProgress(30);
      setStage(stages[2]);
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(45);
      setStage(stages[3]);
      await new Promise(resolve => setTimeout(resolve, 300));

      const results = analyseChatHistory(jsonData);
      setProgress(70);
      setStage(stages[4]);
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(85);
      setStage(stages[5]);
      await new Promise(resolve => setTimeout(resolve, 300));

      sessionStorage.setItem('analysisResults', JSON.stringify(results));
      setProgress(100);

      setTimeout(() => {
        router.push('/results');
      }, 800);

    } catch (err: any) {
      setError(err.message || 'Failed to analyse file');
      setIsAnalysing(false);
      setProgress(0);
      setStage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
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
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #0a0a14 0%, #1a0a28 50%, #0a1428 100%)'
    }}>
      {/* Optimized gradient mesh - reduced complexity */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #2479df 0%, transparent 70%)',
            willChange: 'transform',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute top-0 -right-1/2 w-[1200px] h-[1200px] rounded-full opacity-25 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, #b0c3fd 0%, transparent 70%)',
            willChange: 'transform',
          }}
        />
      </div>

      {/* Static grid pattern - no animation needed */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(59, 155, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59, 155, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
      }} />

      {/* Simplified light beams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 155, 255, 0.1) 45deg, transparent 90deg)',
            willChange: 'transform',
          }}
        />
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!isAnalysing ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[1400px] mx-auto px-6 py-16"
            >
              {/* Header */}
              <div className="text-center mb-16">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-8 backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(36, 121, 223, 0.2), rgba(176, 195, 253, 0.2))',
                    border: '1px solid rgba(59, 155, 255, 0.3)',
                    boxShadow: '0 0 40px rgba(59, 155, 255, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #3b9bff, #b0c3fd)',
                      boxShadow: '0 0 10px rgba(59, 155, 255, 0.5)',
                      willChange: 'transform',
                    }}
                  />
                  <span className="text-white font-semibold text-sm">
                    COMM3705 Digital Media Project — University of Leeds
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-7xl md:text-8xl font-black mb-6 tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 20%, #3b9bff 50%, #b0c3fd 80%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 80px rgba(59, 155, 255, 0.3)',
                  }}
                >
                  Discover what
                  <br />
                  you've shared
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-2xl text-white/70 max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                  Visualize your AI conversations. Understand your privacy. Calculate your impact.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap items-center justify-center gap-8 text-white/60"
                >
                  {['⚡ Instant', '🔒 Private', '✓ Free'].map((item, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05, color: 'rgba(255, 255, 255, 0.9)' }}
                      className="flex items-center gap-2 text-lg font-medium"
                    >
                      {item}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Main upload section - optimized animations */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
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
                  <motion.div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    whileHover={{ scale: 1.02 }}
                    animate={{
                      boxShadow: isDragging 
                        ? '0 30px 90px rgba(59, 155, 255, 0.4), 0 0 0 2px rgba(59, 155, 255, 0.4), inset 0 0 60px rgba(59, 155, 255, 0.2)'
                        : '0 20px 60px rgba(36, 121, 223, 0.3), 0 0 0 1px rgba(59, 155, 255, 0.2)',
                    }}
                    className="relative p-16 rounded-[32px] backdrop-blur-xl overflow-hidden group transition-all duration-500"
                    style={{
                      background: isDragging
                        ? 'linear-gradient(135deg, rgba(36, 121, 223, 0.15), rgba(59, 155, 255, 0.15))'
                        : 'linear-gradient(135deg, rgba(36, 121, 223, 0.08), rgba(176, 195, 253, 0.08))',
                    }}
                  >
                    {/* Simplified hover effects */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 155, 255, 0.2), rgba(176, 195, 253, 0.2), rgba(255, 204, 238, 0.2))',
                        maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'xor',
                        padding: '2px',
                        borderRadius: '32px',
                      }}
                    />

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      <motion.div
                        animate={{
                          y: isDragging ? -15 : 0,
                        }}
                        className="mb-10 inline-block"
                      >
                        <div 
                          className="relative w-32 h-32 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
                          style={{
                            background: 'linear-gradient(135deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
                            boxShadow: '0 25px 70px rgba(36, 121, 223, 0.5), inset 0 2px 30px rgba(255, 255, 255, 0.3)',
                          }}
                        >
                          <motion.div
                            animate={{
                              rotate: isDragging ? [0, 180] : 0,
                            }}
                            transition={{ duration: 0.6 }}
                          >
                            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </motion.div>

                          {/* Simplified pulsing glow */}
                          <motion.div
                            className="absolute inset-0 rounded-3xl"
                            animate={{
                              boxShadow: [
                                '0 0 0 0 rgba(59, 155, 255, 0.7)',
                                '0 0 0 40px rgba(59, 155, 255, 0)',
                              ],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          />
                        </div>
                      </motion.div>

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
                        className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
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
                  </motion.div>
                </label>
              </motion.div>

              {/* Feature cards - optimized */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-20"
              >
                {[
                  {
                    emoji: '🔐',
                    title: 'Privacy insights',
                    description: 'See exactly what personal data you\'ve shared with AI and get actionable privacy recommendations.',
                    gradient: 'from-[#2479df] to-[#5eb3ff]',
                    glowColor: 'rgba(36, 121, 223, 0.4)',
                  },
                  {
                    emoji: '📊',
                    title: 'Conversation patterns',
                    description: 'Beautiful visualizations of your topics, habits, and engagement over time.',
                    gradient: 'from-[#3b9bff] to-[#b0c3fd]',
                    glowColor: 'rgba(59, 155, 255, 0.4)',
                  },
                  {
                    emoji: '🌍',
                    title: 'Carbon footprint',
                    description: 'Calculate your environmental impact and see how it compares to real-world activities.',
                    gradient: 'from-[#b0c3fd] to-[#ffccee]',
                    glowColor: 'rgba(176, 195, 253, 0.4)',
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="relative group"
                  >
                    <div 
                      className="relative p-8 rounded-3xl h-full backdrop-blur-xl transition-all duration-500"
                      style={{
                        background: `linear-gradient(135deg, ${feature.gradient.split('-')[1].replace('[', '').replace(']', '')}15, ${feature.gradient.split('-')[2].replace('[', '').replace(']', '')}15)`,
                        border: `1px solid ${feature.gradient.split('-')[1].replace('[', '').replace(']', '')}30`,
                        boxShadow: `0 10px 40px ${feature.glowColor}`,
                      }}
                    >
                      <div className="relative z-10">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform duration-500"
                          style={{
                            background: `linear-gradient(135deg, ${feature.gradient.split('-')[1].replace('[', '').replace(']', '')}15, ${feature.gradient.split('-')[2].replace('[', '').replace(']', '')}15)`,
                            boxShadow: `0 10px 30px ${feature.glowColor}`,
                          }}
                        >
                          {feature.emoji}
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-white/70 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Animated bottom border */}
                      <motion.div 
                        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                        style={{ transformOrigin: 'left' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats with gradient cards - updated with honest claims */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="max-w-5xl mx-auto mb-16"
              >
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { number: '40', label: 'Credit project', gradient: 'from-[#2479df] to-[#3b9bff]' },
                    { number: 'May', label: '2026 Exhibition', gradient: 'from-[#3b9bff] to-[#b0c3fd]' },
                    { number: '100%', label: 'Browser-local', gradient: 'from-[#b0c3fd] to-[#d4b8ff]' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1 + i * 0.1, type: "spring" }}
                      whileHover={{ scale: 1.05 }}
                      className="relative p-6 rounded-2xl backdrop-blur-xl text-center"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div 
                        className="text-5xl font-black mb-2"
                        style={{
                          background: `linear-gradient(135deg, 
                          ${stat.gradient.split('-')[1].replace('[', '').replace(']', '')}, 
                          ${stat.gradient.split('-')[2].replace('[', '').replace(']', '')}
                        )`,                        
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

              {/* Privacy notice - simplified animations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="max-w-3xl mx-auto"
              >
                <div 
                  className="relative p-8 rounded-3xl backdrop-blur-xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(36, 121, 223, 0.12), rgba(176, 195, 253, 0.12))',
                    border: '1px solid rgba(59, 155, 255, 0.3)',
                    boxShadow: '0 20px 60px rgba(36, 121, 223, 0.2)',
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
                      className="p-6 rounded-2xl backdrop-blur-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245, 108, 92, 0.15), rgba(245, 108, 92, 0.1))',
                        border: '1px solid rgba(245, 108, 92, 0.3)',
                        boxShadow: '0 10px 40px rgba(245, 108, 92, 0.3)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(245, 108, 92, 0.2)',
                          }}
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
            <motion.div
              key="analysing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-screen px-6"
            >
              <div className="max-w-2xl w-full text-center">
                {/* Animated icon */}
                <motion.div className="relative inline-block mb-12">
                  <motion.div
                    className="w-40 h-40 rounded-3xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
                      boxShadow: '0 30px 80px rgba(36, 121, 223, 0.5)',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ willChange: 'transform' }}
                    >
                      <svg className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.div>

                    <motion.div
                      className="absolute inset-0 rounded-3xl"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(59, 155, 255, 0.7)',
                          '0 0 0 50px rgba(59, 155, 255, 0)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                </motion.div>

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

                {/* Progress */}
                <div className="mb-16">
                  <div 
                    className="h-4 rounded-full overflow-hidden backdrop-blur-sm mb-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <motion.div
                      className="h-full relative"
                      style={{
                        background: 'linear-gradient(90deg, #2479df 0%, #3b9bff 50%, #b0c3fd 100%)',
                        boxShadow: '0 0 30px rgba(59, 155, 255, 0.8)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
                        }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  </div>
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #3b9bff, #b0c3fd)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {progress}%
                  </motion.div>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { emoji: '📊', label: 'Parsing', color: '#2479df', threshold: 30 },
                    { emoji: '🔍', label: 'Patterns', color: '#3b9bff', threshold: 60 },
                    { emoji: '🌍', label: 'Impact', color: '#b0c3fd', threshold: 90 },
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        opacity: progress > step.threshold ? 1 : 0.3,
                        scale: progress > step.threshold ? 1 : 0.9,
                      }}
                      className="p-6 rounded-2xl backdrop-blur-xl"
                      style={{
                        background: progress > step.threshold 
                          ? `linear-gradient(135deg, ${step.color}30, ${step.color}15)`
                          : 'rgba(255, 255, 255, 0.03)',
                        border: progress > step.threshold 
                          ? `1px solid ${step.color}40`
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: progress > step.threshold 
                          ? `0 10px 30px ${step.color}30`
                          : 'none',
                      }}
                    >
                      <div className="text-4xl mb-3">{step.emoji}</div>
                      <div className="text-white/80 font-semibold">{step.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}