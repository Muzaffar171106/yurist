const { normalize, tokens } = require("./knowledge");
const { buildLegalStrategy } = require("./legal-reasoner");

const ACTIONS = {
  "Oila huquqi": [
    "FHDY hujjatlari, bolaning tug'ilganlik guvohnomasi va daromadga oid ma'lumotlarni yig'ing.",
    "Talab turiga qarab fuqarolik ishlari bo'yicha vakolatli sudga ariza yoki da'vo kiriting.",
    "Sud hujjati chiqqach, ijro varaqasi bo'yicha Majburiy ijro byurosiga murojaat qiling."
  ],
  "Fuqarolik huquqi": [
    "Shartnoma, tilxat, to'lov hujjatlari va yozishmalarni bir joyga jamlang.",
    "Qarzdor yoki kontragentga talab mazmuni va muddat ko'rsatilgan yozma talabnoma yuboring.",
    "Talab bajarilmasa, tegishli sudga da'vo va dalillar bilan murojaat qiling."
  ],
  "Fuqarolik protsessi": [
    "Sudlovga tegishlilik va murojaat muddatini tekshiring.",
    "Talab, holatlar va dalillar aniq ko'rsatilgan protsessual hujjat tayyorlang.",
    "Davlat boji, ilovalar va hujjat nusxalarini protsessual talabga muvofiq biriktiring."
  ],
  "Jinoyat huquqi": [
    "Dalillarni o'zgartirmang yoki yo'q qilmang; asl nusxalarni xavfsiz saqlang.",
    "Ariza yoki tushuntirishda faqat tekshiriladigan faktlarni sana va joy bilan yozing.",
    "Ushlab turish, tintuv yoki ayblov holatida himoyachi ishtirokini talab qiling."
  ],
  "Jinoyat protsessi": [
    "Protsessual maqomingizni va sizga topshirilgan qaror/bayonnoma nusxasini aniqlang.",
    "Har bir protsessual harakat bo'yicha sana, vaqt va ishtirokchilarni qayd eting.",
    "Shikoyat muddati o'tib ketmasidan vakolatli prokuror yoki sudga yozma shikoyat kiriting."
  ],
  "Ma'muriy javobgarlik": [
    "Bayonnoma va qarorning to'liq nusxasini oling, e'tirozingizni yozma qayd ettiring.",
    "Foto, video, guvoh va boshqa dalillarni asl holida saqlang.",
    "Qarorda ko'rsatilgan shikoyat muddati va organiga rioya qilib shikoyat bering."
  ],
  "Soliq huquqi": [
    "Soliq organi xabarnomasi, hisobotlar va birlamchi hujjatlarni solishtiring.",
    "Shaxsiy kabinetdagi hisob-kitob va qarzdorlik asosini tekshiring.",
    "Nizo bo'lsa, yuqori turuvchi soliq organi yoki sudga belgilangan muddatda shikoyat qiling."
  ],
  "Saylov huquqi": [
    "Vaziyat, uchastka, sana va buzilish dalillarini aniq qayd eting.",
    "Uchastka yoki okrug saylov komissiyasiga yozma murojaat qiling.",
    "Zarur bo'lsa, yuqori turuvchi komissiya yoki sudga shikoyat tartibini qo'llang."
  ]
};

function bestSentences(text, question, count = 2) {
  const qTerms = tokens(question);
  return text.split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => {
      const n = normalize(sentence);
      const score = qTerms.reduce((sum, term) => sum + (n.includes(term) ? 2 : 0), 0)
        + (/\d+-модда|\d+-modda/i.test(sentence) ? 2 : 0);
      return { sentence: sentence.trim(), score };
    })
    .filter((x) => x.sentence.length >= 35 && x.sentence.length <= 650)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => x.sentence);
}

function urgentNote(question) {
  const q = normalize(question);
  if (/(ushlab|hibs|qamoq|zo'ravon|tahdid|hayot.*xavf)/.test(q)) {
    return "Shoshilinch: xavfsizlik yoki erkinlikka bevosita tahdid bo'lsa, darhol 102 ga murojaat qiling va himoyachi ishtirokini talab qiling.\n\n";
  }
  return "";
}

const PLAIN_DOMAIN = {
  "Oila huquqi": "Bu oila a'zolari o'rtasidagi nikoh, ajrim, aliment, farzand va ota-onalik huquqlariga oid masala.",
  "Fuqarolik huquqi": "Bu shartnoma, qarz, mulk, meros yoki yetkazilgan zararni qoplashga oid masala.",
  "Fuqarolik protsessi": "Bu fuqarolik nizosi bo'yicha sudga qanday murojaat qilish va ishni qanday yuritishga oid masala.",
  "Jinoyat huquqi": "Bu qaysi harakat jinoyat hisoblanishi va uning huquqiy oqibatlariga oid masala.",
  "Jinoyat protsessi": "Bu tergov, ushlab turish, ayblov, himoya va jinoyat ishini ko'rish tartibiga oid masala.",
  "Ma'muriy javobgarlik": "Bu jarima, bayonnoma yoki ma'muriy huquqbuzarlik bo'yicha qarorga oid masala.",
  "Soliq huquqi": "Bu soliq hisoblash, to'lash, hisobot, qarzdorlik yoki soliq organi qaroriga oid masala.",
  "Saylov huquqi": "Bu saylovda ovoz berish, nomzod, komissiya yoki saylov qoidalariga oid masala.",
  "Konstitutsiyaviy huquq": "Bu insonning asosiy huquqlari, erkinliklari va davlat organlarining majburiyatlariga oid masala.",
  "Umumiy huquqiy masala": "Savoldagi ma'lumot huquq sohasini aniq belgilash uchun yetarli emas."
};

const SIMPLE_EXAMPLES = {
  "Oila huquqi": "Masalan, aliment so'ralayotgan bo'lsa, bolaning hujjatlari va ota-onalikni tasdiqlovchi ma'lumotlar asosiy dalil bo'ladi.",
  "Fuqarolik huquqi": "Masalan, qarz berilganini tilxat, bank o'tkazmasi yoki yozishma tasdiqlasa, talabni isbotlash osonlashadi.",
  "Fuqarolik protsessi": "Masalan, sudga faqat ariza berish yetmaydi: talabni tasdiqlovchi hujjatlar va zarur nusxalar ham ilova qilinadi.",
  "Jinoyat huquqi": "Masalan, voqeani ko'rgan guvoh, kamera yozuvi va asl hujjatlar bir-birini tasdiqlasa, dalil kuchliroq bo'ladi.",
  "Jinoyat protsessi": "Masalan, bayonnomaga rozi bo'lmasangiz, imzo qo'yishdan oldin e'tirozingizni bayonnomaning o'zida yozib qoldiring.",
  "Ma'muriy javobgarlik": "Masalan, jarimaga rozi bo'lmasangiz, qaror nusxasi, video va boshqa dalillar bilan belgilangan tartibda shikoyat qilinadi.",
  "Soliq huquqi": "Masalan, hisoblangan qarzdorlik noto'g'ri bo'lsa, hisobot va birlamchi hujjatlar bilan hisob-kitob solishtiriladi.",
  "Saylov huquqi": "Masalan, qoidabuzarlik bo'lsa, joyi, vaqti va dalili aniq qayd etilib saylov komissiyasiga beriladi.",
  "Konstitutsiyaviy huquq": "Masalan, davlat organi murojaatga javob bermasa, murojaat nusxasi va yuborilganini tasdiqlovchi ma'lumot saqlanadi."
};

const CLARIFYING_QUESTIONS = {
  "Oila huquqi": ["Nikoh rasmiy qayd etilganmi?", "Farzandning yoshi nechada?", "Oldin sud qarori yoki kelishuv bo'lganmi?"],
  "Fuqarolik huquqi": ["Yozma shartnoma yoki tilxat bormi?", "Voqea yoki to'lov qachon bo'lgan?", "Qarshi tomonga yozma talab yuborilganmi?"],
  "Fuqarolik protsessi": ["Qaysi talab bilan sudga murojaat qilmoqchisiz?", "Nizo qaysi hududda yuz bergan?", "Oldin sud qarori chiqarilganmi?"],
  "Jinoyat huquqi": ["Voqea qachon va qayerda bo'lgan?", "Qanday dalillar mavjud?", "Ichki ishlar organiga ariza berilganmi?"],
  "Jinoyat protsessi": ["Sizning protsessual maqomingiz nima?", "Qaysi qaror yoki harakat ustidan shikoyat qilmoqchisiz?", "Hujjatni qachon olgansiz?"],
  "Ma'muriy javobgarlik": ["Qaror yoki bayonnoma qachon berilgan?", "Uni qaysi organ rasmiylashtirgan?", "Qanday qarshi dalilingiz bor?"],
  "Soliq huquqi": ["Siz jismoniy shaxsmi yoki tashkilotmisiz?", "Qaysi soliq va qaysi davr haqida gap ketmoqda?", "Soliq organining yozma qarori bormi?"]
};

function explainLegalTerm(text) {
  const normalized = normalize(text);
  const terms = [];
  if (normalized.includes("da'vo")) terms.push("Da'vo — suddan buzilgan huquqni tiklashni so'rab beriladigan rasmiy talab.");
  if (normalized.includes("apellyatsiya")) terms.push("Apellyatsiya — chiqarilgan sud qarorini yuqori sudda qayta tekshirtirish.");
  if (normalized.includes("bayonnoma")) terms.push("Bayonnoma — voqea yoki huquqbuzarlik qayd etilgan rasmiy hujjat.");
  if (normalized.includes("ijro varaqasi")) terms.push("Ijro varaqasi — sud qarorini majburiy bajartirish uchun beriladigan hujjat.");
  if (normalized.includes("protsessual")) terms.push("Protsessual — ishni tergov yoki sudda yuritish tartibiga oid degani.");
  if (normalized.includes("da'vo muddati")) terms.push("Da'vo muddati — sud orqali talab qilish uchun qonunda berilgan vaqt.");
  return terms.slice(0, 3);
}

function articlePlainMeaning(item) {
  const n = normalize(item.heading || item.text.split(/\n+/)[0] || item.text);
  if (n.includes("aliment")) return "Oddiy ma'nosi: alimentni kim, kim uchun va qanday tartibda to'lashi yoki undirish mumkinligini belgilaydi.";
  if (n.includes("ta'minot")) return "Oddiy ma'nosi: ota-ona yoki boshqa oila a'zosining moddiy ta'minot berish majburiyati va tartibini tushuntiradi.";
  if (n.includes("shartnoma") || n.includes("majburiyat")) return "Oddiy ma'nosi: tomonlar kelishilgan majburiyatni bajarishi, bajarmasa esa qonuniy oqibat yuzaga kelishini anglatadi.";
  if (n.includes("qarz")) return "Oddiy ma'nosi: olingan pul yoki mol-mulkni kelishilgan tartibda qaytarish majburiyati nazarda tutiladi.";
  if (n.includes("jarima") || n.includes("ma'muriy")) return "Oddiy ma'nosi: huquqbuzarlik va unga qo'llanadigan javobgarlik tartibini belgilaydi.";
  if (n.includes("shikoyat")) return "Oddiy ma'nosi: qaror yoki harakatga rozi bo'lmagan shaxs uni vakolatli organ yoki sudda tekshirtirishi mumkin.";
  if (n.includes("meros")) return "Oddiy ma'nosi: vafot etgan shaxsning mol-mulki kimga va qanday tartibda o'tishini belgilaydi.";
  return "Oddiy ma'nosi: ushbu norma vaziyat bo'yicha huquq, majburiyat yoki murojaat tartibini belgilaydi.";
}

function toCyrillic(text) {
  const pairs = [
    ["yo'", "йў"], ["sh", "ш"], ["ch", "ч"], ["yo", "ё"], ["yu", "ю"], ["ya", "я"],
    ["o'", "ў"], ["g'", "ғ"]
  ];
  let result = text.replace(/[ʻʼ’‘`]/g, "'");
  for (const [latin, cyr] of pairs) {
    result = result.replace(new RegExp(latin, "gi"), (m) => m[0] === m[0].toUpperCase() ? cyr.toUpperCase() : cyr);
  }
  const letters = {
    a:"а", b:"б", d:"д", e:"е", f:"ф", g:"г", h:"ҳ", i:"и", j:"ж", k:"к",
    l:"л", m:"м", n:"н", o:"о", p:"п", q:"қ", r:"р", s:"с", t:"т", u:"у",
    v:"в", x:"х", y:"й", z:"з"
  };
  return result.replace(/[a-z]/gi, (letter) => {
    const value = letters[letter.toLowerCase()] || letter;
    return letter === letter.toUpperCase() ? value.toUpperCase() : value;
  });
}

const RU_DOMAIN = {
  "Oila huquqi": "Семейное право",
  "Fuqarolik huquqi": "Гражданское право",
  "Fuqarolik protsessi": "Гражданский процесс",
  "Jinoyat huquqi": "Уголовное право",
  "Jinoyat protsessi": "Уголовный процесс",
  "Ma'muriy javobgarlik": "Административная ответственность",
  "Soliq huquqi": "Налоговое право",
  "Saylov huquqi": "Избирательное право",
  "Konstitutsiyaviy huquq": "Конституционное право",
  "Umumiy huquqiy masala": "Общий правовой вопрос"
};

const RU_ACTIONS = {
  "Oila huquqi": [
    "Соберите документы ЗАГС, свидетельство о рождении ребёнка и сведения о доходах.",
    "Подайте заявление или иск в компетентный суд по гражданским делам.",
    "После вынесения судебного акта обратитесь в Бюро принудительного исполнения."
  ],
  "Fuqarolik huquqi": [
    "Соберите договор, расписку, платёжные документы и переписку.",
    "Направьте должнику или контрагенту письменную претензию с требованием и сроком исполнения.",
    "При неисполнении требования обратитесь с иском и доказательствами в компетентный суд."
  ],
  "Ma'muriy javobgarlik": [
    "Получите полную копию протокола и постановления, письменно зафиксируйте возражения.",
    "Сохраните оригиналы фото, видео, показаний свидетелей и иных доказательств.",
    "Подайте жалобу в орган и срок, указанные в постановлении."
  ],
  "Jinoyat huquqi": [
    "Не изменяйте и не уничтожайте доказательства; сохраните оригиналы.",
    "Указывайте в заявлениях только проверяемые факты, даты и места.",
    "При задержании, обыске или предъявлении обвинения требуйте участия защитника."
  ],
  "Jinoyat protsessi": [
    "Уточните свой процессуальный статус и получите копию постановления или протокола.",
    "Фиксируйте дату, время и участников каждого процессуального действия.",
    "До истечения срока подайте письменную жалобу прокурору или в суд."
  ],
  "Soliq huquqi": [
    "Сопоставьте уведомление налогового органа, отчётность и первичные документы.",
    "Проверьте расчёт задолженности в личном кабинете.",
    "При споре своевременно обжалуйте решение в вышестоящий налоговый орган или суд."
  ]
};

function generateRussian({ question, personType, local, online }) {
  const found = local.results.slice(0, 4);
  const legalBasis = found.map((item, i) =>
    `- [L${i + 1}] ${item.source}${item.article ? `, статья ${item.article}` : ""} — релевантный фрагмент из локальной базы законодательства.`
  ).join("\n");
  const onlineBasis = online.slice(0, 4).map((item, i) => `- [O${i + 1}] ${item.title}`).join("\n");
  const actions = RU_ACTIONS[local.domain.name] || [
    "Соберите документы, переписку, чеки и официальные ответы по ситуации.",
    "Направьте письменное обращение в компетентный орган с датами, фактами и требованием.",
    "При отказе или бездействии проверьте порядок обжалования в вышестоящий орган либо суд."
  ];
  const urgent = /(задерж|арест|насили|угроз|опасност)/i.test(question)
    ? "Срочно: при непосредственной угрозе жизни, безопасности или свободе звоните 102 и требуйте участия защитника.\n\n"
    : "";
  const entity = personType === "legal"
    ? "Для юридического лица особенно важны устав, договор, реквизиты и документ, подтверждающий полномочия представителя."
    : "Для физического лица важны паспорт/ПИНФЛ, контактные данные и доказательства нарушения права.";

  return `${urgent}1) Краткий ответ
Вопрос относится к направлению «${RU_DOMAIN[local.domain.name] || local.domain.name}». ${found.length ? "В локальной базе найдены близкие нормы." : "Достаточно близкая норма в локальной базе не найдена."} ${online.length ? "Также проверены официальные результаты Lex.uz." : "Официальный онлайн-поиск не дал результата."}

2) Правовой анализ
${entity} Итог зависит от вида требования, даты события, доказательств и процессуального срока. Все значимые действия лучше оформлять письменно или сохранять их электронное подтверждение.

3) Правовое основание
${legalBasis || "- Точная локальная норма не определена."}
${onlineBasis ? `\nОфициальные онлайн-документы:\n${onlineBasis}` : ""}

4) Практические действия
${actions.map((x, i) => `${i + 1}. ${x}`).join("\n")}

5) Документы и доказательства
- документ, удостоверяющий личность или полномочия представителя организации;
- договор, решение, протокол, заявление и официальная переписка;
- платёжные документы, фото, видео, свидетели и иные доказательства;
- предыдущие обращения и ответы на них.

6) Риски и сроки
Сроки подачи иска, жалобы или апелляции зависят от категории дела. Сразу проверьте дату документа и указанный в нём порядок обжалования; не определяйте срок приблизительно.

7) Вывод
Безопасный порядок действий: сохранить доказательства, направить письменное требование или обращение и соблюдать установленную процедуру. Перед важным решением проверьте действующую редакцию документа и дату вступления в силу на Lex.uz.`;
}

function generateAnswer({ question, personType, language = "uz-latn", local, online }) {
  if (language === "ru") return generateRussian({ question, personType, local, online });
  const found = local.results.slice(0, 4);
  const strategy = buildLegalStrategy({ question, personType, local, online });
  const legalBasis = found.map((item, i) => {
    const heading = item.text.split(/\n+/).find((line) => line.trim().length > 5)?.trim() || "";
    return `- [L${i + 1}] ${item.source}${item.article ? `, ${item.article}-modda` : ""}${heading ? ` — ${heading}` : ""}\n  ${articlePlainMeaning(item)}`;
  }).join("\n");

  const onlineBasis = online.slice(0, 4).map((item, i) => {
    const selected = bestSentences(item.content || item.title, question, 1)[0];
    return `- [O${i + 1}] ${item.title}${selected ? ` — ${selected}` : ""}`;
  }).join("\n");

  const actions = ACTIONS[local.domain.name] || [
    "Vaziyatga oid barcha hujjat, yozishma, chek va rasmiy javoblarni yig'ing.",
    "Talabingizni sana va faktlar bilan yozma shaklda tegishli organga yuboring.",
    "Rad javobi yoki harakatsizlik bo'lsa, yuqori turuvchi organ yoxud sudga shikoyat tartibini tekshiring."
  ];
  const entity = personType === "legal"
    ? "Yuridik shaxs nomidan vakolatni tasdiqlovchi hujjat, ustav, shartnoma va rahbar/ishonchli vakil rekvizitlari alohida ahamiyatga ega."
    : "Jismoniy shaxs sifatida pasport/JShShIR, aloqa ma'lumotlari va huquqingiz buzilganini tasdiqlovchi dalillar muhim.";

  const sourceWarning = found.length
    ? "Lokal bazada savolga yaqin normalar topildi, ammo ularning aynan sizning holatingizga tatbiqi faktlar va hujjatlarga bog'liq."
    : "Lokal bazada savolga yetarlicha yaqin norma topilmadi; aniq modda aytish uchun savolni faktlar bilan aniqlashtirish kerak.";
  const onlineWarning = online.length
    ? "Lex.uz dagi rasmiy onlayn natijalar ham tekshirildi."
    : "Rasmiy onlayn qidiruv natija bermadi; internet aloqasi yoki qidiruv iborasini tekshirish kerak.";
  const glossary = explainLegalTerm(`${question} ${actions.join(" ")}`);
  const questions = CLARIFYING_QUESTIONS[local.domain.name] || [
    "Voqea qachon va qayerda yuz bergan?",
    "Qanday yozma hujjat yoki dalillar mavjud?",
    "Oldin qaysi organga murojaat qilingansiz?"
  ];
  const plainDomain = PLAIN_DOMAIN[local.domain.name] || PLAIN_DOMAIN["Umumiy huquqiy masala"];
  const example = SIMPLE_EXAMPLES[local.domain.name] || "Masalan, har qanday talabni yozma hujjat, sana va dalil bilan tasdiqlash uni tekshirishni osonlashtiradi.";
  const aiAudit = `AI tekshiruvi
- Huquq sohasi: ${strategy.domainName}.
- Taxminiy ishonchlilik: ${strategy.confidence.level} (${strategy.confidence.score}/100).
- Sabablar: ${strategy.confidence.reasons.join("; ")}.
- Xavf signallari: ${strategy.riskText}.
- Murojaat yo'li: ${strategy.summary}
- Zaxira yo'l: ${strategy.agency.secondary}.`;
  const missingBlock = strategy.missing.length
    ? `\nAniqlashtirilsa javob ancha kuchayadi: ${strategy.missing.join("; ")}.`
    : "";
  const documentBlock = strategy.documents.map((x, i) => `${i + 1}. ${x}`).join("\n");

  const answer = `${urgentNote(question)}1) Eng qisqa javob
${plainDomain}
Hozir qilinadigan eng to'g'ri ish: dalillarni yig'ish, talabni yozma rasmiylashtirish va vakolatli organ yoki sud tartibini tekshirish.

2) Sizning vaziyatingiz oddiy tilda
${entity}
Natija uch narsaga bog'liq: nima sodir bo'lgani, buni nima bilan isbotlash mumkinligi va murojaat muddati o'tgan-o'tmaganiga. Og'zaki gapdan ko'ra shartnoma, tilxat, chek, yozishma, foto, video yoki rasmiy javob kuchliroq dalil hisoblanadi.
${sourceWarning} ${onlineWarning}${missingBlock}

${aiAudit}

3) Qonuniy asos
${legalBasis || "- Mos lokal norma aniqlanmadi."}
${onlineBasis ? `\nRasmiy onlayn hujjatlar:\n${onlineBasis}` : ""}

4) Nima qilish kerak — bosqichma-bosqich
${actions.map((x, i) => `${i + 1}. ${x}`).join("\n")}

5) Oldindan tayyorlab qo'ying
${documentBlock}

6) Sodda misol
${example}

${glossary.length ? `7) Yuridik so'zlarning oddiy ma'nosi\n${glossary.map((x) => `- ${x}`).join("\n")}\n\n` : ""}${glossary.length ? "8" : "7"}) Muhim xavf va muddatlar
Da'vo, shikoyat va apellyatsiya muddatlari masala turiga qarab farq qiladi. Qaror yoki bayonnomada ko'rsatilgan sana va shikoyat tartibini darhol tekshiring; muddatni taxmin qilmang.
Topilgan modda savolga yaqin bo'lsa ham, hujjatning amaldagi tahriri va aynan sizning holatingizga tatbiq etilishini alohida tekshirish kerak.

${glossary.length ? "9" : "8"}) Aniqlik uchun kerak bo'ladigan ma'lumotlar
${questions.map((x, i) => `${i + 1}. ${x}`).join("\n")}

${glossary.length ? "10" : "9"}) Xulosa
Eng xavfsiz yo'l — dalillarni saqlash, murojaatni yozma yuborish va uning qabul qilinganini tasdiqlovchi ma'lumotni olish. Muhim qarordan oldin hujjatning amaldagi tahriri va kuchga kirgan sanasini Lex.uz da tekshiring.`;
  return language === "uz-cyrl" ? toCyrillic(answer) : answer;
}

module.exports = { generateAnswer, bestSentences, toCyrillic };
