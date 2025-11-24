import { profiles } from '../data/profiles';

class AIRecommendationService {
  /**
   * AI alapú találatok ajánlása jellemzés alapján
   * @param {string} description - A leendő pár jellemzése
   * @param {object} userProfile - Az aktuális felhasználó profilja
   * @returns {Array} Ajánlott profilok pontszámmal
   */
  static getRecommendations(description, userProfile) {
    if (!description || description.trim().length === 0) {
      return [];
    }

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return [];
    }

    const descriptionLower = description.toLowerCase();
    const keywords = this.extractKeywords(descriptionLower);
    const recommendations = [];

    // Kinyerjük a speciális preferenciákat
    const relationshipGoal = this.extractRelationshipGoal(descriptionLower);
    const location = this.extractLocation(descriptionLower);

    profiles.forEach(profile => {
      let score = 0;
      const profileText = this.getProfileText(profile).toLowerCase();

      // Kapcsolati cél egyezés (magas prioritás)
      if (relationshipGoal) {
        if (profile.relationshipGoal === relationshipGoal) {
          score += 50; // Magas pontszám ha egyezik
        } else {
          score -= 20; // Levonás ha nem egyezik
        }
      }

      // Helyszín egyezés (magas prioritás)
      if (location) {
        const profileLocation = this.getProfileLocation(profile);
        if (profileLocation && profileLocation.toLowerCase().includes(location.toLowerCase())) {
          score += 40; // Magas pontszám ha egyezik a helyszín
        } else {
          score -= 15; // Levonás ha nem egyezik
        }
      }

      // Kulcsszavak alapján pontszám
      keywords.forEach(keyword => {
        if (profileText.includes(keyword)) {
          score += 10;
        }
      });

      // Kompatibilitás alapján bónusz pontok
      const compatibility = this.calculateCompatibility(userProfile, profile);
      score += compatibility * 0.3;

      // Kor alapján pontszám (ha van kor preferencia)
      if (this.matchesAgePreference(description, profile.age)) {
        score += 15;
      }

      // Távolság alapján (közelebbi = jobb)
      if (profile.distance && profile.distance < 10) {
        score += 5;
      }

      // Verifikált profilok előnyben
      if (profile.isVerified) {
        score += 10;
      }

      // Csak akkor adjuk hozzá, ha pozitív pontszáma van
      if (score > 0) {
        recommendations.push({
          profile,
          score: Math.min(100, Math.round(score)),
          reasons: this.generateReasons(profile, keywords, description, relationshipGoal, location),
        });
      }
    });

    // Rendezés pontszám szerint csökkenő sorrendben
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  /**
   * Kulcsszavak kinyerése a leírásból
   */
  static extractKeywords(text) {
    const stopWords = ['a', 'az', 'és', 'vagy', 'hogy', 'mert', 'de', 'van', 'lesz', 'volt', 'lenne'];
    const words = text
      .replace(/[^\w\sáéíóöőúüű]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    return [...new Set(words)]; // Egyedi kulcsszavak
  }

  /**
   * Profil szöveg összeállítása kereséshez
   */
  static getProfileText(profile) {
    return [
      profile.name,
      profile.bio || '',
      profile.interests?.join(' ') || '',
      profile.relationshipGoal || '',
      profile.work?.title || '',
      profile.work?.company || '',
      profile.education?.school || '',
      profile.prompts?.map(p => `${p.question} ${p.answer}`).join(' ') || '',
    ].join(' ');
  }

  /**
   * Kompatibilitás számítása
   */
  static calculateCompatibility(userProfile, profile) {
    let score = 50; // Alap pontszám

    // Közös érdeklődések
    if (userProfile.interests && profile.interests) {
      const commonInterests = userProfile.interests.filter(interest =>
        profile.interests.includes(interest)
      );
      score += commonInterests.length * 5;
    }

    // Kapcsolat célja egyezés
    if (userProfile.relationshipGoal === profile.relationshipGoal) {
      score += 20;
    }

    // Kor kompatibilitás (5 év különbség = optimális)
    const ageDiff = Math.abs((userProfile.age || 25) - profile.age);
    if (ageDiff <= 5) {
      score += 10;
    } else if (ageDiff <= 10) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Kor preferencia egyezés
   */
  static matchesAgePreference(description, age) {
    const agePatterns = [
      { pattern: /(\d+)\s*éves/i, extract: (match) => parseInt(match[1]) },
      { pattern: /fiatal/i, check: (age) => age < 30 },
      { pattern: /idős|érett/i, check: (age) => age > 35 },
      { pattern: /középkorú/i, check: (age) => age >= 30 && age <= 40 },
    ];

    for (const { pattern, extract, check } of agePatterns) {
      const match = description.match(pattern);
      if (match) {
        if (extract) {
          const targetAge = extract(match);
          return Math.abs(age - targetAge) <= 3;
        }
        if (check) {
          return check(age);
        }
      }
    }

    return false;
  }

  /**
   * Kapcsolati cél kinyerése a leírásból
   */
  static extractRelationshipGoal(description) {
    if (description.includes('laza') || description.includes('casual')) {
      return 'casual';
    }
    if (description.includes('komoly') || description.includes('serious') || description.includes('hosszú távú')) {
      return 'serious';
    }
    if (description.includes('barátság') || description.includes('friends') || description.includes('barát')) {
      return 'friends';
    }
    return null;
  }

  /**
   * Helyszín kinyerése a leírásból
   */
  static extractLocation(description) {
    // Gyakori magyar városok
    const cities = ['budapest', 'debrecen', 'szeged', 'miskolc', 'pécs', 'győr', 'nyíregyháza', 'kecskemét', 'székesfehérvár', 'szombathely'];
    
    for (const city of cities) {
      if (description.includes(city)) {
        return city;
      }
    }
    
    // Ha nincs konkrét város, próbáljuk kinyerni más módon
    const locationMatch = description.match(/(\w+)\s*(város|környék|közel)/i);
    if (locationMatch) {
      return locationMatch[1].toLowerCase();
    }
    
    return null;
  }

  /**
   * Profil helyszínének meghatározása
   */
  static getProfileLocation(profile) {
    // Ha van location objektum, próbáljuk kinyerni a várost
    if (profile.location) {
      const lat = profile.location.latitude;
      const lon = profile.location.longitude;
      
      // Budapest koordináták alapján (47.4-47.6, 19.0-19.2)
      if (lat >= 47.4 && lat <= 47.6 && lon >= 19.0 && lon <= 19.2) {
        return 'budapest';
      }
      
      // Debrecen koordináták (47.5, 21.6)
      if (lat >= 47.4 && lat <= 47.6 && lon >= 21.5 && lon <= 21.7) {
        return 'debrecen';
      }
      
      // Szeged koordináták (46.25, 20.15)
      if (lat >= 46.2 && lat <= 46.3 && lon >= 20.1 && lon <= 20.2) {
        return 'szeged';
      }
      
      // Miskolc koordináták (48.1, 20.8)
      if (lat >= 48.0 && lat <= 48.2 && lon >= 20.7 && lon <= 20.9) {
        return 'miskolc';
      }
      
      // Pécs koordináták (46.07, 18.23)
      if (lat >= 46.0 && lat <= 46.15 && lon >= 18.2 && lon <= 18.3) {
        return 'pécs';
      }
      
      // Ha van distance és location, akkor valószínűleg Budapest környéke
      if (profile.distance !== undefined) {
        return 'budapest';
      }
    }
    
    // Alapértelmezett: Budapest (mert a legtöbb profil ott van)
    return 'budapest';
  }

  /**
   * Ajánlás indokok generálása
   */
  static generateReasons(profile, keywords, description, relationshipGoal, location) {
    const reasons = [];

    // Kapcsolati cél egyezés
    if (relationshipGoal && profile.relationshipGoal === relationshipGoal) {
      const goalText = {
        serious: 'Komoly kapcsolatot keres',
        casual: 'Laza kapcsolatot keres',
        friends: 'Barátságot keres',
      };
      reasons.push(goalText[relationshipGoal] || relationshipGoal);
    }

    // Helyszín egyezés
    if (location) {
      const profileLocation = this.getProfileLocation(profile);
      if (profileLocation && profileLocation.toLowerCase().includes(location.toLowerCase())) {
        reasons.push(`${location.charAt(0).toUpperCase() + location.slice(1)} környéke`);
      }
    }

    // Kulcsszó egyezések
    const matchedKeywords = keywords.filter(kw =>
      this.getProfileText(profile).toLowerCase().includes(kw)
    );
    if (matchedKeywords.length > 0) {
      reasons.push(`Egyezik: ${matchedKeywords.slice(0, 3).join(', ')}`);
    }

    // Közös érdeklődések
    if (profile.interests && profile.interests.length > 0) {
      reasons.push(`Érdeklődés: ${profile.interests.slice(0, 2).join(', ')}`);
    }

    // Távolság
    if (profile.distance) {
      reasons.push(`${profile.distance} km-re`);
    }

    return reasons.slice(0, 3);
  }
}

export default AIRecommendationService;

