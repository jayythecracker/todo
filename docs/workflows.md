# 🚀 Workflow Documentation

## 📋 Overview

This document describes the comprehensive CI/CD and automation workflows for the Simple Todos application.

## 🔄 Workflow Types

### 1. 🚀 CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
- **Test Suite**: Runs comprehensive tests for both client and server
- **Security Scan**: Performs security audits and vulnerability scanning
- **Deploy Staging**: Deploys to staging environment on `develop` branch
- **Deploy Production**: Deploys to production on `main` branch
- **Notify Team**: Sends deployment notifications

**Services:**
- MongoDB 6.0
- Redis 7.0

### 2. 🔍 Code Quality (`code-quality.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Push to `main` or `develop`

**Jobs:**
- **Lint & Format**: ESLint, Prettier, TypeScript checks
- **Complexity Analysis**: Code complexity and duplicate detection
- **Dependency Check**: Outdated packages and license compliance
- **Bundle Analysis**: Webpack bundle size analysis
- **Coverage**: Code coverage reporting
- **PR Comment**: Automated PR comments with results

### 3. 🔒 Security (`security.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main`
- Daily schedule (2 AM UTC)

**Jobs:**
- **Vulnerability Scan**: NPM audit, Snyk, Trivy scanning
- **Secret Scan**: TruffleHog and GitLeaks for secret detection
- **SAST Scan**: CodeQL and Semgrep static analysis
- **Docker Security**: Container image vulnerability scanning
- **License Check**: License compliance verification
- **Security Report**: Consolidated security reporting

### 4. ⚡ Performance (`performance.yml`)

**Triggers:**
- Push to `main`
- Pull requests to `main`
- Daily schedule (3 AM UTC)

**Jobs:**
- **Lighthouse CI**: Web performance auditing
- **API Performance**: Load testing with Artillery
- **Bundle Size**: Bundle size monitoring and regression detection
- **Profiling**: CPU and memory profiling (scheduled only)
- **Performance Regression**: PR performance impact analysis
- **Performance Alerts**: Slack notifications for issues

## 🛠️ Setup Instructions

### Prerequisites

1. **GitHub Secrets** (Repository Settings → Secrets and variables → Actions):
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_vercel_org_id
   VERCEL_PROJECT_ID=your_vercel_project_id
   SNYK_TOKEN=your_snyk_token
   SEMGREP_APP_TOKEN=your_semgrep_token
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   ```

2. **Branch Protection Rules**:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators in restrictions

3. **Environment Setup**:
   - Create `staging` and `production` environments in GitHub
   - Configure environment protection rules

### Local Development Setup

1. **Install Dependencies**:
   ```bash
   # Server
   cd server && npm install
   
   # Client
   cd client && npm install
   ```

2. **Setup Git Hooks** (Optional):
   ```bash
   # Install husky for git hooks
   npm install -g husky
   npx husky install
   
   # Add pre-commit hook
   npx husky add .husky/pre-commit "npm run lint && npm run test"
   ```

3. **Environment Variables**:
   ```bash
   # Copy example environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

## 📊 Workflow Monitoring

### GitHub Actions Dashboard

Monitor workflow status at:
`https://github.com/your-username/your-repo/actions`

### Key Metrics to Watch

1. **Build Success Rate**: Should be > 95%
2. **Test Coverage**: Aim for > 80%
3. **Security Scan Results**: Zero high-severity issues
4. **Performance Scores**: Lighthouse > 90
5. **Bundle Size**: Monitor for regressions

### Artifacts Generated

- **Test Reports**: Coverage reports and test results
- **Security Reports**: Vulnerability and compliance reports
- **Performance Reports**: Lighthouse and load test results
- **Bundle Analysis**: Webpack bundle analyzer reports

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify environment variables are set
   - Review dependency conflicts

2. **Test Failures**:
   - Ensure test databases are properly configured
   - Check for race conditions in async tests
   - Verify mock data and fixtures

3. **Security Scan Failures**:
   - Update vulnerable dependencies
   - Review and rotate any exposed secrets
   - Address static analysis findings

4. **Performance Regressions**:
   - Analyze bundle size changes
   - Review Lighthouse score drops
   - Check API response time increases

### Debug Commands

```bash
# Run workflows locally with act
npm install -g @nektos/act
act -j test

# Lint and format code
npm run lint
npm run format

# Run security audit
npm audit
npm audit fix

# Performance testing
npm run test:performance
```

## 🔄 Workflow Best Practices

### 1. **Branch Strategy**
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature branches
- `hotfix/*`: Critical production fixes

### 2. **Commit Messages**
Follow conventional commits:
```
feat: add user authentication
fix: resolve memory leak in cache service
docs: update API documentation
test: add integration tests for todos
```

### 3. **Pull Request Process**
1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all workflows pass
4. Request code review
5. Merge to `develop`
6. Deploy to staging for testing
7. Merge to `main` for production

### 4. **Release Process**
1. Create release branch from `develop`
2. Update version numbers
3. Generate changelog
4. Merge to `main`
5. Tag release
6. Deploy to production
7. Merge back to `develop`

## 📈 Continuous Improvement

### Monthly Reviews
- Analyze workflow performance metrics
- Review security scan results
- Update dependencies
- Optimize build times

### Quarterly Updates
- Update workflow actions to latest versions
- Review and update security policies
- Performance baseline adjustments
- Tool evaluation and upgrades

---

*This documentation is maintained by the development team and updated with each workflow change.*
