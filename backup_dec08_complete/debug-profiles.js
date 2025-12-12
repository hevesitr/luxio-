/**
 * Debug script to check DiscoveryService profiles
 */

// Simulate DiscoveryService
const mockProfiles = [
  { id: 1, name: 'Anna', age: 24 },
  { id: 2, name: 'Béla', age: 28 },
  { id: 3, name: 'Kata', age: 26 },
  { id: 4, name: 'István', age: 31 },
  { id: 5, name: 'Laura', age: 23 },
  { id: 6, name: 'Gábor', age: 29 },
  { id: 7, name: 'Zsófia', age: 27 },
  { id: 8, name: 'Mária', age: 25 },
  { id: 9, name: 'Péter', age: 32 },
  { id: 10, name: 'Eszter', age: 22 },
];

console.log('📊 Mock Profiles:');
mockProfiles.forEach((p, i) => {
  console.log(`  [${i}] ID: ${p.id}, Name: ${p.name}, Age: ${p.age}`);
});

console.log('\n🔍 Simulating swipes:');
let currentIndex = 0;

for (let i = 0; i < 5; i++) {
  const currentProfile = mockProfiles[currentIndex];
  console.log(`\nSwipe ${i + 1}:`);
  console.log(`  Current Index: ${currentIndex}`);
  console.log(`  Current Profile: ${currentProfile.name} (ID: ${currentProfile.id})`);
  
  // Simulate swipe
  currentIndex++;
  console.log(`  New Index: ${currentIndex}`);
  
  if (currentIndex < mockProfiles.length) {
    const nextProfile = mockProfiles[currentIndex];
    console.log(`  Next Profile: ${nextProfile.name} (ID: ${nextProfile.id})`);
  } else {
    console.log(`  No more profiles`);
  }
}

console.log('\n✅ Expected behavior: Each swipe shows a different profile');
console.log('❌ If you see the same profile, check:');
console.log('   1. Is currentIndex incrementing?');
console.log('   2. Are profiles array different?');
console.log('   3. Is SwipeCard re-rendering with key prop?');
