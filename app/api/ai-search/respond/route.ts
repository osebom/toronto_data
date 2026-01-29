import { NextResponse } from 'next/server';
import { CohereClient } from 'cohere-ai';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/server-rate-limit';

function getCohereClient(): CohereClient | null {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) return null;
  return new CohereClient({ token: apiKey });
}

/**
 * POST /api/ai-search/respond
 * Body: { query: string, eventSummaries: string[], count: number }
 * Returns a single conversational sentence that answers the user's query using the event results as context.
 */
export async function POST(request: Request) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  let body: { query: string; eventSummaries: string[]; count: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { query, eventSummaries, count } = body;
  if (!query || !Array.isArray(eventSummaries)) {
    return NextResponse.json(
      { error: 'query and eventSummaries (array) are required' },
      { status: 400 }
    );
  }

  const cohere = getCohereClient();
  if (!cohere) {
    return NextResponse.json(
      { error: 'Cohere API key not configured' },
      { status: 500 }
    );
  }

  const eventsContext =
    eventSummaries.length > 0
      ? eventSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : 'No matching events found.';

  const prompt = `You are a helpful events assistant in Toronto. The user asked: "${query}"

Here are the matching events (use these as context only; do not list them again):
${eventsContext}

Write ONE short, friendly sentence that answers their question using these results. Mention 1–2 specific event names or details if relevant. If there are no events, say so in one sentence. Do not output bullet lists or numbered lists.`;

  try {
    const response = await cohere.chat({
      model: 'command-a-03-2025',
      message: prompt,
      maxTokens: 150,
      temperature: 0.5,
    });
    const text = (response as { text?: string }).text ?? '';
    const sentence = String(text).trim() || `I found ${count} event${count !== 1 ? 's' : ''} for you.`;
    return NextResponse.json(
      { response: sentence },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (err) {
    console.error('[AI Search Respond] Cohere error:', err);
    const fallback =
      eventSummaries.length > 0
        ? `I found ${count} event${count !== 1 ? 's' : ''} for you.`
        : "I couldn't find any events matching your criteria. Try adjusting your search.";
    return NextResponse.json(
      { response: fallback },
      { headers: getRateLimitHeaders(rateLimitResult) }
    );
  }
}
