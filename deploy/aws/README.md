# AWS EC2 Free Tier CI/CD deploy

Bu konfiguratsiya Yurist AI backendni AWS EC2 Free Tier serveriga GitHub Actions orqali avtomatik deploy qiladi.

## Tanlangan free-tier variant

- EC2 Ubuntu Server 22.04/24.04 LTS
- `t2.micro` yoki regionda free-tier eligible `t3.micro`
- 20–30 GB EBS
- Docker Compose + Nginx
- Backend faqat `127.0.0.1:5050` da ishlaydi, tashqariga Nginx orqali `80/443` ochiladi.

## EC2 security group

Ochiladi:

- `22` — SSH, faqat o'zingizning IP manzilingizdan
- `80` — HTTP
- `443` — HTTPS, domain va SSL qo'shilgandan keyin

`5050` portni internetga ochmang.

## EC2 bir martalik setup

Serverga SSH qiling:

```bash
ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP
```

Keyin:

```bash
curl -fsSL https://raw.githubusercontent.com/Muzaffar171106/yurist/main/deploy/aws/ec2-setup-ubuntu.sh -o ec2-setup-ubuntu.sh
chmod +x ec2-setup-ubuntu.sh
./ec2-setup-ubuntu.sh
```

Eslatma: Docker group qo'shilgandan keyin ba'zan SSH’dan chiqib qayta kirish kerak bo'lishi mumkin.

## GitHub Secrets

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

```text
AWS_EC2_HOST=EC2_PUBLIC_IP
AWS_EC2_USER=ubuntu
AWS_EC2_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
AWS_EC2_SSH_PORT=22
```

Private key — `.pem` faylning to'liq matni. Uni repo ichiga commit qilmang.

## CI/CD qanday ishlaydi

`.github/workflows/deploy-backend-aws.yml`:

1. `main` branchga push bo'lsa backend check/test ishlaydi.
2. Testlar o'tsa GitHub Actions EC2 ga SSH qiladi.
3. Serverda `/opt/yurist-ai` repo pull/reset bo'ladi.
4. `docker compose -f deploy/aws/docker-compose.prod.yml up -d --build` bajariladi.
5. `/api/health` tekshiriladi.

## Swagger

Deploydan keyin:

```text
http://EC2_PUBLIC_IP/api/docs
http://EC2_PUBLIC_IP/api/openapi.json
```

Domain va HTTPS ulanganidan keyin:

```text
https://your-domain.uz/api/docs
```

## Billing xavfsizligi

- RDS, Load Balancer, NAT Gateway ochmang.
- EBS hajmini 30 GB dan oshirmang.
- Faqat bitta micro instance ishlating.
- Billing alarm qo'ying.
