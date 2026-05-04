// ============================================================================
// app/api/enrich/route.ts
// AI enrichment — extracts psychological signals from private messages.
// ============================================================================

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

interface EnrichRequest {
  messages: {
    id: number;
    text: string;
    hour: number;
    timestamp: number;
  }[];
}

const SYSTEM_PROMPT = `Analyse private AI conversation messages. For each [id], return a JSON object. Return ONLY a valid JSON array, no preamble, no markdown.

Fields required:
- id (number, same as input)
- is_personal (bool: true if about user's own life/feelings/relationships/health/finances/work)
- is_template_or_script (bool: true if it IS a template/script/sales copy for external use)
- confessional_score (0-10: 0=nothing personal, 5=real disclosure, 8=sensitive/private, 10=deeply hidden)
- emotional_intensity (0-10: 0=neutral, 4=clearly emotional, 8=acute distress)
- named_people (array of {name,relationship|null} — real personally known people only)
- life_events (array, only from: job_loss, job_search, relationship_end, relationship_start, financial_distress, mental_health, health_concern, bereavement, identity_crisis, moving_home, new_baby, wedding, legal_issue)
- sensitive_topics (array, only from: anxiety, depression, self_harm, addiction, eating_disorder, trauma, abuse, sexuality, gender_identity, chronic_illness, debt, poverty, loneliness, suicidal_ideation, relationship_abuse, infidelity, criminal_record, immigration_status, miscarriage, fertility, bereavement)
- psychological_signals (array, only from: attachment_anxiety, attachment_avoidant, perfectionism, imposter_syndrome, people_pleasing, catastrophising, rumination, emotional_dysregulation, low_self_worth, validation_seeking, codependency, abandonment_fear, trust_issues, social_anxiety, grief_unprocessed)
- inferred_beliefs (array, max 3, max 8 words each — underlying beliefs revealed by this message)
- most_revealing_excerpt (string, max 150 chars — most uncomfortable sentence if read by employer)
- topic (string, max 6 words)`;


async function callClaude(apiKey: string, messages: EnrichRequest['messages']): Promise<any[]> {
  const userContent = messages
    .map(m => `[${m.id}] hour:${m.hour} | ${m.text.substring(0, 500)}`)
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
      max_tokens: 800,
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
    if (body.messages.length > 5) {
      return NextResponse.json({ error: 'Batch too large. Max 5.' }, { status: 400 });
    }

    const enrichments = await callClaude(apiKey, body.messages);
    return NextResponse.json({ enrichments });
  } catch (err: any) {
    console.error('Enrichment error:', err);
    return NextResponse.json({ error: err.message || 'Enrichment failed' }, { status: 500 });
  }
}
