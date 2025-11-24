// Példa felhasználó profil
export const currentUser = {
  name: 'Te',
  age: 25,
  gender: 'male', // 'male', 'female', 'other'
  lookingFor: ['female'], // ['male', 'female', 'other'] - kit keres
  interests: ['Utazás', 'Zene', 'Sport', 'Fotózás'],
  zodiacSign: 'Oroszlán',
  mbti: 'ENFP',
  location: { latitude: 47.4979, longitude: 19.0402 }, // Budapest
  relationshipGoal: 'serious', // 'serious', 'casual', 'friends'
  communicationStyle: 'balanced', // 'frequent', 'balanced', 'occasional'
  isVerified: false,
  lastActive: new Date(),
  showOnMap: true, // Engedélyezi-e a térképen való megjelenítést
};

