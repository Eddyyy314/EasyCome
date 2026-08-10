import { authenticatedUser } from '../server/_auth.js';
import { appOrigin, json } from '../server/_responses.js';
import { getSubscriptionByUser } from '../server/_supabase.js';
import { stripePost } from '../server/_stripe.js';

export default async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'Metodo non consentito.'});
  try{
    const user=await authenticatedUser(req);
    const subscription=await getSubscriptionByUser(user.id);
    if(!subscription?.stripe_customer_id) throw new Error('Nessun abbonamento Stripe collegato al tuo account.');
    const params=new URLSearchParams();params.set('customer',subscription.stripe_customer_id);params.set('return_url',`${appOrigin(req)}/profilo.html?tab=care`);
    const session=await stripePost('billing_portal/sessions',params);
    return json(res,200,{url:session.url});
  }catch(error){console.error(error);return json(res,400,{error:error.message||'Impossibile aprire la gestione abbonamento.'})}
}
