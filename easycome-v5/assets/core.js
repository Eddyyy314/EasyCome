const EC = (() => {
  const KEY = 'easycome_masterpiece_v1';
  const seed = {
    business: {
      name: 'Casa Aurora',
      category: 'B&B · Boutique stay',
      city: 'Palinuro',
      phone: '+39 333 123 4567',
      email: 'ciao@casaurora.it',
      accent: '#ff5b35',
      mode: 'stay',
      tagline: 'Dormire a due passi dal mare, senza pensare a niente.',
      description: 'Tre camere luminose nel cuore di Palinuro. Prenota direttamente dal nostro sito e ricevi subito conferma.',
      address: 'Palinuro, Cilento',
      hours: 'Sempre aperto online'
    },
    services: [
      {id:'room-sea', name:'Camera Mare', duration:1440, price:118, capacity:1, kind:'stay', label:'Camera'},
      {id:'room-olive', name:'Camera Ulivo', duration:1440, price:104, capacity:1, kind:'stay', label:'Camera'},
      {id:'room-family', name:'Family Suite', duration:1440, price:154, capacity:1, kind:'stay', label:'Suite'}
    ],
    bookings: [
      {id:'EC-1048', customer:'Giulia Romano', email:'giulia@example.com', phone:'+39 333 602 1448', service:'Camera Mare', serviceId:'room-sea', date:'2026-09-10', endDate:'2026-09-12', time:'15:00', status:'confirmed', payment:'paid', amount:236, source:'Sito EasyCome', note:'Arrivo previsto verso le 16:30.'},
      {id:'EC-1049', customer:'Marco Ferri', email:'marco@example.com', phone:'+39 333 991 2012', service:'Camera Ulivo', serviceId:'room-olive', date:'2026-09-10', endDate:'2026-09-13', time:'15:00', status:'confirmed', payment:'deposit', amount:312, source:'Booking.com', note:'Serve culla.'},
      {id:'EC-1050', customer:'Elena Ricci', email:'elena@example.com', phone:'+39 333 100 0552', service:'Family Suite', serviceId:'room-family', date:'2026-09-11', endDate:'2026-09-14', time:'15:00', status:'pending', payment:'missing', amount:462, source:'WhatsApp', note:''},
      {id:'EC-1051', customer:'Luca Bianchi', email:'luca@example.com', phone:'+39 333 540 4491', service:'Camera Mare', serviceId:'room-sea', date:'2026-09-13', endDate:'2026-09-15', time:'15:00', status:'confirmed', payment:'paid', amount:236, source:'Sito EasyCome', note:''}
    ],
    tasks: [
      {id:'T-1', title:'Pulizia Camera Mare', date:'2026-09-12', time:'11:00', owner:'Housekeeping', bookingId:'EC-1048', done:false},
      {id:'T-2', title:'Preparare culla · Camera Ulivo', date:'2026-09-10', time:'14:00', owner:'Staff', bookingId:'EC-1049', done:false},
      {id:'T-3', title:'Pulizia Camera Ulivo', date:'2026-09-13', time:'11:00', owner:'Housekeeping', bookingId:'EC-1049', done:false}
    ],
    automations: [
      {id:'a1', name:'Conferma immediata', desc:'Invia la conferma appena arriva una prenotazione dal sito.', trigger:'Nuova prenotazione', action:'Email + WhatsApp', active:true},
      {id:'a2', name:'Reminder pre-arrivo', desc:'Ricorda al cliente il soggiorno 24 ore prima.', trigger:'24h prima', action:'Messaggio cliente', active:true},
      {id:'a3', name:'Pagamento mancante', desc:'Se manca un pagamento, prepara il sollecito e lo mette nelle eccezioni.', trigger:'Pagamento aperto', action:'Sollecito', active:true},
      {id:'a4', name:'Task dopo check-out', desc:'Crea automaticamente pulizia o reset della risorsa dopo la prenotazione.', trigger:'Fine prenotazione', action:'Crea task', active:true},
      {id:'a5', name:'Richiesta recensione', desc:'Invia una richiesta recensione il giorno dopo la fine del servizio.', trigger:'24h dopo', action:'Messaggio cliente', active:false}
    ],
    activity: [
      {time:'20:42', text:'Prenotazione EC-1051 confermata dal sito', type:'booking'},
      {time:'19:10', text:'Reminder inviato a Giulia Romano', type:'automation'},
      {time:'17:56', text:'Pagamento di €236 registrato', type:'payment'}
    ]
  };

  function load(){
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY));
      if(!parsed) return structuredClone(seed);
      return {...structuredClone(seed), ...parsed};
    } catch { return structuredClone(seed); }
  }
  function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function update(fn){ const s=load(); fn(s); save(s); return s; }
  function reset(){ localStorage.setItem(KEY, JSON.stringify(seed)); return load(); }
  function uid(prefix='EC'){ return prefix+'-'+Math.floor(1000+Math.random()*8999); }
  function money(n){ return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n||0)); }
  function dateLabel(iso, opts={day:'2-digit',month:'short'}){ try{return new Intl.DateTimeFormat('it-IT',opts).format(new Date(iso+'T12:00:00'))}catch{return iso} }
  function escape(v=''){ return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function addBooking(payload){
    return update(s=>{
      const service=s.services.find(x=>x.id===payload.serviceId) || s.services[0];
      const isStay=service?.kind==='stay';
      let endDate=payload.endDate || payload.date;
      let amount=Number(service?.price||0);
      if(isStay && payload.endDate){
        const nights=Math.max(1,Math.round((new Date(payload.endDate)-new Date(payload.date))/86400000));
        amount*=nights;
      }
      const booking={id:uid('EC'), customer:payload.customer, email:payload.email||'', phone:payload.phone||'', service:service?.name||'Servizio', serviceId:service?.id||'', date:payload.date, endDate, time:payload.time||'09:00', status:'confirmed', payment:'missing', amount, source:payload.source||'Sito EasyCome', note:payload.note||''};
      s.bookings.push(booking);
      s.activity.unshift({time:new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}),text:`${booking.customer} ha prenotato ${booking.service} dal sito`,type:'booking'});
      const auto=s.automations.find(a=>a.id==='a4'&&a.active);
      if(auto && isStay){ s.tasks.push({id:uid('T'),title:`Pulizia ${booking.service}`,date:endDate,time:'11:00',owner:'Staff',bookingId:booking.id,done:false}); }
    });
  }
  return {KEY,seed,load,save,update,reset,uid,money,dateLabel,escape,addBooking};
})();
window.EC=EC;
