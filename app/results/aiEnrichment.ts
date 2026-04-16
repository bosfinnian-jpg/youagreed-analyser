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

export interface ScoreBreakdownEntry {
  label: string;
  contribution: number;
  detail: string;
  category: 'life_events' | 'commercial' | 'dependency' | 'confessional' | 'names' | 'volume';
}

const BATCH_SIZE = 20;
const MAX_CANDIDATES = 240;
const MAX_PARALLEL_BATCHES = 3;

// Score component ceilings — must sum to exactly 100.
// Reordered from the brief's original wording so the maximum feels structural,
// not additive. A user hitting 100 has disclosed crises, been heavily profiled,
// shown dependency, confessed repeatedly, named people, and written a lot.
const SCORE_CEILINGS = {
  life_events: 30,
  commercial: 25,
  dependency: 20,
  confessional: 15,
  names: 7,
  volume: 3,
} as const;

// ============================================================================
// PRE-FILTER: STRUCTURAL TEMPLATE DETECTION
// Catches business/productivity content before it enters the candidate pool.
// Pattern-matched contamination is cheaper to reject here than to rely on AI
// every time — and some templates slip past the AI anyway.
// ============================================================================

const TEMPLATE_KEYWORDS: readonly string[] = [
  'cold call',
  'sales script',
  'objection handling',
  'follow-up sequence',
  'follow up sequence',
  'email template',
  'linkedin message',
  'jordan platten',
  'appointment setting',
  'lead generation',
  'close the deal',
  'discovery call',
  'cold email',
  'cadence',
  'outreach sequence',
  'pitch deck',
  'elevator pitch',
];

interface TemplateSignals {
  isLikelyTemplate: boolean;
  reasons: string[];
}

function detectTemplateSignals(text: string): TemplateSignals {
  const reasons: string[] = [];
  const lower = text.toLowerCase();

  // Keyword match — domain-specific sales/outreach content
  for (const keyword of TEMPLATE_KEYWORDS) {
    if (lower.includes(keyword)) {
      reasons.push(`keyword:${keyword}`);
      break; // one is enough to flag
    }
  }

  const lines = text.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const totalLines = Math.max(nonEmptyLines.length, 1);

  // Markdown heading density — templates are heavily sectioned
  const headingCount = nonEmptyLines.filter(l => /^#{1,6}\s+\S/.test(l.trim())).length;
  if (headingCount >= 3 || (headingCount / totalLines) > 0.15) {
    reasons.push('heading_density');
  }

  // Bold label count — "**Goal:**", "**Step 1:**" style
  const boldMatches = text.match(/\*\*[^*\n]{1,80}\*\*/g) || [];
  if (boldMatches.length >= 4) {
    reasons.push('bold_density');
  }

  // Horizontal rule dividers
  const hrCount = nonEmptyLines.filter(l => /^\s*(-{3,}|={3,}|\*{3,}|_{3,})\s*$/.test(l)).length;
  if (hrCount >= 2) {
    reasons.push('hr_dividers');
  }

  // Bullet density — structured lists dominate templates
  const bulletCount = nonEmptyLines.filter(l => /^\s*[-*•]\s+\S/.test(l) || /^\s*\d+[.)]\s+\S/.test(l)).length;
  if (bulletCount >= 6 && (bulletCount / totalLines) > 0.4) {
    reasons.push('bullet_density');
  }

  // All-caps title line at the top — "PERFECT SALES SCRIPT" style
  const firstMeaningfulLine = nonEmptyLines[0]?.trim().replace(/[#*_\-`]/g, '').trim() || '';
  if (firstMeaningfulLine.length >= 10 && firstMeaningfulLine.length <= 120) {
    const letters = firstMeaningfulLine.replace(/[^A-Za-z]/g, '');
    const uppers = firstMeaningfulLine.replace(/[^A-Z]/g, '');
    if (letters.length >= 8 && uppers.length / letters.length >= 0.7) {
      reasons.push('caps_title');
    }
  }

  // Stage-direction brackets — "[pause]", "[if objection:]"
  const stageDirections = (text.match(/\[[^\]\n]{2,40}\]/g) || []).length;
  if (stageDirections >= 3) {
    reasons.push('stage_directions');
  }

  return {
    isLikelyTemplate: reasons.length >= 1 && (
      reasons.some(r => r.startsWith('keyword:')) ||
      reasons.length >= 2
    ),
    reasons,
  };
}

// ============================================================================
// CANDIDATE SELECTION
// Pick the messages most likely to contain real personal signal.
// ============================================================================

interface Candidate {
  index: number;
  message: ScoredMessage;
  priority: number;
}

// Regex compiled once rather than per-message — selectCandidates runs over
// every message in the export, which can be 10k+ calls.
const FIRST_PERSON_RE = /\b(i|i'm|i've|i'd|i'll|my|me|myself)\b/gi;
const PERSONAL_QUESTION_RE = /\b(should i|what would you do|am i wrong|do you think i should|what should i do|is it okay if i|am i (a |the )?|do i)\b/i;
const EMOTIONAL_LEXICON_RE = /\b(scared|terrified|ashamed|guilty|lonely|hopeless|desperate|broken|hurt|crying|overwhelmed|anxious|depressed|afraid|worthless|empty|numb|devastated|betrayed|furious|heartbroken|grieving|panicking|struggling|exhausted|trapped)\b/i;

function selectCandidates(messages: ScoredMessage[]): Candidate[] {
  const candidates: Candidate[] = [];

  messages.forEach((m, index) => {
    // Hard pre-filter: skip if structural signals say it's a template.
    // These don't reach the AI at all — saves tokens and prevents templates
    // from displacing genuine personal messages in the candidate pool.
    const templateSignals = detectTemplateSignals(m.text);
    if (templateSignals.isLikelyTemplate) return;

    if (m.wordCount < 5) return;

    // Pure code — drop entirely rather than just docking priority.
    // The old behaviour (priority -= 5) still let long code through.
    if (m.text.startsWith('```') || m.text.includes('function(') || m.text.includes('def ')) {
      return;
    }

    // System-prompt-style messages — user is instructing the AI, not disclosing
    if (/^(you are|system:|role:|act as)/i.test(m.text.trim())) return;

    let priority = 0;

    // Length — longer messages carry more signal
    if (m.wordCount > 30) priority += 2;
    if (m.wordCount > 80) priority += 3;
    if (m.wordCount > 200) priority += 3;

    // Regex scored it as emotional/confessional — AI should verify
    if (m.confessionalScore > 2) priority += 5;
    if (m.anxietyScore > 4) priority += 4;
    if (m.intimacyScore > 5) priority += 3;
    if (m.validationScore > 4) priority += 2;

    // Late-night — emotional disclosures cluster 12am-4am
    if (m.hour >= 0 && m.hour <= 4) priority += 3;

    // First-person density — "I" and "my" heavy
    const iCount = (m.text.match(FIRST_PERSON_RE) || []).length;
    if (iCount > 5) priority += 2;
    if (iCount > 12) priority += 2;

    // IMPROVEMENT A: invert the old detectedSegments boost.
    // Messages regex flagged for life events were getting +6 regardless of
    // quality — this elevated false positives (e.g. "I lost my phone" flagged
    // as job_loss). Instead, boost messages that show emotional language but
    // weren't flagged — these are the false negatives AI should catch.
    const hasRegexSegment = m.detectedSegments.length > 0;
    const hasEmotionalLanguage = EMOTIONAL_LEXICON_RE.test(m.text);
    if (hasEmotionalLanguage && !hasRegexSegment) priority += 5;
    if (hasEmotionalLanguage && hasRegexSegment) priority += 2;

    // IMPROVEMENT A: personal decision-making questions directed at the AI.
    // "Should I leave him?" "Am I wrong for feeling this way?" — high signal
    // for confessional content that regex doesn't catch.
    if (PERSONAL_QUESTION_RE.test(m.text)) priority += 4;

    if (priority > 0) {
      candidates.push({ index, message: m, priority });
    }
  });

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, MAX_CANDIDATES);
}

// ============================================================================
// BATCHED API CALLS
// ============================================================================

async function enrichBatch(batch: Candidate[]): Promise<MessageEnrichment[]> {
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
        // Partial enrichment is better than none — log, continue
        console.error(`Batch ${myIdx} failed:`, err);
      }
      onBatchDone();
    }
  }

  const workerCount = Math.min(MAX_PARALLEL_BATCHES, batches.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return results;
}

// ============================================================================
// NAME HANDLING
// ============================================================================

// Particles that should remain lowercase in a title-cased name.
// "van der Berg", "de la Cruz", "bin Salman" — capitalising these reads
// as American and wrong for most non-English names.
const NAME_PARTICLES: ReadonlySet<string> = new Set([
  'de', 'van', 'der', 'den', 'von', 'al', 'el', 'bin', 'ibn', 'la', 'le',
  'da', 'do', 'dos', 'du', 'di', 'af', 'av', 'ter', 'te', 'ten',
]);

function titleCaseName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map((token, i) => {
      // Strip non-alphabetic characters before casing, then re-examine
      const cleaned = token.replace(/[^\p{L}'-]/gu, '');
      if (!cleaned) return '';

      const lower = cleaned.toLowerCase();

      // Particles stay lowercase unless they're the first token
      if (i > 0 && NAME_PARTICLES.has(lower)) return lower;

      // Handle hyphenated names: "Anne-Marie"
      if (lower.includes('-')) {
        return lower.split('-').map(p => p ? p[0].toUpperCase() + p.slice(1) : '').join('-');
      }

      // Handle apostrophe names: "O'Brien", "D'Angelo"
      if (lower.includes("'")) {
        return lower.split("'").map((p, idx) => {
          if (!p) return '';
          // Capitalise after the apostrophe too (O'Brien not O'brien)
          return idx === 0 || p.length > 1
            ? p[0].toUpperCase() + p.slice(1)
            : p.toUpperCase();
        }).join("'");
      }

      return lower[0].toUpperCase() + lower.slice(1);
    })
    .filter(Boolean)
    .join(' ');
}

// Strip relationship parentheticals so "Sarah (my ex)" keys the same as "Sarah"
function stripRelationshipParenthetical(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

interface NameAggregate {
  canonical: string;
  mentions: number;
  relationship: string | null;
  contexts: string[];
  hasRelationshipContext: boolean;
}

// Relationship context signals in the surrounding enrichment data.
// A one-off mention of "Rae" means little, but "my girlfriend Rae" is strong.
const RELATIONSHIP_CONTEXT_RE = /\b(my|our)\s+(girlfriend|boyfriend|wife|husband|partner|ex|fianc[eé]e?|mum|mom|mother|dad|father|brother|sister|son|daughter|boss|manager|coworker|colleague|friend|mate|therapist|doctor)\b/i;

function dedupeNames(
  rawEntries: Array<{ name: string; relationship: string | null; sourceText: string }>
): NameAggregate[] {
  // First pass: normalise each raw mention
  const normalised: Array<{ key: string; display: string; relationship: string | null; sourceText: string }> = [];

  for (const entry of rawEntries) {
    if (!entry.name) continue;
    const stripped = stripRelationshipParenthetical(entry.name);
    if (stripped.length < 2) continue;

    // Filter obvious junk
    if (/^[A-Z]{1,3}$/.test(entry.name)) continue;
    if (/^\d+$/.test(entry.name)) continue;
    // Single-word all-lowercase common nouns that slipped through ("taxi", "driver")
    // get filtered at the AI prompt level, but we double-check here.
    if (!/[A-Za-z]/.test(stripped)) continue;

    const display = titleCaseName(stripped);
    if (!display) continue;

    normalised.push({
      key: display.toLowerCase(),
      display,
      relationship: entry.relationship,
      sourceText: entry.sourceText,
    });
  }

  // Second pass: substring merge.
  // "Rae" and "Rae Mitchell" should collapse. Keep the longer as canonical.
  // We sort by length descending so longer names "absorb" shorter ones.
  const sorted = [...normalised].sort((a, b) => b.key.length - a.key.length);
  const aggregates = new Map<string, NameAggregate>();

  for (const entry of sorted) {
    // Does this key match (or contain) any existing canonical?
    let matchedCanonical: string | null = null;

    for (const [existingKey] of aggregates) {
      // Word-boundary containment — "rae" matches "rae mitchell" but not "raesha"
      const entryWords = entry.key.split(/\s+/);
      const existingWords = existingKey.split(/\s+/);

      // If every word of the shorter appears in the longer, they're the same person
      const [shorter, longer] = entryWords.length <= existingWords.length
        ? [entryWords, existingWords]
        : [existingWords, entryWords];

      const allShorterInLonger = shorter.every(w => longer.includes(w));

      if (allShorterInLonger && shorter.length >= 1) {
        matchedCanonical = existingKey;
        break;
      }
    }

    if (matchedCanonical) {
      const agg = aggregates.get(matchedCanonical)!;
      agg.mentions += 1;
      if (!agg.relationship && entry.relationship) {
        agg.relationship = entry.relationship;
      }
      if (RELATIONSHIP_CONTEXT_RE.test(entry.sourceText)) {
        agg.hasRelationshipContext = true;
      }
    } else {
      aggregates.set(entry.key, {
        canonical: entry.display,
        mentions: 1,
        relationship: entry.relationship,
        contexts: [],
        hasRelationshipContext: RELATIONSHIP_CONTEXT_RE.test(entry.sourceText),
      });
    }
  }

  return Array.from(aggregates.values());
}

// ============================================================================
// LIFE EVENT LABELS
// ============================================================================

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
  wedding: { label: 'Wedding or engagement', severity: 'low' },
  legal_issue: { label: 'Legal issue', severity: 'high' },
};

// ============================================================================
// SCORING
// ============================================================================

// Each scorer returns a value 0..ceiling. The curves are chosen so a typical
// user lands 40-65 and 100 remains exceptional — not nominal.

function scoreLifeEvents(events: Array<{ severity: 'low' | 'medium' | 'high' }>): number {
  const high = events.filter(e => e.severity === 'high').length;
  const medium = events.filter(e => e.severity === 'medium').length;
  const low = events.filter(e => e.severity === 'low').length;

  // Diminishing returns via sqrt — first crisis weighs heaviest
  const raw = (Math.sqrt(high) * 14) + (Math.sqrt(medium) * 7) + (Math.sqrt(low) * 3);
  return Math.min(SCORE_CEILINGS.life_events, Math.round(raw));
}

function scoreCommercial(segments: Array<{ confidence: number }>): number {
  // Sum of confidences, scaled. Old formula was confidence/10 summed and
  // min-capped at 25 — which meant 3 segments at confidence 90 gave 25.
  // New: weighted so reaching 25 requires multiple high-confidence segments.
  const weighted = segments.reduce((s, seg) => s + Math.pow(seg.confidence / 100, 1.5) * 10, 0);
  return Math.min(SCORE_CEILINGS.commercial, Math.round(weighted));
}

function scoreDependency(dependencyScore: number): number {
  // dependencyScore is already 0-100 in the deep parser.
  // At 50 (moderate use) contributes 10. At 100 contributes the full 20.
  const scaled = (dependencyScore / 100) * SCORE_CEILINGS.dependency;
  return Math.min(SCORE_CEILINGS.dependency, Math.round(scaled));
}

function scoreConfessional(count: number): number {
  // Logarithmic curve: 1 confession = 4, 5 confessions = 10, 15 = 13, 50 = 15.
  // The brief lowered the threshold (>3 not >5) which means more confessions
  // now count — so the curve has to flatten or everyone hits the ceiling.
  if (count === 0) return 0;
  const raw = 4 + Math.log2(count) * 3.3;
  return Math.min(SCORE_CEILINGS.confessional, Math.round(raw));
}

function scoreNames(count: number): number {
  // Linear to the ceiling — 7+ names is the max. The point is simply that
  // names exist in the corpus, not that 20 names is twice as bad as 10.
  return Math.min(SCORE_CEILINGS.names, count);
}

function scoreVolume(totalMessages: number): number {
  // The old version gave 8 flat points at 5000 messages. Now a 3-point ceiling
  // that curves in — 500 msgs = 1, 2000 = 2, 5000+ = 3.
  if (totalMessages < 500) return 0;
  if (totalMessages < 2000) return 1;
  if (totalMessages < 5000) return 2;
  return SCORE_CEILINGS.volume;
}

// ============================================================================
// MERGING AI RESULTS INTO ANALYSIS
// ============================================================================

function mergeEnrichments(
  analysis: DeepAnalysis,
  enrichments: MessageEnrichment[]
): DeepAnalysis {
  const enrichmentMap = new Map<number, MessageEnrichment>();
  for (const e of enrichments) enrichmentMap.set(e.id, e);

  // --- Enriched messages (non-mutating) ---
  const enrichedMessages: ScoredMessage[] = analysis.messages.map((m, idx) => {
    const e = enrichmentMap.get(idx);
    if (!e) return m;

    if (e.is_template_or_script) {
      // AI flagged as template — zero out personal scores so it can't surface
      // as a juiciest moment or contribute to aggregates downstream.
      return {
        ...m,
        confessionalScore: 0,
        anxietyScore: 0,
        intimacyScore: 0,
        messageType: 'factual' as const,
        detectedSegments: m.detectedSegments,
      };
    }

    return {
      ...m,
      confessionalScore: Math.max(m.confessionalScore, e.confessional_score),
      anxietyScore: Math.max(m.anxietyScore, e.is_personal ? e.emotional_intensity : 0),
      detectedSegments: Array.from(new Set([...m.detectedSegments, ...e.life_events])),
    };
  });

  // --- Purge templates from regex-built juiciestMoments ---
  // Problem 1(b): even if the AI correctly flagged a template, the original
  // analysis.juiciestMoments (built pre-enrichment) might still contain it.
  // We identify template message IDs from the enrichment and purge them from
  // the regex-built list before it's used as a fallback.
  const templateMessageIds = new Set<number>();
  for (const e of enrichments) {
    if (e.is_template_or_script) templateMessageIds.add(e.id);
  }

  const purgedRegexJuiciest = analysis.juiciestMoments.filter(moment => {
    // juiciestMoments don't carry message IDs directly — match by excerpt prefix
    // against enriched messages marked as template.
    for (const id of templateMessageIds) {
      const msg = analysis.messages[id];
      if (!msg) continue;
      const prefix = msg.text.substring(0, 80).replace(/\s+/g, ' ').trim();
      const momentPrefix = (moment.excerpt || '').substring(0, 80).replace(/\s+/g, ' ').trim();
      if (prefix && momentPrefix && (prefix === momentPrefix || prefix.startsWith(momentPrefix) || momentPrefix.startsWith(prefix))) {
        return false;
      }
    }
    return true;
  });

  // --- Rebuild named people with deduplication ---
  const rawNameEntries: Array<{ name: string; relationship: string | null; sourceText: string }> = [];
  for (const enrichment of enrichments) {
    if (!enrichment.is_personal || enrichment.is_template_or_script) continue;
    if (!enrichment.named_people) continue;
    const sourceText = analysis.messages[enrichment.id]?.text || '';
    for (const person of enrichment.named_people) {
      if (!person.name || person.name.length < 2) continue;
      rawNameEntries.push({
        name: person.name,
        relationship: person.relationship,
        sourceText,
      });
    }
  }

  const aggregates = dedupeNames(rawNameEntries);

  // Inclusion rule: 2+ mentions OR has relationship context.
  // This kills one-off spurious captures while preserving "my girlfriend Rae"
  // mentioned once.
  const aiNames = aggregates
    .filter(a => a.mentions >= 2 || a.hasRelationshipContext)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10)
    .map(a => ({
      name: a.canonical,
      mentions: a.mentions,
      relationship: a.relationship || undefined,
      contexts: a.contexts,
    }));

  // --- Rebuild juiciest moments ---
  const personalEnrichments = enrichments
    .filter(e => e.is_personal && !e.is_template_or_script)
    .map(e => ({
      enrichment: e,
      message: analysis.messages[e.id],
    }))
    .filter(x => x.message);

  const aiJuiciest = personalEnrichments
    .map(({ enrichment, message }) => {
      // IMPROVEMENT B: extend the sort with late-night and length factors.
      const base = enrichment.confessional_score * 1.5 + enrichment.emotional_intensity;
      const lateNight = (message.hour >= 0 && message.hour <= 4) ? 2.5 : 0;
      // Log-scale length so a 400-word confession doesn't 10x a 40-word one
      const lengthBoost = Math.min(3, Math.log2(Math.max(message.wordCount, 10) / 10));
      return {
        enrichment,
        message,
        sortScore: base + lateNight + lengthBoost,
      };
    })
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, 5) // Brief: fewer, better. Was 10, now 5.
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

  // --- Rebuild life events with deduplication by event type ---
  // Problem 5: the AI can emit the same event type across multiple batches
  // (message 42 and message 67 both produce "relationship_end"). Aggregate by
  // type first, emit one entry per type with median date and count.
  const eventBuckets = new Map<string, ScoredMessage[]>();
  for (const enrichment of enrichments) {
    if (!enrichment.is_personal || enrichment.is_template_or_script) continue;
    const msg = analysis.messages[enrichment.id];
    if (!msg) continue;
    for (const eventType of enrichment.life_events || []) {
      const existing = eventBuckets.get(eventType) || [];
      existing.push(msg);
      eventBuckets.set(eventType, existing);
    }
  }

  const aiLifeEvents = Array.from(eventBuckets.entries())
    .filter(([, msgs]) => msgs.length >= 1)
    .map(([eventType, msgs]) => {
      const config = EVENT_LABELS[eventType] || { label: eventType, severity: 'medium' as const };
      const sorted = [...msgs].sort((a, b) => a.timestamp - b.timestamp);
      const median = sorted[Math.floor(sorted.length / 2)];
      return {
        type: eventType,
        label: config.label,
        approximateDate: new Date(median.timestamp * 1000).toLocaleDateString('en-GB', {
          month: 'long',
          year: 'numeric',
        }),
        evidence: sorted.slice(0, 3).map(m => `"${m.text.substring(0, 80)}..."`),
        severity: config.severity,
        count: msgs.length,
      };
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });

  // --- Recompute type breakdown ---
  const typeBreakdown = enrichedMessages.reduce((acc, m) => {
    acc[m.messageType] = (acc[m.messageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // --- Score calculation — each component capped at its ceiling ---
  const lifeEventsContribution = scoreLifeEvents(aiLifeEvents);
  const commercialContribution = scoreCommercial(analysis.commercialProfile.segments);
  const dependencyContribution = scoreDependency(analysis.dependency.dependencyScore);

  // Problem 6: threshold lowered from >5 to >3.
  const confessionalCount = enrichments.filter(
    e => e.is_personal && !e.is_template_or_script && e.confessional_score > 3
  ).length;
  const confessionalContribution = scoreConfessional(confessionalCount);

  const namesContribution = scoreNames(aiNames.length);
  const volumeContribution = scoreVolume(analysis.totalUserMessages);

  const newScore = Math.max(0, Math.min(100,
    lifeEventsContribution +
    commercialContribution +
    dependencyContribution +
    confessionalContribution +
    namesContribution +
    volumeContribution
  ));

  // --- Score breakdown for ScoreBreakdown.tsx ---
  const highSeverityCount = aiLifeEvents.filter(e => e.severity === 'high').length;
  const mediumSeverityCount = aiLifeEvents.filter(e => e.severity === 'medium').length;
  const topSegment = analysis.commercialProfile.segments[0];

  const scoreBreakdown: ScoreBreakdownEntry[] = [
    {
      label: 'Life events disclosed',
      contribution: lifeEventsContribution,
      category: 'life_events',
      detail: aiLifeEvents.length === 0
        ? 'No significant life events were detected in your messages.'
        : `${aiLifeEvents.length} event${aiLifeEvents.length === 1 ? '' : 's'} detected` +
          (highSeverityCount > 0 ? `, ${highSeverityCount} high-severity` : '') +
          (mediumSeverityCount > 0 ? `, ${mediumSeverityCount} medium-severity` : '') + '.',
    },
    {
      label: 'Commercial profile strength',
      contribution: commercialContribution,
      category: 'commercial',
      detail: analysis.commercialProfile.segments.length === 0
        ? 'No commercial targeting segments were inferred.'
        : `${analysis.commercialProfile.segments.length} segment${analysis.commercialProfile.segments.length === 1 ? '' : 's'} inferred` +
          (topSegment ? `, led by "${topSegment.label}" at ${Math.round(topSegment.confidence)}% confidence` : '') + '.',
    },
    {
      label: 'Dependency pattern',
      contribution: dependencyContribution,
      category: 'dependency',
      detail: `Dependency score ${Math.round(analysis.dependency.dependencyScore)}/100 based on frequency, recency and emotional reliance.`,
    },
    {
      label: 'Confessional disclosures',
      contribution: confessionalContribution,
      category: 'confessional',
      detail: confessionalCount === 0
        ? 'No confessional messages were identified.'
        : `${confessionalCount} confessional message${confessionalCount === 1 ? '' : 's'} identified.`,
    },
    {
      label: 'People named',
      contribution: namesContribution,
      category: 'names',
      detail: aiNames.length === 0
        ? 'No individuals were named in identifiable contexts.'
        : `${aiNames.length} individual${aiNames.length === 1 ? '' : 's'} named` +
          (aiNames.length > 0 ? `: ${aiNames.slice(0, 3).map(n => n.name).join(', ')}${aiNames.length > 3 ? ' and others' : ''}` : '') + '.',
    },
    {
      label: 'Message volume',
      contribution: volumeContribution,
      category: 'volume',
      detail: `${analysis.totalUserMessages.toLocaleString('en-GB')} messages written over ${analysis.timespan.days} days.`,
    },
  ];

  const updatedFindings = {
    ...analysis.findings,
    personalInfo: {
      ...analysis.findings.personalInfo,
      names: aiNames,
    },
  };

  // Return a new object — never mutate the input
  return {
    ...analysis,
    messages: enrichedMessages,
    findings: updatedFindings,
    juiciestMoments: aiJuiciest.length > 0 ? aiJuiciest : purgedRegexJuiciest,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI enrichment failed:', err);
    onProgress?.({
      stage: 'failed',
      batchesDone,
      batchesTotal: batches.length,
      messagesEnriched: 0,
      error: message,
    });
    // Fallback preserved — dashboard never breaks if API is down
    return analysis;
  }
}
