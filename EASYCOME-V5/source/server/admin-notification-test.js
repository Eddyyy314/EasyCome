import crypto from 'node:crypto';
import { authenticatedUser } from './_auth.js';
import { isAdminUser } from './_supabase.js';
import { notifyAdmin } from './_notify.js';
import { json } from './_responses.js';

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
  try{
    const user=await authenticatedUser(req);
    if(!(await isAdminUser(user.id)))return json(res,403,{error:'Accesso amministratore richiesto.'});
    const result=await notifyAdmin({
      eventKey:`notification-test:${crypto.randomUUID()}`,
      eventType:'system.test',
      severity:'info',
      title:'Notifica Easy Come di prova',
      body:`Test inviato dalla Control Room da ${user.email||user.id}.`,
      userId:user.id,
      metadata:{test:true},
    });
    return json(res,200,{ok:true,email:Boolean(result?.email?.ok),webhook:Boolean(result?.webhook?.ok),stored:Boolean(result?.stored)});
  }catch(error){console.error(error);return json(res,400,{error:error?.message||'Test non disponibile.'})}
}
