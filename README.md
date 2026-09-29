# QuickLoan — Microfinance Demo Website

A demonstration microfinance / online loan marketplace built as a **realistic,
self-owned target for web vulnerability scanning**, specifically for validating
detection of **SQL injection** and **DDoS / resource-exhaustion** conditions.

> **Not a production financial service.** All data is synthetic demo content.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML5, CSS3, vanilla JS, Firebase Hosting |
| Backend | Node.js + Express, Firebase Cloud Functions |
| Database | TiDB Cloud Serverless (MySQL protocol, TLS) |
| Auth | bcryptjs (cost 10), admin allowlist |

## Features

- Public pages: home, loan offers, how it works, about, testimonials, FAQ, 404
- Register / login / forgot-password flows
- Loan application form with pre-fill from offer deep links
- Admin panel listing registered users
- Security-scanning endpoints: `GET /ping`, `POST /scan/sql` (allowlist-guarded)

## Setup

```bash
cd backend
npm install
cp .env.example .env        # fill in your TiDB credentials
node setup-db.js
node create-admin.js
npm start
```

```bash
cd "front end"
cp config.example.js config.js   # set API_BASE to your backend URL
# serve statically, e.g. npx serve .
```

## Documentation

Full functional specification, data model, testing methodology and security
findings: **[REPORT.md](REPORT.md)**

## Security notice

For authorised testing and education only. Do not scan or flood systems you do
not own or have written permission to test.
