const state = {
  chats: JSON.parse(localStorage.getItem("yurist-ai-chats") || "[]"),
  activeId: null,
  personType: localStorage.getItem("yurist-ai-person") || "individual",
  language: localStorage.getItem("yurist-ai-language") || "uz-latn",
  busy: false,
  pendingImage: null,
  user: null,
  authMode: "login",
  profileAvatarData: ""
};

const $ = (selector) => document.querySelector(selector);
const messages = $("#messages");
const question = $("#question");
let legalNewsCache = null;
const I18N = {
  "uz-latn": {
    uzLaw:"O'zbekiston huquqi", newChat:"+ Yangi maslahat", clientType:"Maslahat oluvchi",
    individual:"Jismoniy shaxs", legal:"Yuridik shaxs", chats:"Suhbatlar",
    official:"Rasmiy manbalar", officialHint:"Lex.uz ochiq sahifalari", legalAdvice:"Huquqiy maslahat",
    checking:"Qonun bazasi tekshirilmoqda...", jurisdiction:"O'ZBEKISTON RESPUBLIKASI",
    welcomeTitle:"Huquqingizni tushunarli tilda biling",
    welcomeText:"Vaziyatingizni batafsil yozing. Javob lokal kodekslar va rasmiy davlat manbalari bilan asoslanadi.",
    notice:"Muhim qarordan oldin hujjatning amaldagi tahririni rasmiy manbada tekshiring.",
    placeholder:"Huquqiy vaziyatingizni yozing...", newLine:"Shift + Enter — yangi qator",
    sources:"Foydalanilgan manbalar", searching:"Qonunlar va rasmiy manbalar tekshirilmoqda",
    connected:(d)=>`${d.knowledge.documents} hujjat · ${d.knowledge.chunks.toLocaleString()} bo'lak · ${d.onlineSearch ? "rasmiy onlayn qidiruv yoqilgan" : "oflayn rejim"}`,
    noServer:"Server bilan aloqa yo'q", error:"Xatolik", checkConnection:"Server va internet ulanishini tekshiring.",
    prompts:[
      ["Qarz bergan pulimni qaytarishmayapti. Qanday tartibda undiraman?","Qarzni undirish"],
      ["Aliment undirish uchun qayerga va qanday hujjatlar bilan murojaat qilaman?","Aliment masalasi"],
      ["MChJ bilan tuzilgan shartnoma buzildi. Yuridik shaxs sifatida qanday choralar ko'raman?","Shartnoma nizosi"],
      ["Ma'muriy jarimaga rozi bo'lmasam, shikoyat qilish tartibi qanday?","Jarimaga shikoyat"]
    ]
  },
  "uz-cyrl": {
    uzLaw:"Ўзбекистон ҳуқуқи", newChat:"+ Янги маслаҳат", clientType:"Маслаҳат олувчи",
    individual:"Жисмоний шахс", legal:"Юридик шахс", chats:"Суҳбатлар",
    official:"Расмий манбалар", officialHint:"Lex.uz очиқ саҳифалари", legalAdvice:"Ҳуқуқий маслаҳат",
    checking:"Қонун базаси текширилмоқда...", jurisdiction:"ЎЗБЕКИСТОН РЕСПУБЛИКАСИ",
    welcomeTitle:"Ҳуқуқингизни тушунарли тилда билинг",
    welcomeText:"Вазиятингизни батафсил ёзинг. Жавоб локал кодекслар ва расмий давлат манбалари билан асосланади.",
    notice:"Муҳим қарордан олдин ҳужжатнинг амалдаги таҳририни расмий манбада текширинг.",
    placeholder:"Ҳуқуқий вазиятингизни ёзинг...", newLine:"Shift + Enter — янги қатор",
    sources:"Фойдаланилган манбалар", searching:"Қонунлар ва расмий манбалар текширилмоқда",
    connected:(d)=>`${d.knowledge.documents} ҳужжат · ${d.knowledge.chunks.toLocaleString()} бўлак · ${d.onlineSearch ? "расмий онлайн қидирув ёқилган" : "офлайн режим"}`,
    noServer:"Сервер билан алоқа йўқ", error:"Хатолик", checkConnection:"Сервер ва интернет уланишини текширинг.",
    prompts:[
      ["Қарз берган пулимни қайтаришмаяпти. Қандай тартибда ундираман?","Қарзни ундириш"],
      ["Алимент ундириш учун қаерга ва қандай ҳужжатлар билан мурожаат қиламан?","Алимент масаласи"],
      ["МЧЖ билан тузилган шартнома бузилди. Юридик шахс сифатида қандай чора кўраман?","Шартнома низоси"],
      ["Маъмурий жаримага рози бўлмасам, шикоят қилиш тартиби қандай?","Жаримага шикоят"]
    ]
  },
  ru: {
    uzLaw:"Право Узбекистана", newChat:"+ Новая консультация", clientType:"Получатель консультации",
    individual:"Физическое лицо", legal:"Юридическое лицо", chats:"Диалоги",
    official:"Официальные источники", officialHint:"Открытые страницы Lex.uz", legalAdvice:"Юридическая консультация",
    checking:"Проверяется база законодательства...", jurisdiction:"РЕСПУБЛИКА УЗБЕКИСТАН",
    welcomeTitle:"Узнайте свои права понятным языком",
    welcomeText:"Подробно опишите ситуацию. Ответ будет основан на локальных кодексах и официальных источниках.",
    notice:"Перед важным решением проверьте действующую редакцию документа в официальном источнике.",
    placeholder:"Опишите вашу правовую ситуацию...", newLine:"Shift + Enter — новая строка",
    sources:"Использованные источники", searching:"Проверяются законы и официальные источники",
    connected:(d)=>`${d.knowledge.documents} документов · ${d.knowledge.chunks.toLocaleString()} фрагментов · ${d.onlineSearch ? "официальный онлайн-поиск включён" : "офлайн-режим"}`,
    noServer:"Нет связи с сервером", error:"Ошибка", checkConnection:"Проверьте сервер и подключение к интернету.",
    prompts:[
      ["Мне не возвращают деньги по долгу. Как взыскать задолженность?","Взыскание долга"],
      ["Куда обращаться и какие документы нужны для взыскания алиментов?","Алименты"],
      ["Контрагент нарушил договор с ООО. Какие меры принять юридическому лицу?","Договорный спор"],
      ["Как обжаловать административный штраф, если я с ним не согласен?","Обжалование штрафа"]
    ]
  }
};

function t(key) { return I18N[state.language][key]; }

function chatStorageKey() {
  return state.user?.email ? `yurist-ai-chats:${state.user.email}` : "yurist-ai-chats:guest";
}

function loadChatsForUser() {
  state.chats = JSON.parse(localStorage.getItem(chatStorageKey()) || "[]");
  state.activeId = null;
  renderChatList();
  newChat();
}

function save() {
  localStorage.setItem(chatStorageKey(), JSON.stringify(state.chats.slice(0, 30)));
}

function currentChat() {
  return state.chats.find((x) => x.id === state.activeId);
}

function newChat() {
  state.activeId = null;
  messages.innerHTML = document.querySelector(".welcome")?.outerHTML || welcomeHtml();
  renderChatList();
  bindSuggestions();
  bindNewsActions();
  loadLegalNews();
  question.focus();
}

function welcomeHtml() {
  const prompts = t("prompts").map(([prompt, label]) => `<button data-prompt="${escapeHtml(prompt)}">${escapeHtml(label)}</button>`).join("");
  return `<div class="welcome"><div class="scales">§</div><h2>Huquqingizni tushunarli tilda biling</h2>
  <p>${escapeHtml(t("welcomeText"))}</p><div class="suggestions">${prompts}</div>
  <section class="news-section">
    <div class="news-heading">
      <div><span>RASMIY YANGILANISHLAR</span><h3>Qonunchilik yangiliklari</h3></div>
      <button class="news-open-page" type="button" data-open-news-page>Barchasini ko'rish →</button>
    </div>
    <div id="legalNews" class="news-grid"><div class="news-skeleton"></div><div class="news-skeleton"></div><div class="news-skeleton"></div></div>
  </section></div>`
    .replace("Huquqingizni tushunarli tilda biling", escapeHtml(t("welcomeTitle")));
}

async function loadLegalNews() {
  const container = $("#legalNews");
  if (!container) return;
  try {
    const response = await fetch("/api/legal-news");
    const data = await response.json();
    if (!response.ok || !data.items?.length) throw new Error(data.error || "Yangilik topilmadi");
    container.innerHTML = data.items.map((item, index) => `<a class="news-card ${index === 0 ? "featured" : ""}" href="${encodeURI(item.url)}" target="_blank" rel="noopener">
      <div class="news-top"><span class="news-type">${escapeHtml(item.type)}</span><time>${escapeHtml(item.date)}</time></div>
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.meta)}</p>
      <span class="news-link">Lex.uz da o'qish <b>→</b></span>
    </a>`).join("");
  } catch {
    container.innerHTML = `<div class="news-empty">Rasmiy yangiliklarni hozir olishning imkoni bo'lmadi. Keyinroq qayta urinib ko'ring.</div>`;
  }
}

async function fetchLegalNews() {
  if (legalNewsCache) return legalNewsCache;
  const response = await fetch("/api/legal-news");
  const data = await response.json();
  if (!response.ok || !data.items?.length) throw new Error(data.error || "Yangilik topilmadi");
  legalNewsCache = data;
  return data;
}

function newsCardsHtml(items, { featured = true } = {}) {
  return items.map((item, index) => `<a class="news-card ${featured && index === 0 ? "featured" : ""}" href="${encodeURI(item.url)}" target="_blank" rel="noopener">
    <div class="news-top"><span class="news-type">${escapeHtml(item.type)}</span><time>${escapeHtml(item.date)}</time></div>
    <h4>${escapeHtml(item.title)}</h4>
    <p>${escapeHtml(item.meta)}</p>
    <span class="news-link">Lex.uz da o'qish <b>→</b></span>
  </a>`).join("");
}

async function showNewsPage() {
  state.activeId = null;
  renderChatList();
  messages.innerHTML = `<section class="news-page">
    <button class="back-home" type="button" data-back-home>← Bosh sahifaga qaytish</button>
    <div class="news-page-hero">
      <span>LEX.UZ RASMIY YANGILANISHLAR</span>
      <h2>Qonunchilik yangiliklari</h2>
      <p>O'zbekistonda e'lon qilinayotgan yangi qonun hujjatlari va rasmiy yangilanishlar. Muhim qarordan oldin hujjatning amaldagi tahririni Lex.uz’da tekshiring.</p>
    </div>
    <div id="legalNewsPage" class="news-grid news-grid-full"><div class="news-skeleton"></div><div class="news-skeleton"></div><div class="news-skeleton"></div></div>
    <div class="news-page-actions">
      <a href="https://lex.uz/uz/search/official?lang=4&pub_date=week" target="_blank" rel="noopener">Lex.uz rasmiy sahifasida ochish</a>
    </div>
  </section>`;
  bindNewsActions();
  try {
    const data = await fetchLegalNews();
    $("#legalNewsPage").innerHTML = newsCardsHtml(data.items, { featured: false });
  } catch {
    $("#legalNewsPage").innerHTML = `<div class="news-empty">Rasmiy yangiliklarni hozir olishning imkoni bo'lmadi. Keyinroq qayta urinib ko'ring.</div>`;
  }
}

function renderChatList() {
  $("#chatList").innerHTML = state.chats.map((chat) =>
    `<button class="chat-item ${chat.id === state.activeId ? "active" : ""}" data-id="${chat.id}">${escapeHtml(chat.title)}</button>`
  ).join("");
  document.querySelectorAll(".chat-item").forEach((el) => el.onclick = () => openChat(el.dataset.id));
}

function openChat(id) {
  state.activeId = id;
  const chat = currentChat();
  messages.innerHTML = "";
  chat.messages.forEach(renderMessage);
  renderChatList();
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text = "") {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatAnswer(text = "") {
  return escapeHtml(text)
    .replace(/^(\d+\)\s[^\n]+|Savolga qisqa javob|Qisqa javob|Huquqiy tahlil|Qonuniy asos|Amaliy qadamlar|Kerakli hujjatlar va dalillar|Xavf va muddatlar|Xulosa)$/gim, "<h3>$1</h3>")
    .replace(/\[([LO]\d+)\]/g, "<strong>[$1]</strong>");
}

function renderMessage(message) {
  const div = document.createElement("div");
  div.className = `message ${message.role}`;
  if (message.role === "user") {
    div.innerHTML = `<div class="bubble">
      ${message.image ? `<div class="message-image"><img src="${message.image.preview}" alt="Yuklangan rasm"><span>${escapeHtml(message.image.name)}</span></div>` : ""}
      ${escapeHtml(message.content)}
    </div>`;
  } else {
    const sources = (message.sources || []).map((s) => {
      const inner = `<span class="source-id">[${s.id}]</span><span>${escapeHtml(s.title)}</span><small>${escapeHtml(s.detail || "")}</small>`;
      return s.url ? `<a class="source" href="${encodeURI(s.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="source">${inner}</div>`;
    }).join("");
    const confidenceText = {
      high: "Manba mosligi: yuqori",
      medium: "Manba mosligi: o'rta",
      low: "Manba mosligi: past"
    }[message.confidence] || "Manba mosligi tekshirildi";
    div.innerHTML = `<div class="avatar">Y</div><div class="bubble">
      <div class="answer-text">${formatAnswer(message.content)}</div>
      ${sources ? `<div class="source-panel"><strong>${escapeHtml(t("sources"))}</strong><div class="sources">${sources}</div></div>` : ""}
      ${message.answerId ? `<div class="answer-meta">
        <span class="confidence">${escapeHtml(confidenceText)}</span>
        <span>${message.checkedAt ? new Date(message.checkedAt).toLocaleString() : ""}</span>
        <span class="feedback">Foydali bo'ldimi?
          <button data-feedback="up" data-answer-id="${message.answerId}" aria-label="Foydali">Ha</button>
          <button data-feedback="down" data-answer-id="${message.answerId}" aria-label="Foydasiz">Yo'q</button>
        </span>
      </div>` : ""}
      ${message.domain ? `<div class="agency-tools">
        <button class="find-agency" data-find-agency="${message.answerId || ""}">Eng yaqin davlat organini topish</button>
        <span>Joylashuv faqat masofani hisoblash uchun ishlatiladi.</span>
        <div class="agency-result"></div>
      </div>` : ""}
    </div>`;
  }
  messages.appendChild(div);
  div.querySelectorAll("[data-feedback]").forEach((button) => {
    button.onclick = () => sendFeedback(button, message);
  });
  div.querySelectorAll("[data-find-agency]").forEach((button) => {
    button.onclick = () => findNearestAgency(button, message);
  });
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Qurilmada geolokatsiya mavjud emas."));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000
    });
  });
}

async function findNearestAgency(button, message) {
  const result = button.parentElement.querySelector(".agency-result");
  button.disabled = true;
  result.innerHTML = `<div class="agency-loading">Joylashuv aniqlanmoqda va rasmiy katalog tekshirilmoqda...</div>`;
  try {
    const position = await getPosition();
    const response = await fetch("/api/agencies/nearest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        domain: message.domain
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Organlar katalogi olinmadi");
    const offices = data.nearest.map((office) => `<article class="office-card">
      <div><strong>${escapeHtml(office.name)} DXM</strong><span>${office.distanceKm} km</span></div>
      <p>${escapeHtml(office.address)}</p>
      <small>${escapeHtml(office.region)} · ${escapeHtml(office.phone || "Telefon ko'rsatilmagan")}</small>
      <a href="${encodeURI(office.mapUrl)}" target="_blank" rel="noopener">Xaritada ochish</a>
    </article>`).join("");
    result.innerHTML = `<div class="agency-route">
      <h4>Masalaga mos organ</h4>
      <strong>${escapeHtml(data.route.primary)}</strong>
      <p>${escapeHtml(data.route.explanation)}</p>
      <h4>Olib boriladigan hujjatlar</h4>
      <ul>${data.route.documents.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      <div class="official-actions">
        <a href="${encodeURI(data.route.onlineUrl)}" target="_blank" rel="noopener">${escapeHtml(data.route.onlineLabel)}</a>
        <a class="appointment" href="${encodeURI(data.appointment.url)}" target="_blank" rel="noopener">${escapeHtml(data.appointment.label)}</a>
      </div>
      <p class="privacy-note">${escapeHtml(data.privacy)} Navbat rasmiy saytda foydalanuvchining o'zi tomonidan tasdiqlanadi.</p>
      <h4>Eng yaqin Davlat xizmatlari markazlari</h4>
      <div class="office-list">${offices}</div>
    </div>`;
  } catch (error) {
    const denied = error.code === 1;
    result.innerHTML = `<div class="agency-error">${denied
      ? "Joylashuvga ruxsat berilmadi. Brauzer sozlamasidan ruxsat berib qayta urinishingiz mumkin."
      : escapeHtml(error.message || "Joylashuvni aniqlab bo'lmadi.")}</div>`;
    button.disabled = false;
  }
}

async function sendFeedback(button, message) {
  button.parentElement.querySelectorAll("button").forEach((x) => x.disabled = true);
  try {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rating: button.dataset.feedback,
        answerId: message.answerId,
        domain: message.domain || "",
        language: state.language
      })
    });
    button.classList.add("selected");
  } catch {
    button.parentElement.querySelectorAll("button").forEach((x) => x.disabled = false);
  }
}

function bindSuggestions() {
  document.querySelectorAll("[data-prompt]").forEach((el) => el.onclick = () => {
    question.value = el.dataset.prompt;
    question.dispatchEvent(new Event("input"));
    question.focus();
  });
}

function bindNewsActions() {
  document.querySelectorAll("[data-open-news-page]").forEach((button) => {
    button.onclick = showNewsPage;
  });
  document.querySelectorAll("[data-back-home]").forEach((button) => {
    button.onclick = newChat;
  });
}

function clearPendingImage() {
  state.pendingImage = null;
  const preview = $("#imagePreview");
  if (preview) {
    preview.hidden = true;
    preview.innerHTML = "";
  }
  const input = $("#imageInput");
  if (input) input.value = "";
}

function renderImagePreview(file, dataUrl) {
  const preview = $("#imagePreview");
  if (!preview) return;
  preview.hidden = false;
  preview.innerHTML = `<div class="preview-card">
    <img src="${dataUrl}" alt="Tanlangan rasm">
    <div><strong>${escapeHtml(file.name)}</strong><span>${Math.round(file.size / 1024)} KB · rasm javobdan keyin serverda saqlanmaydi</span></div>
    <button type="button" id="removeImage" aria-label="Rasmni olib tashlash">×</button>
  </div>`;
  $("#removeImage").onclick = clearPendingImage;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi."));
    reader.readAsDataURL(file);
  });
}

function imageStats(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 96;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, size, size);
      const pixels = ctx.getImageData(0, 0, size, size).data;
      let brightness = 0;
      let contrast = 0;
      const grays = [];
      for (let i = 0; i < pixels.length; i += 4) {
        const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
        grays.push(gray);
        brightness += gray;
      }
      brightness /= grays.length;
      for (const gray of grays) contrast += Math.abs(gray - brightness);
      contrast /= grays.length;
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        brightness: Math.round(brightness),
        blur: Math.round(contrast)
      });
    };
    img.onerror = () => resolve({});
    img.src = dataUrl;
  });
}

async function handleImageSelect(file) {
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
    alert("Faqat JPG, PNG yoki WEBP rasm tanlang.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert("Rasm hajmi 5 MB dan oshmasin.");
    return;
  }
  const dataUrl = await fileToDataUrl(file);
  const stats = await imageStats(dataUrl);
  state.pendingImage = { dataUrl, preview: dataUrl, stats, name: file.name };
  renderImagePreview(file, dataUrl);
  if (!question.value.trim()) {
    question.value = "Rasmdagi shikastlanishni tahlil qiling. Sug'urta bo'yicha qancha to'lov olishim mumkin va qanday hujjatlar kerak?";
    question.dispatchEvent(new Event("input"));
  }
  question.focus();
}

function renderAccount() {
  const name = state.user?.name || "Mehmon";
  const email = state.user?.email || "Maslahat uchun kiring";
  $("#accountName").textContent = name;
  $("#accountEmail").textContent = email;
  const avatar = $(".account-avatar");
  if (state.user?.avatarData) {
    avatar.innerHTML = `<img src="${state.user.avatarData}" alt="Profil rasmi">`;
  } else {
    avatar.textContent = (state.user?.email || state.user?.name || "?").slice(0, 1).toUpperCase();
  }
  $("#authAction").textContent = state.user ? "Profil" : "Kirish";
}

function setAuthMode(mode) {
  state.authMode = mode === "register" ? "register" : "login";
  const registering = state.authMode === "register";
  $("#authTitle").textContent = registering ? "Ro'yxatdan o'tish" : "Hisobga kirish";
  $("#authText").textContent = registering
    ? "Ism, email va parol kiriting. Keyin darhol maslahat olishni boshlaysiz."
    : "Email va parolingizni kiriting. Hali hisobingiz bo'lmasa, ro'yxatdan o'ting.";
  $("#authSubmit").textContent = registering ? "Ro'yxatdan o'tish" : "Kirish";
  $("#nameField").style.display = registering ? "grid" : "none";
  $("#authName").required = registering;
  $("#authPassword").autocomplete = registering ? "new-password" : "current-password";
  $("#loginTab").classList.toggle("active", !registering);
  $("#registerTab").classList.toggle("active", registering);
  $("#authError").hidden = true;
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  $("#authDialog").showModal();
  setTimeout(() => (state.authMode === "register" ? $("#authName") : $("#authEmail")).focus(), 50);
}

async function refreshAuth() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();
    state.user = data.user || null;
  } catch {
    state.user = null;
  }
  renderAccount();
  loadChatsForUser();
}

async function submitAuth(event) {
  event.preventDefault();
  $("#authError").hidden = true;
  $("#authSubmit").disabled = true;
  const payload = {
    name: $("#authName").value.trim(),
    email: $("#authEmail").value.trim(),
    password: $("#authPassword").value
  };
  try {
    const response = await fetch(`/api/auth/${state.authMode === "register" ? "register" : "login"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Kirish amalga oshmadi.");
    state.user = data.user;
    $("#authPassword").value = "";
    $("#authDialog").close();
    renderAccount();
    loadChatsForUser();
  } catch (error) {
    $("#authError").textContent = error.message;
    $("#authError").hidden = false;
  } finally {
    $("#authSubmit").disabled = false;
  }
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  state.user = null;
  renderAccount();
  loadChatsForUser();
  if ($("#profileDialog").open) $("#profileDialog").close();
  openAuth("login");
}

function exportChats() {
  if (!state.user) return openAuth("login");
  const payload = {
    product: "Yurist AI",
    exportedAt: new Date().toISOString(),
    user: { name: state.user.name, email: state.user.email },
    chats: state.chats
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `yurist-ai-chat-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function deleteAccount() {
  if (!state.user) return openAuth("login");
  const confirmed = confirm("Hisobingiz serverdan o'chiriladi. Brauzerdagi shu hisobga tegishli chat tarixi ham tozalanadi. Davom etasizmi?");
  if (!confirmed) return;
  $("#deleteAccount").disabled = true;
  try {
    const response = await fetch("/api/auth/account", { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Hisobni o'chirib bo'lmadi.");
    localStorage.removeItem(chatStorageKey());
    state.user = null;
    state.chats = [];
    state.activeId = null;
    renderAccount();
    if ($("#profileDialog").open) $("#profileDialog").close();
    newChat();
    openAuth("register");
  } catch (error) {
    $("#profileError").textContent = error.message;
    $("#profileError").hidden = false;
  } finally {
    $("#deleteAccount").disabled = false;
  }
}

function profileInitial() {
  return (state.user?.email || state.user?.name || "?").slice(0, 1).toUpperCase();
}

function renderProfileAvatar(data = state.profileAvatarData) {
  const box = $("#profileAvatarPreview");
  if (!box) return;
  if (data) box.innerHTML = `<img src="${data}" alt="Profil rasmi">`;
  else box.textContent = profileInitial();
}

function openProfile() {
  if (!state.user) return openAuth("login");
  state.profileAvatarData = state.user.avatarData || "";
  $("#profileName").value = state.user.name || "";
  $("#profileEmail").value = state.user.email || "";
  $("#profileError").hidden = true;
  renderProfileAvatar();
  $("#profileDialog").showModal();
}

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return reject(new Error("Profil rasmi JPG, PNG yoki WEBP bo'lishi kerak."));
    if (file.size > 2 * 1024 * 1024) return reject(new Error("Rasm juda katta. 2 MB dan kichik rasm tanlang."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasm ochilmadi."));
      img.onload = () => {
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = Math.max(0, (img.naturalWidth - side) / 2);
        const sy = Math.max(0, (img.naturalHeight - side) / 2);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function chooseProfileAvatar(file) {
  if (!file) return;
  try {
    state.profileAvatarData = await resizeAvatar(file);
    renderProfileAvatar();
  } catch (error) {
    $("#profileError").textContent = error.message;
    $("#profileError").hidden = false;
  }
}

async function saveProfile(event) {
  event.preventDefault();
  $("#profileError").hidden = true;
  $("#saveProfile").disabled = true;
  try {
    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: $("#profileName").value.trim(),
        avatarData: state.profileAvatarData
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Profil saqlanmadi.");
    state.user = data.user;
    renderAccount();
    $("#profileDialog").close();
  } catch (error) {
    $("#profileError").textContent = error.message;
    $("#profileError").hidden = false;
  } finally {
    $("#saveProfile").disabled = false;
  }
}

async function sendQuestion(text, image = null) {
  if (state.busy) return;
  if (!state.user) {
    openAuth("login");
    return;
  }
  if (!state.activeId) {
    const chat = { id: crypto.randomUUID(), title: text.slice(0, 52), messages: [], createdAt: Date.now() };
    state.chats.unshift(chat);
    state.activeId = chat.id;
    messages.innerHTML = "";
  }
  const chat = currentChat();
  const userMessage = { role: "user", content: text, image: image ? { preview: image.preview, name: image.name } : null };
  chat.messages.push(userMessage);
  renderMessage(userMessage);

  const typing = document.createElement("div");
  typing.className = "message assistant";
  typing.innerHTML = `<div class="avatar">Y</div><div class="typing">${escapeHtml(t("searching"))}</div>`;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  state.busy = true;
  $("#sendBtn").disabled = true;
  save();
  renderChatList();

  try {
    const endpoint = image ? "/api/image-case" : "/api/chat";
    const payload = image ? {
      question: text,
      personType: state.personType,
      language: state.language,
      online: $("#onlineToggle").checked,
      imageData: image.dataUrl,
      imageStats: image.stats
    } : {
      question: text,
      personType: state.personType,
      language: state.language,
      online: $("#onlineToggle").checked,
      history: chat.messages.slice(-9)
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.status === 401) {
      openAuth("login");
      throw new Error(data.error || "Avval hisobga kiring.");
    }
    if (!response.ok) throw new Error(data.error || "Server xatosi");
    const assistant = {
      role: "assistant",
      content: data.answer,
      sources: data.sources,
      checkedAt: data.checkedAt,
      answerId: data.answerId,
      confidence: data.confidence,
      domain: data.domain
    };
    chat.messages.push(assistant);
    typing.remove();
    renderMessage(assistant);
  } catch (error) {
    typing.remove();
    renderMessage({ role: "assistant", content: `${t("error")}: ${error.message}. ${t("checkConnection")}`, sources: [] });
  } finally {
    state.busy = false;
    $("#sendBtn").disabled = false;
    save();
    messages.scrollTop = messages.scrollHeight;
  }
}

$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = question.value.trim();
  if (!text) return;
  if (!state.user) {
    openAuth("login");
    return;
  }
  const image = state.pendingImage;
  question.value = "";
  clearPendingImage();
  question.dispatchEvent(new Event("input"));
  sendQuestion(text, image);
});

question.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("#chatForm").requestSubmit();
  }
});
question.addEventListener("input", () => {
  $("#counter").textContent = `${question.value.length} / 6000`;
  question.style.height = "auto";
  question.style.height = `${Math.min(question.scrollHeight, 160)}px`;
});

document.querySelectorAll(".person").forEach((el) => {
  el.classList.toggle("active", el.dataset.type === state.personType);
  el.onclick = () => {
    state.personType = el.dataset.type;
    localStorage.setItem("yurist-ai-person", state.personType);
    document.querySelectorAll(".person").forEach((x) => x.classList.toggle("active", x === el));
  };
});

$("#newChat").onclick = newChat;
$("#newsNav").onclick = showNewsPage;
$("#menuBtn").onclick = () => $(".sidebar").classList.toggle("open");
$("#authAction").onclick = () => state.user ? openProfile() : openAuth("login");
$("#loginTab").onclick = () => setAuthMode("login");
$("#registerTab").onclick = () => setAuthMode("register");
$("#closeAuth").onclick = () => $("#authDialog").close();
$("#authForm").onsubmit = submitAuth;
$("#closeProfile").onclick = () => $("#profileDialog").close();
$("#profileForm").onsubmit = saveProfile;
$("#chooseAvatar").onclick = () => $("#profileAvatarInput").click();
$("#profileAvatarInput").onchange = (event) => chooseProfileAvatar(event.target.files?.[0]);
$("#removeAvatar").onclick = () => {
  state.profileAvatarData = "";
  renderProfileAvatar("");
};
$("#logoutFromProfile").onclick = logout;
$("#exportChats").onclick = exportChats;
$("#deleteAccount").onclick = deleteAccount;
$("#attachBtn").onclick = () => $("#imageInput").click();
$("#imageInput").onchange = (event) => handleImageSelect(event.target.files?.[0]);
question.addEventListener("paste", (event) => {
  const file = [...(event.clipboardData?.files || [])].find((item) => item.type?.startsWith("image/"));
  if (file) handleImageSelect(file);
});

let healthData = null;
function applyLanguage() {
  document.documentElement.lang = state.language === "ru" ? "ru" : "uz";
  document.querySelectorAll("[data-i18n]").forEach((el) => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => el.placeholder = t(el.dataset.i18nPlaceholder));
  $("#languageSelect").value = state.language;
  $("#status").textContent = healthData ? t("connected")(healthData) : t("checking");
  if (!state.activeId) {
    messages.innerHTML = welcomeHtml();
    bindSuggestions();
    bindNewsActions();
    loadLegalNews();
  } else {
    openChat(state.activeId);
  }
}

$("#languageSelect").onchange = (event) => {
  state.language = event.target.value;
  localStorage.setItem("yurist-ai-language", state.language);
  applyLanguage();
};

fetch("/api/health").then((r) => r.json()).then((data) => {
  healthData = data;
  $("#status").textContent = t("connected")(data);
}).catch(() => $("#status").textContent = t("noServer"));

renderAccount();
setAuthMode("login");
renderChatList();
bindSuggestions();
bindNewsActions();
applyLanguage();
loadLegalNews();
refreshAuth();

const INFO = {
  privacy: `<h2>Maxfiylik siyosati</h2>
    <p>Huquqiy savol javob yaratish vaqtida serverga yuboriladi, ammo ushbu versiyada savol va javob server bazasida saqlanmaydi. Suhbat tarixi foydalanuvchining o'z brauzerida saqlanadi.</p>
    <h3>Nimani yozmaslik kerak?</h3>
    <p>Pasport seriyasi, JShShIRning to'liq raqami, bank karta ma'lumoti, parol, tibbiy sir yoki uchinchi shaxsning ortiqcha shaxsiy ma'lumotlarini yubormang.</p>
    <h3>Feedback</h3><p>“Ha/Yo'q” bahosi javob identifikatori va huquq sohasi bilan saqlanadi; savol matni feedback fayliga yozilmaydi.</p>`,
  terms: `<h2>Foydalanish shartlari</h2>
    <p>Yurist AI huquqiy axborot va amaliy yo'nalish beradi. Javob advokat xulosasi, notarial harakat, sud hujjati yoki davlat organining rasmiy javobi emas.</p>
    <p>Foydalanuvchi muhim muddat, summa va hujjatning amaldagi tahririni rasmiy manbada tekshirishi lozim. Noqonuniy maqsadda foydalanish taqiqlanadi.</p>`,
  trust: `<h2>Ishonch markazi</h2>
    <h3>Manbalar</h3><p>Javoblar lokal kodekslar bazasi va Lex.uz kabi rasmiy ochiq manbalar bilan tekshiriladi. Rasmiy manbalar yoqilgan bo'lsa, javobda [O] belgili havolalar ko'rsatiladi.</p>
    <h3>Maxfiylik</h3><p>Chat matni server bazasida saqlanmaydi; suhbat tarixi foydalanuvchi brauzerida qoladi. Profil rasmi va hisob ma'lumotlari foydalanuvchi hisobini yuritish uchun saqlanadi.</p>
    <h3>Foydalanuvchi nazorati</h3><p>Profil oynasida chat tarixini eksport qilish va hisobni o'chirish imkoniyati bor. Hisob o'chirilsa, aktiv sessiyalar ham bekor qilinadi.</p>
    <h3>Chegaralar</h3><p>Tizim huquqiy yo'l-yo'riq beradi, lekin advokat, sud, notarius yoki davlat organining rasmiy qarorini almashtirmaydi.</p>`,
  faq: `<h2>Ko'p so'raladigan savollar</h2>
    <h3>Bu haqiqiy advokatmi?</h3><p>Yo'q. Bu huquqiy axborot va amaliy yo'nalish beruvchi AI yordamchi. Murakkab nizoda advokat bilan maslahatlashish kerak.</p>
    <h3>Qonun yangilansa nima bo'ladi?</h3><p>Bosh sahifadagi yangiliklar Lex.uz rasmiy sahifalaridan olinadi. Muhim qarordan oldin har doim amaldagi tahrirni rasmiy manbada tekshirish kerak.</p>
    <h3>Rasm yuborsam saqlanadimi?</h3><p>Shikastlanish/sug'urta tahlili uchun yuborilgan rasm javob tayyorlash vaqtida ishlatiladi va serverda doimiy saqlanmaydi.</p>
    <h3>Davlat organiga navbat olib beradimi?</h3><p>Hozircha rasmiy navbat sahifasiga yo'naltiradi. To'liq avtomatik navbat olish uchun OneID va vakolatli integratsiya kerak bo'ladi.</p>`,
  about: `<h2>Tizim haqida</h2>
    <p>Tizim tashqi AI API ishlatmaydi. U lokal kodekslarni moddalarga ajratadi, savolga mos bo'laklarni ball asosida topadi va Lex.uz ochiq sahifalaridagi rasmiy natijalar bilan tekshiradi.</p>
    <h3>Manba belgilari</h3><p><strong>[L]</strong> — lokal qonun bazasi. <strong>[O]</strong> — rasmiy onlayn manba.</p>
    <h3>Cheklov</h3><p>Bu qoidaviy qidiruv tizimi; u inson yurist kabi barcha yashirin faktlarni anglamaydi. Savol qancha aniq bo'lsa, javob shuncha foydali bo'ladi.</p>`
};

document.querySelectorAll("[data-open-info]").forEach((button) => {
  button.onclick = () => {
    $("#infoContent").innerHTML = INFO[button.dataset.openInfo];
    $("#infoDialog").showModal();
  };
});
$("#closeInfo").onclick = () => $("#infoDialog").close();

if (!localStorage.getItem("yurist-ai-consent-v1")) $("#consentDialog").showModal();
$("#consentCheck").onchange = (event) => $("#acceptConsent").disabled = !event.target.checked;
$("#acceptConsent").onclick = () => {
  localStorage.setItem("yurist-ai-consent-v1", new Date().toISOString());
  $("#consentDialog").close();
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(() => {}));
}
