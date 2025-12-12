/**
 * Quick error checker for the app
 */

console.log('🔍 Checking for common errors...\n');

// Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/services/MatchService.js',
  'src/services/BaseService.js',
  'src/services/DiscoveryService.js',
  'src/services/Logger.js',
  'src/screens/HomeScreen.js',
  'src/components/SwipeCard.js',
  'src/components/MatchAnimation.js',
  'src/data/profiles.js',
  'src/data/userProfile.js',
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ MISSING: ${file}`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n✅ All required files exist!');
} else {
  console.log('\n❌ Some files are missing!');
}

console.log('\n📝 Please paste the terminal errors here for detailed analysis.');
