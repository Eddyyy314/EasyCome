import crypto from 'node:crypto';

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key.startsWith('sk_')) throw new Error('STRIPE_SECRET_KEY non configurata sul server.');
  return key;
}

function stripeHeaders(contentType = 'application/x-www-form-urlencoded') {
  const headers = {
    authorization: `Bearer ${secretKey()}`,
    'content-type': contentType,
  };
  if (process.env.STRIPE_API_VERSION) headers['stripe-version'] = process.env.STRIPE_API_VERSION;
  return headers;
}

export async function stripePost(path, params) {
  const body = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  const response = await fetch(`https://api.stripe.com/v1/${path.replace(/^\//, '')}`, {
    method: 'POST', headers: stripeHeaders(), body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Stripe ${response.status}`);
  return data;
}

export async function stripeGet(path) {
  const response = await fetch(`https://api.stripe.com/v1/${path.replace(/^\//, '')}`, {
    method: 'GET', headers: stripeHeaders('application/json'),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Stripe ${response.status}`);
  return data;
}

export function verifyStripeSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!secret || !signatureHeader) throw new Error('Firma webhook mancante.');
  const parts = String(signatureHeader).split(',').map((part) => part.trim().split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0) throw new Error('Header Stripe-Signature non valido.');
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) throw new Error('Firma webhook scaduta.');
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`, 'utf8').digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const valid = signatures.some((candidate) => {
    try {
      const candidateBuffer = Buffer.from(candidate, 'hex');
      return candidateBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(candidateBuffer, expectedBuffer);
    } catch { return false; }
  });
  if (!valid) throw new Error('Firma webhook Stripe non valida.');
}
