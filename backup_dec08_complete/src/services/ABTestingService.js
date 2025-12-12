import AsyncStorage from '@react-native-async-storage/async-storage';
import ServiceError from './ServiceError';
import ErrorHandler from './ErrorHandler';

/**
 * A/B Testing Service for onboarding and paywall optimization
 *
 * Features:
 * - Variant assignment and persistence
 * - Conversion tracking
 * - Statistical analysis
 * - Dynamic content serving
 */
class ABTestingService {
  constructor() {
    this.STORAGE_KEY = '@ab_testing_data';
    this.RESULTS_KEY = '@ab_testing_results';

    // Experiment definitions
    this.EXPERIMENTS = {
      onboarding_flow: {
        name: 'Onboarding Flow Optimization',
        variants: ['standard', 'simplified', 'interactive'],
        weights: [0.4, 0.4, 0.2], // Distribution weights
        metrics: ['completion_rate', 'time_to_complete', 'drop_off_step']
      },
      paywall_design: {
        name: 'Paywall Design Testing',
        variants: ['minimal', 'benefits_focused', 'social_proof', 'scarcity'],
        weights: [0.25, 0.25, 0.25, 0.25],
        metrics: ['conversion_rate', 'click_through_rate', 'trial_signup_rate']
      },
      onboarding_copy: {
        name: 'Onboarding Copy Testing',
        variants: ['casual', 'professional', 'romantic', 'empowering'],
        weights: [0.25, 0.25, 0.25, 0.25],
        metrics: ['engagement_rate', 'completion_rate', 'bounce_rate']
      },
      paywall_pricing: {
        name: 'Paywall Pricing Display',
        variants: ['monthly_focus', 'quarterly_focus', 'yearly_focus', 'value_prop'],
        weights: [0.25, 0.25, 0.25, 0.25],
        metrics: ['conversion_rate', 'plan_selection', 'revenue_per_user']
      }
    };
  }

  /**
   * Assign user to experiment variants
   */
  async assignUserToExperiments(userId) {
    try {
      const assignments = {};

      for (const [experimentId, experiment] of Object.entries(this.EXPERIMENTS)) {
        const variant = await this._assignVariant(userId, experimentId, experiment);
        assignments[experimentId] = variant;
      }

      // Save assignments
      const userData = {
        userId,
        assignments,
        assignedAt: new Date().toISOString()
      };

      await this._saveUserAssignments(userId, userData);

      return {
        success: true,
        assignments
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'ASSIGNMENT_FAILED',
        { userId }
      );
    }
  }

  /**
   * Get user's assigned variants
   */
  async getUserVariants(userId) {
    try {
      const data = await AsyncStorage.getItem(`${this.STORAGE_KEY}_${userId}`);

      if (!data) {
        // Assign user to experiments if not already assigned
        const result = await this.assignUserToExperiments(userId);
        return result.success ? result.assignments : {};
      }

      const parsedData = JSON.parse(data);
      return parsedData.assignments || {};

    } catch (error) {
      console.error('Error getting user variants:', error);
      return {};
    }
  }

  /**
   * Track experiment events
   */
  async trackEvent(userId, experimentId, variant, eventType, eventData = {}) {
    try {
      if (!this.EXPERIMENTS[experimentId]) {
        throw new ServiceError(
          'INVALID_EXPERIMENT',
          `Ismeretlen kísérlet: ${experimentId}`,
          { experimentId, userId }
        );
      }

      const event = {
        userId,
        experimentId,
        variant,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
        sessionId: await this._getSessionId()
      };

      await this._storeEvent(event);

      return {
        success: true,
        eventId: `evt_${Date.now()}`
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'EVENT_TRACKING_FAILED',
        { userId, experimentId, variant, eventType }
      );
    }
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId) {
    try {
      if (!this.EXPERIMENTS[experimentId]) {
        throw new ServiceError(
          'INVALID_EXPERIMENT',
          `Ismeretlen kísérlet: ${experimentId}`,
          { experimentId }
        );
      }

      const results = await this._calculateResults(experimentId);

      return {
        success: true,
        experiment: this.EXPERIMENTS[experimentId],
        results
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'RESULTS_CALCULATION_FAILED',
        { experimentId }
      );
    }
  }

  /**
   * Get variant-specific content
   */
  async getVariantContent(experimentId, variant) {
    try {
      if (!this.EXPERIMENTS[experimentId]) {
        throw new ServiceError(
          'INVALID_EXPERIMENT',
          `Ismeretlen kísérlet: ${experimentId}`,
          { experimentId }
        );
      }

      const content = await this._generateVariantContent(experimentId, variant);

      return {
        success: true,
        content
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'CONTENT_GENERATION_FAILED',
        { experimentId, variant }
      );
    }
  }

  /**
   * Reset user assignments (for testing)
   */
  async resetUserAssignments(userId) {
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
      await AsyncStorage.removeItem(`${this.RESULTS_KEY}_${userId}`);

      return {
        success: true,
        message: 'Felhasználó hozzárendelések visszaállítva'
      };

    } catch (error) {
      return ErrorHandler.handleServiceError(
        error,
        'RESET_FAILED',
        { userId }
      );
    }
  }

  // === PRIVATE METHODS ===

  async _assignVariant(userId, experimentId, experiment) {
    // Use consistent hashing for variant assignment
    const hash = await this._simpleHash(`${userId}_${experimentId}`);
    const random = (hash % 1000) / 1000; // 0-1 közötti érték

    let cumulativeWeight = 0;
    for (let i = 0; i < experiment.variants.length; i++) {
      cumulativeWeight += experiment.weights[i];
      if (random <= cumulativeWeight) {
        return experiment.variants[i];
      }
    }

    // Fallback to first variant
    return experiment.variants[0];
  }

  async _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer
    }
    return Math.abs(hash);
  }

  async _saveUserAssignments(userId, data) {
    await AsyncStorage.setItem(
      `${this.STORAGE_KEY}_${userId}`,
      JSON.stringify(data)
    );
  }

  async _getSessionId() {
    // Simple session ID generation
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async _storeEvent(event) {
    const results = await AsyncStorage.getItem(this.RESULTS_KEY) || '[]';
    const parsedResults = JSON.parse(results);

    parsedResults.push(event);

    // Limit stored events to prevent storage bloat (max 1000 events)
    if (parsedResults.length > 1000) {
      parsedResults.splice(0, parsedResults.length - 1000);
    }

    await AsyncStorage.setItem(this.RESULTS_KEY, JSON.stringify(parsedResults));
  }

  async _calculateResults(experimentId) {
    const results = await AsyncStorage.getItem(this.RESULTS_KEY) || '[]';
    const events = JSON.parse(results);

    const experimentEvents = events.filter(e => e.experimentId === experimentId);

    const variantStats = {};

    // Initialize stats for each variant
    this.EXPERIMENTS[experimentId].variants.forEach(variant => {
      variantStats[variant] = {
        users: 0,
        events: 0,
        conversions: 0,
        metrics: {}
      };
    });

    // Calculate statistics
    const userVariants = {};

    experimentEvents.forEach(event => {
      if (!userVariants[event.userId]) {
        userVariants[event.userId] = event.variant;
        variantStats[event.variant].users++;
      }

      variantStats[event.variant].events++;

      // Track conversions (customize based on experiment)
      if (this._isConversionEvent(experimentId, event)) {
        variantStats[event.variant].conversions++;
      }
    });

    // Calculate rates
    Object.keys(variantStats).forEach(variant => {
      const stats = variantStats[variant];
      stats.conversionRate = stats.users > 0 ? (stats.conversions / stats.users) * 100 : 0;
    });

    return variantStats;
  }

  _isConversionEvent(experimentId, event) {
    const conversionEvents = {
      onboarding_flow: ['onboarding_complete'],
      paywall_design: ['subscription_started', 'trial_started'],
      onboarding_copy: ['profile_created'],
      paywall_pricing: ['payment_completed']
    };

    return conversionEvents[experimentId]?.includes(event.eventType) || false;
  }

  async _generateVariantContent(experimentId, variant) {
    const contentMap = {
      onboarding_flow: {
        standard: {
          title: 'Üdvözöl a Lovex!',
          subtitle: 'Találd meg a tökéletes párt intelligens matching rendszerünkkel',
          showFeatures: true,
          interactiveElements: false
        },
        simplified: {
          title: 'Kezdjük!',
          subtitle: 'Csak pár lépés és már használhatod is az appot',
          showFeatures: false,
          interactiveElements: false
        },
        interactive: {
          title: 'Ismerjük meg egymást!',
          subtitle: 'Egy gyors kérdőív alapján személyre szabjuk az élményt',
          showFeatures: true,
          interactiveElements: true
        }
      },
      paywall_design: {
        minimal: {
          showSocialProof: false,
          showScarcity: false,
          emphasizeBenefits: false,
          layout: 'minimal'
        },
        benefits_focused: {
          showSocialProof: false,
          showScarcity: false,
          emphasizeBenefits: true,
          layout: 'benefits_grid'
        },
        social_proof: {
          showSocialProof: true,
          showScarcity: false,
          emphasizeBenefits: true,
          layout: 'social_proof'
        },
        scarcity: {
          showSocialProof: true,
          showScarcity: true,
          emphasizeBenefits: true,
          layout: 'urgency'
        }
      },
      onboarding_copy: {
        casual: {
          tone: 'casual',
          greeting: 'Szia! 🎉',
          callToAction: 'Kezdjünk neki!'
        },
        professional: {
          tone: 'professional',
          greeting: 'Üdvözöljük!',
          callToAction: 'Folytatás'
        },
        romantic: {
          tone: 'romantic',
          greeting: 'Találjuk meg az igazit! 💕',
          callToAction: 'Kezdjük a szerelmet!'
        },
        empowering: {
          tone: 'empowering',
          greeting: 'Te vagy a főszereplő! ✨',
          callToAction: 'Induljunk!'
        }
      },
      paywall_pricing: {
        monthly_focus: {
          highlightPlan: 'premium_monthly',
          showSavings: false,
          emphasizeMonthly: true
        },
        quarterly_focus: {
          highlightPlan: 'premium_quarterly',
          showSavings: true,
          emphasizeMonthly: false
        },
        yearly_focus: {
          highlightPlan: 'premium_yearly',
          showSavings: true,
          emphasizeMonthly: false
        },
        value_prop: {
          highlightPlan: 'premium_quarterly',
          showSavings: true,
          emphasizeValue: true
        }
      }
    };

    return contentMap[experimentId]?.[variant] || {};
  }
}

// Singleton export
export default new ABTestingService();
