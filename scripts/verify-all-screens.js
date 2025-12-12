/**
 * Verify All Screens - Automated Screen Verification Script
 * 
 * This script verifies that all screens:
 * 1. Exist in src/screens/
 * 2. Are registered in App.js
 * 3. Have proper imports
 * 4. Export default components
 * 5. Have navigation props
 * 
 * Usage: node scripts/verify-all-screens.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Expected screens list
const EXPECTED_SCREENS = [
  // Core
  'HomeScreen',
  'MatchesScreen',
  'ProfileScreen',
  'LoginScreen',
  'RegisterScreen',
  
  // Premium Features
  'BoostScreen',
  'LikesYouScreen',
  'TopPicksScreen',
  'PremiumScreen',
  'PassportScreen',
  'CreditsScreen',
  
  // Discovery & Matching
  'AIRecommendationsScreen',
  'MapScreen',
  'SearchScreen',
  'ProfileDetailScreen',
  'FavoritesScreen',
  'LookalikesScreen',
  'ProfileViewsScreen',
  
  // Messaging & Communication
  'ChatScreen',
  'ChatRoomScreen',
  'ChatRoomsScreen',
  'VideoChatScreen',
  'IncomingCallScreen',
  'GiftsScreen',
  
  // Social & Events
  'EventsScreen',
  'VideosScreen',
  'LiveStreamScreen',
  'SocialMediaScreen',
  
  // Sugar Dating
  'SugarDaddyScreen',
  'SugarBabyScreen',
  
  // Profile & Personalization
  'ProfilePromptsScreen',
  'PersonalityTestScreen',
  'PhotoUploadScreen',
  'GamificationScreen',
  
  // Settings & Account
  'SettingsScreen',
  'AnalyticsScreen',
  'VerificationScreen',
  'SafetyScreen',
  'PrivacySettingsScreen',
  'DataExportScreen',
  'DeleteAccountScreen',
  'HelpScreen',
  'BlockedUsersScreen',
  'PauseAccountScreen',
  
  // Legal & Compliance
  'ConsentScreen',
  'TermsScreen',
  'PrivacyScreen',
  'LegalUpdateScreen',
  
  // Authentication & Onboarding
  'OnboardingScreen',
  'OTPVerificationScreen',
  'PasswordResetScreen',
  'PasswordResetRequestScreen',
  'PasswordChangeScreen',
  'NewPasswordScreen',
  'EmailVerificationSuccessScreen',
  
  // Utility
  'WebViewScreen',
];

// Results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warningCount: 0,
  errors: [],
  warnings: [],
};

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Check if screen file exists
 */
function checkScreenExists(screenName) {
  const screenPath = path.join(__dirname, '..', 'src', 'screens', `${screenName}.js`);
  return fileExists(screenPath);
}

/**
 * Check if screen is registered in App.js
 */
function checkScreenRegistered(screenName) {
  const appJsPath = path.join(__dirname, '..', 'App.js');
  const appJsContent = readFile(appJsPath);
  
  if (!appJsContent) {
    return { registered: false, imported: false };
  }
  
  // Check for import
  const importRegex = new RegExp(`import\\s+${screenName}\\s+from\\s+['"]\\./src/screens/${screenName}['"]`, 'i');
  const imported = importRegex.test(appJsContent);
  
  // Check for Stack.Screen registration
  const registrationRegex = new RegExp(`<Stack\\.Screen\\s+name=["'][^"']*["']\\s+component={${screenName}}`, 'i');
  const registered = registrationRegex.test(appJsContent);
  
  return { registered, imported };
}

/**
 * Check screen implementation quality
 */
function checkScreenImplementation(screenName) {
  const screenPath = path.join(__dirname, '..', 'src', 'screens', `${screenName}.js`);
  const content = readFile(screenPath);
  
  if (!content) {
    return {
      hasDefaultExport: false,
      hasNavigationProp: false,
      hasUseEffect: false,
      hasErrorHandling: false,
    };
  }
  
  return {
    hasDefaultExport: /export\s+default\s+/.test(content),
    hasNavigationProp: /navigation/.test(content),
    hasUseEffect: /useEffect/.test(content),
    hasErrorHandling: /(try\s*{|catch\s*\(|\.catch\()/.test(content),
  };
}

/**
 * Print section header
 */
function printHeader(text) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Print test result
 */
function printResult(screenName, status, message = '') {
  const statusIcon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const statusColor = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  
  console.log(`${statusColor}${statusIcon}${colors.reset} ${screenName}${message ? ` - ${message}` : ''}`);
}

/**
 * Main verification function
 */
function verifyAllScreens() {
  printHeader('SCREEN VERIFICATION REPORT');
  
  console.log(`${colors.bright}Checking ${EXPECTED_SCREENS.length} screens...${colors.reset}\n`);
  
  EXPECTED_SCREENS.forEach(screenName => {
    results.total++;
    
    // Check existence
    const exists = checkScreenExists(screenName);
    if (!exists) {
      printResult(screenName, 'fail', 'File not found');
      results.failed++;
      results.errors.push(`${screenName}: File not found`);
      return;
    }
    
    // Check registration
    const { registered, imported } = checkScreenRegistered(screenName);
    if (!imported) {
      printResult(screenName, 'fail', 'Not imported in App.js');
      results.failed++;
      results.errors.push(`${screenName}: Not imported in App.js`);
      return;
    }
    
    if (!registered) {
      printResult(screenName, 'warn', 'Imported but not registered');
      results.warningCount++;
      results.warnings.push(`${screenName}: Imported but not registered in Stack.Screen`);
      return;
    }
    
    // Check implementation
    const impl = checkScreenImplementation(screenName);
    const issues = [];
    
    if (!impl.hasDefaultExport) issues.push('no default export');
    if (!impl.hasNavigationProp) issues.push('no navigation prop');
    if (!impl.hasErrorHandling) issues.push('no error handling');
    
    if (issues.length > 0) {
      printResult(screenName, 'warn', issues.join(', '));
      results.warningCount++;
      results.warnings.push(`${screenName}: ${issues.join(', ')}`);
    } else {
      printResult(screenName, 'pass');
      results.passed++;
    }
  });
  
  // Print summary
  printHeader('SUMMARY');
  
  console.log(`${colors.bright}Total Screens:${colors.reset} ${results.total}`);
  console.log(`${colors.green}${colors.bright}Passed:${colors.reset} ${results.passed}`);
  console.log(`${colors.yellow}${colors.bright}Warnings:${colors.reset} ${results.warningCount}`);
  console.log(`${colors.red}${colors.bright}Failed:${colors.reset} ${results.failed}`);
  
  // Print errors
  if (results.errors.length > 0) {
    printHeader('ERRORS');
    results.errors.forEach(error => {
      console.log(`${colors.red}✗${colors.reset} ${error}`);
    });
  }
  
  // Print warnings
  if (results.warnings.length > 0) {
    printHeader('WARNINGS');
    results.warnings.forEach(warning => {
      console.log(`${colors.yellow}⚠${colors.reset} ${warning}`);
    });
  }
  
  // Exit code
  const exitCode = results.failed > 0 ? 1 : 0;
  
  console.log(`\n${colors.bright}Verification ${exitCode === 0 ? `${colors.green}PASSED` : `${colors.red}FAILED`}${colors.reset}\n`);
  
  process.exit(exitCode);
}

// Run verification
verifyAllScreens();
