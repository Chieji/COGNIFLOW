# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in COGNIFLOW, please email **security@cogniflow.dev** (or create a private security advisory) instead of using the public issue tracker.

We take security seriously and will respond within 48 hours.

---

## API Key Management

COGNIFLOW uses a **client-side API key storage pattern** for local-first development. For production deployments:

### ✅ DO:
- Store API keys in **environment variables** on your server
- Use a backend proxy to make AI API calls (recommended for production)
- Rotate keys regularly
- Monitor API usage for suspicious activity
- Use separate keys for development and production

### ❌ DON'T:
- Commit `.env` files to Git
- Expose API keys in client-side code in production
- Share keys in issue discussions or pull requests
- Use the same key across multiple environments

---

## Environment Variables

For local development, copy `.env.example` to `.env.local`:

```bash
# AI Provider API Keys (for local development only)
VITE_GEMINI_API_KEY=your_key_here
VITE_OPENAI_API_KEY=your_key_here
VITE_ANTHROPIC_API_KEY=your_key_here

# For production: Use backend proxy
VITE_API_PROXY_URL=https://your-api.example.com/proxy
```

**Note**: Keys prefixed with `VITE_` are exposed to the browser. For production, implement a backend proxy.

---

## Input Validation & Sanitization

COGNIFLOW includes built-in protections:

✅ **Prompt injection detection** - Warns on suspicious patterns  
✅ **XSS prevention** - Strips dangerous HTML/JS  
✅ **Rate limiting** - 20 AI calls/min, 100 API calls/min  
✅ **Content length limits** - Prevents abuse  
✅ **API key format validation** - Provider-specific checks

---

## Content Security Policy

The application enforces strict CSP headers:

- `default-src 'self'` - Only load resources from same origin
- `script-src` - Limited inline scripts (Vite HMR in dev)
- `connect-src` - Whitelist AI provider APIs only
- Additional headers: X-Frame-Options, X-Content-Type-Options, etc.

---

## Dependency Security

- Run `npm audit` regularly
- Keep dependencies updated: `npm update`
- Review security advisories: `npm audit report`
- Use Dependabot for automated updates

---

## Known Limitations

1. **Client-side AI keys** - Keys are stored in localStorage for local-first apps. Implement backend proxy for production.
2. **No authentication system** - COGNIFLOW is a local-first tool. Add auth if deploying as multi-user service.
3. **IndexedDB storage** - Local only. Data is not encrypted at rest.

---

## Security Roadmap

- [ ] Backend API proxy template
- [ ] E2E encryption for sensitive notes
- [ ] Multi-user authentication system
- [ ] RBAC for shared deployments
- [ ] Audit logging for compliance

---

## License

MIT License - See LICENSE file for details.
