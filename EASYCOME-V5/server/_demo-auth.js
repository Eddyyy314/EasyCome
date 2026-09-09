import { authenticatedUser } from './_auth.js';
import { isAdminUser } from './_supabase.js';
export async function requireEasyComeAdmin(req){const user=await authenticatedUser(req);if(!(await isAdminUser(user.id)))throw new Error('Accesso riservato agli amministratori Easy Come.');return user}
