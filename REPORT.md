# QuickLoan — Microfinance Demo Website

## Functional Specification and Security-Testing Use Case

**Project type:** Academic / demonstration web application
**Repository:** https://github.com/vijayvichu/microfinance-demo
**Branch:** `main`
**Frontend host:** Firebase Hosting (deployment URL not committed — set it in
`front end/config.js` and in the `ALLOWED_HOSTS` allowlist in `functions/index.js`)
**Database:** TiDB Cloud Serverless (MySQL-compatible), schema `quickloan`

> No credentials, API keys or deployment endpoints are stored in this repository.
> Every value is supplied through `.env` or `front end/config.js`, both of which
> are git-ignored. See `backend/.env.example` and `front end/config.example.js`.

---

## 1. Purpose

QuickLoan is a **demonstration microfinance / online loan marketplace**. It is
not a production financial service. It exists to provide a realistic, self-owned
target application that a web vulnerability scanner can be pointed at in order to
validate detection of **SQL Injection** and **Denial-of-Service (resource
exhaustion / request flooding)** conditions.

The application behaves like a genuine small-lender aggregator — real navigation,
real forms, real authentication, and a real relational database — so scan results
reflect true server behaviour rather than static markup or mocked fixtures.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML5, CSS3, vanilla JavaScript |
| Frontend hosting | Firebase Hosting (`front end/firebase.json`) |
| Client SDK | Firebase JS SDK v10.12.2 (Firestore reference) |
| Backend | Node.js + Express (`backend/server.js`, local / Render deployment) |
| Serverless API | Firebase Cloud Functions (`functions/index.js`, `exports.api`) |
| Database | TiDB Cloud Serverless (MySQL protocol, port 4000, TLS 1.2+) |
| Password hashing | bcryptjs (cost factor 10) |
| Configuration | dotenv (`.env`, git-ignored) |

### Repository layout

```
microfinance-demo/
├── REPORT.md                  <- this document
├── README.md
├── firebase.json              <- Functions deployment config
├── .firebaserc                <- Firebase project alias
├── .gitignore                 <- excludes node_modules, .env, IDE files
├── backend/
│   ├── server.js              <- Express API (local / Render deployment)
│   ├── setup-db.js            <- creates `users` + `applications` tables
│   ├── create-admin.js        <- seeds the admin account
│   ├── .env.example           <- documented environment variables
│   └── package.json
├── functions/
│   ├── index.js               <- Cloud Functions API incl. /ping and /scan/sql
│   └── package.json           <- Node 24 engine
└── front end/
    ├── index.html      offers.html    apply.html      howitworks.html
    ├── about.html      testimonials.html  faq.html   404.html
    ├── register.html   forgot.html     admin.html
    ├── script.js       <- all form handlers + fetch calls
    ├── admin.js        <- admin panel logic
    ├── style.css       <- full stylesheet
    └── firebase.json   <- Firebase Hosting config
```

---

## 3. Application Functionalities

### 3.1 Public pages (unauthenticated)

| Page | Function |
|---|---|
| `index.html` | Landing page. Hero banner ("Fast and Safe Loans", up to $50,000), feature strip (loan from your gadget, quick payout, clear terms, automatic repayment), an embedded **login card**, and a contact footer (phone, email, address, working hours). |
| `offers.html` | Loan catalogue with five demo offers showing amount, interest rate and tenure: InCredit Bank ($5,000 · 12% · 8 days), FastCash ($10,000 · 10% · 4 days), Small Business Boost ($20,000 · 11% · 90 days), Student Loan ($500–$2,000 · 7% · 6 months), Senior Citizen Loan ($800–$3,500 · 9% · 12 months). Each "Apply Now" link deep-links into `apply.html` with the loan type and amount pre-loaded via query string. |
| `howitworks.html` | Five-step process explainer: Choose an Offer → Fill Your Details → Get Approval → Receive Money → Repay Easily. |
| `about.html` | Organisation profile with three value propositions: Fast Approval, Trusted Partners, Clear Terms. |
| `testimonials.html` | Four sample user testimonials (Akhil S., Meera R., Rahul K., Sneha P.). |
| `faq.html` | Five collapsible FAQ entries (`<details>`/`<summary>`) covering approval time, application fees, required documents, early repayment, and data safety. |
| `404.html` | Custom not-found page. |

### 3.2 Authentication

- **Register** (`register.html` → `POST /register`) — captures name, email and
  password. The password is bcrypt-hashed server-side before storage; a duplicate
  email is rejected.
- **Login** (`index.html` → `POST /login`) — email and password are verified
  against the `users` table with `bcrypt.compareSync`. The response returns
  `{ isAdmin, user: { id, name, email } }`. Admin accounts are redirected to
  `admin.html`; regular users remain on the public site.
- **Forgot password** (`forgot.html` → `POST /forgot-password`) — re-hashes a new
  password and updates the row, returning 404 when the email is unknown.
- **Session handling** — client-side via `sessionStorage` keys `loggedIn`,
  `userEmail` and `isAdmin`. The login card is hidden on return visits, and
  `admin.js` blocks the admin panel when `isAdmin !== "yes"`.

### 3.3 Loan application workflow

`apply.html` presents a five-field form: borrower name, loan type, loan amount
(numeric input), phone and address. Submitting issues `POST /apply`, which
validates that all fields are present, inserts the record into `applications`,
returns a confirmation and resets the form. Query-string pre-fill from the offers
page means a full browse → apply cycle exercises several real request paths.

### 3.4 Admin panel

`admin.html` and `admin.js` provide a read-only user directory. On load the script
verifies the admin session, then calls `GET /admin/users` with an `x-admin-email`
header. The server compares that header against a server-side allowlist and either
returns every user's `id`, `name` and `email` in an HTML table, or responds
`403 Admin only`. A logout button clears the session.

### 3.5 Security-scanning endpoints (`functions/index.js`)

These endpoints belong to the scanner harness deployed alongside the application:

| Endpoint | Function |
|---|---|
| `GET /ping` | Liveness probe confirming the Functions backend is reachable. |
| `POST /scan/sql` | Controlled SQL-injection probe. Validates the target URL against a **deployment-time allowlist** (`ALLOWED_HOSTS` in `functions/index.js`) and refuses everything else. Sends six classic payloads (`'`, `"`, `' OR '1'='1 -- `, `" OR "1"="1" -- `, `' UNION SELECT NULL -- `, `' AND SLEEP(2) -- `) appended as `id=<payload>`, then classifies each response by SQL-error signature match, HTTP 5xx status, or response time above 2500 ms. Returns a per-payload verdict table plus a remediation checklist. |

Because QuickLoan is itself the target, scanning the deployed hosting URL
exercises the real hosting path and the report shown to the user is live, not
mocked. The specific hostnames are configured at deploy time and are not committed.

### 3.6 Data model

```sql
users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,      -- bcrypt hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  borrower_name VARCHAR(255) NOT NULL,
  loan_type VARCHAR(100) NOT NULL,
  loan_amount DECIMAL(10,2) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## 4. How This Website Is Used for Testing Purposes

### 4.1 Role in the test setup

The vulnerability scanner web application accepts the deployed QuickLoan URL as a
target. Because the site is self-developed, self-hosted and populated only with
non-sensitive demo data, it serves as an authorised benchmark target. A separate
serverless deployment of the same code exposes `/scan/sql`, so the scanner and the
target share one codebase while remaining independently deployable.

### 4.2 SQL injection test path

1. Enter the deployed QuickLoan hosting URL (or the backend API host) into the
   scanner.
2. The scanner issues the allowlist-checked payload set over HTTP.
3. Each request travels the full production path: Firebase Hosting edge → static
   page → `fetch()` to the Render / Cloud Functions API → TiDB Cloud over TLS.4. Responses are measured and inspected for SQL error signatures, 5xx status, or
   time-based delay (`SLEEP(2)`), producing a per-payload finding table.
5. A **clean result is the expected outcome**, because all queries use
   parameterised placeholders (`?`) through the `mysql2` `query`/`execute` API. Any
   "SQL error text", "Server 5xx" or "Slow response" verdict is a genuine
   regression signal rather than a false positive.

Parameterised statements are applied consistently across `INSERT INTO users`,
`SELECT * FROM users WHERE email = ?`, `UPDATE users SET password=? WHERE email=?`
and `INSERT INTO applications`, which is what makes this a meaningful negative
control for the scanner.

### 4.3 DDoS / availability test path

The site's request surface is what the availability module exercises:

- multiple static pages, each served as a separate HTTP request;
- five REST endpoints accepting POST bodies (`/register`, `/login`,
  `/forgot-password`, `/apply`) plus GET endpoints (`/admin/users`, `/ping`, `/`);
- a database connection pool deliberately configured with
  `waitForConnections: true`, `connectionLimit: 10` and `queueLimit: 0`.

Under sustained load the pool is the observable bottleneck: once ten connections
are busy, additional requests queue and latency climbs. This gives the scanner a
clear, measurable signal to correlate request rate against response time, and lets
a rate-limiting or WAF recommendation be validated against actual behaviour.

### 4.4 Why a demo site rather than a real target

| Requirement | How QuickLoan satisfies it |
|---|---|
| Authorised testing | Self-developed, self-hosted, no third-party traffic involved. |
| Realistic attack surface | Static pages plus a REST API, auth flows and an SQL database. |
| Live, verifiable data | Real records in a real TiDB Cloud schema; results are not fixtures. |
| Repeatable | Deterministic endpoints and a stable schema for before/after comparison. |
| Safe to flood | Contains only synthetic demo records; no financial or personal data. |
| Remediation-verifiable | Hardening (parameterised queries, bcrypt, pool limits, CORS, allowlisting) can be changed and re-scanned to confirm improvement. |

---

## 5. Built-in Security Measures

These are the controls the scanner should confirm are present, and the baseline
against which any finding is judged:

- **Parameterised queries** on every database call — blocks classic SQL injection.
- **Password hashing** with bcrypt at cost factor 10 — no plaintext credentials.
- **Server-side admin allowlist** — `GET /admin/users` rejects any request whose
  `x-admin-email` header is not an approved admin address.
- **Target allowlist** in `/scan/sql` — the scanner cannot be aimed at arbitrary
  third-party hosts.
- **Connection pooling limits** — `connectionLimit: 10`, `waitForConnections: true`.
- **Mandatory TLS** to the database (`minVersion: TLSv1.2`).
- **Input presence validation** on all POST endpoints before any query executes.
- **CORS** configured on both the Express app and the Cloud Function.
- **Secrets externalised** to `.env` (git-ignored), with `.env.example` documenting
  every required variable.
- **Generic error responses** — raw database error messages are logged server-side
  but no longer returned to clients.

### Known weaknesses (intentional test targets)

These are documented rather than hidden, so scan output can be interpreted
correctly:

1. **Client-side-only session state** (`sessionStorage`) — trivially editable; a
   production build needs server-issued tokens.
2. **No rate limiting or CAPTCHA** on `/login` and `/register` — brute-force and
   resource-exhaustion exposure.
3. **Unauthenticated `/forgot-password`** permits direct password overwrite with
   no identity verification.
4. **`innerHTML` rendering** of user records in `admin.js` — stored-XSS surface.
5. **Hardcoded deployment endpoints** in `script.js` / `admin.js` — acceptable for a
   demo, configurable in a real deployment.

> Items 1–5 above are the *intended* test targets. Note that the credential
> issues previously present in early revisions (database credentials and a default
> admin password committed in source) have been removed: all secrets now come from
> git-ignored `.env` and `front end/config.js` files, documented by
> `.env.example` and `config.example.js`.
6. **CORS opened broadly** on the Express app — acceptable for a demo, restrictive
   origin list recommended in production.

---

## 6. Local Setup

```bash
git clone https://github.com/vijayvichu/microfinance-demo.git
cd microfinance-demo

# Backend
cd backend
npm install
cp .env.example .env        # then fill in your TiDB credentials
node setup-db.js            # create tables
node create-admin.js        # seed the admin account
npm start                   # http://localhost:5000

# Frontend (static)
cd "front end"
cp config.example.js config.js   # then set API_BASE to your backend URL
# serve the folder, e.g. npx serve .  or  python -m http.server 5500

# Cloud Functions (optional, for the scanner endpoints)
cd ../functions
npm install
firebase deploy --only functions
```

### Test accounts

| Role | Email | Password |
|---|---|---|
| Admin | value of `ADMIN_EMAIL` in `.env` | value of `ADMIN_PASSWORD`, set during `create-admin.js` |
| User | any registered email | set at registration |

No credentials are stored in this repository. The admin account is seeded from
environment variables only.

---

## 7. Conclusion

QuickLoan delivers a complete, realistic microfinance user journey — browsing
offers, registering, logging in, resetting a password, submitting a loan
application and administering users — on a three-tier architecture (Firebase
Hosting frontend, Express / Cloud Functions API, TiDB Cloud database). That
realism is precisely its value as a benchmark: it exposes genuine request paths,
genuine SQL statements and a genuine connection pool, so a vulnerability scanner
pointed at the live URL produces findings grounded in real server behaviour.

Its hardened defaults — parameterised queries, bcrypt hashing, admin allowlisting,
TLS, pool limits, externalised secrets — make it a reliable negative control,
while the documented weaknesses above provide known positives to confirm
detection.

---

## 8. Ethical and Legal Notice

This project is intended **solely for authorised security testing, academic
research and educational use**. Only scan systems you own or have explicit written
permission to test. Running load or flood tests against third-party or production
infrastructure without authorisation is illegal under computer misuse and similar
legislation. Findings should be disclosed responsibly and remediated rather than
exploited.
