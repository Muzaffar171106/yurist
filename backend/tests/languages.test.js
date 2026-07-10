const test = require("node:test");
const assert = require("node:assert/strict");
const { searchKnowledge } = require("../src/knowledge");
const { generateAnswer, toCyrillic } = require("../src/ai");

test("o'zbek kirill javobi hosil bo'ladi", () => {
  assert.match(toCyrillic("Huquqiy maslahat"), /Ҳуқуқий маслаҳат/);
});

test("rus tilida to'liq javob hosil bo'ladi", () => {
  const local = searchKnowledge("алименты для ребенка", 3);
  const answer = generateAnswer({
    question: "Какие документы нужны для алиментов?",
    personType: "individual",
    language: "ru",
    local,
    online: []
  });
  assert.match(answer, /Краткий ответ/);
  assert.match(answer, /Практические действия/);
});

test("o'zbek javobi oddiy va amaliy bo'limlarni beradi", () => {
  const local = searchKnowledge("aliment undirish uchun nima qilish kerak?", 5);
  const answer = generateAnswer({
    question: "Aliment undirish uchun nima qilish kerak?",
    personType: "individual",
    language: "uz-latn",
    local,
    online: []
  });
  assert.match(answer, /Eng qisqa javob/);
  assert.match(answer, /oddiy tilda/i);
  assert.match(answer, /Sodda misol/);
  assert.match(answer, /Aniqlik uchun kerak bo'ladigan ma'lumotlar/);
  assert.match(answer, /Oddiy ma'nosi/);
});
