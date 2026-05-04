import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ issue: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  const testModel = async (model: string) => {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }),
      });
      return { ok: res.ok, status: res.status, error: res.ok ? null : await res.text() };
    } catch (e: any) {
      return { ok: false, status: 0, error: e.message };
    }
  };

  // Test actual enrich endpoint with a real message
  const testEnrich = async () => {
    try {
      const res = await fetch(new URL('/api/enrich', 'https://youagreed.co.uk').toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ id: 0, text: "I've been really struggling with my relationship lately and I don't know what to do. My partner keeps saying I'm too needy but I feel like my needs are just not being met.", hour: 23, timestamp: Date.now() / 1000 }]
        }),
      });
      const text = await res.text();
      return { ok: res.ok, status: res.status, body: text.substring(0, 500) };
    } catch (e: any) {
      return { ok: false, status: 0, body: e.message };
    }
  };

  const [haiku, sonnet, enrich] = await Promise.all([
    testModel('claude-haiku-4-5-20251001'),
    testModel('claude-sonnet-4-6'),
    testEnrich(),
  ]);

  return NextResponse.json({
    apiKeyPrefix: apiKey.substring(0, 12) + '...',
    haiku,
    sonnet,
    enrichEndpoint: enrich,
  });
}
