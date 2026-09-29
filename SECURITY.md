# Security Policy


## Supported Versions

| Version | Supported |
| ------- | --------- |
| `main`   | Yes       |
| < older >| No        |

Only the current `main` branch receives security fixes.

## Reporting a Vulnerability

**Do not open a public GitHub Issue for security problems.**

Report vulnerabilities privately through GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
feature on this repository:

1. Go to **Security** → **Advisories** → **Report a vulnerability**
2. Fill in the affected endpoint, reproduction steps and impact
3. Submit — you will receive an acknowledgement

If private reporting is unavailable, email **YOUR_EMAIL** with the subject
`[SECURITY] QuickLoan vulnerability report`.

Please do **not** include exploit code that could affect other systems, and do not
test against any deployment you do not own.

### What to include

- Type of issue (e.g. injection, auth bypass, XSS, exposed secret)
- Affected file, endpoint or URL
- Steps to reproduce
- Impact assessment
- Any suggested remediation

### What not to include

- Third-party credentials, unrelated vulnerability scans, or automated tool output
- Denial-of-service or load-test results against production endpoints
- Any real personal data

### Response timeline

| Stage | Target |
| ----- | ------ |
| Acknowledgement | Within 3 business days |
| Initial assessment | Within 7 business days |
| Remediation plan | Within 14 business days |
| Fix released | Prioritised by severity |

Please give a reasonable amount of time for a fix before public disclosure.
We will credit you in the advisory unless you prefer to stay anonymous.

## Scope

### In scope

- The application source in this repository
- The deployed QuickLoan demo instance
- Vulnerabilities in the API implemented in `backend/` and `functions/`
- Secrets accidentally committed to this repository

### Out of scope

- Firebase Hosting, TiDB Cloud, Render or other third-party infrastructure —
  report these directly to the provider
- Missing headers on a purely static demo site with no sensitive content
- Denial-of-service attacks and volumetric testing against any deployment
- Social engineering, phishing and physical attacks
- Reports generated solely by automated scanners with no demonstrated impact
- Findings that require already having admin or database access

## Responsible Disclosure

This is a demonstration project. We handle reports in good faith and will credit
researchers. Please avoid accessing, modifying or deleting data that is not
yours, avoid privacy violations, and give us reasonable time to release a fix
before disclosure.

## Security Considerations for This Project

This repository is a **deliberately vulnerable demonstration application**
maintained as a target for web vulnerability scanners. Findings against it are
expected and are not treated as undisclosed vulnerabilities unless they exceed
what is documented in [REPORT.md](REPORT.md).

### Controls currently in place

- Parameterised queries on all database access (SQL injection mitigation)
- bcrypt password hashing at cost factor 10
- Server-side admin allowlist on `/admin/users`
- Target host allowlist on `/scan/sql` (`SCAN_ALLOWED_HOSTS`)
- TLS 1.2 minimum for all database connections
- Connection pooling limits (`connectionLimit: 10`)
- Secrets supplied only through environment variables, never committed
- Input presence validation on all POST endpoints
- Generic error responses — raw database errors are logged, not returned

### Known weaknesses — documented, not undisclosed

These are intentional test targets described in [REPORT.md](REPORT.md):

1. Client-side-only session state via `sessionStorage`
2. No rate limiting or CAPTCHA on `/login` and `/register`
3. `/forgot-password` allows direct password overwrite without identity verification
4. `innerHTML` rendering of user records in `admin.js` (stored XSS surface)
5. Broadly open CORS on the Express app for demo purposes

### Responsible use

This project is intended **solely for authorised security testing, academic
research and education**. Only scan systems you own or have explicit written
permission to test. Running load or flood tests against third-party or production
infrastructure without authorisation may be unlawful. Findings should be
disclosed responsibly and remediated rather than exploited.

## Secrets

**Never commit credentials.** All secrets are supplied at runtime through
environment variables. If you discover a committed secret:

1. Report it privately using the method above
2. Rotate the credential immediately — removal from the latest commit is not enough
   if it exists in history or forks
3. Do not open a pull request that reveals it

Template files `backend/.env.example` and `front end/config.example.js` document
the required variables. `.env`, `config.js` and `.firebaserc` are git-ignored.
