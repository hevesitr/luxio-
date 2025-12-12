/**
 * Compatibility Rainbow Service - Multi-Dimensional Match Analysis
 *
 * Advanced compatibility analysis using rainbow visualization
 * Each color represents a different compatibility dimension
 */

import ErrorHandler from './ErrorHandler';
import Logger from './Logger';
import container from '../core/DIContainer';

class CompatibilityRainbowService {
  constructor(profileRepository = null, logger = null) {
    this.profileRepository = profileRepository || container.resolve('profileRepository');
    this.logger = logger || container.resolve('logger');
  }

  /**
   * Calculate full compatibility rainbow for two users
   * @param {string} userId - First user ID
   * @param {string} targetUserId - Second user ID
   * @returns {Promise<Object>} Rainbow compatibility analysis
   */
  async calculateRainbowCompatibility(userId, targetUserId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Get both profiles with full data
      const [userProfile, targetProfile] = await Promise.all([
        this.profileRepository.findById(userId),
        this.profileRepository.findById(targetUserId)
      ]);

      // Calculate all rainbow dimensions
      const rainbow = {
        chemistry: this.calculateChemistry(userProfile, targetProfile),
        lifestyle: this.calculateLifestyle(userProfile, targetProfile),
        values: this.calculateValues(userProfile, targetProfile),
        interests: this.calculateInterests(userProfile, targetProfile),
        communication: this.calculateCommunication(userProfile, targetProfile),
        longTerm: this.calculateLongTerm(userProfile, targetProfile),
        adventure: this.calculateAdventure(userProfile, targetProfile),
        growth: this.calculateGrowth(userProfile, targetProfile)
      };

      // Calculate overall metrics
      const overallScore = this.calculateOverallScore(rainbow);
      const confidence = this.calculateConfidence(rainbow);

      const result = {
        userId,
        targetUserId,
        rainbow,
        overallScore,
        confidence,
        summary: this.generateSummary(rainbow, overallScore),
        insights: this.generateDetailedInsights(rainbow, userProfile, targetProfile),
        strengths: this.identifyStrengths(rainbow),
        growthAreas: this.identifyGrowthAreas(rainbow),
        compatibility: this.getCompatibilityLevel(overallScore),
        calculatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      this.logger.info('Rainbow compatibility calculated', {
        userId,
        targetUserId,
        overallScore,
        compatibility: result.compatibility
      });

      return result;
    }, {
      operation: 'calculateRainbowCompatibility',
      userId,
      targetUserId
    });
  }

  /**
   * Calculate chemistry/attractiveness compatibility
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Chemistry score (0-100)
   */
  calculateChemistry(user, target) {
    let score = 50; // Base attraction

    // Age difference factor (closer ages = higher chemistry)
    const ageDiff = Math.abs((user.age || 25) - (target.age || 25));
    const ageFactor = Math.max(0, 100 - ageDiff * 3); // Max 30 years difference
    score = (score + ageFactor) / 2;

    // Location proximity (closer = higher chemistry)
    if (user.location && target.location) {
      const distance = this.calculateDistance(
        user.location.latitude || user.location.lat,
        user.location.longitude || user.location.lng,
        target.location.latitude || target.location.lat,
        target.location.longitude || target.location.lng
      );
      const proximityBonus = Math.max(0, 100 - distance * 2); // Closer = better
      score = (score + proximityBonus) / 2;
    }

    // Photo quality/quantity bonus (more photos = more attractive)
    const userPhotos = (user.photos || []).length;
    const targetPhotos = (target.photos || []).length;
    const photoBonus = Math.min(20, (userPhotos + targetPhotos) * 2);
    score += photoBonus / 2;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate lifestyle compatibility
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Lifestyle score (0-100)
   */
  calculateLifestyle(user, target) {
    const lifestyleFactors = [
      'smoking', 'drinking', 'exercise', 'pets', 'religion',
      'relationship_goal', 'education_level', 'work_life_balance'
    ];

    let matches = 0;
    let totalFactors = 0;

    lifestyleFactors.forEach(factor => {
      const userValue = user.lifestyle?.[factor];
      const targetValue = target.lifestyle?.[factor];

      if (userValue && targetValue) {
        totalFactors++;
        if (userValue === targetValue) {
          matches += 1;
        } else if (this.areCompatibleLifestyleChoices(userValue, targetValue, factor)) {
          matches += 0.5; // Partial compatibility
        }
      }
    });

    if (totalFactors === 0) return 60; // Neutral when no data

    const baseScore = (matches / totalFactors) * 100;

    // Bonus for having compatible social habits
    const socialBonus = totalFactors >= 3 ? 10 : 0;

    return Math.min(100, Math.round(baseScore + socialBonus));
  }

  /**
   * Calculate values alignment
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Values score (0-100)
   */
  calculateValues(user, target) {
    const userValues = user.values || [];
    const targetValues = target.values || [];

    if (!userValues.length || !targetValues.length) {
      return 40; // Conservative score when no values specified
    }

    const userSet = new Set(userValues);
    const targetSet = new Set(targetValues);
    const intersection = new Set([...userSet].filter(x => targetSet.has(x)));

    // Values are highly important
    if (intersection.size > 0) {
      const overlapRatio = intersection.size / Math.max(userSet.size, targetSet.size);
      return Math.min(100, Math.round(50 + (overlapRatio * 50)));
    }

    // No shared values - but don't penalize too harshly
    return 25;
  }

  /**
   * Calculate interests overlap
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Interests score (0-100)
   */
  calculateInterests(user, target) {
    const userInterests = user.interests || [];
    const targetInterests = target.interests || [];

    if (!userInterests.length || !targetInterests.length) {
      return 30; // Low score when interests not specified
    }

    const userSet = new Set(userInterests.map(i => i.toLowerCase()));
    const targetSet = new Set(targetInterests.map(i => i.toLowerCase()));

    const intersection = new Set([...userSet].filter(x => targetSet.has(x)));
    const union = new Set([...userSet, ...targetSet]);

    const overlapScore = (intersection.size / union.size) * 100;

    // Bonus for shared interests
    const sharedBonus = Math.min(25, intersection.size * 5);

    return Math.min(100, Math.round(overlapScore + sharedBonus));
  }

  /**
   * Calculate communication compatibility
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Communication score (0-100)
   */
  calculateCommunication(user, target) {
    const userPrompts = user.prompts || [];
    const targetPrompts = target.prompts || [];

    if (!userPrompts.length || !targetPrompts.length) {
      return 50; // Neutral when no prompts
    }

    let totalSimilarity = 0;
    let matchedQuestions = 0;

    // Find matching questions and compare answers
    userPrompts.forEach(userPrompt => {
      const targetPrompt = targetPrompts.find(tp =>
        tp.question === userPrompt.question
      );

      if (targetPrompt) {
        const similarity = this.calculateTextSimilarity(
          userPrompt.answer,
          targetPrompt.answer
        );
        totalSimilarity += similarity;
        matchedQuestions++;
      }
    });

    if (matchedQuestions === 0) return 50;

    const baseScore = (totalSimilarity / matchedQuestions) * 100;

    // Bonus for having detailed, thoughtful answers
    const detailBonus = Math.min(20, matchedQuestions * 3);

    return Math.min(100, Math.round(baseScore + detailBonus));
  }

  /**
   * Calculate long-term potential
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Long-term score (0-100)
   */
  calculateLongTerm(user, target) {
    // Long-term compatibility is a weighted combination of other factors
    const factors = [
      this.calculateValues(user, target) * 0.30,     // Values most important
      this.calculateLifestyle(user, target) * 0.25,  // Lifestyle compatibility
      this.calculateCommunication(user, target) * 0.20, // Communication
      this.calculateGrowth(user, target) * 0.15,     // Growth potential
      this.calculateInterests(user, target) * 0.10   // Shared interests
    ];

    const baseScore = factors.reduce((sum, factor) => sum + factor, 0);

    // Age compatibility bonus for long-term (similar life stages)
    const ageDiff = Math.abs((user.age || 25) - (target.age || 25));
    const ageBonus = ageDiff <= 5 ? 10 : ageDiff <= 10 ? 5 : 0;

    return Math.min(100, Math.round(baseScore + ageBonus));
  }

  /**
   * Calculate adventure compatibility
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Adventure score (0-100)
   */
  calculateAdventure(user, target) {
    // Adventure compatibility based on interests and lifestyle
    const adventureKeywords = [
      'utazás', 'kaland', 'sport', 'hegymászás', 'búvárkodás',
      'hiking', 'camping', 'surfing', 'skiing', 'diving'
    ];

    const userAdventureScore = this.countKeywordMatches(
      user.interests || [], adventureKeywords
    );
    const targetAdventureScore = this.countKeywordMatches(
      target.interests || [], adventureKeywords
    );

    const combinedScore = (userAdventureScore + targetAdventureScore) / 2;

    // Lifestyle factors (exercise, spontaneity)
    const userActive = user.lifestyle?.exercise === 'regularly' ? 1 : 0.5;
    const targetActive = target.lifestyle?.exercise === 'regularly' ? 1 : 0.5;

    const lifestyleFactor = (userActive + targetActive) / 2;

    return Math.min(100, Math.round(combinedScore * lifestyleFactor * 100));
  }

  /**
   * Calculate personal growth compatibility
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {number} Growth score (0-100)
   */
  calculateGrowth(user, target) {
    // Growth compatibility based on education, learning interests, values
    let score = 50; // Base score

    // Education level compatibility
    const educationLevels = ['high_school', 'bachelor', 'master', 'phd'];
    const userEdu = user.lifestyle?.education_level;
    const targetEdu = target.lifestyle?.education_level;

    if (userEdu && targetEdu) {
      const userIndex = educationLevels.indexOf(userEdu);
      const targetIndex = educationLevels.indexOf(targetEdu);
      const educationDiff = Math.abs(userIndex - targetIndex);

      // Similar education levels are better for growth
      score += Math.max(0, 20 - educationDiff * 5);
    }

    // Learning interests
    const learningKeywords = [
      'olvasás', 'tanulás', 'fejlesztés', 'karrier', 'önfejlesztés',
      'reading', 'learning', 'development', 'career', 'self_improvement'
    ];

    const userLearning = this.countKeywordMatches(
      user.interests || [], learningKeywords
    );
    const targetLearning = this.countKeywordMatches(
      target.interests || [], learningKeywords
    );

    score += (userLearning + targetLearning) * 10;

    // Values related to growth
    const growthValues = ['ambition', 'learning', 'personal_growth', 'career_focused'];
    const userGrowthValues = (user.values || []).filter(v => growthValues.includes(v)).length;
    const targetGrowthValues = (target.values || []).filter(v => growthValues.includes(v)).length;

    score += (userGrowthValues + targetGrowthValues) * 5;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate overall rainbow score
   * @param {Object} rainbow - All rainbow dimensions
   * @returns {number} Overall score (0-100)
   */
  calculateOverallScore(rainbow) {
    const weights = {
      chemistry: 0.15,     // Initial attraction
      lifestyle: 0.15,     // Day-to-day compatibility
      values: 0.20,        // Core alignment
      interests: 0.15,     // Shared activities
      communication: 0.15, // How you connect
      longTerm: 0.10,      // Future potential
      adventure: 0.05,     // Fun factor
      growth: 0.05         // Development potential
    };

    return Math.round(
      Object.entries(rainbow).reduce((score, [dimension, value]) => {
        return score + (value * weights[dimension]);
      }, 0)
    );
  }

  /**
   * Calculate confidence in the analysis
   * @param {Object} rainbow - All rainbow dimensions
   * @returns {number} Confidence percentage (0-100)
   */
  calculateConfidence(rainbow) {
    const factors = Object.values(rainbow);
    const definedFactors = factors.filter(f => f > 0).length;
    const totalFactors = factors.length;

    // Data completeness
    const completeness = (definedFactors / totalFactors) * 100;

    // Consistency (how close factors are to each other)
    const avgFactor = factors.reduce((a, b) => a + b, 0) / factors.length;
    const variance = factors.reduce((acc, val) => acc + Math.pow(val - avgFactor, 2), 0) / factors.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance) * 2);

    return Math.round((completeness + consistency) / 2);
  }

  /**
   * Get compatibility level description
   * @param {number} score - Overall score
   * @returns {string} Compatibility level
   */
  getCompatibilityLevel(score) {
    if (score >= 85) return 'exceptional_match';
    if (score >= 75) return 'strong_match';
    if (score >= 65) return 'good_match';
    if (score >= 55) return 'moderate_match';
    if (score >= 45) return 'fair_match';
    return 'challenging_match';
  }

  /**
   * Generate summary description
   * @param {Object} rainbow - Rainbow data
   * @param {number} overallScore - Overall score
   * @returns {string} Summary text
   */
  generateSummary(rainbow, overallScore) {
    const level = this.getCompatibilityLevel(overallScore);
    const topStrengths = this.identifyStrengths(rainbow).slice(0, 2);

    const summaries = {
      exceptional_match: `Kivételes összhang! ${topStrengths.join(' és ')} területeken remekül illeszkedtek.`,
      strong_match: `Erős kompatibilitás ${topStrengths.join(' és ')} területén. Nagyszerű alap!`,
      good_match: `Jó összhang ${topStrengths.join(' és ')} területén, érdemes megismerni.`,
      moderate_match: `Mérsékelt összhang. Vannak közös pontok, de fejlődésre szorulnak más területek.`,
      fair_match: `Megfelelő alap. Néhány terület erős, másokban kompromisszumra lehet szükség.`,
      challenging_match: `Kihívásokkal teli kapcsolat. Megéri alaposan átgondolni.`
    };

    return summaries[level] || summaries.moderate_match;
  }

  /**
   * Generate detailed insights
   * @param {Object} rainbow - Rainbow data
   * @param {Object} user - User profile
   * @param {Object} target - Target profile
   * @returns {Array} Insights array
   */
  generateDetailedInsights(rainbow, user, target) {
    const insights = [];

    // Chemistry insights
    if (rainbow.chemistry >= 80) {
      insights.push({
        dimension: 'chemistry',
        type: 'strength',
        title: 'Kiváló kémia',
        description: 'Az életkor és helyszín alapján erős kezdeti vonzalom.',
        color: 'red'
      });
    }

    // Values insights
    if (rainbow.values >= 75) {
      const sharedValues = (user.values || []).filter(v =>
        (target.values || []).includes(v)
      );
      insights.push({
        dimension: 'values',
        type: 'strength',
        title: 'Hasonló értékek',
        description: `Közös értékek: ${sharedValues.slice(0, 2).join(', ')}`,
        color: 'yellow'
      });
    }

    // Communication insights
    if (rainbow.communication >= 70) {
      insights.push({
        dimension: 'communication',
        type: 'strength',
        title: 'Jó kommunikáció',
        description: 'A válaszaitok alapján hasonló gondolkodásmód.',
        color: 'blue'
      });
    }

    // Long-term insights
    if (rainbow.longTerm >= 80) {
      insights.push({
        dimension: 'longTerm',
        type: 'strength',
        title: 'Hosszú távú potenciál',
        description: 'Erős alap hosszú távú kapcsolatban.',
        color: 'purple'
      });
    }

    // Growth insights
    if (rainbow.growth >= 75) {
      insights.push({
        dimension: 'growth',
        type: 'opportunity',
        title: 'Fejlődési lehetőség',
        description: 'Együtt nőhettek és fejlődhettek.',
        color: 'green'
      });
    }

    return insights;
  }

  /**
   * Identify rainbow strengths
   * @param {Object} rainbow - Rainbow data
   * @returns {Array} Strength dimensions
   */
  identifyStrengths(rainbow) {
    return Object.entries(rainbow)
      .filter(([_, score]) => score >= 70)
      .sort(([, a], [, b]) => b - a)
      .map(([dimension, _]) => dimension);
  }

  /**
   * Identify growth areas
   * @param {Object} rainbow - Rainbow data
   * @returns {Array} Growth area dimensions
   */
  identifyGrowthAreas(rainbow) {
    return Object.entries(rainbow)
      .filter(([_, score]) => score < 60)
      .sort(([, a], [, b]) => a - b)
      .map(([dimension, _]) => dimension);
  }

  /**
   * Check if lifestyle choices are compatible
   * @param {any} value1 - First value
   * @param {any} value2 - Second value
   * @param {string} factor - Lifestyle factor
   * @returns {boolean} Whether compatible
   */
  areCompatibleLifestyleChoices(value1, value2, factor) {
    const compatibilityRules = {
      smoking: {
        'never': ['never', 'occasionally'],
        'occasionally': ['never', 'occasionally', 'regularly'],
        'regularly': ['occasionally', 'regularly']
      },
      drinking: {
        'never': ['never', 'occasionally'],
        'occasionally': ['never', 'occasionally', 'socially'],
        'socially': ['occasionally', 'socially', 'regularly'],
        'regularly': ['socially', 'regularly']
      },
      exercise: {
        'never': ['never', 'sometimes'],
        'sometimes': ['never', 'sometimes', 'regularly'],
        'regularly': ['sometimes', 'regularly']
      }
    };

    return compatibilityRules[factor]?.[value1]?.includes(value2) || false;
  }

  /**
   * Count keyword matches in interest list
   * @param {Array} interests - Interest list
   * @param {Array} keywords - Keywords to match
   * @returns {number} Match ratio (0-1)
   */
  countKeywordMatches(interests, keywords) {
    const matches = interests.filter(interest =>
      keywords.some(keyword =>
        interest.toLowerCase().includes(keyword.toLowerCase())
      )
    ).length;

    return matches / Math.max(1, interests.length);
  }

  /**
   * Calculate text similarity
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate distance between coordinates
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get rainbow color for dimension
   * @param {string} dimension - Rainbow dimension
   * @returns {string} Color name
   */
  getRainbowColor(dimension) {
    const colorMap = {
      chemistry: 'red',
      lifestyle: 'orange',
      values: 'yellow',
      interests: 'green',
      communication: 'blue',
      longTerm: 'purple',
      adventure: 'pink',
      growth: 'teal'
    };

    return colorMap[dimension] || 'gray';
  }

  /**
   * Get rainbow dimension description
   * @param {string} dimension - Rainbow dimension
   * @returns {string} Human readable description
   */
  getDimensionDescription(dimension) {
    const descriptions = {
      chemistry: 'Kezdeti vonzalom és kémia',
      lifestyle: 'Mindennapi szokások és életstílus',
      values: 'Alapvető értékek és prioritások',
      interests: 'Közös érdeklődési körök',
      communication: 'Kommunikációs stílus és gondolkodás',
      longTerm: 'Hosszú távú kapcsolat potenciálja',
      adventure: 'Kalandvágy és új élmények szeretete',
      growth: 'Személyes fejlődés és közös növekedés'
    };

    return descriptions[dimension] || dimension;
  }
}

// Register with DI container
container.registerFactory('compatibilityRainbowService', () => new CompatibilityRainbowService());

export default CompatibilityRainbowService;
