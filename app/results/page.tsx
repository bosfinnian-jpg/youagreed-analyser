'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import DashboardLayout, { PALETTE, TYPE, type DashPage } from './DashboardLayout';
import OverviewPage from './OverviewPage';
import SourcesPage from './SourcesPage';
import UnderstandPage from './UnderstandPage';

// ============================================================================
// TYPES
// ============================================================================
interface AnalysisResult {
  privacyScore: number;
  findings: {
    personalInfo: {
      names: { name: string; mentions: number; relationship?: string; contexts?: string[] }[];
      locations: { location: string; type: string; mentions: number }[];
      ages: string[];
      emails: string[];
      phoneNumbers: string[];
      relationships: string[];
      workInfo: string[];
    };
    sensitiveTopics: { category: string; excerpt: string; timestamp: string | number }[];
    vulnerabilityPatterns: { timeOfDay: string; messageCount?: number; frequency?: number; emotionalTone?: string }[];
    temporalInsights: unknown[];
    repetitiveThemes: { theme: string; mentions?: number; count?: number }[];
  };
  juiciestMoments: { timestamp: string; excerpt: string; juiceScore: number; reason: string }[];
  stats?: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };
  rawStats?: {
    totalMessages: number;
    userMessages: number;
    timeSpan: string;
    avgMessageLength: number;
  };
  totalUserMessages?: number;
  timespan?: { first: string; last: string; days: number };
  emotionalTimeline?: unknown;
  commercialProfile?: { segments: { label: string; confidence: number }[] };
  dependency?: { dependencyScore: number; trajectory: string };
  lifeEvents?: { type: string; label: string; severity: string; approximateDate?: string }[];
  topicsByPeriod?: { early: string[]; mid: string[]; recent: string[] };
  hourDistribution?: number[];
  dayDistribution?: number[];
  nighttimeRatio?: number;
  avgIntimacy?: number;
  avgAnxiety?: number;
  mostVulnerablePeriod?: string;
  typeBreakdown?: Record<string, number>;
  aiEnriched?: boolean;
}

const DEFAULT_SOURCES = [
  { id: 'chatgpt', label: 'ChatGPT', connected: false },
  { id: 'google', label: 'Google', connected: false },
  { id: 'instagram', label: 'Instagram', connected: false },
  { id: 'spotify', label: 'Spotify', connected: false },
  { id: 'linkedin', label: 'LinkedIn', connected: false },
  { id: 'twitter', label: 'X', connected: false },
];

// ============================================================================
// PROFILE PAGE — Dossier-style cognitive fingerprint
// ============================================================================

function Typewriter({ text, delay = 0, speed = 30, style, mono = false }: {
  text: string; delay?: number; speed?: number; style?: React.CSSProperties; mono?: boolean;
}) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [isInView, delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span ref={ref} style={{ fontFamily: mono ? TYPE.mono : TYPE.serif, ...style }}>
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ display: 'inline-block', width: '0.5em', height: '1em', background: PALETTE.red, marginLeft: '1px', verticalAlign: 'text-bottom' }}
        />
      )}
    </span>
  );
}

function ScanLine() {
  return (
    <motion.div
      initial={{ top: 0 }}
      animate={{ top: '100%' }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      style={{
        position: 'absolute', left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent 0%, ${PALETTE.red}30 20%, ${PALETTE.red}60 50%, ${PALETTE.red}30 80%, transparent 100%)`,
        pointerEvents: 'none', zIndex: 2,
      }}
    />
  );
}

function DataRow({ label, value, accent = false, delay = 0, sub }: {
  label: string; value: string | number; accent?: boolean; delay?: number; sub?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.9rem 0', borderBottom: `1px solid ${PALETTE.border}`, position: 'relative', overflow: 'hidden' }}>
      <motion.div initial={{ scaleX: 1 }} animate={isInView ? { scaleX: 0 } : {}}
        transition={{ delay: delay + 0.1, duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
        style={{ position: 'absolute', inset: 0, background: PALETTE.bgPanel, transformOrigin: 'right', zIndex: 1 }} />
      <div>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{label}</p>
        {sub && <p style={{ fontFamily: TYPE.serif, fontSize: '0.78rem', color: PALETTE.inkFaint, fontStyle: 'italic', marginTop: '2px' }}>{sub}</p>}
      </div>
      <p style={{ fontFamily: accent ? TYPE.serif : TYPE.mono, fontSize: accent ? '1.1rem' : '0.9rem', color: accent ? PALETTE.red : PALETTE.ink, letterSpacing: accent ? '-0.01em' : '0.05em', textAlign: 'right', maxWidth: '60%' }}>{value}</p>
    </motion.div>
  );
}

function AnimatedBar({ label, value, max, delay = 0, color }: {
  label: string; value: number; max: number; delay?: number; color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const pct = Math.min(100, (value / max) * 100);
  const barColor = color || PALETTE.inkMuted;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }} style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: TYPE.serif, fontSize: '0.92rem', color: PALETTE.ink, textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: barColor, opacity: 0.8 }}>{value}%</span>
      </div>
      <div style={{ height: '3px', background: `${PALETTE.ink}08`, position: 'relative', overflow: 'hidden' }}>
        <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: pct / 100 } : {}}
          transition={{ delay: delay + 0.2, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: barColor }} />
      </div>
    </motion.div>
  );
}

function DossierHeader({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const stats = results.stats || results.rawStats;
  const totalMsgs = results.totalUserMessages || stats?.userMessages || 0;
  const firstDate = results.timespan?.first ? new Date(results.timespan.first).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown';

  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 1 }}
      style={{ position: 'relative', padding: 'clamp(3rem, 8vw, 6rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, overflow: 'hidden' }}>
      <ScanLine />
      {/* Classified stamp */}
      <motion.div initial={{ opacity: 0, scale: 1.8, rotate: -8 }} animate={isInView ? { opacity: 0.12, scale: 1, rotate: -6 } : {}}
        transition={{ delay: 0.8, duration: 0.15, ease: 'easeOut' }}
        style={{ position: 'absolute', right: '2rem', top: '1rem', fontFamily: TYPE.mono, fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, color: PALETTE.red, letterSpacing: '0.15em', textTransform: 'uppercase', border: `3px solid ${PALETTE.red}`, padding: '0.3em 0.6em', transform: 'rotate(-6deg)', pointerEvents: 'none', userSelect: 'none' }}>
        Dossier
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.35 } : {}} transition={{ delay: 0.2, duration: 0.8 }}
        style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        02 — My profile / Cognitive fingerprint
      </motion.p>
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: '70%' }}>
        Your cognitive fingerprint.
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 1 }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 560, marginBottom: '2.5rem' }}>
        This is a partial reconstruction of the profile a data broker would assign you.
        It was built from {totalMsgs.toLocaleString('en-GB')} messages submitted since {firstDate}.
        Nothing here was volunteered. Everything was inferred.
      </motion.p>
      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: `1px solid ${PALETTE.border}` }}>
        {[
          { label: 'Classification', value: results.privacyScore >= 70 ? 'SEVERE' : results.privacyScore >= 40 ? 'ELEVATED' : 'MODERATE' },
          { label: 'Exposure index', value: `${results.privacyScore}/100` },
          { label: 'Data points extracted', value: String(totalMsgs) },
          { label: 'Surveillance window', value: results.timespan ? `${results.timespan.days} days` : 'Unknown' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 + i * 0.12, duration: 0.5 }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '0.95rem', color: item.label === 'Classification' && results.privacyScore >= 70 ? PALETTE.red : PALETTE.ink, letterSpacing: '0.06em' }}>{item.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function CognitivePatterns({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const stats = results.stats || results.rawStats;
  const totalMessages = stats?.userMessages || results.totalUserMessages || 0;
  const avgLength = stats?.avgMessageLength || 0;
  const themes = results.findings.repetitiveThemes || [];
  const styles = [
    { label: 'Analytical', value: Math.min(95, Math.round((avgLength / 300) * 100 + 20)), color: PALETTE.ink },
    { label: 'Creative', value: Math.min(85, Math.round(themes.length * 8 + 25)), color: PALETTE.inkMuted },
    { label: 'Practical', value: Math.min(80, Math.round(60 + (totalMessages / 50))), color: PALETTE.inkMuted },
    { label: 'Reflective', value: Math.min(75, Math.round(50 + (results.findings.sensitiveTopics?.length || 0) * 10)), color: `${PALETTE.red}99` },
  ];
  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1.8rem' }}>Inferred reasoning patterns</p>
      <div style={{ maxWidth: 500 }}>
        {styles.map((s, i) => <AnimatedBar key={s.label} label={s.label} value={s.value} max={100} delay={i * 0.15} color={s.color} />)}
      </div>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.5 } : {}} transition={{ delay: 1, duration: 0.8 }}
        style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.12em', color: PALETTE.inkFaint, marginTop: '1.5rem', maxWidth: 400 }}>
        Derived from message length, vocabulary breadth, topic diversity, and emotional disclosure frequency. No psychometric test required.
      </motion.p>
    </motion.section>
  );
}

function Obsessions({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const themes = results.findings.repetitiveThemes.slice(0, 10);
  const maxMentions = Math.max(...themes.map(t => t.mentions || t.count || 1));
  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Recurring preoccupations</p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '2rem', lineHeight: 1.2 }}>What keeps you up at night.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {themes.map((theme, i) => {
          const count = theme.mentions || theme.count || 0;
          const intensity = count / maxMentions;
          return (
            <motion.div key={theme.theme} initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', borderBottom: `1px solid ${PALETTE.border}`, position: 'relative' }}>
              <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: intensity } : {}}
                transition={{ delay: 0.3 + i * 0.08, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: intensity > 0.7 ? `${PALETTE.red}06` : `${PALETTE.ink}03`, transformOrigin: 'left', zIndex: 0 }} />
              <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint, width: '1.5rem', textAlign: 'right', opacity: 0.5, zIndex: 1 }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: intensity > 0.7 ? PALETTE.ink : PALETTE.inkMuted, flex: 1, textTransform: 'capitalize', zIndex: 1 }}>{theme.theme}</span>
              <span style={{ fontFamily: TYPE.mono, fontSize: '10px', color: intensity > 0.7 ? PALETTE.red : PALETTE.inkFaint, zIndex: 1 }}>{count}x</span>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function SocialGraph({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const names = results.findings.personalInfo.names.slice(0, 8);
  const maxMentions = Math.max(...names.map(n => n.mentions || 1), 1);
  if (names.length === 0) {
    return (
      <section style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>Social graph</p>
        <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>No named individuals detected. Behavioural patterns alone are sufficient for identification.</p>
      </section>
    );
  }
  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Social graph — linked individuals</p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '2.5rem', lineHeight: 1.2 }}>People in your data.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1px', background: PALETTE.border, marginBottom: '1.5rem' }}>
        {names.map((person, i) => {
          const size = person.mentions / maxMentions;
          return (
            <motion.div key={person.name} initial={{ opacity: 0, scale: 0.9 }} animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ background: PALETTE.bgPanel, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              <motion.div initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', width: `${Math.max(24, size * 50)}px`, height: `${Math.max(24, size * 50)}px`, borderRadius: '50%', background: `radial-gradient(circle, ${PALETTE.red}${Math.round(size * 20).toString(16).padStart(2, '0')} 0%, transparent 70%)` }} />
              <p style={{ fontFamily: TYPE.serif, fontSize: '1.15rem', color: PALETTE.ink, marginBottom: '0.4rem', position: 'relative' }}>{person.name}</p>
              {person.relationship && <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>{person.relationship}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: Math.min(10, person.mentions) }).map((_, j) => (
                    <motion.div key={j} initial={{ scaleY: 0 }} animate={isInView ? { scaleY: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.1 + j * 0.04, duration: 0.3 }}
                      style={{ width: '3px', height: '12px', background: j < person.mentions * 0.7 ? `${PALETTE.red}60` : `${PALETTE.ink}15`, transformOrigin: 'bottom' }} />
                  ))}
                </div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '9px', color: PALETTE.inkFaint }}>{person.mentions}x</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.12em', color: PALETTE.inkFaint, opacity: 0.6 }}>
        Your record is now linked to theirs. Their record is linked to yours. Neither party consented to this association.
      </p>
    </motion.section>
  );
}

function SensitiveDisclosures({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const topics = results.findings.sensitiveTopics.slice(0, 6);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (topics.length === 0) return null;
  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, position: 'relative' }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.6rem', opacity: 0.7 }}>Sensitive disclosures — high-value extractions</p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '2rem', lineHeight: 1.2 }}>What you told the machine.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {topics.map((topic, i) => {
          const dateStr = typeof topic.timestamp === 'number'
            ? new Date(topic.timestamp * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : new Date(topic.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const isHovered = hoveredIdx === i;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
              onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}
              style={{ padding: '1.2rem 0 1.2rem 1.2rem', borderBottom: `1px solid ${PALETTE.border}`, borderLeft: `2px solid ${isHovered ? PALETTE.red : `${PALETTE.red}30`}`, transition: 'border-color 0.3s ease', cursor: 'default', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.red, textTransform: 'uppercase', opacity: 0.7 }}>{topic.category?.replace(/_/g, ' ')}</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: '8px', color: PALETTE.inkFaint }}>{dateStr}</span>
              </div>
              <p style={{ fontFamily: TYPE.serif, fontSize: '0.92rem', fontStyle: 'italic', color: isHovered ? PALETTE.ink : PALETTE.inkMuted, lineHeight: 1.65, transition: 'color 0.3s ease' }}>{topic.excerpt?.substring(0, 180)}...</p>
              <AnimatePresence>
                {isHovered && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 0.5, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ fontFamily: TYPE.mono, fontSize: '7px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', marginTop: '0.5rem', overflow: 'hidden' }}>
                    Retained permanently — cannot be deleted from trained models
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

function LocationsSection({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const locations = results.findings.personalInfo.locations;
  if (locations.length === 0) return null;
  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Geographic footprint</p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '2rem', lineHeight: 1.2 }}>Where you can be found.</p>
      {locations.map((loc, i) => (
        <DataRow key={loc.location} label={loc.type === 'lives' ? 'Home' : loc.type === 'works' ? 'Work' : 'Mentioned'}
          value={loc.location} accent={loc.type === 'lives'} delay={i * 0.1} sub={`${loc.mentions} reference${loc.mentions === 1 ? '' : 's'}`} />
      ))}
    </motion.section>
  );
}

function VulnerabilityWindow({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const patterns = results.findings.vulnerabilityPatterns;
  const hourDist = results.hourDistribution || [];
  if (patterns.length === 0 && hourDist.length === 0) return null;
  const maxHour = Math.max(...hourDist, 1);
  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, position: 'relative' }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.22em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.6rem', opacity: 0.7 }}>Vulnerability mapping</p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '2.5rem', lineHeight: 1.2 }}>When you are easiest to reach.</p>
      {hourDist.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px', padding: '0 0 1.5rem 0', borderBottom: `1px solid ${PALETTE.border}` }}>
            {hourDist.map((count, hour) => {
              const h = (count / maxHour) * 100;
              const isLateNight = hour >= 0 && hour <= 4;
              const isPeak = count === maxHour;
              return (
                <motion.div key={hour} initial={{ scaleY: 0 }} animate={isInView ? { scaleY: 1 } : {}}
                  transition={{ delay: 0.3 + hour * 0.04, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ flex: 1, height: `${Math.max(2, h)}%`, background: isPeak ? PALETTE.red : isLateNight ? `${PALETTE.red}60` : `${PALETTE.ink}18`, transformOrigin: 'bottom', borderRadius: '1px 1px 0 0' }}
                  title={`${String(hour).padStart(2, '0')}:00 — ${count} messages`} />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {[0, 6, 12, 18, 23].map(h => (
              <span key={h} style={{ fontFamily: TYPE.mono, fontSize: '7px', color: PALETTE.inkFaint, letterSpacing: '0.1em' }}>{String(h).padStart(2, '0')}:00</span>
            ))}
          </div>
        </div>
      )}
      {(results.nighttimeRatio || 0) > 0.05 && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.6 }}
          style={{ padding: '1rem 1.2rem', background: `${PALETTE.red}06`, borderLeft: `2px solid ${PALETTE.red}40` }}>
          <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.4rem', opacity: 0.7 }}>Late-night window detected</p>
          <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.6 }}>
            {Math.round((results.nighttimeRatio || 0) * 100)}% of your messages were sent between midnight and 5am.
            This is when emotional defences are lowest and disclosures are most commercially valuable.
          </p>
        </motion.div>
      )}
      {patterns.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(patterns.length, 4)}, 1fr)`, gap: '1px', background: PALETTE.border, marginTop: '2rem' }}>
          {patterns.map((p, i) => {
            const count = p.messageCount || p.frequency || 0;
            const isNight = (p.timeOfDay || '').toLowerCase().includes('late') || (p.timeOfDay || '').toLowerCase().includes('night');
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1 + i * 0.12, duration: 0.5 }}
                style={{ background: PALETTE.bgPanel, padding: '1.5rem', borderTop: isNight ? `2px solid ${PALETTE.red}` : '2px solid transparent' }}>
                <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, marginBottom: '0.4rem' }}>{p.timeOfDay}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '1.4rem', color: isNight ? PALETTE.red : PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.3rem' }}>{count.toLocaleString()}</p>
                <p style={{ fontFamily: TYPE.mono, fontSize: '7px', color: PALETTE.inkFaint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>messages</p>
                {isNight && <p style={{ fontFamily: TYPE.mono, fontSize: '7px', color: PALETTE.red, marginTop: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 }}>Highest commercial value</p>}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

function DossierClosing({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const nameCount = results.findings.personalInfo.names.length;
  const locCount = results.findings.personalInfo.locations.length;
  const sensitiveCount = results.findings.sensitiveTopics.length;
  return (
    <motion.section ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 1.2 }}
      style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)', position: 'relative' }}>
      <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: 1 } : {}}
        transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '1px', background: PALETTE.ink, transformOrigin: 'left', marginBottom: '2rem', opacity: 0.15 }} />
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.6 } : {}} transition={{ delay: 0.5, duration: 1 }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 520 }}>
        This file contains {nameCount > 0 ? `${nameCount} named individual${nameCount === 1 ? '' : 's'}, ` : ''}
        {locCount > 0 ? `${locCount} mapped location${locCount === 1 ? '' : 's'}, ` : ''}
        {sensitiveCount > 0 ? `${sensitiveCount} sensitive disclosure${sensitiveCount === 1 ? '' : 's'}, ` : ''}
        and a complete behavioural signature. It was compiled without your knowledge from text you believed was private.
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.3 } : {}} transition={{ delay: 1.2, duration: 1.2 }}
        style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '2rem' }}>
        End of file. This record cannot be closed.
      </motion.p>
    </motion.section>
  );
}

function ProfilePage({ results }: { results: AnalysisResult }) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
      <DossierHeader results={results} />
      <CognitivePatterns results={results} />
      <Obsessions results={results} />
      <SocialGraph results={results} />
      <SensitiveDisclosures results={results} />
      <LocationsSection results={results} />
      <VulnerabilityWindow results={results} />
      <DossierClosing results={results} />
    </div>
  );
}

// ============================================================================
// RISK PAGE
// ============================================================================
function RiskPage({ results }: { results: AnalysisResult }) {
  return (
    <div style={{ padding: 'clamp(2rem, 5vw, 4rem) clamp(1.5rem, 5vw, 4rem)', maxWidth: 1100, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>04 — Risk assessment</p>
        <h1 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '1rem' }}>
          This is not theoretical.
        </h1>
        <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.95rem, 1.4vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: 600 }}>
          The data in your profile is commercially valuable. The following scenarios describe what companies already do — and are legally permitted to do — with data of this kind.
        </p>
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: PALETTE.border }}>
        {RISK_SCENARIOS.map((scenario, i) => (
          <RiskBlock key={scenario.id} scenario={scenario} index={i} results={results} />
        ))}
      </div>
    </div>
  );
}

const RISK_SCENARIOS = [
  {
    id: 'insurance', label: 'Insurance pricing', severity: 'critical',
    heading: 'An insurer you have never spoken to already knows.',
    body: 'Insurance companies feed behavioural inference data — emotional patterns, anxiety indicators, financial distress signals — directly into underwriting models. Your premium is not set by a person reviewing your file. It is set by an algorithm that assigns you a risk score based on patterns in data you produced elsewhere.',
    precedent: 'In 2023, the FTC fined BetterHelp $7.8 million after it shared sensitive mental health data — including the fact users had previously been in therapy — with Facebook and Snapchat for advertising. BetterHelp had told every user: "Rest assured — any information provided will stay private between you and your counsellor."',
    check: (r: AnalysisResult) => (r.findings.sensitiveTopics?.length || 0) > 0,
  },
  {
    id: 'employment', label: 'Employment screening', severity: 'critical',
    heading: 'You did not get the interview. You were never told why.',
    body: 'In 2024, a US federal court allowed a case against Workday to proceed — a plaintiff had applied to over 100 jobs using Workday\'s AI screening tools and was rejected from every single one. The claim: the system detected indicators of anxiety and depression. 83% of employers now use automated tools at some point in hiring.',
    precedent: 'Humantic AI generates personality profiles from written language alone, claiming 78-85% accuracy. No test required. No consent requested. If your conversation data has been used in model training, the patterns are embedded in the model that reads your next cover letter.',
    check: (r: AnalysisResult) => (r.totalUserMessages || r.stats?.userMessages || 0) > 200,
  },
  {
    id: 'targeting', label: 'Precision targeting', severity: 'high',
    heading: 'You were assigned to a segment. You did not know it existed.',
    body: 'The data broker market was valued at $278 billion in 2024. Companies purchase inferred audience segments — "financially distressed 18-34", "mental health help-seeker" — and use them to time advertising to moments of maximum vulnerability. Your vulnerability windows are commercially documented.',
    precedent: 'Oracle Data Cloud paid $115 million in 2024 to settle a case for tracking and selling user data without consent, assembling profiles on hundreds of millions of people from platforms those users visited with no awareness Oracle was involved.',
    check: (r: AnalysisResult) => (r.findings.vulnerabilityPatterns?.length || 0) > 0,
  },
  {
    id: 'breach', label: 'Breach exposure', severity: 'high',
    heading: 'None of this requires intent. One breach is enough.',
    body: '73% of enterprises reported at least one AI-related security incident in 2024. A breach does not release a file with your name at the top. It releases patterns and inferences that cannot be un-released, corrected, or deleted from the systems that received them.',
    precedent: 'The Equifax breach of 2017 exposed the financial data of 148 million people. Those people did not consent to Equifax holding their data. Most did not know Equifax existed. The company simply had it.',
    check: (r: AnalysisResult) => (r.privacyScore || 0) > 40,
  },
];

const SEVERITY_COLOR: Record<string, string> = {
  critical: PALETTE.red,
  high: PALETTE.amber || 'rgba(255,179,0,0.8)',
  medium: 'rgba(120,180,255,0.85)',
};

function RiskBlock({ scenario, index, results }: { scenario: typeof RISK_SCENARIOS[0]; index: number; results: AnalysisResult }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-5%' });
  const active = scenario.check(results);
  const sevColor = SEVERITY_COLOR[scenario.severity] || PALETTE.inkFaint;
  return (
    <motion.article ref={ref} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 1 }}
      style={{ background: PALETTE.bgPanel, padding: '2rem 2.5rem', borderLeft: `3px solid ${active ? sevColor : PALETTE.border}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
            <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: active ? sevColor : PALETTE.inkFaint, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${active ? sevColor + '40' : PALETTE.border}` }}>
              {active ? 'Active risk' : 'Low risk'}
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>{scenario.label}</span>
          </div>
          <h3 style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.45rem)', fontWeight: 400, color: PALETTE.ink, lineHeight: 1.35, marginBottom: '1.2rem' }}>{scenario.heading}</h3>
          <p style={{ fontFamily: TYPE.serif, fontSize: '0.97rem', color: PALETTE.inkMuted, lineHeight: 1.75 }}>{scenario.body}</p>
        </div>
        <div>
          <div style={{ padding: '1.2rem', background: PALETTE.bgElevated, borderRadius: '2px' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '8px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Documented precedent</p>
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.88rem', fontStyle: 'italic', color: PALETTE.inkFaint, lineHeight: 1.65 }}>{scenario.precedent}</p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [page, setPage] = useState<DashPage>('overview');
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResults');
    if (stored) {
      const parsed = JSON.parse(stored);
      setResults(parsed);
      setSources(prev => prev.map(s => s.id === 'chatgpt' ? { ...s, connected: true } : s));
    } else {
      router.push('/upload');
    }
  }, [router]);

  const handleUpload = useCallback((sourceId: string, file: File) => {
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, connected: true } : s));
  }, []);

  if (!results) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e0d' }}>
        <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.4, repeat: Infinity }}
          style={{ fontFamily: '"Courier Prime", monospace', fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(240,237,232,0.2)', textTransform: 'uppercase' }}>
          Loading
        </motion.p>
      </div>
    );
  }

  return (
    <DashboardLayout results={results} page={page} setPage={setPage}>
      {page === 'overview' && <OverviewPage results={results} sources={sources} setPage={setPage} />}
      {page === 'profile' && <ProfilePage results={results} />}
      {page === 'sources' && <SourcesPage connectedSources={sources.reduce((acc, s) => ({ ...acc, [s.id]: s.connected }), {} as Record<string, boolean>)} onUpload={handleUpload} />}
      {page === 'risk' && <RiskPage results={results} />}
      {page === 'understand' && <UnderstandPage />}
    </DashboardLayout>
  );
}
