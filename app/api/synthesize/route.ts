// ============================================================================
// app/api/synthesize/route.ts
// Produces a final psychological + commercial portrait from the enriched corpus.
// One call. Reads the most revealing excerpts together and writes the briefing.
// Uses Sonnet — this is the most important inference pass in the system.
// ============================================================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 90;

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

const SYSTEM_PROMPT = `You are a forensic data analyst producing an intelligence briefing on an individual based solely on their private AI conversation history. Your analysis powers a privacy awareness installation — the subject will read this briefing about themselves, and it must be specific enough to feel uncomfortably accurate.

PRINCIPLES:
1. Specificity is everything. Generic observations are failures. "Experiencing anxiety" is a failure. "Recurring preoccupation with whether they are performing adequately at work, surfacing most acutely between midnight and 3am" is the target.
2. Evidence chains are mandatory. Every claim must trace to something in the data — a quote, a pattern, a frequency, a time signal. If you cannot trace it, omit it.
3. No therapeutic framing. No softening. No "it appears" or "this may suggest". You are an analyst, not a counsellor. State or omit.
4. British English throughout.
5. Write about "the subject" — never "you" (the subject reads this in the third person, which makes it more unsettling).
6. Do not moralise. Describe with clinical precision.
7. The most valuable section is unintentionalDisclosures — what they gave away without realising. Prioritise finding these above all else.
8. For commercialTargets: use real, specific, currently operating brands. Match them precisely to the inferred profile. Not generic categories — actual products the subject would see advertised.

You will receive the subject's most revealing message excerpts FIRST (they are the primary evidence), followed by aggregate statistics and inferred signals.

Return a JSON object with EXACTLY these fields:

{
  "characterSummary": "180–260 words. Single-paragraph continuous prose. Opens with one declarative sentence naming who this person is at this point in their life — their dominant preoccupation, life stage, or psychological state. Not a list of attributes. A portrait. Continues with 4–6 further sentences covering: what they are navigating, their emotional architecture, their recurring pattern of thought, what they have disclosed across this corpus, and what makes this profile commercially or psychographically significant. Closes with a sentence about permanence or irreversibility. Forensic tone throughout. No bullet points. No hedging.",

  "demographicPredictions": [
    {
      "attribute": "Age range",
      "value": "e.g. '26–33' or 'Late twenties to early thirties'",
      "confidence": 0–100,
      "evidence": "Specific evidence — cite actual topics, phrases, life stages, cultural references from the excerpts"
    }
  ],
  // 4–8 predictions. Cover: age, education level, income bracket or financial situation, relationship status, employment status, urban/suburban location, parental status if signalled, health status. Only include if confidence >= 40. Derive from the actual excerpts — not from generic demographic modelling.

  "verbalTells": [
    {
      "tell": "The exact phrase, hedge, or pattern from the messages",
      "meaning": "What this reveals about self-perception or cognitive pattern",
      "frequency": "Approximate frequency or 'consistent throughout'"
    }
  ],
  // 3–6 specific linguistic patterns from the actual excerpts. Examples: "I probably shouldn't say this but", "I always end up", "I don't know if this is stupid but". Each should reveal a psychological mechanism — not just describe a speech habit.

  "predictedBehaviours": [
    {
      "behaviour": "Specific near-future behaviour",
      "likelihood": "High | Medium | Low",
      "evidence": "Why this is likely, citing specific signals"
    }
  ],
  // 4–6 predictions. Specific: "Will begin researching therapy options within the next month" not "may seek support". "Will apply for at least 8 more roles this month" not "continuing job search". Ground each in the data.

  "commercialTargets": [
    {
      "brand": "Specific real brand or product name",
      "category": "e.g. 'Online therapy' or 'Dating app'",
      "why": "One sentence: why this subject's inferred profile matches this brand's targeting criteria"
    }
  ],
  // 5–8 entries. Use real, specific, currently operating brands with evidence-based reasoning. Examples: Hinge, Talkspace, BetterHelp, Headspace, Calm, LinkedIn Premium, Klarna, Monzo, Noom, Hims, Ritual, Wealthfront, MindDoc, Bumble, Duolingo, Coursera, Peloton, Zoe, Sanctus. Match to the subject's actual inferred life circumstances, not just their segment labels.

  "recurringConcerns": [
    {
      "concern": "The specific preoccupation — not a topic but a worry",
      "evidence": "How often it surfaces and in what form"
    }
  ],
  // 3–5 entries. Not "work" — "whether they are being perceived as competent". Not "relationships" — "fear of abandonment by a specific person". Extract the actual anxiety underneath the surface topic.

  "unintentionalDisclosures": [
    {
      "disclosure": "What they revealed without realising they were revealing it",
      "via": "The specific phrase or context that revealed it — quote directly where possible"
    }
  ],
  // 4–6 entries. This is the most important section. Surface what they gave away by accident:
  // — A salary or income level implied by a budgeting question
  // — A location inferred from a commute duration or local reference
  // — A mental health condition implied by a medication name or dosage question
  // — A relationship status change implied by a change in how they refer to someone
  // — A significant date they mentioned that reveals something personal
  // — A debt amount, legal situation, or health condition disclosed in passing
  // The more specific and verifiable, the better. "They appear to earn approximately £35–45k" beats "they have financial concerns".

  "inferredCoreBeliefs": [
    "First-person statement of the underlying belief this writing reveals"
  ]
  // 4–6 statements. First-person. Short, specific, uncomfortable. Evidenced in the writing.
  // Examples: "I must perform competence at all times or people will see through me",
  // "If I stop being useful, I will be abandoned", "I am fundamentally harder to love than other people",
  // "My anxiety is evidence of weakness rather than circumstance".
  // These should feel uncomfortably accurate — not generic affirmations.
}

Return ONLY valid JSON. No preamble. No markdown fences. No commentary outside the JSON object.`;

function buildUserPrompt(data: SynthesizeRequest): string {
  const {
    aggregateStats,
    detectedLifeEvents,
    commercialSegments,
    recurringThemes,
    topicsByPeriod,
    topExcerpts,
    aiSignalCounts,
    namedRelationships,
  } = data;

  const sections: string[] = [];

  // ── LEAD WITH THE EXCERPTS — this is the primary evidence ──────────────────
  sections.push(`## PRIMARY EVIDENCE — ${topExcerpts.length} MOST REVEALING MESSAGES
These are the subject's own words, ranked by revealing-ness. Read these first.
Each entry: hour (24h clock) | confessional score (0–10) | emotional intensity (0–10) | day since first message | topic | sensitive topics flagged

${topExcerpts.map((ex, i) => {
  const sensitiveStr = ex.sensitiveTopics && ex.sensitiveTopics.length > 0
    ? ` | sensitive: ${ex.sensitiveTopics.join(', ')}`
    : '';
  const signalsStr = ex.psychologicalSignals && ex.psychologicalSignals.length > 0
    ? ` | signals: ${ex.psychologicalSignals.join(', ')}`
    : '';
  const namedStr = ex.namedPeople && ex.namedPeople.length > 0
    ? ` | named: ${ex.namedPeople.map(p => p.name + (p.relationship ? ` (${p.relationship})` : '')).join(', ')}`
    : '';
  // Use fullText if available (full message), fall back to excerpt
  const messageText = ex.fullText && ex.fullText.length > ex.excerpt.length ? ex.fullText : ex.excerpt;
  return `[${i + 1}] ${ex.hour}:00 | conf:${ex.confessionalScore} | emo:${ex.emotionalIntensity} | day:${ex.daysSinceFirst} | ${ex.topic}${sensitiveStr}${signalsStr}${namedStr}

"${messageText.substring(0, 1200)}"`;
}).join('\n\n---\n\n')}`);

  // ── NAMED PEOPLE ─────────────────────────────────────────────────────────
  if (namedRelationships.length > 0) {
    sections.push(`## NAMED INDIVIDUALS IN SUBJECT'S LIFE
${namedRelationships.slice(0, 12).map(n => `- ${n.name}${n.relationship ? ` (${n.relationship})` : ''}: ${n.mentions} mention${n.mentions > 1 ? 's' : ''}`).join('\n')}`);
  }

  // ── AGGREGATE STATS ───────────────────────────────────────────────────────
  sections.push(`## AGGREGATE BEHAVIOURAL STATISTICS
Total messages: ${aggregateStats.totalMessages.toLocaleString()}
Timespan: ${aggregateStats.timespanDays} days (${Math.round(aggregateStats.timespanDays / 30)} months)
Average message length: ${aggregateStats.avgMessageLength} characters
Nighttime ratio (midnight–5am): ${(aggregateStats.nighttimeRatio * 100).toFixed(1)}%
Peak hour: ${aggregateStats.peakHour}:00
Dominant period: ${aggregateStats.dominantTimeOfDay}
Average anxiety score: ${aggregateStats.avgAnxiety.toFixed(2)}/10
Average intimacy score: ${aggregateStats.avgIntimacy.toFixed(2)}/10
Emotional trend over time: ${aggregateStats.emotionalTrend}
Crisis periods detected: ${aggregateStats.crisisPeriods ?? '—'}
Dependency score: ${aggregateStats.dependencyScore ?? '—'}/100
Dependency trajectory: ${aggregateStats.dependencyTrajectory ?? '—'}
Intimacy trajectory: ${aggregateStats.intimacyTrajectory ?? '—'}`);

  // ── PSYCHOLOGICAL PORTRAIT (regex-derived baseline) ───────────────────────
  if (aggregateStats.psychologicalPortrait) {
    const p = aggregateStats.psychologicalPortrait;
    const portraitLines = [
      p.attachmentStyle ? `Attachment: ${p.attachmentStyle}` : null,
      `Emotional baseline: ${p.emotionalBaselineLabel}`,
      p.selfPerceptionThemes?.length ? `Self-perception themes: ${p.selfPerceptionThemes.join(', ')}` : null,
      p.dominantNarrative ? `Dominant narrative: ${p.dominantNarrative}` : null,
      p.primaryCopingMechanism ? `Coping mechanism: ${p.primaryCopingMechanism}` : null,
      p.writingVoice ? `Writing voice: ${p.writingVoice}` : null,
    ].filter(Boolean);
    if (portraitLines.length > 0) {
      sections.push(`## BASELINE PSYCHOLOGICAL PORTRAIT (pattern-derived)
${portraitLines.join('\n')}`);
    }
  }

  // ── LIFE EVENTS ───────────────────────────────────────────────────────────
  if (detectedLifeEvents.length > 0) {
    sections.push(`## DETECTED LIFE EVENTS
${detectedLifeEvents.map(e => `- ${e.label} (${e.severity} severity, approx. ${e.approximateDate})`).join('\n')}`);
  }

  // ── COMMERCIAL SEGMENTS ───────────────────────────────────────────────────
  if (commercialSegments.length > 0) {
    sections.push(`## INFERRED COMMERCIAL SEGMENTS
${commercialSegments.map(s => `- ${s.label} (${s.confidence}% confidence)`).join('\n')}`);
  }

  // ── PSYCHOLOGICAL SIGNALS ─────────────────────────────────────────────────
  const sigEntries = Object.entries(aiSignalCounts).sort((a, b) => b[1] - a[1]).filter(([, n]) => n >= 2);
  if (sigEntries.length > 0) {
    sections.push(`## PSYCHOLOGICAL SIGNALS (frequency across messages)
${sigEntries.map(([sig, n]) => `- ${sig}: ${n} messages`).join('\n')}`);
  }

  // ── TOPIC EVOLUTION ───────────────────────────────────────────────────────
  sections.push(`## TOPIC EVOLUTION OVER TIME
Early period: ${topicsByPeriod.early.join(', ') || '—'}
Middle period: ${topicsByPeriod.mid.join(', ') || '—'}
Recent period: ${topicsByPeriod.recent.join(', ') || '—'}
Recurring themes: ${recurringThemes.join(', ') || '—'}`);

  sections.push(`## YOUR TASK
Produce the JSON briefing. Be specific. Be evidenced. Be forensic. The subject will read this about themselves. Make it accurate enough to be uncomfortable.`);

  return sections.join('\n\n');
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
      max_tokens: 5000,
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
    const synthesis = await callClaude(apiKey, userPrompt);

    return NextResponse.json({ synthesis });
  } catch (err: any) {
    console.error('Synthesis error:', err);
    return NextResponse.json({ error: err.message || 'Synthesis failed' }, { status: 500 });
  }
}
