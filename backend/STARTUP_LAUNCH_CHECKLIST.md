# Yurist AI — Uzbekistan Startup Launch Checklist

Bu hujjat Yurist AI’ni ommaga chiqarishdan oldin tekshiriladigan asosiy punktlar uchun.

## 1. Huquqiy va ishonch

- Advokat yoki yuridik firma bilan ommaviy foydalanish shartlari tekshiriladi.
- “AI advokat emas, huquqiy axborot yordamchisi” degan ogohlantirish barcha asosiy joylarda saqlanadi.
- Maxfiy ma’lumot yozmaslik bo‘yicha consent matni majburiy qoladi.
- Murakkab ishlar uchun “professional yuristga murojaat qiling” fallback yo‘li ko‘rsatiladi.
- Hisobni o‘chirish va chat eksporti ishlab turadi.

## 2. Ma’lumot va qonun yangilanishlari

- Lex.uz yangiliklari har kuni kamida 1 marta tekshiriladi.
- Lokal knowledge base yangilanishi uchun administrator jarayoni kerak: yangi TXT/PDF qo‘shish, indeksni qayta qurish, test.
- Rasmiy manbalar faqat ishonchli domenlardan olinadi.

## 3. Texnik production

- JSON fayl storage MVP uchun yetarli, lekin public launch uchun PostgreSQL yoki SQLite migratsiyasi tavsiya qilinadi.
- HTTPS majburiy.
- Reverse proxy: Nginx yoki Cloudflare.
- `NODE_ENV=production`, kuchli rate limit va log rotation yoqiladi.
- Docker compose production serverda sinovdan o‘tkaziladi.
- Backuplar: `data/`, knowledge base va config.

## 4. Xavfsizlik

- Parollar hash holatda saqlanadi.
- Sessiyalar HttpOnly cookie orqali ishlaydi.
- Brute-force login rate limit mavjud.
- Avatar va rasm upload hajmi cheklangan.
- Server loglarida maxfiy savol matnini yozmaslik siyosati saqlanadi.
- Pen-test yoki kamida OWASP basic audit kerak.

## 5. Mahsulot

- Onboarding: foydalanuvchi kimligi, til, jismoniy/yuridik shaxs tanlovi.
- Home page: qonunchilik yangiliklari, taklif savollar, ishonch markazi.
- Profile: ism, email, rasm, eksport, account delete.
- Chat: manbalar, confidence, feedback.
- Rasm tahlili: sug‘urta va shikast holatlari uchun ehtiyotkor taxmin.
- Davlat organi: yaqin DXM, hujjatlar, rasmiy navbat havolasi.

## 6. Monetizatsiya g‘oyalari

- Freemium: kuniga cheklangan bepul maslahat.
- Pro: ko‘proq savol, hujjat shablonlari, PDF eksport.
- B2B: MChJlar uchun shartnoma va soliq savollari.
- Advokat marketplace: murakkab holatni real yuristga yuborish.

## 7. Keyingi yirik bosqichlar

- Real database.
- Admin panel.
- Knowledge updater.
- OneID/davlat xizmatlari integratsiyasi uchun ruxsat va hamkorlik.
- Lokal LLM yoki kuchliroq inference server.
- Mobil ilova release pipeline: Android Play Console, iOS App Store.
