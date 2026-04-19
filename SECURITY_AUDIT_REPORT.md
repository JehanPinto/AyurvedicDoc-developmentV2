# Security Audit Report - Ayurvedic Doctor Platform
**Date:** April 17, 2026  
**Severity Summary:** 10 High | 9 Moderate | 3 Low | Total: 22 vulnerabilities

---

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. **Hardcoded JWT Secret Fallback** [HIGH]
**Location:** `server/routes.ts` line 200  
**Issue:** If `SESSION_SECRET` env var is missing, the app falls back to a known hardcoded value:
```typescript
const JWT_SECRET = process.env.SESSION_SECRET || "ayurvedic-doctor-secret-key-2024";
```
**Risk:** Attackers can forge valid JWTs if environment variable is not set  
**Fix:** Remove the fallback, require the env var to be set

---

### 2. **Exposed Credentials in .env** [CRITICAL]
**Location:** `.env` file (checked into repository)  
**Exposed Secrets:**
- `GOOGLE_CLIENT_SECRET` (line 13) - OAuth credentials visible
- `SESSION_SECRET` (line 15) - JWT signing key exposed
- `DATABASE_URL` (line 16) - DB credentials with password visible
- `PGPASSWORD` (line 21) - Postgres password exposed

**Risk:** If `.env` is committed to git, all credentials are compromised  
**Status:** ⚠️ **ACTION REQUIRED:** Rotate all exposed secrets immediately

**Fix:**
1. Add `.env` to `.gitignore` if not already there
2. Revoke and rotate all exposed credentials
3. Use `.env.example` template instead

---

## 🟠 HIGH SEVERITY DEPENDENCIES (10 findings)

| Package | Issue | Current | Fix |
|---------|-------|---------|-----|
| **drizzle-orm** | SQL injection via unescaped identifiers | 0.39.1 | Upgrade to ≥0.45.2 |
| **express** | Multiple vulnerabilities (qs, path-to-regexp) | 4.21.2 | Upgrade to latest |
| **multer** | DoS via incomplete cleanup & resource exhaustion | 2.0.2 | Upgrade to ≥2.1.1 |
| **glob** | CLI command injection via -c flag | 10.4.5 | Upgrade to ≥10.5.0 |
| **jsonwebtoken** | Unrestricted key type, forgeable tokens | indirect | Upgrade passport-apple to ≥2.0.2 |
| **lodash** | Code injection via template, prototype pollution | indirect | Upgrade to ≥4.17.24 |
| **minimatch** | Multiple ReDoS vulnerabilities | 9.0.6 | Upgrade to ≥9.0.7 |
| **path-to-regexp** | ReDoS via multiple route parameters | indirect | Upgrade express |
| **picomatch** | ReDoS via extglob quantifiers | ≤2.3.1 | Upgrade to ≥2.3.2 |
| **rollup** | Arbitrary file write via path traversal | 4.58.0 | Upgrade to ≥4.59.0 |

---

## 🟡 MODERATE SEVERITY DEPENDENCIES (9 findings)

| Package | Issue | Fix |
|---------|-------|-----|
| **vite** | Path traversal in .map handling & fs.deny bypass | Upgrade to latest (>6.4.1) |
| **drizzle-kit** | esbuild vulnerability chain | Upgrade to ≥0.18.1 |
| **esbuild** | CORS bypass on dev server | Upgrade transitive deps |
| **brace-expansion** | ReDoS & process hang | Upgrade to ≥2.0.3 |
| **qs** | ArrayLimit bypass DoS | Upgrade to >6.14.1 |
| **yaml** | Stack overflow on deep nesting | Upgrade to ≥2.8.3 |
| **express-session** | HTTP header manipulation (on-headers) | Upgrade to latest |
| **passport-apple** | Inherits jsonwebtoken issues | Upgrade to ≥2.0.2 |
| **@esbuild-kit/*** | Transitive vulnerability chain | Update drizzle-kit |

---

## 🟡 CODE-LEVEL SECURITY ISSUES

### 3. **No HTTPS/TLS Enforcement** [MODERATE]
**Location:** `server/index.ts`  
**Issue:** No HSTS headers, missing security headers  
**Fix:** Add security middleware (helmet)

### 4. **Missing Input Validation on File Uploads** [MODERATE]
**Location:** `server/routes.ts` upload endpoint (line 746)  
**Issue:** File upload size limits exist but no other validation  
**Risk:** Could be exploited for DoS  
**Fix:** Add stricter validation

### 5. **No SQL Injection Protection for Dynamic Queries** [HIGH]
**Location:** `server/db-storage.ts`  
**Issue:** If any queries use string concatenation with user input  
**Fix:** Ensure all queries use parameterized statements (Drizzle does this, but verify usage)

### 6. **Weak Password Validation** [MODERATE]
**Location:** `server/routes.ts` registration endpoints  
**Issue:** No password strength requirements enforced  
**Fix:** Add password complexity validation

### 7. **No Rate Limiting on Public Endpoints** [MODERATE]
**Location:** Various API routes  
**Issue:** Public endpoints like `/api/doctors` have no rate limiting  
**Fix:** Already fixed with recent update - verify other endpoints

### 8. **Insufficient CORS Configuration** [MODERATE]
**Location:** `server/index.ts`  
**Issue:** CORS not explicitly configured  
**Fix:** Set restrictive CORS policy

---

## 🟢 LOW SEVERITY ISSUES (3 findings)

| Package | Issue | Fix |
|---------|-------|-----|
| **body-parser** | qs vulnerability | Upgrade express |
| **on-headers** | Response header manipulation | Upgrade express-session to latest |
| **connect-pg-simple** | Session store vulnerabilities | Upgrade to latest |

---

## 📋 CONFIGURATION ISSUES

### Missing `.env.example`
Create template without secrets for developers to copy

### No `.gitignore` Entry for Secrets
Ensure `.env`, `.env.local`, `.env.*.local` are ignored

### No Environment Validation
Should validate all required env vars on startup

---

## ✅ RECOMMENDED FIX PRIORITY

### Phase 1 (Immediate - Before deployment)
1. ✅ Rotate all exposed credentials (already noted as critical)
2. ⚠️ Remove hardcoded JWT fallback
3. ⚠️ Upgrade drizzle-orm to ≥0.45.2 (SQL injection fix)
4. ⚠️ Upgrade multer to ≥2.1.1 (DoS fix)
5. ⚠️ Upgrade jsonwebtoken → passport-apple to ≥2.0.2

### Phase 2 (Next sprint)
1. Upgrade all remaining direct dependencies
2. Add security headers middleware (helmet)
3. Implement password strength validation
4. Add HTTPS/TLS enforcement
5. Configure restrictive CORS

### Phase 3 (Ongoing)
1. Set up automated dependency scanning (Dependabot)
2. Run `npm audit` in CI/CD pipeline
3. Regular security testing
4. Code review checklist for security

---

## 🔧 QUICK FIX COMMAND

```bash
# Update direct vulnerabilities
npm update drizzle-orm @latest
npm update multer @latest
npm update passport-apple @latest
npm update express @latest
npm update vite @latest

# Run audit again
npm audit
```

---

## 📊 Before/After Metrics
- **Before:** 22 vulnerabilities (10 high, 9 moderate, 3 low)
- **After (Phase 1):** ~8 vulnerabilities (mostly transitive)
- **After (Phase 2):** ≤2 vulnerabilities (with accepted risk)

# Database Configuration
# Replace with your PostgreSQL connection string
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ayurvedicdoctor

# Server Configuration
# PORT=5000

# Session Secret
# SESSION_SECRET=ayurvedic-doctor-secret-key-2024-change-in-production

# Google OAuth (Optional)
 GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
 GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

SESSION_SECRET="YOUR_SESSION_SECRET_HERE"
DATABASE_URL="postgresql://username:password@host/database"

