function publicConfig() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '');
  if (!url || !anon) throw new Error('Autenticazione Easy Come non configurata.');
  return { url, anon };
}

export async function authenticatedUser(req) {
  const authorization = String(req.headers?.authorization || '');
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error('Accedi al tuo account Easy Come prima di continuare.');
  const { url, anon } = publicConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Sessione scaduta. Accedi nuovamente a Easy Come.');
  const user = await response.json();
  if (!user?.id) throw new Error('Utente non valido.');
  return user;
}
