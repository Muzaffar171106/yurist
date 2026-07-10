const { tokens } = require("./knowledge");

const ALLOWED_HOSTS = [
  "lex.uz", "www.lex.uz", "gov.uz", "www.gov.uz", "my.gov.uz",
  "sud.uz", "www.sud.uz", "my.sud.uz", "senat.uz", "parliament.gov.uz",
  "president.uz", "www.president.uz", "soliq.uz", "www.soliq.uz"
];

function decodeHtml(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function stripHtml(value = "") {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/Hujjatga taklif yuborish/gi, " ")
    .replace(/Audioni tinglash/gi, " ")
    .replace(/Hujjat elementidan havola olish/gi, " ")
    .replace(/Oldingi tahrirga qarang/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAllowed(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_HOSTS.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function fetchText(url, timeoutMs) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": "Mozilla/5.0 YuristAI-UZ/1.0",
      "accept-language": "uz-UZ,uz;q=0.9"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function queryForLex(question) {
  const useful = tokens(question).filter((x) => !/^\d+$/.test(x)).slice(0, 7);
  return useful.join(" ").slice(0, 95) || question.slice(0, 95);
}

function parseLexResults(html) {
  const pattern = /<a[^>]+class="[^"]*lx_link[^"]*"[^>]+href="(\/uz\/docs\/-\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set();
  const results = [];
  for (const match of html.matchAll(pattern)) {
    const url = `https://lex.uz${match[1]}`;
    if (seen.has(url)) continue;
    seen.add(url);
    results.push({ title: stripHtml(match[2]), url, snippet: "", official: true });
    if (results.length >= 5) break;
  }
  return results;
}

async function searchOfficialSources(question, options = {}) {
  if (process.env.ONLINE_SEARCH === "false") return [];
  const timeoutMs = Number(process.env.ONLINE_TIMEOUT_MS || options.timeoutMs || 9000);
  const query = queryForLex(question);
  const words = query.split(/\s+/);
  const attempts = [...new Set([query, words.slice(0, 2).join(" "), words[0]])].filter(Boolean);

  try {
    let results = [];
    let searchUrl = "";
    for (const attempt of attempts) {
      searchUrl = `https://lex.uz/uz/search/all?searchtitle=${encodeURIComponent(attempt)}`;
      const searchHtml = await fetchText(searchUrl, timeoutMs);
      results = parseLexResults(searchHtml);
      if (results.length) break;
    }
    const enriched = await Promise.all(results.slice(0, 4).map(async (item) => {
      try {
        const html = await fetchText(item.url, Math.min(timeoutMs, 7000));
        const text = stripHtml(html);
        const pos = Math.max(0, text.toLocaleLowerCase("uz").indexOf(query.split(" ")[0]) - 500);
        return { ...item, content: text.slice(pos, pos + 6500), searchUrl };
      } catch {
        return { ...item, content: item.title, searchUrl };
      }
    }));
    return enriched;
  } catch {
    return [];
  }
}

module.exports = { searchOfficialSources, isAllowed, ALLOWED_HOSTS, parseLexResults };
