/**
 * Automatikusan hozzáadja a hibakezelést minden képernyőhöz
 * Usage: node scripts/add-error-boundaries.js
 */

const fs = require('fs');
const path = require('path');

// Képernyők, amelyekhez hozzá kell adni a hibakezelést
const screensToFix = [
  // Premium
  'src/screens/premium/BoostScreen.js',
  'src/screens/premium/LikesYouScreen.js',
  'src/screens/premium/TopPicksScreen.js',
  'src/screens/premium/PassportScreen.js',
  'src/screens/premium/CreditsScreen.js',
  'src/screens/premium/SuperLikeScreen.js',
  'src/screens/premium/RewindScreen.js',
  'src/screens/premium/ReadReceiptsScreen.js',
  
  // Discovery
  'src/screens/SearchScreen.js',
  'src/screens/FavoritesScreen.js',
  'src/screens/LookalikesScreen.js',
  'src/screens/ProfileViewsScreen.js',
  'src/screens/AIRecommendationsScreen.js',
  
  // Messages
  'src/screens/ChatRoomScreen.js',
  'src/screens/VideoCallScreen.js',
  'src/screens/VoiceCallScreen.js',
  
  // Profile
  'src/screens/EditProfileScreen.js',
  'src/screens/PhotosScreen.js',
  'src/screens/InterestsScreen.js',
  'src/screens/VerificationScreen.js',
  'src/screens/BadgesScreen.js',
  'src/screens/PromptAnswersScreen.js',
  'src/screens/ProfilePreviewScreen.js',
  
  // Settings
  'src/screens/settings/NotificationSettingsScreen.js',
  'src/screens/settings/PrivacySettingsScreen.js',
  'src/screens/settings/DiscoverySettingsScreen.js',
  'src/screens/settings/AccountSettingsScreen.js',
  'src/screens/settings/DataSettingsScreen.js',
  'src/screens/settings/AppearanceSettingsScreen.js',
  
  // Other
  'src/screens/HelpScreen.js',
  'src/screens/FeedbackScreen.js',
  'src/screens/ReportScreen.js',
  'src/screens/SafetyTipsScreen.js',
  'src/screens/CommunityGuidelinesScreen.js',
  'src/screens/DateIdeasScreen.js',
];

function addErrorBoundary(filePath) {
  try {
    // Ellenőrizzük, hogy létezik-e a fájl
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Fájl nem található: ${filePath}`);
      return false;
    }

    // Olvassuk be a fájlt
    let content = fs.readFileSync(filePath, 'utf8');

    // Ellenőrizzük, hogy már van-e hibakezelés
    if (content.includes('withErrorBoundary')) {
      console.log(`✅ Már van hibakezelés: ${filePath}`);
      return true;
    }

    // Képernyő név kinyerése
    const screenName = path.basename(filePath, '.js');

    // Import hozzáadása
    const importDepth = filePath.includes('settings/') ? '../../' : '../';
    const importStatement = `import withErrorBoundary from '${importDepth}components/withErrorBoundary';\n`;

    // Keressük meg az utolsó importot
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const nextNewlineIndex = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, nextNewlineIndex + 1) + importStatement + content.slice(nextNewlineIndex + 1);
    } else {
      // Ha nincs import, tegyük a fájl elejére
      content = importStatement + '\n' + content;
    }

    // Export módosítása
    const exportRegex = /export default (\w+);/;
    const match = content.match(exportRegex);

    if (match) {
      const componentName = match[1];
      const newExport = `export default withErrorBoundary(${componentName}, '${screenName}');`;
      content = content.replace(exportRegex, newExport);

      // Írjuk vissza a fájlt
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Hibakezelés hozzáadva: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  Export nem található: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Hiba: ${filePath}`, error.message);
    return false;
  }
}

// Főprogram
console.log('🚀 Hibakezelés hozzáadása képernyőkhöz...\n');

let success = 0;
let failed = 0;
let skipped = 0;

screensToFix.forEach(screenPath => {
  const result = addErrorBoundary(screenPath);
  if (result === true) {
    success++;
  } else if (result === false) {
    failed++;
  } else {
    skipped++;
  }
});

console.log('\n📊 Összefoglaló:');
console.log(`✅ Sikeres: ${success}`);
console.log(`❌ Sikertelen: ${failed}`);
console.log(`⚠️  Kihagyva: ${skipped}`);
console.log(`📝 Összesen: ${screensToFix.length}`);

if (success > 0) {
  console.log('\n🎉 Hibakezelés sikeresen hozzáadva!');
  console.log('💡 Következő lépés: Teszteld az appot!');
}
