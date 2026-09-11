import { authenticatedUser } from '../_auth.js';
import { ECGenerator } from '../_generator-node.js';
import { createZipBytes } from '../_zip-node.js';
import { getOrderById, updateOrderById } from '../_supabase.js';

const safeName=(v)=>String(v||'gestionale-easycome').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'gestionale-easycome';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Metodo non consentito.'});
  try{
    const user=await authenticatedUser(req);const orderId=String(req.query?.order_id||'').trim();
    const order=await getOrderById(orderId);if(!order||order.user_id!==user.id) throw new Error('Ordine non disponibile per questo account.');
    if(order.status!=='paid') throw new Error('Il pagamento non risulta confermato.');
    if(!order.project||typeof order.project!=='object') throw new Error('Configurazione del progetto non disponibile.');
    const project=structuredClone(order.project);project.identity={...(project.identity||{}),supabaseUrl:String(process.env.SUPABASE_URL||''),supabaseAnonKey:String(process.env.SUPABASE_ANON_KEY||''),ownerUserId:order.user_id,ownerEmail:order.customer_email,easycomeBaseUrl:String(process.env.APP_URL||'https://easy-come.it').replace(/\/$/,''),dataMode:'local'};project.organizationId=project.organizationId||order.id;project.delivery={...(project.delivery||{}),previewApproved:true};
    const generated=ECGenerator.generatePackage(project);const zip=createZipBytes(generated.files);const filename=`${safeName(order.company_name||project.company?.name)}-easycome-studio-v8.zip`;const now=new Date().toISOString();
    await updateOrderById(order.id,{prepared_filename:filename,download_count:Number(order.download_count||0)+1,last_downloaded_at:now,updated_at:now});
    res.setHeader('content-type','application/zip');res.setHeader('content-disposition',`attachment; filename="${filename}"`);res.setHeader('cache-control','private,no-store,max-age=0');return res.status(200).send(Buffer.from(zip));
  }catch(error){console.error(error);return res.status(400).json({error:error.message||'Impossibile scaricare il pacchetto.'})}
}
