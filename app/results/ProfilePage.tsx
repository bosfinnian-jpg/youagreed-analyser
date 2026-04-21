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
    attrs.push({ label: 'Age bracket: 18\u201334', confidence: Math.min(82, 55 + youthSignals * 12), evidence: youthSignals + ' topics associated with younger demographic', category: 'demographic' });
  } else if (matureSignals > 0) {
    attrs.push({ label: 'Age bracket: 45+', confidence: Math.min(78, 50 + matureSignals * 15), evidence: 'Topic patterns consistent with mature demographic', category: 'demographic' });
  } else {
    attrs.push({ label: 'Age bracket: 25\u201344', confidence: 45, evidence: 'Default segment \u2014 insufficient signal for precise classification', category: 'demographic' });
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
    mental_health_support: { cpm: '\u00a36.20', cat: 'IAB: Health \u2014 Panic/Anxiety Disorders' },
    career_development: { cpm: '\u00a33.80', cat: 'IAB: Business \u2014 Career Advice' },
    financial_planning: { cpm: '\u00a34.50', cat: 'IAB: Personal Finance' },
    relationship_advice: { cpm: '\u00a32.90', cat: 'IAB: Family \u2014 Dating/Marriage' },
    productivity_optimisation: { cpm: '\u00a32.40', cat: 'IAB: Technology \u2014 Software' },
    creative_professional: { cpm: '\u00a33.10', cat: 'IAB: Business \u2014 Freelance/Startup' },
    health_wellness: { cpm: '\u00a35.60', cat: 'IAB: Health \u2014 General' },
    education_learning: { cpm: '\u00a32.20', cat: 'IAB: Education' },
    housing_relocation: { cpm: '\u00a37.80', cat: 'IAB: Real Estate' },
    parenting: { cpm: '\u00a34.10', cat: 'IAB: Family \u2014 Babies and Toddlers' },
    legal_concerns: { cpm: '\u00a38.90', cat: 'IAB: Legal' },
  };
  return segments.slice(0, 6).map(seg => {
    const key = seg.label.toLowerCase().replace(/[\s/]+/g, '_');
    const m = cpmMap[key] || { cpm: '\u00a3' + (2 + seg.confidence / 25).toFixed(2), cat: 'IAB: Unclassified' };
    return { label: seg.label, confidence: seg.confidence, cpm: m.cpm, category: m.cat };
  });
}

// ============================================================================
// SVG SOCIAL GRAPH
// ============================================================================

function SocialGraphSVG({ names }: { names: AnalysisResult['findings']['personalInfo']['names'] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [hovered, setHovered] = useState<string | null>(null);
  const W = 700;
  const H = 400;
  const CX = W / 2;
  const CY = H / 2;

  const nodes = useMemo(() => {
    const mx = Math.max(...names.map(n => n.mentions || 1), 1);
    const sorted = [...names].sort((a, b) => (b.mentions || 1) - (a.mentions || 1)).slice(0, 10);
    return sorted.map((p, i) => {
      const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2;
      const ratio = (p.mentions || 1) / mx;
      const dist = 100 + (1 - ratio) * 80;
      return {
        id: p.name,
        label: p.name,
        rel: p.relationship,
        mentions: p.mentions || 1,
        x: CX + Math.cos(angle) * dist,
        y: CY + Math.sin(angle) * dist,
        r: 6 + ratio * 16,
      };
    });
  }, [names, CX, CY]);

  if (names.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, fontStyle: 'italic' }}>
          {"No named individuals detected. Behavioural patterns alone are sufficient for cross-referencing your identity."}
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: W }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Concentric rings */}
        {[60, 120, 180].map((ringR, i) => (
          <motion.circle
            key={ringR} cx={CX} cy={CY} r={ringR}
            fill="none" stroke={PALETTE.border} strokeWidth={0.5} strokeDasharray="4 6"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.4 } : {}}
            transition={{ delay: 0.2 + i * 0.15, duration: 1 }}
          />
        ))}

        {/* Connection lines */}
        {nodes.map((n, i) => (
          <motion.line
            key={`line-${n.id}`} x1={CX} y1={CY} x2={n.x} y2={n.y}
            stroke={hovered === n.id ? (PALETTE.red + '80') : (PALETTE.ink + '12')}
            strokeWidth={hovered === n.id ? 1.5 : 0.8}
            strokeDasharray={hovered === n.id ? 'none' : '3 4'}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.8 }}
          />
        ))}

        {/* Centre node — YOU */}
        <motion.circle
          cx={CX} cy={CY} r={10} fill={PALETTE.red}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        <motion.text
          x={CX} y={CY + 24} textAnchor="middle" fill={PALETTE.inkFaint}
          style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.6 } : {}}
          transition={{ delay: 0.6 }}
        >
          {"YOU"}
        </motion.text>

        {/* Person nodes */}
        {nodes.map((n, i) => (
          <g key={n.id} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'default' }}>
            <motion.circle
              cx={n.x} cy={n.y} r={n.r}
              fill={hovered === n.id ? PALETTE.red : (PALETTE.ink + '25')}
              stroke={hovered === n.id ? PALETTE.red : (PALETTE.ink + '15')}
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 + i * 0.08, duration: 0.5 }}
            />
            <motion.text
              x={n.x} y={n.y + n.r + 14} textAnchor="middle"
              fill={hovered === n.id ? PALETTE.ink : PALETTE.inkMuted}
              style={{ fontFamily: TYPE.serif, fontSize: '11px', pointerEvents: 'none' }}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.9 + i * 0.06 }}
            >
              {n.label}
            </motion.text>
            {n.rel && hovered === n.id && (
              <text
                x={n.x} y={n.y + n.r + 26} textAnchor="middle" fill={PALETTE.inkFaint}
                style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em' }}
              >
                {n.rel}
              </text>
            )}
            {hovered === n.id && (
              <text
                x={n.x} y={n.y - n.r - 6} textAnchor="middle" fill={PALETTE.red}
                style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.1em' }}
              >
                {n.mentions + 'x'}
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
  const W = 280;
  const H = 280;
  const CX = W / 2;
  const CY = H / 2;
  const outerR = 110;
  const innerR = 35;

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
      {/* Radial activity chart */}
      <div>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
          {"24-hour activity signature"}
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H }}>
          {[0.33, 0.66, 1].map((pct, i) => (
            <circle key={i} cx={CX} cy={CY} r={innerR + pct * (outerR - innerR)} fill="none" stroke={PALETTE.border} strokeWidth={0.5} opacity={0.3} />
          ))}
          {[0, 6, 12, 18].map(h => {
            const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
            const lx = CX + Math.cos(angle) * (outerR + 18);
            const ly = CY + Math.sin(angle) * (outerR + 18);
            return (
              <g key={h}>
                <line
                  x1={CX + Math.cos(angle) * (innerR - 4)} y1={CY + Math.sin(angle) * (innerR - 4)}
                  x2={CX + Math.cos(angle) * (outerR + 8)} y2={CY + Math.sin(angle) * (outerR + 8)}
                  stroke={PALETTE.border} strokeWidth={0.5} opacity={0.4}
                />
                <text x={lx} y={ly + 3} textAnchor="middle" fill={PALETTE.inkFaint} style={{ fontFamily: TYPE.mono, fontSize: '10px' }}>
                  {String(h).padStart(2, '0')}
                </text>
              </g>
            );
          })}
          <motion.path
            d={pathD} fill={PALETTE.red + '10'} stroke={PALETTE.red} strokeWidth={1.5}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.8 } : {}}
            transition={{ delay: 0.4, duration: 1.2 }}
          />
          <text x={CX} y={CY + 3} textAnchor="middle" fill={PALETTE.inkFaint} style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em' }}>
            {"24H"}
          </text>
        </svg>
      </div>

      {/* Message type vector */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '1rem' }}>
          {"Message classification vector"}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {typeEntries.map(([type, count], i) => {
            const pct = (count / totalTyped) * 100;
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: -15 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkMuted, textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</span>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint }}>{pct.toFixed(1) + '%'}</span>
                </div>
                <div style={{ height: '2px', background: PALETTE.ink + '08', position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: pct / 100 } : {}}
                    transition={{ delay: 0.8 + i * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: (type === 'confessional' || type === 'crisis') ? PALETTE.red : PALETTE.inkMuted }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', color: PALETTE.inkFaint, marginTop: '1rem', letterSpacing: '0.1em'}}>
          {"This vector is your behavioural signature. It is unique to you and persists across sessions."}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION: PRODUCT LISTING CARD
// ============================================================================

function ProductListingCard({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const stats = results.stats || results.rawStats;
  const totalMsgs = results.totalUserMessages || stats?.userMessages || 0;
  const segmentId = 'USR-' + String(results.privacyScore).padStart(3, '0') + '-' + String(totalMsgs % 10000).padStart(4, '0');
  const topSeg = results.commercialProfile?.segments?.[0];

  const metaItems = [
    { l: 'Data points', v: totalMsgs.toLocaleString('en-GB') },
    { l: 'Collection window', v: results.timespan ? results.timespan.days + 'd' : '\u2014' },
    { l: 'Primary segment', v: (topSeg?.label || 'Unclassified').replace(/_/g, ' ') },
    { l: 'Named contacts', v: String(results.findings.personalInfo.names.length) },
    { l: 'Locations', v: String(results.findings.personalInfo.locations.length) },
    { l: 'Risk indicators', v: String(results.findings.sensitiveTopics.length) },
  ];

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
      style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, position: 'relative', overflow: 'hidden' }}
    >
      {/* Scan line */}
      <motion.div
        initial={{ top: 0 }}
        animate={{ top: '100%' }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent 0%, ${PALETTE.red}20 30%, ${PALETTE.red}40 50%, ${PALETTE.red}20 70%, transparent 100%)`, pointerEvents: 'none', zIndex: 2 }}
      />

      {/* Product stamp */}
      <motion.div
        initial={{ opacity: 0, scale: 1.6, rotate: -8 }}
        animate={isInView ? { opacity: 0.08, scale: 1, rotate: -4 } : {}}
        transition={{ delay: 0.6, duration: 0.15 }}
        style={{ position: 'absolute', right: '3rem', top: '2rem', fontFamily: TYPE.mono, fontSize: 'clamp(1.5rem, 4vw, 2.8rem)', fontWeight: 700, color: PALETTE.red, letterSpacing: '0.15em', textTransform: 'uppercase', border: `3px solid ${PALETTE.red}`, padding: '0.3em 0.6em', pointerEvents: 'none', userSelect: 'none' }}
      >
        {"PRODUCT"}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.4 } : {}}
        transition={{ delay: 0.15 }}
        style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.25em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem' }}
      >
        {"02 \u2014 My profile / Data product listing"}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.25, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2rem', maxWidth: '65%' }}
      >
        {"You, as a product."}
      </motion.h1>

      {/* Product card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.45, duration: 0.7 }}
        style={{ background: PALETTE.bgElevated, border: `1px solid ${PALETTE.border}`, padding: 'clamp(1.5rem, 3vw, 2.5rem)', maxWidth: 560 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '4px' }}>{"Segment ID"}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '1.1rem', color: PALETTE.ink, letterSpacing: '0.08em' }}>{segmentId}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '4px' }}>{"Data quality"}</p>
            <p style={{ fontFamily: TYPE.mono, fontSize: '1.1rem', color: results.privacyScore >= 70 ? PALETTE.red : PALETTE.ink }}>
              {results.privacyScore >= 70 ? 'PREMIUM' : results.privacyScore >= 40 ? 'STANDARD' : 'SPARSE'}
            </p>
          </div>
        </div>

        <div style={{ height: '1px', background: PALETTE.border, margin: '1rem 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.2rem' }}>
          {metaItems.map((item, i) => (
            <motion.div key={item.l} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.7 + i * 0.08 }}>
              <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '3px' }}>{item.l}</p>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, textTransform: 'capitalize' }}>{item.v}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ height: '1px', background: PALETTE.border, margin: '1.2rem 0' }} />

        <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint}}>
          {"This record is available for purchase via real-time bidding. No consent is required from the data subject."}
        </p>
      </motion.div>
    </motion.section>
  );
}

// ============================================================================
// SECTION: PREDICTED ATTRIBUTES
// ============================================================================

function PredictedAttributesSection({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const attrs = useMemo(() => generatePredictedAttributes(results), [results]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const catColors: Record<string, string> = { demographic: PALETTE.inkMuted, psychographic: PALETTE.red + '90', behavioural: PALETTE.ink, risk: PALETTE.red };

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.7 }}>
        {"Inferred attributes"}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {"What the system believes about you."}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.65, marginBottom: '2rem', maxWidth: 520 }}>
        {"None of these were stated. All were inferred from the patterns in your writing. Click any attribute to see the evidence chain."}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {attrs.map((attr, i) => {
          const isExp = expandedIdx === i;
          const cc = catColors[attr.category] || PALETTE.inkMuted;
          return (
            <motion.div
              key={attr.label}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
              onClick={() => setExpandedIdx(isExp ? null : i)}
              style={{ padding: '1rem 0 1rem 1rem', borderBottom: `1px solid ${PALETTE.border}`, borderLeft: `2px solid ${isExp ? cc : cc + '30'}`, cursor: 'pointer', transition: 'border-color 0.2s ease' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: cc, textTransform: 'uppercase', padding: '2px 6px', border: `1px solid ${cc}30` }}>{attr.category}</span>
                  </div>
                  <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink }}>{attr.label}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
                  <div style={{ width: 60, height: '3px', background: PALETTE.ink + '08', position: 'relative', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={isInView ? { scaleX: attr.confidence / 100 } : {}}
                      transition={{ delay: 0.3 + i * 0.07, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: attr.confidence > 70 ? PALETTE.red : PALETTE.inkMuted }}
                    />
                  </div>
                  <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: attr.confidence > 70 ? PALETTE.red : PALETTE.inkFaint, width: '2.5rem', textAlign: 'right' }}>
                    {attr.confidence + '%'}
                  </span>
                </div>
              </div>
              <AnimatePresence>
                {isExp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                    <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.14em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '0.8rem', marginBottom: '0.3rem' }}>{"Evidence chain"}</p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, lineHeight: 1.6, fontStyle: 'italic' }}>{attr.evidence}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

// ============================================================================
// SECTION: MARKETPLACE
// ============================================================================

function MarketplaceSection({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const segments = useMemo(() => generateMarketplaceSegments(results), [results]);

  if (segments.length === 0) return null;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {"Marketplace valuation"}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {"What you are worth."}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.65, marginBottom: '2rem', maxWidth: 520 }}>
        {"These are the advertising segments your profile would be sold into via real-time bidding, with estimated CPM rates based on IAB industry categories."}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: PALETTE.border }}>
        {segments.map((seg, i) => (
          <motion.div
            key={seg.label}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
            style={{ background: PALETTE.bgPanel, padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
              <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.ink, textTransform: 'capitalize' }}>{seg.label.replace(/_/g, ' ')}</p>
              <p style={{ fontFamily: TYPE.mono, fontSize: '1rem', color: PALETTE.red, letterSpacing: '0.04em', flexShrink: 0 }}>{seg.cpm}</p>
            </div>
            <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', color: PALETTE.inkFaint, marginBottom: '0.6rem' }}>{seg.category}</p>
            <div style={{ height: '2px', background: PALETTE.ink + '08', position: 'relative', overflow: 'hidden' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: seg.confidence / 100 } : {}}
                transition={{ delay: 0.4 + i * 0.08, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: PALETTE.red + '70' }}
              />
            </div>
            <p style={{ fontFamily: TYPE.mono, fontSize: '11px', color: PALETTE.inkFaint, marginTop: '0.4rem' }}>{seg.confidence + '% confidence'}</p>
          </motion.div>
        ))}
      </div>

      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', color: PALETTE.inkFaint, marginTop: '1.2rem', maxWidth: 500}}>
        {"CPM rates are indicative, based on 2024 IAB programmatic benchmarks."}
      </p>
    </motion.section>
  );
}

// ============================================================================
// SECTION: SOCIAL GRAPH
// ============================================================================

function SocialGraphSection({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {"Social graph"}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {"Your network, reconstructed."}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.65, marginBottom: '2rem', maxWidth: 520 }}>
        {"Every name you mentioned created a link. Your record is now cross-referenced with theirs. Hover to see connection strength."}
      </p>

      <SocialGraphSVG names={results.findings.personalInfo.names} />

      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.12em', color: PALETTE.inkFaint, marginTop: '1.5rem'}}>
        {"Neither you nor the people in this graph consented to this association."}
      </p>
    </motion.section>
  );
}

// ============================================================================
// SECTION: FINGERPRINT
// ============================================================================

function FingerprintSection({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  if (!results.hourDistribution || !results.typeBreakdown) return null;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
      style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}
    >
      <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.22em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        {"Behavioural signature"}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.2 }}>
        {"Your fingerprint."}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '0.9rem', color: PALETTE.inkMuted, lineHeight: 1.65, marginBottom: '2.5rem', maxWidth: 520 }}>
        {"This is a composite of when you write, how you write, and what you write about. No two users produce the same shape. It can be used to identify you across platforms without a name."}
      </p>

      <BehaviouralFingerprint hourDist={results.hourDistribution} typeBreakdown={results.typeBreakdown} />
    </motion.section>
  );
}

// ============================================================================
// SECTION: CLOSING
// ============================================================================

function ProfileClosing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 1.2 }}
      style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)' }}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ height: '1px', background: PALETTE.ink, transformOrigin: 'left', marginBottom: '2rem', opacity: 0.15 }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.85 } : {}}
        transition={{ delay: 0.6, duration: 1 }}
        style={{ fontFamily: TYPE.serif, fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 520 }}
      >
        {"This is not your identity. This is a commercial reconstruction of your identity, assembled without your knowledge and sold without your consent. The difference between the two is what makes it valuable."}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.45 } : {}}
        transition={{ delay: 1.4, duration: 1.2 }}
        style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkFaint, textTransform: 'uppercase', marginTop: '2rem' }}
      >
        {"End of product listing."}
      </motion.p>
    </motion.section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function ProfilePage({ results }: { results: AnalysisResult }) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
      <ProductListingCard results={results} />
      <PredictedAttributesSection results={results} />
      <MarketplaceSection results={results} />
      <SocialGraphSection results={results} />
      <FingerprintSection results={results} />
      <ProfileClosing />
    </div>
  );
}
