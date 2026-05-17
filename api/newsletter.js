// Vercel serverless function — handles newsletter signups.
//
// Writes each submission to Firestore /newsletter/{sha256-of-email}
// so the same address can't create duplicate rows. Reuses the
// existing /newsletter rule (already deployed) — the function uses
// Firebase Admin SDK which bypasses rules, so it works regardless
// of the client-side rule.
//
// Setup the user does once:
//   1. Firebase Console → ⚙️ Project Settings → Service accounts tab
//   2. "Generate new private key" → downloads a JSON file
//   3. Copy the ENTIRE contents of that JSON file
//   4. Vercel → Project Settings → Environment Variables
//   5. Add variable:
//        Name:  FIREBASE_SERVICE_ACCOUNT
//        Value: (paste the entire JSON, including the curly braces)
//        Environments: Production + Preview + Development (all 3)
//   6. Redeploy (or push any commit)

import admin from 'firebase-admin';
import { createHash } from 'node:crypto';

// Initialize Firebase Admin once per cold start.
function getDb() {
  if (admin.apps.length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set');
    }
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin.firestore();
}

export default async function handler(req, res) {
  // CORS — permissive so the same origin (braindexapp.com) and
  // any preview deploy URL all work.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    // Vercel auto-parses JSON when Content-Type is application/json.
    // It also parses application/x-www-form-urlencoded into req.body.
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Spam honeypot — bots fill this; humans don't see it.
    if (body['bot-field']) return res.status(200).json({ ok: true });

    const email = String(body.email || '').toLowerCase().trim();

    if (
      !email ||
      email.length < 5 ||
      email.length > 254 ||
      !email.includes('@') ||
      !email.includes('.')
    ) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const db = getDb();
    const id = createHash('sha256').update(email).digest('hex');

    await db.collection('newsletter').doc(id).set(
      {
        email,
        subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'landing',
        userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
      },
      { merge: true },
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    // Don't leak internals to the client.
    console.error('[newsletter] write failed:', err);
    return res.status(500).json({ error: 'Could not save right now' });
  }
}
