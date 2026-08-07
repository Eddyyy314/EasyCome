import { readRaw, json } from './_responses.js';
import { updateOrderById, updateOrderBySession, upsertSubscription, updateSubscriptionByStripeId } from './_supabase.js';
import { verifyStripeSignature, stripeGet } from './_stripe.js';

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
      const session=object;const orderId=session?.metadata?.order_id||session?.client_reference_id;const subscriptionId=stripeId(session?.subscription);
      const common={stripe_session_id:session?.id||null,payment_status:session?.payment_status||null,stripe_customer_id:stripeId(session?.customer),stripe_payment_intent_id:stripeId(session?.payment_intent),stripe_subscription_id:subscriptionId,updated_at:new Date().toISOString()};
      let patch=null;
      if(event.type==='checkout.session.completed') patch={...common,status:session.payment_status==='paid'?'paid':'processing',delivery_status:session.payment_status==='paid'?'ready_to_generate':'not_ready',paid_at:session.payment_status==='paid'?new Date().toISOString():null};
      if(event.type==='checkout.session.async_payment_succeeded') patch={...common,status:'paid',delivery_status:'ready_to_generate',paid_at:new Date().toISOString()};
      if(event.type==='checkout.session.async_payment_failed') patch={...common,status:'payment_failed'};
      if(event.type==='checkout.session.expired') patch={...common,status:'expired'};
      if(patch){if(orderId)await updateOrderById(orderId,patch);else if(session?.id)await updateOrderBySession(session.id,patch)}
      if(subscriptionId&&session?.metadata?.user_id){
        let subscription={};try{subscription=await stripeGet(`subscriptions/${encodeURIComponent(subscriptionId)}`)}catch{}
        await upsertSubscription({user_id:session.metadata.user_id,order_id:orderId||null,plan_code:'managed_tech_30',plan_name:'Gestione tecnica Easy Come',amount_cents:Number(process.env.EASYCOME_MANAGED_MONTHLY_CENTS||3000),currency:'eur',status:subscription.status||'active',stripe_customer_id:stripeId(session.customer),stripe_subscription_id:subscriptionId,current_period_end:isoFromUnix(subscription.current_period_end),cancel_at_period_end:Boolean(subscription.cancel_at_period_end),metadata:{checkout_session_id:session.id},updated_at:new Date().toISOString()});
      }
    }

    if(event.type.startsWith('customer.subscription.')){
      const subscription=object;const subscriptionId=subscription.id;const userId=subscription.metadata?.user_id;const orderId=subscription.metadata?.order_id||null;
      const row={user_id:userId,order_id:orderId,plan_code:subscription.metadata?.plan_code||'managed_tech_30',plan_name:'Gestione tecnica Easy Come',amount_cents:Number(subscription.items?.data?.[0]?.price?.unit_amount||process.env.EASYCOME_MANAGED_MONTHLY_CENTS||3000),currency:subscription.currency||'eur',status:subscription.status||'unknown',stripe_customer_id:stripeId(subscription.customer),stripe_subscription_id:subscriptionId,current_period_end:isoFromUnix(subscription.current_period_end),cancel_at_period_end:Boolean(subscription.cancel_at_period_end),metadata:{event:event.type},updated_at:new Date().toISOString()};
      if(userId) await upsertSubscription(row); else await updateSubscriptionByStripeId(subscriptionId,{status:row.status,current_period_end:row.current_period_end,cancel_at_period_end:row.cancel_at_period_end,stripe_customer_id:row.stripe_customer_id,updated_at:row.updated_at});
    }

    if(['invoice.payment_failed','invoice.paid'].includes(event.type)){
      const subscriptionId=stripeId(object.subscription);if(subscriptionId) await updateSubscriptionByStripeId(subscriptionId,{status:event.type==='invoice.paid'?'active':'past_due',updated_at:new Date().toISOString()});
    }
    return json(res,200,{received:true});
  }catch(error){console.error(error);return json(res,400,{error:error.message||'Webhook non valido.'})}
}
