'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';
import { analyzeExport, storeRawJson, detectSourceType, type AnalyzeProgress } from './analyzeExport';

// ============================================================================
// DATA
// ============================================================================

const ACTIVE_SOURCES = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    company: 'OpenAI Inc.',
    hq: 'San Francisco, CA',
    fileType: '.json',
    severity: 'critical' as const,
    reveals: ['Cognitive profile', 'Emotional patterns', 'Vulnerability windows', 'Personal relationships', 'Sensitive disclosures'],
    description: 'Your full conversation history. The most revealing source — contains your reasoning patterns, emotional disclosures, and the cognitive fingerprint that cannot be deleted from a trained model.',
    exportPath: 'Settings → Data Controls → Export Data → conversations.json',
    exportUrl: 'https://chatgpt.com/#settings/DataControls',
    accept: '.json',
    validate: (data: any) => Array.isArray(data) && data[0]?.mapping !== undefined,
    errorMsg: 'This does not look like a ChatGPT conversations.json export. Make sure you upload the conversations.json file from the ZIP.',
  },
  {
    id: 'claude',
    label: 'Claude',
    company: 'Anthropic PBC',
    hq: 'San Francisco, CA',
    fileType: '.json',
    severity: 'critical' as const,
    reveals: ['Reasoning patterns', 'Emotional disclosures', 'Cognitive fingerprint', 'Value system', 'Sensitive disclosures'],
    description: 'Full conversation history exported from claude.ai. Anthropic trains on conversations by default — the same extraction problem, different company.',
    exportPath: 'claude.ai → Settings → Account → Export Data → conversations.json',
    exportUrl: 'https://claude.ai/settings',
    accept: '.json',
    validate: (data: any) => Array.isArray(data) && Array.isArray(data[0]?.chat_messages),
    errorMsg: 'This does not look like a Claude conversations.json export. Export your data from claude.ai → Settings → Account.',
  },
];

const COMING_SOON = [
  { id: 'google', label: 'Google Takeout', company: 'Alphabet Inc.', hq: 'Mountain View, CA', severity: 'high', reveals: ['Location history', 'Search patterns', 'Daily routines', 'Interest graph'] },
  { id: 'instagram', label: 'Instagram', company: 'Meta Platforms Inc.', hq: 'Menlo Park, CA', severity: 'high', reveals: ['Social graph', 'Message patterns', 'Relationship history', 'Location tags'] },
  { id: 'spotify', label: 'Spotify', company: 'Spotify AB', hq: 'Stockholm, Sweden', severity: 'medium', reveals: ['Emotional cycles', 'Sleep patterns', 'Stress indicators', 'Taste profile'] },
  { id: 'linkedin', label: 'LinkedIn', company: 'Microsoft Corp.', hq: 'Sunnyvale, CA', severity: 'medium', reveals: ['Professional network', 'Career anxiety', 'Salary signals', 'Skill gaps'] },
  { id: 'twitter', label: 'X / Twitter', company: 'X Corp.', hq: 'San Francisco, CA', severity: 'medium', reveals: ['Political signals', 'Opinion patterns', 'Social behaviour', 'Network map'] },
];

const SEV_COLOR: Record<string, string> = {
  critical: PALETTE.red,
  high: PALETTE.amber,
  medium: PALETTE.inkMuted,
};

// ============================================================================
// UPLOAD STATE
// ============================================================================

type UploadStatus = 'idle' | 'dragging' | 'processing' | 'done' | 'error';

interface SourceState {
  status: UploadStatus;
  progress: number;
  stage: string;
  error: string | null;
}

// ============================================================================
// ACTIVE SOURCE CARD — full upload capability
// ============================================================================

function ActiveSourceCard({
  source,
  state,
  onFile,
}: {
  source: typeof ACTIVE_SOURCES[0];
  state: SourceState;
  onFile: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sc = SEV_COLOR[source.severity];
  const isDone = state.status === 'done';

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
          padding: '1.4rem 0',
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          alignItems: 'center', gap: 'clamp(0.6rem, 2vw, 1.5rem)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', color: PALETTE.ink }}>
            {source.label}
          </span>
          <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
            {source.company}
          </span>
        </div>

        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: sc, textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${sc}40`, whiteSpace: 'nowrap' }}>
          {source.severity}
        </span>

        {isDone ? (
          <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.green, textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${PALETTE.green}35`, whiteSpace: 'nowrap' }}>
            Connected
          </span>
        ) : (
          <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Not connected
          </span>
        )}

        <span style={{ fontFamily: TYPE.mono, fontSize: '1.1rem', color: PALETTE.inkFaint, transition: 'transform 0.2s', display: 'block', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingBottom: '2rem' }}>
              <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '55ch', marginBottom: '1.2rem' }}>
                {source.description}
              </p>

              {/* Reveals */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.8rem' }}>
                {source.reveals.map((r, i) => (
                  <span key={i} style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: PALETTE.inkMuted, padding: '2px 7px', border: `1px solid ${PALETTE.border}` }}>{r}</span>
                ))}
              </div>

              {/* Export instructions */}
              <div style={{ borderLeft: `2px solid ${PALETTE.border}`, paddingLeft: '1.2rem', marginBottom: '2rem' }}>
                <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  How to export
                </p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '12px', color: PALETTE.inkMuted, lineHeight: 1.7, marginBottom: '0.8rem' }}>
                  {source.exportPath}
                </p>
                <a
                  href={source.exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.ink, textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${PALETTE.border}`, paddingBottom: '1px' }}
                >
                  Open settings →
                </a>
              </div>

              {/* Upload zone — only if not done */}
              {!isDone && state.status !== 'processing' && (
                <div
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  style={{
                    border: `1px dashed ${PALETTE.border}`,
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'transparent',
                    transition: 'border-color 0.2s, background 0.2s',
                    maxWidth: 480,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = PALETTE.inkMuted; (e.currentTarget as HTMLElement).style.background = PALETTE.bgElevated; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = PALETTE.border; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Drop {source.fileType} here or click to upload
                  </p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', color: PALETTE.inkFaint, textTransform: 'uppercase', opacity: 0.7 }}>
                    Processed locally — never transmitted
                  </p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={source.accept}
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }}
                  />
                </div>
              )}

              {/* Error state */}
              {state.status === 'error' && state.error && (
                <div style={{ borderLeft: `3px solid ${PALETTE.red}`, paddingLeft: '1.2rem', maxWidth: 480, marginTop: '1rem' }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Upload failed</p>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '1.05rem', color: PALETTE.inkMuted, lineHeight: 1.7 }}>{state.error}</p>
                  <button
                    onClick={() => inputRef.current?.click()}
                    style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.ink, textTransform: 'uppercase', background: 'none', border: `1px solid ${PALETTE.border}`, padding: '0.5rem 1rem', cursor: 'pointer', marginTop: '0.8rem' }}
                  >
                    Try again
                  </button>
                  <input ref={inputRef} type="file" accept={source.accept} style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
                </div>
              )}

              {/* Processing state */}
              {state.status === 'processing' && (
                <div style={{ maxWidth: 480 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{state.stage}</p>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint }}>{state.progress}%</p>
                  </div>
                  <div style={{ height: '1px', background: PALETTE.border, position: 'relative', overflow: 'hidden' }}>
                    <motion.div
                      animate={{ scaleX: state.progress / 100 }}
                      transition={{ duration: 0.4 }}
                      style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: PALETTE.red }}
                    />
                  </div>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.5rem', opacity: 0.6 }}>
                    Dashboard will update automatically
                  </p>
                </div>
              )}

              {/* Done state */}
              {isDone && (
                <div style={{ borderLeft: `3px solid ${PALETTE.green}`, paddingLeft: '1.2rem', maxWidth: 480 }}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.2em', color: PALETTE.green, textTransform: 'uppercase' }}>
                    Source connected — dashboard updated
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// COMING SOON ROW
// ============================================================================

function ComingSoonRow({ source, index }: { source: typeof COMING_SOON[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const sc = SEV_COLOR[source.severity] || PALETTE.inkFaint;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
      transition={{ delay: index * 0.07, duration: 0.6 }}
      style={{
        borderBottom: `1px solid ${PALETTE.border}`,
        padding: '1.1rem 0',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: PALETTE.ink }}>{source.label}</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{source.company}</span>
      </div>
      <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: sc, textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${sc}35`, whiteSpace: 'nowrap' }}>{source.severity}</span>
      <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Coming soon</span>
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function SourcesPage({
  connectedSources,
  onUpload,
  onAnalysisUpdate,
}: {
  connectedSources: Record<string, boolean>;
  onUpload: (id: string, file: File) => void;
  onAnalysisUpdate?: (results: any) => void;
}) {
  const pad = 'clamp(2rem, 6vw, 5rem)';

  const [sourceStates, setSourceStates] = useState<Record<string, SourceState>>(() =>
    Object.fromEntries(
      ACTIVE_SOURCES.map(s => [s.id, {
        status: connectedSources[s.id] ? 'done' : 'idle',
        progress: 0,
        stage: '',
        error: null,
      } as SourceState])
    )
  );

  const connectedCount = Object.values(sourceStates).filter(s => s.status === 'done').length;

  const handleFile = useCallback(async (sourceId: string, file: File) => {
    const source = ACTIVE_SOURCES.find(s => s.id === sourceId);
    if (!source) return;

    // Read + parse
    setSourceStates(prev => ({ ...prev, [sourceId]: { status: 'processing', progress: 5, stage: 'Reading file', error: null } }));

    try {
      const text = await file.text();
      let jsonData: any;
      try {
        jsonData = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON file. Make sure you upload the conversations.json file.');
      }

      if (!Array.isArray(jsonData)) {
        throw new Error('This file does not look like a valid export. Expected a JSON array.');
      }

      if (!source.validate(jsonData)) {
        throw new Error(source.errorMsg);
      }

      const detectedType = detectSourceType(jsonData);

      // Store raw JSON for future merging
      storeRawJson(sourceId, jsonData, detectedType);

      // Register with parent
      onUpload(sourceId, file);

      setSourceStates(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], progress: 15, stage: 'Parsing conversations' } }));

      // Check if other sources already analysed — if so, merge
      const existingResults = sessionStorage.getItem('analysisResults');
      const existingRawIds = ACTIVE_SOURCES
        .filter(s => s.id !== sourceId)
        .filter(s => sessionStorage.getItem('rawJson_' + s.id));

      let combinedJson: any[];

      if (existingRawIds.length > 0) {
        // Merge with existing sources
        const allRaw = existingRawIds.map(s => {
          const raw = sessionStorage.getItem('rawJson_' + s.id);
          return raw ? JSON.parse(raw) : [];
        }).flat();

        // The existing raws are already normalised to GPT format
        // The new one needs normalising
        const { normaliseClaude } = await import('./claudeParser');
        const newNormalised = detectedType === 'claude' ? normaliseClaude(jsonData) : jsonData;
        combinedJson = [...allRaw, ...newNormalised];
      } else {
        // First source being added — just use this one
        const { normaliseClaude } = await import('./claudeParser');
        combinedJson = detectedType === 'claude' ? normaliseClaude(jsonData) : jsonData;
      }

      await analyzeExport(combinedJson, (p: AnalyzeProgress) => {
        if (p.phase === 'parsing') {
          setSourceStates(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], progress: 20, stage: 'Extracting patterns' } }));
        } else if (p.phase === 'ai_enriching') {
          if (p.aiProgress?.stage === 'selecting') {
            setSourceStates(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], progress: 28, stage: 'Selecting messages' } }));
          } else if (p.aiProgress?.stage === 'enriching') {
            const pct = p.aiProgress.batchesTotal > 0
              ? 30 + (p.aiProgress.batchesDone / p.aiProgress.batchesTotal) * 55
              : 50;
            setSourceStates(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], progress: Math.round(pct), stage: `Analysing batch ${p.aiProgress!.batchesDone} of ${p.aiProgress!.batchesTotal}` } }));
          } else if (p.aiProgress?.stage === 'synthesizing') {
            setSourceStates(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], progress: 90, stage: 'Writing intelligence briefing' } }));
          }
        } else if (p.phase === 'storing') {
          setSourceStates(prev => ({ ...prev, [sourceId]: { ...prev[sourceId], progress: 95, stage: 'Updating dashboard' } }));
        }
      }, 'chatgpt'); // already normalised above

      // Pull updated results and notify parent
      const updated = sessionStorage.getItem('analysisResults');
      if (updated && onAnalysisUpdate) {
        onAnalysisUpdate(JSON.parse(updated));
      }

      setSourceStates(prev => ({ ...prev, [sourceId]: { status: 'done', progress: 100, stage: 'Complete', error: null } }));

    } catch (err: any) {
      setSourceStates(prev => ({ ...prev, [sourceId]: { status: 'error', progress: 0, stage: '', error: err.message || 'Something went wrong.' } }));
    }
  }, [onUpload, onAnalysisUpdate]);

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', padding: `0 ${pad}`, paddingBottom: 'clamp(4rem, 10vw, 8rem)' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          paddingTop: 'clamp(3rem, 8vw, 6rem)',
          paddingBottom: 'clamp(2rem, 5vw, 3.5rem)',
          marginBottom: 'clamp(2rem, 4vw, 3rem)',
          borderBottom: `1px solid ${PALETTE.border}`,
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '2rem' }}
        >
          03 / Sources
        </motion.p>

        <div className="sources-header-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: '3rem' }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}>
            <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1rem', maxWidth: '22ch' }}>
              Every platform you use is building a file on you.
            </h1>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.25rem)', color: PALETTE.inkMuted, lineHeight: 1.8, fontStyle: 'italic', maxWidth: '50ch' }}>
              Upload a second export and the dashboard updates — more data, sharper argument. Each source adds a dimension the others cannot see.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{ fontFamily: TYPE.mono, display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end', flexShrink: 0 }}
          >
            {[
              { l: 'Sources live', v: String(ACTIVE_SOURCES.length) },
              { l: 'Connected', v: String(connectedCount) },
              { l: 'Coming soon', v: String(COMING_SOON.length) },
            ].map(item => (
              <div key={item.l} style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{item.l}</span>
                <span style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: PALETTE.ink, letterSpacing: '-0.02em', fontFamily: TYPE.serif, minWidth: '1.5rem', textAlign: 'right' }}>{item.v}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ACTIVE SOURCES */}
      <div style={{ marginBottom: 'clamp(3rem, 8vw, 6rem)' }}>
        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '1.5rem', paddingBottom: '0.8rem', borderBottom: `1px solid ${PALETTE.border}` }}>
          {['Platform', 'Severity', 'Status', ''].map((h, i) => (
            <span key={i} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>

        {ACTIVE_SOURCES.map((source, i) => (
          <ActiveSourceCard
            key={source.id}
            source={source}
            state={sourceStates[source.id]}
            onFile={(file) => handleFile(source.id, file)}
          />
        ))}
      </div>

      {/* COMING SOON */}
      <div style={{ marginBottom: 'clamp(3rem, 8vw, 6rem)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>In development</p>
          <div style={{ flex: 1, height: '1px', background: PALETTE.border }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '2rem', paddingBottom: '0.8rem', borderBottom: `1px solid ${PALETTE.border}`, opacity: 0.5 }}>
          {['Platform', 'Severity', ''].map((h, i) => (
            <span key={i} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>

        {COMING_SOON.map((source, i) => (
          <ComingSoonRow key={source.id} source={source} index={i} />
        ))}
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${PALETTE.border}`, paddingTop: '2rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.8rem' }}>About your data</p>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.15rem)', color: PALETTE.inkFaint, lineHeight: 1.8, maxWidth: '52ch' }}>
          All analysis runs locally in your browser. Your exports are never transmitted to any server. This tool was built to show you what exists — not to collect it.
        </p>
      </div>

    </div>
  );
}
