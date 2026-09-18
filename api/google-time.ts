/**
 * Vercel Serverless Function: /api/google-time
 * Syncs server-side time from Google's NTP HTTP endpoint.
 * Used by the GoogleClock component as an authoritative time source.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const t0 = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://time.google.com', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const t1 = Date.now();
    const dateHeader = response.headers.get('date');
    const googleEpoch = dateHeader ? new Date(dateHeader).getTime() : t1;

    return res.status(200).json({
      success: true,
      source: 'time.google.com',
      googleUtc: dateHeader,
      epochMs: googleEpoch,
      rttMs: t1 - t0,
      syncedAt: t1,
      timezone: 'Asia/Kolkata',
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      source: 'server-fallback',
      epochMs: Date.now(),
      error: err?.message || 'timeout',
    });
  }
}
