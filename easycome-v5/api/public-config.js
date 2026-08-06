import { json } from './_responses.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Metodo non consentito.' });
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '');
  if (!supabaseUrl || !supabaseAnonKey) return json(res, 503, { error: 'Account Easy Come non ancora configurato.' });
  return json(res, 200, {
    supabaseUrl,
    supabaseAnonKey,
    appUrl: String(process.env.APP_URL || 'https://easy-come.it').replace(/\/$/, ''),
  });
}
