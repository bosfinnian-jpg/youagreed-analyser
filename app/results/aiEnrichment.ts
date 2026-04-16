// ============================================================================
// aiEnrichment.ts
// Selects candidate messages, calls the /api/enrich route in batches,
// merges AI results back into the DeepAnalysis.
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
  topic: string;
}

export interface EnrichmentProgress {
  stage: 'selecting' | 'enriching' | 'merging' | 'done' | 'failed';
  batchesDone: number;
  batchesTotal: number;
  messagesEnriched: number;
  error?: string;
}

const BATCH_SIZE = 20;
const MAX_CANDIDATES = 240;
const MAX_PARALLEL_BATCHES = 3;

// ============================================================================
// CANDIDATE SELECTION
// Pick the messages most likely to contain real personal signal.
// ============================================================================

interface Candidate {
  index: number; // index in messages array
  message: ScoredMessage;
  priority: number; // higher = more important
}

function selectCandidates(messages: ScoredMessage[]): Candidate[] {
  const candidates: Candidate[] = [];

  messages.forEach((m, index) => {
    let priority = 0;

    // Length signal — longer messages have more content
    if (m.wordCount > 30) priority += 2;
    if (m.wordCount > 80) priority += 3;
    if (m.wordCount > 200) priority += 3;

    // Regex scored it as emotional/confessional — re-check with AI
    if (m.confessionalScore > 2) priority += 5;
    if (m.anxietyScore > 4) priority += 4;
    if (m.intimacyScore > 5) priority += 3;
    if (m.validationScore > 4) priority += 2;

    // Late-night
    if (m.hour >= 0 && m.hour <= 4) priority += 3;

    // Already flagged with a life-event keyword — verify it's not a false positive
    if (m.detectedSegments.length > 0) priority += 6;

    // First person heavy
    const iCount = (m.text.match(/\bi\b|\bi'm\b|\bi've\b|\bmy\b/gi) || []).length;
    if (iCount > 5) priority += 2;

    // Skip pure code or very short messages
    if (m.wordCount < 5) return;
    if (m.text.startsWith('```') || m.text.includes('function(') || m.text.includes('def ')) {
      priority -= 5;
    }

    // Skip system-prompt-style messages
    if (/^(you are|system:|role:|act as)/i.test(m.text.trim())) {
      priority -= 3;
    }

    if (priority > 0) {
      candidates.push({ index, message: m, priority });
    }
  });

  // Sort by priority descending and cap
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, MAX_CANDIDATES);
}

// ============================================================================
// BATCHED API CALLS
// ============================================================================

async function enrichBatch(
  batch: Candidate[]
): Promise<MessageEnrichment[]> {
  const payload = {
    messages: batch.map(c => ({
      id: c.index,
      text: c.message.text,
      hour: c.message.hour,
      timestamp: c.message.timestamp,
    })),
  };

  const response = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Batch failed: ${err}`);
  }

  const data = await response.json();
  return data.enrichments || [];
}

// Run batches in small parallel groups to stay under rate limits
async function runBatchesWithConcurrency(
  batches: Candidate[][],
  onBatchDone: () => void
): Promise<MessageEnrichment[]> {
  const results: MessageEnrichment[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < batches.length) {
      const myIdx = cursor++;
      if (myIdx >= batches.length) return;
      try {
        const enrichments = await enrichBatch(batches[myIdx]);
        results.push(...enrichments);
      } catch (err) {
        // Log but continue — we'd rather have partial enrichment than none
        console.error(`Batch ${myIdx} failed:`, err);
      }
      onBatchDone();
    }
  }

  const workers = Array.from({ length: Math.min(MAX_PARALLEL_BATCHES, batches.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

// ============================================================================
// MERGING AI RESULTS INTO ANALYSIS
// ============================================================================

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
}

function mergeEnrichments(
  analysis: DeepAnalysis,
  enrichments: MessageEnrichment[]
): DeepAnalysis {
  const enrichmentMap = new Map<number, MessageEnrichment>();
  enrichments.forEach(e => enrichmentMap.set(e.id, e));

  // Update scored messages with AI signals where available
  const enrichedMessages = analysis.messages.map((m, idx) => {
    const e = enrichmentMap.get(idx);
    if (!e) return m;

    // Override scores with AI values where AI has stronger signal
    return {
      ...m,
      confessionalScore: Math.max(m.confessionalScore, e.confessional_score),
      anxietyScore: Math.max(m.anxietyScore, e.is_personal ? e.emotional_intensity : 0),
      // If AI says it's a template, kill all personal scores
      ...(e.is_template_or_script ? {
        confessionalScore: 0,
        anxietyScore: 0,
        intimacyScore: 0,
        messageType: 'factual' as const,
      } : {}),
      detectedSegments: Array.from(new Set([...m.detectedSegments, ...e.life_events])),
    };
  });

  // === Rebuild named people from AI extractions ===
  const peopleMap = new Map<string, { name: string; mentions: number; relationship: string | null; contexts: string[] }>();

  for (const enrichment of enrichments) {
    if (!enrichment.is_personal || enrichment.is_template_or_script) continue;
    if (!enrichment.named_people) continue;

    for (const person of enrichment.named_people) {
      if (!person.name || person.name.length < 2) continue;

      const key = normaliseName(person.name);
      // Filter out obvious junk: single letters, all-caps short tokens, numbers
      if (/^[A-Z]{1,3}$/.test(person.name)) continue;
      if (/^\d+$/.test(person.name)) continue;

      const existing = peopleMap.get(key);
      if (existing) {
        existing.mentions += 1;
        if (!existing.relationship && person.relationship) {
          existing.relationship = person.relationship;
        }
      } else {
        // Capitalise properly
        const displayName = person.name.charAt(0).toUpperCase() + person.name.slice(1).toLowerCase();
        peopleMap.set(key, {
          name: displayName,
          mentions: 1,
          relationship: person.relationship,
          contexts: [],
        });
      }
    }
  }

  const aiNames = Array.from(peopleMap.values())
    .filter(p => p.mentions >= 1) // AI-verified = trust even a single mention
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10)
    .map(p => ({
      name: p.name,
      mentions: p.mentions,
      relationship: p.relationship || undefined,
      contexts: p.contexts,
    }));

  // === Rebuild juiciest moments from AI-verified personal messages ===
  const personalEnrichments = enrichments
    .filter(e => e.is_personal && !e.is_template_or_script)
    .map(e => ({
      enrichment: e,
      message: analysis.messages[e.id],
    }))
    .filter(x => x.message);

  const aiJuiciest = personalEnrichments
    .sort((a, b) => {
      const scoreA = a.enrichment.confessional_score * 1.5 + a.enrichment.emotional_intensity;
      const scoreB = b.enrichment.confessional_score * 1.5 + b.enrichment.emotional_intensity;
      return scoreB - scoreA;
    })
    .slice(0, 10)
    .map(({ message, enrichment }) => ({
      timestamp: new Date(message.timestamp * 1000).toISOString(),
      excerpt: message.text.substring(0, 300),
      juiceScore: Math.round((enrichment.confessional_score + enrichment.emotional_intensity) / 2),
      reason: [
        enrichment.confessional_score > 6 ? 'confession' : null,
        enrichment.emotional_intensity > 6 ? 'emotional' : null,
        message.hour >= 0 && message.hour <= 4 ? 'late_night' : null,
        enrichment.topic,
      ].filter(Boolean).join(', '),
    }));

  // === Rebuild life events from AI extractions with dates ===
  const eventCountsByType = new Map<string, { messages: ScoredMessage[]; count: number }>();

  for (const enrichment of enrichments) {
    if (!enrichment.is_personal || enrichment.is_template_or_script) continue;
    const msg = analysis.messages[enrichment.id];
    if (!msg) continue;

    for (const eventType of enrichment.life_events || []) {
      const existing = eventCountsByType.get(eventType) || { messages: [], count: 0 };
      existing.messages.push(msg);
      existing.count += 1;
      eventCountsByType.set(eventType, existing);
    }
  }

  const EVENT_LABELS: Record<string, { label: string; severity: 'low' | 'medium' | 'high' }> = {
    job_loss: { label: 'Possible job loss', severity: 'high' },
    job_search: { label: 'Job seeking period', severity: 'medium' },
    relationship_end: { label: 'Relationship breakdown', severity: 'high' },
    relationship_start: { label: 'New relationship', severity: 'low' },
    financial_distress: { label: 'Financial distress', severity: 'high' },
    mental_health: { label: 'Mental health disclosure', severity: 'high' },
    health_concern: { label: 'Health concern', severity: 'medium' },
    bereavement: { label: 'Bereavement or loss', severity: 'high' },
    identity_crisis: { label: 'Identity questioning', severity: 'medium' },
    moving_home: { label: 'Relocating', severity: 'medium' },
    new_baby: { label: 'New baby', severity: 'medium' },
    wedding: { label: 'Wedding / engagement', severity: 'low' },
    legal_issue: { label: 'Legal issue', severity: 'high' },
  };

  const aiLifeEvents = Array.from(eventCountsByType.entries())
    .filter(([, data]) => data.count >= 1)
    .map(([eventType, data]) => {
      const config = EVENT_LABELS[eventType] || { label: eventType, severity: 'medium' as const };
      const sorted = data.messages.sort((a, b) => a.timestamp - b.timestamp);
      const median = sorted[Math.floor(sorted.length / 2)];
      return {
        type: eventType,
        label: config.label,
        approximateDate: new Date(median.timestamp * 1000).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        evidence: sorted.slice(0, 3).map(m => `"${m.text.substring(0, 80)}..."`),
        severity: config.severity,
      };
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });

  // === Recompute type breakdown from AI-enriched scores ===
  const typeBreakdown = enrichedMessages.reduce((acc, m) => {
    acc[m.messageType] = (acc[m.messageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // === Recompute privacy score using AI-validated events ===
  let newScore = 0;
  newScore += aiLifeEvents.filter(e => e.severity === 'high').length * 10;
  newScore += aiLifeEvents.filter(e => e.severity === 'medium').length * 5;
  newScore += Math.min(25, analysis.commercialProfile.segments.reduce((s, seg) => s + seg.confidence / 10, 0));
  newScore += analysis.dependency.dependencyScore * 0.2;
  const aiConfessionalCount = enrichments.filter(e => e.is_personal && !e.is_template_or_script && e.confessional_score > 5).length;
  newScore += Math.min(15, aiConfessionalCount * 2);
  if (analysis.totalUserMessages > 2000) newScore += 5;
  if (analysis.totalUserMessages > 5000) newScore += 3;
  newScore += Math.min(8, aiNames.length);
  newScore = Math.round(Math.min(100, Math.max(0, newScore)));

  // Update findings.personalInfo.names with AI verdict
  const updatedFindings = {
    ...analysis.findings,
    personalInfo: {
      ...analysis.findings.personalInfo,
      names: aiNames,
    },
  };

  return {
    ...analysis,
    messages: enrichedMessages,
    findings: updatedFindings,
    juiciestMoments: aiJuiciest.length > 0 ? aiJuiciest : analysis.juiciestMoments,
    lifeEvents: aiLifeEvents.length > 0 ? aiLifeEvents : analysis.lifeEvents,
    typeBreakdown,
    privacyScore: newScore,
  };
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

  // Split into batches
  const batches: Candidate[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE));
  }

  let batchesDone = 0;
  onProgress?.({ stage: 'enriching', batchesDone: 0, batchesTotal: batches.length, messagesEnriched: 0 });

  try {
    const enrichments = await runBatchesWithConcurrency(batches, () => {
      batchesDone++;
      onProgress?.({
        stage: 'enriching',
        batchesDone,
        batchesTotal: batches.length,
        messagesEnriched: batchesDone * BATCH_SIZE,
      });
    });

    onProgress?.({
      stage: 'merging',
      batchesDone: batches.length,
      batchesTotal: batches.length,
      messagesEnriched: enrichments.length,
    });

    const merged = mergeEnrichments(analysis, enrichments);

    onProgress?.({
      stage: 'done',
      batchesDone: batches.length,
      batchesTotal: batches.length,
      messagesEnriched: enrichments.length,
    });

    return merged;
  } catch (err: any) {
    console.error('AI enrichment failed:', err);
    onProgress?.({
      stage: 'failed',
      batchesDone,
      batchesTotal: batches.length,
      messagesEnriched: 0,
      error: err.message,
    });
    // Return the original analysis — dashboard still works
    return analysis;
  }
}
