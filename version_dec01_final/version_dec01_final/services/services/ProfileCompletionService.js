// Profil kitöltési százalék számítás
class ProfileCompletionService {
  static calculateCompletion(userProfile) {
    let completedFields = 0;
    let totalFields = 0;

    // Alap mezők
    const fields = [
      { key: 'name', weight: 1 },
      { key: 'age', weight: 1 },
      { key: 'photo', weight: 2 },
      { key: 'bio', weight: 2 },
      { key: 'interests', weight: 2, minLength: 3 },
      { key: 'photos', weight: 2, minLength: 3 },
      { key: 'height', weight: 1 },
      { key: 'work', weight: 1 },
      { key: 'education', weight: 1 },
      { key: 'zodiacSign', weight: 1 },
      { key: 'mbti', weight: 1 },
      { key: 'relationshipGoal', weight: 1 },
    ];

    fields.forEach(field => {
      const value = userProfile[field.key];
      const weight = field.weight || 1;
      
      totalFields += weight;
      
      if (field.minLength) {
        // Tömb vagy string hossz ellenőrzés
        if (Array.isArray(value) && value.length >= field.minLength) {
          completedFields += weight;
        } else if (typeof value === 'string' && value.length >= field.minLength) {
          completedFields += weight;
        }
      } else {
        // Egyszerű létezés ellenőrzés
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            completedFields += weight;
          } else if (!Array.isArray(value)) {
            completedFields += weight;
          }
        }
      }
    });

    const percentage = Math.round((completedFields / totalFields) * 100);
    return Math.min(100, Math.max(0, percentage));
  }

  static getCompletionMessage(percentage) {
    if (percentage >= 90) {
      return { text: 'Kiváló profil! 🎉', color: '#4CAF50' };
    } else if (percentage >= 70) {
      return { text: 'Jó profil! 👍', color: '#2196F3' };
    } else if (percentage >= 50) {
      return { text: 'Közepes profil', color: '#FF9800' };
    } else {
      return { text: 'Töltsd ki a profilod!', color: '#F44336' };
    }
  }

  static getMissingFields(userProfile) {
    const missing = [];
    
    if (!userProfile.name || userProfile.name === 'Te') {
      missing.push('Név');
    }
    if (!userProfile.age) {
      missing.push('Életkor');
    }
    if (!userProfile.photo) {
      missing.push('Profil fotó');
    }
    if (!userProfile.bio || userProfile.bio.length < 20) {
      missing.push('Bemutatkozás (min. 20 karakter)');
    }
    if (!userProfile.interests || userProfile.interests.length < 3) {
      missing.push('Érdeklődési körök (min. 3)');
    }
    if (!userProfile.photos || userProfile.photos.length < 3) {
      missing.push('Fotók (min. 3)');
    }
    if (!userProfile.height) {
      missing.push('Magasság');
    }
    if (!userProfile.work) {
      missing.push('Munka');
    }
    if (!userProfile.zodiacSign) {
      missing.push('Horoszkóp');
    }

    return missing;
  }
}

export default ProfileCompletionService;

