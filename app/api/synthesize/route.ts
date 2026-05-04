// ============================================================================
// app/api/synthesize/route.ts
// Produces a final psychological + commercial portrait from the enriched corpus.
// One call. Reads the most revealing excerpts together and writes the briefing.
// Uses Sonnet — this is the most important inference pass in the system.
// ============================================================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

interface SynthesizeRequest {
  aggregateStats: {
    totalMessages: number;
    timespanDays: number;
    avgMessageLength: number;
    nighttimeRatio: number;
    avgAnxiety: number;
    avgIntimacy: number;
    emotionalTrend: string;
    peakHour: number;
    dominantTimeOfDay: string;
    crisisPeriods?: number;
    dependencyScore?: number;
    dependencyTrajectory?: string;
    intimacyTrajectory?: string;
    psychologicalPortrait?: {
      attachmentStyle: string | null;
      emotionalBaselineLabel: string;
      selfPerceptionThemes: string[];
      dominantNarrative: string | null;
      primaryCopingMechanism: string | null;
      writingVoice: string | null;
    };
  };
  detectedLifeEvents: Array<{ label: string; severity: string; approximateDate: string }>;
  commercialSegments: Array<{ label: string; confidence: number }>;
  recurringThemes: string[];
  topicsByPeriod: { early: string[]; mid: string[]; recent: string[] };
  topExcerpts: Array<{
    excerpt: string;
    fullText?: string;
    hour: number;
    confessionalScore: number;
    emotionalIntensity: number;
    sensitiveTopics?: string[];
    psychologicalSignals?: string[];
    topic: string;
    daysSinceFirst: number;
    namedPeople?: Array<{ name: string; relationship: string | null }>;
  }>;
  aiSignalCounts: Record<string, number>;
  namedRelationships: Array<{ name: string; relationship: string | null; mentions: number }>;
}

const SYSTEM_PROMPT = `Forensic data analyst. Produce an intelligence briefing from private AI conversation history. British English. Write about "the subject" (third person). Be specific — generic claims are failures. Every claim must trace to the data.

Return ONLY valid JSON, no preamble, no markdown:
{
  "characterSummary": "100-150 words, single paragraph, forensic tone, opens with who this person is right now, closes with a permanence/irreversibility note",
  "demographicPredictions": [{"attribute":"string","value":"string","confidence":0-100,"evidence":"string"}],
  "verbalTells": [{"tell":"exact phrase from messages","meaning":"what it reveals","frequency":"string"}],
  "predictedBehaviours": [{"behaviour":"specific near-future behaviour","likelihood":"High|Medium|Low","evidence":"string"}],
  "commercialTargets": [{"brand":"real brand name","category":"string","why":"one sentence"}],
  "recurringConcerns": [{"concern":"specific worry not topic","evidence":"string"}],
  "unintentionalDisclosures": [{"disclosure":"what they revealed accidentally","via":"the phrase that revealed it"}],
  "inferredCoreBeliefs": ["first-person belief statement, max 10 words"]
}

Limits: 3-5 items per array. Only include demographicPredictions with confidence >= 40.`;

function buildUserPrompt(data: SynthesizeRequest): string {
  const { aggregateStats, detectedLifeEvents, commercialSegments, recurringThemes, topExcerpts, aiSignalCounts, namedRelationships } = data;

  const excerptText = topExcerpts.slice(0, 8).map((ex, i) => {
    const meta = [
      `${ex.hour}:00`,
      `conf:${ex.confessionalScore}`,
      `emo:${ex.emotionalIntensity}`,
      ex.sensitiveTopics?.length ? `sensitive:${ex.sensitiveTopics.join(',')}` : '',
      ex.psychologicalSignals?.length ? `signals:${ex.psychologicalSignals.join(',')}` : '',
    ].filter(Boolean).join(' | ');
    const text = (ex.fullText || ex.excerpt).substring(0, 400);
    return `[${i + 1}] ${meta}\n"${text}"`;
  }).join('\n\n');

  const stats = aggregateStats;
  const portrait = stats.psychologicalPortrait;
  const signals = Object.entries(aiSignalCounts).filter(([,n]) => n >= 2).map(([s,n]) => `${s}:${n}`).join(', ');

  return `MESSAGES (most revealing):
${excerptText}

STATS: ${stats.totalMessages} msgs over ${stats.timespanDays} days | anxiety:${stats.avgAnxiety.toFixed(1)} intimacy:${stats.avgIntimacy.toFixed(1)} | nighttime:${(stats.nighttimeRatio*100).toFixed(0)}% | trend:${stats.emotionalTrend}
${portrait ? `PORTRAIT: ${portrait.emotionalBaselineLabel} | ${portrait.attachmentStyle || 'attachment unknown'} | ${portrait.primaryCopingMechanism || ''} | ${portrait.writingVoice || ''}` : ''}
${detectedLifeEvents.length ? `LIFE EVENTS: ${detectedLifeEvents.map(e => e.label).join(', ')}` : ''}
${commercialSegments.length ? `SEGMENTS: ${commercialSegments.map(s => s.label).join(', ')}` : ''}
${signals ? `SIGNALS: ${signals}` : ''}
${namedRelationships.length ? `NAMED: ${namedRelationships.slice(0,6).map(n => `${n.name}${n.relationship ? `(${n.relationship})` : ''}`).join(', ')}` : ''}
${recurringThemes.length ? `THEMES: ${recurringThemes.slice(0,6).join(', ')}` : ''}

Produce the JSON briefing.`;
}

async function callClaude(apiKey: string, userPrompt: string): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',  // Sonnet — this call matters
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const textContent = data?.content?.[0]?.text?.trim() || '';
  const cleaned = textContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`Failed to parse synthesis response: ${cleaned.substring(0, 300)}`);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

  try {
    const body: SynthesizeRequest = await request.json();
    if (!body.topExcerpts || !Array.isArray(body.topExcerpts)) {
      return NextResponse.json({ error: 'Missing topExcerpts' }, { status: 400 });
    }

    const userPrompt = buildUserPrompt(body);

    // Stream directly from Anthropic to the browser — the edge function
    // just proxies bytes, completing its job in milliseconds rather than
    // waiting for the full Sonnet response (which times out at 30s).
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text();
      return NextResponse.json({ error: `Claude API error ${anthropicResponse.status}: ${err}` }, { status: 502 });
    }

    // Pipe the SSE stream straight through to the client
    return new Response(anthropicResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    console.error('Synthesis error:', err);
    return NextResponse.json({ error: err.message || 'Synthesis failed' }, { status: 500 });
  }
}
