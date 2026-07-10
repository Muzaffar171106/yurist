const DXM_SOURCE = "https://gov.uz/oz/adliya/sections/view/2828";
const CACHE_MS = 24 * 60 * 60 * 1000;

let officeCache = { loadedAt: 0, offices: [] };

function decodeEscapedHtml(value = "") {
  return value
    .replace(/\\u003c/g, "<").replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&").replace(/\\u0027/g, "'")
    .replace(/\\r\\n|\\t/g, " ")
    .replace(/\\"/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ");
}

function stripTags(value = "") {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseDxmOffices(html) {
  const rows = [...html.matchAll(/\\u003ctr\\u003e([\s\S]*?)\\u003c\/tr\\u003e/g)];
  const offices = [];
  let region = "";

  for (const match of rows) {
    const row = decodeEscapedHtml(match[1]);
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => x[1]);
    if (cells.length === 1) {
      const value = stripTags(cells[0]);
      if (value && !/davlat xizmatlari/i.test(value)) region = value;
      continue;
    }
    if (cells.length < 6) continue;
    const coordinates = stripTags(cells[5]).match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
    if (!coordinates) continue;
    const mapUrl = cells[4].match(/href="(https:\/\/[^"]+)"/i)?.[1]
      || `https://www.google.com/maps?q=${coordinates[1]},${coordinates[2]}`;
    offices.push({
      id: `dxm-${offices.length + 1}`,
      type: "Davlat xizmatlari markazi",
      region,
      name: stripTags(cells[1]),
      address: stripTags(cells[2]),
      phone: stripTags(cells[3]),
      mapUrl,
      latitude: Number(coordinates[1]),
      longitude: Number(coordinates[2]),
      source: DXM_SOURCE
    });
  }
  return offices;
}

async function getDxmOffices() {
  if (officeCache.offices.length && Date.now() - officeCache.loadedAt < CACHE_MS) {
    return officeCache.offices;
  }
  const response = await fetch(DXM_SOURCE, {
    signal: AbortSignal.timeout(12000),
    headers: { "user-agent": "YuristAI-UZ/1.1" }
  });
  if (!response.ok) throw new Error(`DXM katalogi HTTP ${response.status}`);
  const offices = parseDxmOffices(await response.text());
  if (!offices.length) throw new Error("DXM katalogidan manzillar ajratilmadi");
  officeCache = { loadedAt: Date.now(), offices };
  return offices;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => value * Math.PI / 180;
  const earth = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearest(offices, latitude, longitude, limit = 3) {
  return offices.map((office) => ({
    ...office,
    distanceKm: Number(distanceKm(latitude, longitude, office.latitude, office.longitude).toFixed(1))
  })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit);
}

const ROUTES = {
  "Oila huquqi": {
    primary: "FHDY organi yoki fuqarolik ishlari bo'yicha sud",
    explanation: "Nikohni qayd etish va FHDY xizmatlari uchun DXM/My.gov, aliment yoki ajrim nizosi uchun fuqarolik sudi vakolatli bo'lishi mumkin.",
    documents: ["pasport yoki ID-karta", "nikoh qaydi hujjati", "bolaning tug'ilganlik guvohnomasi", "daromad va yashash joyiga oid ma'lumot", "mavjud sud qarori yoki kelishuv"],
    onlineUrl: "https://my.gov.uz/uz/spheres",
    onlineLabel: "My.gov xizmatlarini ko'rish"
  },
  "Fuqarolik huquqi": {
    primary: "Fuqarolik ishlari bo'yicha sud yoki Davlat xizmatlari markazi",
    explanation: "Qarz, shartnoma va mulk nizolari odatda fuqarolik sudi orqali hal qilinadi; ayrim ro'yxatga olish xizmatlari DXM orqali olinadi.",
    documents: ["pasport yoki tashkilot vakolati", "shartnoma yoki tilxat", "to'lov hujjatlari", "yozma talabnoma", "yozishma va boshqa dalillar"],
    onlineUrl: "https://my.sud.uz/",
    onlineLabel: "My.sud.uz xizmatlariga o'tish"
  },
  "Fuqarolik protsessi": {
    primary: "Fuqarolik ishlari bo'yicha vakolatli sud",
    explanation: "Da'vo, sud buyrug'i, apellyatsiya va ijro hujjatlari sud tizimi orqali yuritiladi.",
    documents: ["da'vo yoki ariza", "talabni tasdiqlovchi dalillar", "davlat boji hujjati", "taraflar uchun nusxalar", "vakolat hujjati"],
    onlineUrl: "https://my.sud.uz/",
    onlineLabel: "Elektron sud xizmatlari"
  },
  "Ma'muriy javobgarlik": {
    primary: "Qarorni chiqargan organ yoki vakolatli sud",
    explanation: "Avval bayonnoma/qarorni rasmiylashtirgan organ aniqlanadi, keyin qarorda ko'rsatilgan shikoyat organi yoki sudga murojaat qilinadi.",
    documents: ["qaror va bayonnoma nusxasi", "pasport yoki ID-karta", "foto/video dalillar", "guvoh ma'lumotlari", "yozma e'tiroz yoki shikoyat"],
    onlineUrl: "https://my.sud.uz/",
    onlineLabel: "Sud xizmatlarini ko'rish"
  },
  "Jinoyat huquqi": {
    primary: "Ichki ishlar organi, prokuratura yoki 102",
    explanation: "Jinoyat alomati yoki bevosita xavf bo'lsa, eng yaqin ichki ishlar organi yoxud 102 ga murojaat qilinadi.",
    documents: ["shaxsni tasdiqlovchi hujjat", "voqea bayoni", "foto/video va asl fayllar", "guvohlar aloqa ma'lumoti", "zarar yoki jarohatni tasdiqlovchi hujjat"],
    onlineUrl: "https://murojaat.gov.uz/oz",
    onlineLabel: "Rasmiy elektron murojaat"
  },
  "Jinoyat protsessi": {
    primary: "Tergov organi, prokuratura yoki jinoyat ishlari bo'yicha sud",
    explanation: "Organ protsessual maqom va shikoyat qilinayotgan qarorga qarab tanlanadi.",
    documents: ["protsessual qaror yoki bayonnoma", "shikoyat matni", "dalillar nusxasi", "advokat orderi yoki ishonchnoma", "hujjat olingan sanani tasdiqlash"],
    onlineUrl: "https://murojaat.gov.uz/oz",
    onlineLabel: "Rasmiy elektron murojaat"
  },
  "Soliq huquqi": {
    primary: "Hududiy soliq organi yoki soliq xizmatining shaxsiy kabineti",
    explanation: "Hisob-kitob, qarzdorlik va soliq qarorlari bo'yicha hududiy soliq organiga yoki elektron kabinet orqali murojaat qilinadi.",
    documents: ["pasport/JShShIR yoki STIR", "soliq xabarnomasi", "hisobot va deklaratsiya", "birlamchi hisob hujjatlari", "to'lov hujjatlari"],
    onlineUrl: "https://my.soliq.uz/",
    onlineLabel: "Soliq shaxsiy kabineti"
  }
};

function getAgencyRoute(domain) {
  return ROUTES[domain] || {
    primary: "Davlat xizmatlari markazi yoki tegishli davlat organi",
    explanation: "DXM masalangiz bo'yicha xizmat yoki vakolatli organni aniqlashga yordam beradi.",
    documents: ["pasport yoki ID-karta", "masalaga oid ariza", "mavjud hujjatlar va dalillar", "vakolat hujjati (yuridik shaxs uchun)"],
    onlineUrl: "https://my.gov.uz/",
    onlineLabel: "My.gov xizmatlarini ko'rish"
  };
}

module.exports = {
  DXM_SOURCE, parseDxmOffices, getDxmOffices, distanceKm, findNearest, getAgencyRoute
};
