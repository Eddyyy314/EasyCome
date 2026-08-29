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
      redirect:'follow',
      signal:controller.signal,
      headers:{'user-agent':'Mozilla/5.0 (compatible; EasyComeProspectBot/1.0; +https://www.easy-come.it/)','accept':'text/html,application/xhtml+xml'}
    });
    if (!r.ok) return '';
    const type = r.headers.get('content-type') || '';
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) return '';
    const text = await r.text();
    return text.slice(0, 700000);
  } catch { return ''; }
  finally { clearTimeout(timer); }
}

function contactLinks(html='', baseUrl) {
  const links=[];
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const m of String(html).matchAll(re)) {
    const href=m[1];
    if (!/(contatt|contact|chi-siamo|about|azienda|impressum)/i.test(href)) continue;
    try {
      const u=new URL(href,baseUrl);
      if (u.origin!==baseUrl.origin) continue;
      links.push(u.href);
    } catch {}
    if (links.length>=3) break;
  }
  return [...new Set(links)];
}

export async function findPublicBusinessEmail(website='') {
  const base = safeWebsite(website);
  if (!base) return '';
  const home = await fetchHtml(base.href);
  let emails = extractEmails(home, base.hostname);
  if (emails.length) return emails[0];
  const candidates = contactLinks(home, base).slice(0,2);
  for (const url of candidates) {
    const html = await fetchHtml(url, 2600);
    emails = extractEmails(html, base.hostname);
    if (emails.length) return emails[0];
  }
  // Last resort: a couple of common contact pages, without crawling the whole website.
  for (const path of ['/contatti','/contact']) {
    try {
      const url = new URL(path, base.origin).href;
      if (candidates.includes(url)) continue;
      const html = await fetchHtml(url, 2200);
      emails = extractEmails(html, base.hostname);
      if (emails.length) return emails[0];
    } catch {}
  }
  return '';
}
