require("dotenv").config({ quiet: true });
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { searchKnowledge, getStats, buildIndex } = require("./knowledge");
const { searchOfficialSources } = require("./official-search");
const { generateAnswer } = require("./ai");
const { saveFeedback, cleanText } = require("./feedback");
const { getDxmOffices, findNearest, getAgencyRoute } = require("./agencies");
const { getLegalNews, NEWS_URL } = require("./legal-news");
const { readImageInfo, estimateInsurance, generateImageCaseAnswer } = require("./image-analysis");
const {
  authMiddleware,
  requireAuth,
  createUser,
  verifyUser,
  updateProfile,
  deleteAccount,
  createSession,
  destroySession,
  publicUser,
  setSessionCookie,
  clearSessionCookie
} = require("./auth");

const app = express();
const port = Number(process.env.PORT || 5050);
const host = process.env.HOST || "127.0.0.1";
const isProduction = process.env.NODE_ENV === "production";
const publicDir = path.join(__dirname, "..", "public");
const startedAt = new Date();

app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  next();
});
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: process.env.JSON_LIMIT || "7mb", strict: true }));
app.use(authMiddleware);
app.use(express.static(publicDir, {
  maxAge: isProduction ? "1h" : 0,
  etag: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith("service-worker.js")) res.setHeader("Cache-Control", "no-cache");
  }
}));

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.CHAT_RATE_LIMIT || 30),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "So'rovlar soni vaqtincha cheklangan. Birozdan keyin qayta urinib ko'ring." }
});
const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.FEEDBACK_RATE_LIMIT || 20),
  standardHeaders: "draft-8",
  legacyHeaders: false
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Kirish urinishlari vaqtincha cheklangan. Birozdan keyin qayta urinib ko'ring." }
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    jurisdiction: "O'zbekiston Respublikasi",
    engine: "local-no-api",
    version: "1.1.0-public-beta",
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    onlineSearch: process.env.ONLINE_SEARCH !== "false",
    knowledge: getStats()
  });
});

app.get("/api/status", (_req, res) => {
  const stats = getStats();
  res.json({
    service: "operational",
    localKnowledge: stats.documents > 0 ? "operational" : "degraded",
    officialSearch: process.env.ONLINE_SEARCH !== "false" ? "enabled" : "disabled",
    documents: stats.documents,
    chunks: stats.chunks,
    checkedAt: new Date().toISOString()
  });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post("/api/auth/register", authLimiter, (req, res) => {
  const created = createUser(req.body || {});
  if (created.error) return res.status(400).json({ error: created.error });
  const session = createSession(created.user.id, {
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });
  setSessionCookie(res, session.token, req);
  return res.status(201).json({
    user: publicUser(created.user),
    privacy: "Parol hash ko'rinishida saqlandi; ochiq matn parol saqlanmaydi."
  });
});

app.post("/api/auth/login", authLimiter, (req, res) => {
  const verified = verifyUser(req.body?.email, req.body?.password);
  if (verified.error) return res.status(401).json({ error: verified.error });
  const session = createSession(verified.user.id, {
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });
  setSessionCookie(res, session.token, req);
  return res.json({ user: publicUser(verified.user) });
});

app.post("/api/auth/logout", (req, res) => {
  destroySession(req.sessionToken);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.put("/api/auth/profile", requireAuth, authLimiter, (req, res) => {
  const updated = updateProfile(req.user.id, req.body || {});
  if (updated.error) return res.status(400).json({ error: updated.error });
  res.json({
    user: publicUser(updated.user),
    privacy: "Profil rasmi foydalanuvchi hisobida saqlandi. Parolga o'zgartirish kiritilmadi."
  });
});

app.delete("/api/auth/account", requireAuth, authLimiter, (req, res) => {
  const deleted = deleteAccount(req.user.id);
  if (deleted.error) return res.status(400).json({ error: deleted.error });
  destroySession(req.sessionToken);
  clearSessionCookie(res);
  res.json({
    ok: true,
    deletedUser: deleted.user,
    privacy: "Hisob va aktiv sessiyalar o'chirildi. Brauzerdagi lokal chat tarixini foydalanuvchi qurilmasida tozalash kerak."
  });
});

app.get("/api/legal-news", async (_req, res) => {
  try {
    res.json({
      items: await getLegalNews(),
      source: NEWS_URL,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(502).json({
      items: [],
      error: "Qonunchilik yangiliklarini olishning imkoni bo'lmadi.",
      ...(isProduction ? {} : { detail: error.message })
    });
  }
});

app.post("/api/search", requireAuth, chatLimiter, async (req, res) => {
  const question = cleanText(req.body?.question, 6000);
  if (question.length < 3) {
    return res.status(400).json({ error: "Savol kamida 3 belgidan iborat bo'lsin." });
  }
  const local = searchKnowledge(question, 10);
  const online = req.body?.online === false ? [] : await searchOfficialSources(question);
  res.json({
    domain: local.domain,
    local: local.results.map(({ source, article, heading, text, score }) => ({
      source, article, heading, text, score
    })),
    online
  });
});

app.post("/api/chat", requireAuth, chatLimiter, async (req, res) => {
  const question = cleanText(req.body?.question, 6000);
  const personType = req.body?.personType === "legal" ? "legal" : "individual";
  const language = ["uz-latn", "uz-cyrl", "ru"].includes(req.body?.language)
    ? req.body.language : "uz-latn";
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];
  if (question.length < 3 || question.length > 6000) {
    return res.status(400).json({ error: "Savol 3–6000 belgi oralig'ida bo'lishi kerak." });
  }

  try {
    const local = searchKnowledge(question, 9);
    const online = req.body?.online === false ? [] : await searchOfficialSources(question);
    const answer = generateAnswer({ question, personType, language, local, online, history });
    const sources = [
      ...local.results.slice(0, 4).map((x, i) => ({
        id: `L${i + 1}`,
        type: "local",
        title: x.source,
        detail: x.article ? `${x.article}-modda` : "matn bo'lagi"
      })),
      ...online.map((x, i) => ({
        id: `O${i + 1}`,
        type: "online",
        title: x.title,
        url: x.url,
        detail: new URL(x.url).hostname
      }))
    ];
    const confidence = local.results.length >= 4 && online.length > 0
      ? "high"
      : local.results.length >= 2 ? "medium" : "low";

    res.json({
      answerId: crypto.randomUUID(),
      answer,
      domain: local.domain.name,
      sources,
      confidence,
      fallback: false,
      checkedAt: new Date().toISOString(),
      privacy: "Savol server bazasida saqlanmadi."
    });
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      requestId: req.requestId,
      route: "/api/chat",
      message: error.message,
      at: new Date().toISOString()
    }));
    res.status(502).json({
      error: "Javob yaratishda xatolik yuz berdi.",
      requestId: req.requestId,
      ...(isProduction ? {} : { detail: error.message })
    });
  }
});

app.post("/api/image-case", requireAuth, chatLimiter, async (req, res) => {
  const question = cleanText(req.body?.question, 6000);
  const personType = req.body?.personType === "legal" ? "legal" : "individual";
  const language = ["uz-latn", "uz-cyrl", "ru"].includes(req.body?.language)
    ? req.body.language : "uz-latn";
  const imageData = String(req.body?.imageData || "");
  const clientStats = typeof req.body?.imageStats === "object" && req.body.imageStats ? req.body.imageStats : {};

  if (question.length < 3 || question.length > 6000) {
    return res.status(400).json({ error: "Izoh 3-6000 belgi oralig'ida bo'lishi kerak." });
  }
  if (!imageData) {
    return res.status(400).json({ error: "Rasm tanlanmagan." });
  }

  try {
    const imageInfo = readImageInfo(imageData);
    const analysis = estimateInsurance({ text: question, imageInfo, clientStats });
    const searchText = `${question} sug'urta shikastlanish zarar qoplash transport hodisasi dalolatnoma`;
    const local = searchKnowledge(searchText, 9);
    const online = req.body?.online === false ? [] : await searchOfficialSources(searchText);
    const answer = generateImageCaseAnswer({ question, personType, language, analysis, local, online });
    const sources = [
      ...local.results.slice(0, 4).map((x, i) => ({
        id: `L${i + 1}`,
        type: "local",
        title: x.source,
        detail: x.article ? `${x.article}-modda` : "matn bo'lagi"
      })),
      ...online.map((x, i) => ({
        id: `O${i + 1}`,
        type: "online",
        title: x.title,
        url: x.url,
        detail: new URL(x.url).hostname
      }))
    ];

    res.json({
      answerId: crypto.randomUUID(),
      answer,
      domain: "Sug'urta va zarar qoplash",
      sources,
      confidence: analysis.estimate ? "medium" : "low",
      imageAnalysis: {
        quality: analysis.quality,
        damageLevel: analysis.damage.level,
        imageHash: analysis.image.hash
      },
      checkedAt: new Date().toISOString(),
      privacy: "Rasm serverda saqlanmadi; faqat shu javobni tayyorlash uchun tahlil qilindi."
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || "Rasmni tahlil qilishda xatolik yuz berdi.",
      requestId: req.requestId
    });
  }
});

app.post("/api/feedback", feedbackLimiter, (req, res) => {
  const id = saveFeedback(req.body || {}, { requestId: req.requestId });
  res.status(201).json({ ok: true, id });
});

app.post("/api/agencies/nearest", requireAuth, chatLimiter, async (req, res) => {
  const latitude = Number(req.body?.latitude);
  const longitude = Number(req.body?.longitude);
  const domain = cleanText(req.body?.domain, 80);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: "Joylashuv koordinatalari noto'g'ri." });
  }
  try {
    const offices = await getDxmOffices();
    res.json({
      route: getAgencyRoute(domain),
      nearest: findNearest(offices, latitude, longitude, 3),
      appointment: {
        url: "https://entry.davxizmat.uz/",
        label: "DXMga rasmiy onlayn navbat olish",
        authentication: "Rasmiy tizim shaxsni tasdiqlash yoki qo'shimcha ma'lumot talab qilishi mumkin."
      },
      privacy: "Koordinata faqat eng yaqin markazni hisoblash uchun ishlatildi va serverda saqlanmadi.",
      source: "https://gov.uz/oz/adliya/sections/view/2828",
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(502).json({
      error: "Davlat organlari katalogini olishning imkoni bo'lmadi.",
      ...(isProduction ? {} : { detail: error.message })
    });
  }
});

app.use("/api/{*splat}", (req, res) => {
  res.status(404).json({ error: "API manzili topilmadi.", requestId: req.requestId });
});

app.get("/{*splat}", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));

buildIndex();
app.listen(port, host, () => {
  console.log(`Yurist AI: http://${host}:${port} (${process.env.NODE_ENV || "development"})`);
});
