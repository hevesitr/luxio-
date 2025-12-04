// Debug script to test profile filtering
const { profiles } = require('./src/data/profiles');
const { currentUser } = require('./src/data/userProfile');

console.log('=== PROFILE DEBUG ===');
console.log('Total profiles:', profiles.length);
console.log('currentUser.lookingFor:', currentUser.lookingFor);

// Count by gender
const femaleProfiles = profiles.filter(p => p.gender === 'female');
const maleProfiles = profiles.filter(p => p.gender === 'male');

console.log('Female profiles:', femaleProfiles.length);
console.log('Male profiles:', maleProfiles.length);

// Filter like HomeScreen does
let filtered = profiles;

if (currentUser.lookingFor && currentUser.lookingFor.length > 0) {
  filtered = filtered.filter(p => 
    p.gender && currentUser.lookingFor.includes(p.gender)
  );
}

console.log('Filtered profiles:', filtered.length);
console.log('First 3 filtered profiles:');
filtered.slice(0, 3).forEach((p, i) => {
  console.log(`${i + 1}. ${p.name}, ${p.age}, ${p.gender}`);
});
