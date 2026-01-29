import { NextResponse } from 'next/server';

/**
 * POST /api/ai-search/log
 * Receives log messages from client-side code and logs them server-side
 * This ensures logs appear in server terminal, not browser console
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level, message, data, timestamp } = body;

    // Log to server terminal based on level
    const logMessage = `[Client ${level.toUpperCase()}] ${message}`;
    const logData = data ? ` ${JSON.stringify(data)}` : '';
    const logTimestamp = timestamp ? ` [${timestamp}]` : '';

    switch (level) {
      case 'error':
        console.error(logMessage + logData + logTimestamp);
        break;
      case 'warn':
        console.warn(logMessage + logData + logTimestamp);
        break;
      case 'info':
      default:
        console.log(logMessage + logData + logTimestamp);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't log errors from logging endpoint to avoid infinite loops
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
