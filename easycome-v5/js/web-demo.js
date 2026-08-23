(function(){'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const slug=new URLSearchParams(location.search).get('d')||'';
function initials(name){return String(name||'EC').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function fail(m){$('#webApp').className='web-loading';$('#webApp').innerHTML=`<div><b>Anteprima non disponibile</b><p>${esc(m)}</p><a href="/">Easy Come →</a></div>`}
function setVars(p){const a=p.art||{};for(const [k,v] of Object.entries({bg:a.bg,surface:a.surface,ink:a.ink,accent:a.accent,muted:a.muted,contrast:a.contrast,radius:(a.radius||20)+'px'}))document.documentElement.style.setProperty('--'+k,v);document.documentElement.style.setProperty('--display',`"${a.display||'Georgia'}"`);document.documentElement.style.setProperty('--body',`"${a.body||'Inter'}"`)}
function render(p){
  const b=p.business,h=p.hero,a=p.art||{},img=p.images||{};setVars(p);document.title=`Easy Come Web — ${b.name}`;
  $('#webApp').className='';
  $('#webApp').innerHTML=`
  <div class="wf-bar">
    <div class="wf-brand"><b>EC</b><div><span>EASY COME WEB · PREVIEW</span><small>PRODOTTO INDIPENDENTE · ${esc((a.label||'ART DIRECTION').toUpperCase())}</small></div></div>
    <div class="wf-actions"><button class="active" data-view="desktop">DESKTOP</button><button data-view="mobile">MOBILE</button><a href="factory.html" target="_top">← FACTORY</a></div>
  </div>
  <div class="wf-stage" id="stage">
    <div class="preview-site art-${esc(a.layout||'studio')}">
      <header class="site-nav"><div class="site-brand"><span>${esc(initials(b.name))}</span><div><strong>${esc(b.name)}</strong><small>${esc(b.category)}</small></div></div><nav><a href="#services">Servizi</a><a href="#story">Chi siamo</a><a href="#contact">Contatti</a><a class="nav-cta" href="#contact">${esc(p.cta.label)} ↗</a></nav><button>MENU</button></header>
      <main>
        <section class="hero">
          <div class="hero-copy"><span class="kicker">${esc(h.eyebrow)}</span><h1>${esc(h.headline)}</h1><p>${esc(h.intro)}</p><div class="hero-actions"><a class="primary" href="#contact">${esc(p.cta.label)} ↗</a><a href="#services">Scopri i servizi →</a></div></div>
          <div class="hero-media"><img src="${esc(img.hero||h.image||'')}" alt=""><div class="media-label"><b>01</b><span>${esc(b.name)}</span><small>${esc(b.category)}</small></div></div>
        </section>
        <section class="ticker"><div><span>${esc(b.category)}</span><i>✦</i><span>${esc(b.name)}</span><i>✦</i><span>IDENTITÀ DIGITALE</span><i>✦</i><span>MOBILE FIRST</span><i>✦</i><span>${esc(b.category)}</span><i>✦</i><span>${esc(b.name)}</span></div></section>
        <section class="intro"><div><span class="kicker">IL PUNTO</span><h2>Farsi scegliere prima ancora del primo contatto.</h2></div><div><p>${esc(h.intro)}</p><div class="mini-stats">${(p.highlights||[]).slice(0,3).map(x=>`<article><b>${esc(x.value)}</b><span>${esc(x.label)}</span></article>`).join('')}</div></div></section>
        <section class="services" id="services"><header><span class="kicker">SERVIZI</span><h2>Quello che fai, con la gerarchia che merita.</h2></header><div class="service-grid">${(p.services||[]).slice(0,3).map((s,i)=>`<article><span>0${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><a href="#contact">Approfondisci →</a></article>`).join('')}</div></section>
        <section class="story" id="story"><div class="story-image"><img src="${esc(img.secondary||img.hero||'')}" alt=""></div><div class="story-copy"><span class="kicker">IL METODO</span><h2>${(p.method||[]).map(esc).join('.<br>')}.</h2><ol>${(p.method||[]).map((x,i)=>`<li><b>0${i+1}</b><span>${esc(x)}</span></li>`).join('')}</ol></div></section>
        <section class="closing" id="contact"><span class="kicker">IL PROSSIMO PASSO</span><h2>Un buon sito non chiede attenzione.<br>La merita.</h2><a href="#">${esc(p.cta.label)} ↗</a><small>${esc(b.phone||b.email||b.address||'Contatto diretto')}</small></section>
      </main>
      <footer><div><div class="site-brand invert"><span>${esc(initials(b.name))}</span><div><strong>${esc(b.name)}</strong><small>${esc(b.category)}</small></div></div><p>${esc(h.intro)}</p></div><div><small>CONTATTI</small>${b.phone?`<a>${esc(b.phone)}</a>`:''}${b.email?`<a>${esc(b.email)}</a>`:''}<span>${esc(b.address||'')}</span></div><div><small>SITO</small><a>Servizi</a><a>Chi siamo</a><a>Contatti</a></div></footer>
    </div>
  </div>`;
  document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===btn));$('#stage').classList.toggle('mobile',btn.dataset.view==='mobile')});
}
async function init(){try{if(!slug)throw new Error('Link incompleto.');const r=await fetch(`/api/demo-public?slug=${encodeURIComponent(slug)}`,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Anteprima non disponibile.');render(d.websiteProfile)}catch(e){fail(e.message)}}
init();
})();
