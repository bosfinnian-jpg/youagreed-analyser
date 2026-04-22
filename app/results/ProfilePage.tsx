'use client';

import { useRef, useState, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE } from './DashboardLayout';

// ============================================================================
// TYPES
// ============================================================================

interface AnalysisResult {
  privacyScore: number;
  findings: {
    personalInfo: {
      names: { name: string; mentions: number; relationship?: string; contexts?: string[] }[];
      locations: { location: string; type: string; mentions: number }[];
      ages: string[]; emails: string[]; phoneNumbers: string[]; relationships: string[]; workInfo: string[];
    };
    sensitiveTopics: { category: string; excerpt: string; timestamp: string | number }[];
    vulnerabilityPatterns: { timeOfDay: string; messageCount?: number; frequency?: number; emotionalTone?: string }[];
    temporalInsights: unknown[];
    repetitiveThemes: { theme: string; mentions?: number; count?: number }[];
  };
  juiciestMoments: { timestamp: string; excerpt: string; juiceScore: number; reason: string }[];
  stats?: { totalMessages: number; userMessages: number; assistantMessages: number; timeSpan: string; avgMessageLength: number };
  rawStats?: { totalMessages: number; userMessages: number; timeSpan: string; avgMessageLength: number };
  totalUserMessages?: number;
  timespan?: { first: string; last: string; days: number };
  commercialProfile?: { segments: { label: string; confidence: number }[] };
  dependency?: { dependencyScore: number; trajectory: string };
  lifeEvents?: { type: string; label: string; severity: string; approximateDate?: string; evidence?: string[] }[];
  hourDistribution?: number[];
  dayDistribution?: number[];
  nighttimeRatio?: number;
  avgIntimacy?: number;
  avgAnxiety?: number;
  typeBreakdown?: Record<string, number>;
  emotionalTimeline?: unknown;
  mostVulnerablePeriod?: string;
}

// ============================================================================
// DATA DERIVATION
// ============================================================================

interface PredictedAttribute {
  label: string;
  confidence: number;
  evidence: string;
  category: 'demographic' | 'psychographic' | 'behavioural' | 'risk';
}

function generatePredictedAttributes(r: AnalysisResult): PredictedAttribute[] {
  const attrs: PredictedAttribute[] = [];
  const stats = r.stats || r.rawStats;
  const avgLen = stats?.avgMessageLength || 0;
  const totalMsgs = r.totalUserMessages || stats?.userMessages || 0;
  const themes = r.findings.repetitiveThemes || [];
  const themeLabels = themes.map(t => t.theme.toLowerCase());

  if (avgLen > 180) {
    attrs.push({ label: 'Higher education (probable degree holder)', confidence: Math.min(88, 55 + Math.round(avgLen / 10)), evidence: 'Average message length of ' + avgLen + ' characters indicates above-average written fluency', category: 'demographic' });
  } else if (avgLen > 80) {
    attrs.push({ label: 'Secondary education or above', confidence: 62, evidence: 'Message complexity consistent with secondary-level literacy', category: 'demographic' });
  }

  const youthSignals = themeLabels.filter(t => ['university', 'uni', 'student', 'career', 'job', 'dating', 'flatmate', 'rent'].some(k => t.includes(k))).length;
  const matureSignals = themeLabels.filter(t => ['mortgage', 'pension', 'retirement', 'grandchild'].some(k => t.includes(k))).length;
  if (youthSignals > 0) {
    attrs.push({ label: 'Age bracket: 18–34', confidence: Math.min(82, 55 + youthSignals * 12), evidence: youthSignals + ' topics associated with younger demographic', category: 'demographic' });
  } else if (matureSignals > 0) {
    attrs.push({ label: 'Age bracket: 45+', confidence: Math.min(78, 50 + matureSignals * 15), evidence: 'Topic patterns consistent with mature demographic', category: 'demographic' });
  } else {
    attrs.push({ label: 'Age bracket: 25–44', confidence: 45, evidence: 'Default segment — insufficient signal for precise classification', category: 'demographic' });
  }

  const homeLoc = r.findings.personalInfo.locations.find(l => l.type === 'lives');
  if (homeLoc) {
    attrs.push({ label: 'Primary residence: ' + homeLoc.location, confidence: Math.min(92, 60 + homeLoc.mentions * 8), evidence: 'Location referenced ' + homeLoc.mentions + ' times in home context', category: 'demographic' });
  }

  const mhTopics = r.findings.sensitiveTopics.filter(t => ['mental_health', 'anxiety', 'depression', 'therapy', 'stress'].includes((t.category || '').toLowerCase().replace(/ /g, '_')));
  if (mhTopics.length > 0 || (r.avgAnxiety || 0) > 4) {
    attrs.push({ label: 'Mental health: anxiety/stress indicators present', confidence: Math.min(85, 50 + mhTopics.length * 12 + Math.round((r.avgAnxiety || 0) * 5)), evidence: mhTopics.length > 0 ? mhTopics.length + ' direct mental health disclosures' : 'Elevated anxiety score across message corpus', category: 'risk' });
  }

  const finTopics = r.findings.sensitiveTopics.filter(t => ['financial', 'money', 'debt', 'salary', 'income'].includes((t.category || '').toLowerCase().replace(/ /g, '_')));
  const finEvents = (r.lifeEvents || []).filter(e => e.type === 'financial_distress');
  if (finTopics.length > 0 || finEvents.length > 0) {
    attrs.push({ label: 'Financial distress indicators', confidence: Math.min(80, 45 + finTopics.length * 10 + finEvents.length * 15), evidence: finEvents.length > 0 ? 'Life event: financial distress detected' : finTopics.length + ' financial disclosures', category: 'risk' });
  }

  if (r.dependency && r.dependency.dependencyScore > 40) {
    const traj = r.dependency.trajectory === 'increasing' ? 'accelerating' : r.dependency.trajectory === 'stable' ? 'established' : 'declining';
    attrs.push({ label: 'AI dependency: ' + traj + ' pattern', confidence: Math.min(90, r.dependency.dependencyScore), evidence: 'Dependency score ' + r.dependency.dependencyScore + '/100', category: 'behavioural' });
  }

  if ((r.nighttimeRatio || 0) > 0.08) {
    attrs.push({ label: 'Nocturnal vulnerability window', confidence: Math.min(88, 50 + Math.round((r.nighttimeRatio || 0) * 200)), evidence: Math.round((r.nighttimeRatio || 0) * 100) + '% of messages sent between midnight and 5am', category: 'behavioural' });
  }

  const relEvents = (r.lifeEvents || []).filter(e => ['relationship_end', 'relationship_start'].includes(e.type));
  if (relEvents.length > 0) {
    attrs.push({ label: 'Relationship transition phase', confidence: Math.min(82, 50 + relEvents.length * 18), evidence: relEvents.length + ' relationship events detected', category: 'psychographic' });
  }

  const careerEvents = (r.lifeEvents || []).filter(e => ['job_loss', 'job_search'].includes(e.type));
  if (careerEvents.length > 0) {
    attrs.push({ label: 'Career transition / job-seeking', confidence: Math.min(85, 55 + careerEvents.length * 15), evidence: 'Employment-related life events detected', category: 'psychographic' });
  }

  if (totalMsgs > 2000) {
    attrs.push({ label: 'High-volume user (compulsive pattern)', confidence: Math.min(92, 60 + Math.min(30, Math.round(totalMsgs / 200))), evidence: totalMsgs.toLocaleString('en-GB') + ' messages submitted', category: 'behavioural' });
  }

  return attrs.sort((a, b) => b.confidence - a.confidence);
}

interface MarketSeg {
  label: string;
  confidence: number;
  cpm: string;
  category: string;
}

function generateMarketplaceSegments(r: AnalysisResult): MarketSeg[] {
  const segments = r.commercialProfile?.segments || [];
  const cpmMap: Record<string, { cpm: string; cat: string }> = {
    mental_health_support: { cpm: '£6.20', cat: 'IAB: Health — Panic/Anxiety Disorders' },
    career_development: { cpm: '£3.80', cat: 'IAB: Business — Career Advice' },
    financial_planning: { cpm: '£4.50', cat: 'IAB: Personal Finance' },
    relationship_advice: { cpm: '£2.90', cat: 'IAB: Family — Dating/Marriage' },
    productivity_optimisation: { cpm: '£2.40', cat: 'IAB: Technology — Software' },
    creative_professional: { cpm: '£3.10', cat: 'IAB: Business — Freelance/Startup' },
    health_wellness: { cpm: '£5.60', cat: 'IAB: Health — General' },
    education_learning: { cpm: '£2.20', cat: 'IAB: Education' },
    housing_relocation: { cpm: '£7.80', cat: 'IAB: Real Estate' },
    parenting: { cpm: '£4.10', cat: 'IAB: Family — Babies and Toddlers' },
    legal_concerns: { cpm: '£8.90', cat: 'IAB: Legal' },
  };
  return segments.slice(0, 6).map(seg => {
    const key = seg.label.toLowerCase().replace(/[\s/]+/g, '_');
    const m = cpmMap[key] || { cpm: '£' + (2 + seg.confidence / 25).toFixed(2), cat: 'IAB: Unclassified' };
    return { label: seg.label, confidence: seg.confidence, cpm: m.cpm, category: m.cat };
  });
}

// ============================================================================
// SOCIAL GRAPH SVG
// ============================================================================

function SocialGraphSVG({ names }: { names: AnalysisResult['findings']['personalInfo']['names'] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [hovered, setHovered] = useState<string | null>(null);
  const W = 700; const H = 380;
  const CX = W / 2; const CY = H / 2;

  const nodes = useMemo(() => {
    const mx = Math.max(...names.map(n => n.mentions || 1), 1);
    return [...names].sort((a, b) => (b.mentions || 1) - (a.mentions || 1)).slice(0, 10).map((p, i, arr) => {
      const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
      const ratio = (p.mentions || 1) / mx;
      const dist = 100 + (1 - ratio) * 80;
      return { id: p.name, label: p.name, rel: p.relationship, mentions: p.mentions || 1, x: CX + Math.cos(angle) * dist, y: CY + Math.sin(angle) * dist, r: 5 + ratio * 14 };
    });
  }, [names, CX, CY]);

  if (names.length === 0) {
    return (
      <div style={{ padding: '2rem 0' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>
          No named individuals detected. Behavioural patterns alone are sufficient for cross-referencing your identity.
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: W }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[60, 120, 175].map((ringR, i) => (
          <motion.circle key={ringR} cx={CX} cy={CY} r={ringR} fill="none" stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="4 6"
            initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.35 } : {}} transition={{ delay: 0.2 + i * 0.15, duration: 1 }} />
        ))}
        {nodes.map((n, i) => (
          <motion.line key={`line-${n.id}`} x1={CX} y1={CY} x2={n.x} y2={n.y}
            stroke={hovered === n.id ? PALETTE.red + '90' : PALETTE.ink + '10'}
            strokeWidth={hovered === n.id ? 1.5 : 0.8}
            strokeDasharray={hovered === n.id ? 'none' : '3 4'}
            initial={{ pathLength: 0, opacity: 0 }} animate={isInView ? { pathLength: 1, opacity: 1 } : {}} transition={{ delay: 0.5 + i * 0.08, duration: 0.8 }} />
        ))}
        <motion.circle cx={CX} cy={CY} r={10} fill={PALETTE.red}
          initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.3, duration: 0.5 }} />
        <motion.text x={CX} y={CY + 24} textAnchor="middle" fill={PALETTE.inkFaint}
          style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em' }}
          initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.6 } : {}} transition={{ delay: 0.6 }}>
          YOU
        </motion.text>
        {nodes.map((n, i) => (
          <g key={n.id} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'default' }}>
            <motion.circle cx={n.x} cy={n.y} r={n.r}
              fill={hovered === n.id ? PALETTE.red : PALETTE.ink + '20'}
              stroke={hovered === n.id ? PALETTE.red : PALETTE.ink + '12'} strokeWidth={1}
              initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.7 + i * 0.08, duration: 0.5 }} />
            <motion.text x={n.x} y={n.y + n.r + 14} textAnchor="middle"
              fill={hovered === n.id ? PALETTE.ink : PALETTE.inkMuted}
              style={{ fontFamily: TYPE.serif, fontSize: '11px', pointerEvents: 'none' }}
              initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.9 + i * 0.06 }}>
              {n.label}
            </motion.text>
            {hovered === n.id && (
              <text x={n.x} y={n.y - n.r - 6} textAnchor="middle" fill={PALETTE.red}
                style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em' }}>
                {n.mentions}×
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// BEHAVIOURAL FINGERPRINT
// ============================================================================

function BehaviouralFingerprint({ hourDist, typeBreakdown }: { hourDist: number[]; typeBreakdown: Record<string, number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  if (!hourDist || hourDist.length === 0) return null;

  const maxVal = Math.max(...hourDist, 1);
  const W = 260; const H = 260;
  const CX = W / 2; const CY = H / 2;
  const outerR = 100; const innerR = 30;

  const points = hourDist.map((val, i) => {
    const angle = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const r = innerR + (val / maxVal) * (outerR - innerR);
    return { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  const totalTyped = Object.values(typeBreakdown).reduce((s, v) => s + v, 0) || 1;
  const typeEntries = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div ref={ref} style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
          24-hour activity pattern
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }}>
          {[0.33, 0.66, 1].map((pct, i) => (
            <circle key={i} cx={CX} cy={CY} r={innerR + pct * (outerR - innerR)} fill="none" stroke={PALETTE.border} strokeWidth={0.5} opacity={0.3} />
          ))}
          {[0, 6, 12, 18].map(h => {
            const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
            return (
              <g key={h}>
                <line x1={CX + Math.cos(angle) * (innerR - 4)} y1={CY + Math.sin(angle) * (innerR - 4)}
                  x2={CX + Math.cos(angle) * (outerR + 8)} y2={CY + Math.sin(angle) * (outerR + 8)}
                  stroke={PALETTE.border} strokeWidth={0.5} opacity={0.4} />
                <text x={CX + Math.cos(angle) * (outerR + 18)} y={CY + Math.sin(angle) * (outerR + 18) + 3}
                  textAnchor="middle" fill={PALETTE.inkFaint} style={{ fontFamily: TYPE.mono, fontSize: '10px' }}>
                  {String(h).padStart(2, '0')}
                </text>
              </g>
            );
          })}
          <motion.path d={pathD} fill={PALETTE.red + '10'} stroke={PALETTE.red} strokeWidth={1.5}
            initial={{ opacity: 0 }} animate={isInView ? { opacity: 0.8 } : {}} transition={{ delay: 0.4, duration: 1.2 }} />
          <text x={CX} y={CY + 4} textAnchor="middle" fill={PALETTE.inkFaint}
            style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em' }}>24H</text>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.16em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
          Message type breakdown
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {typeEntries.map(([type, count], i) => {
            const pct = (count / totalTyped) * 100;
            const alarming = type === 'confessional' || type === 'crisis';
            return (
              <motion.div key={type}
                initial={{ opacity: 0, x: -15 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: alarming ? PALETTE.red : PALETTE.inkMuted, textTransform: 'capitalize' }}>
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: '2px', background: PALETTE.ink + '08', position: 'relative', overflow: 'hidden' }}>
                  <motion.div initial={{ scaleX: 0 }} animate={isInView ? { scaleX: pct / 100 } : {}}
                    transition={{ delay: 0.8 + i * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: alarming ? PALETTE.red : PALETTE.inkMuted }} />
                </div>
              </motion.div>
            );
          })}
        </div>
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, marginTop: '1.2rem', letterSpacing: '0.08em', lineHeight: 1.6 }}>
          This classification is unique to you. It persists across sessions and cannot be reset.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function ProfilePage({ results }: { results: AnalysisResult }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  const attrs = useMemo(() => generatePredictedAttributes(results), [results]);
  const segments = useMemo(() => generateMarketplaceSegments(results), [results]);
  const [expandedAttr, setExpandedAttr] = useState<number | null>(null);

  const stats = results.stats || results.rawStats;
  const totalMsgs = results.totalUserMessages || stats?.userMessages || 0;
  const segmentId = 'USR-' + String(results.privacyScore).padStart(3, '0') + '-' + String(totalMsgs % 10000).padStart(4, '0');
  const topSeg = results.commercialProfile?.segments?.[0];

  const catColors: Record<string, string> = {
    demographic: PALETTE.inkMuted,
    psychographic: PALETTE.red + '90',
    behavioural: PALETTE.amber,
    risk: PALETTE.red,
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

      {/* Classification geometry — top right */}
      <svg style={{
        position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
        pointerEvents: 'none', overflow: 'visible',
      }}>
        {/* Bracket marks — like a classification stamp boundary */}
        <g transform="translate(160, 40)">
          <path d="M -20 -20 L 0 -20 L 0 20" fill="none" stroke="rgba(26,24,20,0.08)" strokeWidth="1" />
          <path d="M -20 60 L 0 60 L 0 20" fill="none" stroke="rgba(26,24,20,0.08)" strokeWidth="1" />
          <text x="4" y="24" fontFamily="'Courier Prime', monospace" fontSize="8"
            fill="rgba(26,24,20,0.15)" letterSpacing="2" textAnchor="start">PROFILED</text>
          <text x="4" y="36" fontFamily="'Courier Prime', monospace" fontSize="7"
            fill="rgba(220,60,50,0.2)" letterSpacing="2" textAnchor="start">REF:{segmentId.slice(-6)}</text>
        </g>
      </svg>

      {/* ================================================================
          OPENING — full-width statement that sets up everything below
          ================================================================ */}
      <div ref={heroRef} style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : {}}
          style={{ fontFamily: TYPE.mono, fontSize: '12px', letterSpacing: '0.20em', color: PALETTE.inkMuted, textTransform: 'uppercase', marginBottom: '1.2rem' }}
        >
          02 — Profile
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: '1.5rem', maxWidth: '18ch' }}
        >
          You did not fill in a form. The system built this from your writing.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 1.8vw, 1.3rem)', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '56ch' }}
        >
          Every attribute below was inferred, not declared. None required your permission. 
          Together they constitute the kind of profile that circulates across the data broker ecosystem — built from writing patterns, not from a form you filled in.
        </motion.p>
      </div>

      {/* ================================================================
          INFERRED ATTRIBUTES — the confrontational core
          ================================================================ */}
      <ProfileSection index={1}>
        <SectionHeader
          label="Inferred attributes"
          heading="What the system believes about you."
          headingSize="clamp(1.6rem, 3.5vw, 2.4rem)"
          body="None of these were stated. All were inferred from patterns in your writing. Click any row to see the evidence."
        />
        {attrs.length === 0 ? (
          <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>
            Insufficient data to generate attribute predictions.
          </p>
        ) : (
          <div>
            {attrs.map((attr, i) => {
              const isExp = expandedAttr === i;
              const cc = catColors[attr.category] || PALETTE.inkMuted;
              return (
                <motion.div
                  key={attr.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-5%' }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  onClick={() => setExpandedAttr(isExp ? null : i)}
                  whileHover={{ backgroundColor: 'rgba(26,24,20,0.018)' }}
                  style={{
                    padding: '1.1rem 0 1.1rem 1.2rem',
                    borderBottom: `1px solid ${PALETTE.border}`,
                    borderLeft: `2px solid ${isExp ? cc : cc + '28'}`,
                    cursor: 'pointer',
                    transition: 'border-left-color 0.2s, background 0.2s',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: cc, textTransform: 'uppercase', padding: '1px 5px', border: `1px solid ${cc}28` }}>
                          {attr.category}
                        </span>
                      </div>
                      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)', color: PALETTE.ink, lineHeight: 1.35 }}>{attr.label}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: TYPE.mono, fontSize: 'clamp(1rem, 1.6vw, 1.2rem)', color: attr.confidence > 70 ? PALETTE.red : PALETTE.inkMuted, letterSpacing: '-0.01em' }}>
                          {attr.confidence}%
                        </span>
                      </div>
                      <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, width: '1rem', textAlign: 'center' }}>
                        {isExp ? '−' : '+'}
                      </span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.9rem', marginBottom: '0.3rem' }}>
                          Evidence
                        </p>
                        <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.inkMuted, lineHeight: 1.65, fontStyle: 'italic' }}>
                          {attr.evidence}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </ProfileSection>

      {/* ================================================================
          COMMERCIAL VALUE — what the profile is worth
          ================================================================ */}
      <ProfileSection index={2}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <SectionHeader
              label="Commercial value"
              heading="What a profile like yours is worth."
              headingSize="clamp(1.6rem, 3.2vw, 2.4rem)"
              body="These are the IAB advertising segments your inferred profile maps onto. OpenAI does not sell your data — but these are the categories your conversations would fall into if they entered the data broker ecosystem. The CPM rate is what advertisers pay per thousand impressions to reach someone with your profile."
            />
          </div>
          {/* Product card — moved here, no longer the page opener */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ background: PALETTE.bgElevated, border: `1px solid ${PALETTE.border}`, padding: '1.5rem', minWidth: 220, flexShrink: 0 }}
          >
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '3px' }}>Segment ID</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '1rem', color: PALETTE.ink, letterSpacing: '0.06em', marginBottom: '1rem' }}>{segmentId}</p>
            <div style={{ height: '1px', background: PALETTE.border, marginBottom: '1rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {[
                { l: 'Data points', v: totalMsgs.toLocaleString('en-GB') },
                { l: 'Quality', v: results.privacyScore >= 70 ? 'Premium' : results.privacyScore >= 40 ? 'Standard' : 'Sparse' },
                { l: 'Segment', v: (topSeg?.label || 'General').replace(/_/g, ' ') },
                { l: 'Contacts', v: String(results.findings.personalInfo.names.length) },
              ].map(item => (
                <div key={item.l}>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.12em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '3px' }}>{item.l}</p>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: results.privacyScore >= 70 && item.l === 'Quality' ? PALETTE.red : PALETTE.ink, textTransform: 'capitalize' }}>{item.v}</p>
                </div>
              ))}
            </div>
            <div style={{ height: '1px', background: PALETTE.border, margin: '1rem 0' }} />
            <p style={{ fontFamily: TYPE.serif, fontSize: '0.95rem', color: PALETTE.inkMuted, lineHeight: 1.7, fontStyle: 'italic' }}>
              This is the profile that would be available if this data entered the broker ecosystem.
            </p>
          </motion.div>
        </div>

        {segments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1px', background: PALETTE.border }}>
            {segments.map((seg, i) => (
              <motion.div
                key={seg.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                style={{ background: PALETTE.bgPanel, padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.ink, textTransform: 'capitalize', flex: 1, marginRight: '1rem' }}>
                    {seg.label.replace(/_/g, ' ')}
                  </p>
                  <p style={{ fontFamily: TYPE.mono, fontSize: '1rem', color: PALETTE.red, letterSpacing: '0.04em', flexShrink: 0 }}>{seg.cpm}</p>
                </div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: PALETTE.inkFaint, marginBottom: '0.6rem' }}>{seg.category}</p>
                <div style={{ height: '2px', background: PALETTE.ink + '08', position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: seg.confidence / 100 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: PALETTE.red + '60' }}
                  />
                </div>
                <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, marginTop: '0.4rem' }}>{seg.confidence}% confidence</p>
              </motion.div>
            ))}
          </div>
        )}
        <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: PALETTE.inkFaint, marginTop: '1.2rem' }}>
          CPM rates are indicative, based on 2024 IAB programmatic benchmarks.
        </p>
      </ProfileSection>

      {/* ================================================================
          SOCIAL GRAPH — the people you mentioned without their consent
          ================================================================ */}
      <ProfileSection index={3}>
        <SectionHeader
          label="Social graph"
          heading="Everyone you mentioned is in here too."
          headingSize="clamp(1.6rem, 3vw, 2.2rem)"
          body="Every name you wrote became a node. Their data is now linked to yours. They did not consent to this. Neither did you."
        />
        <SocialGraphSVG names={results.findings.personalInfo.names} />
        {results.findings.personalInfo.names.length > 0 && (
          <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em', color: PALETTE.inkFaint, marginTop: '1.5rem' }}>
            Neither you nor the people in this graph consented to this association.
          </p>
        )}
      </ProfileSection>

      {/* ================================================================
          BEHAVIOURAL FINGERPRINT — the identifying signature
          ================================================================ */}
      {results.hourDistribution && results.typeBreakdown && (
        <ProfileSection index={4}>
          <SectionHeader
            label="Behavioural signature"
            heading="Your fingerprint."
            headingSize="clamp(1.6rem, 3.2vw, 2.4rem)"
            body="When you write, how you write, and what you write about — combined, this shape is unique to you. It can be used to identify you across platforms without a name."
          />
          <BehaviouralFingerprint hourDist={results.hourDistribution} typeBreakdown={results.typeBreakdown} />
        </ProfileSection>
      )}

      {/* ================================================================
          CLOSING
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 1.2 }}
        style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)' }}
      >
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '1px', background: PALETTE.ink, transformOrigin: 'left', marginBottom: '2.5rem', opacity: 0.12 }}
        />
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 1 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 1.8vw, 1.3rem)', color: PALETTE.ink, lineHeight: 1.75, maxWidth: '52ch', marginBottom: '1rem' }}
        >
          This is not your identity. This is a commercial reconstruction of your identity — assembled without your knowledge, retained without your meaningful consent, and irrecoverable once embedded in a trained model.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 1 }}
          style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '52ch', fontStyle: 'italic' }}
        >
          The difference between the two is what makes it valuable.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.55 }}
          viewport={{ once: true }}
          transition={{ delay: 1.4, duration: 1.2 }}
          style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '2.5rem' }}
        >
          End of product listing.
        </motion.p>
      </motion.div>

    </div>
  );
}

// ============================================================================
// SHARED LAYOUT COMPONENTS
// ============================================================================

function ProfileSection({ children, index }: { children: React.ReactNode; index?: number }) {
  return (
    <div style={{ padding: 'clamp(3.5rem, 8vw, 6rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, position: 'relative' }}>
      {/* Ghost section number */}
      {index !== undefined && (
        <div style={{
          position: 'absolute',
          top: 'clamp(2rem, 5vw, 4rem)',
          right: 'clamp(2rem, 5vw, 4rem)',
          fontFamily: "'EB Garamond', serif",
          fontSize: 'clamp(80px, 12vw, 140px)',
          fontWeight: 400,
          color: 'rgba(26,24,20,0.025)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {String(index).padStart(2, '0')}
        </div>
      )}
      {children}
    </div>
  );
}

function SectionHeader({ label, heading, headingSize, body }: { label: string; heading: string; headingSize: string; body: string }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '12px', letterSpacing: '0.20em', color: PALETTE.inkMuted, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: headingSize, fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.2rem' }}>
        {heading}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '1.15rem', color: PALETTE.inkMuted, lineHeight: 1.8, maxWidth: '58ch' }}>
        {body}
      </p>
    </div>
  );
}
