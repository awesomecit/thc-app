# Secrets Management - Tech Citizen Gateway

> **Extracted**: 2025-12-13  
> **Status**: Reference for v2 implementation  
> **Location**: Preserved from v1 custom implementation

---

## Overview

Gestione centralizzata di chiavi crittografiche, secrets, API keys e credenziali per development,
test, production environments.

**Principi**:

- ✅ **Never commit secrets to Git** (pre-commit hook enforcement)
- ✅ **Different keys per environment** (dev/test/staging/prod)
- ✅ **Generate cryptographically strong keys** (crypto.randomBytes)
- ✅ **Key rotation policy** (every 90 days for production)
- ✅ **Minimal privilege** (separate keys for different services)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECRETS LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  GENERATION  │───▶│   STORAGE    │───▶│    USAGE     │
└──────────────┘    └──────────────┘    └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
  scripts/           .keys/           Environment Variables
  generate-keys.js   (gitignored)      (.env files)

                           │
                           ▼
                    ┌─────────────┐
                    │  SCANNING   │
                    └─────────────┘
                           │
                           ▼
                    scripts/
                    check-secrets.cjs
                    (.husky/pre-commit)
```

---

## Components

### 1. Key Generation (`scripts/generate-keys.js`)

**Capabilities**:

- RSA key pairs (2048/4096 bit) for JWT signing
- JWT secrets (HMAC-SHA256, 64 bytes)
- API keys (service-to-service auth)
- Session secrets (cookie signing, 64 bytes)
- Keycloak client secrets (UUID format)

**Usage**:

```bash
# Interactive mode
npm run keys:generate

# Specific key types
npm run keys:rsa           # RSA 2048-bit (dev)
npm run keys:rsa:prod      # RSA 4096-bit (prod)
npm run keys:jwt           # JWT secret (HMAC)
npm run keys:api           # API key
npm run keys:session       # Session secret
npm run keys:keycloak      # Keycloak client secret

# Generate all keys
npm run keys:all           # Development
npm run keys:all:prod      # Production (stronger keys)
```

#### Pseudo-code: RSA Key Generation

```javascript
FUNCTION generateRSAKeyPair(bits, environment):
  // 1. Generate key pair
  keypair = crypto.generateKeyPairSync('rsa', {
    modulusLength: bits,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })

  // 2. Create filename with metadata
  timestamp = currentDate()
  basename = "rsa-{bits}-{environment}-{timestamp}"

  // 3. Save to filesystem (gitignored directory)
  CREATE_DIRECTORY(".keys/")
  WRITE_FILE(".keys/{basename}.key", keypair.privateKey, mode=0o600)  // Owner read-only
  WRITE_FILE(".keys/{basename}.pub", keypair.publicKey, mode=0o644)   // World readable

  // 4. Output for .env configuration
  PRINT("JWT_PRIVATE_KEY_PATH=.keys/{basename}.key")
  PRINT("JWT_PUBLIC_KEY_PATH=.keys/{basename}.pub")

  // 5. Output base64-encoded (alternative for env vars)
  privKeyBase64 = BASE64_ENCODE(keypair.privateKey)
  pubKeyBase64 = BASE64_ENCODE(keypair.publicKey)
  PRINT("JWT_PRIVATE_KEY=\"{privKeyBase64}\"")
  PRINT("JWT_PUBLIC_KEY=\"{pubKeyBase64}\"")

  RETURN keypair
END FUNCTION
```

#### Pseudo-code: JWT Secret Generation

```javascript
FUNCTION generateJWTSecret(bytes):
  // 1. Generate cryptographically secure random bytes
  randomBytes = crypto.randomBytes(bytes)  // Default: 64 bytes

  // 2. Encode as base64url (URL-safe, no padding)
  secret = BASE64URL_ENCODE(randomBytes)

  // 3. Save to file (backup)
  timestamp = UNIX_TIMESTAMP()
  filename = "jwt-secret-{environment}-{timestamp}.txt"
  WRITE_FILE(".keys/{filename}", secret, mode=0o600)

  // 4. Output for .env
  PRINT("JWT_SECRET=\"{secret}\"")

  RETURN secret
END FUNCTION
```

#### Pseudo-code: API Key Generation

```javascript
FUNCTION generateAPIKey(prefix, environment):
  // Format: sk_prod_abc123...

  // 1. Generate random string
  randomBytes = crypto.randomBytes(32)
  randomString = BASE64URL_ENCODE(randomBytes)

  // 2. Construct prefixed key
  apiKey = "{prefix}_{environment}_{randomString}"
  // Example: sk_prod_K7mP3nQwR8vX2yZ5A...

  // 3. Save to file
  timestamp = UNIX_TIMESTAMP()
  filename = "api-key-{environment}-{timestamp}.txt"
  WRITE_FILE(".keys/{filename}", apiKey, mode=0o600)

  // 4. Output for .env
  PRINT("API_KEY=\"{apiKey}\"")

  RETURN apiKey
END FUNCTION
```

---

### 2. Secret Scanning (`scripts/check-secrets.cjs`)

Pre-commit hook che previene accidentale commit di secrets.

**Detection Patterns**:

- API keys (AWS, GitHub, Stripe, GitLab)
- Private keys (RSA, DSA, EC, PGP)
- JWT tokens
- Database URLs with credentials
- Hardcoded passwords/secrets/tokens

**Configuration Files**:

- `.secretsignore` - File patterns da escludere (node_modules, docs, etc.)
- `.secretsafe` - Valori safe/test conosciuti (placeholder values)

#### Flow Diagram: Secret Scanning

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRE-COMMIT HOOK                             │
└─────────────────────────────────────────────────────────────────┘

    git commit
         │
         ▼
    ┌──────────────┐
    │ .husky/      │
    │ pre-commit   │
    └──────────────┘
         │
         ▼
    ┌────────────────────────────────────────────┐
    │ node scripts/check-secrets.cjs             │
    └────────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────────┐
    │ Load Configuration                          │
    │ - .secretsignore (exclude patterns)         │
    │ - .secretsafe (safe values whitelist)       │
    └─────────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────────┐
    │ Get Staged Files (git diff --cached)        │
    └─────────────────────────────────────────────┘
         │
         ▼
    FOR EACH file IN stagedFiles:
         │
         ├─────▶ Is file ignored? (.secretsignore)
         │       │
         │       ├─ YES ──▶ SKIP
         │       │
         │       └─ NO ───▶ Scan file content
         │                        │
         │                        ▼
         │              Apply SECRET_PATTERNS regex
         │                        │
         │                        ├─ Match found?
         │                        │
         │                        ├─ Is safe value? (.secretsafe)
         │                        │       │
         │                        │       ├─ YES ──▶ SKIP
         │                        │       │
         │                        │       └─ NO ───▶ RECORD FINDING
         │                        │
         ▼                        ▼
    ┌─────────────────────────────────────────────┐
    │ Findings collected                          │
    └─────────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────────┐
    │ Any secrets detected?                       │
    └─────────────────────────────────────────────┘
         │
         ├─ YES ──▶ ❌ BLOCK COMMIT
         │          │
         │          └─ Print findings report:
         │             - File path
         │             - Line number
         │             - Severity (critical/high/medium)
         │             - Secret type
         │             - Snippet
         │
         └─ NO ───▶ ✅ ALLOW COMMIT
```

#### Pseudo-code: Secret Scanner

```javascript
FUNCTION scanForSecrets(stagedFiles):
  // 1. Load configuration
  ignoredPatterns = LOAD_LINES(".secretsignore")
  safeValues = LOAD_LINES(".secretsafe")

  // 2. Define detection patterns
  patterns = [
    { regex: /AKIA[0-9A-Z]{16}/, name: "AWS Access Key", severity: "critical" },
    { regex: /ghp_[a-zA-Z0-9]{36}/, name: "GitHub Token", severity: "critical" },
    { regex: /-----BEGIN (RSA|DSA|EC) PRIVATE KEY-----/, name: "Private Key", severity: "critical" },
    { regex: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, name: "JWT Token", severity: "medium" },
    // ... more patterns
  ]

  findings = []

  // 3. Scan each staged file
  FOR EACH file IN stagedFiles:
    // Skip ignored files
    IF file MATCHES ANY ignoredPatterns:
      CONTINUE

    // Read file content
    content = READ_FILE(file)
    lines = SPLIT(content, "\n")

    // Scan each line
    FOR lineNumber, line IN ENUMERATE(lines):
      FOR EACH pattern IN patterns:
        matches = REGEX_MATCH(line, pattern.regex)

        IF matches:
          matchedValue = matches[0]

          // Check if it's a safe/test value
          IF matchedValue IN safeValues:
            CONTINUE

          // Check if it's a comment explaining the pattern
          IF line STARTS_WITH "//", "#":
            CONTINUE

          // Record finding
          findings.APPEND({
            file: file,
            line: lineNumber + 1,
            severity: pattern.severity,
            type: pattern.name,
            snippet: TRUNCATE(line, 80)
          })

  // 4. Report findings
  IF findings.LENGTH > 0:
    PRINT_ERROR("🚨 Secrets detected in staged files!")
    PRINT_ERROR("\n")

    FOR EACH finding IN findings:
      PRINT_ERROR("❌ [{finding.severity}] {finding.type}")
      PRINT_ERROR("   File: {finding.file}:{finding.line}")
      PRINT_ERROR("   Snippet: {finding.snippet}")
      PRINT_ERROR("\n")

    PRINT_ERROR("🛡️  Remove secrets before committing!")
    PRINT_ERROR("   Tip: Add safe values to .secretsafe")
    EXIT(1)  // Block commit
  ELSE:
    PRINT_SUCCESS("✅ No secrets detected")
    EXIT(0)  // Allow commit
END FUNCTION
```

---

### 3. Environment Configuration

**File Structure**:

```
.env.example          # Template (committed to git)
.env                  # Development (gitignored)
.env.test             # Test environment (gitignored)
.env.production       # Production (gitignored, deployed via Ansible)
.keys/                # Generated keys (gitignored)
  ├── rsa-2048-development-2025-12-13.key
  ├── rsa-2048-development-2025-12-13.pub
  ├── jwt-secret-development-1734103200.txt
  ├── api-key-development-1734103200.txt
  └── ...
```

#### Example `.env` Configuration

```bash
# Platformatic Runtime
PORT=3042
PLT_SERVER_HOSTNAME=0.0.0.0
LOG_LEVEL=info
NODE_ENV=development

# JWT Configuration (RSA keys)
JWT_PRIVATE_KEY_PATH=.keys/rsa-2048-development-2025-12-13.key
JWT_PUBLIC_KEY_PATH=.keys/rsa-2048-development-2025-12-13.pub
JWT_ALGORITHM=RS256
JWT_EXPIRY=1h

# OR inline (base64-encoded)
# JWT_PRIVATE_KEY="LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUVWZ..."
# JWT_PUBLIC_KEY="LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2..."

# Session Secret (cookie signing)
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# API Key (service-to-service auth)
API_KEY=sk_dev_K7mP3nQwR8vX2yZ5AbCdEfGhIjKlMnOpQrStUvWxYz

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8090
KEYCLOAK_REALM=healthcare-domain
KEYCLOAK_CLIENT_ID=gateway-client
KEYCLOAK_CLIENT_SECRET=12345678-1234-1234-1234-123456789abc

# Redis Configuration
REDIS_URL=redis://localhost:6380
REDIS_PASSWORD=dev-redis-password
```

---

## Security Best Practices

### 1. Generation

```bash
# Development keys (weaker, faster)
npm run keys:all

# Production keys (stronger, slower)
npm run keys:all:prod
```

**Key Strength**:

- **Development**: RSA-2048, 64-byte secrets (balance speed/security)
- **Production**: RSA-4096, 64-byte secrets (maximum security)

### 2. Storage

```
✅ DO:
- Store in .keys/ directory (gitignored)
- Set file permissions: 0o600 (owner read-only)
- Use environment-specific subdirectories (.keys/production/)
- Backup production keys in encrypted vault (Ansible Vault, 1Password, etc.)

❌ DON'T:
- Commit to git (pre-commit hook prevents this)
- Store in shared network drives
- Email or Slack secrets
- Hardcode in source code
```

### 3. Rotation

**Schedule**:

- **Production**: Every 90 days (quarterly)
- **Staging**: Every 180 days
- **Development**: On demand (after security incident)

**Process**:

1. Generate new keys: `npm run keys:all:prod`
2. Update production .env via Ansible
3. Deploy new keys (zero-downtime: both old+new valid for 24h)
4. Verify all services using new keys
5. Revoke old keys
6. Archive old keys (encrypted backup, 1 year retention)

### 4. Access Control

**Principle of Least Privilege**:

- Each service has own API key (not shared)
- Database credentials per service (not root user)
- Separate keys for external APIs (Stripe, AWS, etc.)

**Audit Trail**:

- Log all key generation events (who, when, environment)
- Monitor unauthorized access attempts
- Alert on key usage anomalies

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Secrets from GitHub Secrets (Settings > Secrets)
      - name: Configure environment
        run: |
          echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
          echo "API_KEY=${{ secrets.API_KEY }}" >> .env
          echo "REDIS_PASSWORD=${{ secrets.REDIS_PASSWORD }}" >> .env

      - name: Run tests
        run: npm test
```

### Ansible Production Deployment

```yaml
# ansible/playbooks/deploy-secrets.yml
- name: Deploy production secrets
  hosts: production
  vars_files:
    - ../secrets.env # Ansible Vault encrypted
  tasks:
    - name: Copy .env file
      template:
        src: templates/.env.production.j2
        dest: /opt/gateway/.env
        owner: gateway
        group: gateway
        mode: '0600'
      no_log: true # Don't log secrets
```

```bash
# Encrypt secrets file
ansible-vault encrypt ansible/secrets.env

# Deploy (prompts for vault password)
ansible-playbook ansible/playbooks/deploy-secrets.yml --ask-vault-pass
```

---

## Troubleshooting

### Common Issues

#### 1. Pre-commit hook blocks legitimate code

**Symptom**: False positive (UUID, test value detected as secret)

**Solution**: Add to `.secretsafe`:

```bash
echo "12345678-1234-1234-1234-123456789abc" >> .secretsafe
git commit  # Retry
```

#### 2. Key file permissions error

**Symptom**: `EACCES: permission denied` when reading private key

**Solution**:

```bash
chmod 600 .keys/*.key  # Owner read-only
chmod 644 .keys/*.pub  # World readable (public keys)
```

#### 3. JWT verification fails

**Symptom**: `invalid signature` error

**Solution**: Verify public/private key match:

```bash
# Extract public key from private key
openssl rsa -in .keys/rsa-2048-dev.key -pubout -out test.pub

# Compare with saved public key
diff test.pub .keys/rsa-2048-dev.pub
```

#### 4. Keycloak client secret mismatch

**Symptom**: `invalid_client` error

**Solution**: Ensure `.env` matches Keycloak Admin Console:

1. Go to Keycloak Admin Console
2. Realm > Clients > gateway-client > Credentials tab
3. Copy `Client Secret`
4. Update `.env`: `KEYCLOAK_CLIENT_SECRET=<copied-value>`

---

## Migration Guide (v1 → v2)

### What Changes in v2 (Platformatic-first)

**v1 (Custom)**:

- Custom JWT middleware with manual key loading
- Manual session secret configuration
- Custom API key validation

**v2 (Platformatic)**:

- Use `@platformatic/node` or Platformatic Composer for JWT handling
- Leverage Platformatic's built-in auth plugins
- Minimal custom code (configuration over code)

**Secrets remain the same**:

- Same generation scripts (`generate-keys.js`)
- Same scanning (`check-secrets.cjs`)
- Same `.env` structure
- **Only integration code changes** (use Platformatic APIs)

---

## References

### Internal Documentation

- `.secretsignore` - File exclusion patterns
- `.secretsafe` - Safe value whitelist
- `scripts/generate-keys.js` - Key generation implementation
- `scripts/check-secrets.cjs` - Secret scanner implementation
- `.husky/pre-commit` - Git hook integration

### External Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Ansible Vault](https://docs.ansible.com/ansible/latest/vault_guide/index.html)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**Last Updated**: 2025-12-13  
**Status**: ✅ Production-ready (extracted from v1)  
**Maintainer**: Antonio Cittadino
