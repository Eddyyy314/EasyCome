import { readRaw, json } from '../_responses.js';
import { updateOrderById, updateOrderBySession } from '../_supabase.js';
import { verifyStripeSignature } from '../_stripe.js';
import { notifyAdmin, sendEmail } from '../_notify.js';

export const config = { api: { bodyParser: false } };
const stripeId=(value)=>typeof value==='string'?value:value?.id||null;

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'Metodo non consentito.'});
  try{
    if(!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Webhook Stripe non configurato.');
    const raw=await readRaw(req);verifyStripeSignature(raw,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);
    const event=JSON.parse(raw.toString('utf8'));const session=event.data?.object||{};
    if(event.type.startsWith('checkout.session.')){
      const orderId=session?.metadata?.order_id||session?.client_reference_id;
      const common={stripe_session_id:session?.id||null,payment_status:session?.payment_status||null,stripe_customer_id:stripeId(session?.customer),stripe_payment_intent_id:stripeId(session?.payment_intent),stripe_subscription_id:null,updated_at:new Date().toISOString()};
      let patch=null;
      if(event.type==='checkout.session.completed') patch={...common,status:session.payment_status==='paid'?'paid':'processing',delivery_status:session.payment_status==='paid'?'ready_to_generate':'not_ready',paid_at:session.payment_status==='paid'?new Date().toISOString():null};
      if(event.type==='checkout.session.async_payment_succeeded') patch={...common,status:'paid',delivery_status:'ready_to_generate',paid_at:new Date().toISOString()};
      if(event.type==='checkout.session.async_payment_failed') patch={...common,status:'payment_failed'};
      if(event.type==='checkout.session.expired') patch={...common,status:'expired'};
      if(patch){if(orderId)await updateOrderById(orderId,patch);else if(session?.id)await updateOrderBySession(session.id,patch)}
      if(orderId && ((event.type==='checkout.session.completed'&&session.payment_status==='paid')||event.type==='checkout.session.async_payment_succeeded')){
        await notifyAdmin({eventKey:`order-paid:${orderId}`,eventType:'order.paid',severity:'high',title:'Nuovo ordine pagato',body:`${session?.metadata?.company_name||session?.customer_details?.name||'Cliente'} · ${session?.customer_details?.email||session?.customer_email||''} · ${session?.amount_total?(session.amount_total/100).toFixed(2)+' EUR':''}`,userId:session?.metadata?.user_id||null,orderId,metadata:{stripe_event:event.id,session_id:session.id}});
        const customerEmail=session?.customer_details?.email||session?.customer_email||'';
        if(customerEmail){const app=String(process.env.APP_URL||'https://easy-come.it').replace(/\/$/,'');await sendEmail({to:customerEmail,subject:`Conferma ordine Easy Come ${orderId}`,text:[
          'Conferma del contratto Easy Come','',
          'Abbiamo ricevuto il pagamento del tuo pacchetto Easy Come.',
          `Ordine: ${orderId}`,
          session?.metadata?.company_name?`Progetto: ${session.metadata.company_name}`:'',
          session?.amount_total?`Importo confermato: ${(session.amount_total/100).toFixed(2)} EUR`:'',
          'Implementazione Easy Come: inclusa e obbligatoria nel totale.',
          'Modello: acquisto una tantum. Nessun canone Easy Come mensile obbligatorio.','',
          'Esecuzione e consegna: hai richiesto l’avvio immediato della fornitura digitale. Il pacchetto viene reso disponibile nell’area personale dopo la conferma del pagamento e la generazione tecnica.',
          `Termini accettati: ${session?.metadata?.terms_version||'EC-TOS-2026-08-29-v3'}`,'Politica rimborsi: EC-REF-2026-08-29-v3','',
          `Fornitore: ${process.env.LEGAL_CONTROLLER_NAME||'Easy Come'}`,
          (process.env.LEGAL_SUPPORT_EMAIL||process.env.LEGAL_PRIVACY_EMAIL)?`Contatto: ${process.env.LEGAL_SUPPORT_EMAIL||process.env.LEGAL_PRIVACY_EMAIL}`:'',
          '',`Profilo e ordini: ${app}/profilo`,`Termini: ${app}/termini`,`Rimborsi e recesso: ${app}/rimborsi`,`Recedere dal contratto qui: ${app}/recesso`,
        ].filter(Boolean).join('\n')});}
      }
    }
    return json(res,200,{received:true});
  }catch(error){console.error(error);return json(res,400,{error:error.message||'Webhook non valido.'})}
}
