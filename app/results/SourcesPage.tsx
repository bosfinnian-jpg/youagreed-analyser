'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

const SOURCE_DEFINITIONS = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    company: 'OpenAI',
    description: 'Your full conversation history. The most revealing source — contains your reasoning patterns, emotional disclosures, and cognitive fingerprint.',
    reveals: ['Cognitive profile', 'Emotional patterns', 'Vulnerability windows', 'Personal relationships', 'Sensitive disclosures'],
    howToExport: 'ChatGPT Settings → Data Controls → Export Data. You will receive a ZIP file. Upload conversations.json from inside it.',
    severity: 'critical',
    fileType: '.json',
    icon: 'GPT' },
  {
    id: 'google',
    label: 'Google Takeout',
    company: 'Google',
    description: 'Search history, location timeline, YouTube watch history, Gmail metadata. Builds a behavioural map across years of activity.',
    reveals: ['Location history', 'Search patterns', 'Interest graph', 'Daily routines', 'Media consumption'],
    howToExport: 'takeout.google.com → select Search History, Location History, YouTube. Download as JSON.',
    severity: 'high',
    fileType: '.json / .zip',
    icon: 'GGL' },
  {
    id: 'instagram',
    label: 'Instagram',
    company: 'Meta',
    description: 'Message content, post history, story interactions, account connections. Reveals your social graph and emotional relationship patterns.',
    reveals: ['Social graph', 'Message patterns', 'Emotional tone', 'Relationship history', 'Location tags'],
    howToExport: 'Instagram Settings → Your Activity → Download Your Information. Select JSON format.',
    severity: 'high',
    fileType: '.json / .zip',
    icon: 'INS' },
  {
    id: 'spotify',
    label: 'Spotify',
    company: 'Spotify',
    description: 'Listening history and patterns. Music correlates strongly with emotional state — your data reveals mood cycles, sleep patterns, and stress responses.',
    reveals: ['Emotional cycles', 'Sleep patterns', 'Stress indicators', 'Taste profile', 'Listening windows'],
    howToExport: 'Spotify Account → Privacy Settings → Download Your Data. Takes up to 30 days.',
    severity: 'medium',
    fileType: '.json',
    icon: 'SPT' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    company: 'Microsoft',
    description: 'Professional network, job search history, message content, skill endorsements. Used directly by employment screening algorithms.',
    reveals: ['Professional network', 'Job search history', 'Career anxiety signals', 'Skill gaps', 'Salary expectations'],
    howToExport: 'LinkedIn Settings → Data Privacy → Get a copy of your data. Select all options.',
    severity: 'medium',
    fileType: '.zip',
    icon: 'LIN' },
  {
    id: 'twitter',
    label: 'X / Twitter',
    company: 'X Corp',
    description: 'Tweets, DMs, likes, search history. Political views, interests, and social behaviour are inferred and made available to data brokers and advertisers.',
    reveals: ['Political signals', 'Interest graph', 'Social behaviour', 'Opinion patterns', 'Network map'],
    howToExport: 'X Settings → Your Account → Download an archive of your data.',
    severity: 'medium',
    fileType: '.zip',
    icon: 'X' },
];

const SEVERITY_COLORS = {
  critical: PALETTE.red,
  high: PALETTE.amber,
  medium: 'rgba(120,180,255,0.85)' };

function SourceCard({ source, connected, onUpload }: { source: typeof SOURCE_DEFINITIONS[0]; connected: boolean; onUpload: (id: string, file: File) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(source.id, file);
  };

  return (
    <motion.div
      layout
      style={{
        background: PALETTE.bgPanel,
        border: `1px solid ${connected ? 'rgba(52,199,89,0.25)' : PALETTE.border}`,
        borderTop: `2px solid ${connected ? PALETTE.green : (SEVERITY_COLORS as any)[source.severity]}`,
        overflow: 'hidden',
        transition: 'border-color 0.3s' }}
    >
      {/* Header */}
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, flexShrink: 0,
          background: connected ? PALETTE.greenFaint : PALETTE.bgElevated,
          border: `1px solid ${connected ? 'rgba(52,199,89,0.2)' : PALETTE.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: connected ? PALETTE.green : PALETTE.inkFaint }}>
            {source.icon}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
            <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)', color: PALETTE.ink }}>{source.label}</p>
            <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: (SEVERITY_COLORS as any)[source.severity], padding: '2px 6px', border: `1px solid ${(SEVERITY_COLORS as any)[source.severity]}30` }}>
              {source.severity}
            </span>
            {connected && (
              <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: PALETTE.green, padding: '2px 6px', border: `1px solid ${PALETTE.green}30` }}>
                Connected
              </span>
            )}
          </div>
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
            {source.company}
          </p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: PALETTE.inkFaint, fontFamily: TYPE.mono, fontSize: '10px', padding: '0.25rem', flexShrink: 0 }}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      <div style={{ padding: '0 1.5rem', paddingBottom: expanded ? 0 : '1.5rem' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)', color: PALETTE.inkMuted, lineHeight: 1.8, marginBottom: '1rem' }}>
          {source.description}
        </p>

        {/* Reveals */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
          {source.reveals.map((r, i) => (
            <span key={i} style={{
              fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: PALETTE.inkMuted, padding: '3px 8px',
              border: `1px solid ${PALETTE.border}` }}>
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded: how to export + upload */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ padding: '0 1.5rem 1.5rem', borderTop: `1px solid ${PALETTE.border}`, paddingTop: '1.5rem', marginTop: '0' }}
        >
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            How to export
          </p>
          <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)', color: PALETTE.inkMuted, lineHeight: 1.8, marginBottom: '1.5rem' }}>
            {source.howToExport}
          </p>

          {/* Upload zone */}
          {!connected && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `1px dashed ${dragging ? PALETTE.ink : PALETTE.border}`,
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? PALETTE.bgElevated : 'transparent',
                transition: 'all 0.2s' }}
            >
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Drop {source.fileType} here or click to upload
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={source.fileType.includes('zip') ? '.json,.zip' : '.json'}
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) onUpload(source.id, e.target.files[0]); }}
              />
            </div>
          )}

          {connected && (
            <div style={{ padding: '1rem', background: PALETTE.greenFaint, border: `1px solid rgba(52,199,89,0.2)` }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.green, textTransform: 'uppercase' }}>
                Source connected
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// SOURCES PAGE
// ============================================================================
export default function SourcesPage({ connectedSources, onUpload }: {
  connectedSources: Record<string, boolean>;
  onUpload: (id: string, file: File) => void;
}) {
  const connectedCount = Object.values(connectedSources).filter(Boolean).length;

  return (
    <div style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>

      {/* Network node geometry — data sources connecting */}
      <svg style={{
        position: 'absolute', top: '1rem', right: '1rem',
        width: '220px', height: '160px', pointerEvents: 'none', overflow: 'visible',
      }}>
        {/* Central node */}
        <circle cx={110} cy={80} r={5} fill="none" stroke="rgba(220,60,50,0.3)" strokeWidth="1.5" />
        <circle cx={110} cy={80} r={12} fill="none" stroke="rgba(220,60,50,0.08)" strokeWidth="1" />
        {/* Satellite nodes with connecting lines */}
        {[
          { x: 60, y: 30 }, { x: 170, y: 25 }, { x: 185, y: 90 },
          { x: 155, y: 138 }, { x: 65, y: 130 }, { x: 32, y: 78 },
        ].map((pt, i) => (
          <g key={i}>
            <line x1={110} y1={80} x2={pt.x} y2={pt.y}
              stroke="rgba(240,237,232,0.06)" strokeWidth="1"
              strokeDasharray={i % 2 === 0 ? 'none' : '3 4'} />
            <circle cx={pt.x} cy={pt.y} r={3}
              fill="none"
              stroke={i < 2 ? 'rgba(220,60,50,0.2)' : 'rgba(240,237,232,0.1)'}
              strokeWidth="1" />
          </g>
        ))}
      </svg>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          03 / Data sources
        </p>
        <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1rem' }}>
          How much do they know?
        </h1>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 600 }}>
          Each source you add expands the profile. A single export is enough to demonstrate the problem. More makes the argument harder to ignore.
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ padding: '1.2rem 1.5rem', background: PALETTE.bgPanel, border: `1px solid ${PALETTE.border}`, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
      >
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
          {connectedCount} of {SOURCE_DEFINITIONS.length} sources connected
        </p>
        <div style={{ flex: 1, height: '2px', background: PALETTE.bgElevated, overflow: 'hidden' }}>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: connectedCount / SOURCE_DEFINITIONS.length }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            style={{ height: '100%', background: PALETTE.red, transformOrigin: 'left' }}
          />
        </div>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint }}>
          {connectedCount === 0 ? 'ChatGPT connected' : connectedCount < 3 ? 'Each addition compounds the exposure' : 'Significant exposure surface'}
        </p>
      </motion.div>

      {/* Source cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1px', background: PALETTE.border }}>
        {SOURCE_DEFINITIONS.map(source => (
          <div key={source.id} style={{ background: PALETTE.bg }}>
            <SourceCard
              source={source}
              connected={!!connectedSources[source.id]}
              onUpload={onUpload}
            />
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{ marginTop: '2rem', padding: '1.2rem 1.5rem', border: `1px solid ${PALETTE.border}` }}
      >
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          About your data
        </p>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)', color: PALETTE.inkMuted, lineHeight: 1.8 }}>
          All analysis runs locally in your browser. Your exports are never transmitted to any server. This tool was built to show you what exists — not to collect it.
        </p>
      </motion.div>
    </div>
  );
}
