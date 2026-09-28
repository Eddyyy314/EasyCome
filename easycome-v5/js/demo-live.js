(function(){'use strict';
const $=(s,r=document)=>r.querySelector(s);const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const slug=new URLSearchParams(location.search).get('d')||'';let payload=null,spinTimer=null;
function initials(name){return String(name||'EC').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()}
function fail(m){$('#app').className='';$('#app').innerHTML=`<section class="error"><b>EASY COME CREATIVE</b><h1>Proposta non disponibile</h1><p>${esc(m)}</p></section>`}
function event(name){fetch('/api/demo-event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,event:name})}).catch(()=>{})}
function render(){const {place,model,creative}=payload;const campaigns=creative?.campaigns||[];document.documentElement.style.setProperty('--brand',model.color||'#ff6b35');document.documentElement.style.setProperty('--accent',model.accent||'#171815');
$('#app').className='';$('#app').innerHTML=`
<div class="fx-shell">
  <header class="fx-top"><div class="ec-brand"><span>EC</span><div><b>Easy Come</b><small>CREATIVE</small></div></div><div class="concept-pill">CREATIVE PROPOSAL · 3 DIRECTIONS</div></header>
  <main class="fx-main">
    <section class="copy"><span class="eyebrow">CREATIVE STRATEGY PREPARED FOR</span><h1>${esc(place.name)}</h1><p>${esc(creative?.diagnosis?.positioning||model.description)}</p>
      <div class="chips"><span>${esc(place.category)}</span><span>${esc(creative?.diagnosis?.tone||'Social-first')}</span><span>Custom creative</span></div>
      <div class="offer"><div><small>PROPOSTA CREATIVA</small><strong>3 campagne</strong><span>TikTok / UGC / Paid Social</span></div><a href="mailto:edoardolaneve8@gmail.com?subject=${encodeURIComponent('Creative proposal per '+place.name)}">PARLIAMONE →</a></div>
      <div class="features">${campaigns.map((c,i)=>`<article><b>0${i+1}</b><span><strong>${esc(c.name)}</strong><small>${esc(c.format)} · ${esc(c.goal)}</small></span></article>`).join('')}</div>
    </section>
    <section class="phone-wrap"><div class="phone"><div class="camera"><div class="fake-person"><div class="head"></div><div class="body"></div></div>
      <div class="brand-badge"><span>${esc(initials(place.name))}</span><small>${esc(place.name)}</small></div>
      <div class="filter-ui"><small>${esc(model.subline)}</small><h2>${esc(model.headline)}</h2><div class="result-card"><span>${esc(model.icon||'✦')}</span><strong id="resultText">${esc(model.results?.[0]||'YOUR MATCH')}</strong><em>CREATIVE DEMO</em></div><button id="spin">TAP TO START</button></div>
      <div class="tiktok-bar"><span>Effects</span><i></i><span>Share</span></div></div></div><p class="hint">Direzione #1 · anteprima interattiva</p></section>
  </main>
  <section class="proposal-section"><div class="proposal-head"><span class="eyebrow">CAMPAIGN SYSTEM</span><h2>Tre idee. Un unico brand.</h2><p>Non proponiamo un contenuto isolato: costruiamo una mini-campagna adattata ai canali dove può rendere meglio.</p></div><div class="proposal-cards">${campaigns.map((c,i)=>`<article class="proposal-card"><span>0${i+1} · ${esc(c.format)}</span><h3>${esc(c.name)}</h3><b>${esc(c.hook)}</b><p>${esc(c.mechanic)}</p><small>CTA · ${esc(c.cta)}</small></article>`).join('')}</div></section>
  <footer><span>Concept strategico basato su informazioni pubbliche. Prodotti, offerte, claim e asset finali vengono verificati e approvati con il cliente prima della produzione.</span><b translate="no">Google Maps</b></footer>
</div>`;
$('#spin').onclick=spin;event('view');}
function spin(){if(spinTimer)return;const r=payload.model.results||[];if(!r.length)return;event('interact');let ticks=0;$('#spin').textContent='CHOOSING…';spinTimer=setInterval(()=>{const i=Math.floor(Math.random()*r.length);$('#resultText').textContent=r[i];ticks++;if(ticks>=20){clearInterval(spinTimer);spinTimer=null;$('#spin').textContent='TRY AGAIN';$('#resultText').classList.remove('pop');void $('#resultText').offsetWidth;$('#resultText').classList.add('pop')}},80)}
fetch(`/api/demo-public?slug=${encodeURIComponent(slug)}`,{cache:'no-store'}).then(r=>r.json().then(d=>{if(!r.ok)throw new Error(d.error||'Proposta non disponibile');return d})).then(d=>{payload=d;render()}).catch(e=>fail(e.message));
})();
