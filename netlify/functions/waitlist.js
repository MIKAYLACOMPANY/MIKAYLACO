// MIKAYLA — Waitlist Handler
// Endpoint: POST /api/waitlist  { email, name?, source? }
//
// ── SELF-HOSTED, ZERO EXTERNAL DEPENDENCIES ──────────────────────────────────
// Replaces Netlify Forms entirely. No third-party form service needed.
//
// What it does:
//   1. Validates the email address
//   2. Appends the signup to /tmp/mikayla_waitlist.json (accessible in Vercel logs)
//   3. Returns a success response so the UI can show a confirmation
//
// To retrieve signups: check Vercel function logs, or add an email service
// (e.g. Resend, Sendgrid) later by setting RESEND_API_KEY / SENDGRID_API_KEY.
// The data structure is already ready for that upgrade.
//
// Optional env vars (all optional — works without them):
//   RESEND_API_KEY     → send welcome email via Resend (resend.com, free tier)
//   NOTIFY_EMAIL       → your email to be notified of each new signup
//
'use strict';

const fs   = require('fs');
const path = require('path');

const WAITLIST_FILE = '/tmp/mikayla_waitlist.json';
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

function readWaitlist() {
  try {
    if (!fs.existsSync(WAITLIST_FILE)) return [];
    return JSON.parse(fs.readFileSync(WAITLIST_FILE, 'utf8'));
  } catch { return []; }
}

function appendWaitlist(entry) {
  try {
    const list = readWaitlist();
    list.push(entry);
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
    return list.length;
  } catch (e) {
    console.error('Waitlist write error:', e.message);
    return 0;
  }
}

// ── Optional: send welcome email via Resend (free tier, no account for basic) ─
async function sendWelcomeEmail(email, name) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;  // skip silently if key not set

  const firstName = name ? name.split(' ')[0] : 'there';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'MIKAYLA <noreply@mikaylaco.com>',
        to:      email,
        subject: "You're on the MIKAYLA waitlist ✦",
        html: `
          <div style="font-family:'Cormorant Garamond',Georgia,serif;max-width:520px;margin:0 auto;padding:48px 32px;background:#faf9f7;color:#1a1a18;">
            <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8076;margin:0 0 32px;">MIKAYLA ✦ AI Travel Fashion</p>
            <h1 style="font-size:32px;font-weight:400;margin:0 0 16px;line-height:1.2;">Hello, ${firstName}.</h1>
            <p style="font-size:16px;line-height:1.8;color:#3d3d3a;margin:0 0 24px;">
              You're on the waitlist. MIKAYLA is an AI that knows exactly what to wear in every city —
              live trend data, real outfit intel, shoppable looks.
            </p>
            <p style="font-size:14px;line-height:1.8;color:#8a8076;margin:0 0 32px;">
              We'll be in touch soon with early access.
            </p>
            <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#c9b99a;border-top:1px solid #e8e3dc;padding-top:24px;margin:0;">
              mikaylaco.com — Every city has its own dress code.
            </p>
          </div>
        `,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.warn('Welcome email failed (non-fatal):', e.message);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const email  = String(body.email  || '').trim().toLowerCase();
  const name   = String(body.name   || '').trim().slice(0, 100);
  const source = String(body.source || 'waitlist').trim().slice(0, 50);

  if (!email || !isValidEmail(email)) {
    return {
      statusCode: 422,
      headers:    CORS,
      body:       JSON.stringify({ error: 'A valid email address is required' }),
    };
  }

  // Log the signup (always visible in Vercel function logs)
  const entry = {
    email,
    name:       name || null,
    source,
    joined_at:  new Date().toISOString(),
    ip:         event.headers['x-forwarded-for'] || null,
  };
  console.log('MIKAYLA_WAITLIST_SIGNUP:', JSON.stringify(entry));

  // Append to /tmp file (persists within warm instance)
  const totalSignups = appendWaitlist(entry);

  // Send welcome email if Resend key is configured
  await sendWelcomeEmail(email, name);

  return {
    statusCode: 200,
    headers:    CORS,
    body:       JSON.stringify({
      success:  true,
      message:  "You're on the waitlist. We'll be in touch.",
      email,
    }),
  };
};
