import { json } from '../server/_responses.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Metodo non consentito.' });

  const supabaseUrl = String(
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).replace(/\/$/, '');

  const supabaseAnonKey = String(
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  );

  if (!supabaseUrl || !supabaseAnonKey) {
    return json(res, 503, {
      error: 'Account Easy Come non ancora configurato.',
      missing: [
        !supabaseUrl ? 'SUPABASE_URL' : null,
        !supabaseAnonKey ? 'SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY' : null,
      ].filter(Boolean),
    });
  }

  return json(res, 200, {
    supabaseUrl,
    supabaseAnonKey,
    appUrl: String(process.env.APP_URL || 'https://easy-come.it').replace(/\/$/, ''),
    legal: {
      controllerName: String(process.env.LEGAL_CONTROLLER_NAME || ''),
      privacyEmail: String(process.env.LEGAL_PRIVACY_EMAIL || ''),
      supportEmail: String(process.env.LEGAL_SUPPORT_EMAIL || process.env.EASYCOME_NOTIFICATION_EMAIL || process.env.LEGAL_PRIVACY_EMAIL || ''),
      address: String(process.env.LEGAL_ADDRESS || ''),
      vatNumber: String(process.env.LEGAL_VAT_NUMBER || ''),
      rea: String(process.env.LEGAL_REA || ''),
      pec: String(process.env.LEGAL_PEC || ''),
    },
  });
}
