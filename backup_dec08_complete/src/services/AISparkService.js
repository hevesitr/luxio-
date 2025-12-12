/**
 * AI Spark Service - Personality-based Match Prediction
 *
 * Analyzes user profiles to predict compatibility scores
 * Uses AI-powered personality matching algorithms
 */

import ErrorHandler from './ErrorHandler';
import Logger from './Logger';
import container from '../core/DIContainer';

class AISparkService {
  constructor(profileRepository = null, logger = null) {
    this.profileRepository = profileRepository || container.resolve('profileRepository');
    this.logger = logger || container.resolve('logger');
  }

  /**
   * Calculate Spark Score between two users
   * @param {string} userId - Current user ID
   * @param {string} targetUserId - Target user ID
   * @returns {Promise<Object>} Spark analysis result
   */
  async calculateSparkScore(userId, targetUserId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Get both profiles with prompts and interests
      const [userProfile, targetProfile] = await Promise.all([
        this.profileRepository.findById(userId),
        this.profileRepository.findById(targetUserId)
      ]);

      // Calculate compatibility factors
      const factors = {
        personality: this.calculatePersonalityMatch(
          userProfile.prompts || [],
          targetProfile.prompts || []
        ),
        interests: this.calculateInterestOverlap(
          userProfile.interests || [],
          targetProfile.interests || []
        ),
        lifestyle: this.calculateLifestyleMatch(
          userProfile.lifestyle || {},
          targetProfile.lifestyle || {}
        ),
        values: this.calculateValuesMatch(
          userProfile.values || [],
          targetProfile.values || []
        )
      };

      // Calculate overall score
      const overallScore = this.calculateOverallScore(factors);

      const result = {
        userId,
        targetUserId,
        score: overallScore,
        factors,
        prediction: this.getPrediction(overallScore),
        confidence: this.calculateConfidence(factors),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        calculatedAt: new Date()
      };

      this.logger.debug('Spark score calculated', {
        userId,
        targetUserId,
        score: overallScore,
        prediction: result.prediction
      });

      return result;
    }, {
      operation: 'calculateSparkScore',
      userId,
      targetUserId
    });
  }

  /**
   * Calculate personality compatibility from prompts
   * @param {Array} userPrompts - User's prompt answers
   * @param {Array} targetPrompts - Target user's prompt answers
   * @returns {number} Personality compatibility score (0-100)
   */
  calculatePersonalityMatch(userPrompts, targetPrompts) {
    if (!userPrompts.length || !targetPrompts.length) {
      return 50; // Neutral score if no prompts
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

    // Weight by number of matched questions
    const baseScore = (totalSimilarity / matchedQuestions) * 100;

    // Bonus for having many matching prompts
    const promptBonus = Math.min(matchedQuestions * 2, 20);

    return Math.min(100, baseScore + promptBonus);
  }

  /**
   * Calculate interest overlap
   * @param {Array} userInterests - User's interests
   * @param {Array} targetInterests - Target user's interests
   * @returns {number} Interest compatibility score (0-100)
   */
  calculateInterestOverlap(userInterests, targetInterests) {
    if (!userInterests.length || !targetInterests.length) {
      return 30; // Low score if no interests specified
    }

    const userSet = new Set(userInterests.map(i => i.toLowerCase()));
    const targetSet = new Set(targetInterests.map(i => i.toLowerCase()));

    const intersection = new Set([...userSet].filter(x => targetSet.has(x)));
    const union = new Set([...userSet, ...targetSet]);

    const overlapScore = (intersection.size / union.size) * 100;

    // Bonus for having many shared interests
    const sharedBonus = Math.min(intersection.size * 5, 25);

    return Math.min(100, overlapScore + sharedBonus);
  }

  /**
   * Calculate lifestyle compatibility
   * @param {Object} userLifestyle - User's lifestyle preferences
   * @param {Object} targetLifestyle - Target user's lifestyle preferences
   * @returns {number} Lifestyle compatibility score (0-100)
   */
  calculateLifestyleMatch(userLifestyle, targetLifestyle) {
    const lifestyleFactors = [
      'smoking', 'drinking', 'exercise', 'pets', 'religion',
      'relationship_goal', 'education_level', 'work_life'
    ];

    let matches = 0;
    let totalFactors = 0;

    lifestyleFactors.forEach(factor => {
      const userValue = userLifestyle[factor];
      const targetValue = targetLifestyle[factor];

      if (userValue && targetValue) {
        totalFactors++;
        if (userValue === targetValue) {
          matches += 1;
        } else if (this.areCompatibleValues(userValue, targetValue, factor)) {
          matches += 0.5; // Partial match
        }
      }
    });

    if (totalFactors === 0) return 60; // Neutral if no lifestyle data

    return (matches / totalFactors) * 100;
  }

  /**
   * Calculate values alignment
   * @param {Array} userValues - User's values
   * @param {Array} targetValues - Target user's values
   * @returns {number} Values compatibility score (0-100)
   */
  calculateValuesMatch(userValues, targetValues) {
    if (!userValues.length || !targetValues.length) {
      return 40; // Conservative score if no values specified
    }

    const userSet = new Set(userValues);
    const targetSet = new Set(targetValues);

    const intersection = new Set([...userSet].filter(x => targetSet.has(x)));

    // Values are highly important - even one shared value is significant
    if (intersection.size > 0) {
      const overlapRatio = intersection.size / Math.max(userSet.size, targetSet.size);
      return Math.min(100, 60 + (overlapRatio * 40)); // Base 60, up to 100
    }

    return 20; // Low score for no shared values
  }

  /**
   * Calculate overall compatibility score
   * @param {Object} factors - Individual factor scores
   * @returns {number} Overall score (0-100)
   */
  calculateOverallScore(factors) {
    const weights = {
      personality: 0.35,   // Most important
      interests: 0.25,     // Very important
      lifestyle: 0.25,     // Very important
      values: 0.15         // Important but flexible
    };

    return Math.round(
      Object.entries(factors).reduce((score, [factor, value]) => {
        return score + (value * weights[factor]);
      }, 0)
    );
  }

  /**
   * Get prediction category based on score
   * @param {number} score - Overall compatibility score
   * @returns {string} Prediction category
   */
  getPrediction(score) {
    if (score >= 80) return 'high_match';
    if (score >= 60) return 'medium_match';
    if (score >= 40) return 'low_match';
    return 'unlikely_match';
  }

  /**
   * Calculate confidence level of the prediction
   * @param {Object} factors - Individual factor scores
   * @returns {number} Confidence percentage (0-100)
   */
  calculateConfidence(factors) {
    // Confidence based on data completeness and consistency
    const factorCount = Object.keys(factors).length;
    const definedFactors = Object.values(factors).filter(f => f > 0).length;

    const dataCompleteness = (definedFactors / factorCount) * 100;

    // Consistency bonus (how close the factors are to each other)
    const factorValues = Object.values(factors);
    const avgFactor = factorValues.reduce((a, b) => a + b, 0) / factorValues.length;
    const variance = factorValues.reduce((acc, val) => acc + Math.pow(val - avgFactor, 2), 0) / factorValues.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    return Math.round((dataCompleteness + consistency) / 2);
  }

  /**
   * Check if two values are compatible for a given factor
   * @param {any} value1 - First value
   * @param {any} value2 - Second value
   * @param {string} factor - Lifestyle factor
   * @returns {boolean} Whether values are compatible
   */
  areCompatibleValues(value1, value2, factor) {
    // Define compatibility rules for different factors
    const compatibilityRules = {
      smoking: {
        'never': ['never', 'occasionally'],
        'occasionally': ['never', 'occasionally', 'regularly'],
        'regularly': ['occasionally', 'regularly']
      },
      drinking: {
        'never': ['never', 'occasionally'],
        'occasionally': ['never', 'occasionally', 'regularly'],
        'regularly': ['occasionally', 'regularly']
      },
      exercise: {
        'never': ['never', 'sometimes'],
        'sometimes': ['never', 'sometimes', 'regularly'],
        'regularly': ['sometimes', 'regularly']
      }
    };

    const rule = compatibilityRules[factor];
    return rule && rule[value1]?.includes(value2);
  }

  /**
   * Calculate text similarity using Jaccard similarity
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    // Simple word-based similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Get spark score insights for detailed analysis
   * @param {Object} sparkResult - Spark calculation result
   * @returns {Array} Insights array
   */
  getInsights(sparkResult) {
    const insights = [];

    const { factors, score } = sparkResult;

    // Personality insights
    if (factors.personality >= 80) {
      insights.push({
        type: 'personality',
        title: 'Kiváló személyiség egyezés',
        description: 'A személyiségjegyeitek nagyon hasonlóak',
        impact: 'high'
      });
    }

    // Interests insights
    if (factors.interests >= 75) {
      insights.push({
        type: 'interests',
        title: 'Közös érdeklődési kör',
        description: 'Sok közös hobby és érdeklődés',
        impact: 'high'
      });
    }

    // Lifestyle insights
    if (factors.lifestyle >= 70) {
      insights.push({
        type: 'lifestyle',
        title: 'Hasonló életstílus',
        description: 'Kompatibilis életviteli szokások',
        impact: 'medium'
      });
    }

    // Values insights
    if (factors.values >= 60) {
      insights.push({
        type: 'values',
        title: 'Megfelelő értékek',
        description: 'Hasonló alapértékek és prioritások',
        impact: 'medium'
      });
    }

    return insights;
  }
}

// Register with DI container
container.registerFactory('aiSparkService', () => new AISparkService());

export default AISparkService;
