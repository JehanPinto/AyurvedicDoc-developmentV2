# Security Fix Implementation Guide

## ✅ COMPLETED FIXES

### 1. ✅ Removed Hardcoded JWT Fallback
**File:** `server/routes.ts` (Lines 1-30)  
**What was fixed:** 
- Removed `"ayurvedic-doctor-secret-key-2024"` fallback
- Now throws error if `SESSION_SECRET` env var is not set
- **CRITICAL:** You MUST set `SESSION_SECRET` in your `.env` file

**Required Action:**
```bash
# Generate a secure random 64-character secret
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | % { [char](33..126 | Get-Random) } | join '')))
```

Then add to `.env`:
```
SESSION_SECRET="your_generated_64_char_secret_here"
```

---

### 2. ✅ Added Enhanced File Upload Validation
**File:** `server/routes.ts` (Lines 53-71)  
**What was fixed:**
- File name length validation (max 255 chars)
- Path traversal attack prevention (blocks `..`, `/`, `\` in filenames)
- Strict file type validation (MIME type + extension)
- File size limit already enforced (5MB)

**Protected against:** DoS, path traversal, malicious file uploads

---

### 3. ✅ Added Password Strength Requirements
**File:** `server/routes.ts` (Lines 14-38)  
**What was fixed:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Applied to:**
- `/api/auth/register` (patient registration)
- `/api/auth/register-doctor` (doctor registration)

---

### 4. ✅ Created `.env.example` Template
**File:** `.env.example`  
**What was added:**
- Secret configuration template for developers
- All required environment variables documented
- Comments explaining each setting
- Safe to commit to repository (contains no real secrets)

**For new developers:**
```bash
cp .env.example .env
# Then edit .env with actual values
```

---

### 5. ✅ Updated `.gitignore`
**File:** `.gitignore`  
**Added Protection For:**
- `.env` - Never commit your secrets!
- `.env.local`, `.env.*.local` - Environment-specific secrets
- `uploads/` - Prevent uploading file artifacts
- IDE files (`.vscode`, `.idea`) - Development-specific
- Build artifacts and logs

---

## 🔴 IMMEDIATE ACTIONS REQUIRED

### Action 1: Rotate All Exposed Secrets
**⚠️ CRITICAL - Do this NOW:**

The following secrets are exposed in your `.env` file (checked into git):
- Google OAuth Client Secret (line 13)
- JWT Session Secret (line 15)  
- Database Password (lines 16, 21)

**Steps:**

1. **Rotate Google OAuth Secret:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to Credentials
   - Delete old Client Secret
   - Generate new Client Secret
   - Update `.env` with new value

2. **Rotate Database Password:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres -d med_chanelling
   
   # Change password
   ALTER USER postgres WITH PASSWORD 'new_secure_password_123!Abc';
   ```
   Update in `.env`:
   ```
   DATABASE_URL="postgresql://postgres:new_secure_password_123!Abc@localhost:5432/med_chanelling"
   PGPASSWORD="new_secure_password_123!Abc"
   ```

3. **Generate New JWT Secret:**
   ```bash
   # Generate new secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add to `.env`:
   ```
   SESSION_SECRET="generated_hex_string_here"
   ```

4. **Update Apple Credentials (if applicable):**
   - Regenerate Apple Private Key from Apple Developer account
   - Update `.env` with new values

---

### Action 2: Test the Application
```bash
# Install dependencies
npm install

# Run tests
npm test

# Start server (should NOT crash on startup now)
npm run dev
```

---

## 🟠 PHASE 1: URGENT DEPENDENCY UPGRADES (High Severity)

These should be done IMMEDIATELY as they fix critical vulnerabilities:

### Step 1: Upgrade Drizzle ORM (SQL Injection Fix)
```bash
npm update drizzle-orm
# From: 0.39.1 → To: ≥0.45.2
```
**Why:** Fixes SQL injection vulnerability (CVSS 7.5)

### Step 2: Upgrade Multer (DoS Fix)
```bash
npm update multer
# From: 2.0.2 → To: ≥2.1.1
```
**Why:** Fixes 3 separate DoS vulnerabilities

### Step 3: Upgrade Passport Apple Dependency Chain
```bash
npm update passport-apple
# From: indirect → To: 2.0.2+
```
**Why:** Updates jsonwebtoken to fix JWT vulnerabilities

### Step 4: Run Audit to Verify
```bash
npm audit
```
**Expected Result:** Should show fewer vulnerabilities

---

## 🟡 PHASE 2: HIGH PRIORITY UPGRADES (High Severity)

Complete these within 1 week:

```bash
# Upgrade Express ecosystem
npm update express
npm update express-session

# Upgrade Build Tools
npm update vite
npm update glob

# Upgrade utilities
npm update lodash
npm update minimatch
npm update path-to-regexp
npm update picomatch
npm update rollup
npm update yaml
npm update brace-expansion
npm update qs
```

### Verification Commands
```bash
# Check for breaking changes
npm audit --json | jq '.vulnerabilities[] | select(.severity=="high")'

# Run full audit
npm audit

# Run tests
npm run test

# Start dev server
npm run dev
```

---

## 🟢 PHASE 3: MODERATE PRIORITY (Can be done in 2 weeks)

```bash
# Update remaining moderate-severity packages
npm update @esbuild-kit/core-utils
npm update esbuild
npm update body-parser
npm update on-headers
```

---

## 📋 VERIFICATION CHECKLIST

After making changes, verify:

- [ ] `SESSION_SECRET` is set in `.env` and NOT hardcoded
- [ ] `.env` file is in `.gitignore` (not committed)
- [ ] `.env.example` exists with template (no real secrets)
- [ ] Application starts without errors: `npm run dev`
- [ ] Registration endpoints enforce password strength: Try with weak password
- [ ] File upload validates file types: Try uploading `.exe` file
- [ ] Rate limiting works: Make 6 login attempts in 15 minutes
- [ ] `npm audit` shows significantly fewer vulnerabilities
- [ ] All tests pass: `npm test`

---

## 🔒 SECURITY HEADERS SETUP (Optional but Recommended)

To further secure your application, install helmet:

```bash
npm install helmet
```

Then in `server/index.ts`:
```typescript
import helmet from "helmet";

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}));
```

---

## 📞 NEXT STEPS

1. **Immediate (Today):**
   - [ ] Rotate all exposed secrets
   - [ ] Update `.env` with new values
   - [ ] Verify application starts
   - [ ] Test password validation

2. **Urgent (This Week):**
   - [ ] Complete Phase 1 upgrades
   - [ ] Run full test suite
   - [ ] Deploy to staging

3. **This Sprint:**
   - [ ] Complete Phase 2 upgrades
   - [ ] Code review security changes
   - [ ] Deploy to production

4. **Future Improvements:**
   - [ ] Set up Dependabot for automated updates
   - [ ] Configure CI/CD to run `npm audit` on each PR
   - [ ] Add security testing to pipeline
   - [ ] Implement regular security audits

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm audit documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

