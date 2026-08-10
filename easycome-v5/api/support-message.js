import crypto from 'node:crypto';
import { authenticatedUser } from './_auth.js';
import { json, readJson } from './_responses.js';
import { createSupportMessage, getSupportRequestById, updateSupportRequestById } from './_supabase.js';
import { notifyAdmin } from './_notify.js';

const clean = (value, max = 12000) => String(value ?? '').trim().slice(0, max);
function cors(res){res.setHeader('access-control-allow-origin','*');res.setHeader('access-control-allow-methods','POST, OPTIONS');res.setHeader('access-control-allow-headers','authorization, content-type');}
export default async function handler(req,res){
  cors(res);if(req.method==='OPTIONS')return json(res,200,{ok:true});if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
  try{
    const user=await authenticatedUser(req);const body=await readJson(req,40_000);const requestId=clean(body.request_id,80);const text=clean(body.body);
    if(!requestId||!text)throw new Error('Conversazione e messaggio sono obbligatori.');
    const ticket=await getSupportRequestById(requestId);if(!ticket||ticket.user_id!==user.id)throw new Error('Conversazione non disponibile.');
    const message={id:crypto.randomUUID(),request_id:requestId,user_id:user.id,sender_role:'client',body:text,read_by_client:true,read_by_admin:false,created_at:new Date().toISOString()};
    const saved=await createSupportMessage(message);
    await updateSupportRequestById(requestId,{status:'received',updated_at:new Date().toISOString()});
    await notifyAdmin({
      eventKey: `support-message:${saved?.id || message.id}`,
      eventType: 'support.message',
      severity: ticket.priority === 'urgent' ? 'urgent' : 'normal',
      title: `Nuovo messaggio: ${ticket.subject}`,
      body: `${ticket.company_name || ticket.customer_email} · ${text.slice(0, 1000)}`,
      userId: user.id,
      requestId,
      metadata: { kind: ticket.kind },
    });
    return json(res,200,{ok:true,message:saved||message});
  }catch(error){console.error(error);return json(res,400,{error:error?.message||'Impossibile inviare il messaggio.'})}
}
