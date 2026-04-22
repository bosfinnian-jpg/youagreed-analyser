// ============================================================================
// app/api/enrich/route.ts
// AI enrichment — extracts psychological signals from private messages.
// ============================================================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

interface EnrichRequest {
  messages: {
    id: number;
    text: string;
    hour: number;
    timestamp: number;
  }[];
}

const SYSTEM_PROMPT = `You analyse private AI conversation messages to extract psychological, personal, and behavioural signals. Your output powers a privacy awareness tool — be precise, honest, and calibrated. Underscoring is the most common failure mode.

For each message (identified by its [id]), return a JSON object with exactly these fields:

**is_personal** (boolean)
True if the user writes about their own life, feelings, relationships, health, finances, work, identity, or personal decisions. False for: code/technical help, research questions, writing assistance for external content, general facts. Edge: "help me write a breakup message" = true (their situation). "write me a cold email" = false.

**is_template_or_script** (boolean)
True if the message IS a template/script/prompt for external use — sales scripts, marketing copy, system prompts, email sequences, content with [VARIABLES], ## headers, bold structure. Note: user describing a template ≠ message being a template.

**confessional_score** (0–10 integer)
How much is the user sharing something private, vulnerable, or undisclosed?
0 = Nothing personal. "How do I sort a list?"
2 = Minor personal context. "I work in marketing."
4 = Personal situation, low stakes. "Looking for a new job."
5 = Real personal disclosure. "I've been struggling with motivation lately."
6 = Genuine vulnerability. "I've been really struggling with my relationship."
7 = Something they probably haven't told many people.
8 = Sensitive, private disclosure. "I think I might have depression. Haven't told anyone."
9 = Deep confession. Shame, fear, or something hidden.
10 = Something they are clearly afraid to admit even to themselves.
Don't give 6+ unless the user is genuinely opening up. Most messages are 0–3.

**emotional_intensity** (0–10 integer)
How emotionally charged is the writing? Urgency, distress, fear, grief, anger, despair, elation.
0 = Flat, technical, neutral.
2 = Mild concern or mild positive.
4 = Clearly emotional — worried, frustrated, excited.
6 = Strongly emotional — anxious, hurt, angry, sad.
8 = Acute — panic, grief, rage, despair breaking through the text.
10 = Crisis. The person sounds like they are suffering right now.
Most messages are 0–3. A panic attack message is 8+.

**named_people** (array)
Real people the user refers to by name. Only human, personally known. Include friends, family, partners, colleagues, doctors. Exclude celebrities, fictional characters, brands.
Each: { name: string, relationship: string|null }. Relationship examples: "girlfriend", "mum", "boss", "friend", null.

**life_events** (array, use ONLY these exact strings)
["job_loss", "job_search", "relationship_end", "relationship_start", "financial_distress", "mental_health", "health_concern", "bereavement", "identity_crisis", "moving_home", "new_baby", "wedding", "legal_issue"]
Only include if clearly happening to this user now or recently, not abstract mention.

**sensitive_topics** (array, use ONLY these exact strings when clearly present)
["anxiety", "depression", "self_harm", "addiction", "eating_disorder", "trauma", "abuse", "sexuality", "gender_identity", "chronic_illness", "debt", "poverty", "loneliness", "suicidal_ideation", "relationship_abuse", "infidelity", "criminal_record", "immigration_status", "miscarriage", "fertility", "bereavement"]

**psychological_signals** (array, use ONLY these exact strings when clearly evidenced)
["attachment_anxiety", "attachment_avoidant", "perfectionism", "imposter_syndrome", "people_pleasing", "catastrophising", "rumination", "emotional_dysregulation", "low_self_worth", "validation_seeking", "codependency", "abandonment_fear", "trust_issues", "social_anxiety", "grief_unprocessed"]
Only include if clearly evidenced in this specific message, not inferred from type alone.

**inferred_beliefs** (array of short strings, max 3, max 8 words each)
The underlying beliefs about self or world this message reveals. Examples: "I am fundamentally unlovable", "I must earn my place", "People will leave if they see the real me", "I am responsible for others' emotions". Only when clearly evidenced. Empty array if nothing clear.

**most_revealing_excerpt** (string, max 200 chars)
The single most personally revealing sentence or phrase. If not personal, return "". Choose what would be most uncomfortable if read by a stranger or employer.

**topic** (string, max 6 words)
Short neutral label. Examples: "anxiety about upcoming job interview", "processing breakup with girlfriend", "python debugging help", "cold email template".

Return ONLY a valid JSON array, one object per message, preserving id order. No preamble, no markdown fences, no explanation.`;

async function callClaude(apiKey: string, messages: EnrichRequest['messages']): Promise<any[]> {
  const userContent = messages
    .map(m => `[${m.id}] hour:${m.hour} | ${m.text.substring(0, 900)}`)
    .join('\n\n---\n\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const textContent = data?.content?.[0]?.text?.trim() || '';
  const cleaned = textContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error(`Failed to parse response: ${cleaned.substring(0, 200)}`);
  }

  if (!Array.isArray(parsed)) throw new Error('Response was not an array');
  return parsed;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

  try {
    const body: EnrichRequest = await request.json();
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }
    if (body.messages.length > 30) {
      return NextResponse.json({ error: 'Batch too large. Max 30.' }, { status: 400 });
    }

    const enrichments = await callClaude(apiKey, body.messages);
    return NextResponse.json({ enrichments });
  } catch (err: any) {
    console.error('Enrichment error:', err);
    return NextResponse.json({ error: err.message || 'Enrichment failed' }, { status: 500 });
  }
}
