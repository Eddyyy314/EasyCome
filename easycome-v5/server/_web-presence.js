const SOCIAL_HOSTS = [
  'facebook.com','fb.com','instagram.com','tiktok.com','linkedin.com','x.com','twitter.com','youtube.com','pinterest.com','threads.net'
];
const PLATFORM_HOSTS = [
  'linktr.ee','beacons.ai','bio.site','taplink.cc','msha.ke','campsite.bio',
  'google.com','goo.gl','maps.app.goo.gl','tripadvisor.com','tripadvisor.it','booking.com','airbnb.com','airbnb.it',
  'thefork.it','thefork.com','paginegialle.it','yelp.com','justeat.it','deliveroo.it','glovoapp.com'
];
function hostMatches(host,list){
  return list.some(d=>host===d||host.endsWith('.'+d));
}
export function classifyWebsitePresence(raw=''){
  const original=String(raw||'').trim();
  if(!original)return {type:'none',owned:false,url:'',original:'',label:'Nessun sito proprietario'};
  try{
    const value=/^https?:\/\//i.test(original)?original:`https://${original}`;
    const u=new URL(value);
    if(!['http:','https:'].includes(u.protocol))throw new Error('protocol');
    const host=u.hostname.toLowerCase().replace(/^www\./,'');
    if(hostMatches(host,SOCIAL_HOSTS))return {type:'social',owned:false,url:u.href,original,label:'Solo profilo social',host};
    if(hostMatches(host,PLATFORM_HOSTS))return {type:'platform',owned:false,url:u.href,original,label:'Solo pagina su piattaforma esterna',host};
    return {type:'owned',owned:true,url:u.href,original,label:'Sito proprietario',host};
  }catch{
    return {type:'invalid',owned:false,url:'',original,label:'URL non valido'};
  }
}
export function socialFieldsFromPresence(p={}){
  if(p.type!=='social'||!p.url)return {};
  const h=String(p.host||'');
  if(h.includes('facebook.com')||h==='fb.com')return {facebook:p.url};
  if(h.includes('instagram.com'))return {instagram:p.url};
  return {socialUrl:p.url};
}
