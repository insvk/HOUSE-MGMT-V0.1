export default async function handler(req: any, res: any) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { from, to, subject, html, apiKey, replyTo, reply_to } = req.body || {};
  
  // Default fallback API key encoded
  const fallbackKey = Buffer.from('cmVfTHcyUmdEQzFfRHRRSmFIZTJlNmlCYmJiTEQ4NzZXbThM', 'base64').toString('utf8');

  const activeKey =
    apiKey ||
    process.env.RESEND_API_KEY ||
    process.env.VITE_RESEND_API_KEY ||
    fallbackKey;

  if (!activeKey) {
    return res.status(400).json({ error: 'Resend API key is required' });
  }

  // Smart Sender & Reply-To Handling:
  // Resend requires unverified domains / @gmail.com to send via onboarding@resend.dev,
  // while directing all customer replies to the user's real email (production.chemadura26@gmail.com).
  let rawFrom = (from || '').trim();
  let replyAddress = replyTo || reply_to || 'production.chemadura26@gmail.com';
  let sender = 'Madura House Maintenance <onboarding@resend.dev>';

  if (rawFrom) {
    if (rawFrom.includes('gmail.com') || rawFrom.includes('yahoo.com') || rawFrom.includes('outlook.com') || rawFrom.includes('hotmail.com')) {
      // If user passed a Gmail/consumer address as 'from', use it as the Reply-To address
      // and use Resend's compliant sandbox sender for delivery success.
      replyAddress = rawFrom.replace(/.*<([^>]+)>.*/, '$1').trim();
      sender = 'Madura House Maintenance <onboarding@resend.dev>';
    } else if (rawFrom.includes('@') && rawFrom.includes('onboarding@resend.dev')) {
      sender = rawFrom;
    } else if (rawFrom.includes('@')) {
      // Custom verified domain
      sender = rawFrom.includes('<') ? rawFrom : `Madura House Maintenance <${rawFrom}>`;
    }
  }

  const recipientList = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipientList.length === 0) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  try {
    const payload: any = {
      from: sender,
      to: recipientList,
      subject: subject || 'Madura House Maintenance Notice',
      html: html || '<p>Madura House Maintenance Notice</p>',
    };

    if (replyAddress) {
      payload.reply_to = replyAddress;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Vercel serverless Resend dispatch error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to dispatch email via Resend gateway',
    });
  }
}
