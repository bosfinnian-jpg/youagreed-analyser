'use client';

import { useRef, useState, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { PALETTE, TYPE, ActLabel, ThreadSentence } from './DashboardLayout';
import { RetainedTag } from './CannotBeDeletedPage';

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
  psychologicalPortrait?: {
    attachmentStyle: string | null;
    communicationPattern: string | null;
    primaryCopingMechanism: string | null;
    emotionalBaselineLabel: string;
    selfPerceptionThemes: string[];
    relationshipDynamics: string | null;
    dominantNarrative: string | null;
    writingVoice: string | null;
    inferredBeliefs?: string[];
  };
  scoreBreakdown?: Array<{ label: string; contribution: number; detail: string; category: string }>;
  synthesis?: {
    characterSummary: string;
    demographicPredictions: Array<{ attribute: string; value: string; confidence: number; evidence: string }>;
    verbalTells: Array<{ tell: string; meaning: string; frequency: string }>;
    predictedBehaviours: Array<{ behaviour: string; likelihood: string; evidence: string }>;
    commercialTargets: Array<{ brand: string; category: string; why: string }>;
    recurringConcerns: Array<{ concern: string; evidence: string }>;
    unintentionalDisclosures: Array<{ disclosure: string; via: string }>;
    inferredCoreBeliefs: string[];
  };
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


// ============================================================================
// SYNTHESIS SECTIONS — AI-generated intelligence briefing
// ============================================================================

// Animated reveal wrapper
function Reveal({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.7 }}
    >
      {children}
    </motion.div>
  );
}

// ----- CHARACTER SUMMARY -----
function CharacterSummarySection({ summary }: { summary: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const sentences = summary.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0);

  return (
    <ProfileSection index={0}>
      <SectionHeader
        label="Intelligence briefing"
        heading="The subject, in forensic terms."
        headingSize="clamp(1.8rem, 4vw, 2.8rem)"
        body="The passage below was written by an AI model after reading the most revealing messages in the corpus. It is a synthesis, not a quotation. Every claim is grounded in the evidence that follows. No questionnaire was completed. All of it is permanent."
      />

      <div ref={ref} style={{
        borderLeft: `3px solid ${PALETTE.red}`,
        paddingLeft: 'clamp(1.5rem, 3vw, 2.5rem)',
        marginBottom: 'clamp(2rem, 4vw, 3rem)',
      }}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em',
          color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '1.5rem',
        }}>
          Forensic portrait — confidential   ● Retained in model weights
        </p>
        <div style={{
          fontFamily: TYPE.serif,
          fontSize: 'clamp(1.2rem, 2.2vw, 1.55rem)',
          color: PALETTE.ink,
          lineHeight: 1.75,
          maxWidth: '56ch',
        }}>
          {sentences.map((sentence, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.25, duration: 0.9 }}
              style={{ display: 'inline' }}
            >
              {sentence}{i < sentences.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </div>
      </div>

      <Reveal delay={0.3}>
        <p style={{
          fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
          color: PALETTE.inkFaint, textTransform: 'uppercase',
        }}>
          Generated from {sentences.length} sentence{sentences.length === 1 ? '' : 's'} of synthesis.
          This is what a model knows about you after a single reading.
        </p>
      </Reveal>
    </ProfileSection>
  );
}

// ----- INFERRED CORE BELIEFS -----
function CoreBeliefsSection({ beliefs }: { beliefs: string[] }) {
  if (beliefs.length === 0) return null;
  return (
    <ProfileSection index={1}>
      <SectionHeader
        label="Inferred core beliefs"
        heading="What your writing reveals you believe about yourself."
        headingSize="clamp(1.6rem, 3.2vw, 2.2rem)"
        body="None of these are statements you made. They are the underlying beliefs the model infers from the pattern of how you frame yourself, others, and the world. First-person because that is the grammar of a belief."
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {beliefs.map((belief, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <div style={{
              padding: '1.4rem 0 1.4rem 1.8rem',
              borderBottom: `1px solid ${PALETTE.border}`,
              borderLeft: `2px solid ${PALETTE.red}35`,
              position: 'relative',
            }}>
              <span style={{
                position: 'absolute', left: '-1px', top: '50%',
                width: '12px', height: '1px', background: PALETTE.red,
                opacity: 0.6,
              }} />
              <p style={{
                fontFamily: TYPE.serif,
                fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)',
                fontStyle: 'italic',
                color: PALETTE.ink,
                lineHeight: 1.45,
                letterSpacing: '-0.005em',
              }}>
                &ldquo;{belief}&rdquo;
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </ProfileSection>
  );
}

// ----- DEMOGRAPHIC PREDICTIONS -----
function DemographicPredictionsSection({ predictions }: { predictions: AnalysisResult['synthesis'] extends infer T ? T extends { demographicPredictions: infer P } ? P : never : never }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!predictions || predictions.length === 0) return null;

  return (
    <ProfileSection index={2}>
      <SectionHeader
        label="Demographic predictions"
        heading="What can be inferred without asking."
        headingSize="clamp(1.6rem, 3.2vw, 2.2rem)"
        body="Each prediction below was derived purely from your writing patterns, topic distribution, and language markers. This is the kind of profile data brokers build without consent, by the hundreds of millions of rows."
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {predictions.map((pred: any, i: number) => {
          const isExp = expanded === i;
          const confColor = pred.confidence >= 75 ? PALETTE.red : pred.confidence >= 55 ? PALETTE.amber : PALETTE.inkMuted;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5%' }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              onClick={() => setExpanded(isExp ? null : i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                padding: '1.3rem 0',
                borderBottom: `1px solid ${PALETTE.border}`,
                display: 'grid',
                gridTemplateColumns: 'minmax(100px, 160px) 1fr minmax(55px, 70px) 20px',
                gap: '1rem',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <span style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em', color: PALETTE.inkFaint, textTransform: 'uppercase' }}>
                {pred.attribute}
              </span>
              <span style={{ fontFamily: TYPE.serif, fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', color: PALETTE.ink, letterSpacing: '-0.01em' }}>
                {pred.value}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ flex: 1, height: '1px', background: PALETTE.border, position: 'relative', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: pred.confidence / 100 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    style={{ position: 'absolute', inset: 0, transformOrigin: 'left', background: confColor }}
                  />
                </div>
                <span style={{ fontFamily: TYPE.mono, fontSize: '11px', color: confColor, minWidth: '2.5rem', textAlign: 'right' }}>
                  {pred.confidence}%
                </span>
              </div>
              <span style={{ fontFamily: TYPE.mono, fontSize: '14px', color: PALETTE.inkFaint, transition: 'transform 0.2s', transform: isExp ? 'rotate(45deg)' : 'none', textAlign: 'right' }}>
                +
              </span>
              <AnimatePresence>
                {isExp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ gridColumn: '1 / -1', overflow: 'hidden', paddingTop: '1rem' }}
                  >
                    <p style={{ fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.18em', color: PALETTE.inkMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Evidence
                    </p>
                    <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', fontStyle: 'italic', color: PALETTE.inkMuted, lineHeight: 1.7, maxWidth: '55ch' }}>
                      {pred.evidence}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </ProfileSection>
  );
}

// ----- VERBAL TELLS -----
function VerbalTellsSection({ tells }: { tells: any[] }) {
  if (!tells || tells.length === 0) return null;
  return (
    <ProfileSection index={3}>
      <SectionHeader
        label="Verbal tells"
        heading="The phrases you use without realising."
        headingSize="clamp(1.6rem, 3.2vw, 2.2rem)"
        body="Writing style has a fingerprint. These are recurring phrases, hedges, and linguistic tics pulled from your corpus — each one revealing something about how you think, what you assume, and what you protect yourself from."
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {tells.map((t: any, i: number) => (
          <Reveal key={i} delay={i * 0.08}>
            <div className="tells-row" style={{
              padding: '1.5rem 0',
              borderBottom: `1px solid ${PALETTE.border}`,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '2rem',
              alignItems: 'start',
            }}>
              <div>
                <p style={{
                  fontFamily: TYPE.serif,
                  fontSize: 'clamp(1.15rem, 2.2vw, 1.4rem)',
                  fontStyle: 'italic',
                  color: PALETTE.ink,
                  letterSpacing: '-0.005em',
                  marginBottom: '0.6rem',
                  lineHeight: 1.4,
                }}>
                  &ldquo;{t.tell}&rdquo;
                </p>
                <p style={{
                  fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
                  color: PALETTE.inkMuted, lineHeight: 1.7,
                  maxWidth: '52ch',
                }}>
                  {t.meaning}
                </p>
              </div>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.2em',
                color: PALETTE.inkFaint, textTransform: 'uppercase',
                whiteSpace: 'nowrap', paddingTop: '0.4rem',
              }}>
                {t.frequency}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </ProfileSection>
  );
}

// ----- RECURRING CONCERNS -----
function RecurringConcernsSection({ concerns }: { concerns: any[] }) {
  if (!concerns || concerns.length === 0) return null;
  return (
    <ProfileSection index={4}>
      <SectionHeader
        label="Recurring concerns"
        heading="What you keep coming back to."
        headingSize="clamp(1.6rem, 3.2vw, 2.2rem)"
        body="Across the corpus, these are the preoccupations you return to — often under different phrasings, across different weeks. A pattern is more revealing than any single conversation."
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {concerns.map((c: any, i: number) => (
          <Reveal key={i} delay={i * 0.1}>
            <div style={{
              padding: '1.4rem 0',
              borderBottom: `1px solid ${PALETTE.border}`,
              display: 'flex', alignItems: 'baseline', gap: '1.5rem',
            }}>
              <span style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
                color: PALETTE.redMuted, textTransform: 'uppercase',
                minWidth: '2rem',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.35rem)',
                  color: PALETTE.ink, lineHeight: 1.5, marginBottom: '0.4rem',
                  letterSpacing: '-0.01em',
                }}>
                  {c.concern}
                </p>
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em',
                  color: PALETTE.inkFaint, lineHeight: 1.6,
                }}>
                  {c.evidence}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </ProfileSection>
  );
}

// ----- UNINTENTIONAL DISCLOSURES -----
function UnintentionalDisclosuresSection({ disclosures }: { disclosures: any[] }) {
  if (!disclosures || disclosures.length === 0) return null;
  return (
    <ProfileSection index={5}>
      <SectionHeader
        label="Unintentional disclosures"
        heading="What you gave away without meaning to."
        headingSize="clamp(1.6rem, 3.2vw, 2.2rem)"
        body="Every disclosure below was incidental. You were asking a question about something else — and the answer you needed required you to mention a location, a salary, a medication, a date, a relationship. You did not choose to disclose any of this. You disclosed it anyway."
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {disclosures.map((d: any, i: number) => (
          <Reveal key={i} delay={i * 0.08}>
            <div style={{
              padding: '1.6rem 0',
              borderBottom: `1px solid ${PALETTE.border}`,
            }}>
              <p style={{
                fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
                color: PALETTE.red, textTransform: 'uppercase', marginBottom: '0.8rem',
              }}>
                Disclosure {String(i + 1).padStart(2, '0')}
              </p>
              <p style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2.2vw, 1.45rem)',
                color: PALETTE.ink, lineHeight: 1.5, marginBottom: '1rem',
                letterSpacing: '-0.01em',
              }}>
                {d.disclosure}
              </p>
              <div style={{
                borderLeft: `2px solid ${PALETTE.border}`,
                paddingLeft: '1rem',
              }}>
                <p style={{
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.18em',
                  color: PALETTE.inkFaint, textTransform: 'uppercase', marginBottom: '0.3rem',
                }}>
                  Via
                </p>
                <p style={{
                  fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
                  color: PALETTE.inkMuted, lineHeight: 1.65,
                  maxWidth: '55ch',
                }}>
                  {d.via}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </ProfileSection>
  );
}

// ----- PREDICTED BEHAVIOURS -----
function PredictedBehavioursSection({ behaviours }: { behaviours: any[] }) {
  if (!behaviours || behaviours.length === 0) return null;
  const likelihoodColor = (l: string) => l === 'High' ? PALETTE.red : l === 'Medium' ? PALETTE.amber : PALETTE.inkMuted;

  return (
    <ProfileSection index={6}>
      <SectionHeader
        label="Predicted next behaviours"
        heading="What the model thinks you will do next."
        headingSize="clamp(1.6rem, 3.2vw, 2.2rem)"
        body="These are not guesses. They are the forward projections a pattern-matching system derives from your recent trajectory. This is the kind of inference ad networks, insurers, and recruitment algorithms run continuously on behavioural data."
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {behaviours.map((b: any, i: number) => {
          const lc = likelihoodColor(b.likelihood);
          return (
            <Reveal key={i} delay={i * 0.08}>
              <div style={{
                padding: '1.5rem 0',
                borderBottom: `1px solid ${PALETTE.border}`,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '2rem',
                alignItems: 'start',
              }}>
                <div>
                  <p style={{
                    fontFamily: TYPE.serif, fontSize: 'clamp(1.15rem, 2vw, 1.35rem)',
                    color: PALETTE.ink, lineHeight: 1.45, letterSpacing: '-0.01em',
                    marginBottom: '0.6rem',
                  }}>
                    {b.behaviour}
                  </p>
                  <p style={{
                    fontFamily: TYPE.mono, fontSize: '11px', letterSpacing: '0.08em',
                    color: PALETTE.inkFaint, lineHeight: 1.65,
                  }}>
                    {b.evidence}
                  </p>
                </div>
                <span style={{
                  fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.22em',
                  color: lc, textTransform: 'uppercase',
                  padding: '3px 8px', border: `1px solid ${lc}40`,
                  whiteSpace: 'nowrap', paddingTop: '3px',
                }}>
                  {b.likelihood}
                </span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </ProfileSection>
  );
}



// ── EXTRACTION WAFFLE ─────────────────────────────────────────────────────
// Pudding principle: one unit = one data point.
// A proportional grid of coloured squares showing what was pulled from the corpus.
// The shape of what was taken — before you read the detail of each category.

const WAFFLE_COLORS: Record<string, string> = {
  'Names identified':        'rgba(255,107,107,0.82)',  // coral
  'Locations mapped':         'rgba(255,183,77,0.82)',   // gold
  'Health disclosures':       'rgba(255,100,72,0.82)',   // ember
  'Life events':              'rgba(187,134,252,0.82)',  // violet
  'Recurring themes':         'rgba(78,205,196,0.82)',   // teal
  'Relationships':            'rgba(107,203,119,0.82)',  // sage
  'Sensitive disclosures':    'rgba(190,40,30,0.75)',    // red
};

function ExtractionWaffle({ results }: { results: AnalysisResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-8%' });
  const [hovered, setHovered] = useState<string | null>(null);

  const healthTopics = results.findings.sensitiveTopics?.filter(
    t => ['mental_health','anxiety','depression','therapy','medical','health'].some(k => (t.category||''). toLowerCase().includes(k))
  ).length || 0;
  const otherSensitive = (results.findings.sensitiveTopics?.length || 0) - healthTopics;

  const categories: { label: string; count: number }[] = [
    { label: 'Sensitive disclosures', count: healthTopics + otherSensitive },
    { label: 'Recurring themes',      count: results.findings.repetitiveThemes?.length || 0 },
    { label: 'Life events',           count: results.lifeEvents?.length || 0 },
    { label: 'Names identified',      count: results.findings.personalInfo?.names?.length || 0 },
    { label: 'Locations mapped',      count: results.findings.personalInfo?.locations?.length || 0 },
    { label: 'Relationships',         count: (results.findings.personalInfo?.relationships?.length || 0) },
  ].filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  const total = categories.reduce((s, c) => s + c.count, 0);
  if (total === 0) return null;

  // Build array of cells capped at 120 for visual cleanliness
  const CAP = 120;
  const scale = total > CAP ? CAP / total : 1;
  const cells: { cat: string; color: string }[] = [];
  for (const cat of categories) {
    const n = Math.max(1, Math.round(cat.count * scale));
    for (let i = 0; i < n; i++) cells.push({ cat: cat.label, color: WAFFLE_COLORS[cat.label] || PALETTE.red });
  }

  return (
    <div ref={ref} style={{ padding: 'clamp(2.5rem, 6vw, 4rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        What was extracted
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkFaint, lineHeight: 1.6, maxWidth: 480, marginBottom: '2rem' }}>
        Each square is one data point pulled from your conversations.
        {total > CAP && <> (Showing {CAP} of {total} items at scale.)</>}
      </p>

      {/* The grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '3px',
          maxWidth: 480,
          marginBottom: '1.75rem',
        }}
      >
        {cells.map((cell, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.01 + i * 0.008, duration: 0.25, type: 'spring', stiffness: 400 }}
            onMouseEnter={() => setHovered(cell.cat)}
            onMouseLeave={() => setHovered(null)}
            style={{
              aspectRatio: '1',
              background: hovered && hovered !== cell.cat ? cell.color.replace(/[0-9.]+\)$/, '0.2)') : cell.color,
              borderRadius: '2px',
              cursor: 'default',
              transition: 'background 0.2s',
              boxShadow: hovered === cell.cat ? `0 0 0 1px ${cell.color}` : 'none',
            }}
          />
        ))}
      </motion.div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 2rem' }}>
        {categories.map(cat => (
          <div
            key={cat.label}
            onMouseEnter={() => setHovered(cat.label)}
            onMouseLeave={() => setHovered(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default' }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '2px',
              background: WAFFLE_COLORS[cat.label] || PALETTE.red,
              opacity: hovered && hovered !== cat.label ? 0.3 : 1,
              transition: 'opacity 0.2s',
            }} />
            <span style={{
              fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.1em',
              color: hovered === cat.label ? PALETTE.ink : PALETTE.inkFaint,
              textTransform: 'uppercase', transition: 'color 0.2s',
            }}>
              {cat.label} — {cat.count}
            </span>
          </div>
        ))}
      </div>

      {hovered && (
        <motion.p
          key={hovered}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: TYPE.serif, fontSize: '1rem', color: PALETTE.inkMuted, marginTop: '1rem', fontStyle: 'italic' }}
        >
          {hovered} — {categories.find(c => c.label === hovered)?.count} instances extracted from your conversations.
        </motion.p>
      )}
    </div>
  );
}

export default function ProfilePage({ results, setPage }: { results: AnalysisResult; setPage?: (p: any) => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  const attrs = useMemo(() => generatePredictedAttributes(results), [results]);
  const [expandedAttr, setExpandedAttr] = useState<number | null>(null);

  const totalMsgs = results.totalUserMessages || results.stats?.userMessages || 0;
  const segmentId = 'USR-' + String(results.privacyScore).padStart(3, '0') + '-' + String(totalMsgs % 10000).padStart(4, '0');

  const catColors: Record<string, string> = {
    demographic: PALETTE.inkMuted,
    psychographic: PALETTE.red + '90',
    behavioural: PALETTE.amber,
    risk: PALETTE.red,
  };

  return (
    <div className="dash-page-inner" style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>

      {/* Classification geometry — top right */}
      <svg className="deco-svg" style={{
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
            fill="rgba(190,40,30,0.2)" letterSpacing="2" textAnchor="start">REF:{segmentId.slice(-6)}</text>
        </g>
      </svg>

      {/* ================================================================
          OPENING — full-width statement that sets up everything below
          ================================================================ */}
      <div ref={heroRef} style={{ padding: 'clamp(3rem, 8vw, 5rem) clamp(2rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}` }}>
        {/* Chapter rule */}
        <div style={{ height: '1px', background: PALETTE.ink, opacity: 0.10, marginBottom: 'clamp(2rem, 5vw, 3rem)' }} />
        <ActLabel roman="II" title="The Inference" pageLabel="02 / Personal Profile" />
        <ThreadSentence>Not what you said. What the pattern of saying it reveals.</ThreadSentence>
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


      <ExtractionWaffle results={results} />

      {/* ================================================================
          SYNTHESIS — intelligence briefing sections (00–07)
          ================================================================ */}
      {results.synthesis ? (
        <>
          <CharacterSummarySection summary={results.synthesis.characterSummary} />
          <CoreBeliefsSection beliefs={results.synthesis.inferredCoreBeliefs || []} />
          <DemographicPredictionsSection predictions={results.synthesis.demographicPredictions as any} />
          <VerbalTellsSection tells={results.synthesis.verbalTells} />
          <RecurringConcernsSection concerns={results.synthesis.recurringConcerns} />
          <UnintentionalDisclosuresSection disclosures={results.synthesis.unintentionalDisclosures} />
          <PredictedBehavioursSection behaviours={results.synthesis.predictedBehaviours} />
        </>
      ) : (
        <div style={{
          padding: 'clamp(2rem, 5vw, 3.5rem) 0',
          borderTop: `1px solid ${PALETTE.border}`,
          marginBottom: 'clamp(2rem, 5vw, 3.5rem)',
        }}>
          <p style={{
            fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.3em',
            color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.75rem',
          }}>AI synthesis — not available</p>
          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
            color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 540,
          }}>
            The AI enrichment pipeline did not run on this dataset — either the conversations were too short, or the analysis was completed without the synthesis step. The inferred attributes below are derived from pattern matching alone.
          </p>
        </div>
      )}

      {/* ================================================================
          INFERRED ATTRIBUTES (08) — regex-derived fallback set
          ================================================================ */}
      <ProfileSection index={8}>
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
                  whileHover={{ backgroundColor: 'rgba(26,24,20,0.035)' }}
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
          SOCIAL GRAPH — the people you mentioned without their consent
          ================================================================ */}
      <ProfileSection index={10}>
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
        <ProfileSection index={11}>
          <SectionHeader
            label="Behavioural signature"
            heading="Your fingerprint."
            headingSize="clamp(1.6rem, 3.2vw, 2.4rem)"
            body="When you write, how you write, and what you write about — combined, this shape is unique to you. It can be used to identify you across platforms without a name."
          />
          <BehaviouralFingerprint hourDist={results.hourDistribution} typeBreakdown={results.typeBreakdown} />
        </ProfileSection>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ACT TRANSITION — to Risk
          ════════════════════════════════════════════════════════════════════ */}
      {setPage && (
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          padding: 'clamp(2rem, 5vw, 4rem) clamp(2rem, 5vw, 4rem)',
          borderTop: `1px solid ${PALETTE.border}`,
        }}>
          <p style={{
            fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
            color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: 540,
            marginBottom: '1.5rem', fontStyle: 'italic',
          }}>
            The profile is what the record reveals. Act II continues: how your data is priced, then what the profile enables.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPage('commercial-profile')}
              style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                letterSpacing: '-0.01em', color: PALETTE.ink,
                background: 'none', border: `1px solid ${PALETTE.border}`,
                padding: 'clamp(0.85rem, 2vw, 1.25rem) clamp(1.25rem, 2.5vw, 2rem)',
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = PALETTE.borderHover; (e.currentTarget as HTMLElement).style.background = PALETTE.bgPanel; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = PALETTE.border; (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.35rem' }}>ACT II / 03</span>
              What you're worth →
            </button>
            <button
              onClick={() => setPage('risk')}
              style={{
                fontFamily: TYPE.serif, fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                letterSpacing: '-0.01em', color: PALETTE.ink,
                background: 'none', border: `1px solid ${PALETTE.border}`,
                padding: 'clamp(0.85rem, 2vw, 1.25rem) clamp(1.25rem, 2.5vw, 2rem)',
                cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = PALETTE.borderHover; (e.currentTarget as HTMLElement).style.background = PALETTE.bgPanel; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = PALETTE.border; (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <span style={{ display: 'block', fontFamily: TYPE.mono, fontSize: '9px', letterSpacing: '0.25em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.35rem' }}>ACT II / Continues</span>
              What it enables →
            </button>
          </div>
        </div>
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
    <div style={{ padding: 'clamp(2.5rem, 8vw, 6rem) clamp(1.25rem, 5vw, 4rem)', borderBottom: `1px solid ${PALETTE.border}`, position: 'relative' }}>
      {/* Ghost section number */}
      {index !== undefined && (
        <div className="section-ghost-num" style={{
          position: 'absolute',
          top: 'clamp(1.5rem, 5vw, 4rem)',
          right: 'clamp(1rem, 5vw, 4rem)',
          fontFamily: "'EB Garamond', serif",
          fontSize: 'clamp(60px, 12vw, 140px)',
          fontWeight: 400,
          color: 'rgba(26,24,20,0.06)',
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
      <p style={{ fontFamily: TYPE.mono, fontSize: '10px', letterSpacing: '0.3em', color: PALETTE.redMuted, textTransform: 'uppercase', marginBottom: '0.8rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: headingSize, fontWeight: 400, color: PALETTE.ink, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1.2rem' }}>
        {heading}
      </p>
      <p style={{ fontFamily: TYPE.serif, fontSize: '1.1rem', color: PALETTE.inkMuted, lineHeight: 1.75, maxWidth: '58ch' }}>
        {body}
      </p>
    </div>
  );
}
