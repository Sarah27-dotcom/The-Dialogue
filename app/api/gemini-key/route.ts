export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }
  return Response.json({ apiKey });
}
