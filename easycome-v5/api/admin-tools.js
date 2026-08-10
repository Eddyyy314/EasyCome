import healthHandler from '../server/admin-health.js';
import notificationTestHandler from '../server/admin-notification-test.js';
import securityAuditHandler from '../server/security-audit.js';
import { json } from '../server/_responses.js';

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/admin-tools', 'http://localhost');
  const action = String(req.query?.action || url.searchParams.get('action') || '').trim();
  if (action === 'health') return healthHandler(req, res);
  if (action === 'notification-test') return notificationTestHandler(req, res);
  if (action === 'security-audit') return securityAuditHandler(req, res);
  return json(res, 404, { error: 'Azione amministrativa non riconosciuta.' });
}
