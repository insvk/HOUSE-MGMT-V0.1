export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { from, to, subject, html, apiKey } = req.body || {};
  const activeKey = apiKey || process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  if (!activeKey) {
    return res.status(400).json({ error: 'Resend API key is required' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'Madura House Maintenance <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject: subject || 'Madura House Maintenance Notice',
        html: html || '<p>Madura House Maintenance Notice</p>',
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Vercel serverless Resend dispatch error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to dispatch email' });
  }
}
