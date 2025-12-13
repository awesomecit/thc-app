# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

The THC-App team takes security vulnerabilities seriously. We appreciate your efforts to responsibly
disclose your findings.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**[INSERT SECURITY EMAIL ADDRESS]**

Include the following information in your report:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

When you report a vulnerability, you can expect:

1. **Acknowledgment**: Within 48 hours of your report
2. **Assessment**: We'll investigate and assess the severity within 5 business days
3. **Updates**: Regular updates on our progress (at least every 7 days)
4. **Resolution**: We aim to release a patch within 30 days for critical vulnerabilities
5. **Credit**: Public acknowledgment of your contribution (if desired)

### Disclosure Policy

- **Initial Response**: Within 48 hours
- **Status Updates**: Every 7 days until resolution
- **Coordinated Disclosure**: We follow a 90-day disclosure timeline
- **Public Disclosure**: After patch is released and users have had time to update

### Security Update Process

1. **Patch Development**: Fix is developed in a private repository
2. **Testing**: Thorough testing including regression tests
3. **Advisory Draft**: Security advisory is prepared
4. **Release**: Patch is released as a priority update
5. **Notification**: Users are notified via:
   - GitHub Security Advisories
   - Release notes
   - Email to known users (if applicable)
6. **Public Disclosure**: Full details published after 7 days

## Security Best Practices

### For Contributors

- Never commit secrets (API keys, passwords, tokens) to the repository
- Use environment variables for sensitive configuration
- Review code for security issues before submitting PRs
- Keep dependencies up to date
- Follow OWASP Top 10 guidelines

### For Users

- Keep your installation up to date with the latest security patches
- Use strong authentication credentials
- Enable security features (rate limiting, input validation, etc.)
- Monitor logs for suspicious activity
- Follow the principle of least privilege
- Use HTTPS in production environments

## Security Features

This project includes:

- **Secret Scanning**: Pre-commit hooks prevent committing secrets
- **Dependency Scanning**: Automated checks for vulnerable dependencies
- **Linting**: ESLint with security rules (eslint-plugin-security)
- **Code Complexity Limits**: Enforced cognitive and cyclomatic complexity limits
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Protection**: Parameterized queries via Platformatic DB
- **XSS Protection**: Output encoding and Content Security Policy headers

## Known Security Considerations

### Authentication & Authorization

- Default configuration uses secure session management
- JWT tokens should use strong signing algorithms (RS256 or ES256)
- Refresh tokens should be rotated on use
- Sessions should have appropriate timeouts

### Database Security

- Database credentials should never be hardcoded
- Use connection pooling with appropriate limits
- Enable query logging for audit trails
- Regular backups are recommended

### API Security

- Rate limiting is recommended for production
- CORS should be configured appropriately
- API keys should be rotated regularly
- GraphQL queries should have complexity limits

### Infrastructure Security

- Use TLS 1.2+ for all communications
- Keep Docker images up to date
- Follow container security best practices
- Implement network segmentation

## Security Checklist for Deployments

Before deploying to production:

- [ ] All secrets are stored in secure vault (not in code or env files)
- [ ] HTTPS is enabled with valid certificates
- [ ] Database connections use encrypted connections
- [ ] Authentication is properly configured
- [ ] Rate limiting is enabled
- [ ] Logging and monitoring are in place
- [ ] Regular backups are configured
- [ ] Security headers are configured (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Dependencies are up to date with no known vulnerabilities
- [ ] Error messages don't leak sensitive information

## Vulnerability Severity Levels

We use the following severity levels:

- **Critical**: Immediate action required (patch within 24-48 hours)
  - Remote code execution
  - SQL injection
  - Authentication bypass
- **High**: Urgent action required (patch within 7 days)
  - XSS vulnerabilities
  - Privilege escalation
  - Sensitive data exposure
- **Medium**: Action required (patch within 30 days)
  - CSRF vulnerabilities
  - Information disclosure
  - Denial of service
- **Low**: Action recommended (patch in next release)
  - Minor information leaks
  - Non-exploitable vulnerabilities

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Platformatic Security Guidelines](https://docs.platformatic.dev/docs/guides/security)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

## Hall of Fame

We recognize and thank the following researchers who have responsibly disclosed security
vulnerabilities:

<!-- List will be populated as vulnerabilities are reported and fixed -->

_No vulnerabilities reported yet._

---

**Thank you for helping keep THC-App secure!** 🔒
