const test = require("node:test");
const assert = require("node:assert/strict");
const { parseCookies, validateRegistration, validateAvatarData, createUser, createSession, deleteAccount } = require("../src/auth");

test("cookie qiymatlari ajratiladi", () => {
  const cookies = parseCookies("theme=dark; yurist_ai_session=abc123; lang=uz");
  assert.equal(cookies.yurist_ai_session, "abc123");
  assert.equal(cookies.lang, "uz");
});

test("ro'yxatdan o'tishda kuchli parol talab qilinadi", () => {
  const result = validateRegistration({
    name: "Ali",
    email: "ali@example.com",
    password: "faqatmatn"
  });
  assert.match(result.error, /harf va raqam/);
});

test("to'g'ri ro'yxatdan o'tish ma'lumoti qabul qilinadi", () => {
  const result = validateRegistration({
    name: "Ali Valiyev",
    email: "ALI@EXAMPLE.COM",
    password: "Huquq2026"
  });
  assert.equal(result.email, "ali@example.com");
  assert.equal(result.name, "Ali Valiyev");
});

test("profil rasmi data url sifatida tekshiriladi", () => {
  const png1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  const result = validateAvatarData(png1x1);
  assert.equal(result.avatarData, png1x1);
  assert.match(validateAvatarData("https://example.com/a.png").error, /JPG, PNG yoki WEBP/);
});

test("hisob o'chirish foydalanuvchini o'chiradi", () => {
  const email = `delete-${Date.now()}@example.com`;
  const created = createUser({ name: "Delete Test", email, password: "Huquq2026" });
  assert.ok(created.user.id);
  createSession(created.user.id, { ip: "127.0.0.1", userAgent: "test" });
  const deleted = deleteAccount(created.user.id);
  assert.equal(deleted.user.email, email);
  assert.equal(deleteAccount(created.user.id).error, "Foydalanuvchi topilmadi.");
});
