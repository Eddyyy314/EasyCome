import { ECGenerator } from '../_generator-node.js';
import { createZipBytes } from '../_zip-node.js';
import { getOrderById, getOrderBySession, updateOrderById } from '../_supabase.js';
import { stripeGet } from '../_stripe.js';

function safeName(value) {
  return String(value || 'gestionale-easycome').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'gestionale-easycome';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito.' });
  try {
    const sessionId = String(req.query?.session_id || '').trim();
    if (!sessionId.startsWith('cs_')) throw new Error('Sessione di pagamento non valida.');
    const session = await stripeGet(`checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session.payment_status !== 'paid') return res.status(402).json({ error: 'Il pagamento non risulta ancora confermato.' });
    const orderId = session.metadata?.order_id || session.client_reference_id;
    const order = orderId ? await getOrderById(orderId) : await getOrderBySession(sessionId);
    if (!order) throw new Error('Ordine non trovato. Verifica la configurazione Supabase.');
    if (!order.project || typeof order.project !== 'object') throw new Error('Configurazione del progetto non disponibile.');

    const project = structuredClone(order.project);
    project.identity = {
      ...(project.identity || {}),
      supabaseUrl: String(process.env.SUPABASE_URL || ''),
      supabaseAnonKey: String(process.env.SUPABASE_ANON_KEY || ''),
      ownerUserId: order.user_id || '',
      ownerEmail: order.customer_email || project.company?.email || '',
      easycomeBaseUrl: String(process.env.APP_URL || 'https://easy-come.it').replace(/\/$/, ''),
      dataMode: 'local',
    };
    project.organizationId = project.organizationId || order.id;
    project.delivery = { ...(project.delivery || {}), previewApproved: true };
    const generated = ECGenerator.generatePackage(project);
    const zipBytes = createZipBytes(generated.files);
    const filename = `${safeName(order.company_name || project.company?.name)}-easycome-studio-v8.zip`;
    const now = new Date().toISOString();
    await updateOrderById(order.id, {
      status: 'paid',
      payment_status: 'paid',
      delivery_status: 'downloaded',
      prepared_filename: filename,
      download_count: Number(order.download_count || 0) + 1,
      last_downloaded_at: now,
      updated_at: now,
    });

    res.setHeader('content-type', 'application/zip');
    res.setHeader('content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('cache-control', 'private, no-store, max-age=0');
    res.setHeader('x-content-type-options', 'nosniff');
    return res.status(200).send(Buffer.from(zipBytes));
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message || 'Impossibile preparare il pacchetto.' });
  }
}
