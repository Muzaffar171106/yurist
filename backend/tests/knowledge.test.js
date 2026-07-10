const test = require("node:test");
const assert = require("node:assert/strict");
const { normalize, searchKnowledge, getStats } = require("../src/knowledge");
const { isAllowed } = require("../src/official-search");

test("kirill va lotin normalizatsiyasi", () => {
  assert.match(normalize("Фуқаролик ҳуқуқи"), /fuqarolik huquqi/);
});

test("bilim bazasi yuklanadi", () => {
  const stats = getStats();
  assert.ok(stats.documents >= 8);
  assert.ok(stats.chunks > 100);
});

test("oila savoli tegishli kodeksni topadi", () => {
  const found = searchKnowledge("aliment undirish va farzand ta'minoti", 5);
  assert.equal(found.domain.name, "Oila huquqi");
  assert.ok(found.results.some((x) => x.source.includes("Oila")));
});

test("rus tilidagi savol huquq sohasini aniqlaydi", () => {
  const found = searchKnowledge("Какие документы нужны для взыскания алиментов?", 5);
  assert.equal(found.domain.name, "Oila huquqi");
  assert.ok(found.results.some((x) => x.source.includes("Oila")));
});

test("faqat rasmiy hostlarga ruxsat", () => {
  assert.equal(isAllowed("https://lex.uz/docs/123"), true);
  assert.equal(isAllowed("https://evil.example/lex.uz"), false);
});
