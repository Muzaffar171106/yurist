# Yurist AI

O'zbekiston qonunchiligi bo'yicha huquqiy maslahat beruvchi loyiha.

Repo ikki qismdan iborat:

- `backend/` — Node.js/Express backend va web/PWA frontend.
- `flutter/` — Flutter mobile/web client, BLoC va Clean Architecture asosida.

## Backendni ishga tushirish

```bash
cd backend
npm install
copy .env.example .env
npm start
```

Default manzil:

```text
http://127.0.0.1:5050
```

Tekshirish:

```bash
npm run check
npm test
```

## AWS Free Tier CI/CD

Backend uchun GitHub Actions orqali AWS EC2 Free Tier deploy tayyor:

- workflow: `.github/workflows/deploy-backend-aws.yml`
- EC2 setup: `deploy/aws/ec2-setup-ubuntu.sh`
- production compose: `deploy/aws/docker-compose.prod.yml`
- Nginx proxy: `deploy/aws/nginx-yurist-ai.conf`

GitHub Secrets kerak:

```text
AWS_EC2_HOST=EC2_PUBLIC_IP
AWS_EC2_USER=ubuntu
AWS_EC2_SSH_KEY=private key matni
AWS_EC2_SSH_PORT=22
```

Batafsil yo'riqnoma: `deploy/aws/README.md`

Deploydan keyin Swagger:

```text
http://EC2_PUBLIC_IP/api/docs
http://EC2_PUBLIC_IP/api/openapi.json
```

Backend quyidagilarni o'z ichiga oladi:

- lokal qonun bazasi bo'yicha qidiruv;
- rasmiy manbalar va Lex.uz yangiliklari;
- login/register/profile;
- rasm asosida sug'urta/shikast holatini tahlil qilish;
- eng yaqin davlat xizmatlari markazini topish;
- Docker orqali deploy qilish uchun tayyor fayllar.

## Flutter ilovani ishga tushirish

Backend alohida ishga tushiriladi. Flutter client API manzilini `API_BASE_URL` orqali oladi.

```bash
cd flutter
flutter pub get
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:5050
```

Android emulator ishlatayotganda backend host uchun odatda quyidagidan foydalaniladi:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5050
```

Web uchun:

```bash
flutter run -d chrome --dart-define=API_BASE_URL=http://127.0.0.1:5050
```

## Muhim xavfsizlik eslatmasi

GitHub'ga quyidagilar yuklanmasligi kerak:

- `.env`
- `.pem`, `.key` va boshqa kalitlar
- `node_modules/`
- Flutter `build/`, `.dart_tool/`
- runtime `users.json`, `sessions.json`

Shuning uchun repo `.gitignore` bilan himoyalangan.
