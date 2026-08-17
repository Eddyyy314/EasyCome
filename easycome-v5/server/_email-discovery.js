import net from 'node:net';

const COMMON_PREFIX_SCORE = [
  ['info@', 100], ['commerciale@', 96], ['amministrazione@', 94], ['booking@', 92],
  ['prenotazioni@', 92], ['reception@', 90], ['segreteria@', 88], ['contatti@', 86],
  ['contact@', 84], ['hello@', 82], ['office@', 80]
];

function safeWebsite(raw='') {
  try {
    const url = new URL(String(raw).trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (!host || host === 'localhost' || host.endsWith('.local') || net.isIP(host)) return null;
    return url;
  } catch { return null; }
}

function decodeHtml(text='') {
  return String(text)
    .replace(/&#64;|&commat;/gi, '@')
    .replace(/&#46;|&period;/gi, '.')
    .replace(/&amp;/gi, '&')
    .replace(/\s+\[at\]\s+|\s+\(at\)\s+/gi, '@')
    .replace(/\s+\[dot\]\s+|\s+\(dot\)\s+/gi, '.');
}

function normalizeEmail(value='') {
  return String(value).trim().replace(/^mailto:/i, '').split('?')[0].trim().replace(/[),.;:>]+$/g, '').toLowerCase();
}

function isUsefulEmail(email='') {
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return false;
  if (/^(noreply|no-reply|donotreply|example|test)@/i.test(email)) return false;
  if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(email)) return false;
  return true;
}

function rankEmail(email, siteHost='') {
  let score = 20;
  for (const [prefix, value] of COMMON_PREFIX_SCORE) if (email.startsWith(prefix)) score = Math.max(score, value);
  if (/^(privacy|dpo|pec|legal|support|assistenza)@/i.test(email)) score -= 20;
  const domain = email.split('@')[1] || '';
  const normalizedHost = siteHost.replace(/^www\./, '');
  if (normalizedHost && (domain === normalizedHost || normalizedHost.endsWith('.'+domain) || domain.endsWith('.'+normalizedHost))) score += 35;
  return score;
}

function extractEmails(html='', siteHost='') {
  const decoded = decodeHtml(html);
  const found = new Set();
  for (const match of decoded.matchAll(/mailto:([^"'<>\s]+)/gi)) {
    const email = normalizeEmail(match[1]); if (isUsefulEmail(email)) found.add(email);
  }
  for (const match of decoded.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    const email = normalizeEmail(match[0]); if (isUsefulEmail(email)) found.add(email);
  }
  return [...found].sort((a,b)=>rankEmail(b,siteHost)-rankEmail(a,siteHost));
}

async function fetchHtml(url, timeoutMs=3200) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      redirect:'follow', signal:controller.signal,
      headers:{'user-agent':'Mozilla/5.0 (compatible; EasyComeProspectBot/2.0; +https://www.easy-come.it/)','accept':'text/html,application/xhtml+xml'}
    });
    if (!r.ok) return '';
    const type = r.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) return '';
    const text = await r.text();
    return text.slice(0, 700000);
  } catch { return ''; }
  finally { clearTimeout(timer); }
}

function cleanExternalUrl(href='', baseUrl) {
  try {
    const u = new URL(href, baseUrl);
    if (!['http:','https:'].includes(u.protocol)) return '';
    return u.href;
  } catch { return ''; }
}

function discoverLinks(html='', baseUrl) {
  const out={contactPage:'',instagram:'',facebook:'',whatsapp:''};
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const m of String(html).matchAll(re)) {
    const href=String(m[1]||'').trim();
    const lower=href.toLowerCase();
    const full=cleanExternalUrl(href,baseUrl);
    if (!full) continue;
    if (!out.instagram && /(^|\.)instagram\.com\//i.test(new URL(full).hostname + '/')) out.instagram=full;
    if (!out.facebook && /(^|\.)facebook\.com\//i.test(new URL(full).hostname + '/')) out.facebook=full;
    if (!out.whatsapp && /(wa\.me\/|api\.whatsapp\.com\/|whatsapp\.com\/send)/i.test(full)) out.whatsapp=full;
    if (!out.contactPage && /(contatt|contact|chi-siamo|about|azienda|impressum)/i.test(href)) {
      try { const u=new URL(href,baseUrl); if (u.origin===baseUrl.origin) out.contactPage=u.href; } catch {}
    }
  }
  return out;
}

function mergeLinks(a,b){return {contactPage:a.contactPage||b.contactPage||'',instagram:a.instagram||b.instagram||'',facebook:a.facebook||b.facebook||'',whatsapp:a.whatsapp||b.whatsapp||''}}

export async function discoverPublicBusinessContacts(website='') {
  const base = safeWebsite(website);
  if (!base) return {email:'',website:'',contactPage:'',instagram:'',facebook:'',whatsapp:''};
  const result={email:'',website:base.href,contactPage:'',instagram:'',facebook:'',whatsapp:''};
  const home=await fetchHtml(base.href);
  const emails=extractEmails(home,base.hostname);
  if(emails.length) result.email=emails[0];
  Object.assign(result,mergeLinks(result,discoverLinks(home,base)));

  const pages=[];
  if(result.contactPage) pages.push(result.contactPage);
  for(const path of ['/contatti','/contact']){
    try{const u=new URL(path,base.origin).href;if(!pages.includes(u)) pages.push(u)}catch{}
  }
  for(const url of pages.slice(0,2)){
    const html=await fetchHtml(url,2600);
    if(!result.email){const e=extractEmails(html,base.hostname);if(e.length)result.email=e[0]}
    Object.assign(result,mergeLinks(result,discoverLinks(html,base)));
    if(result.email && result.instagram && result.whatsapp) break;
  }
  return result;
}

export async function findPublicBusinessEmail(website='') {
  return (await discoverPublicBusinessContacts(website)).email || '';
}
