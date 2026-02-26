import { headers } from 'next/headers';

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Basic origin check — only allow same-origin requests
  const headersList = await headers();
  const referer = headersList.get('referer') || '';
  const origin = headersList.get('origin') || '';
  const host = headersList.get('host') || '';

  // Verify the request comes from our own domain
  if (referer && !referer.includes(host)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (origin && !origin.includes(host)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate limiting by IP
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  return Response.json({ apiKey });
}
