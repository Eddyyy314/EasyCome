import { authenticatedUser } from './_auth.js';
import { isAdminUser } from './_supabase.js';

function configuredAdminEmails() {
  return String(process.env.EASYCOME_ADMIN_EMAILS || process.env.EASYCOME_ADMIN_EMAIL || '')
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireEasyComeAdmin(req) {
  const user = await authenticatedUser(req);
  const email = String(user.email || '').trim().toLowerCase();
  const allowedByEmail = email && configuredAdminEmails().includes(email);
  const allowedByTable = await isAdminUser(user.id).catch(() => false);
  if (!allowedByEmail && !allowedByTable) {
    throw new Error('Accesso riservato agli amministratori Easy Come. Aggiungi questo account a easycome_admins oppure configura EASYCOME_ADMIN_EMAIL su Vercel.');
  }
  return user;
}
