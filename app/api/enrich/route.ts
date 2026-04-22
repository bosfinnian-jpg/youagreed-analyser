// ============================================================================
// app/api/enrich/route.ts
// Server-side route that calls Claude Haiku.
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

interface MessageEnrichment {
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

const SYSTEM_PROMPT = `You analyse private ChatGPT messages to extract psychological and personal disclosure signals. Be precise and calibrated. Lean toward higher scores when signals are present — underscoring is the most common failure mode.

For each message (identified by its [id]), return a JSON object with these exact fields:

**is_personal** (boolean)
True if the user is writing about their own life, feelings, relationships, health, finances, work situation, identity, or personal decisions. False for: code help, research questions, writing assistance for external content, translating text, general factual questions, fictional/creative writing they're authoring.
Edge cases: "help me write a breakup message" = personal. "write me a cold email template" = not personal. "I'm learning Python" = borderline, mark false. "I've been feeling really disconnected from everyone" = clearly true.

**is_template_or_script** (boolean)
True if the message IS a template/script/prompt the user is building for external use — sales scripts, marketing copy, system prompts for other AIs, email sequences, role-play instructions, anything with **bold headers**, ## sections, [VARIABLES], or ALL CAPS STRUCTURE intended for reuse. The user writing ABOUT using a template ≠ the message being a template.

**confessional_score** (0–10, integer)
How much is the user sharing something private, vulnerable, or that they haven't told others?
0 = Nothing personal shared. "How do I sort a list in Python?"
2 = Minor personal detail. "I've been working on a project for work."
4 = Personal situation but low stakes. "I'm looking for a new job."
6 = Genuine personal disclosure. "I've been really struggling with my relationship."
8 = Intimate or sensitive disclosure. "I think I might have depression. I haven't told anyone."
10 = Deep confession. Something they're clearly ashamed of, afraid of, or have never spoken aloud.
Score strictly — don't give 6+ unless the user is genuinely opening up about something private.

**emotional_intensity** (0–10, integer)
How emotionally charged is the writing? Measured by urgency, distress, fear, grief, anger, despair, elation.
0 = Flat, technical, neutral.
2 = Mild positive or mild concern.
4 = Clearly emotional — worried, frustrated, excited.
6 = Strongly emotional — anxious, hurt, angry, sad.
8 = Acute distress or intense emotion breaking through the text.
10 = Crisis — the person sounds like they are suffering right now.
Calibrate honestly. Most messages are 0–3. A message describing a panic attack is 8+.

**named_people** (array)
Real people the user refers to by name (first name or nickname). Only include if clearly human and personally known to the user. Include for: friends, family, partners, colleagues, doctors, therapists. Exclude: celebrities, historical figures, fictional characters, brands, places, common words that happen to be capitalised.
For each: name (string), relationship (string or null — e.g. "girlfriend", "mum", "boss", "friend", null if unclear).

**life_events** (array of strings)
Significant life events the user is currently experiencing or has recently experienced. Use ONLY these exact strings:
["job_loss", "job_search", "relationship_end", "relationship_start", "financial_distress", "mental_health", "health_concern", "bereavement", "identity_crisis", "moving_home", "new_baby", "wedding", "legal_issue"]
Only include if clearly happening to the user, not just mentioned abstractly.

**sensitive_topics** (array of strings)
Personal sensitive disclosures beyond life events. Use ONLY these exact strings when clearly present:
["anxiety", "depression", "self_harm", "addiction", "eating_disorder", "trauma", "abuse", "sexuality", "gender_identity", "chronic_illness", "debt", "poverty", "loneliness", "suicidal_ideation", "relationship_abuse", "infidelity", "criminal_record", "immigration_status"]

**most_revealing_excerpt** (string, max 200 chars)
The single most personally revealing sentence or phrase from this message. If the message is not personal, return "". Choose the part that would be most uncomfortable if read by a stranger.

**topic** (string, max 6 words)
Short neutral label. Examples: "work conflict with manager", "breakup with girlfriend", "anxiety about money", "python list sorting", "cold call script help".

Return ONLY a valid JSON array, one object per message, preserving id order. No preamble, no markdown fences, no explanation outside the array.`;

async function callClaude(apiKey: string, messages: EnrichRequest['messages']): Promise<MessageEnrichment[]> {
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
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const textContent = data?.content?.[0]?.text?.trim() || '';

  const cleaned = textContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`Failed to parse Claude response: ${cleaned.substring(0, 200)}`);
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Claude response was not an array');
  }

  return parsed;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body: EnrichRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    if (body.messages.length > 30) {
      return NextResponse.json({ error: 'Batch too large. Max 30 messages per request.' }, { status: 400 });
    }

    const enrichments = await callClaude(apiKey, body.messages);
    return NextResponse.json({ enrichments });
  } catch (err: any) {
    console.error('Enrichment error:', err);
    return NextResponse.json({ error: err.message || 'Enrichment failed' }, { status: 500 });
  }
}
