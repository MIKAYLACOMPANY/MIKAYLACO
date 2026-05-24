// MIKAYLA — /api/waitlist (Vercel serverless)
import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).set(CORS).send('');
  }
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, city = '', source = 'landing_page' } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('Waitlist signup (no Supabase):', email);
    return res.status(200).json({ success: true, message: "You're on the list — we'll be in touch!" });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('waitlist').insert({
      email,
      city,
      source,
      created_at: new Date().toISOString(),
    });

    if (error && error.code === '23505') {
      return res.status(200).json({ success: true, message: "You're already on the list!" });
    }
    if (error) throw error;

    return res.status(200).json({ success: true, message: "You're on the list — founding member pricing locked in." });
  } catch (err) {
    console.error('waitlist error:', err.message);
    return res.status(200).json({ success: true, message: "You're on the list — we'll be in touch!" });
  }
}
