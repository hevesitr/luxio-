# GitHub Actions CI/CD Setup

## 🚀 Overview

This repository uses GitHub Actions for automated CI/CD pipelines with Expo Application Services (EAS).

## 📋 Required Secrets

### GitHub Repository Secrets

Add these secrets in your repository settings (Settings → Secrets and variables → Actions):

#### EXPO_TOKEN
- **Description**: Expo CLI API token for EAS builds
- **How to get it**:
  1. Go to https://expo.dev/accounts/[your-account]
  2. Navigate to "Access tokens"
  3. Create a new token with "Build" and "Submit" permissions
  4. Copy the token value

#### EAS_BUILD_SECRET (Optional)
- **Description**: EAS Build secret for encrypted environment variables
- **How to get it**: Generate with `npx eas secret:create`

### App Store Connect (iOS)

#### ASC_APPLE_ID
- **Description**: Apple ID email for App Store Connect
- **Format**: `your-email@example.com`

#### ASC_APP_SPECIFIC_PASSWORD
- **Description**: App-specific password from Apple ID
- **How to get it**:
  1. Go to https://appleid.apple.com
  2. Sign in and go to "Security" → "App-Specific Passwords"
  3. Generate a new password for "Expo CLI"

#### ASC_APP_ID
- **Description**: App Store Connect App ID
- **Format**: Numeric ID from App Store Connect

### Google Play Store (Android)

#### GOOGLE_SERVICE_ACCOUNT_KEY
- **Description**: Google Service Account JSON key
- **How to get it**:
  1. Go to Google Play Console → Settings → Developer account → API access
  2. Create a new service account or use existing one
  3. Download the JSON key file
  4. Base64 encode the JSON content: `base64 -i key.json`
  5. Add the base64 string as the secret value

## 🔧 EAS Configuration

### eas.json Setup

The `eas.json` file contains build profiles for different environments:

- **development**: Local development builds
- **preview**: Internal distribution builds
- **staging**: Beta testing builds
- **production**: App Store releases

### Environment Variables

Create `.env.eas` files for different environments:

```bash
# .env.eas.production
EXPO_PUBLIC_API_URL=https://api.lovex.com
EXPO_PUBLIC_ENVIRONMENT=production

# .env.eas.staging
EXPO_PUBLIC_API_URL=https://staging-api.lovex.com
EXPO_PUBLIC_ENVIRONMENT=staging
```

## 🚦 Pipeline Stages

### 1. Test Stage
- ✅ Install dependencies
- ✅ Run ESLint
- ✅ Run TypeScript type checking
- ✅ Run unit tests with coverage
- ✅ Upload coverage reports

### 2. Build Stage
- ✅ Configure EAS Build
- ✅ Build for Android APK
- ✅ Build for iOS Simulator
- ✅ Verify build completion

### 3. Deploy Stage

#### Staging Deployment (develop branch)
- Triggered on push to `develop` branch
- Deploys to TestFlight (iOS) and Google Play Beta (Android)
- Creates internal testing builds

#### Production Deployment (main branch)
- Triggered on push to `main` branch
- Deploys to App Store and Google Play Store
- Creates GitHub release
- Requires manual approval

#### Manual Deployment
- Triggered via GitHub Actions UI
- Allows deploying to any environment
- Useful for hotfixes and emergency releases

## 🐛 Troubleshooting

### Build Hanging on "Pending"
1. Check EAS Build dashboard: https://expo.dev/accounts/[account]/builds
2. Verify EXPO_TOKEN has correct permissions
3. Check build logs for specific errors
4. Ensure `eas.json` configuration is correct

### Test Failures
1. Check test output in GitHub Actions logs
2. Ensure all dependencies are installed
3. Verify environment variables are set
4. Check for flaky tests

### Deployment Failures
1. Verify App Store Connect credentials
2. Check Google Play service account permissions
3. Ensure app versions are incremented
4. Check for binary rejections

## 📊 Monitoring

### Build Status
Monitor build status at:
- EAS Build: https://expo.dev/accounts/[account]/builds
- GitHub Actions: https://github.com/[user]/[repo]/actions

### Performance Metrics
- Build time tracking
- Test execution time
- Deployment success rates
- Error rate monitoring

## 🔄 Workflow Triggers

### Automatic Triggers
- **Push to main/develop**: Full CI/CD pipeline
- **Pull Request**: Test and build verification
- **Tag creation**: Production deployment

### Manual Triggers
- **Workflow Dispatch**: Manual deployment to any environment
- **Repository Dispatch**: External trigger capability

## 🎯 Best Practices

### Commit Messages
Follow conventional commit format:
```
feat: add new AI matching feature
fix: resolve swipe animation bug
perf: optimize image loading P95 200ms->120ms
```

### Branch Strategy
- `main`: Production releases
- `develop`: Staging deployments
- `feature/*`: Feature development
- `hotfix/*`: Emergency fixes

### Environment Management
- Use environment-specific secrets
- Separate build profiles for each environment
- Test in staging before production deployment

## 📞 Support

For issues with CI/CD:
1. Check GitHub Actions logs
2. Review EAS Build dashboard
3. Verify secret configuration
4. Check Expo documentation

---

*Last updated: December 2024*
