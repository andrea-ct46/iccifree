# Security Policy

## 🔒 Reporting a Vulnerability

The ICCI FREE team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### Where to Report

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please report security issues to:
- **Email**: security@iccifree.com
- **PGP Key**: [Available on request]

### What to Include

Please include the following information in your report:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 3 business days
- **Status Update**: Every 5 business days
- **Resolution**: Varies based on severity

## 🛡️ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅ Yes             |
| 1.5.x   | ✅ Yes             |
| 1.0.x   | ⚠️ Critical only   |
| < 1.0   | ❌ No              |

## 🔐 Security Measures

### Current Implementations

#### Authentication & Authorization
- ✅ OAuth 2.0 implementation (Google, Discord)
- ✅ JWT token-based authentication
- ✅ Session management
- ✅ Supabase Row Level Security (RLS)
- ✅ CSRF protection

#### Network Security
- ✅ HTTPS only (HSTS enabled)
- ✅ Secure WebRTC connections
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection enabled

#### Data Protection
- ✅ Input validation & sanitization
- ✅ Output encoding
- ✅ Parameterized queries
- ✅ Secure password storage (Supabase Auth)
- ✅ Rate limiting

#### Infrastructure
- ✅ Regular security updates
- ✅ Dependency vulnerability scanning
- ✅ Error handling (no sensitive info leakage)
- ✅ Logging & monitoring

### Known Limitations

1. **WebRTC P2P**: Peer IP addresses are exposed (inherent to WebRTC)
2. **Client-side validation**: Always verified server-side
3. **Rate limiting**: Basic implementation (can be improved)

## 🚨 Security Best Practices for Users

### For Streamers
- ✅ Use strong, unique passwords
- ✅ Enable 2FA when available
- ✅ Don't share your stream keys
- ✅ Review connected applications regularly
- ✅ Be cautious with chat commands/bots

### For Viewers
- ✅ Don't click suspicious links in chat
- ✅ Use latest browser version
- ✅ Keep your OS updated
- ✅ Be wary of phishing attempts
- ✅ Report suspicious behavior

## 🔍 Security Audit History

| Date | Type | Findings | Status |
|------|------|----------|--------|
| 2025-09 | Internal | 15 minor issues | ✅ Resolved |
| 2025-08 | Penetration Test | 3 medium issues | ✅ Resolved |
| 2025-07 | Code Review | 8 minor issues | ✅ Resolved |

## 🛠️ Security Tools & Checks

We use the following tools for security:

### Automated Scanning
- GitHub Dependabot (dependency vulnerabilities)
- Trivy (container/code scanning)
- OWASP ZAP (web app scanning)
- npm audit (JavaScript dependencies)

### Manual Reviews
- Quarterly security audits
- Code review for all PRs
- Penetration testing (annual)

## 📋 Security Checklist for Contributors

When contributing code, ensure:

- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user data
- [ ] Output encoding for displayed data
- [ ] SQL queries are parameterized
- [ ] Authentication checks are in place
- [ ] Authorization logic is correct
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Security headers are set correctly
- [ ] Rate limiting is considered

## 🚦 Severity Levels

We classify vulnerabilities using CVSS v3.1:

### Critical (9.0-10.0)
- **Response**: Immediate
- **Fix**: Within 24 hours
- **Example**: Remote code execution, authentication bypass

### High (7.0-8.9)
- **Response**: Within 24 hours
- **Fix**: Within 3 days
- **Example**: SQL injection, XSS with session theft

### Medium (4.0-6.9)
- **Response**: Within 3 days
- **Fix**: Within 1 week
- **Example**: CSRF, information disclosure

### Low (0.1-3.9)
- **Response**: Within 1 week
- **Fix**: Next release cycle
- **Example**: Missing security headers, low-impact XSS

## 🏆 Hall of Fame

We recognize researchers who help us improve security:

### 2025
- [Your Name] - Critical authentication bypass
- [Your Name] - XSS vulnerability
- [Your Name] - Rate limiting bypass

Want to be listed? Report a valid security issue!

## 📚 Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WebRTC Security](https://webrtc-security.github.io/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)

### Our Policies
- [Privacy Policy](https://iccifree.com/privacy)
- [Terms of Service](https://iccifree.com/terms)
- [Bug Bounty Program](https://iccifree.com/security/bounty)

## 💰 Bug Bounty Program

### Scope
- Web application (iccifree.com)
- API endpoints
- WebRTC implementation
- Authentication system

### Out of Scope
- Third-party services (Supabase, etc.)
- DDoS attacks
- Social engineering
- Physical security

### Rewards
- **Critical**: $500-$2000
- **High**: $200-$500
- **Medium**: $50-$200
- **Low**: Recognition only

*Rewards are at our discretion based on impact and quality of report.*

## 📞 Contact

### Security Team
- **Email**: security@iccifree.com
- **Response Time**: 24 hours
- **PGP Key**: [Request via email]

### General Inquiries
- **Email**: support@iccifree.com
- **Discord**: [Server Link]

## 🔄 Updates

This security policy is reviewed and updated quarterly.

**Last Updated**: September 26, 2025  
**Next Review**: December 26, 2025

---

<div align="center">
  <strong>Security is Everyone's Responsibility</strong>
  <br>
  <sub>Thank you for helping keep ICCI FREE safe! 🔒</sub>
</div>
