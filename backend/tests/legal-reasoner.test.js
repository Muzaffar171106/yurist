const test = require("node:test");
const assert = require("node:assert/strict");
const { searchKnowledge } = require("../src/knowledge");
const {
  detectIntent,
  buildLegalStrategy,
  confidenceLevel,
  missingFacts
} = require("../src/legal-reasoner");

test("legal reasoner qarz va sud niyatini aniqlaydi", () => {
  const intents = detectIntent("Qarz bergan pulimni sud orqali undirmoqchiman");
  assert.ok(intents.includes("moneyClaim"));
  assert.ok(intents.includes("court"));
});

test("legal strategy vakolatli organ va hujjatlarni tavsiya qiladi", () => {
  const local = searchKnowledge("aliment undirish uchun nima qilish kerak?", 5);
  const strategy = buildLegalStrategy({
    question: "Aliment undirish uchun nima qilish kerak?",
    personType: "individual",
    local,
    online: []
  });
  assert.equal(strategy.domainName, "Oila huquqi");
  assert.match(strategy.agency.primary, /sud/i);
  assert.ok(strategy.documents.some((x) => x.includes("FHDY")));
});

test("confidence sabablar va ball qaytaradi", () => {
  const local = searchKnowledge("ma'muriy jarimaga shikoyat qilish tartibi", 5);
  const confidence = confidenceLevel({
    question: "Ma'muriy jarimaga shikoyat qilish tartibi qanday?",
    local,
    online: [{ title: "Lex.uz", url: "https://lex.uz" }]
  });
  assert.ok(["medium", "high"].includes(confidence.level));
  assert.ok(confidence.score > 0);
  assert.ok(confidence.reasons.length >= 2);
});

test("missing facts sana va hujjat yetishmasligini ko'rsatadi", () => {
  const missing = missingFacts("Jarimaga norozi bo'lsam nima qilaman?", "Ma'muriy javobgarlik");
  assert.ok(missing.some((x) => x.includes("sana")));
  assert.ok(missing.some((x) => x.includes("hujjat")));
});
