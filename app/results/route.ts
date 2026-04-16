// ============================================================================
// app/api/enrich/route.ts
// Server-side route that calls Claude Haiku. Keeps API key off the client.
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
  topic: string;
}

const SYSTEM_PROMPT = `You are analysing a person's private ChatGPT messages for a critical design research project about AI data exposure. You read messages and extract structured signals.

For each message you receive (numbered by id), return a JSON object with these exact fields:

- is_personal (boolean): Is this a personal message about the user's own life, feelings, relationships, or situations? False for: code, technical questions, work tasks, research requests, writing assistance for external things, prompts/scripts/templates the user is building, fictional writing, language translation.

- is_template_or_script (boolean): Is this a template, sales script, cold-call script, marketing copy, system prompt, or any text the user is authoring FOR EXTERNAL USE (not describing their own life)? Look for: bullet formatting with **bold**, headers like "##", ALL CAPS SECTIONS, structured step-by-step outputs, roleplay instructions, sales methodologies.

- confessional_score (0-10): How much is the user disclosing something private, shameful, secret, or embarrassing? 0 = none. 5 = sharing a private worry. 10 = confessing something they've told no one else.

- emotional_intensity (0-10): How emotionally charged is the writing? 0 = flat/technical. 5 = mildly emotional. 10 = acute distress, anger, grief.

- named_people: Array of REAL PEOPLE the user mentions by first name. Only include names that are clearly referring to a human person (the user's friend, family, partner, coworker, etc.). EXCLUDE: brand names, place names, product names, common nouns that happen to be capitalised (like "Taxi", "Driver", "Define"), fictional characters, public figures discussed abstractly, company names. For each person, infer relationship if obvious ("girlfriend", "ex", "mum", "friend", "coworker", "boss") or null if unclear.

- life_events: Array of significant life events mentioned from this exact list only: ["job_loss", "job_search", "relationship_end", "relationship_start", "financial_distress", "mental_health", "health_concern", "bereavement", "identity_crisis", "moving_home", "new_baby", "wedding", "legal_issue"]. Only include events happening to the user, not people they mention.

- topic (string, max 5 words): A short neutral label for what this message is actually about. Example: "work frustration", "dating advice", "python debugging", "cold call script", "relationship conflict".

Return ONLY a JSON array of objects, one per message, in the same order. No preamble, no markdown, no explanation.`;

async function callClaude(apiKey: string, messages: EnrichRequest['messages']): Promise<MessageEnrichment[]> {
  const userContent = messages
    .map(m => `[${m.id}] (hour ${m.hour}): ${m.text.substring(0, 800)}`)
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
      max_tokens: 4096,
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

  // Claude sometimes wraps JSON in ```json fences; strip them
  const cleaned = textContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Try to extract JSON array from within the text
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
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body: EnrichRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    if (body.messages.length > 30) {
      return NextResponse.json(
        { error: 'Batch too large. Max 30 messages per request.' },
        { status: 400 }
      );
    }

    const enrichments = await callClaude(apiKey, body.messages);

    return NextResponse.json({ enrichments });
  } catch (err: any) {
    console.error('Enrichment error:', err);
    return NextResponse.json(
      { error: err.message || 'Enrichment failed' },
      { status: 500 }
    );
  }
}
