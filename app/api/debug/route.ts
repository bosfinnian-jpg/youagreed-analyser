import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      issue: 'ANTHROPIC_API_KEY is not set in environment variables',
    }, { status: 500 });
  }

  const test = async (model: string) => {
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

  const [haiku, sonnet] = await Promise.all([
    test('claude-haiku-4-5-20251001'),
    test('claude-sonnet-4-6'),
  ]);

  return NextResponse.json({
    apiKeyPresent: true,
    apiKeyPrefix: apiKey.substring(0, 12) + '...',
    haiku: { model: 'claude-haiku-4-5-20251001', ...haiku },
    sonnet: { model: 'claude-sonnet-4-6', ...sonnet },
  });
}
