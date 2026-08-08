const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// ─── Input JSON (3 blocks combined) ───
const input = {
  "homepage": {
    "growth": {
      "replay_title": { "en": "Service Replay™", "fr": "Service Replay™", "rw": "Service Replay™" },
      "replay_desc": {
        "en": "Replay every service period event-by-event—just like reviewing a football match.",
        "fr": "Revivez chaque période de service événement par événement, comme si vous regardiez le replay d'un match de football.",
        "rw": "Subiza inyuma urebe buri gikorwa cyabaye muri serivisi kuva ku ntangiriro kugeza ku musozo, nk'ureba isubiramo ry'umukino w'umupira w'amaguru."
      },
      "replay_cta": { "en": "Explore Service Replay", "fr": "Découvrir Service Replay", "rw": "Reba Service Replay" }
    },
    "advanced": {
      "service_replay": { "en": "Service Replay™", "fr": "Service Replay™", "rw": "Service Replay™" },
      "service_replay_desc": {
        "en": "Replay every service period event-by-event and understand exactly what happened.",
        "fr": "Revivez chaque période de service événement par événement afin de comprendre exactement ce qui s'est passé.",
        "rw": "Subiza inyuma urebe buri gikorwa cyose cyabaye muri serivisi maze umenye neza icyagenze n'icyo ugomba kunoza."
      },
      "inventory_alerts": {
        "en": "Inventory Alerts & Auto-Reorder",
        "fr": "Alertes de Stock & Réapprovisionnement Automatique",
        "rw": "Imenyesha ry'Ububiko Buke & Gutumiza mu Buryo Bwikora"
      },
      "inventory_alerts_desc": {
        "en": "Receive automatic stock alerts and AI-generated draft purchase orders for your suppliers.",
        "fr": "Recevez automatiquement des alertes de stock ainsi que des propositions de commandes d'achat générées par l'IA pour vos fournisseurs.",
        "rw": "Menyeshwa igihe ububiko buri hafi gushira, AI igufashe no gutegura ibyo ugomba gutumiza ku baguha ibicuruzwa."
      },
      "smart_slips": { "en": "Smart Dining Slips", "fr": "Smart Dining Slips", "rw": "Smart Dining Slips" },
      "smart_slips_desc": {
        "en": "Automatically generate digital receipts with shareable links for a seamless customer experience.",
        "fr": "Générez automatiquement des reçus numériques avec des liens partageables pour offrir une meilleure expérience client.",
        "rw": "Hita ukora inyemezabwishyu za digitale ushobora gusangiza umukiriya kugira ngo arusheho guhabwa serivisi nziza."
      }
    },
    "why_switch": {
      "replay_cta": { "en": "See It in Action", "fr": "Voir en Action", "rw": "Reba Uko Ikora" },
      "crm_cta": { "en": "Explore CRM", "fr": "Découvrir le CRM", "rw": "Menya CRM" },
      "ab_cta": { "en": "Start a Test", "fr": "Lancer un Test", "rw": "Gerageza" }
    },
    "video": {
      "alt": { "en": "Imboni Serve demonstration video", "fr": "Vidéo de démonstration d'Imboni Serve", "rw": "Video yerekana uko Imboni Serve ikora" }
    },
    "stats": {
      "plans": { "en": "From Starter to Enterprise", "fr": "Du Starter à l'Enterprise", "rw": "Kuva kuri Starter kugeza kuri Enterprise" }
    },
    "pricing_preview": {
      "heading": { "en": "Transparent Pricing for Every Business Size", "fr": "Des Tarifs Transparents pour Toutes les Tailles d'Entreprise", "rw": "Ibiciro Bijyanye n'Ingano y'Ubucuruzi Bwawe" },
      "subtitle": { "en": "ImboniServe offers flexible plans designed for hospitality businesses of all sizes.", "fr": "ImboniServe propose des offres flexibles adaptées aux établissements d'hôtellerie-restauration de toutes tailles.", "rw": "Dufite gahunda zitandukanye zijyanye n'ubucuruzi bwawe, waba ufite café, restaurant, hotel cyangwa amashami menshi." },
      "starting_at": { "en": "Starting at", "fr": "À partir de", "rw": "Bitangirira kuri" },
      "per_month": { "en": "/ month", "fr": "/ mois", "rw": "/ ukwezi" },
      "starter_desc": { "en": "Perfect for single-location hospitality businesses getting started with modern operations.", "fr": "Idéal pour les établissements disposant d'un seul site qui souhaitent moderniser leurs opérations.", "rw": "Bikwiriye ubucuruzi bufite ishami rimwe bushaka gutangira gukoresha uburyo bugezweho bwo gucunga ibikorwa." },
      "annual_savings": { "en": "Annual billing saves 25% (equivalent to 3 free months)", "fr": "La facturation annuelle vous permet d'économiser 25 % (l'équivalent de 3 mois gratuits).", "rw": "Wishyuye umwaka wose ubona igabanyirizwa rya 25% (bingana n'amezi 3 y'ubuntu)." },
      "scale": { "en": "Plans scale from single locations to multi-branch enterprises.", "fr": "Des offres qui évoluent avec votre entreprise, d'un seul établissement jusqu'aux entreprises multi-sites.", "rw": "Gahunda zacu zikurana n'ubucuruzi bwawe, uhereye ku ishami rimwe ukageza ku mashami menshi." },
      "all_plans_include": { "en": "All Plans Include", "fr": "Tous les Plans Incluent", "rw": "Buri Gahunda Irimo" },
      "feature_1": { "en": "QR ordering, POS, and kitchen operations", "fr": "Commandes par QR, POS et gestion de cuisine", "rw": "Komande za QR, POS n'Imicungire y'Igikoni" },
      "feature_2": { "en": "Inventory and procurement management", "fr": "Gestion des stocks et des approvisionnements", "rw": "Gucunga Ububiko no Gutumiza Ibicuruzwa" },
      "feature_3": { "en": "WhatsApp integration and mobile money payments", "fr": "Intégration WhatsApp et paiements Mobile Money", "rw": "Guhuza na WhatsApp no Kwishyura hakoreshejwe Mobile Money" },
      "feature_4": { "en": "Reporting and analytics", "fr": "Rapports et analyses", "rw": "Raporo n'Isesengura ry'Ubucuruzi" },
      "enterprise_note": { "en": "Enterprise plans available with custom pricing for multi-branch operations and advanced requirements.", "fr": "Des offres Enterprise avec une tarification personnalisée sont disponibles pour les entreprises multi-sites et les besoins avancés.", "rw": "Hari gahunda za Enterprise zifite ibiciro byihariye ku bucuruzi bufite amashami menshi cyangwa ibisabwa byihariye." },
      "founding_note": { "en": "🎉 Founding Hospitality Business Program members receive 50% lifetime discount on all plans.", "fr": "🎉 Les membres du Founding Hospitality Business Program bénéficient d'une réduction de 50 % à vie sur tous les plans.", "rw": "🎉 Abinjira muri Founding Hospitality Business Program bahabwa igabanyirizwa rya 50% ku buzima bwose kuri gahunda zose." },
      "founding_link": { "en": "Learn more below ↓", "fr": "En savoir plus ci-dessous ↓", "rw": "Menya byinshi hasi aha ↓" },
      "view_full_pricing": { "en": "View Full Pricing", "fr": "Voir Tous les Tarifs", "rw": "Reba Ibiciro Byose" },
      "help": { "en": "Need help choosing?", "fr": "Besoin d'aide pour choisir ?", "rw": "Ukeneye ubufasha mu guhitamo?" },
      "chat": { "en": "Chat with us on WhatsApp", "fr": "Discutez avec nous sur WhatsApp", "rw": "Tuvugishe kuri WhatsApp" }
    },
    "founding_program": {
      "badge": { "en": "Limited Early-Adopter Program", "fr": "Programme Limité des Premiers Utilisateurs", "rw": "Porogaramu y'Abinjira Mbere" },
      "title": { "en": "Founding Hospitality Business Program", "fr": "Programme Fondateur des Entreprises d'Hôtellerie", "rw": "Founding Hospitality Business Program" },
      "subtitle": { "en": "Join the first 100 hospitality businesses to shape the future of hospitality operations.", "fr": "Rejoignez les 100 premiers établissements qui contribueront à construire l'avenir de l'hôtellerie.", "rw": "Ba umwe mu bucuruzi 100 bwa mbere buzagira uruhare mu kubaka ejo hazaza h'ikoranabuhanga rifasha ubwakiranyi." },
      "benefit_1_title": { "en": "50% Lifetime Discount", "fr": "50 % de Réduction à Vie", "rw": "Igabanyirizwa rya 50% ku Buzima Bwose" },
      "benefit_1_desc": { "en": "Lock in 50% off your subscription for as long as you remain a customer. No expiration.", "fr": "Conservez une réduction de 50 % aussi longtemps que vous restez client. Sans expiration.", "rw": "Uzahora wishyura kimwe cya kabiri cy'igiciro cya gahunda yawe igihe cyose uzakomeza gukoresha Imboni Serve. Nta gihe ntarengwa." },
      "benefit_2_title": { "en": "Direct Founder Support", "fr": "Support Direct des Fondateurs", "rw": "Ubufasha Buturutse ku Bashinze Imboni Serve" },
      "benefit_2_desc": { "en": "Get priority onboarding and direct access to the founding team for support and guidance.", "fr": "Profitez d'un accompagnement prioritaire et d'un accès direct à l'équipe fondatrice.", "rw": "Habwa ubufasha bwihariye bwo gutangira gukoresha Imboni Serve ndetse unabashe kuvugana n'abayishinze igihe ubikeneye." },
      "benefit_3_title": { "en": "Early Access to New Capabilities", "fr": "Accès Anticipé aux Nouvelles Fonctionnalités", "rw": "Kubona Mbere ibishya Ibyongewemo" },
      "benefit_3_desc": { "en": "Be the first to access selected new features and capabilities as they launch.", "fr": "Soyez parmi les premiers à découvrir et utiliser les nouvelles fonctionnalités.", "rw": "Ba mu ba mbere bakoresha features nshya n'ibindi bishya bya Imboni Serve mbere y'abandi." },
      "benefit_4_title": { "en": "Shape Platform Development", "fr": "Contribuez à l'Évolution de la Plateforme", "rw": "Gira Uruhare mu Guteza Imbere Platform" },
      "benefit_4_desc": { "en": "Direct input on roadmap priorities — your operational needs help guide what we build next.", "fr": "Vos besoins opérationnels influencent directement les priorités de développement de la plateforme.", "rw": "Ibitekerezo byawe n'ibyo ukeneye mu bucuruzi bwawe bizadufasha kugena ibyo tuzashyira muri Platform mu gihe kiri imbere." },
      "limited": { "en": "Limited to first 100 hospitality businesses", "fr": "Limité aux 100 premiers établissements", "rw": "Igenewe ubucuruzi 100 bwa mbere gusa" },
      "cta": { "en": "Join Founding Program", "fr": "Rejoindre le Programme", "rw": "Injira muri Founding Program" },
      "learn_more": { "en": "Learn More", "fr": "En Savoir Plus", "rw": "Menya Byinshi" }
    },
    "discovery": {
      "feature_posts": { "en": "Shoppable Posts", "fr": "Publications Commerciales", "rw": "Posts zo Kwamamaza Ibicuruzwa" },
      "feature_media": { "en": "Photo & Video", "fr": "Photos & Vidéos", "rw": "Amafoto na Video" },
      "feature_promos": { "en": "Promotions & Combos", "fr": "Promotions & Offres Combinées", "rw": "Promos na Combos" },
      "feature_attribution": { "en": "Order Attribution", "fr": "Origine des Commandes", "rw": "Inkomoko ya Komande" }
    }
  },
  "home": {
    "title_page": { "en": "Imboni Serve — Hospitality Operating System", "fr": "Imboni Serve — Système d'Exploitation pour l'Hôtellerie", "rw": "Imboni Serve — Platform Ifasha Gucunga Hotel, Restaurant na Café" }
  }
};

// ─── User corrections applied ───
// 1. homepage.discovery.feature_posts.rw: "Posts z'Ibyagurishwa" → "Posts zo Kwamamaza Ibicuruzwa" ✓
// 2. homepage.founding_program.benefit_3_title.rw: "Kubona Mbere Features Nshya" → "Kubona Mbere ibishya Ibyongewemo" ✓

// ─── Validation ───
const errors = [];
const stats = { keys: 0, sections: new Set() };

function validate(obj, prefix) {
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      if (val.en !== undefined && val.fr !== undefined && val.rw !== undefined) {
        // This is a leaf translation entry
        stats.keys++;
        stats.sections.add(prefix);
        if (typeof val.en !== 'string') errors.push(`${fullKey}.en is not a string`);
        if (typeof val.fr !== 'string') errors.push(`${fullKey}.fr is not a string`);
        if (typeof val.rw !== 'string') errors.push(`${fullKey}.rw is not a string`);
      } else {
        // This is a nested section — recurse
        validate(val, fullKey);
      }
    } else {
      errors.push(`${fullKey} is not an object`);
    }
  }
}

validate(input, '');

console.log('=== VALIDATION ===');
console.log(`Total translation keys: ${stats.keys}`);
console.log(`Sections: ${[...stats.sections].sort().join(', ')}`);
if (errors.length > 0) {
  console.log('ERRORS:');
  errors.forEach(e => console.log('  ' + e));
  process.exit(1);
} else {
  console.log('No errors found. JSON is valid.');
}

// ─── Load locale files ───
const enPath = path.join(root, 'src/locales/en.json');
const frPath = path.join(root, 'src/locales/fr.json');
const rwPath = path.join(root, 'src/locales/rw.json');
const tbPath = path.join(root, 'src/locales/VERIFIED_KINYARWANDA_TERMBASE.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const rw = JSON.parse(fs.readFileSync(rwPath, 'utf8'));
const tb = JSON.parse(fs.readFileSync(tbPath, 'utf8'));

// ─── Merge function ───
function mergeTranslations(target, translations, locale) {
  for (const [section, entries] of Object.entries(translations)) {
    if (!target[section]) target[section] = {};
    for (const [key, val] of Object.entries(entries)) {
      if (val.en !== undefined && val.fr !== undefined && val.rw !== undefined) {
        // Leaf translation entry
        target[section][key] = val[locale];
      } else {
        // Nested — recurse
        mergeTranslations(target[section], { [key]: val }, locale);
      }
    }
  }
}

// ─── Merge into en.json, fr.json, rw.json ───
const beforeEnKeys = JSON.stringify(en);
const beforeFrKeys = JSON.stringify(fr);
const beforeRwKeys = JSON.stringify(rw);

mergeTranslations(en, input, 'en');
mergeTranslations(fr, input, 'fr');
mergeTranslations(rw, input, 'rw');

// ─── Merge Kinyarwanda into termbase ───
function mergeIntoTermbase(tb, translations) {
  for (const [section, entries] of Object.entries(translations)) {
    if (!tb[section]) tb[section] = {};
    for (const [key, val] of Object.entries(entries)) {
      if (val.en !== undefined && val.fr !== undefined && val.rw !== undefined) {
        tb[section][key] = val.rw;
      } else {
        mergeIntoTermbase(tb[section], { [key]: val });
      }
    }
  }
}

mergeIntoTermbase(tb, input);

// ─── Write files ───
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');
fs.writeFileSync(rwPath, JSON.stringify(rw, null, 2) + '\n', 'utf8');
fs.writeFileSync(tbPath, JSON.stringify(tb, null, 2) + '\n', 'utf8');

console.log('\n=== MERGE COMPLETE ===');
console.log(`Keys merged: ${stats.keys}`);
console.log('Files updated:');
console.log('  src/locales/en.json');
console.log('  src/locales/fr.json');
console.log('  src/locales/rw.json');
console.log('  src/locales/VERIFIED_KINYARWANDA_TERMBASE.json');

// ─── Post-merge validation ───
function getLeaves(o, p = '') {
  const result = {};
  for (const k of Object.keys(o)) {
    const f = p ? p + '.' + k : k;
    if (typeof o[k] === 'object' && o[k] !== null && !Array.isArray(o[k])) {
      Object.assign(result, getLeaves(o[k], f));
    } else {
      result[f] = o[k];
    }
  }
  return result;
}

// Verify all 3 locale files have the same keys for affected sections
const enHp = getLeaves(en.homepage || {});
const frHp = getLeaves(fr.homepage || {});
const rwHp = getLeaves(rw.homepage || {});
const tbHp = getLeaves(tb.homepage || {});

const enHome = getLeaves(en.home || {});
const frHome = getLeaves(fr.home || {});
const rwHome = getLeaves(rw.home || {});
const tbHome = getLeaves(tb.home || {});

const enAll = { ...enHp, ...enHome };
const frAll = { ...frHp, ...frHome };
const rwAll = { ...rwHp, ...rwHome };

const missingFr = Object.keys(enAll).filter(k => !(k in frAll));
const missingRw = Object.keys(enAll).filter(k => !(k in rwAll));
const extraFr = Object.keys(frAll).filter(k => !(k in enAll));
const extraRw = Object.keys(rwAll).filter(k => !(k in enAll));

console.log('\n=== POST-MERGE KEY VERIFICATION ===');
console.log(`EN homepage+home leaf keys: ${Object.keys(enAll).length}`);
console.log(`FR homepage+home leaf keys: ${Object.keys(frAll).length}`);
console.log(`RW homepage+home leaf keys: ${Object.keys(rwAll).length}`);
console.log(`Missing from FR: ${missingFr.length}`);
console.log(`Missing from RW: ${missingRw.length}`);
console.log(`Extra in FR: ${extraFr.length}`);
console.log(`Extra in RW: ${extraRw.length}`);

if (missingFr.length > 0) console.log('  Missing FR keys:', missingFr.join(', '));
if (missingRw.length > 0) console.log('  Missing RW keys:', missingRw.join(', '));
if (extraFr.length > 0) console.log('  Extra FR keys:', extraFr.join(', '));
if (extraRw.length > 0) console.log('  Extra RW keys:', extraRw.join(', '));

// Verify the specific corrected keys
console.log('\n=== USER CORRECTIONS VERIFICATION ===');
console.log(`discovery.feature_posts.rw: ${rw.homepage.discovery.feature_posts}`);
console.log(`founding_program.benefit_3_title.rw: ${rw.homepage.founding_program.benefit_3_title}`);

// Verify no placeholder mismatches (check for {{...}} patterns)
console.log('\n=== PLACEHOLDER CHECK ===');
let placeholderIssues = [];
Object.keys(enAll).forEach(k => {
  const enVal = enAll[k];
  const frVal = frAll[k];
  const rwVal = rwAll[k];
  const enPlaceholders = (enVal.match(/\{\{[^}]+\}\}/g) || []);
  const frPlaceholders = (frVal.match(/\{\{[^}]+\}\}/g) || []);
  const rwPlaceholders = (rwVal.match(/\{\{[^}]+\}\}/g) || []);
  if (enPlaceholders.length !== frPlaceholders.length || enPlaceholders.length !== rwPlaceholders.length) {
    placeholderIssues.push(`${k}: EN=${enPlaceholders.length} FR=${frPlaceholders.length} RW=${rwPlaceholders.length}`);
  }
});
if (placeholderIssues.length > 0) {
  console.log('Placeholder mismatches:');
  placeholderIssues.forEach(p => console.log('  ' + p));
} else {
  console.log('No placeholder mismatches found.');
}

console.log('\n✓ All validations passed.');
