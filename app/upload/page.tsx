'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { analyzeExport, type AnalyzeProgress } from '@/lib/pipeline/analyzeExport';

const COLOR = {
  bg: '#eeece5',
  ink: '#1a1816',
  inkMuted: 'rgba(26,24,20,0.55)',
  inkFaint: 'rgba(26,24,20,0.32)',
  inkTrace: 'rgba(26,24,20,0.10)',
  rule: 'rgba(26,24,20,0.15)',
  accent: 'rgba(190,40,30,0.90)',
  accentFaint: 'rgba(190,40,30,0.08)',
} as const;

const SERIF = "'EB Garamond', 'Times New Roman', Georgia, serif";
const MONO = "'Courier Prime', 'Courier New', ui-monospace, monospace";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [detail, setDetail] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [skipAI, setSkipAI] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsAnalysing(true);
    setProgress(5);
    setStage('Reading file');
    setDetail('');

    try {
      const text = await file.text();
      setProgress(10);
      setStage('Parsing conversations');

      let jsonData;
      try {
        jsonData = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON. Upload the conversations.json file from your ChatGPT export.');
      }

      if (!Array.isArray(jsonData)) {
        throw new Error('This file does not look like a ChatGPT conversations.json export.');
      }

      await analyzeExport(jsonData, (p: AnalyzeProgress) => {
        if (p.phase === 'parsing') {
          setProgress(20);
          setStage('Extracting patterns');
          setDetail('');
        } else if (p.phase === 'ai_enriching') {
          if (p.aiProgress) {
            if (p.aiProgress.stage === 'selecting') {
              setProgress(25);
              setStage('Selecting high-signal messages');
              setDetail('');
            } else if (p.aiProgress.stage === 'enriching') {
              const pct = p.aiProgress.batchesTotal > 0
                ? 30 + (p.aiProgress.batchesDone / p.aiProgress.batchesTotal) * 60
                : 30;
              setProgress(Math.round(pct));
              setStage('Reading message content');
              setDetail(`Batch ${p.aiProgress.batchesDone} of ${p.aiProgress.batchesTotal}`);
            } else if (p.aiProgress.stage === 'merging') {
              setProgress(88);
              setStage('Building your profile');
              setDetail(`${p.aiProgress.messagesEnriched} messages analysed`);
            } else if (p.aiProgress.stage === 'synthesizing') {
              setProgress(94);
              setStage('Writing your intelligence briefing');
              setDetail('Synthesising across the full corpus');
            } else if (p.aiProgress.stage === 'failed') {
              setStage('Finalising');
              setDetail('');
            }
          }
        } else if (p.phase === 'storing') {
          setProgress(96);
          setStage('Finalising');
          setDetail('');
        } else if (p.phase === 'done') {
          setProgress(100);
          setStage('Complete');
          setDetail('');
        }
      }, undefined, skipAI);

      setTimeout(() => {
        router.push('/results');
      }, 600);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to analyse file';
      setError(message);
      setIsAnalysing(false);
      setProgress(0);
      setStage('');
      setDetail('');
    }
  }, [router, skipAI]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) handleFile(file);
      else setError('File must be a .json file.');
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDemo = useCallback(async () => {
    setError(null);
    setIsAnalysing(true);
    setProgress(5);
    setStage('Loading demo data');
    setDetail('');
    try {
      const res = await fetch('/demo-conversations.json');
      const jsonData = await res.json();
      await analyzeExport(jsonData, (p: AnalyzeProgress) => {
        if (p.phase === 'parsing') {
          setProgress(20); setStage('Extracting patterns'); setDetail('');
        } else if (p.phase === 'ai_enriching') {
          if (p.aiProgress) {
            if (p.aiProgress.stage === 'selecting') {
              setProgress(25); setStage('Selecting high-signal messages'); setDetail('');
            } else if (p.aiProgress.stage === 'enriching') {
              const pct = p.aiProgress.batchesTotal > 0
                ? 30 + (p.aiProgress.batchesDone / p.aiProgress.batchesTotal) * 60
                : 30;
              setProgress(Math.round(pct));
              setStage('Reading message content');
              setDetail(`Batch ${p.aiProgress.batchesDone} of ${p.aiProgress.batchesTotal}`);
            } else if (p.aiProgress.stage === 'synthesizing') {
              setProgress(92); setStage('Synthesising profile'); setDetail('');
            }
          }
        } else if (p.phase === 'done') {
          setProgress(100); setStage('Analysis complete'); setDetail('');
        }
      }, undefined, skipAI);
      router.push('/results');
    } catch (err: any) {
      setIsAnalysing(false);
      setError(err?.message || 'Demo failed to load.');
    }
  }, [router, skipAI]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
        html, body { background: ${COLOR.bg}; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        ::selection { background: ${COLOR.accent}; color: ${COLOR.bg}; }
      `}</style>

      <main style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        background: COLOR.bg,
        color: COLOR.ink,
        fontFamily: SERIF,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <header style={{
          height: '52px', padding: '0 clamp(1.5rem, 4vw, 3rem)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${COLOR.inkTrace}`,
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: SERIF, fontSize: '1.1rem', letterSpacing: '-0.02em', color: COLOR.ink }}>
              trace<span style={{ color: COLOR.accent }}>.ai</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: COLOR.inkFaint }}>
              {isAnalysing ? 'Analysing' : 'Upload'}
            </span>
            <div style={{ width: '1px', height: '12px', background: COLOR.inkTrace }} />
            <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: COLOR.inkFaint }}>2026</span>
          </div>
        </header>

        <section style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(3rem, 7vw, 5rem) clamp(1.5rem, 4vw, 3rem)',
        }}>
          <AnimatePresence mode="wait">
            {!isAnalysing ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                style={{ width: '100%', maxWidth: '720px' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
                  style={{ marginBottom: '56px', textAlign: 'center' }}
                >
                  <h1 style={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: 'clamp(2.5rem, 5.5vw, 4rem)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    margin: '0 0 1.5rem 0',
                    color: COLOR.ink,
                  }}>
                    Upload your export
                  </h1>
                  <p style={{
                    fontFamily: SERIF,
                    fontSize: 'clamp(1.05rem, 1.9vw, 1.25rem)',
                    lineHeight: 1.65,
                    color: COLOR.inkMuted,
                    maxWidth: '520px',
                    margin: '0 auto',
                  }}>
                    The file is called <span style={{ fontFamily: MONO, fontSize: '0.9em', color: COLOR.ink }}>conversations.json</span>.
                    Obtain it from ChatGPT under Settings → Data Controls → Export Data.
                  </p>
                </motion.div>

                {/* Drop zone */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
                  style={{ position: 'relative' }}
                >
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />

                  {/* Tooltip — anchored to drop zone container */}
                  <AnimatePresence>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 12px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: COLOR.ink,
                          color: COLOR.bg,
                          padding: '0.9rem 1.35rem',
                          pointerEvents: 'none',
                          zIndex: 10,
                          width: 'max-content',
                          maxWidth: '380px',
                        }}
                      >
                        <div style={{
                          fontFamily: MONO,
                          fontSize: '9px',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: 'rgba(238,236,229,0.45)',
                          marginBottom: '0.5rem',
                        }}>
                          How to get the file
                        </div>
                        <ol style={{
                          fontFamily: MONO,
                          fontSize: '11px',
                          letterSpacing: '0.04em',
                          color: 'rgba(238,236,229,0.88)',
                          lineHeight: 1.7,
                          margin: 0,
                          paddingLeft: '1.2rem',
                          textAlign: 'left',
                        }}>
                          <li>ChatGPT → Settings → Data Controls</li>
                          <li>Export data → Confirm</li>
                          <li>Wait for email (usually 2–5 minutes)</li>
                          <li>Download zip, unzip, upload conversations.json</li>
                        </ol>
                        <div style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: `6px solid ${COLOR.ink}`,
                        }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <label
                    htmlFor="file-upload"
                    style={{ cursor: 'pointer', display: 'block' }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        padding: 'clamp(4rem, 9vw, 6.5rem) clamp(2rem, 5vw, 3.5rem)',
                        border: `2px dashed ${isDragging ? COLOR.accent : COLOR.rule}`,
                        background: isDragging ? COLOR.accentFaint : 'transparent',
                        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      {/* Corner brackets */}
                      {[
                        { top: 14, left: 14, d: 'M 0 18 L 0 0 L 18 0' },
                        { top: 14, right: 14, d: 'M 4 0 L 22 0 L 22 18' },
                        { bottom: 14, left: 14, d: 'M 0 4 L 0 22 L 18 22' },
                        { bottom: 14, right: 14, d: 'M 4 22 L 22 22 L 22 4' },
                      ].map((corner, i) => (
                        <svg key={i} style={{ position: 'absolute', ...corner, pointerEvents: 'none' }} width="22" height="22">
                          <path d={corner.d} fill="none" stroke={isDragging ? COLOR.accent : COLOR.inkTrace} strokeWidth="2" style={{ transition: 'stroke 0.3s' }} />
                        </svg>
                      ))}

                      <div style={{
                        fontFamily: MONO,
                        fontSize: '11px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: isDragging ? COLOR.accent : COLOR.inkFaint,
                        marginBottom: '1rem',
                        transition: 'color 0.3s',
                      }}>
                        {isDragging ? 'Release to upload' : 'Drop file here'}
                      </div>
                      <div style={{
                        fontFamily: SERIF,
                        fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                        color: COLOR.inkMuted,
                        fontStyle: 'italic',
                      }}>
                        or click to browse
                      </div>
                    </div>
                  </label>
                </motion.div>

                {/* AI enrichment toggle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.55, ease: EASE }}
                  style={{
                    marginTop: '1.5rem',
                    padding: '1rem 1.25rem',
                    border: `1px solid ${COLOR.rule}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSkipAI(v => !v)}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 16,
                    height: 16,
                    border: `1px solid ${skipAI ? COLOR.inkFaint : COLOR.accent}`,
                    background: skipAI ? 'transparent' : COLOR.accentFaint,
                    flexShrink: 0,
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {!skipAI && (
                      <div style={{ width: 8, height: 8, background: COLOR.accent }} />
                    )}
                  </div>
                  <div>
                    <p style={{
                      fontFamily: MONO,
                      fontSize: '10px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: skipAI ? COLOR.inkFaint : COLOR.ink,
                      marginBottom: '0.3rem',
                      transition: 'color 0.2s',
                    }}>
                      {skipAI ? 'AI enrichment disabled' : 'AI enrichment enabled'}
                    </p>
                    <p style={{
                      fontFamily: SERIF,
                      fontSize: '0.95rem',
                      color: COLOR.inkMuted,
                      lineHeight: 1.6,
                    }}>
                      {skipAI
                        ? 'Analysis will use pattern-matching only. No conversation content is sent to any external service.'
                        : 'Selected excerpts are sent to the Anthropic API for enrichment. Click to disable if you prefer not to share data with this service.'}
                    </p>
                  </div>
                </motion.div>

                {/* Demo button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.7, ease: EASE }}
                  style={{ marginTop: '1.75rem', textAlign: 'center' }}
                >
                  <button
                    onClick={handleDemo}
                    style={{
                      fontFamily: MONO, fontSize: '10px', letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: COLOR.inkFaint,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0.5rem 0', borderBottom: `1px solid ${COLOR.rule}`,
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = COLOR.inkMuted; e.currentTarget.style.borderColor = COLOR.inkFaint; }}
                    onMouseLeave={e => { e.currentTarget.style.color = COLOR.inkFaint; e.currentTarget.style.borderColor = COLOR.rule; }}
                  >
                    No file? Try demo data →
                  </button>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      style={{
                        marginTop: '2.5rem',
                        padding: '1.4rem 1.75rem',
                        border: `1px solid ${COLOR.accent}`,
                        background: COLOR.accentFaint,
                      }}
                    >
                      <div style={{
                        fontFamily: MONO,
                        fontSize: '10px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: COLOR.accent,
                        marginBottom: '0.6rem',
                      }}>
                        Upload failed
                      </div>
                      <div style={{
                        fontFamily: SERIF,
                        fontSize: '15px',
                        color: COLOR.ink,
                        lineHeight: 1.6,
                      }}>
                        {error}
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
                transition={{ duration: 0.8, ease: EASE }}
                style={{ width: '100%', maxWidth: '640px', textAlign: 'center' }}
              >
                <div style={{
                  fontFamily: MONO,
                  fontSize: '10px',
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: COLOR.inkFaint,
                  marginBottom: '2rem',
                }}>
                  In progress
                </div>

                <h2 style={{
                  fontFamily: SERIF,
                  fontWeight: 400,
                  fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  margin: '0 0 2.5rem 0',
                  color: COLOR.ink,
                  minHeight: '56px',
                }}>
                  {stage}<span style={{ color: COLOR.accent }}>.</span>
                </h2>

                {/* Progress bar */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <div style={{ position: 'relative', height: '1px', background: COLOR.inkTrace }}>
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: EASE }}
                      style={{
                        position: 'absolute', top: 0, left: 0,
                        height: '100%', background: COLOR.accent,
                      }}
                    />
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginTop: '0.5rem',
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.12em', color: COLOR.inkFaint }}>
                      {detail || '\u00A0'}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.12em', color: COLOR.accent }}>
                      {progress}%
                    </span>
                  </div>
                </div>

                <div style={{
                  marginTop: '4.5rem',
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: COLOR.inkFaint,
                  lineHeight: 1.6,
                }}>
                  This will redirect automatically when complete.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <footer style={{
          height: '44px', padding: '0 clamp(1.5rem, 4vw, 3rem)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: MONO, fontSize: '10px', letterSpacing: '0.18em',
          textTransform: 'uppercase', color: COLOR.inkFaint,
          borderTop: `1px solid ${COLOR.inkTrace}`,
        }}>
          File parsed in browser · AI enrichment takes 20–40 seconds
        </footer>
      </main>
    </>
  );
}
