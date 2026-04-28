import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 30;

interface EchoRequest {
  messageCount: number;
  characterSummary?: string;
  writingVoice?: string;
  verbalTells?: string;
  emotionalBaseline?: string;
  dominantNarrative?: string;
  primaryCoping?: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let body: EchoRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const contextLines = [
    body.characterSummary && `Character summary: ${body.characterSummary}`,
    body.writingVoice && `Writing voice: ${body.writingVoice}`,
    body.verbalTells && `Verbal patterns: ${body.verbalTells}`,
    body.emotionalBaseline && `Emotional baseline: ${body.emotionalBaseline}`,
    body.dominantNarrative && `Dominant self-narrative: ${body.dominantNarrative}`,
    body.primaryCoping && `Primary coping mechanism: ${body.primaryCoping}`,
  ].filter(Boolean).join('\n');

  if (!contextLines) {
    return NextResponse.json({ error: 'Insufficient context to generate echo' }, { status: 400 });
  }

  const prompt = `You are a language model that has processed ${body.messageCount.toLocaleString()} messages from a single user. You have built a detailed model of how they think, write, and communicate.

Here is what you know about them:
${contextLines}

Write a short paragraph (4-6 sentences) in this person's voice, on the topic of what they find themselves thinking about before they fall asleep. Do not describe their traits — write AS them, from inside their perspective, in their actual way of writing. Capture their sentence length, word choices, and the way they move between ideas. Make it feel like something they could have written themselves.

Output ONLY the paragraph. No preamble. No explanation. Just the text.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Claude API error:', err);
    return NextResponse.json({ error: 'Model call failed' }, { status: 502 });
  }

  const data = await response.json();
  const text = data?.content?.find((b: { type: string; text?: string }) => b.type === 'text')?.text?.trim();

  if (!text) {
    return NextResponse.json({ error: 'Empty response from model' }, { status: 502 });
  }

  return NextResponse.json({ text });
}
