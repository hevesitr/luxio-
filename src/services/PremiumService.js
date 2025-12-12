import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import Logger from './Logger';

class PremiumService {
  constructor() {
    this.STORAGE_KEY = '@premium_data';
  }

  // Premium tiers
  TIERS = {
    FREE: 'free',
    PLUS: 'plus',
    GOLD: 'gold',
    PLATINUM: 'platinum',
  };

  // Pricing (monthly in HUF)
  PRICING = {
    [this.TIERS.PLUS]: 3000,
    [this.TIERS.GOLD]: 5000,
    [this.TIERS.PLATINUM]: 7000,
  };

  // Features by tier
  FEATURES = {
    [this.TIERS.FREE]: {
      dailySwipes: 100,
      superLikesPerDay: 1,
      boostsPerMonth: 0,
      rewind: false,
      passport: false,
      likesYou: false,
      priorityLikes: false,
      topPicksExtra: 0,
      hideAds: false,
      messageBeforeMatch: false,
      readReceipts: false,
    },
    [this.TIERS.PLUS]: {
      dailySwipes: Infinity,
      superLikesPerDay: 5,
      boostsPerMonth: 1,
      rewind: true,
      passport: true,
      likesYou: false,
      priorityLikes: false,
      topPicksExtra: 0,
      hideAds: true,
      messageBeforeMatch: false,
      readReceipts: false,
    },
    [this.TIERS.GOLD]: {
      dailySwipes: Infinity,
      superLikesPerDay: 5,
      boostsPerMonth: 1,
      rewind: true,
      passport: true,
      likesYou: true,
      priorityLikes: true,
      topPicksExtra: 4,
      hideAds: true,
      messageBeforeMatch: false,
      readReceipts: true,
    },
    [this.TIERS.PLATINUM]: {
      dailySwipes: Infinity,
      superLikesPerDay: 10,
      boostsPerMonth: 2,
      rewind: true,
      passport: true,
      likesYou: true,
      priorityLikes: true,
      topPicksExtra: 10,
      hideAds: true,
      messageBeforeMatch: true,
      readReceipts: true,
    },
  };

  /**
   * Get features for a specific tier
   * @param {string} tier - The premium tier
   * @returns {object} Features object for the tier
   */
  getTierFeatures(tier) {
    const features = this.FEATURES[tier] || this.FEATURES[this.TIERS.FREE];
    // Map property names for backward compatibility
    return {
      ...features,
      superLikes: features.superLikesPerDay,
      boosts: features.boostsPerMonth,
      seeWhoLiked: features.likesYou,
    };
  }

  async getUserTier(userId = null) {
    try {
      // ✅ P1-5: Server-side validáció - Supabase-ből kérdezzük le
      if (userId) {
        const { data, error } = await supabase
          .from('premium_subscriptions')
          .select('tier, expiry_date, is_active')
          .eq('user_id', userId)
          .eq('is_active', true)
          .gt('expiry_date', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          Logger.debug('Premium tier loaded from server', { userId, tier: data.tier });
          return data.tier;
        }
      }

      // Fallback to local storage
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const { tier } = JSON.parse(data);
        return tier || this.TIERS.FREE;
      }
      return this.TIERS.FREE;
    } catch (error) {
      Logger.error('Error getting user tier:', error);
      return this.TIERS.FREE;
    }
  }

  async setUserTier(tier) {
    try {
      const data = {
        tier,
        purchaseDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error setting user tier:', error);
      return false;
    }
  }

  async getFeatures(userId = null) {
    const tier = await this.getUserTier(userId);
    return this.FEATURES[tier];
  }

  async hasFeature(featureName, userId = null) {
    const features = await this.getFeatures(userId);
    return features[featureName];
  }

  async canSwipe(userId, todaySwipes) {
    try {
      // ✅ P1-5: Server-side validáció
      const serverCheck = await this.checkServerLimit(userId, 'swipe', todaySwipes);
      if (serverCheck !== null) {
        return serverCheck;
      }

      // Fallback to local validation
      const features = await this.getFeatures(userId);
      return todaySwipes < features.dailySwipes;
    } catch (error) {
      Logger.error('Error checking swipe limit:', error);
      return false;
    }
  }

  async canSuperLike(userId, todaySuperLikes) {
    try {
      // ✅ P1-5: Server-side validáció
      const serverCheck = await this.checkServerLimit(userId, 'superlike', todaySuperLikes);
      if (serverCheck !== null) {
        return serverCheck;
      }

      // Fallback to local validation
      const features = await this.getFeatures(userId);
      return todaySuperLikes < features.superLikesPerDay;
    } catch (error) {
      Logger.error('Error checking superlike limit:', error);
      return false;
    }
  }

  async canBoost(userId, thisMonthBoosts) {
    try {
      // ✅ P1-5: Server-side validáció
      const serverCheck = await this.checkServerLimit(userId, 'boost', thisMonthBoosts);
      if (serverCheck !== null) {
        return serverCheck;
      }

      // Fallback to local validation
      const features = await this.getFeatures(userId);
      return thisMonthBoosts < features.boostsPerMonth;
    } catch (error) {
      Logger.error('Error checking boost limit:', error);
      return false;
    }
  }

  /**
   * Server-side limit ellenőrzés
   */
  async checkServerLimit(userId, actionType, currentCount) {
    try {
      const { data, error } = await supabase.rpc('check_premium_limit', {
        p_user_id: userId,
        p_action_type: actionType,
        p_current_count: currentCount
      });

      if (error) {
        Logger.warn('Server limit check failed, using local validation', { error });
        return null; // Fallback to local validation
      }

      return data.allowed;
    } catch (error) {
      Logger.warn('Server limit check exception, using local validation', error);
      return null; // Fallback to local validation
    }
  }

  // Get daily swipe count
  async getDailySwipeCount() {
    try {
      const data = await AsyncStorage.getItem('@swipe_count');
      if (data) {
        const { count, date } = JSON.parse(data);
        const today = new Date().toDateString();
        if (date === today) {
          return count;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting swipe count:', error);
      return 0;
    }
  }

  async incrementSwipeCount() {
    try {
      const today = new Date().toDateString();
      const count = await this.getDailySwipeCount();
      await AsyncStorage.setItem('@swipe_count', JSON.stringify({
        count: count + 1,
        date: today,
      }));
      return count + 1;
    } catch (error) {
      console.error('Error incrementing swipe count:', error);
      return 0;
    }
  }

  // Get daily super like count
  async getDailySuperLikeCount() {
    try {
      const data = await AsyncStorage.getItem('@superlike_count');
      if (data) {
        const { count, date } = JSON.parse(data);
        const today = new Date().toDateString();
        if (date === today) {
          return count;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting super like count:', error);
      return 0;
    }
  }

  async incrementSuperLikeCount() {
    try {
      const today = new Date().toDateString();
      const count = await this.getDailySuperLikeCount();
      await AsyncStorage.setItem('@superlike_count', JSON.stringify({
        count: count + 1,
        date: today,
      }));
      return count + 1;
    } catch (error) {
      console.error('Error incrementing super like count:', error);
      return 0;
    }
  }

  // Get monthly boost count
  async getMonthlyBoostCount() {
    try {
      const data = await AsyncStorage.getItem('@boost_count');
      if (data) {
        const { count, month } = JSON.parse(data);
        const currentMonth = new Date().getMonth();
        if (month === currentMonth) {
          return count;
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting boost count:', error);
      return 0;
    }
  }

  async incrementBoostCount() {
    try {
      const currentMonth = new Date().getMonth();
      const count = await this.getMonthlyBoostCount();
      await AsyncStorage.setItem('@boost_count', JSON.stringify({
        count: count + 1,
        month: currentMonth,
      }));
      return count + 1;
    } catch (error) {
      console.error('Error incrementing boost count:', error);
      return 0;
    }
  }

  getTierDisplayName(tier) {
    const names = {
      [this.TIERS.FREE]: 'Ingyenes',
      [this.TIERS.PLUS]: 'Prémium Plus',
      [this.TIERS.GOLD]: 'Prémium Gold',
      [this.TIERS.PLATINUM]: 'Prémium Platinum',
    };
    return names[tier] || 'Ingyenes';
  }

  getTierBenefits(tier) {
    const features = this.FEATURES[tier];
    const benefits = [];

    if (features.dailySwipes === Infinity) benefits.push('Korlátlan swipe-ok');
    else benefits.push(`${features.dailySwipes} swipe/nap`);

    if (features.superLikesPerDay > 1) benefits.push(`${features.superLikesPerDay} Super Like/nap`);
    if (features.boostsPerMonth > 0) benefits.push(`${features.boostsPerMonth} Boost/hó`);
    if (features.rewind) benefits.push('Visszavonás');
    if (features.passport) benefits.push('Passport');
    if (features.likesYou) benefits.push('Ki lájkolt téged');
    if (features.priorityLikes) benefits.push('Kiemelt lájkok');
    if (features.topPicksExtra > 0) benefits.push(`+${features.topPicksExtra} Top Picks`);
    if (features.hideAds) benefits.push('Reklámmentesség');
    if (features.messageBeforeMatch) benefits.push('Üzenet match előtt');
    if (features.readReceipts) benefits.push('Olvasási visszaigazolás');

    return benefits;
  }
}

export default new PremiumService();

