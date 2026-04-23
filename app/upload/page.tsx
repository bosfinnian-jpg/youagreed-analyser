'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { analyzeExport, type AnalyzeProgress } from '@/app/results/analyzeExport';

// ============================================================================
// TRACE.AI — Upload
// The procedural beat between consent and reveal.
// One job: take the file, show honest progress, move on.
// ============================================================================

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
      });

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
  }, [router]);

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
        } else if (p.phase === 'complete') {
          setProgress(100); setStage('Analysis complete'); setDetail('');
        }
      });
      router.push('/results');
    } catch (err: any) {
      setIsAnalysing(false);
      setError(err?.message || 'Demo failed to load.');
    }
  }, [router]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
        html, body {
          background: ${COLOR.bg};
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ::selection {
          background: ${COLOR.accent};
          color: ${COLOR.bg};
        }
        @media (max-width: 640px) {
          .ya-header, .ya-footer {
            padding-left: 24px !important;
            padding-right: 24px !important;
            font-size: 11px !important;
          }
          .ya-main {
            padding: 48px 24px !important;
          }
          .ya-dropzone {
            padding: 56px 24px !important;
          }
        }
      `}</style>

      <main
        style={{
          minHeight: '100vh',
          background: COLOR.bg,
          color: COLOR.ink,
          fontFamily: SERIF,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header — unified site header */}
        <header
          className="ya-header"
          style={{
            height: '52px', padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: `1px solid ${COLOR.inkTrace}`,
          }}
        >
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

        {/* Main content */}
        <section
          className="ya-main"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '64px 48px',
          }}
        >
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
                {/* Instruction */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
                  style={{ marginBottom: '48px', textAlign: 'center' }}
                >
                  <h1
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 400,
                      fontSize: 'clamp(36px, 5vw, 56px)',
                      lineHeight: 1.1,
                      letterSpacing: '-0.015em',
                      margin: '0 0 24px 0',
                      color: COLOR.ink,
                    }}
                  >
                    Upload your export
                  </h1>
                  <p
                    style={{
                      fontFamily: SERIF,
                      fontSize: '17px',
                      lineHeight: 1.6,
                      color: COLOR.inkMuted,
                      maxWidth: '480px',
                      margin: '0 auto',
                    }}
                  >
                    The file is called <span style={{ fontFamily: MONO, fontSize: '14px', color: COLOR.ink }}>conversations.json</span>.
                    Obtain it from ChatGPT under Settings &rarr; Data Controls &rarr; Export Data.
                  </p>
                </motion.div>

                {/* Drop zone */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
                >
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{ cursor: 'pointer', display: 'block' }}
                  >
                    <div
                      className="ya-dropzone"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      style={{
                        padding: '88px 48px',
                        border: `1px dashed ${isDragging ? COLOR.accent : COLOR.rule}`,
                        background: isDragging ? COLOR.accentFaint : 'transparent',
                        transition: 'border-color 300ms cubic-bezier(0.22, 1, 0.36, 1), background 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDragging) {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(26,24,20,0.35)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDragging) {
                          (e.currentTarget as HTMLDivElement).style.borderColor = COLOR.rule;
                        }
                      }}
                    >
                      {/* Corner bracket marks — document scanning aesthetic */}
                      <svg style={{ position: 'absolute', top: 12, left: 12, pointerEvents: 'none' }} width="20" height="20">
                        <path d="M 0 16 L 0 0 L 16 0" fill="none" stroke={isDragging ? COLOR.accent : 'rgba(26,24,20,0.18)'} strokeWidth="1" style={{ transition: 'stroke 300ms' }} />
                      </svg>
                      <svg style={{ position: 'absolute', top: 12, right: 12, pointerEvents: 'none' }} width="20" height="20">
                        <path d="M 4 0 L 20 0 L 20 16" fill="none" stroke={isDragging ? COLOR.accent : 'rgba(26,24,20,0.18)'} strokeWidth="1" style={{ transition: 'stroke 300ms' }} />
                      </svg>
                      <svg style={{ position: 'absolute', bottom: 12, left: 12, pointerEvents: 'none' }} width="20" height="20">
                        <path d="M 0 4 L 0 20 L 16 20" fill="none" stroke={isDragging ? COLOR.accent : 'rgba(26,24,20,0.18)'} strokeWidth="1" style={{ transition: 'stroke 300ms' }} />
                      </svg>
                      <svg style={{ position: 'absolute', bottom: 12, right: 12, pointerEvents: 'none' }} width="20" height="20">
                        <path d="M 4 20 L 20 20 L 20 4" fill="none" stroke={isDragging ? COLOR.accent : 'rgba(26,24,20,0.18)'} strokeWidth="1" style={{ transition: 'stroke 300ms' }} />
                      </svg>
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: '11px',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: isDragging ? COLOR.accent : COLOR.inkFaint,
                          marginBottom: '16px',
                          transition: 'color 300ms',
                        }}
                      >
                        {isDragging ? 'Release to upload' : 'Drop file here'}
                      </div>
                      <div
                        style={{
                          fontFamily: SERIF,
                          fontSize: '18px',
                          color: COLOR.inkMuted,
                          fontStyle: 'italic',
                        }}
                      >
                        or click to browse
                      </div>
                    </div>
                  </label>
                </motion.div>

                {/* Demo mode */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8, ease: EASE }}
                  style={{ marginTop: '20px', textAlign: 'center' }}
                >
                  <button
                    onClick={handleDemo}
                    style={{
                      fontFamily: MONO, fontSize: '10px', letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: COLOR.inkFaint,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '0.4rem 0', borderBottom: `1px solid ${COLOR.rule}`,
                      transition: 'color 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = COLOR.inkMuted; e.currentTarget.style.borderColor = COLOR.inkFaint; }}
                    onMouseLeave={e => { e.currentTarget.style.color = COLOR.inkFaint; e.currentTarget.style.borderColor = COLOR.rule; }}
                  >
                    No file? Load demo data →
                  </button>
                </motion.div>

                {/* Quiet procedural note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1, ease: EASE }}
                  style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    fontFamily: MONO,
                    fontSize: '10px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: COLOR.inkFaint,
                    lineHeight: 1.8,
                  }}
                >
                  File is parsed in your browser. AI enrichment takes 20–40 seconds.
                </motion.div>

                {/* Error state */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      style={{
                        marginTop: '32px',
                        padding: '20px 24px',
                        border: `1px solid ${COLOR.accent}`,
                        background: COLOR.accentFaint,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: MONO,
                          fontSize: '10px',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: COLOR.accent,
                          marginBottom: '8px',
                        }}
                      >
                        Upload failed
                      </div>
                      <div
                        style={{
                          fontFamily: SERIF,
                          fontSize: '15px',
                          color: COLOR.ink,
                          lineHeight: 1.5,
                        }}
                      >
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
                style={{ width: '100%', maxWidth: '560px', textAlign: 'center' }}
              >
                {/* Stage label */}
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: '10px',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: COLOR.inkFaint,
                    marginBottom: '24px',
                  }}
                >
                  In progress
                </div>

                {/* Current stage */}
                <h2
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: 'clamp(28px, 4vw, 40px)',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em',
                    margin: '0 0 12px 0',
                    color: COLOR.ink,
                    minHeight: '48px',
                  }}
                >
                  {stage}
                  <span style={{ color: COLOR.accent }}>.</span>
                </h2>

                {/* Batch detail */}
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: COLOR.inkFaint,
                    minHeight: '16px',
                    marginBottom: '48px',
                  }}
                >
                  {detail || '\u00A0'}
                </div>

                {/* Progress bar — thin, no gradient */}
                <div
                  style={{
                    position: 'relative',
                    height: '1px',
                    background: COLOR.inkTrace,
                    marginBottom: '16px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: EASE }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      background: COLOR.ink,
                    }}
                  />
                </div>

                {/* Percentage */}
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: '10px',
                    letterSpacing: '0.15em',
                    color: COLOR.inkFaint,
                    textAlign: 'right',
                  }}
                >
                  {progress}%
                </div>

                {/* Honest note */}
                <div
                  style={{
                    marginTop: '64px',
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontSize: '14px',
                    color: COLOR.inkFaint,
                    lineHeight: 1.6,
                    maxWidth: '360px',
                    margin: '64px auto 0',
                  }}
                >
                  The file is parsed locally. A sample of messages is sent to
                  the analysis model to produce the report.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Footer */}
        <footer
          className="ya-footer"
          style={{
            height: '44px', padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'flex', alignItems: 'center',
            fontFamily: MONO, fontSize: '10px', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: COLOR.inkFaint,
            borderTop: `1px solid ${COLOR.inkTrace}`,
          }}
        >
          <span>2026</span>
        </footer>
      </main>
    </>
  );
}
