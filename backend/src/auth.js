const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const SESSION_COOKIE = "yurist_ai_session";
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 14);
const MAX_AVATAR_BYTES = Number(process.env.MAX_AVATAR_BYTES || 700 * 1024);

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function clean(value, max = 160) {
  return String(value || "").replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
}

function normalizeEmail(email) {
  return clean(email, 180).toLowerCase();
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarData: user.avatarData || "",
    role: user.role || "user",
    createdAt: user.createdAt
  };
}

function getUsers() {
  const data = readJson(USERS_FILE, { users: [] });
  return Array.isArray(data.users) ? data.users : [];
}

function saveUsers(users) {
  writeJson(USERS_FILE, { users });
}

function getSessions() {
  const data = readJson(SESSIONS_FILE, { sessions: [] });
  return Array.isArray(data.sessions) ? data.sessions : [];
}

function saveSessions(sessions) {
  writeJson(SESSIONS_FILE, { sessions });
}

function parseCookies(header = "") {
  return String(header).split(";").reduce((acc, item) => {
    const index = item.indexOf("=");
    if (index === -1) return acc;
    const key = item.slice(0, index).trim();
    const value = item.slice(index + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 210_000, 32, "sha256").toString("hex");
  return { salt, hash };
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a), "hex");
  const right = Buffer.from(String(b), "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validateRegistration({ name, email, password }) {
  const cleanName = clean(name, 80);
  const cleanEmail = normalizeEmail(email);
  const pass = String(password || "");
  if (cleanName.length < 2) return { error: "Ism kamida 2 belgidan iborat bo'lsin." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { error: "Email manzil noto'g'ri." };
  if (pass.length < 8) return { error: "Parol kamida 8 belgidan iborat bo'lsin." };
  if (!/[a-zA-Z]/.test(pass) || !/\d/.test(pass)) return { error: "Parolda harf va raqam bo'lishi kerak." };
  return { name: cleanName, email: cleanEmail, password: pass };
}

function validateAvatarData(value = "") {
  if (!value) return { avatarData: "" };
  const avatarData = String(value);
  const match = avatarData.match(/^data:image\/(png|jpe?g|webp);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return { error: "Profil rasmi JPG, PNG yoki WEBP bo'lishi kerak." };
  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64").length;
  if (bytes > MAX_AVATAR_BYTES) {
    return { error: `Profil rasmi ${Math.round(MAX_AVATAR_BYTES / 1024)} KB dan oshmasin.` };
  }
  return { avatarData };
}

function createUser(input) {
  const valid = validateRegistration(input);
  if (valid.error) return { error: valid.error };
  const users = getUsers();
  if (users.some((user) => user.email === valid.email)) {
    return { error: "Bu email bilan hisob allaqachon mavjud." };
  }
  const password = hashPassword(valid.password);
  const user = {
    id: crypto.randomUUID(),
    name: valid.name,
    email: valid.email,
    role: "user",
    password,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  return { user };
}

function verifyUser(email, password) {
  const user = getUsers().find((item) => item.email === normalizeEmail(email));
  if (!user?.password?.hash || !user?.password?.salt) return { error: "Email yoki parol noto'g'ri." };
  const attempt = hashPassword(String(password || ""), user.password.salt);
  if (!safeEqual(attempt.hash, user.password.hash)) return { error: "Email yoki parol noto'g'ri." };
  return { user };
}

function updateProfile(userId, input = {}) {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return { error: "Foydalanuvchi topilmadi." };
  const name = clean(input.name, 80);
  if (name.length < 2) return { error: "Ism kamida 2 belgidan iborat bo'lsin." };
  const avatar = validateAvatarData(input.avatarData || "");
  if (avatar.error) return { error: avatar.error };
  users[index] = {
    ...users[index],
    name,
    avatarData: avatar.avatarData,
    updatedAt: new Date().toISOString()
  };
  saveUsers(users);
  return { user: users[index] };
}

function deleteAccount(userId) {
  const users = getUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) return { error: "Foydalanuvchi topilmadi." };
  saveUsers(users.filter((item) => item.id !== userId));
  saveSessions(getSessions().filter((session) => session.userId !== userId));
  return { user: publicUser(user) };
}

function createSession(userId, meta = {}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const sessions = getSessions().filter((session) => new Date(session.expiresAt).getTime() > now);
  sessions.push({
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt,
    ip: clean(meta.ip, 80),
    userAgent: clean(meta.userAgent, 220)
  });
  saveSessions(sessions);
  return { token, expiresAt };
}

function destroySession(token) {
  if (!token) return;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  saveSessions(getSessions().filter((session) => session.tokenHash !== tokenHash));
}

function getUserBySession(token) {
  if (!token) return null;
  const now = Date.now();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const sessions = getSessions();
  const session = sessions.find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt).getTime() > now);
  if (!session) return null;
  return getUsers().find((user) => user.id === session.userId) || null;
}

function cookieOptions(req) {
  const secure = process.env.NODE_ENV === "production";
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function setSessionCookie(res, token, req) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions(req)}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

function authMiddleware(req, _res, next) {
  const cookies = parseCookies(req.headers.cookie || "");
  req.sessionToken = cookies[SESSION_COOKIE] || "";
  req.user = getUserBySession(req.sessionToken);
  next();
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  return res.status(401).json({ error: "Avval hisobga kiring yoki ro'yxatdan o'ting.", authRequired: true });
}

module.exports = {
  SESSION_COOKIE,
  parseCookies,
  validateRegistration,
  validateAvatarData,
  createUser,
  verifyUser,
  updateProfile,
  deleteAccount,
  createSession,
  destroySession,
  publicUser,
  authMiddleware,
  requireAuth,
  setSessionCookie,
  clearSessionCookie
};
