const fs = require("node:fs");
const path = require("node:path");

const KNOWLEDGE_DIR = path.join(__dirname, "..", "knowledge_base");
const ARTICLE_PATTERN = /(?:^|\n)(\d+(?:-\d+)?(?:[¹²³⁴⁵⁶⁷⁸⁹⁰]+)?)-модда\.?/gimu;
const STOP = new Set([
  "uchun", "bilan", "bo'yicha", "qanday", "nima", "qilish", "kerak", "mumkin",
  "hamda", "yoki", "emas", "bor", "shu", "men", "biz", "siz", "the", "and",
  "для", "как", "что", "нужно", "можно", "или", "при", "это", "мой", "мне"
]);

let indexCache = null;

function normalize(text = "") {
  const digraphs = {
    "ў": "o'", "ғ": "g'", "қ": "q", "ҳ": "h", "ш": "sh", "ч": "ch",
    "ё": "yo", "ю": "yu", "я": "ya", "ж": "j", "ц": "s", "ъ": "'",
    "ь": "", "э": "e", "а": "a", "б": "b", "в": "v", "г": "g",
    "д": "d", "е": "e", "з": "z", "и": "i", "й": "y", "к": "k",
    "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r",
    "с": "s", "т": "t", "у": "u", "ф": "f", "х": "x"
  };
  return text
    .toLocaleLowerCase("uz")
    .replace(/[ʻʼ’‘`]/g, "'")
    .replace(/[а-яёқғҳў]/g, (letter) => digraphs[letter] ?? letter)
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim();
}

function tokens(text) {
  return [...new Set(normalize(text).split(/\s+/).filter((x) => x.length > 2 && !STOP.has(x)))];
}

function clean(text) {
  return text
    .replace(/\r/g, "")
    .replace(/^(A|Рус|Eng|Ўзб|Telegram|Facebook|Twitter|Instagram)$/gim, "")
    .replace(/^(Ҳужжатга таклиф юбориш|Аудиони тинглаш|Ҳужжат элементидан ҳавола олиш)$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitFile(file, content) {
  const matches = [...content.matchAll(ARTICLE_PATTERN)];
  const chunks = [];

  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = matches[i + 1]?.index ?? content.length;
    const body = clean(content.slice(start, Math.min(end, start + 6000)));
    if (body.length < 40) continue;
    chunks.push({
      id: `${file}:${matches[i][1]}:${i}`,
      source: file,
      article: matches[i][1],
      text: body,
      heading: body.split(/\n+/).find((line) => line.trim().length > 5)?.trim() || "",
      normalized: normalize(body),
      terms: tokens(`${file} ${body}`)
    });
  }

  if (chunks.length < 5) {
    for (let offset = 0; offset < content.length; offset += 3500) {
      const body = clean(content.slice(offset, offset + 4500));
      if (body.length > 80) {
        chunks.push({
          id: `${file}:chunk:${offset}`,
          source: file,
          article: null,
          text: body,
          heading: "",
          normalized: normalize(body),
          terms: tokens(`${file} ${body}`)
        });
      }
    }
  }
  return chunks;
}

function buildIndex() {
  if (indexCache) return indexCache;
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.toLowerCase().endsWith(".txt"));
  indexCache = files.flatMap((file) => {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf8");
    return splitFile(file, content);
  });
  return indexCache;
}

function detectDomain(question) {
  const q = normalize(question);
  const domains = [
    ["Jinoyat protsessi", ["tergov", "surishtiruv", "gumonlanuvchi", "ayblanuvchi", "hibs", "следствие", "обвиняем", "подозреваем"], "Jinoyat-protsessual"],
    ["Jinoyat huquqi", ["jinoyat", "jazo", "o'g'irlik", "firibgarlik", "qamoq", "преступлен", "наказан", "мошеннич"], "Jinoyat_kodeksi"],
    ["Ma'muriy javobgarlik", ["jarima", "ma'muriy", "ypx", "bayonnoma", "штраф", "административ", "протокол"], "Ma'muriy"],
    ["Oila huquqi", ["nikoh", "ajrim", "aliment", "farzand", "otalik", "брак", "развод", "алимент", "ребен"], "Oila"],
    ["Fuqarolik protsessi", ["da'vo", "sudga", "apellyatsiya", "sud buyrug'i", "иск", "апелляц", "судебный приказ"], "Fuqarolik_protsessual"],
    ["Fuqarolik huquqi", ["shartnoma", "qarz", "mulk", "meros", "zarar", "bitim", "договор", "долг", "имущество", "наслед"], "Fuqarolik_kodeksi"],
    ["Soliq huquqi", ["soliq", "qqs", "deklaratsiya", "penya", "налог", "ндс", "декларац"], "Soliq"],
    ["Saylov huquqi", ["saylov", "ovoz", "nomzod", "deputat", "выбор", "голос", "кандидат"], "Saylov"],
    ["Konstitutsiyaviy huquq", ["konstitutsiya", "erkinlik", "fuqaro huquqi", "конституц", "свобод", "права граждан"], "Konstitutsiya"]
  ];
  const ranked = domains.map(([name, words, fileHint]) => ({
    name, fileHint, score: words.reduce((n, word) => n + (q.includes(normalize(word)) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  return ranked[0].score ? ranked[0] : { name: "Umumiy huquqiy masala", fileHint: "", score: 0 };
}

function searchKnowledge(question, limit = 8) {
  const index = buildIndex();
  const q = normalize(question);
  const queryTerms = tokens(question);
  const multilingualAliases = [
    [["aliment"], ["aliment", "undirish", "bola", "ta'minot"]],
    [["dogovor"], ["shartnoma", "bitim", "majburiyat"]],
    [["dolg", "zaym"], ["qarz", "majburiyat", "undirish"]],
    [["shtraf"], ["jarima", "ma'muriy", "javobgarlik"]],
    [["razvod", "brak"], ["nikoh", "ajrim", "nikohdan"]],
    [["nasled"], ["meros", "voris"]],
    [["nalog"], ["soliq", "hisobot", "to'lov"]],
    [["prestup", "moshen"], ["jinoyat", "javobgarlik", "firibgarlik"]]
  ];
  for (const [needles, aliases] of multilingualAliases) {
    if (needles.some((needle) => q.includes(normalize(needle)))) queryTerms.push(...aliases);
  }
  const domain = detectDomain(question);
  const articleMatch = q.match(/\b(\d+(?:-\d+)?)\s*-?\s*modda/);

  const results = index.map((chunk) => {
    let score = 0;
    const normalizedHeading = normalize(chunk.heading || "");
    for (const term of queryTerms) {
      if (chunk.normalized.includes(term)) score += term.length > 5 ? 4 : 2;
      if (chunk.terms.includes(term)) score += 2;
      if (normalizedHeading.includes(normalize(term))) score += 7;
    }
    if (q.includes("aliment")) {
      if (normalizedHeading.includes("sud tartibida undirish")) score += 20;
      if (normalizedHeading.includes("sud qarorini ijro")) score += 12;
      if (normalizedHeading.includes("miqdorini aniqlash")) score += 8;
      if (normalizedHeading.includes("bolalar muassasalariga joylashtirilgan")) score -= 12;
    }
    if (domain.fileHint && normalize(chunk.source).includes(normalize(domain.fileHint))) score += 9;
    if (articleMatch && chunk.article === articleMatch[1]) score += 30;
    return { ...chunk, score };
  }).filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  const unique = [];
  const seen = new Set();
  for (const item of results) {
    const key = `${item.source}:${item.article || item.text.slice(0, 80)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
    if (unique.length >= limit) break;
  }
  return { domain, results: unique, totalChunks: index.length };
}

function getStats() {
  const index = buildIndex();
  return {
    chunks: index.length,
    documents: new Set(index.map((x) => x.source)).size,
    files: [...new Set(index.map((x) => x.source))]
  };
}

module.exports = { normalize, tokens, searchKnowledge, getStats, buildIndex };
