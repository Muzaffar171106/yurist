# Yurist AI — O'zbekiston

Jismoniy va yuridik shaxslar uchun O'zbekiston qonunchiligi bo'yicha manbali AI yordamchi.

## Imkoniyatlar

- 9 ta lokal kodeks va Konstitutsiya bo'yicha modda darajasida qidiruv
- Lotincha savolni kirill yozuvidagi qonun matni bilan moslashtirish
- Lex.uz ochiq sahifalaridan to'g'ridan-to'g'ri onlayn tekshiruv
- Hech qanday tashqi AI yoki qidiruv API ishlatilmaydi
- Har bir javobda lokal `[L...]` va onlayn `[O...]` manbalar
- Jismoniy va yuridik shaxs uchun alohida maslahat konteksti
- To'liq til tanlash: o'zbek lotin, o'zbek kirill va rus tili
- Chat tarixini brauzerda saqlash

## Qanday ishlaydi?

1. Savol tanlangan tildan qat'i nazar yagona qidiruv shakliga normalizatsiya qilinadi.
2. Tizim huquq sohasini aniqlaydi va 9 ta lokal hujjatdagi modda bo'laklarini ball asosida saralaydi.
3. Onlayn rejim yoqilgan bo'lsa, Lex.uz ochiq qidiruv sahifasidan rasmiy hujjatlarni topib o'qiydi.
4. Lokal va rasmiy natijalardan qonuniy asos, amaliy qadamlar, hujjatlar va xavflar tuziladi.
5. Javob o'zbek lotin, o'zbek kirill yoki rus tilida chiqariladi va manbalar `[L]` hamda `[O]` belgilarida ko'rsatiladi.

## Ishga tushirish

1. `START.bat` faylini ikki marta bosing.
2. Brauzerda `http://localhost:5050` ochiladi.

Qo'lda:

```powershell
npm install
npm start
```

## Sozlash

`.env` ichidagi `ONLINE_SEARCH=true` rasmiy sayt bo'yicha to'g'ridan-to'g'ri internet qidiruvini boshqaradi. API kalit kerak emas.

## Muhim

AI javobi yakuniy advokat xulosasi yoki sud qarori emas. Qonunlar o'zgaradi; muhim qarordan oldin ko'rsatilgan hujjatning amaldagi tahririni Lex.uz da tekshiring. Lokal `Soliq_kodeksi.txt` fayli juda kichik, shu sababli soliq savollarida onlayn rasmiy manba ayniqsa muhim.

## Public beta imkoniyatlari

- API rate limit va xavfsizlik headerlari
- Request ID va production xato loglari
- Maxfiylik/foydalanish shartlari va birinchi kirish roziligi
- Javob manbalari va manba mosligi darajasi
- Savol matnini saqlamasdan feedback yig'ish
- PWA: telefon va kompyuterga ilova kabi o'rnatish
- Docker orqali production deploy
- GPS orqali rasmiy katalogdan eng yaqin Davlat xizmatlari markazini topish
- Huquq sohasiga qarab vakolatli organ va kerakli hujjatlarni ko'rsatish
- DXM navbati, My.gov, My.sud, soliq kabineti yoki murojaat portaliga rasmiy o'tish

Deploy yo'riqnomasi: `DEPLOY.md`.
