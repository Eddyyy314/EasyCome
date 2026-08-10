import { authenticatedUser } from './_auth.js';
import { json } from './_responses.js';
import { isAdminUser } from './_supabase.js';

async function timed(label, fn){const start=Date.now();try{const value=await fn();return {label,ok:true,ms:Date.now()-start,...value}}catch(error){return {label,ok:false,ms:Date.now()-start,error:error?.message||String(error)}}}
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Metodo non consentito.'});
  try{
    const user=await authenticatedUser(req);if(!(await isAdminUser(user.id)))return json(res,403,{error:'Accesso amministratore richiesto.'});
    const supabaseUrl=String(process.env.SUPABASE_URL||'').replace(/\/$/,'');const serviceKey=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'');const stripeKey=String(process.env.STRIPE_SECRET_KEY||'');
    const checks=[];
    checks.push(await timed('Supabase',async()=>{if(!supabaseUrl||!serviceKey)throw new Error('Variabili mancanti');const r=await fetch(`${supabaseUrl}/rest/v1/easycome_orders?select=id&limit=1`,{headers:{apikey:serviceKey,authorization:`Bearer ${serviceKey}`}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return {detail:'Database raggiungibile'}}));
    checks.push(await timed('Stripe',async()=>{if(!stripeKey)throw new Error('STRIPE_SECRET_KEY mancante');const r=await fetch('https://api.stripe.com/v1/account',{headers:{authorization:`Bearer ${stripeKey}`}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return {detail:stripeKey.startsWith('sk_live_')?'Live':'Sandbox'}}));
    checks.push({label:'Webhook Stripe',ok:Boolean(process.env.STRIPE_WEBHOOK_SECRET),ms:0,detail:process.env.STRIPE_WEBHOOK_SECRET?'Configurato':'Mancante'});
    const emailReady=Boolean(process.env.RESEND_API_KEY&&process.env.EASYCOME_NOTIFICATION_FROM&&(process.env.EASYCOME_NOTIFICATION_EMAIL||process.env.LEGAL_SUPPORT_EMAIL||process.env.LEGAL_PRIVACY_EMAIL));
    const webhookReady=Boolean(process.env.EASYCOME_SUPPORT_WEBHOOK_URL);
    checks.push({label:'Notifiche',ok:emailReady||webhookReady,ms:0,detail:emailReady?'Email attiva':webhookReady?'Webhook attivo':'Solo Control Room: configura email o webhook'});
    checks.push({label:'Conferme recesso',ok:emailReady,ms:0,detail:emailReady?'Email automatica attiva':'Configura RESEND_API_KEY + EASYCOME_NOTIFICATION_FROM'});
    return json(res,200,{ok:true,appUrl:String(process.env.APP_URL||'https://easy-come.it'),generatedAt:new Date().toISOString(),checks});
  }catch(error){console.error(error);return json(res,400,{error:error?.message||'Controllo non disponibile.'})}
}
