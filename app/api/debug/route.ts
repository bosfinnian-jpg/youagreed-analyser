import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    apiKeyPresent: !!apiKey,
    routesOk: true,
    message: 'Use the browser console debug instead - see instructions',
  });
}
