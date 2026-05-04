import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Test enrich by calling Claude Haiku directly with a real enrich payload
// (same logic as /api/enrich) — avoids the self-calling problem
async function testEnrichDirect(apiKey: string) {
  const SYSTEM = `You analyse private AI conversation messages. Return ONLY a valid JSON array with one object per message. Each object must have: id (number), is_personal (boolean), is_template_or_script (boolean), confessional_score (0-10), emotional_intensity (0-10), named_people (array), life_events (array), sensitive_topics (array), psychological_signals (array), inferred_beliefs (array), most_revealing_excerpt (string), topic (string).`;

  const testMsg = `[0] hour:23 | I've been really struggling with my relationship lately. My partner keeps saying I'm too needy but I feel my needs aren't being met.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: 'user', content: testMsg }],
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || '';
    return { ok: res.ok, status: res.status, rawResponse: text.substring(0, 400) };
  } catch (e: any) {
    return { ok: false, status: 0, rawResponse: e.message };
  }
}

// Test synthesize by calling Claude Sonnet directly
async function testSynthesisDirect(apiKey: string) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Return this JSON exactly: {"characterSummary":"test","demographicPredictions":[],"verbalTells":[],"predictedBehaviours":[],"commercialTargets":[],"recurringConcerns":[],"unintentionalDisclosures":[],"inferredCoreBeliefs":[]}' }],
      }),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || '';
    return { ok: res.ok, status: res.status, rawResponse: text.substring(0, 200) };
  } catch (e: any) {
    return { ok: false, status: 0, rawResponse: e.message };
  }
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ issue: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const [enrich, synthesize] = await Promise.all([
    testEnrichDirect(apiKey),
    testSynthesisDirect(apiKey),
  ]);

  return NextResponse.json({
    apiKeyPrefix: apiKey.substring(0, 12) + '...',
    enrichDirect: enrich,
    synthesizeDirect: synthesize,
    verdict: enrich.ok && synthesize.ok ? 'PIPELINE SHOULD WORK' : 'PIPELINE BROKEN',
  });
}
