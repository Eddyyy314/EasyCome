window.EASYCOME_SALES = {
  // customer = configuratore pubblico con checkout; builder = uso interno con download ZIP.
  mode: 'customer',

  // La preparazione mostra controlli reali e una progressione trasparente.
  // Nessun conto alla rovescia: la preparazione mostra un indicatore di lavoro.
  generationSeconds: 0,

  checkoutEndpoint: '/api/create-checkout-session',
  checkoutStatusEndpoint: '/api/checkout-status',

  // Facoltativo: fallback a un Payment Link Stripe statico se il backend non è ancora online.
  paymentUrl: '',

  supportEmail: 'ciao@easycome.it',
  whatsapp: '',
  termsUrl: '/termini',
  privacyUrl: '/privacy',

  // Metti true soltanto nella copia interna non pubblica.
  internalDownloadEnabled: false,
};
