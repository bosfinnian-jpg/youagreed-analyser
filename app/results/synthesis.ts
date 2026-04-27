// ============================================================================
// synthesis.ts - client-side caller for /api/synthesize
// Runs after per-message enrichment. One call. Produces the intelligence briefing.
// ============================================================================

import type { DeepAnalysis } from './deepParser';
import type { MessageEnrichment } from './aiEnrichment';

export interface Synthesis {
  characterSummary: string;
  demographicPredictions: Array<{
    attribute: string;
    value: string;
    confidence: number;
    evidence: string;
  }>;
  verbalTells: Array<{
    tell: string;
    meaning: string;
    frequency: string;
  }>;
  predictedBehaviours: Array<{
    behaviour: string;
    likelihood: 'High' | 'Medium' | 'Low' | string;
    evidence: string;
  }>;
  commercialTargets: Array<{
    brand: string;
    category: string;
    why: string;
  }>;
  recurringConcerns: Array<{
    concern: string;
    evidence: string;
  }>;
  unintentionalDisclosures: Array<{
    disclosure: string;
    via: string;
  }>;
  inferredCoreBeliefs: string[];
  generatedAt: number;
}

// Select top N most revealing excerpts from the enriched corpus
function selectTopExcerpts(
  analysis: DeepAnalysis,
  enrichments: MessageEnrichment[],
  limit = 40
): Array<{
  excerpt: string;
  hour: number;
  confessionalScore: number;
  emotionalIntensity: number;
  topic: string;
  daysSinceFirst: number;
}> {
  const firstTs = analysis.messages[0]?.timestamp || Date.now() / 1000;

  const ranked = enrichments
    .filter(e => e.is_personal && !e.is_template_or_script)
    .map(e => {
      const msg = analysis.messages[e.id];
      if (!msg) return null;

      // Composite score for "revealing-ness"
      const score =
        e.confessional_score * 1.8 +
        e.emotional_intensity * 1.2 +
        (e.sensitive_topics?.length || 0) * 2 +
        (e.inferred_beliefs?.length || 0) * 1.5 +
        (msg.hour >= 0 && msg.hour <= 4 ? 2.5 : 0) +
        Math.min(2, Math.log2(Math.max(msg.wordCount, 10) / 10));

      return {
        score,
        data: {
          excerpt: e.most_revealing_excerpt?.length > 20 ? e.most_revealing_excerpt : msg.text.substring(0, 500),
          hour: msg.hour,
          confessionalScore: e.confessional_score,
          emotionalIntensity: e.emotional_intensity,
          topic: e.topic || 'general',
          daysSinceFirst: Math.round((msg.timestamp - firstTs) / 86400),
        },
      };
    })
    .filter(Boolean) as Array<{ score: number; data: any }>;

  ranked.sort((a, b) => b.score - a.score);

  // Deduplicate by excerpt similarity - don't send 40 near-identical messages
  const chosen: typeof ranked = [];
  const seen = new Set<string>();

  for (const r of ranked) {
    const fingerprint = r.data.excerpt.substring(0, 60).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    chosen.push(r);
    if (chosen.length >= limit) break;
  }

  return chosen.map(r => r.data);
}

function aggregateSignalCounts(enrichments: MessageEnrichment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of enrichments) {
    if (!e.is_personal || e.is_template_or_script) continue;
    for (const sig of (e.psychological_signals || [])) {
      counts[sig] = (counts[sig] || 0) + 1;
    }
  }
  return counts;
}

function getDominantTimeOfDay(hourDistribution: number[]): string {
  const buckets = [
    { label: 'Late night (12am-5am)', range: [0, 5] },
    { label: 'Morning (6am-11am)', range: [6, 11] },
    { label: 'Afternoon (12pm-5pm)', range: [12, 17] },
    { label: 'Evening (6pm-11pm)', range: [18, 23] },
  ];
  const counts = buckets.map(b => {
    let sum = 0;
    for (let h = b.range[0]; h <= b.range[1]; h++) sum += hourDistribution[h] || 0;
    return sum;
  });
  return buckets[counts.indexOf(Math.max(...counts))].label;
}

export async function runSynthesis(
  analysis: DeepAnalysis,
  enrichments: MessageEnrichment[]
): Promise<Synthesis | null> {
  const topExcerpts = selectTopExcerpts(analysis, enrichments, 35);
  if (topExcerpts.length < 5) return null; // not enough signal

  const payload = {
    aggregateStats: {
      totalMessages: analysis.totalUserMessages,
      timespanDays: analysis.timespan.days,
      avgMessageLength: analysis.rawStats.avgMessageLength,
      nighttimeRatio: analysis.nighttimeRatio,
      avgAnxiety: analysis.avgAnxiety,
      avgIntimacy: analysis.avgIntimacy,
      emotionalTrend: analysis.emotionalTimeline.emotionalTrend,
      peakHour: analysis.peakHour,
      dominantTimeOfDay: getDominantTimeOfDay(analysis.hourDistribution),
    },
    detectedLifeEvents: analysis.lifeEvents.map(e => ({
      label: e.label,
      severity: e.severity,
      approximateDate: e.approximateDate,
    })),
    commercialSegments: analysis.commercialProfile.segments.map(s => ({
      label: s.label,
      confidence: s.confidence,
    })),
    recurringThemes: (analysis.findings.repetitiveThemes || []).map((t: any) => t.theme).slice(0, 10),
    topicsByPeriod: analysis.topicsByPeriod,
    topExcerpts,
    aiSignalCounts: aggregateSignalCounts(enrichments),
    namedRelationships: (analysis.findings.personalInfo.names || []).slice(0, 10).map((n: any) => ({
      name: n.name,
      relationship: n.relationship || null,
      mentions: n.mentions || 1,
    })),
  };

  try {
    const response = await fetch('/api/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Synthesis call failed:', await response.text());
      return null;
    }

    const data = await response.json();
    if (!data.synthesis) return null;

    return {
      ...data.synthesis,
      generatedAt: Date.now(),
    } as Synthesis;
  } catch (err) {
    console.error('Synthesis threw:', err);
    return null;
  }
}
