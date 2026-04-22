// ============================================================================
// aiEnrichment.ts — rebuilt
// ============================================================================

import type { DeepAnalysis, ScoredMessage } from './deepParser';

export interface MessageEnrichment {
  id: number;
  is_personal: boolean;
  is_template_or_script: boolean;
  confessional_score: number;
  emotional_intensity: number;
  named_people: { name: string; relationship: string | null }[];
  life_events: string[];
  sensitive_topics: string[];
  most_revealing_excerpt: string;
  topic: string;
}

export interface EnrichmentProgress {
  stage: 'selecting' | 'enriching' | 'merging' | 'done' | 'failed';
  batchesDone: number;
  batchesTotal: number;
  messagesEnriched: number;
  error?: string;
}

export interface ScoreBreakdownEntry {
  label: string;
  contribution: number;
  detail: string;
  category: 'life_events' | 'commercial' | 'dependency' | 'confessional' | 'names' | 'volume';
}

const BATCH_SIZE = 25;
const MAX_CANDIDATES = 300;
const MAX_PARALLEL_BATCHES = 3;

// Score component ceilings — sum to 100
const SCORE_CEILINGS = {
  life_events:   30,
  commercial:    22,
  dependency:    18,
  confessional:  18,
  names:          7,
  volume:         5,
} as const;

// ============================================================================
// TEMPLATE DETECTION — structural pre-filter before AI
// ============================================================================

const TEMPLATE_PATTERNS = [
  /cold\s*call/i, /sales\s*script/i, /objection\s*handl/i,
  /follow[\s-]*up\s*sequence/i, /email\s*template/i,
  /linkedin\s*message/i, /appointment\s*set/i, /lead\s*gen/i,
  /close\s*the\s*deal/i, /discovery\s*call/i, /cold\s*email/i,
  /pitch\s*deck/i, /elevator\s*pitch/i, /outreach\s*sequence/i,
  /jordan\s*platten/i, /cadence/i, /crm\s*follow/i,
  /respond\s*to\s*objections/i, /value\s*proposition/i,
  /you\s*are\s*an?\s+(ai|assistant|expert|helpful|professional)/i,
  /act\s*as\s*(a|an)\s+/i, /you\s*are\s*a\s+specialized/i,
  /\[your\s*(name|company|product)\]/i, /\{first_?name\}/i,
];

function isStructuralTemplate(text: string): boolean {
  // Pattern match first — fast path
  if (TEMPLATE_PATTERNS.some(re => re.test(text))) return true;

  const lines = text.split('\n').filter(l => l.trim());
  const n = Math.max(lines.length, 1);

  // Heavy markdown structure = template
  const headings = lines.filter(l => /^#{1,6}\s+\S/.test(l.trim())).length;
  if (headings >= 4) return true;
  if (headings >= 2 && n >= 8 && headings / n > 0.18) return true;

  // Dense bold labels
  const boldLabels = (text.match(/\*\*[^*\n]{1,60}:\*\*/g) || []).length;
  if (boldLabels >= 3) return true;

  // Step-by-step numbered structure
  const numbered = lines.filter(l => /^\s*\d+[.)]\s+\S/.test(l)).length;
  if (numbered >= 5 && numbered / n > 0.35) return true;

  // ALL CAPS title line
  const firstLine = lines[0]?.trim().replace(/[#*_`-]/g, '').trim() || '';
  if (firstLine.length >= 8 && firstLine.length <= 100) {
    const letters = firstLine.replace(/[^a-zA-Z]/g, '');
    const uppers = firstLine.replace(/[^A-Z]/g, '');
    if (letters.length >= 6 && uppers.length / letters.length >= 0.75) return true;
  }

  return false;
}

// ============================================================================
// CANDIDATE SELECTION
// ============================================================================

const FIRST_PERSON_RE = /\b(i|i'm|i've|i'd|i'll|my|me|myself|i feel|i think|i know|i need|i want|i'm)\b/gi;
const PERSONAL_QUESTION_RE = /\b(should i|what would you do|am i wrong|do you think i|what should i|is it okay if i|am i a|am i the|am i being|do i deserve|why do i|how do i deal|i don't know what to do|i feel like i|i can't stop)\b/i;
const EMOTIONAL_RE = /\b(scared|terrified|ashamed|guilty|lonely|hopeless|desperate|broken|hurt|crying|overwhelmed|anxious|depressed|afraid|worthless|empty|numb|devastated|betrayed|furious|heartbroken|grieving|panicking|struggling|exhausted|trapped|humiliated|humiliating|embarrassed|regret|shame|helpless|miserable|suicidal|self-harm|cutting|relapse|triggered|dissociat|trauma|abused|abuse|addict|dependen|withdraw|sober|recovery|overdose|eating disorder|binge|purge|starv|restrict)\b/i;
const SENSITIVE_RE = /\b(therapy|therapist|counsell|psychiatr|antidepressant|medication|mental health|diagnosis|disorder|anxiety|panic attack|ADHD|bipolar|OCD|PTSD|affair|cheating|infidel|secret|HIV|STI|pregnant|abortion|miscarriage|bankrupt|debt|evict|homeless|fired|laid off|arrest|court|criminal|probation|undocumented|immigration)\b/i;

interface Candidate {
  index: number;
  message: ScoredMessage;
  priority: number;
}

function selectCandidates(messages: ScoredMessage[]): Candidate[] {
  const candidates: Candidate[] = [];

  messages.forEach((m, index) => {
    // Hard rejections
    if (m.wordCount < 4) return;
    if (isStructuralTemplate(m.text)) return;

    // Code blocks — reject ONLY if >70% of content is code
    const codeBlocks = m.text.match(/```[\s\S]*?```/g) || [];
    const codeChars = codeBlocks.reduce((s, b) => s + b.length, 0);
    if (codeChars / m.text.length > 0.7) return;

    // Pure system prompts
    if (/^(you are|system:|role:|act as|ignore previous|forget everything)/i.test(m.text.trim())) return;

    let priority = 0;

    // Length — more content = more signal
    if (m.wordCount >= 15) priority += 1;
    if (m.wordCount >= 40) priority += 2;
    if (m.wordCount >= 100) priority += 3;
    if (m.wordCount >= 250) priority += 2;

    // Existing parser scores
    if (m.confessionalScore >= 2) priority += m.confessionalScore * 1.2;
    if (m.anxietyScore >= 3) priority += m.anxietyScore;
    if (m.intimacyScore >= 4) priority += m.intimacyScore * 0.8;

    // Late night — highest signal density
    if (m.hour >= 0 && m.hour <= 4) priority += 5;
    if (m.hour >= 22) priority += 2;

    // First person density
    const ipCount = (m.text.match(FIRST_PERSON_RE) || []).length;
    if (ipCount >= 5) priority += 2;
    if (ipCount >= 12) priority += 3;

    // Emotional language
    if (EMOTIONAL_RE.test(m.text)) priority += 7;

    // Sensitive topic language
    if (SENSITIVE_RE.test(m.text)) priority += 5;

    // Personal questions directed at AI
    if (PERSONAL_QUESTION_RE.test(m.text)) priority += 4;

    // Regex already flagged life events
    if (m.detectedSegments.length > 0) priority += 3;

    // Only queue messages with some signal
    if (priority >= 2) {
      candidates.push({ index, message: m, priority });
    }
  });

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, MAX_CANDIDATES);
}

// ============================================================================
// BATCH EXECUTION
// ============================================================================

async function enrichBatch(batch: Candidate[]): Promise<MessageEnrichment[]> {
  const response = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: batch.map(c => ({
        id: c.index,
        text: c.message.text,
        hour: c.message.hour,
        timestamp: c.message.timestamp,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Batch failed: ${err}`);
  }

  const data = await response.json();
  return (data.enrichments as MessageEnrichment[]) || [];
}

async function runBatchesWithConcurrency(
  batches: Candidate[][],
  onBatchDone: () => void
): Promise<MessageEnrichment[]> {
  const results: MessageEnrichment[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < batches.length) {
      const myIdx = cursor++;
      if (myIdx >= batches.length) return;
      try {
        const enrichments = await enrichBatch(batches[myIdx]);
        results.push(...enrichments);
      } catch (err) {
        console.error(`Batch ${myIdx} failed:`, err);
      }
      onBatchDone();
    }
  }

  const workerCount = Math.min(MAX_PARALLEL_BATCHES, batches.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

// ============================================================================
// NAME HANDLING
// ============================================================================

const NAME_PARTICLES = new Set([
  'de', 'van', 'der', 'den', 'von', 'al', 'el', 'bin', 'ibn', 'la', 'le',
  'da', 'do', 'dos', 'du', 'di', 'af', 'av', 'ter', 'te', 'ten',
]);

function titleCaseName(raw: string): string {
  return raw.trim().split(/\s+/).map((token, i) => {
    const cleaned = token.replace(/[^\p{L}'-]/gu, '');
    if (!cleaned) return '';
    const lower = cleaned.toLowerCase();
    if (i > 0 && NAME_PARTICLES.has(lower)) return lower;
    if (lower.includes('-')) return lower.split('-').map(p => p ? p[0].toUpperCase() + p.slice(1) : '').join('-');
    if (lower.includes("'")) return lower.split("'").map((p, idx) => (!p ? '' : idx === 0 || p.length > 1 ? p[0].toUpperCase() + p.slice(1) : p.toUpperCase())).join("'");
    return lower[0].toUpperCase() + lower.slice(1);
  }).filter(Boolean).join(' ');
}

function stripRelationship(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

const RELATIONSHIP_RE = /\b(my|our)\s+(girlfriend|boyfriend|wife|husband|partner|ex|fiancée?|mum|mom|mother|dad|father|brother|sister|son|daughter|boss|manager|coworker|colleague|friend|mate|therapist|doctor)\b/i;

interface NameAggregate {
  canonical: string;
  mentions: number;
  relationship: string | null;
  hasRelationshipContext: boolean;
}

function dedupeNames(raw: Array<{ name: string; relationship: string | null; sourceText: string }>): NameAggregate[] {
  const normalised = raw
    .filter(e => e.name && e.name.length >= 2)
    .map(e => {
      const stripped = stripRelationship(e.name);
      const display = titleCaseName(stripped);
      if (!display || /^[A-Z]{1,3}$/.test(display) || /^\d+$/.test(display)) return null;
      return { key: display.toLowerCase(), display, relationship: e.relationship, sourceText: e.sourceText };
    })
    .filter(Boolean) as Array<{ key: string; display: string; relationship: string | null; sourceText: string }>;

  const sorted = [...normalised].sort((a, b) => b.key.length - a.key.length);
  const aggregates = new Map<string, NameAggregate>();

  for (const entry of sorted) {
    let matchedKey: string | null = null;
    for (const [existingKey] of aggregates) {
      const eWords = entry.key.split(/\s+/);
      const xWords = existingKey.split(/\s+/);
      const [shorter, longer] = eWords.length <= xWords.length ? [eWords, xWords] : [xWords, eWords];
      if (shorter.every(w => longer.includes(w))) { matchedKey = existingKey; break; }
    }

    if (matchedKey) {
      const agg = aggregates.get(matchedKey)!;
      agg.mentions += 1;
      if (!agg.relationship && entry.relationship) agg.relationship = entry.relationship;
      if (RELATIONSHIP_RE.test(entry.sourceText)) agg.hasRelationshipContext = true;
    } else {
      aggregates.set(entry.key, {
        canonical: entry.display,
        mentions: 1,
        relationship: entry.relationship,
        hasRelationshipContext: RELATIONSHIP_RE.test(entry.sourceText),
      });
    }
  }

  return Array.from(aggregates.values());
}

// ============================================================================
// LIFE EVENT LABELS
// ============================================================================

const EVENT_LABELS: Record<string, { label: string; severity: 'low' | 'medium' | 'high' }> = {
  job_loss:            { label: 'Possible job loss',        severity: 'high'   },
  job_search:          { label: 'Job-seeking period',       severity: 'medium' },
  relationship_end:    { label: 'Relationship breakdown',   severity: 'high'   },
  relationship_start:  { label: 'New relationship',         severity: 'low'    },
  financial_distress:  { label: 'Financial distress',       severity: 'high'   },
  mental_health:       { label: 'Mental health disclosure', severity: 'high'   },
  health_concern:      { label: 'Health concern',           severity: 'medium' },
  bereavement:         { label: 'Bereavement or loss',      severity: 'high'   },
  identity_crisis:     { label: 'Identity questioning',     severity: 'medium' },
  moving_home:         { label: 'Relocating',               severity: 'medium' },
  new_baby:            { label: 'New baby',                 severity: 'medium' },
  wedding:             { label: 'Wedding or engagement',    severity: 'low'    },
  legal_issue:         { label: 'Legal issue',              severity: 'high'   },
};

// ============================================================================
// SCORING — sublinear curves, realistic distribution 40-65
// ============================================================================

function scoreLifeEvents(events: Array<{ severity: string }>): number {
  const high   = events.filter(e => e.severity === 'high').length;
  const medium = events.filter(e => e.severity === 'medium').length;
  const low    = events.filter(e => e.severity === 'low').length;
  const raw = Math.sqrt(high) * 14 + Math.sqrt(medium) * 6 + Math.sqrt(low) * 2.5;
  return Math.min(SCORE_CEILINGS.life_events, Math.round(raw));
}

function scoreCommercial(segments: Array<{ confidence: number }>): number {
  const weighted = segments.reduce((s, seg) => s + Math.pow(seg.confidence / 100, 1.4) * 8, 0);
  return Math.min(SCORE_CEILINGS.commercial, Math.round(weighted));
}

function scoreDependency(score: number): number {
  return Math.min(SCORE_CEILINGS.dependency, Math.round((score / 100) * SCORE_CEILINGS.dependency));
}

function scoreConfessional(count: number, avgScore: number): number {
  if (count === 0) return 0;
  // count-based log curve + quality bonus from avg confessional score
  const countPart = Math.log2(count + 1) * 4.5;
  const qualityBonus = Math.max(0, (avgScore - 5) * 0.8);
  return Math.min(SCORE_CEILINGS.confessional, Math.round(countPart + qualityBonus));
}

function scoreNames(count: number): number {
  return Math.min(SCORE_CEILINGS.names, count);
}

function scoreVolume(total: number): number {
  if (total < 200) return 0;
  if (total < 800) return 1;
  if (total < 2000) return 2;
  if (total < 5000) return 3;
  if (total < 10000) return 4;
  return SCORE_CEILINGS.volume;
}

// ============================================================================
// MERGE
// ============================================================================

function mergeEnrichments(analysis: DeepAnalysis, enrichments: MessageEnrichment[]): DeepAnalysis {
  const enrichmentMap = new Map<number, MessageEnrichment>();
  for (const e of enrichments) enrichmentMap.set(e.id, e);

  const templateIds = new Set<number>(
    enrichments.filter(e => e.is_template_or_script).map(e => e.id)
  );

  // Rebuild messages with AI-enhanced scores
  const enrichedMessages = analysis.messages.map((m, idx) => {
    const e = enrichmentMap.get(idx);
    if (!e) return m;
    if (e.is_template_or_script) {
      return { ...m, confessionalScore: 0, anxietyScore: 0, intimacyScore: 0, messageType: 'factual' as const };
    }
    return {
      ...m,
      confessionalScore: Math.max(m.confessionalScore, e.confessional_score),
      anxietyScore: Math.max(m.anxietyScore, e.is_personal ? e.emotional_intensity : 0),
      detectedSegments: Array.from(new Set([...m.detectedSegments, ...e.life_events])),
    };
  });

  // Purge templates from regex-built juiciestMoments
  const purgedRegex = analysis.juiciestMoments.filter(moment => {
    for (const id of templateIds) {
      const msg = analysis.messages[id];
      if (!msg) continue;
      const prefix = msg.text.substring(0, 60).replace(/\s+/g, ' ').trim();
      const mPrefix = (moment.excerpt || '').substring(0, 60).replace(/\s+/g, ' ').trim();
      if (prefix && mPrefix && (prefix === mPrefix || prefix.startsWith(mPrefix) || mPrefix.startsWith(prefix))) return false;
    }
    return true;
  });

  // Names
  const rawNames: Array<{ name: string; relationship: string | null; sourceText: string }> = [];
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script || !e.named_people) continue;
    const src = analysis.messages[e.id]?.text || '';
    for (const p of e.named_people) {
      if (p.name && p.name.length >= 2) rawNames.push({ name: p.name, relationship: p.relationship, sourceText: src });
    }
  }

  const nameAggregates = dedupeNames(rawNames);
  const aiNames = nameAggregates
    .filter(a => a.mentions >= 2 || a.hasRelationshipContext)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 12)
    .map(a => ({ name: a.canonical, mentions: a.mentions, relationship: a.relationship || undefined, contexts: [] }));

  // Sensitive topics — merge AI-extracted with regex findings
  const aiSensitiveTopics: Array<{ category: string; excerpt: string; timestamp: string }> = [];
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script) continue;
    const msg = analysis.messages[e.id];
    if (!msg) continue;
    for (const topic of (e.sensitive_topics || [])) {
      aiSensitiveTopics.push({
        category: topic,
        excerpt: e.most_revealing_excerpt || msg.text.substring(0, 150),
        timestamp: new Date(msg.timestamp * 1000).toISOString(),
      });
    }
  }
  // Merge with existing regex findings, dedup by category
  const existingCategories = new Set(analysis.findings.sensitiveTopics.map(t => t.category));
  const newSensitiveTopics = [
    ...analysis.findings.sensitiveTopics,
    ...aiSensitiveTopics.filter(t => !existingCategories.has(t.category)),
  ];

  // Juiciest moments — prefer AI's most_revealing_excerpt
  const personalEnrichments = enrichments
    .filter(e => e.is_personal && !e.is_template_or_script)
    .map(e => ({ e, msg: analysis.messages[e.id] }))
    .filter(x => x.msg);

  const aiJuiciest = personalEnrichments
    .map(({ e, msg }) => {
      const base = e.confessional_score * 1.6 + e.emotional_intensity * 1.0;
      const lateNight = (msg.hour >= 0 && msg.hour <= 4) ? 3 : msg.hour >= 22 ? 1.5 : 0;
      const lengthBoost = Math.min(3, Math.log2(Math.max(msg.wordCount, 10) / 10));
      const sensitiveBoost = (e.sensitive_topics || []).length * 1.5;
      return { e, msg, score: base + lateNight + lengthBoost + sensitiveBoost };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ e, msg }) => ({
      timestamp: new Date(msg.timestamp * 1000).toISOString(),
      // Use AI-identified most revealing excerpt if available, otherwise first 300 chars
      excerpt: e.most_revealing_excerpt && e.most_revealing_excerpt.length > 20
        ? e.most_revealing_excerpt
        : msg.text.substring(0, 300),
      juiceScore: Math.round((e.confessional_score + e.emotional_intensity) / 2),
      reason: [
        e.confessional_score >= 7 ? 'confession' : null,
        e.emotional_intensity >= 7 ? 'emotional distress' : null,
        (msg.hour >= 0 && msg.hour <= 4) ? 'late night' : null,
        (e.sensitive_topics || []).length > 0 ? e.sensitive_topics[0] : null,
        e.topic,
      ].filter(Boolean).join(', '),
    }));

  // Life events — aggregate by type, require 1+ occurrence
  const eventBuckets = new Map<string, ScoredMessage[]>();
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script) continue;
    const msg = analysis.messages[e.id];
    if (!msg) continue;
    for (const ev of (e.life_events || [])) {
      const bucket = eventBuckets.get(ev) || [];
      bucket.push(msg);
      eventBuckets.set(ev, bucket);
    }
  }

  const aiLifeEvents = Array.from(eventBuckets.entries()).map(([type, msgs]) => {
    const cfg = EVENT_LABELS[type] || { label: type, severity: 'medium' as const };
    const sorted = [...msgs].sort((a, b) => a.timestamp - b.timestamp);
    const median = sorted[Math.floor(sorted.length / 2)];
    return {
      type,
      label: cfg.label,
      approximateDate: new Date(median.timestamp * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      evidence: sorted.slice(0, 3).map(m => `"${m.text.substring(0, 80)}..."`),
      severity: cfg.severity,
      count: msgs.length,
    };
  }).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));

  // Type breakdown
  const typeBreakdown = enrichedMessages.reduce((acc, m) => {
    acc[m.messageType] = (acc[m.messageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Scoring
  const lifeEventsContribution = scoreLifeEvents(aiLifeEvents.length > 0 ? aiLifeEvents : analysis.lifeEvents);
  const commercialContribution = scoreCommercial(analysis.commercialProfile.segments);
  const dependencyContribution = scoreDependency(analysis.dependency.dependencyScore);

  const confessionals = enrichments.filter(e => e.is_personal && !e.is_template_or_script && e.confessional_score >= 4);
  const avgConfScore = confessionals.length > 0
    ? confessionals.reduce((s, e) => s + e.confessional_score, 0) / confessionals.length
    : 0;
  const confessionalContribution = scoreConfessional(confessionals.length, avgConfScore);

  const namesContribution = scoreNames(aiNames.length);
  const volumeContribution = scoreVolume(analysis.totalUserMessages);

  const newScore = Math.max(0, Math.min(100,
    lifeEventsContribution + commercialContribution + dependencyContribution +
    confessionalContribution + namesContribution + volumeContribution
  ));

  const scoreBreakdown: ScoreBreakdownEntry[] = [
    {
      label: 'Life events disclosed',
      contribution: lifeEventsContribution,
      category: 'life_events',
      detail: aiLifeEvents.length === 0
        ? 'No significant life events detected.'
        : `${aiLifeEvents.length} event${aiLifeEvents.length === 1 ? '' : 's'}: ${aiLifeEvents.filter(e => e.severity === 'high').length} high-severity.`,
    },
    {
      label: 'Commercial profile strength',
      contribution: commercialContribution,
      category: 'commercial',
      detail: analysis.commercialProfile.segments.length === 0
        ? 'No targeting segments inferred.'
        : `${analysis.commercialProfile.segments.length} segments inferred.`,
    },
    {
      label: 'AI dependency pattern',
      contribution: dependencyContribution,
      category: 'dependency',
      detail: `Dependency score ${Math.round(analysis.dependency.dependencyScore)}/100.`,
    },
    {
      label: 'Confessional disclosures',
      contribution: confessionalContribution,
      category: 'confessional',
      detail: confessionals.length === 0
        ? 'No confessional messages identified.'
        : `${confessionals.length} confessional message${confessionals.length === 1 ? '' : 's'} (avg score ${avgConfScore.toFixed(1)}/10).`,
    },
    {
      label: 'People named',
      contribution: namesContribution,
      category: 'names',
      detail: aiNames.length === 0
        ? 'No individuals identified.'
        : `${aiNames.length} individual${aiNames.length === 1 ? '' : 's'}: ${aiNames.slice(0, 3).map(n => n.name).join(', ')}${aiNames.length > 3 ? ' and others' : ''}.`,
    },
    {
      label: 'Message volume',
      contribution: volumeContribution,
      category: 'volume',
      detail: `${analysis.totalUserMessages.toLocaleString('en-GB')} messages over ${analysis.timespan.days} days.`,
    },
  ];

  return {
    ...analysis,
    messages: enrichedMessages,
    findings: {
      ...analysis.findings,
      personalInfo: { ...analysis.findings.personalInfo, names: aiNames },
      sensitiveTopics: newSensitiveTopics,
    },
    juiciestMoments: aiJuiciest.length > 0 ? aiJuiciest : purgedRegex,
    lifeEvents: aiLifeEvents.length > 0 ? aiLifeEvents : analysis.lifeEvents,
    typeBreakdown,
    privacyScore: newScore,
    scoreBreakdown,
  } as DeepAnalysis & { scoreBreakdown: ScoreBreakdownEntry[] };
}

// ============================================================================
// MAIN ENTRY
// ============================================================================

export async function enrichAnalysisWithAI(
  analysis: DeepAnalysis,
  onProgress?: (p: EnrichmentProgress) => void
): Promise<DeepAnalysis> {
  onProgress?.({ stage: 'selecting', batchesDone: 0, batchesTotal: 0, messagesEnriched: 0 });

  const candidates = selectCandidates(analysis.messages);

  if (candidates.length === 0) {
    onProgress?.({ stage: 'done', batchesDone: 0, batchesTotal: 0, messagesEnriched: 0 });
    return analysis;
  }

  const batches: Candidate[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE));
  }

  let batchesDone = 0;
  onProgress?.({ stage: 'enriching', batchesDone: 0, batchesTotal: batches.length, messagesEnriched: 0 });

  try {
    const enrichments = await runBatchesWithConcurrency(batches, () => {
      batchesDone++;
      onProgress?.({ stage: 'enriching', batchesDone, batchesTotal: batches.length, messagesEnriched: batchesDone * BATCH_SIZE });
    });

    onProgress?.({ stage: 'merging', batchesDone: batches.length, batchesTotal: batches.length, messagesEnriched: enrichments.length });

    const merged = mergeEnrichments(analysis, enrichments);

    onProgress?.({ stage: 'done', batchesDone: batches.length, batchesTotal: batches.length, messagesEnriched: enrichments.length });

    return merged;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI enrichment failed:', err);
    onProgress?.({ stage: 'failed', batchesDone, batchesTotal: batches.length, messagesEnriched: 0, error: message });
    return analysis;
  }
}
