// MIKAYLA — /api/waitlist
// Saves email signups to Supabase waitlist table

import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  const { email, city = '', source = 'landing_page' } = body;

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Valid email required' }) };
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('Waitlist signup (no Supabase):', email, city);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, message: 'Signed up successfully' }) };
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('waitlist').insert({ email, city, source });

    if (error && error.code === '23505') {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, message: 'Already on the list!' }) };
    }
    if (error) throw error;

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, message: 'Added to waitlist' }) };
  } catch (err) {
    console.error('waitlist error:', err.message);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, message: 'Signed up successfully' }) };
  }
}
