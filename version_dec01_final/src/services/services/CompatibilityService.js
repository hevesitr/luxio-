class CompatibilityService {
  // MBTI kompatibilitási mátrix
  static mbtiCompatibility = {
    'ENFP': ['INTJ', 'INFJ', 'ENFJ', 'ENTP'],
    'INFJ': ['ENFP', 'ENTP', 'INFP', 'ENFJ'],
    'ESTP': ['ISFJ', 'ISTJ', 'ESTJ', 'ESFJ'],
    'ENTJ': ['INTP', 'INTJ', 'ENFP', 'ENTP'],
    'INTJ': ['ENFP', 'ENTP', 'ENTJ', 'INFJ'],
    'ENFJ': ['INFP', 'ISFP', 'ENFP', 'INFJ'],
    'INFP': ['ENFJ', 'ENTJ', 'INFJ', 'ENFP'],
    'ESFJ': ['ISFP', 'ISTP', 'ESTP', 'ISTJ'],
    'ESFP': ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
    'ISTP': ['ESFJ', 'ESTJ', 'ESTP', 'ISFJ'],
  };

  // Csillagjegy kompatibilitás
  static zodiacCompatibility = {
    'Ikrek': ['Mérleg', 'Vízöntő', 'Oroszlán'],
    'Oroszlán': ['Nyilas', 'Ikrek', 'Mérleg'],
    'Nyilas': ['Oroszlán', 'Mérleg', 'Ikrek'],
    'Mérleg': ['Ikrek', 'Vízöntő', 'Oroszlán'],
    'Szűz': ['Bika', 'Rák', 'Skorpió'],
    'Halak': ['Rák', 'Skorpió', 'Bika'],
    'Rák': ['Hal ak', 'Skorpió', 'Szűz'],
    'Bika': ['Szűz', 'Rák', 'Halak'],
    'Skorpió': ['Rák', 'Halak', 'Szűz'],
    'Vízöntő': ['Ikrek', 'Mérleg', 'Nyilas'],
  };

  // Számítja a kompatibilitási pontszámot
  static calculateCompatibility(userProfile, matchProfile) {
    let score = 0;
    let reasons = [];

    // 1. Közös érdeklődések (max 30 pont)
    const commonInterests = this.findCommonInterests(
      userProfile.interests,
      matchProfile.interests
    );
    const interestScore = Math.min(30, commonInterests.length * 10);
    score += interestScore;
    if (commonInterests.length > 0) {
      reasons.push({
        type: 'interests',
        value: commonInterests,
        score: interestScore,
      });
    }

    // 2. MBTI kompatibilitás (max 25 pont)
    if (userProfile.mbti && matchProfile.mbti) {
      const mbtiScore = this.checkMBTICompatibility(
        userProfile.mbti,
        matchProfile.mbti
      );
      score += mbtiScore;
      if (mbtiScore > 15) {
        reasons.push({
          type: 'mbti',
          value: `${userProfile.mbti} ❤️ ${matchProfile.mbti}`,
          score: mbtiScore,
        });
      }
    }

    // 3. Csillagjegy kompatibilitás (max 20 pont)
    if (userProfile.zodiacSign && matchProfile.zodiacSign) {
      const zodiacScore = this.checkZodiacCompatibility(
        userProfile.zodiacSign,
        matchProfile.zodiacSign
      );
      score += zodiacScore;
      if (zodiacScore > 10) {
        reasons.push({
          type: 'zodiac',
          value: `${userProfile.zodiacSign} ❤️ ${matchProfile.zodiacSign}`,
          score: zodiacScore,
        });
      }
    }

    // 4. Korkülönbség (max 15 pont)
    const ageDiff = Math.abs(userProfile.age - matchProfile.age);
    const ageScore = Math.max(0, 15 - ageDiff * 2);
    score += ageScore;
    if (ageScore > 10) {
      reasons.push({
        type: 'age',
        value: `Hasonló korosztály (${userProfile.age} & ${matchProfile.age})`,
        score: ageScore,
      });
    }

    // 5. Távolság (max 10 pont)
    const distanceScore = this.calculateDistanceScore(matchProfile.distance);
    score += distanceScore;
    if (distanceScore > 5) {
      reasons.push({
        type: 'distance',
        value: `Közel vagytok (${matchProfile.distance} km)`,
        score: distanceScore,
      });
    }

    // Normalize 0-100 közé
    const finalScore = Math.min(100, Math.round(score));

    return {
      score: finalScore,
      level: this.getCompatibilityLevel(finalScore),
      reasons: reasons.sort((a, b) => b.score - a.score),
      commonInterests,
    };
  }

  // Közös érdeklődések megkeresése
  static findCommonInterests(interests1, interests2) {
    return interests1.filter(interest => interests2.includes(interest));
  }

  // MBTI kompatibilitás ellenőrzése
  static checkMBTICompatibility(mbti1, mbti2) {
    const compatible = this.mbtiCompatibility[mbti1] || [];
    if (compatible.includes(mbti2)) {
      return 25; // Tökéletes
    } else if (mbti1 === mbti2) {
      return 15; // Azonos típus
    } else if (mbti1[0] === mbti2[0]) {
      return 10; // Azonos intro/extra
    }
    return 5; // Alap pont
  }

  // Csillagjegy kompatibilitás
  static checkZodiacCompatibility(zodiac1, zodiac2) {
    const compatible = this.zodiacCompatibility[zodiac1] || [];
    if (compatible.includes(zodiac2)) {
      return 20; // Tökéletes
    } else if (zodiac1 === zodiac2) {
      return 10; // Azonos jegy
    }
    return 5; // Alap pont
  }

  // Távolság pontszám
  static calculateDistanceScore(distance) {
    if (distance <= 2) return 10;
    if (distance <= 5) return 8;
    if (distance <= 10) return 5;
    return 2;
  }

  // Kompatibilitási szint meghatározása
  static getCompatibilityLevel(score) {
    if (score >= 85) return { text: 'Tökéletes Match! 💯', color: '#4CAF50' };
    if (score >= 70) return { text: 'Nagyon Jó! ❤️', color: '#8BC34A' };
    if (score >= 55) return { text: 'Jó Esély! 💕', color: '#FFC107' };
    if (score >= 40) return { text: 'Érdemes Próbálni! 💛', color: '#FF9800' };
    return { text: 'Lehetséges Match 🤔', color: '#999' };
  }
}

export default CompatibilityService;

