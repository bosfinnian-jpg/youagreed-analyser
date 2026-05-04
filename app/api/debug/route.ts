import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function testClaude(apiKey: string, model: string) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }),
    });
    return { ok: res.ok, status: res.status };
  } catch (e: any) { return { ok: false, status: 0, error: e.message }; }
}

// Test the actual /api/enrich route via a relative URL (server-side fetch)
async function testEnrichRoute(baseUrl: string, apiKey: string) {
  try {
    const res = await fetch(`${baseUrl}/api/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: 0, text: "I've been struggling with my relationship.", hour: 23, timestamp: 1700000000 }]
      }),
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text.substring(0, 300) };
  } catch (e: any) { return { ok: false, status: 0, body: e.message }; }
}

async function testSynthesizeRoute(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/api/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topExcerpts: [{ excerpt: 'test', hour: 12, confessionalScore: 5, emotionalIntensity: 5, topic: 'test', daysSinceFirst: 0 }], aggregateStats: { totalMessages: 10, timespanDays: 30, avgMessageLength: 100, nighttimeRatio: 0.1, avgAnxiety: 2, avgIntimacy: 2, emotionalTrend: 'stable', peakHour: 14, dominantTimeOfDay: 'Afternoon' }, detectedLifeEvents: [], commercialSegments: [], recurringThemes: [], topicsByPeriod: { early: [], mid: [], recent: [] }, aiSignalCounts: {}, namedRelationships: [] }),
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text.substring(0, 300) };
  } catch (e: any) { return { ok: false, status: 0, body: e.message }; }
}

export async function GET(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ issue: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const baseUrl = new URL(request.url).origin;

  const [haiku, sonnet, enrich, synthesize] = await Promise.all([
    testClaude(apiKey, 'claude-haiku-4-5-20251001'),
    testClaude(apiKey, 'claude-sonnet-4-6'),
    testEnrichRoute(baseUrl, apiKey),
    testSynthesizeRoute(baseUrl),
  ]);

  return NextResponse.json({
    baseUrl,
    haiku,
    sonnet,
    enrichRoute: enrich,
    synthesizeRoute: synthesize,
    verdict: enrich.ok && synthesize.ok ? 'ROUTES OK' : 'ROUTES BROKEN',
  });
}
