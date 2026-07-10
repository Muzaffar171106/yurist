const test = require("node:test");
const assert = require("node:assert/strict");
const { parseLegalNews } = require("../src/legal-news");

test("Lex.uz rasmiy yangilik qatori ajratiladi", () => {
  const html = `<tr class="dd-table__main-item"><td></td><td>
    <a class="lx_link" href="/uz/docs/-12345" target="_blank">Yangi qonun to'g'risida</a>
    <span class="badge badge-pill badge-nine">O'zbekiston Respublikasi Qonuni, 25.06.2026 yildagi O'RQ-1-son</span>
  </td></tr>`;
  const news = parseLegalNews(html);
  assert.equal(news[0].title, "Yangi qonun to'g'risida");
  assert.equal(news[0].date, "25.06.2026");
  assert.equal(news[0].type, "Qonun");
});
