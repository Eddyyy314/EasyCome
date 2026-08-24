import { readRaw, json } from '../_responses.js';
import { updateOrderById, updateOrderBySession, upsertSubscription, updateSubscriptionByStripeId } from '../_supabase.js';
import { verifyStripeSignature, stripeGet } from '../_stripe.js';
import { notifyAdmin, sendEmail } from '../_notify.js';
import { targetBySlug, updateTarget } from '../_demo-store.js';

export const config = { api: { bodyParser: false } };
const isoFromUnix=(value)=>Number(value)?new Date(Number(value)*1000).toISOString():null;
const stripeId=(value)=>typeof value==='string'?value:value?.id||null;

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'Metodo non consentito.'});
  try{
    if(!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Webhook Stripe non configurato.');
    const raw=await readRaw(req);verifyStripeSignature(raw,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);
    const event=JSON.parse(raw.toString('utf8'));const object=event.data?.object||{};

    if(event.type.startsWith('checkout.session.')){
      const session=object;
      if(session?.metadata?.purchase_type==='web_proposal'){
        const slug=String(session.metadata.demo_slug||'');const token=String(session.metadata.proposal_token||'');const paid=((event.type==='checkout.session.completed'&&session.payment_status==='paid')||event.type==='checkout.session.async_payment_succeeded');
        if(slug&&token){
          const target=await targetBySlug(slug).catch(()=>null);if(target){const cfg=target.demo_config||{};const p=cfg.webProposal||{};if(p.token===token){const next={...p,status:paid?'paid':(event.type==='checkout.session.expired'?'expired':p.status),stripeSessionId:session.id,paymentStatus:session.payment_status||null,buyer:{...(p.buyer||{}),name:session.metadata.buyer_name||p.buyer?.name||'',email:session.customer_details?.email||session.customer_email||session.metadata.buyer_email||p.buyer?.email||'',phone:session.customer_details?.phone||session.metadata.buyer_phone||p.buyer?.phone||''},paidAt:paid?new Date().toISOString():p.paidAt||null,updatedAt:new Date().toISOString()};await updateTarget(target.id,{demo_config:{...cfg,webProposal:next}});}}
        }
        if(paid){
          await notifyAdmin({eventKey:`web-proposal-paid:${session.id}`,eventType:'web.proposal.paid',severity:'high',title:'Easy Come Web acquistato',body:`${session.metadata.company_name||'Cliente'} · ${session.customer_details?.email||session.customer_email||''} · ${session.amount_total?(session.amount_total/100).toFixed(2)+' EUR':''}`,metadata:{stripe_event:event.id,session_id:session.id,demo_slug:slug}});
          const customerEmail=session.customer_details?.email||session.customer_email||session.metadata.buyer_email||'';if(customerEmail){await sendEmail({to:customerEmail,subject:`Easy Come Web — pagamento confermato`,text:[`Ciao ${session.metadata.buyer_name||''},`,'','abbiamo ricevuto il pagamento per il progetto Easy Come Web mostrato nella tua proposta privata.','Easy Come ti contatterà per gli ultimi dettagli e la consegna definitiva.','',`Progetto: ${session.metadata.company_name||'Easy Come Web'}`,session.amount_total?`Importo: ${(session.amount_total/100).toFixed(2)} EUR`:'','',`Contatto: infoeasycome@libero.it`].filter(Boolean).join('\n')});}
        }
        return json(res,200,{received:true,webProposal:true});
      }const orderId=session?.metadata?.order_id||session?.client_reference_id;const subscriptionId=stripeId(session?.subscription);
      const common={stripe_session_id:session?.id||null,payment_status:session?.payment_status||null,stripe_customer_id:stripeId(session?.customer),stripe_payment_intent_id:stripeId(session?.payment_intent),stripe_subscription_id:subscriptionId,updated_at:new Date().toISOString()};
      let patch=null;
      if(event.type==='checkout.session.completed') patch={...common,status:session.payment_status==='paid'?'paid':'processing',delivery_status:session.payment_status==='paid'?'ready_to_generate':'not_ready',paid_at:session.payment_status==='paid'?new Date().toISOString():null};
      if(event.type==='checkout.session.async_payment_succeeded') patch={...common,status:'paid',delivery_status:'ready_to_generate',paid_at:new Date().toISOString()};
      if(event.type==='checkout.session.async_payment_failed') patch={...common,status:'payment_failed'};
      if(event.type==='checkout.session.expired') patch={...common,status:'expired'};
      if(patch){if(orderId)await updateOrderById(orderId,patch);else if(session?.id)await updateOrderBySession(session.id,patch)}
      if(orderId && (
        (event.type==='checkout.session.completed' && session.payment_status==='paid') ||
        event.type==='checkout.session.async_payment_succeeded'
      )){
        await notifyAdmin({
          eventKey:`order-paid:${orderId}`,
          eventType:'order.paid',
          severity:'high',
          title:'Nuovo ordine pagato',
          body:`${session?.metadata?.company_name||session?.customer_details?.name||'Cliente'} · ${session?.customer_details?.email||session?.customer_email||''} · ${session?.amount_total ? (session.amount_total/100).toFixed(2)+' EUR' : ''}`,
          userId:session?.metadata?.user_id||null,
          orderId,
          metadata:{stripe_event:event.id,session_id:session.id,managed_service:session?.metadata?.managed_service||'not_selected'},
        });
        const customerEmail=session?.customer_details?.email||session?.customer_email||'';
        if(customerEmail){
          const app=String(process.env.APP_URL||'https://easy-come.it').replace(/\/$/,'');
          await sendEmail({
            to:customerEmail,
            subject:`Conferma ordine Easy Come ${orderId}`,
            text:[
              'Conferma del contratto Easy Come',
              '',
              'Abbiamo ricevuto il pagamento del tuo ordine.',
              `Ordine: ${orderId}`,
              session?.metadata?.company_name?`Progetto: ${session.metadata.company_name}`:'',
              session?.amount_total?`Importo confermato ora: ${(session.amount_total/100).toFixed(2)} EUR`:'',
              session?.metadata?.implementation==='included'?'Implementazione assistita: inclusa.':'Implementazione assistita: non selezionata.',
              (session?.metadata?.audit_service==='selected'||session?.metadata?.managed_service==='selected')?`Easy Come Audit: attivo, rinnovo mensile di ${(Number(process.env.EASYCOME_AUDIT_MONTHLY_CENTS||10000)/100).toFixed(2)} EUR fino a cancellazione.`:'Easy Come Audit: non selezionato.',
              '',
              'Esecuzione e consegna: hai richiesto l’avvio immediato della fornitura digitale. Il pacchetto viene reso disponibile nell’area personale dopo la conferma del pagamento e la generazione tecnica.',
              'Recesso: per i consumatori valgono i diritti inderogabili previsti dalla legge e le eccezioni applicabili a contenuti digitali e servizi; durante il checkout hai richiesto espressamente l’avvio immediato. La funzione online resta disponibile al link sotto.',
              `Termini accettati: ${session?.metadata?.terms_version||'EC-TOS-2026-08-10-v1'}`,
              'Politica rimborsi: EC-REF-2026-08-10-v1',
              '',
              `Fornitore: ${process.env.LEGAL_CONTROLLER_NAME||'Easy Come'}`,
              `Contatto: infoeasycome@libero.it`,
              '',
              `Profilo e ordini: ${app}/profilo`,
              `Termini: ${app}/termini`,
              `Rimborsi e recesso: ${app}/rimborsi`,
              `Recedere dal contratto qui: ${app}/recesso`,
            ].filter(Boolean).join('\n'),
          });
        }
      }
      if(subscriptionId&&session?.metadata?.user_id){
        let subscription={};try{subscription=await stripeGet(`subscriptions/${encodeURIComponent(subscriptionId)}`)}catch{}
        await upsertSubscription({user_id:session.metadata.user_id,order_id:orderId||null,plan_code:'audit_100',plan_name:'Easy Come Audit',amount_cents:Number(process.env.EASYCOME_AUDIT_MONTHLY_CENTS||10000),currency:'eur',status:subscription.status||'active',stripe_customer_id:stripeId(session.customer),stripe_subscription_id:subscriptionId,current_period_end:isoFromUnix(subscription.current_period_end),cancel_at_period_end:Boolean(subscription.cancel_at_period_end),metadata:{checkout_session_id:session.id},updated_at:new Date().toISOString()});
      }
    }

    if(event.type.startsWith('customer.subscription.')){
      const subscription=object;const subscriptionId=subscription.id;const userId=subscription.metadata?.user_id;const orderId=subscription.metadata?.order_id||null;
      const row={user_id:userId,order_id:orderId,plan_code:subscription.metadata?.plan_code||'audit_100',plan_name:'Easy Come Audit',amount_cents:Number(subscription.items?.data?.[0]?.price?.unit_amount||process.env.EASYCOME_AUDIT_MONTHLY_CENTS||10000),currency:subscription.currency||'eur',status:subscription.status||'unknown',stripe_customer_id:stripeId(subscription.customer),stripe_subscription_id:subscriptionId,current_period_end:isoFromUnix(subscription.current_period_end),cancel_at_period_end:Boolean(subscription.cancel_at_period_end),metadata:{event:event.type},updated_at:new Date().toISOString()};
      if(userId) await upsertSubscription(row); else await updateSubscriptionByStripeId(subscriptionId,{status:row.status,current_period_end:row.current_period_end,cancel_at_period_end:row.cancel_at_period_end,stripe_customer_id:row.stripe_customer_id,updated_at:row.updated_at});
      if(event.type==='customer.subscription.deleted'){
        await notifyAdmin({
          eventKey:`managed-ended:${subscriptionId}`,
          eventType:'audit.ended',
          severity:'high',
          title:'Easy Come Audit terminato',
          body:`Subscription ${subscriptionId} · utente ${userId||'non associato'}`,
          userId:userId||null,
          orderId,
          metadata:{stripe_event:event.id,stripe_subscription_id:subscriptionId},
        });
      }
    }

    if(['invoice.payment_failed','invoice.paid'].includes(event.type)){
      const subscriptionId=stripeId(object.subscription);
      if(subscriptionId) await updateSubscriptionByStripeId(subscriptionId,{status:event.type==='invoice.paid'?'active':'past_due',updated_at:new Date().toISOString()});
      if(event.type==='invoice.payment_failed'){
        await notifyAdmin({
          eventKey:`invoice-failed:${object.id||event.id}`,
          eventType:'audit.payment_failed',
          severity:'urgent',
          title:'Pagamento Audit fallito',
          body:`Fattura ${object.number||object.id||'—'} · cliente Stripe ${stripeId(object.customer)||'—'} · subscription ${subscriptionId||'—'}`,
          metadata:{stripe_event:event.id,invoice_id:object.id||null,stripe_subscription_id:subscriptionId||null},
        });
      }
    }
    return json(res,200,{received:true});
  }catch(error){console.error(error);return json(res,400,{error:error.message||'Webhook non valido.'})}
}
