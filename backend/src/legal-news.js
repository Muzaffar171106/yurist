const NEWS_URL = "https://lex.uz/uz/search/official?lang=4&pub_date=week";
const CACHE_MS = 30 * 60 * 1000;
let cache = { loadedAt: 0, items: [] };

function decode(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseLegalNews(html, limit = 6) {
  const rows = [...html.matchAll(/<tr class="dd-table__main-item">([\s\S]*?)<\/tr>/gi)];
  const items = [];
  for (const row of rows) {
    const body = row[1];
    const link = body.match(/<a class="lx_link" href="(\/uz\/docs\/-\d+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const meta = body.match(/<span class="badge[^"]*">([\s\S]*?)<\/span>/i)?.[1] || "";
    const cleanMeta = decode(meta);
    const date = cleanMeta.match(/(\d{2}\.\d{2}\.\d{4})/)?.[1] || "";
    const type = /Farmoni/i.test(cleanMeta) ? "Farmon"
      : /Qarori/i.test(cleanMeta) ? "Qaror"
      : /Qonun/i.test(cleanMeta) ? "Qonun" : "Rasmiy hujjat";
    items.push({
      id: link[1].split("-").pop(),
      title: decode(link[2]),
      url: `https://lex.uz${link[1]}`,
      meta: cleanMeta,
      date,
      type
    });
    if (items.length >= limit) break;
  }
  return items;
}

async function getLegalNews() {
  if (cache.items.length && Date.now() - cache.loadedAt < CACHE_MS) return cache.items;
  const response = await fetch(NEWS_URL, {
    signal: AbortSignal.timeout(10000),
    headers: { "user-agent": "YuristAI-UZ/1.1" }
  });
  if (!response.ok) throw new Error(`Lex.uz yangiliklari HTTP ${response.status}`);
  const items = parseLegalNews(await response.text());
  if (!items.length) throw new Error("Rasmiy yangiliklar topilmadi");
  cache = { loadedAt: Date.now(), items };
  return items;
}

module.exports = { NEWS_URL, parseLegalNews, getLegalNews };
