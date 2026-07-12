const { normalize } = require("./knowledge");

const DOMAIN_AGENCIES = {
  "Oila huquqi": {
    primary: "Fuqarolik ishlari bo'yicha sud",
    secondary: "FHDY organi yoki Davlat xizmatlari markazi",
    reason: "oila, aliment, ajrim va farzand bilan bog'liq talablar odatda sud yoki FHDY tartibida hal qilinadi"
  },
  "Fuqarolik huquqi": {
    primary: "Fuqarolik ishlari bo'yicha sud",
    secondary: "notarius, mediator yoki shartnomada ko'rsatilgan nizoni hal qilish organi",
    reason: "qarz, shartnoma, mulk va zarar nizolarida asosiy yo'l yozma talabnoma va sud tartibidir"
  },
  "Fuqarolik protsessi": {
    primary: "tegishli fuqarolik ishlari bo'yicha sud",
    secondary: "sud devonxonasi yoki e-sud tizimi",
    reason: "savol sudga murojaat qilish, da'vo, apellyatsiya yoki protsessual hujjat tartibiga taalluqli"
  },
  "Jinoyat huquqi": {
    primary: "ichki ishlar organi yoki prokuratura",
    secondary: "advokat/himoyachi",
    reason: "jinoyat alomatlari bo'lsa, ariza, dalilni saqlash va himoyachi ishtiroki muhim"
  },
  "Jinoyat protsessi": {
    primary: "tergov organi, prokuratura yoki sud",
    secondary: "advokat/himoyachi",
    reason: "tergov harakati, ushlab turish, ayblov yoki shikoyat tartibi protsessual muddatlarga bog'liq"
  },
  "Ma'muriy javobgarlik": {
    primary: "qarorni chiqargan organ yoki ma'muriy sud",
    secondary: "yuqori turuvchi organ",
    reason: "bayonnoma, jarima va qarorlar bo'yicha shikoyat odatda belgilangan qisqa muddatda beriladi"
  },
  "Soliq huquqi": {
    primary: "soliq organi yoki iqtisodiy/fuqarolik sudi",
    secondary: "soliq to'lovchining shaxsiy kabineti",
    reason: "soliq hisob-kitobi, qarzdorlik va tekshiruv hujjatlar bilan solishtirilishi kerak"
  },
  "Saylov huquqi": {
    primary: "uchastka, okrug yoki Markaziy saylov komissiyasi",
    secondary: "sud",
    reason: "saylovdagi buzilishlar tezkor qayd etilib, komissiya yoki sudga yuboriladi"
  },
  "Konstitutsiyaviy huquq": {
    primary: "vakolatli davlat organi, Ombudsman yoki sud",
    secondary: "yuqori turuvchi organ",
    reason: "asosiy huquq buzilishi bo'yicha rasmiy murojaat va javobni qayd etish muhim"
  }
};

const DOCUMENT_HINTS = {
  identity: "shaxsni tasdiqlovchi hujjat yoki tashkilot vakolatini tasdiqlovchi hujjat",
  demand: "yozma ariza, talabnoma yoki shikoyat",
  proof: "shartnoma, tilxat, chek, bank o'tkazmasi, foto/video, guvoh ma'lumoti yoki yozishma",
  official: "qaror, bayonnoma, xabarnoma, sud hujjati yoki rasmiy javob nusxasi",
  timeline: "voqea sanasi, hujjat olingan sana va murojaat yuborilganini tasdiqlovchi dalil"
};

function detectIntent(question = "") {
  const q = normalize(question);
  const intents = [];
  const rules = [
    ["moneyClaim", ["qarz", "pul", "undirish", "tolov", "to'lov", "zarar", "kompensatsiya"]],
    ["appeal", ["shikoyat", "apellyatsiya", "e'tiroz", "bekor", "norozi", "jarima"]],
    ["court", ["sud", "da'vo", "davo", "ariza", "sudga"]],
    ["family", ["aliment", "ajrim", "nikoh", "farzand", "otalik"]],
    ["criminalSafety", ["ushlab", "hibs", "qamoq", "tahdid", "zo'ravon", "firibgarlik", "o'g'irlik"]],
    ["tax", ["soliq", "deklaratsiya", "penya", "qarzdorlik"]],
    ["insurance", ["sug'urta", "polis", "yTH".toLowerCase(), "shikast", "avto"]]
  ];
  for (const [name, words] of rules) {
    if (words.some((word) => q.includes(normalize(word)))) intents.push(name);
  }
  return intents.length ? intents : ["generalAdvice"];
}

function extractLegalSignals(question = "") {
  const text = String(question);
  const q = normalize(text);
  const dates = [...text.matchAll(/\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g)].map((x) => x[0]).slice(0, 5);
  const money = [...text.matchAll(/\b\d+(?:[ .]\d{3})*(?:,\d+|\.\d+)?\s*(?:so['‘’`]?m|sum|usd|dollar|mln|ming)?\b/gi)]
    .map((x) => x[0].trim())
    .filter((x) => /\d/.test(x))
    .slice(0, 5);
  const article = [...q.matchAll(/\b\d+(?:-\d+)?\s*-?\s*modda\b/g)].map((x) => x[0]).slice(0, 5);
  const hasDocument = /(shartnoma|tilxat|bayonnoma|qaror|chek|kvitansiya|polis|guvohnoma|xabarnoma|ariza|yozishma)/.test(q);
  const hasOpponent = /(qarzdor|erim|xotinim|kontragent|ish beruvchi|sug'urta|soliq|inspektor|ypx|organ)/.test(q);
  const hasLocation = /(toshkent|viloyat|tuman|shahar|mahalla|sud|dxm)/.test(q);
  return { dates, money, article, hasDocument, hasOpponent, hasLocation };
}

function assessRisk(question = "", domainName = "") {
  const q = normalize(question);
  const flags = [];
  if (/(ushlab|hibs|qamoq|tintuv|ayblanuvchi|gumonlanuvchi)/.test(q)) {
    flags.push({ level: "critical", label: "erkinlik va jinoyat protsessi xavfi" });
  }
  if (/(zo'ravon|tahdid|hayot|sog'liq|urish|jarohat)/.test(q)) {
    flags.push({ level: "critical", label: "xavfsizlik yoki sog'liq xavfi" });
  }
  if (/(muddat|apellyatsiya|shikoyat|bayonnoma|jarima|qaror)/.test(q)) {
    flags.push({ level: "high", label: "shikoyat yoki protsessual muddat xavfi" });
  }
  if (/(aliment|farzand|bola|voyaga yetmagan)/.test(q) || domainName === "Oila huquqi") {
    flags.push({ level: "medium", label: "farzand yoki oila manfaatlari" });
  }
  if (/(pul|qarz|zarar|mulk|soliq|penya)/.test(q)) {
    flags.push({ level: "medium", label: "moliyaviy zarar yoki qarzdorlik" });
  }
  return flags;
}

function missingFacts(question = "", domainName = "") {
  const signals = extractLegalSignals(question);
  const missing = [];
  if (!signals.dates.length) missing.push("voqea yoki hujjat olingan sana");
  if (!signals.hasDocument) missing.push("asosiy hujjat turi: shartnoma, qaror, bayonnoma, tilxat yoki boshqa dalil");
  if (!signals.hasOpponent) missing.push("qarshi tomon yoki vakolatli organ kimligi");
  if (!signals.hasLocation && ["Fuqarolik protsessi", "Ma'muriy javobgarlik", "Oila huquqi"].includes(domainName)) {
    missing.push("hudud: tuman/shahar yoki qaysi organ/sud");
  }
  return missing.slice(0, 4);
}

function recommendedDocuments(domainName = "", personType = "individual") {
  const docs = [
    DOCUMENT_HINTS.identity,
    DOCUMENT_HINTS.demand,
    DOCUMENT_HINTS.proof,
    DOCUMENT_HINTS.timeline
  ];
  if (["Ma'muriy javobgarlik", "Jinoyat protsessi", "Soliq huquqi"].includes(domainName)) docs.push(DOCUMENT_HINTS.official);
  if (domainName === "Oila huquqi") docs.push("FHDY hujjati, bolaning tug'ilganlik guvohnomasi va daromad/ta'minotga oid ma'lumotlar");
  if (domainName === "Soliq huquqi") docs.push("soliq hisoboti, shaxsiy kabinet ma'lumotlari va birlamchi buxgalteriya hujjatlari");
  if (personType === "legal") docs.push("ustav, rahbar buyrug'i yoki ishonchnoma, STIR va tashkilot rekvizitlari");
  return [...new Set(docs)].slice(0, 7);
}

function sourceAudit(local = {}, online = []) {
  const results = Array.isArray(local.results) ? local.results : [];
  const topScore = results[0]?.score || 0;
  const localCount = results.length;
  const onlineCount = Array.isArray(online) ? online.length : 0;
  const notes = [];
  if (localCount >= 4) notes.push("lokal qonun bazasida bir nechta mos norma topildi");
  else if (localCount >= 1) notes.push("lokal bazada yaqin norma bor, lekin qo'shimcha fakt kerak");
  else notes.push("lokal bazada yetarli mos norma topilmadi");
  if (onlineCount) notes.push("rasmiy onlayn manba ham tekshirildi");
  else notes.push("rasmiy onlayn manba natijasi yo'q yoki o'chirilgan");
  return { localCount, onlineCount, topScore, notes };
}

function confidenceLevel({ question = "", local = {}, online = [] }) {
  const audit = sourceAudit(local, online);
  const miss = missingFacts(question, local.domain?.name || "");
  let score = 0;
  if (audit.localCount >= 4) score += 45;
  else if (audit.localCount >= 2) score += 30;
  else if (audit.localCount === 1) score += 15;
  if (audit.topScore >= 30) score += 20;
  else if (audit.topScore >= 15) score += 10;
  if (audit.onlineCount > 0) score += 20;
  score -= Math.min(20, miss.length * 5);
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return {
    level,
    score: Math.max(0, Math.min(100, score)),
    reasons: [...audit.notes, miss.length ? `aniqlashtirilishi kerak: ${miss.join(", ")}` : "asosiy faktlar yetarli ko'rinadi"]
  };
}

function buildLegalStrategy({ question = "", personType = "individual", local = {}, online = [] }) {
  const domainName = local.domain?.name || "Umumiy huquqiy masala";
  const agency = DOMAIN_AGENCIES[domainName] || {
    primary: "vakolatli davlat organi yoki sud",
    secondary: "yurist/advokat",
    reason: "huquq sohasi aniq bo'lmagani uchun avval vakolatli organ va tartib aniqlanishi kerak"
  };
  const riskFlags = assessRisk(question, domainName);
  const missing = missingFacts(question, domainName);
  const confidence = confidenceLevel({ question, local, online });
  const intents = detectIntent(question);
  const documents = recommendedDocuments(domainName, personType);
  const signals = extractLegalSignals(question);
  const riskText = riskFlags.length
    ? riskFlags.map((x) => `${x.level}: ${x.label}`).join("; ")
    : "kritik xavf belgisi topilmadi, lekin muddat va hujjatlarni baribir tekshirish kerak";
  return {
    domainName,
    intents,
    agency,
    riskFlags,
    riskText,
    missing,
    confidence,
    documents,
    signals,
    summary: `${agency.primary} yo'nalishi tekshiriladi; sabab: ${agency.reason}.`
  };
}

module.exports = {
  detectIntent,
  extractLegalSignals,
  assessRisk,
  missingFacts,
  recommendedDocuments,
  sourceAudit,
  confidenceLevel,
  buildLegalStrategy
};
