(function(){'use strict';
  const base=window.EASYCOME_LEGAL||{};const local=base.controller||{};
  const text=(sel,val)=>document.querySelectorAll(sel).forEach(el=>{if(val){el.textContent=val;el.closest('[data-optional-row]')?.removeAttribute('hidden')}else if(el.dataset.fallback){el.textContent=el.dataset.fallback}});
  const mail=(sel,val)=>document.querySelectorAll(sel).forEach(el=>{if(val){el.textContent=val;el.href=`mailto:${val}`;el.closest('[data-optional-row]')?.removeAttribute('hidden')}else{el.removeAttribute('href');el.textContent='Da configurare prima del lancio'}});
  async function init(){let remote={};try{const r=await fetch('/api/public-config',{cache:'no-store'});if(r.ok)remote=await r.json()}catch(_){}
    const legal=remote.legal||{};
    const name=legal.controllerName||local.legalName||local.brand||'Easy Come';
    const address=legal.address||local.address||'';
    const privacy=legal.privacyEmail||local.privacyEmail||'';
    const support=legal.supportEmail||local.supportEmail||privacy||'';
    const vat=legal.vatNumber||local.vatNumber||'';
    const rea=legal.rea||local.rea||'';
    const pec=legal.pec||local.pec||'';
    text('[data-legal-controller]',name);text('[data-legal-address]',address);text('[data-legal-vat]',vat);text('[data-legal-rea]',rea);text('[data-legal-pec]',pec);
    mail('[data-legal-email]',privacy);mail('[data-legal-support]',support);
    text('[data-legal-updated]',base.lastUpdated||'29 agosto 2026');
    document.querySelectorAll('[data-legal-missing]').forEach(el=>{el.hidden=Boolean(name&&support)});
  }document.addEventListener('DOMContentLoaded',init);
})();