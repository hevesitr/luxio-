/**
 * Smart Date Service - AI-Powered Date Planning
 *
 * Generates personalized date suggestions based on user profiles,
 * preferences, location, and real-time data
 */

import ErrorHandler from './ErrorHandler';
import Logger from './Logger';
import container from '../core/DIContainer';

class SmartDateService {
  constructor(profileRepository = null, logger = null) {
    this.profileRepository = profileRepository || container.resolve('profileRepository');
    this.logger = logger || container.resolve('logger');
  }

  /**
   * Get personalized date suggestions for user
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Personalized date suggestions
   */
  async getPersonalizedSuggestions(userId, preferences = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      const {
        location,
        mood = 'casual',
        budget = 'medium',
        timeOfDay = 'evening',
        groupSize = 2,
        interests = []
      } = preferences;

      // Get user profile for personalization
      const userProfile = await this.profileRepository.findById(userId);

      // Analyze user preferences from profile
      const analysis = await this.analyzeUserPreferences(userProfile, preferences);

      // Get location-based suggestions
      const suggestions = await this.generateLocationBasedSuggestions(
        location || userProfile.location,
        analysis,
        preferences
      );

      // Rank and filter suggestions
      const rankedSuggestions = await this.rankAndFilterSuggestions(
        suggestions,
        userProfile,
        analysis
      );

      this.logger.info('Smart date suggestions generated', {
        userId,
        suggestionCount: rankedSuggestions.length,
        topSuggestion: rankedSuggestions[0]?.name
      });

      return rankedSuggestions.slice(0, 8); // Return top 8
    }, {
      operation: 'getPersonalizedSuggestions',
      userId,
      preferences
    });
  }

  /**
   * Analyze user preferences from profile data
   * @param {Object} profile - User profile
   * @param {Object} preferences - Explicit preferences
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeUserPreferences(profile, preferences) {
    const interests = profile.interests || [];
    const prompts = profile.prompts || [];

    // Extract preferences from interests
    const categories = this.mapInterestsToCategories(interests);

    // Analyze prompts for date preferences
    const promptAnalysis = this.analyzePromptsForDatePrefs(prompts);

    // Combine explicit and implicit preferences
    const combinedCategories = [
      ...new Set([
        ...categories,
        ...promptAnalysis.categories,
        ...(preferences.interests || [])
      ])
    ];

    return {
      categories: combinedCategories,
      budget: preferences.budget || promptAnalysis.budget || 'medium',
      ambiance: promptAnalysis.ambiance || 'casual',
      activityTypes: promptAnalysis.activityTypes || ['food', 'cultural', 'outdoor'],
      dietaryRestrictions: promptAnalysis.dietary || [],
      accessibility: preferences.accessibility || 'standard'
    };
  }

  /**
   * Generate location-based suggestions
   * @param {Object} location - User location
   * @param {Object} analysis - User preference analysis
   * @param {Object} preferences - Additional preferences
   * @returns {Promise<Array>} Location-based suggestions
   */
  async generateLocationBasedSuggestions(location, analysis, preferences) {
    // In a real implementation, this would integrate with:
    // - Google Places API
    // - Foursquare API
    // - Local business databases
    // - User-generated content

    // For now, return curated suggestions based on categories
    const allSuggestions = this.getCuratedSuggestions();

    return allSuggestions.filter(suggestion => {
      // Location proximity (simplified)
      if (location && suggestion.location) {
        const distance = this.calculateDistance(
          location.latitude || location.lat,
          location.longitude || location.lng,
          suggestion.location.lat,
          suggestion.location.lng
        );
        if (distance > 20) return false; // Max 20km
      }

      // Category match
      const hasMatchingCategory = analysis.categories.some(cat =>
        suggestion.categories.includes(cat)
      );
      if (!hasMatchingCategory && analysis.categories.length > 0) return false;

      // Budget match
      if (preferences.budget && suggestion.budget !== preferences.budget) {
        if (preferences.budget === 'free' && suggestion.budget !== 'free') return false;
        if (preferences.budget === 'low' && suggestion.budget === 'high') return false;
      }

      return true;
    });
  }

  /**
   * Rank and filter suggestions based on user profile
   * @param {Array} suggestions - Raw suggestions
   * @param {Object} profile - User profile
   * @param {Object} analysis - Preference analysis
   * @returns {Promise<Array>} Ranked suggestions
   */
  async rankAndFilterSuggestions(suggestions, profile, analysis) {
    return suggestions.map(suggestion => ({
      ...suggestion,
      score: this.calculateSuggestionScore(suggestion, profile, analysis),
      reasoning: this.generateSuggestionReasoning(suggestion, profile, analysis),
      matchFactors: this.calculateMatchFactors(suggestion, profile, analysis)
    }))
    .sort((a, b) => b.score - a.score);
  }

  /**
   * Get curated suggestions database
   * @returns {Array} Curated date suggestions
   */
  getCuratedSuggestions() {
    return [
      // Romantic suggestions
      {
        id: 'romantic_park',
        name: 'Romantikus séta a Városligetben',
        type: 'romantic',
        categories: ['outdoor', 'nature', 'walking'],
        budget: 'free',
        location: { lat: 47.5155, lng: 19.0771 },
        duration: '2-3 óra',
        bestTime: 'délután',
        rating: 4.5,
        reviews: 1250,
        description: 'Kézen fogva sétálni a fák alatt, elmerülni a természetben.',
        tips: ['Vigyél pokrócot piknikezéshez', 'Este a világítás gyönyörű'],
        accessibility: 'wheelchair_friendly'
      },
      {
        id: 'cafe_intimate',
        name: 'Intim kávéház a belvárosban',
        type: 'romantic',
        categories: ['food', 'cafe', 'indoor'],
        budget: 'low',
        location: { lat: 47.4979, lng: 19.0402 },
        duration: '1-2 óra',
        bestTime: 'délután',
        rating: 4.7,
        reviews: 890,
        description: 'Egy csendes kávéház sarokban, ahol órákig lehet beszélgetni.',
        tips: ['Foglalj asztalt előre', 'Próbáld a házi süteményeket'],
        accessibility: 'standard'
      },

      // Adventurous suggestions
      {
        id: 'adventure_hiking',
        name: 'Kirándulás a Normafa erdőben',
        type: 'adventurous',
        categories: ['outdoor', 'hiking', 'nature'],
        budget: 'free',
        location: { lat: 47.4967, lng: 18.9914 },
        duration: '3-4 óra',
        bestTime: 'délelőtt',
        rating: 4.3,
        reviews: 756,
        description: 'Fedezd fel Budapest erdőit, élvezd a friss levegőt.',
        tips: ['Vigyél vizet és kényelmes cipőt', 'Ellenőrizd az időjárást'],
        accessibility: 'moderate'
      },
      {
        id: 'escape_room',
        name: 'Kalandos escape room élmény',
        type: 'adventurous',
        categories: ['indoor', 'gaming', 'teamwork'],
        budget: 'medium',
        location: { lat: 47.5000, lng: 19.0500 },
        duration: '1 óra',
        bestTime: 'este',
        rating: 4.6,
        reviews: 543,
        description: 'Együtt oldjatok meg rejtvényeket időre.',
        tips: ['Válasszatok nehézségi szintet', 'Kommunikáció kulcsfontosságú'],
        accessibility: 'standard'
      },

      // Cultural suggestions
      {
        id: 'museum_date',
        name: 'Múzeum látogatás kézen fogva',
        type: 'cultural',
        categories: ['museum', 'art', 'educational'],
        budget: 'low',
        location: { lat: 47.4994, lng: 19.0607 },
        duration: '2-3 óra',
        bestTime: 'délután',
        rating: 4.4,
        reviews: 1234,
        description: 'Fedezd fel a művészetet és kultúrát együtt.',
        tips: ['Vegyél audio guide-ot', 'Pihenj le a kávézóban'],
        accessibility: 'wheelchair_friendly'
      },
      {
        id: 'theater_night',
        name: 'Színház este romantikus hangulatban',
        type: 'cultural',
        categories: ['theater', 'performing_arts', 'elegant'],
        budget: 'high',
        location: { lat: 47.4983, lng: 19.0489 },
        duration: '2-3 óra',
        bestTime: 'este',
        rating: 4.8,
        reviews: 987,
        description: 'Egy estélyi ruha és egy jó előadás - tökéletes párosítás.',
        tips: ['Foglalj jó helyeket előre', 'Igyál pezsgőt a szünetben'],
        accessibility: 'wheelchair_friendly'
      },

      // Food suggestions
      {
        id: 'food_tasting',
        name: 'Kóstoló este új étteremben',
        type: 'food',
        categories: ['restaurant', 'food', 'tasting'],
        budget: 'medium',
        location: { lat: 47.5025, lng: 19.0451 },
        duration: '2 óra',
        bestTime: 'este',
        rating: 4.5,
        reviews: 678,
        description: 'Próbálj ki új ízeket, beszélgess az ételekről.',
        tips: ['Mondd el az allergiáidat', 'Oszd meg az élményeket'],
        accessibility: 'standard'
      },

      // Chill suggestions
      {
        id: 'home_cooking',
        name: 'Otthoni főzés közös élmény',
        type: 'chill',
        categories: ['cooking', 'home', 'intimate'],
        budget: 'low',
        location: null, // At home
        duration: '2-3 óra',
        bestTime: 'este',
        rating: 4.9,
        reviews: 345,
        description: 'Főzzetek együtt, beszélgessetek, lazítsatok.',
        tips: ['Válasszatok egyszerű recepteket', 'Hallgassatok zenét'],
        accessibility: 'home_based'
      },

      // Party suggestions
      {
        id: 'live_music',
        name: 'Élő zene bárban táncolva',
        type: 'party',
        categories: ['music', 'dancing', 'social'],
        budget: 'medium',
        location: { lat: 47.4980, lng: 19.0520 },
        duration: '3+ óra',
        bestTime: 'este',
        rating: 4.2,
        reviews: 876,
        description: 'Táncolj és érezd jól magad a zene ritmusára.',
        tips: ['Érkezz korán jó helyért', 'Legyen táncpartnere'],
        accessibility: 'standard'
      }
    ];
  }

  /**
   * Calculate suggestion match score
   * @param {Object} suggestion - Date suggestion
   * @param {Object} profile - User profile
   * @param {Object} analysis - Preference analysis
   * @returns {number} Match score (0-100)
   */
  calculateSuggestionScore(suggestion, profile, analysis) {
    let score = 50; // Base score

    // Category relevance
    const categoryMatch = analysis.categories.some(cat =>
      suggestion.categories.includes(cat)
    );
    if (categoryMatch) score += 20;

    // Budget compatibility
    if (suggestion.budget === analysis.budget) score += 15;

    // Rating bonus
    score += (suggestion.rating - 3) * 5;

    // Profile-based bonuses
    if (profile.interests?.includes('art') && suggestion.categories.includes('art')) {
      score += 10;
    }
    if (profile.interests?.includes('food') && suggestion.categories.includes('food')) {
      score += 10;
    }
    if (profile.interests?.includes('nature') && suggestion.categories.includes('nature')) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate reasoning for suggestion
   * @param {Object} suggestion - Date suggestion
   * @param {Object} profile - User profile
   * @param {Object} analysis - Preference analysis
   * @returns {string} Reasoning text
   */
  generateSuggestionReasoning(suggestion, profile, analysis) {
    const reasons = [];

    // Interest-based reasons
    if (profile.interests?.includes('art') && suggestion.categories.includes('art')) {
      reasons.push('szereted a művészetet');
    }
    if (profile.interests?.includes('food') && suggestion.categories.includes('food')) {
      reasons.push('rajongsz az étkezésért');
    }
    if (profile.interests?.includes('nature') && suggestion.categories.includes('nature')) {
      reasons.push('szereted a természetet');
    }

    // Category match
    const categoryMatch = analysis.categories.find(cat =>
      suggestion.categories.includes(cat)
    );
    if (categoryMatch) {
      reasons.push(`érdekelnek a ${this.translateCategory(categoryMatch)} tevékenységek`);
    }

    if (reasons.length === 0) {
      reasons.push('ez egy népszerű helyszín');
    }

    return `Mert ${reasons.join(', ')}.`;
  }

  /**
   * Calculate detailed match factors
   * @param {Object} suggestion - Date suggestion
   * @param {Object} profile - User profile
   * @param {Object} analysis - Preference analysis
   * @returns {Object} Match factors
   */
  calculateMatchFactors(suggestion, profile, analysis) {
    return {
      categoryMatch: analysis.categories.some(cat =>
        suggestion.categories.includes(cat)
      ),
      budgetMatch: suggestion.budget === analysis.budget,
      rating: suggestion.rating,
      accessibility: suggestion.accessibility === analysis.accessibility,
      distance: 0, // Would calculate real distance
      popularity: suggestion.reviews > 500
    };
  }

  /**
   * Map user interests to date categories
   * @param {Array} interests - User interests
   * @returns {Array} Date categories
   */
  mapInterestsToCategories(interests) {
    const interestMap = {
      'művészet': ['art', 'cultural', 'museum'],
      'zene': ['music', 'cultural', 'performing_arts'],
      'étel': ['food', 'restaurant', 'cafe'],
      'sport': ['outdoor', 'active', 'sports'],
      'utazás': ['outdoor', 'cultural', 'adventure'],
      'olvasás': ['cultural', 'quiet', 'intellectual'],
      'főzés': ['food', 'cooking', 'home'],
      'tánc': ['dancing', 'party', 'social'],
      'film': ['cultural', 'entertainment', 'indoor'],
      'állatok': ['outdoor', 'nature', 'pets'],
      'technológia': ['indoor', 'educational', 'modern']
    };

    const categories = [];
    interests.forEach(interest => {
      const mapped = interestMap[interest.toLowerCase()];
      if (mapped) {
        categories.push(...mapped);
      }
    });

    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Analyze prompts for date preferences
   * @param {Array} prompts - User prompts
   * @returns {Object} Date preferences from prompts
   */
  analyzePromptsForDatePrefs(prompts) {
    const analysis = {
      categories: [],
      ambiance: 'casual',
      budget: 'medium',
      activityTypes: [],
      dietary: []
    };

    prompts.forEach(prompt => {
      const answer = prompt.answer?.toLowerCase() || '';

      // Analyze for ambiance preferences
      if (answer.includes('romantikus') || answer.includes('gyertyafény')) {
        analysis.ambiance = 'romantic';
        analysis.categories.push('romantic');
      }
      if (answer.includes('kaland') || answer.includes('izgalmas')) {
        analysis.categories.push('adventurous');
      }
      if (answer.includes('nyugodt') || answer.includes('lazulós')) {
        analysis.ambiance = 'chill';
        analysis.categories.push('chill');
      }

      // Analyze for activity preferences
      if (answer.includes('étel') || answer.includes('étterem')) {
        analysis.activityTypes.push('food');
      }
      if (answer.includes('múzeum') || answer.includes('kiállítás')) {
        analysis.activityTypes.push('cultural');
      }
      if (answer.includes('séta') || answer.includes('park')) {
        analysis.activityTypes.push('outdoor');
      }

      // Dietary preferences
      if (answer.includes('vegetáriánus')) {
        analysis.dietary.push('vegetarian');
      }
      if (answer.includes('vegán')) {
        analysis.dietary.push('vegan');
      }
    });

    return analysis;
  }

  /**
   * Translate category to Hungarian
   * @param {string} category - English category
   * @returns {string} Hungarian translation
   */
  translateCategory(category) {
    const translations = {
      art: 'művészeti',
      food: 'éttermi',
      cultural: 'kulturális',
      outdoor: 'szabadtéri',
      music: 'zenei',
      sports: 'sport',
      nature: 'természet',
      indoor: 'beltéri'
    };

    return translations[category] || category;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sin(dLon/2));
    return R * c;
  }

  /**
   * Save date suggestion as favorite
   * @param {string} userId - User ID
   * @param {string} suggestionId - Suggestion ID
   * @returns {Promise<Object>} Save result
   */
  async saveFavoriteSuggestion(userId, suggestionId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // In a real implementation, this would save to user_favorites table
      this.logger.info('Date suggestion saved as favorite', { userId, suggestionId });

      return {
        success: true,
        suggestionId,
        savedAt: new Date().toISOString()
      };
    }, { operation: 'saveFavoriteSuggestion', userId, suggestionId });
  }

  /**
   * Get user's favorite suggestions
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Favorite suggestions
   */
  async getFavoriteSuggestions(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // In a real implementation, this would query user_favorites table
      // Return mock favorites for now
      const allSuggestions = this.getCuratedSuggestions();
      const favorites = allSuggestions.slice(0, 3).map(suggestion => ({
        ...suggestion,
        savedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      return favorites;
    }, { operation: 'getFavoriteSuggestions', userId });
  }
}

// Register with DI container
container.registerFactory('smartDateService', () => new SmartDateService());

export default SmartDateService;
