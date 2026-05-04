// ============================================================================
// aiEnrichment.ts — v3
// Merges AI enrichment into the deep analysis.
// Now handles psychological_signals and inferred_beliefs.
// ============================================================================

import type { DeepAnalysis, ScoredMessage } from '@/lib/parsers/deepParser';
import { computeScoreFactors } from '@/lib/parsers/deepParser';
import { runSynthesis, type Synthesis } from './synthesis';

export interface MessageEnrichment {
  id: number;
  is_personal: boolean;
  is_template_or_script: boolean;
  confessional_score: number;
  emotional_intensity: number;
  named_people: { name: string; relationship: string | null }[];
  life_events: string[];
  sensitive_topics: string[];
  psychological_signals: string[];
  inferred_beliefs: string[];
  most_revealing_excerpt: string;
  topic: string;
}

export interface EnrichmentProgress {
  stage: 'selecting' | 'enriching' | 'merging' | 'synthesizing' | 'done' | 'failed';
  batchesDone: number;
  batchesTotal: number;
  messagesEnriched: number;
  error?: string;
}



const BATCH_SIZE = 3;
const MAX_CANDIDATES = 30;
const MAX_PARALLEL_BATCHES = 1;

// Score ceilings removed — scoring handled by computeScoreFactors in deepParser.ts

// ============================================================================
// TEMPLATE DETECTION
// ============================================================================

const TEMPLATE_PATTERNS = [
  /cold\s*call/i, /sales\s*script/i, /objection\s*handl/i,
  /follow[\s-]*up\s*sequence/i, /email\s*template/i,
  /linkedin\s*message/i, /appointment\s*set/i, /lead\s*gen/i,
  /close\s*the\s*deal/i, /discovery\s*call/i, /cold\s*email/i,
  /pitch\s*deck/i, /elevator\s*pitch/i, /outreach\s*sequence/i,
  /you\s*are\s*an?\s+(ai|assistant|expert|helpful|professional)/i,
  /act\s*as\s*(a|an)\s+/i,
  /\[your\s*(name|company|product)\]/i, /\{first_?name\}/i,
];

function isStructuralTemplate(text: string): boolean {
  if (TEMPLATE_PATTERNS.some(re => re.test(text))) return true;
  const lines = text.split('\n').filter(l => l.trim());
  const n = Math.max(lines.length, 1);

  // Markdown headings — 4+ is a structured document, not a personal message
  const headings = lines.filter(l => /^#{1,6}\s+\S/.test(l.trim())).length;
  if (headings >= 4) return true;
  if (headings >= 2 && n >= 8 && headings / n > 0.25) return true;

  // Bold labels with colons — only if very dense (document structure)
  const boldLabels = (text.match(/\*\*[^*\n]{1,60}:\*\*/g) || []).length;
  if (boldLabels >= 4) return true;

  // Numbered lists — only flag as template if:
  // 1. High count (7+ items) AND high ratio
  // 2. AND items look like instructions (not personal enumeration)
  // "5 things I need to tell my therapist" is NOT a template
  const numberedLines = lines.filter(l => /^\s*\d+[.)]\s+\S/.test(l));
  const numbered = numberedLines.length;
  if (numbered >= 7 && numbered / n > 0.5) {
    // Check if items look instructional rather than personal
    const avgItemLength = numberedLines.reduce((s, l) => s + l.length, 0) / numbered;
    const hasPersonalFirst = /\b(i |my |me |we )/.test(text.toLowerCase().substring(0, 200));
    if (avgItemLength > 40 && !hasPersonalFirst) return true;
  }

  return false;
}

// ============================================================================
// CANDIDATE SELECTION
// ============================================================================

const FIRST_PERSON_RE = /\b(i|i'm|i've|i'd|i'll|my|me|myself)\b/gi;
const PERSONAL_QUESTION_RE = /\b(should i|what would you do|am i wrong|do you think i|what should i|is it okay if i|am i a|am i being|do i deserve|why do i|how do i deal|i don't know what to do|i feel like i|i can't stop)\b/i;
const EMOTIONAL_RE = /\b(scared|terrified|ashamed|guilty|lonely|hopeless|desperate|broken|hurt|crying|overwhelmed|anxious|depressed|afraid|worthless|empty|numb|devastated|betrayed|heartbroken|grieving|panicking|struggling|exhausted|trapped|humiliated|embarrassed|regret|shame|helpless|miserable|suicidal|self-harm|relapse|triggered|trauma|abused|addiction|eating disorder|binge|restrict)\b/i;
const SENSITIVE_RE = /\b(therapy|therapist|counsell|psychiatr|antidepressant|medication|mental health|diagnosis|disorder|anxiety|panic attack|ADHD|bipolar|OCD|PTSD|affair|cheating|infidel|secret|HIV|STI|pregnant|abortion|miscarriage|bankrupt|debt|evict|homeless|fired|laid off|arrest|court|criminal|probation)\b/i;

interface Candidate {
  index: number;
  message: ScoredMessage;
  priority: number;
}

function selectCandidates(messages: ScoredMessage[]): Candidate[] {
  const candidates: Candidate[] = [];
  messages.forEach((m, index) => {
    if (m.wordCount < 4) return;
    if (isStructuralTemplate(m.text)) return;
    const codeBlocks = m.text.match(/```[\s\S]*?```/g) || [];
    const codeChars = codeBlocks.reduce((s, b) => s + b.length, 0);
    if (codeChars / m.text.length > 0.7) return;
    if (/^(you are|system:|role:|act as|ignore previous|forget everything)/i.test(m.text.trim())) return;

    let priority = 0;
    if (m.wordCount >= 15) priority += 1;
    if (m.wordCount >= 40) priority += 2;
    if (m.wordCount >= 100) priority += 3;
    if (m.wordCount >= 250) priority += 2;
    if (m.confessionalScore >= 2) priority += m.confessionalScore * 1.2;
    if (m.anxietyScore >= 3) priority += m.anxietyScore;
    if (m.intimacyScore >= 4) priority += m.intimacyScore * 0.8;
    if (m.hour >= 0 && m.hour <= 4) priority += 5;
    if (m.hour >= 22) priority += 2;
    const ipCount = (m.text.match(FIRST_PERSON_RE) || []).length;
    if (ipCount >= 5) priority += 2;
    if (ipCount >= 12) priority += 3;
    if (EMOTIONAL_RE.test(m.text)) priority += 7;
    if (SENSITIVE_RE.test(m.text)) priority += 5;
    if (PERSONAL_QUESTION_RE.test(m.text)) priority += 4;
    if (m.detectedSegments.length > 0) priority += 3;
    if (priority >= 2) candidates.push({ index, message: m, priority });
  });
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, MAX_CANDIDATES);
}

// ============================================================================
// BATCH EXECUTION
// ============================================================================

async function enrichBatch(batch: Candidate[], attempt = 0): Promise<MessageEnrichment[]> {
  try {
    const response = await fetch('/api/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: batch.map(c => ({ id: c.index, text: c.message.text, hour: c.message.hour, timestamp: c.message.timestamp })),
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      // Retry on 429 (rate limit) or 5xx server errors, up to 2 retries
      if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
        const delay = response.status === 429 ? 3000 + attempt * 2000 : 1500;
        await new Promise(r => setTimeout(r, delay));
        return enrichBatch(batch, attempt + 1);
      }
      throw new Error(`Batch failed (${response.status}): ${errText}`);
    }
    const data = await response.json();
    return (data.enrichments as MessageEnrichment[]) || [];
  } catch (err) {
    if (attempt < 2 && err instanceof TypeError) {
      // Network error — retry
      await new Promise(r => setTimeout(r, 2000));
      return enrichBatch(batch, attempt + 1);
    }
    throw err;
  }
}

async function runBatchesWithConcurrency(batches: Candidate[][], onBatchDone: () => void): Promise<MessageEnrichment[]> {
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
// NAME DEDUPLICATION
// ============================================================================

const NAME_PARTICLES = new Set(['de', 'van', 'der', 'den', 'von', 'al', 'el', 'bin', 'ibn', 'la', 'le', 'da', 'do', 'dos', 'du', 'di']);

function titleCaseName(raw: string): string {
  return raw.trim().split(/\s+/).map((token, i) => {
    const cleaned = token.replace(/[^\p{L}'-]/gu, '');
    if (!cleaned) return '';
    const lower = cleaned.toLowerCase();
    if (i > 0 && NAME_PARTICLES.has(lower)) return lower;
    return lower[0].toUpperCase() + lower.slice(1);
  }).filter(Boolean).join(' ');
}

interface NameAggregate {
  canonical: string;
  mentions: number;
  relationship: string | null;
  hasRelationshipContext: boolean;
}

const RELATIONSHIP_RE = /\b(my|our)\s+(girlfriend|boyfriend|wife|husband|partner|ex|fiancée?|mum|mom|mother|dad|father|brother|sister|son|daughter|boss|manager|friend|mate|therapist|doctor)\b/i;

function dedupeNames(raw: Array<{ name: string; relationship: string | null; sourceText: string }>): NameAggregate[] {
  const normalised = raw.filter(e => e.name && e.name.length >= 2).map(e => {
    const display = titleCaseName(e.name.replace(/\s*\([^)]*\)\s*/g, ' ').trim());
    if (!display || /^[A-Z]{1,3}$/.test(display)) return null;
    return { key: display.toLowerCase(), display, relationship: e.relationship, sourceText: e.sourceText };
  }).filter(Boolean) as Array<{ key: string; display: string; relationship: string | null; sourceText: string }>;

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
      aggregates.set(entry.key, { canonical: entry.display, mentions: 1, relationship: entry.relationship, hasRelationshipContext: RELATIONSHIP_RE.test(entry.sourceText) });
    }
  }
  return Array.from(aggregates.values());
}

// ============================================================================
// LIFE EVENT LABELS
// ============================================================================

const EVENT_LABELS: Record<string, { label: string; severity: 'low' | 'medium' | 'high' }> = {
  job_loss: { label: 'Possible job loss', severity: 'high' },
  job_search: { label: 'Job-seeking period', severity: 'medium' },
  relationship_end: { label: 'Relationship breakdown', severity: 'high' },
  relationship_start: { label: 'New relationship', severity: 'low' },
  financial_distress: { label: 'Financial distress', severity: 'high' },
  mental_health: { label: 'Mental health disclosure', severity: 'high' },
  health_concern: { label: 'Health concern', severity: 'medium' },
  bereavement: { label: 'Bereavement or loss', severity: 'high' },
  identity_crisis: { label: 'Identity questioning', severity: 'medium' },
  moving_home: { label: 'Relocating', severity: 'medium' },
  new_baby: { label: 'New baby', severity: 'medium' },
  wedding: { label: 'Wedding or engagement', severity: 'low' },
  legal_issue: { label: 'Legal issue', severity: 'high' },
};

// Scoring is now handled entirely by computeScoreFactors in deepParser.ts
// This ensures the displayed score and displayed breakdown always match.
// These functions are intentionally removed.

// ============================================================================
// MERGE
// ============================================================================

function mergeEnrichments(analysis: DeepAnalysis, enrichments: MessageEnrichment[]): DeepAnalysis {
  const enrichmentMap = new Map<number, MessageEnrichment>();
  for (const e of enrichments) enrichmentMap.set(e.id, e);
  const templateIds = new Set<number>(enrichments.filter(e => e.is_template_or_script).map(e => e.id));

  const enrichedMessages = analysis.messages.map((m, idx) => {
    const e = enrichmentMap.get(idx);
    if (!e) return m;
    if (e.is_template_or_script) return { ...m, confessionalScore: 0, anxietyScore: 0, intimacyScore: 0, messageType: 'factual' as const };
    return {
      ...m,
      confessionalScore: Math.max(m.confessionalScore, e.confessional_score),
      anxietyScore: Math.max(m.anxietyScore, e.is_personal ? e.emotional_intensity : 0),
      detectedSegments: Array.from(new Set([...m.detectedSegments, ...e.life_events])),
    };
  });

  // Names
  const rawNames: Array<{ name: string; relationship: string | null; sourceText: string }> = [];
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script || !e.named_people) continue;
    const src = analysis.messages[e.id]?.text || '';
    for (const p of e.named_people) {
      if (p.name?.length >= 2) rawNames.push({ name: p.name, relationship: p.relationship, sourceText: src });
    }
  }
  const nameAggregates = dedupeNames(rawNames);
  const aiNames = nameAggregates
    .filter(a => a.mentions >= 2 || a.hasRelationshipContext)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 12)
    .map(a => ({ name: a.canonical, mentions: a.mentions, relationship: a.relationship || undefined, contexts: [] }));

  // Sensitive topics
  const aiSensitiveTopics: Array<{ category: string; excerpt: string; timestamp: string }> = [];
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script) continue;
    const msg = analysis.messages[e.id];
    if (!msg) continue;
    for (const topic of (e.sensitive_topics || [])) {
      aiSensitiveTopics.push({ category: topic, excerpt: e.most_revealing_excerpt || msg.text.substring(0, 150), timestamp: new Date(msg.timestamp * 1000).toISOString() });
    }
  }
  const existingCategories = new Set(analysis.findings.sensitiveTopics.map((t: any) => t.category));
  const newSensitiveTopics = [...analysis.findings.sensitiveTopics, ...aiSensitiveTopics.filter(t => !existingCategories.has(t.category))];

  // Psychological signals — aggregate across all enriched messages
  const psychSignalCounts: Record<string, number> = {};
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script) continue;
    for (const sig of (e.psychological_signals || [])) {
      psychSignalCounts[sig] = (psychSignalCounts[sig] || 0) + 1;
    }
  }

  // Inferred beliefs — collect unique ones, ranked by frequency
  const beliefCounts: Record<string, number> = {};
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script) continue;
    for (const belief of (e.inferred_beliefs || [])) {
      if (belief && belief.length > 5) beliefCounts[belief] = (beliefCounts[belief] || 0) + 1;
    }
  }
  const topBeliefs = Object.entries(beliefCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([b]) => b);

  // Update psychological portrait with AI signals
  const updatedPortrait = { ...analysis.psychologicalPortrait };

  // Override self-perception themes with AI-detected signals
  const newThemes: string[] = [...(updatedPortrait.selfPerceptionThemes || [])];
  if (psychSignalCounts['perfectionism'] >= 2 && !newThemes.includes('Perfectionism / self-criticism')) newThemes.push('Perfectionism / self-criticism');
  if (psychSignalCounts['imposter_syndrome'] >= 2 && !newThemes.includes('Imposter syndrome')) newThemes.push('Imposter syndrome');
  if (psychSignalCounts['rumination'] >= 2 && !newThemes.includes('Chronic rumination')) newThemes.push('Chronic rumination');
  if (psychSignalCounts['people_pleasing'] >= 2 && !newThemes.includes('People-pleasing pattern')) newThemes.push('People-pleasing pattern');
  if (psychSignalCounts['low_self_worth'] >= 2 && !newThemes.includes('Low self-worth')) newThemes.push('Low self-worth');
  if (psychSignalCounts['catastrophising'] >= 2 && !newThemes.includes('Catastrophising')) newThemes.push('Catastrophising');
  updatedPortrait.selfPerceptionThemes = newThemes;

  // Override attachment style with AI signals if stronger evidence
  if (psychSignalCounts['attachment_anxiety'] >= 3 && (!updatedPortrait.attachmentStyle || !updatedPortrait.attachmentStyle.includes('Anxious'))) {
    updatedPortrait.attachmentStyle = 'Anxious attachment pattern — preoccupied with others\' responses and availability';
  } else if (psychSignalCounts['attachment_avoidant'] >= 2 && (!updatedPortrait.attachmentStyle || !updatedPortrait.attachmentStyle.includes('Avoidant'))) {
    updatedPortrait.attachmentStyle = 'Avoidant attachment pattern — discomfort with emotional closeness';
  }

  // Add inferred beliefs to portrait
  (updatedPortrait as any).inferredBeliefs = topBeliefs;

  // Juiciest moments
  const personalEnrichments = enrichments.filter(e => e.is_personal && !e.is_template_or_script).map(e => ({ e, msg: analysis.messages[e.id] })).filter(x => x.msg);
  const aiJuiciest = personalEnrichments.map(({ e, msg }) => {
    const base = e.confessional_score * 1.6 + e.emotional_intensity;
    const lateNight = (msg.hour >= 0 && msg.hour <= 4) ? 3 : msg.hour >= 22 ? 1.5 : 0;
    const lengthBoost = Math.min(3, Math.log2(Math.max(msg.wordCount, 10) / 10));
    const sensitiveBoost = (e.sensitive_topics || []).length * 1.5;
    return { e, msg, score: base + lateNight + lengthBoost + sensitiveBoost };
  }).sort((a, b) => b.score - a.score).slice(0, 6).map(({ e, msg }) => ({
    timestamp: new Date(msg.timestamp * 1000).toISOString(),
    excerpt: e.most_revealing_excerpt?.length > 20 ? e.most_revealing_excerpt : msg.text.substring(0, 300),
    juiceScore: Math.round((e.confessional_score + e.emotional_intensity) / 2),
    reason: [e.confessional_score >= 7 ? 'confession' : null, e.emotional_intensity >= 7 ? 'emotional distress' : null, (msg.hour >= 0 && msg.hour <= 4) ? 'late night' : null, (e.sensitive_topics || [])[0] || null, e.topic].filter(Boolean).join(', '),
  }));

  // Life events
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
    return { type, label: cfg.label, approximateDate: new Date(median.timestamp * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), evidence: sorted.slice(0, 3).map(m => `"${m.text.substring(0, 80)}..."`), severity: cfg.severity, count: msgs.length };
  }).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));

  const typeBreakdown = enrichedMessages.reduce((acc, m) => { acc[m.messageType] = (acc[m.messageType] || 0) + 1; return acc; }, {} as Record<string, number>);

  // Scoring — delegate entirely to computeScoreFactors (deepParser.ts)
  // This ensures privacyScore and scoreBreakdown are always computed by
  // the same function, eliminating the divergence bug.

  // Build an updated analysis object with the AI-enriched data for scoring
  const updatedForScoring = {
    ...analysis,
    messages: enrichedMessages,
    lifeEvents: aiLifeEvents.length > 0 ? aiLifeEvents : analysis.lifeEvents,
    typeBreakdown,
  };

  const scoreFactors = computeScoreFactors(
    updatedForScoring.messages,
    updatedForScoring.lifeEvents,
    analysis.commercialProfile,
    analysis.dependency,
    analysis.nighttimeRatio,
    typeBreakdown,
    analysis.avgAnxiety,
    analysis.avgIntimacy,
  );
  const newScore = Math.min(100, Math.max(0, scoreFactors.reduce((s, f) => s + f.contribution, 0)));

  return {
    ...analysis,
    messages: enrichedMessages,
    psychologicalPortrait: updatedPortrait,
    findings: {
      ...analysis.findings,
      personalInfo: { ...analysis.findings.personalInfo, names: aiNames },
      sensitiveTopics: newSensitiveTopics,
    },
    juiciestMoments: aiJuiciest.length > 0 ? aiJuiciest : analysis.juiciestMoments,
    lifeEvents: aiLifeEvents.length > 0 ? aiLifeEvents : analysis.lifeEvents,
    typeBreakdown,
    privacyScore: newScore,
  } as DeepAnalysis & { scoreBreakdown?: unknown; inferredBeliefs?: string[] };
}

// ============================================================================
// MAIN
// ============================================================================

export async function enrichAnalysisWithAI(analysis: DeepAnalysis, onProgress?: (p: EnrichmentProgress) => void): Promise<DeepAnalysis> {
  onProgress?.({ stage: 'selecting', batchesDone: 0, batchesTotal: 0, messagesEnriched: 0 });
  const candidates = selectCandidates(analysis.messages);
  if (candidates.length === 0) {
    onProgress?.({ stage: 'done', batchesDone: 0, batchesTotal: 0, messagesEnriched: 0 });
    return analysis;
  }

  const batches: Candidate[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) batches.push(candidates.slice(i, i + BATCH_SIZE));

  let batchesDone = 0;
  onProgress?.({ stage: 'enriching', batchesDone: 0, batchesTotal: batches.length, messagesEnriched: 0 });

  try {
    const enrichments = await runBatchesWithConcurrency(batches, () => {
      batchesDone++;
      onProgress?.({ stage: 'enriching', batchesDone, batchesTotal: batches.length, messagesEnriched: batchesDone * BATCH_SIZE });
    });
    onProgress?.({ stage: 'merging', batchesDone: batches.length, batchesTotal: batches.length, messagesEnriched: enrichments.length });
    const merged = mergeEnrichments(analysis, enrichments);

    // Synthesis pass — one final call reading the top excerpts together
    onProgress?.({ stage: 'synthesizing', batchesDone: batches.length, batchesTotal: batches.length, messagesEnriched: enrichments.length });
    try {
      const synthesis = await runSynthesis(merged, enrichments);
      console.log('runSynthesis returned:', synthesis ? 'object with keys: ' + Object.keys(synthesis).join(',') : 'null');
      console.log('synthesis characterSummary preview:', (synthesis as any)?.characterSummary?.substring(0, 60));
      if (synthesis) {
        (merged as DeepAnalysis & { synthesis?: Synthesis }).synthesis = synthesis;
        console.log('synthesis attached to merged, merged.synthesis:', !!(merged as any).synthesis);
      }
    } catch (synthErr) {
      console.error('Synthesis failed, continuing without:', synthErr);
    }

    onProgress?.({ stage: 'done', batchesDone: batches.length, batchesTotal: batches.length, messagesEnriched: enrichments.length });
    return merged;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    onProgress?.({ stage: 'failed', batchesDone, batchesTotal: batches.length, messagesEnriched: 0, error: message });
    return analysis;
  }
}
