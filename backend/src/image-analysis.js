const crypto = require("node:crypto");

const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_BYTES || 5 * 1024 * 1024);

function parseMoney(text = "") {
  const normalized = String(text).toLowerCase().replace(/,/g, ".");
  const matches = [...normalized.matchAll(/(\d+(?:[.\s]\d{3})*(?:\.\d+)?|\d+)\s*(mln|million|m|ming|k|so['‘’`]?m|sum|usd|dollar)?/gi)];
  const values = [];
  for (const match of matches) {
    let raw = match[1].replace(/\s/g, "");
    if ((raw.match(/\./g) || []).length > 1) raw = raw.replace(/\./g, "");
    let value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) continue;
    const unit = (match[2] || "").toLowerCase();
    if (["mln", "million", "m"].includes(unit)) value *= 1_000_000;
    if (["ming", "k"].includes(unit)) value *= 1_000;
    if (value >= 100_000) values.push(Math.round(value));
  }
  return values;
}

function detectDamage(text = "") {
  const q = String(text).toLowerCase();
  const groups = [
    { key: "yengil", severity: 0.08, words: ["tirnal", "scratch", "chiz", "bo'yoq", "bo‘yoq", "mayda", "bamper", "farada", "oyna darz"] },
    { key: "o'rta", severity: 0.22, words: ["ezil", "pachoq", "bukil", "eshik", "kapot", "krilo", "qanot", "radiator", "far singan"] },
    { key: "og'ir", severity: 0.48, words: ["ram", "kuzov", "xodovoy", "dvigatel", "airbag", "yostiqcha", "ag'dar", "yonib", "total", "kuchli shikast"] }
  ];
  const hits = groups.map((group) => ({
    ...group,
    hits: group.words.filter((word) => q.includes(word))
  })).filter((group) => group.hits.length);
  if (!hits.length) return { level: "aniqlashtirish kerak", factor: 0.14, hits: [] };
  const strongest = hits.sort((a, b) => b.severity - a.severity)[0];
  return { level: strongest.key, factor: strongest.severity, hits: hits.flatMap((x) => x.hits).slice(0, 8) };
}

function readImageInfo(dataUrl = "") {
  const match = String(dataUrl).match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) throw new Error("Faqat JPG, PNG yoki WEBP rasm yuborish mumkin.");
  const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Rasm hajmi ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB dan oshmasin.`);
  }
  const info = { mime, bytes: buffer.length, hash: crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12) };
  if (mime === "image/png" && buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    info.width = buffer.readUInt32BE(16);
    info.height = buffer.readUInt32BE(20);
  } else if (mime === "image/jpeg") {
    Object.assign(info, readJpegSize(buffer));
  }
  return info;
}

function readJpegSize(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return {};
}

function qualityNote(imageInfo, clientStats = {}) {
  const notes = [];
  if (imageInfo.width && imageInfo.height) {
    const px = imageInfo.width * imageInfo.height;
    if (px < 480_000) notes.push("rasm aniqligi pastroq, mayda shikastlar ko'rinmasligi mumkin");
    if (px >= 2_000_000) notes.push("rasm aniqligi yaxshi");
  }
  if (Number(clientStats.brightness) < 45) notes.push("rasm qorong'iroq");
  if (Number(clientStats.blur) > 0 && Number(clientStats.blur) < 10) notes.push("rasm xiralashgan bo'lishi mumkin");
  return notes.length ? notes.join("; ") : "rasm texnik jihatdan qabul qilindi";
}

function estimateInsurance({ text, imageInfo, clientStats = {} }) {
  const amounts = parseMoney(text);
  const damage = detectDamage(text);
  const base = amounts[0] || 0;
  const lowFactor = Math.max(0.03, damage.factor * 0.55);
  const highFactor = Math.min(0.8, damage.factor * 1.45);
  const qualityPenalty = Number(clientStats.blur) > 0 && Number(clientStats.blur) < 10 ? 0.85 : 1;
  const estimate = base ? {
    low: Math.round(base * lowFactor * qualityPenalty),
    high: Math.round(base * highFactor),
    base
  } : null;
  return {
    image: imageInfo,
    quality: qualityNote(imageInfo, clientStats),
    damage,
    estimate,
    amounts
  };
}

function formatMoney(value) {
  return `${Math.round(value).toLocaleString("uz-UZ")} so'm`;
}

function generateImageCaseAnswer({ question, personType, language, analysis, local = {}, online = [] }) {
  const isRu = language === "ru";
  const isCyrl = language === "uz-cyrl";
  const person = personType === "legal" ? "yuridik shaxs" : "jismoniy shaxs";
  const sourceHint = local.results?.length ? " [L1]" : "";
  const officialHint = online.length ? " [O1]" : "";
  if (isRu) {
    return `Краткий вывод
По фото и описанию можно дать только предварительную оценку. Окончательную сумму определяют условия страхового договора, акт осмотра, калькуляция ремонта и решение страховщика.${sourceHint}${officialHint}

Что видно по данным
- Тип клиента: ${person}.
- Техническое качество фото: ${analysis.quality}.
- По описанию уровень повреждения: ${analysis.damage.level}${analysis.damage.hits.length ? ` (${analysis.damage.hits.join(", ")})` : ""}.
- Файл принят: ${analysis.image.mime}, ${Math.round(analysis.image.bytes / 1024)} KB${analysis.image.width ? `, ${analysis.image.width}×${analysis.image.height}` : ""}.

Предварительная сумма
${analysis.estimate
  ? `Если указанная вами сумма ${formatMoney(analysis.estimate.base)} — это страховая сумма или ориентировочная рыночная стоимость, предварительный диапазон может быть около ${formatMoney(analysis.estimate.low)} — ${formatMoney(analysis.estimate.high)}. Это не гарантия выплаты: франшиза, износ, лимит полиса и исключения могут уменьшить сумму.`
  : "Для денежного диапазона укажите страховую сумму/рыночную стоимость авто, год выпуска, марку, пробег, тип полиса, франшизу и какие детали повреждены."}

Что сделать сейчас
1) Не ремонтируйте авто до осмотра страховщика, если договор не разрешает срочный ремонт.
2) Сфотографируйте авто с 4 сторон, крупно каждую поврежденную деталь, VIN/госномер, место ДТП и документы.
3) Подайте заявление страховщику в срок, указанный в полисе.
4) Сохраните справку/протокол, извещение о ДТП, полис, техпаспорт, водительское удостоверение, чеки эвакуатора и ремонта.

Важно
Фото помогает подготовить обращение, но не заменяет независимую оценку и официальный акт осмотра.`;
  }
  if (isCyrl) {
    return `Қисқа хулоса
Расм ва изоҳ асосида фақат дастлабки баҳолаш берилади. Якуний тўлов суғурта шартномаси, кўрик далолатномаси, таъмир калькуляцияси ва суғурта ташкилотининг қарорига боғлиқ.${sourceHint}${officialHint}

Расм бўйича маълумот
- Мижоз тури: ${person}.
- Расм сифати: ${analysis.quality}.
- Изоҳга кўра шикастланиш даражаси: ${analysis.damage.level}${analysis.damage.hits.length ? ` (${analysis.damage.hits.join(", ")})` : ""}.
- Файл қабул қилинди: ${analysis.image.mime}, ${Math.round(analysis.image.bytes / 1024)} KB${analysis.image.width ? `, ${analysis.image.width}×${analysis.image.height}` : ""}.

Тахминий сумма
${analysis.estimate
  ? `Агар сиз кўрсатган ${formatMoney(analysis.estimate.base)} суғурта суммаси ёки бозор қиймати бўлса, дастлабки диапазон тахминан ${formatMoney(analysis.estimate.low)} — ${formatMoney(analysis.estimate.high)} бўлиши мумкин. Бу кафолатланган тўлов эмас: франшиза, эскириш, полис лимити ва истиснолар суммани камайтириши мумкин.`
  : "Пул диапазонини чиқариш учун суғурта суммаси ёки бозор қиймати, авто маркаси, йили, пробеги, полис тури, франшиза ва қайси деталлар шикастланганини ёзинг."}

Ҳозирги амалий қадамлар
1) Суғурта кўригигача автомобилни таъмирламанг, агар шартнома шошилинч таъмирга рухсат бермаган бўлса.
2) Автомобилни 4 томондан, ҳар бир шикастланган детални яқиндан, VIN/давлат рақами, ҳодиса жойи ва ҳужжатларни расмга олинг.
3) Полисда кўрсатилган муддатда суғурта ташкилотига ёзма ариза беринг.
4) Маълумотнома/баённома, ДТП хабарномаси, полис, техпаспорт, ҳайдовчилик гувоҳномаси, эвакуатор ва таъмир чекларини сақланг.

Муҳим
Расм мурожаатни тайёрлашга ёрдам беради, лекин мустақил баҳолаш ва расмий кўрик далолатномасини алмаштирмайди.`;
  }
  return `Qisqa xulosa
Rasm va izoh asosida faqat dastlabki baholash beriladi. Yakuniy to'lov sug'urta shartnomasi, ko'rik dalolatnomasi, ta'mir kalkulyatsiyasi va sug'urta tashkilotining qaroriga bog'liq.${sourceHint}${officialHint}

Rasm bo'yicha ma'lumot
- Mijoz turi: ${person}.
- Rasm sifati: ${analysis.quality}.
- Izohga ko'ra shikastlanish darajasi: ${analysis.damage.level}${analysis.damage.hits.length ? ` (${analysis.damage.hits.join(", ")})` : ""}.
- Fayl qabul qilindi: ${analysis.image.mime}, ${Math.round(analysis.image.bytes / 1024)} KB${analysis.image.width ? `, ${analysis.image.width}×${analysis.image.height}` : ""}.

Taxminiy summa
${analysis.estimate
  ? `Agar siz ko'rsatgan ${formatMoney(analysis.estimate.base)} sug'urta summasi yoki bozor qiymati bo'lsa, dastlabki diapazon taxminan ${formatMoney(analysis.estimate.low)} — ${formatMoney(analysis.estimate.high)} bo'lishi mumkin. Bu kafolatlangan to'lov emas: franshiza, eskirish, polis limiti va istisnolar summani kamaytirishi mumkin.`
  : "Pul diapazonini chiqarish uchun sug'urta summasi yoki bozor qiymati, avtomobil markasi, yili, probegi, polis turi, franshiza va qaysi detallar shikastlanganini yozing."}

Hozirgi amaliy qadamlar
1) Sug'urta ko'rigigacha avtomobilni ta'mirlamang, agar shartnoma shoshilinch ta'mirga ruxsat bermagan bo'lsa.
2) Avtomobilni 4 tomondan, har bir shikastlangan detalni yaqindan, VIN/davlat raqami, hodisa joyi va hujjatlarni rasmga oling.
3) Polisda ko'rsatilgan muddatda sug'urta tashkilotiga yozma ariza bering.
4) Ma'lumotnoma/bayonnoma, YTH xabarnomasi, polis, texpasport, haydovchilik guvohnomasi, evakuator va ta'mir cheklarini saqlang.

Muhim
Rasm murojaatni tayyorlashga yordam beradi, lekin mustaqil baholash va rasmiy ko'rik dalolatnomasini almashtirmaydi.`;
}

module.exports = {
  MAX_IMAGE_BYTES,
  parseMoney,
  detectDamage,
  readImageInfo,
  estimateInsurance,
  generateImageCaseAnswer
};
