const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.jsonl");

function cleanText(value, max = 500) {
  return String(value || "").replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
}

function saveFeedback(payload, requestMeta = {}) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    rating: ["up", "down"].includes(payload.rating) ? payload.rating : "unknown",
    reason: cleanText(payload.reason, 300),
    domain: cleanText(payload.domain, 80),
    language: cleanText(payload.language, 20),
    answerId: cleanText(payload.answerId, 80),
    requestId: cleanText(requestMeta.requestId, 80)
  };
  fs.appendFileSync(FEEDBACK_FILE, `${JSON.stringify(record)}\n`, "utf8");
  return record.id;
}

module.exports = { saveFeedback, cleanText };
