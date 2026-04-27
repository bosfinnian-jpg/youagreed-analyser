// ============================================================================
// app/api/synthesize/route.ts
// Produces a final psychological + commercial portrait from the enriched corpus.
// This is the synthesis pass - one call that reads the most revealing
// excerpts together and writes the character briefing.
// ============================================================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

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
  };
  detectedLifeEvents: Array<{ label: string; severity: string; approximateDate: string }>;
  commercialSegments: Array<{ label: string; confidence: number }>;
  recurringThemes: string[];
  topicsByPeriod: { early: string[]; mid: string[]; recent: string[] };
  topExcerpts: Array<{
    excerpt: string;
    hour: number;
    confessionalScore: number;
    emotionalIntensity: number;
    topic: string;
    daysSinceFirst: number;
  }>;
  aiSignalCounts: Record<string, number>;
  namedRelationships: Array<{ name: string; relationship: string | null; mentions: number }>;
}

const SYSTEM_PROMPT = `You are a forensic analyst producing an intelligence briefing on an individual based on a corpus of their private AI conversation messages. Your job is to write what can be inferred about this person with specificity and evidence, in the manner of a security-cleared analyst writing for an internal audience. This is used in a privacy awareness tool - the person will read the briefing about themselves, and it must be accurate enough to feel uncomfortably real.

RULES:
1. Specificity over generality. "High-achieving perfectionist in a transitional life period" not "experiences stress".
2. Every claim must be grounded in the data. If you cannot point to evidence, do not make the claim.
3. No sycophancy. No softening. No therapeutic framing. This is a briefing, not a counselling session.
4. British English spelling throughout.
5. No disclaimers, no "it seems", no "possibly". If the signal is weak, omit. If strong, state.
6. Do not use the second person ("you"). Write about "the subject" or use their inferred role/identity.
7. Do not moralise. Describe, do not judge.

You will receive: aggregate statistics, detected life events, commercial segments, recurring themes, topic evolution over time, a set of the most revealing message excerpts, counts of psychological signals, and named people.

Return a JSON object with EXACTLY these fields:

{
  "characterSummary": "A 180-260 word paragraph. Opens with a single declarative sentence that names who the subject is (their life-stage, role, or dominant preoccupation). Continues with 3-5 further sentences that describe their emotional architecture, recurring concerns, coping patterns, and what they are currently navigating. Closes with a sentence that states what makes this profile commercially or psychographically valuable. Do NOT use bullet points. Write it as continuous prose. Forensic tone.",
  
  "demographicPredictions": [
    { "attribute": "Age range", "value": "e.g. '28-34' or 'Late twenties'", "confidence": 0-100, "evidence": "Specific evidence chain - cite topics, themes, or language markers" }
  ],
  // Include 4-7 predictions across: age, education level, income bracket, relationship status, employment status, urban/suburban/rural, political orientation if clearly signalled, parental status, health status. Only include if confidence >= 40.

  "verbalTells": [
    { "tell": "the exact phrase or pattern the subject uses", "meaning": "what this reveals psychologically", "frequency": "approximate count or 'recurring'" }
  ],
  // Identify 3-6 recurring phrases, hedges, self-framings, or linguistic tics from the excerpts. Examples: "I don't know if this makes sense but", "I always", "I'm probably overthinking this". Each should reveal something about self-perception or cognitive pattern.

  "predictedBehaviours": [
    { "behaviour": "Specific near-future behaviour", "likelihood": "High/Medium/Low", "evidence": "why this is likely" }
  ],
  // 4-6 predictions about what the subject is likely to do, buy, worry about, or disclose in the coming weeks. Be specific: "Will research therapy options" not "will seek help". "Will apply for 10+ more jobs this month" not "continues job searching".

  "commercialTargets": [
    { "brand": "Specific real brand or product name", "category": "e.g. 'Online therapy'", "why": "Single sentence - why this subject fits their targeting criteria" }
  ],
  // 5-8 real, specific brands that would target this profile. Use actual product names: Hinge, Talkspace, BetterHelp, Headspace, Masterclass, Klarna, Monzo, LinkedIn Premium, Calm, Ritual, Noom, Hims, Wealthfront, etc. Match brands to the subject's actual inferred segments and life stage.

  "recurringConcerns": [
    { "concern": "The specific preoccupation", "evidence": "how often or how it manifests" }
  ],
  // 3-5 things the subject keeps returning to across conversations. Not topics ("work") - concerns ("whether they're being taken advantage of at work").

  "unintentionalDisclosures": [
    { "disclosure": "What they revealed without realising they were revealing it", "via": "Through what they wrote - brief quote or paraphrase" }
  ],
  // 3-5 things the subject disclosed incidentally. Examples: a salary mentioned in passing while asking for budget advice, an address inferred from a commute question, a mental health condition implied by a medication name, grief implied by a date they wouldn't forget. The most devastating section - surface what they gave away by accident.

  "inferredCoreBeliefs": [
    "The underlying belief about self or the world that the subject's writing reveals"
  ]
  // 3-6 statements. First person. Examples: "I must earn my right to exist", "If I stop working I will be exposed", "People will leave if they see the real me". Short, first-person, uncomfortable, evidenced.
}

Return ONLY valid JSON. No preamble, no markdown fences, no commentary outside the JSON.`;

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

  sections.push(`## AGGREGATE BEHAVIOURAL STATISTICS
Total user messages: ${aggregateStats.totalMessages.toLocaleString()}
Timespan: ${aggregateStats.timespanDays} days
Average message length: ${aggregateStats.avgMessageLength} characters
Nighttime (12am-5am) ratio: ${(aggregateStats.nighttimeRatio * 100).toFixed(1)}%
Peak usage hour: ${aggregateStats.peakHour}:00
Dominant time of day: ${aggregateStats.dominantTimeOfDay}
Average anxiety score across corpus: ${aggregateStats.avgAnxiety.toFixed(2)}/10
Average intimacy score: ${aggregateStats.avgIntimacy.toFixed(2)}/10
Emotional trend over time: ${aggregateStats.emotionalTrend}`);

  if (detectedLifeEvents.length > 0) {
    sections.push(`## DETECTED LIFE EVENTS
${detectedLifeEvents.map(e => `- ${e.label} (${e.severity} severity, approx ${e.approximateDate})`).join('\n')}`);
  }

  if (commercialSegments.length > 0) {
    sections.push(`## INFERRED COMMERCIAL SEGMENTS
${commercialSegments.map(s => `- ${s.label} (${s.confidence}% confidence)`).join('\n')}`);
  }

  if (Object.keys(aiSignalCounts).length > 0) {
    const sigs = Object.entries(aiSignalCounts).sort((a, b) => b[1] - a[1]);
    sections.push(`## PSYCHOLOGICAL SIGNALS (count across messages)
${sigs.map(([sig, n]) => `- ${sig}: ${n}`).join('\n')}`);
  }

  if (recurringThemes.length > 0) {
    sections.push(`## RECURRING THEMES
${recurringThemes.join(', ')}`);
  }

  sections.push(`## TOPIC EVOLUTION OVER TIME
Early period: ${topicsByPeriod.early.join(', ') || '-'}
Middle period: ${topicsByPeriod.mid.join(', ') || '-'}
Recent period: ${topicsByPeriod.recent.join(', ') || '-'}`);

  if (namedRelationships.length > 0) {
    sections.push(`## NAMED INDIVIDUALS IN SUBJECT'S LIFE
${namedRelationships.slice(0, 10).map(n => `- ${n.name}${n.relationship ? ` (${n.relationship})` : ''}: ${n.mentions} mentions`).join('\n')}`);
  }

  sections.push(`## TOP ${topExcerpts.length} MOST REVEALING MESSAGE EXCERPTS
Each excerpt includes hour (24h), confessional score (0-10), emotional intensity (0-10), topic label, and days since first message.

${topExcerpts.map((ex, i) => `[${i + 1}] hour:${ex.hour} | conf:${ex.confessionalScore} | emo:${ex.emotionalIntensity} | day:${ex.daysSinceFirst} | topic: ${ex.topic}
"${ex.excerpt.substring(0, 500)}"`).join('\n\n---\n\n')}`);

  sections.push(`## YOUR TASK
Produce the JSON briefing as specified. Be specific, evidenced, forensic. No hedging.`);

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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
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
