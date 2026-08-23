import healthHandler from '../admin-health.js';
import notificationTestHandler from '../admin-notification-test.js';
import securityAuditHandler from '../security-audit.js';
import { json } from '../_responses.js';
import { authenticatedUser } from '../_auth.js';
import { isAdminUser, getProjectByUserId, updateProjectByUserId } from '../_supabase.js';

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/admin-tools', 'http://localhost');
  const action = String(req.query?.action || url.searchParams.get('action') || '').trim();
  if (action === 'health') return healthHandler(req, res);
  if (action === 'notification-test') return notificationTestHandler(req, res);
  if (action === 'security-audit') return securityAuditHandler(req, res);
  if (action === 'managed-project') {
    try {
      const user = await authenticatedUser(req);
      if (!(await isAdminUser(user.id))) return json(res, 403, { error: 'Solo gli amministratori Easy Come possono usare la Control Room Audit.' });
      const userId = String(req.query?.userId || url.searchParams.get('userId') || req.body?.userId || '').trim();
      if (!userId) return json(res, 400, { error: 'Cliente non valido.' });
      const row = await getProjectByUserId(userId);
      if (!row) return json(res, 404, { error: 'Progetto cliente non trovato.' });
      const project = row.project && typeof row.project === 'object' ? row.project : {};
      const current = project.managed && typeof project.managed === 'object' ? project.managed : {};
      if (req.method === 'GET') return json(res, 200, { ok: true, managed: current, projectName: row.name || project.company?.name || 'Cliente' });
      if (req.method !== 'POST') return json(res, 405, { error: 'Metodo non consentito.' });
      const mode = String(req.body?.mode || 'save');
      let next = { ...current, supportEmail: 'infoeasycome@libero.it' };
      if (mode === 'save') {
        const raw = String(req.body?.installationUrl || '').trim();
        if (raw) { const parsed = new URL(raw); if (!['http:','https:'].includes(parsed.protocol)) throw new Error('URL del gestionale non valido.'); next.installationUrl = parsed.href.replace(/\/$/, ''); }
        else next.installationUrl = '';
        next.supportEnabled = req.body?.supportEnabled !== false;
        next.updatedAt = new Date().toISOString();
      } else if (mode === 'access') {
        const now = new Date().toISOString();
        const log = Array.isArray(current.accessLog) ? current.accessLog.slice(-49) : [];
        log.push({ at: now, adminUserId: user.id, adminEmail: user.email || '', action: 'open_support' });
        next = { ...next, accessLog: log, lastAccessAt: now };
      } else return json(res, 400, { error: 'Operazione Audit non valida.' });
      await updateProjectByUserId(userId, { project: { ...project, managed: next }, updated_at: new Date().toISOString() });
      return json(res, 200, { ok: true, managed: next });
    } catch (error) { return json(res, 400, { error: error.message || 'Operazione Audit non riuscita.' }); }
  }
  return json(res, 404, { error: 'Azione amministrativa non riconosciuta.' });
}
