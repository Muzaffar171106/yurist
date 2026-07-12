# Production deploy

## AWS Free Tier + CI/CD

Repo ichida AWS EC2 Free Tier uchun tayyor konfiguratsiya bor:

```text
../deploy/aws/README.md
../deploy/aws/ec2-setup-ubuntu.sh
../deploy/aws/docker-compose.prod.yml
../.github/workflows/deploy-backend-aws.yml
```

Tavsiya etilgan bepul MVP variant:

```text
EC2 Ubuntu 22.04/24.04
t2.micro yoki free-tier eligible t3.micro
20-30 GB EBS
Docker Compose + Nginx
```

CI/CD ishlashi:

1. `main` branchga push bo'ladi.
2. GitHub Actions backend `npm run check` va `npm test` bajaradi.
3. Testlar o'tsa EC2 ga SSH orqali ulanadi.
4. Serverda repo yangilanadi.
5. Docker compose qayta build/deploy qiladi.
6. `/api/health` tekshiriladi.

Swagger:

```text
http://EC2_PUBLIC_IP/api/docs
http://EC2_PUBLIC_IP/api/openapi.json
```

## Minimal variant

```bash
docker compose up -d --build
```

Ilova `5050` portda ishlaydi. Uni to'g'ridan-to'g'ri internetga ochmang. Nginx yoki Caddy orqali HTTPS bilan ulang.

## Domen

Reverse proxy:

```txt
https://sizning-domen.uz -> http://127.0.0.1:5050
```

## Launchdan oldingi tekshiruv

1. Domen va SSL sertifikat.
2. Maxfiylik siyosati va foydalanish shartlarini real kompaniya rekvizitlari bilan to'ldirish.
3. Soliq kodeksining to'liq va amaldagi matnini qo'shish.
4. Mehnat kodeksi, Uy-joy kodeksi hamda tadbirkorlikka oid asosiy hujjatlarni qo'shish.
5. Huquqshunos tomonidan kamida 100 ta test savol-javobni tekshirtirish.
6. Monitoring, zaxira nusxa va incident tartibini yo'lga qo'yish.
7. Lex.uz sahifa tuzilishi o'zgarsa, onlayn qidiruv parserini yangilash.
8. Geolokatsiya public domenda faqat HTTPS orqali ishlaydi.
9. `entry.davxizmat.uz`, My.gov va boshqa rasmiy tizimlar bilan chuqur integratsiya uchun tegishli davlat organi bilan rasmiy kelishuv va texnik kirish olish.
