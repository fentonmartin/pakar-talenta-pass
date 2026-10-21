import { NextResponse } from 'next/server';
import { getBrandonReport } from '@/lib/brandon/analyzer';

export async function POST(request: Request) {
  try {
    const { rawText, participantNames } = await request.json();

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Chat text is required' },
        { status: 400 }
      );
    }

    const { report, parsed, input } = await getBrandonReport(rawText, participantNames);

    return NextResponse.json({
      success: true,
      report,
      parsedCount: parsed.length,
      participants: input.participantNames,
    });
  } catch (error) {
    console.error('Brandon analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/** Health check GET */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'brandon-thinks',
    endpoint: '/api/brandon',
  });
}