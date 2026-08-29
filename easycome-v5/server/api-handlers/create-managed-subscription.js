import crypto from 'node:crypto';
import { authenticatedUser } from '../_auth.js';
import { appOrigin, json, readJson } from '../_responses.js';
import { createOrder, updateOrderById, getSubscriptionByUser } from '../_supabase.js';
import { stripePost } from '../_stripe.js';

const clean=(v,max=200)=>String(v||'').trim().slice(0,max);

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'Metodo non consentito.'});
  try{
    const user=await authenticatedUser(req);
    const existing=await getSubscriptionByUser(user.id);
    if(existing&&!['canceled','incomplete_expired'].includes(existing.status)) throw new Error('Hai già una gestione tecnica collegata. Apri “Gestisci pagamento o disdici” dal profilo.');
    const body=await readJson(req);
    const companyName=clean(body.companyName||user.user_metadata?.company_name||'La tua azienda',180);
    const customerName=clean(body.customerName||user.user_metadata?.full_name||user.email,160);
    const email=clean(user.email,220).toLowerCase();
    const orderId=crypto.randomUUID();
    const amountCents=Number(process.env.EASYCOME_MANAGED_MONTHLY_CENTS||15000);
    if(!Number.isInteger(amountCents)||amountCents<100) throw new Error('Prezzo gestione mensile non valido.');
    await createOrder({
      id:orderId,user_id:user.id,status:'checkout_created',customer_email:email,customer_name:customerName,
      company_name:companyName,amount_cents:amountCents,currency:'eur',price_breakdown:{managedMonthly:amountCents/100},
      project:{company:{name:companyName,email},delivery:{managedServiceSelected:true}},delivery_status:'not_ready',download_count:0,
      purchase_type:'easycome_operativo',managed_service_selected:true,
    });
    const origin=appOrigin(req);const p=new URLSearchParams();const add=(k,v)=>{if(v!==undefined&&v!==null&&v!=='')p.append(k,String(v))};
    add('mode','subscription');add('customer_email',email);add('client_reference_id',orderId);add('billing_address_collection','required');
    add('line_items[0][quantity]','1');add('line_items[0][price_data][currency]','eur');add('line_items[0][price_data][unit_amount]',amountCents);
    add('line_items[0][price_data][recurring][interval]','month');add('line_items[0][price_data][product_data][name]','Easy Come Operativo');
    add('line_items[0][price_data][product_data][description]','Gestione continuativa di software e database: controlli, aggiornamenti minori, assistenza prioritaria e coordinamento tecnico.');
    add('metadata[order_id]',orderId);add('metadata[user_id]',user.id);add('metadata[purchase_type]','easycome_operativo');
    add('subscription_data[metadata][order_id]',orderId);add('subscription_data[metadata][user_id]',user.id);add('subscription_data[metadata][plan_code]','easycome_operativo_150');
    add('success_url',`${origin}/profilo.html?tab=care&subscription=success&session_id={CHECKOUT_SESSION_ID}`);
    add('cancel_url',`${origin}/profilo.html?tab=care&subscription=cancelled`);add('locale','it');
    const session=await stripePost('checkout/sessions',p);
    await updateOrderById(orderId,{stripe_session_id:session.id,checkout_url:session.url,updated_at:new Date().toISOString()});
    return json(res,200,{url:session.url,orderId});
  }catch(error){console.error(error);return json(res,400,{error:error.message||'Impossibile avviare l’abbonamento.'})}
}
