export const MODULE_PRICES = Object.freeze({
  hospitality_core: 0, reports: 0, guest_comms: 0, tourist_tax: 0, audit: 0, easycome_hub: 0,
  channel_sync: 12, self_checkin: 10, dynamic_pricing: 12,
  expenses: 6, finance: 18, brain: 20, automations: 8, multiuser: 6, mobile_app: 12,
});

const LEGACY_MODULE_ALIASES = Object.freeze({
  portal: 'easycome_hub',
  public_portal: 'easycome_hub',
  client_portal: 'easycome_hub',
  hub: 'easycome_hub',
});

export function normalizeModuleIds(value) {
  const input = Array.isArray(value) ? value : [];
  return [...new Set(input.map((id) => LEGACY_MODULE_ALIASES[String(id)] || String(id)).filter(Boolean))];
}

const numberEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export function calculateServerPrice(project = {}) {
  const modules = normalizeModuleIds(project.modules);
  const unknown = modules.filter((id) => !(id in MODULE_PRICES));
  if (unknown.length) throw new Error(`Moduli non riconosciuti: ${unknown.join(', ')}`);

  const modulesTotal = modules.reduce((sum, id) => sum + MODULE_PRICES[id], 0);
  const customEntities = Array.isArray(project.customEntities) ? project.customEntities : [];
  const customEntitiesTotal = customEntities.length * 6;
  const customFieldsTotal = customEntities.reduce((sum, entity) => {
    const fields = Array.isArray(entity?.fields) ? entity.fields.length : 0;
    return sum + Math.max(0, fields - 6);
  }, 0);
  const automationTotal = (Array.isArray(project.automations) ? project.automations.length : 0) * 4;
  const pricingRulesTotal = project.pricing?.enabled
    ? Math.max(0, (Array.isArray(project.pricing?.rules) ? project.pricing.rules.length : 0) - 3) * 1
    : 0;
  const paidModuleCount = modules.filter((id) => MODULE_PRICES[id] > 0).length;
  const discountRate = paidModuleCount >= 8 ? 0.20 : paidModuleCount >= 5 ? 0.10 : 0;
  const bundleDiscount = Math.round(modulesTotal * discountRate * 100) / 100;
  const base = modules.includes('hospitality_core')
    ? numberEnv('EASYCOME_HOSPITALITY_BASE_PRICE', 199)
    : numberEnv('EASYCOME_BASE_PRICE', 99);
  const implementationSelected = true;
  const implementation = numberEnv('EASYCOME_IMPLEMENTATION_PRICE', 150);
  const extras = modulesTotal + customEntitiesTotal + customFieldsTotal + automationTotal + pricingRulesTotal - bundleDiscount;
  const total = Math.round((base + implementation + extras) * 100) / 100;
  return { base, implementation, modules: modulesTotal, customEntities: customEntitiesTotal, customFields: customFieldsTotal, automations: automationTotal, pricingRules: pricingRulesTotal, bundleDiscount, extras, total, totalCents: Math.round(total * 100) };
}

export function compactProject(project = {}) {
  const company = project.company || {};
  return {
    version: project.version || '1.0.0-hospitality',
    organizationId: project.organizationId || '',
    company: {
      name: String(company.name || '').slice(0, 160),
      email: String(company.email || '').slice(0, 200),
      industry: String(company.industry || '').slice(0, 160),
      description: String(company.description || '').slice(0, 2500),
      slug: String(company.slug || '').slice(0, 160),
      primaryColor: String(company.primaryColor || '').slice(0, 20),
      accentColor: String(company.accentColor || '').slice(0, 20),
      style: String(company.style || '').slice(0, 80),
      layout: String(company.layout || company.style || '').slice(0, 80),
      phone: String(company.phone || '').slice(0, 80),
      surfaceColor: String(company.surfaceColor || '').slice(0, 20),
      currency: String(company.currency || 'EUR').slice(0, 8),
      locale: String(company.locale || 'it-IT').slice(0, 20),
      logoData: /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(String(company.logoData || '')) && String(company.logoData || '').length <= 1200000 ? String(company.logoData) : '',
    },
    modules: normalizeModuleIds(project.modules).slice(0, 50),
    customEntities: Array.isArray(project.customEntities) ? project.customEntities.slice(0, 30) : [],
    automations: Array.isArray(project.automations) ? project.automations.slice(0, 40) : [],
    pricing: project.pricing || {},
    hospitality: project.hospitality || {},
    hub: project.hub || { enabled: true },
    delivery: {
      previewApproved: Boolean(project.delivery?.previewApproved),
      implementationSelected: true,
      managedServiceSelected: false,
      managedServicePrice: 0,
      notes: String(project.delivery?.notes || '').slice(0, 2500),
    },
  };
}
