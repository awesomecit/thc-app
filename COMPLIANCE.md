# Compliance & Legal

## 📋 Overview

This project adheres to industry standards for security, privacy, licensing, and code quality.

## 🔐 Security Compliance

### OWASP Top 10 (2021)

We actively mitigate risks from the [OWASP Top 10](https://owasp.org/Top10/):

| Risk                                 | Mitigation                                                     | Status                              |
| ------------------------------------ | -------------------------------------------------------------- | ----------------------------------- |
| **A01: Broken Access Control**       | Role-based access control (RBAC) with Keycloak, JWT validation | ✅ Implemented                      |
| **A02: Cryptographic Failures**      | TLS 1.2+, strong key generation (RSA-4096, 64-byte secrets)    | ✅ Implemented                      |
| **A03: Injection**                   | Parameterized queries via Platformatic DB, input validation    | ✅ Implemented                      |
| **A04: Insecure Design**             | Hexagonal architecture, threat modeling, security by design    | ✅ Implemented                      |
| **A05: Security Misconfiguration**   | Secure defaults, automated secret scanning, dependency audits  | ✅ Implemented                      |
| **A06: Vulnerable Components**       | npm audit, Dependabot, 90-day update policy                    | ✅ Implemented                      |
| **A07: Authentication Failures**     | Session management with Redis, secure cookies, JWT expiry      | ✅ Implemented                      |
| **A08: Software/Data Integrity**     | Conventional commits, signed releases, integrity checks        | ✅ Implemented                      |
| **A09: Logging/Monitoring Failures** | Structured logging, Prometheus metrics, audit trails           | 🟡 Partial (monitoring in EPIC-012) |
| **A10: Server-Side Request Forgery** | URL validation, allowlist-based external requests              | 🟡 Planned                          |

**Verification**: Run security audit with `npm audit` and review [SECURITY.md](./SECURITY.md).

---

## 🛡️ GDPR & Privacy Compliance

### Data Protection Principles

This project is designed with **privacy by design** and **privacy by default**:

1. **Lawfulness, Fairness, Transparency**:
   - Clear privacy policy (to be added when user data is collected)
   - Transparent data processing purposes
   - User consent mechanisms

2. **Purpose Limitation**:
   - Data collected only for specified, explicit purposes
   - No secondary use without new consent

3. **Data Minimization**:
   - Collect only necessary data
   - No unnecessary PII (Personally Identifiable Information)

4. **Accuracy**:
   - Users can update their data
   - Data correction mechanisms

5. **Storage Limitation**:
   - Retention policies (default: 90 days for logs, 1 year for audit trails)
   - Automated data deletion after retention period

6. **Integrity & Confidentiality**:
   - Encryption at rest (database encryption)
   - Encryption in transit (TLS 1.2+)
   - Access controls (RBAC)

7. **Accountability**:
   - Audit logs for data access
   - Data processing records
   - DPO (Data Protection Officer) contact: awesome.cit.dev@gmail.com

### User Rights (GDPR Articles 15-22)

| Right                                   | Implementation                             | Status                           |
| --------------------------------------- | ------------------------------------------ | -------------------------------- |
| **Right to Access** (Art. 15)           | Export user data via API endpoint          | 🟡 Planned (EPIC-003+)           |
| **Right to Rectification** (Art. 16)    | Update user data via API                   | ✅ Implemented                   |
| **Right to Erasure** (Art. 17)          | Delete user data ("Right to be Forgotten") | 🟡 Planned (EPIC-003+)           |
| **Right to Restriction** (Art. 18)      | Suspend data processing on request         | 🟡 Planned                       |
| **Right to Data Portability** (Art. 20) | Export data in JSON/CSV format             | 🟡 Planned                       |
| **Right to Object** (Art. 21)           | Opt-out of processing                      | 🟡 Planned                       |
| **Automated Decision-Making** (Art. 22) | Human review for automated decisions       | N/A (no automated decisions yet) |

**Note**: Full GDPR compliance implementation is planned for when the application handles user data
(post-EPIC-005).

---

## 📜 Licensing Compliance

### Project License

- **License**: MIT License
- **SPDX Identifier**: `MIT`
- **Commercial Use**: ✅ Allowed
- **Modification**: ✅ Allowed
- **Distribution**: ✅ Allowed
- **Private Use**: ✅ Allowed
- **Liability**: ❌ No warranty
- **Patent Grant**: ❌ Not included

**Full text**: [LICENSE](./LICENSE)

### Open Source Dependencies

All dependencies use **permissive open-source licenses** compatible with commercial use:

| License Type     | Libraries                                               | Commercial Use | Copyleft |
| ---------------- | ------------------------------------------------------- | -------------- | -------- |
| **MIT**          | React, Express, Fastify, Platformatic, Prettier, ESLint | ✅ Yes         | ❌ No    |
| **Apache 2.0**   | TypeScript, Kubernetes client libraries                 | ✅ Yes         | ❌ No    |
| **BSD-3-Clause** | Node.js core modules, some utilities                    | ✅ Yes         | ❌ No    |
| **ISC**          | npm, some Node packages                                 | ✅ Yes         | ❌ No    |

**❌ Excluded Licenses** (not used in this project):

- **GPL** (GNU General Public License) - Strong copyleft
- **AGPL** (Affero GPL) - Network copyleft
- **SSPL** (Server Side Public License) - Commercial restrictions

### License Verification

Check all dependencies:

```bash
# Install license checker
npm install -D license-checker

# Generate license report
npx license-checker --summary

# Verify no copyleft licenses
npx license-checker --failOn 'GPL;AGPL;SSPL'
```

**Automated checks** (planned in EPIC-001 Sprint 2):

- Pre-commit hook for new dependencies
- CI/CD license validation
- Quarterly dependency audit

---

## 🏛️ Standards & Certifications

### Code Quality Standards

- **Complexity Limits**:
  - Cognitive Complexity < 10 (SonarJS)
  - Cyclomatic Complexity < 10 (ESLint)
- **Test Coverage**: >= 70% (lines, functions, branches, statements)
- **Code Style**: Prettier + ESLint (enforced via pre-commit hooks)
- **Commit Convention**: Conventional Commits 1.0.0

### API Standards

- **REST**: RESTful principles (stateless, cacheable, uniform interface)
- **OpenAPI/Swagger**: API documentation (planned in EPIC-005)
- **Versioning**: Semantic Versioning (SemVer 2.0.0)
- **Rate Limiting**: Recommended for production (not yet enforced)

### Security Standards

- **CWE** (Common Weakness Enumeration): Addressed via OWASP mitigations
- **CVE** (Common Vulnerabilities and Exposures): Monitored via npm audit
- **NIST Cybersecurity Framework**: Aligned with Identify, Protect, Detect, Respond, Recover

---

## 🌍 Accessibility (WCAG)

**Status**: 🟡 Planned for frontend (EPIC-012 Dashboard)

When implementing user interfaces, we commit to:

- **WCAG 2.1 Level AA** compliance minimum
- Semantic HTML
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)

---

## 📊 Compliance Checklist

### Before Production Deployment

- [ ] **Security**:
  - [ ] All OWASP Top 10 risks mitigated
  - [ ] Penetration testing completed
  - [ ] Security audit passed (npm audit --production)
  - [ ] Secrets scanning enabled (pre-commit hooks)
  - [ ] TLS 1.2+ configured
  - [ ] Security headers configured (CSP, HSTS, etc.)

- [ ] **Privacy (GDPR)**:
  - [ ] Privacy policy published
  - [ ] Cookie consent banner (if applicable)
  - [ ] Data retention policies configured
  - [ ] User data export/deletion endpoints
  - [ ] DPO contact information published

- [ ] **Licensing**:
  - [ ] All dependencies reviewed (no copyleft licenses)
  - [ ] License checker passing
  - [ ] LICENSE file present in root
  - [ ] Third-party attributions documented

- [ ] **Standards**:
  - [ ] Code quality gates passing (linting, tests, coverage)
  - [ ] API documentation published (OpenAPI/Swagger)
  - [ ] Accessibility audit passed (WCAG 2.1 AA)
  - [ ] Performance benchmarks met

---

## 📞 Compliance Contacts

- **Security**: awesome.cit.dev@gmail.com (see [SECURITY.md](./SECURITY.md))
- **Privacy (DPO)**: awesome.cit.dev@gmail.com
- **Legal**: awesome.cit.dev@gmail.com
- **General**: awesome.cit.dev@gmail.com

---

## 🔄 Review & Updates

- **Review Frequency**: Quarterly (every 3 months)
- **Last Review**: 2025-12-13
- **Next Review**: 2026-03-13
- **Responsibility**: Project maintainer (Antonio Cittadino)

---

## 📚 References

### Security

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Privacy

- [GDPR Official Text](https://gdpr-info.eu/)
- [ICO GDPR Guidance](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)

### Licensing

- [SPDX License List](https://spdx.org/licenses/)
- [Choose a License](https://choosealicense.com/)
- [OSI Approved Licenses](https://opensource.org/licenses)

### Standards

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: 2025-12-13  
**Version**: 1.0.0  
**Maintainer**: Antonio Cittadino (@awesomecit)
