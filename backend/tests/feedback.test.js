const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanText } = require("../src/feedback");

test("feedback matni nazorat belgilaridan tozalanadi", () => {
  assert.equal(cleanText("  yaxshi\u0000javob  ", 100), "yaxshi javob");
});

test("feedback matni maksimal uzunlikka qisqaradi", () => {
  assert.equal(cleanText("abcdef", 3), "abc");
});
