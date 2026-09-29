import { requireEasyComeAdmin } from '../_demo-auth.js';
import { json } from '../_responses.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Metodo non consentito.' });
  try {
    const user = await requireEasyComeAdmin(req);
    return json(res, 200, {
      ok: true,
      user: { id: user.id, email: user.email || '' },
      destination: '/factory',
    });
  } catch (error) {
    return json(res, 403, { ok: false, error: error.message || 'Accesso amministratore negato.' });
  }
}
