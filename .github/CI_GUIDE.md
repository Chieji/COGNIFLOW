# CI/CD Pipeline Guide for COGNIFLOW

This document explains the automated CI/CD pipeline that runs on every push and pull request.

## Overview

The CI pipeline ensures code quality, security, and reliability by running multiple checks automatically.

### Pipeline Jobs

| Job | Purpose | Trigger |
| :--- | :--- | :--- |
| **Lint & Type Check** | Validates TypeScript and code style | Every push/PR |
| **Build Verification** | Ensures the project builds successfully | Every push/PR |
| **Security Audit** | Scans dependencies for vulnerabilities | Every push/PR |
| **Code Quality Metrics** | Analyzes code complexity and structure | Every push/PR |
| **Run Tests** | Executes unit and integration tests | Every push/PR |
| **CI Summary** | Generates a summary report | Every push/PR |

## Understanding the Results

### ✅ All Green (Success)
Your code is production-ready! All checks passed:
- No TypeScript errors
- Build completed successfully
- No security vulnerabilities
- Code quality metrics are good
- All tests passed

**Action:** Safe to merge to `main` branch.

### ⚠️ Warnings (Caution)
Some checks have warnings but didn't fail:
- Deprecated dependencies (but still functional)
- TODO/FIXME comments found
- High-complexity functions detected
- Console statements in code

**Action:** Review warnings and consider addressing them before merging.

### ❌ Failed (Critical)
One or more checks failed:
- TypeScript compilation errors
- Build failed
- High-severity security vulnerabilities
- Test failures

**Action:** Fix the issues before merging. Click on the failed job to see details.

## How to Read CI Logs

1. **Go to GitHub Repository**
   - Navigate to your COGNIFLOW repository
   - Click on the "Actions" tab

2. **Select the Latest Workflow Run**
   - Click on the most recent workflow run
   - You'll see all 6 jobs listed

3. **Click on a Failed Job**
   - See the exact error message
   - Scroll down to see the full output

4. **Common Errors**

   **TypeScript Error:**
   ```
   src/components/ChatView.tsx:45:10 - error TS2345: 
   Argument of type 'string' is not assignable to parameter of type 'number'
   ```
   → Fix: Check the type mismatch and correct it.

   **Build Error:**
   ```
   [ERROR] Could not resolve '@google/genai'
   ```
   → Fix: Run `npm install` locally and commit `package-lock.json`.

   **Security Vulnerability:**
   ```
   High: Prototype Pollution in lodash
   ```
   → Fix: Update the vulnerable package with `npm update lodash`.

## Local Testing Before Push

To avoid CI failures, test locally before pushing:

```bash
# Type check
npm run type-check

# Build
npm run build

# Lint (if configured)
npm run lint

# Security audit
npm audit
```

## Interpreting Build Artifacts

After a successful build, the CI pipeline uploads:

1. **build-output** (dist/)
   - Your production-ready application
   - Kept for 5 days
   - Can be downloaded for manual testing

2. **npm-audit-report** (audit-report.json)
   - Security vulnerability report
   - Kept for 7 days
   - Review for any high-severity issues

3. **test-results** (coverage/)
   - Test coverage report (if tests exist)
   - Kept for 7 days

## Security Checks Explained

### 1. API Key Exposure Detection
The CI scans the build output to ensure no API keys are accidentally included:
- Checks for patterns like `GEMINI_API_KEY`, `sk-`, `AIza`
- Fails if any keys are found
- This protects your credentials from being exposed in the build

### 2. Dependency Audit
Runs `npm audit` to check for known vulnerabilities:
- **Critical**: Immediate security risk, must fix
- **High**: Important security issue, should fix soon
- **Moderate**: Consider fixing, less urgent
- **Low**: Minor issue, can be addressed later

## Continuous Improvement

### Adding More Checks

To add additional checks to the pipeline:

1. Edit `.github/workflows/ci.yml`
2. Add a new job under `jobs:`
3. Push the changes
4. GitHub will automatically use the updated workflow

### Example: Adding ESLint

```yaml
- name: Run ESLint
  run: npm run lint
```

## Troubleshooting

### "npm ci: command not found"
→ The workflow uses `npm ci` (clean install). Ensure Node.js is installed.

### "Build artifacts not uploading"
→ Check if the build actually succeeded. Artifacts only upload on success.

### "Workflow not running"
→ Ensure the workflow file is in `.github/workflows/` and has correct YAML syntax.

## Best Practices

1. **Always wait for CI to pass before merging**
   - Green checkmark = safe to merge
   - Red X = fix issues first

2. **Review warnings even if build passes**
   - Warnings indicate potential issues
   - Address them to maintain code quality

3. **Keep dependencies updated**
   - Run `npm audit fix` regularly
   - Update packages to patch security issues

4. **Write tests for new features**
   - Tests catch regressions early
   - CI will run them automatically

5. **Commit package-lock.json**
   - Ensures consistent dependency versions
   - CI uses `npm ci` to install exact versions

## Support

If you have questions about the CI pipeline:

1. Check the workflow file: `.github/workflows/ci.yml`
2. Review the GitHub Actions documentation: https://docs.github.com/en/actions
3. Check the CONTRIBUTING.md for development guidelines

---

**Remember:** A green CI pipeline is your badge of professionalism. It tells users and potential buyers that your code is tested, verified, and production-ready. 🚀
