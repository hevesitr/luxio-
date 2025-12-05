# 📝 Commit Message Convention - Dating App

## 🎯 **Conventional Commits Standard**

This project follows the [Conventional Commits](https://conventionalcommits.org/) specification for consistent and meaningful commit messages.

---

## 📋 **Commit Message Format**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### **Types**

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(ai): add spark score calculation` |
| `fix` | Bug fix | `fix(auth): resolve login timeout issue` |
| `docs` | Documentation | `docs(api): update spark score endpoint docs` |
| `style` | Code style | `style(components): format profile card component` |
| `refactor` | Code refactor | `refactor(services): extract profile repository` |
| `perf` | Performance | `perf(api): cache profile queries P95 200ms->120ms` |
| `test` | Testing | `test(services): add AISparkService integration tests` |
| `chore` | Maintenance | `chore(deps): update react-native to 0.72` |
| `ci` | CI/CD | `ci(actions): add performance regression tests` |
| `build` | Build system | `build(webpack): optimize bundle splitting` |

### **Scopes**

| Scope | Description |
|-------|-------------|
| `ai` | AI features (Spark, Compatibility) |
| `auth` | Authentication & security |
| `api` | API endpoints & services |
| `ui` | User interface components |
| `db` | Database & schemas |
| `perf` | Performance optimizations |
| `test` | Testing infrastructure |
| `docs` | Documentation |
| `config` | Configuration files |

---

## ✅ **Good Commit Examples**

### **Feature Commits**
```
feat(ai): implement spark score personality matching

- Add AISparkService with 8-factor compatibility analysis
- Implement personality prompt similarity algorithm
- Add confidence scoring and prediction logic
- Tests: 11/11 passing with 85% coverage

Closes #ai-spark-implementation
```

```
feat(mood): add dynamic mood-based matching system

- Create MoodMatchingService with 8 mood types
- Implement compatibility matrix algorithm
- Add mood expiration and caching
- UI: Mood selector with real-time updates

BREAKING CHANGE: Requires mood_data field in profiles table
```

### **Performance Commits**
```
perf(api): optimize match queries with database indexes

Before: P95 850ms, DB load 75%
After:  P95 320ms, DB load 45%

- Add composite indexes on matches table
- Implement query result caching
- Reduce N+1 query patterns
- Memory usage: -25MB heap reduction
```

```
perf(bundle): reduce bundle size with code splitting

Before: 5.2MB total bundle
After:  2.1MB total bundle (-60%)

- Implement lazy loading for screens
- Add dynamic imports for heavy components
- Tree shake unused dependencies
- Compress assets with WebP
```

### **Refactor Commits**
```
refactor(services): implement repository pattern SOLID principles

- Extract ProfileRepository with clean data access
- Implement DI container for service dependencies
- Add error handling with ErrorHandler integration
- SOLID score: 2.4/10 → 8.8/10 (+267%)
```

```
refactor(components): optimize render performance React.memo

Before: 95 re-render issues
After:  15 re-render issues (-84%)

- Add React.memo to ProfileCard component
- Implement useCallback for event handlers
- Memoize expensive calculations
- FPS improved: 45 → 58 (+29%)
```

### **Test Commits**
```
test(services): add comprehensive AISparkService test suite

- Unit tests for all 8 compatibility factors
- Integration tests with mock repositories
- Edge case testing (empty profiles, invalid data)
- Coverage: 95% with mutation testing

Part of #testing-infrastructure epic
```

---

## ❌ **Bad Commit Examples**

### **Too Vague**
```
fix: bug fixed
feat: add stuff
update: change things
```

### **Too Broad**
```
feat: implement ai features

- Add spark score
- Add mood matching
- Add compatibility rainbow
- Add smart dates
- Add memory lane
- Update all services
- Change database schema
- Add tests
- Update docs
```

### **Mixed Concerns**
```
feat: add ai features and fix login bug

- Add spark score calculation
- Fix authentication timeout
- Update ui components
- Change database indexes
```

---

## 🎯 **Commit Message Best Practices**

### **1. Use Imperative Mood**
✅ `feat: add spark score calculation`
❌ `feat: added spark score calculation`
❌ `feat: adding spark score calculation`

### **2. Keep First Line Under 50 Characters**
✅ `feat(ai): implement spark score algorithm`
❌ `feat(ai): implement comprehensive spark score personality matching algorithm`

### **3. Use Body for Detailed Explanations**
```
feat(ai): add compatibility rainbow analysis

Implement 8-dimensional personality compatibility analysis
using advanced algorithms for chemistry, lifestyle, values,
interests, communication, long-term potential, adventure,
and personal growth.

- Chemistry: Age/location attraction factors
- Lifestyle: 7-factor compatibility matrix
- Values: Weighted alignment scoring
- Communication: Prompt similarity analysis
- Rainbow UI: Color-coded visualization

Performance: <1500ms P95, Memory: <50MB heap
Tests: 100% coverage, 0 regressions
```

### **4. Reference Issues and Breaking Changes**
```
feat(db): add mood tracking schema

Add user_moods table for dynamic mood-based matching.
Includes mood expiration, compatibility matrix, and
caching for performance.

BREAKING CHANGE: Requires database migration
Migration file: supabase/migrations/001_add_mood_tracking.sql

Closes #mood-matching-feature
Related: #database-schema-update
```

### **5. Include Quantitative Metrics**
```
perf(api): optimize match queries database indexes

Before: P95 850ms, CPU 75%, Memory 120MB
After:  P95 320ms, CPU 45%, Memory 95MB

- Add composite indexes (user_id, created_at)
- Implement Redis caching layer
- Reduce N+1 queries by 80%
- Bundle size impact: +2KB

Closes #performance-optimization
```

---

## 🔧 **Tools & Automation**

### **Commit Hooks**
```bash
# Install husky for commit hooks
npm install --save-dev husky

# Setup commit-msg hook
npx husky add .hususky/commit-msg 'npx --no-install commitlint --edit "$1"'
```

### **CommitLint Configuration**
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'build'
    ]],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72]
  }
};
```

### **Automated Changelog**
```javascript
// release.config.js for semantic-release
module.exports = {
  branches: 'main',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git'
  ]
};
```

---

## 📊 **Commit Statistics Tracking**

### **Monthly Goals**
- **Features**: 15-20 feature commits
- **Fixes**: 5-10 bug fix commits
- **Performance**: 3-5 optimization commits
- **Tests**: 10-15 test commits
- **Documentation**: 2-3 docs commits

### **Quality Metrics**
- **Commit Message Quality**: 95%+ conventional commits
- **Breaking Changes**: <5% of commits
- **Revert Rate**: <2% of commits
- **Review Time**: <2 hours average

---

## 🎯 **Integration with Development Workflow**

### **Branch Naming**
```
feat/ai-spark-score
fix/auth-timeout
perf/bundle-optimization
refactor/services-repository
```

### **PR Template Integration**
- Commit messages auto-populate PR descriptions
- Conventional commits generate automatic changelogs
- Breaking changes flagged in PR checklists

### **CI/CD Integration**
```yaml
# .github/workflows/commit-check.yml
name: Commit Check
on: [push, pull_request]
jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: wagoid/commitlint-github-action@v5
```

---

## 📚 **Resources**

- [Conventional Commits Specification](https://conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [CommitLint](https://commitlint.js.org/)

---

*This convention ensures consistent, meaningful commit history that enables automatic changelog generation, semantic versioning, and efficient code reviews.*
