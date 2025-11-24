import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = '@user_streak';
const BADGES_KEY = '@user_badges';
const LAST_ACTIVE_KEY = '@last_active_date';
const STATS_KEY = '@gamification_stats';

class GamificationService {
  /**
   * Streak (aktív napok száma) kezelése
   */
  async getCurrentStreak() {
    try {
      const streakData = await AsyncStorage.getItem(STREAK_KEY);
      if (streakData) {
        return JSON.parse(streakData);
      }
      return { days: 0, lastDate: null };
    } catch (error) {
      console.error('Error getting streak:', error);
      return { days: 0, lastDate: null };
    }
  }

  async updateStreak() {
    try {
      const today = new Date().toDateString();
      const streakData = await this.getCurrentStreak();
      
      if (!streakData.lastDate) {
        // Első nap
        const newStreak = { days: 1, lastDate: today };
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
        return newStreak;
      }

      const lastDate = new Date(streakData.lastDate);
      const todayDate = new Date(today);
      const diffTime = todayDate - lastDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Ugyanaz a nap, nem változtatunk
        return streakData;
      } else if (diffDays === 1) {
        // Következő nap, növeljük a streak-et
        const newStreak = { days: streakData.days + 1, lastDate: today };
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
        return newStreak;
      } else {
        // Streak megszakadt, újrakezdjük
        const newStreak = { days: 1, lastDate: today };
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
        return newStreak;
      }
    } catch (error) {
      console.error('Error updating streak:', error);
      return { days: 0, lastDate: null };
    }
  }

  /**
   * Badge (kitűző) kezelése
   */
  async getBadges() {
    try {
      const badgesData = await AsyncStorage.getItem(BADGES_KEY);
      if (badgesData) {
        return JSON.parse(badgesData);
      }
      return [];
    } catch (error) {
      console.error('Error getting badges:', error);
      return [];
    }
  }

  async addBadge(badgeId, badgeName, badgeIcon, badgeDescription) {
    try {
      const badges = await this.getBadges();
      const existingBadge = badges.find(b => b.id === badgeId);
      
      if (existingBadge) {
        return badges; // Már megvan
      }

      const newBadge = {
        id: badgeId,
        name: badgeName,
        icon: badgeIcon,
        description: badgeDescription,
        earnedAt: new Date().toISOString(),
      };

      badges.push(newBadge);
      await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(badges));
      return badges;
    } catch (error) {
      console.error('Error adding badge:', error);
      return badges;
    }
  }

  async checkAndAwardBadges(stats) {
    const newBadges = [];

    // Streak badge-ek
    const streak = await this.getCurrentStreak();
    if (streak.days >= 7 && !(await this.hasBadge('streak_7'))) {
      await this.addBadge('streak_7', 'Heti Streak', 'flame', '7 napos aktív streak');
      newBadges.push('streak_7');
    }
    if (streak.days >= 30 && !(await this.hasBadge('streak_30'))) {
      await this.addBadge('streak_30', 'Havi Streak', 'flame', '30 napos aktív streak');
      newBadges.push('streak_30');
    }
    if (streak.days >= 100 && !(await this.hasBadge('streak_100'))) {
      await this.addBadge('streak_100', 'Százas Streak', 'flame', '100 napos aktív streak');
      newBadges.push('streak_100');
    }

    // Match badge-ek
    if (stats.totalMatches >= 10 && !(await this.hasBadge('matches_10'))) {
      await this.addBadge('matches_10', 'Társkereső', 'heart', '10 match');
      newBadges.push('matches_10');
    }
    if (stats.totalMatches >= 50 && !(await this.hasBadge('matches_50'))) {
      await this.addBadge('matches_50', 'Népszerű', 'heart', '50 match');
      newBadges.push('matches_50');
    }
    if (stats.totalMatches >= 100 && !(await this.hasBadge('matches_100'))) {
      await this.addBadge('matches_100', 'Sztár', 'star', '100 match');
      newBadges.push('matches_100');
    }

    // Üzenet badge-ek
    if (stats.totalMessages >= 100 && !(await this.hasBadge('messages_100'))) {
      await this.addBadge('messages_100', 'Beszélgetős', 'chatbubble', '100 üzenet');
      newBadges.push('messages_100');
    }
    if (stats.totalMessages >= 500 && !(await this.hasBadge('messages_500'))) {
      await this.addBadge('messages_500', 'Beszélgetős Mester', 'chatbubble', '500 üzenet');
      newBadges.push('messages_500');
    }

    // Like badge-ek
    if (stats.totalLikes >= 50 && !(await this.hasBadge('likes_50'))) {
      await this.addBadge('likes_50', 'Kedvelő', 'thumbs-up', '50 like');
      newBadges.push('likes_50');
    }
    if (stats.totalLikes >= 200 && !(await this.hasBadge('likes_200'))) {
      await this.addBadge('likes_200', 'Nagy Kedvelő', 'thumbs-up', '200 like');
      newBadges.push('likes_200');
    }

    // Profil badge-ek
    if (stats.profileViews >= 100 && !(await this.hasBadge('views_100'))) {
      await this.addBadge('views_100', 'Népszerű Profil', 'eye', '100 profilnézet');
      newBadges.push('views_100');
    }

    return newBadges;
  }

  async hasBadge(badgeId) {
    const badges = await this.getBadges();
    return badges.some(b => b.id === badgeId);
  }

  /**
   * Statisztikák kezelése
   */
  async getStats() {
    try {
      const statsData = await AsyncStorage.getItem(STATS_KEY);
      if (statsData) {
        return JSON.parse(statsData);
      }
      return {
        totalMatches: 0,
        totalMessages: 0,
        totalLikes: 0,
        profileViews: 0,
        lastUpdated: null,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalMatches: 0,
        totalMessages: 0,
        totalLikes: 0,
        profileViews: 0,
        lastUpdated: null,
      };
    }
  }

  async updateStats(updates) {
    try {
      const currentStats = await this.getStats();
      const newStats = {
        ...currentStats,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      return newStats;
    } catch (error) {
      console.error('Error updating stats:', error);
      return currentStats;
    }
  }

  async incrementMatch() {
    const stats = await this.getStats();
    const newStats = await this.updateStats({ totalMatches: stats.totalMatches + 1 });
    const newBadges = await this.checkAndAwardBadges(newStats);
    return { stats: newStats, newBadges };
  }

  async incrementMessage() {
    const stats = await this.getStats();
    const newStats = await this.updateStats({ totalMessages: stats.totalMessages + 1 });
    const newBadges = await this.checkAndAwardBadges(newStats);
    return { stats: newStats, newBadges };
  }

  async incrementLike() {
    const stats = await this.getStats();
    const newStats = await this.updateStats({ totalLikes: stats.totalLikes + 1 });
    const newBadges = await this.checkAndAwardBadges(newStats);
    return { stats: newStats, newBadges };
  }

  async incrementProfileView() {
    const stats = await this.getStats();
    const newStats = await this.updateStats({ profileViews: stats.profileViews + 1 });
    const newBadges = await this.checkAndAwardBadges(newStats);
    return { stats: newStats, newBadges };
  }

  /**
   * Napi aktivitás ellenőrzése
   */
  async checkDailyActivity() {
    const today = new Date().toDateString();
    const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    
    if (lastActive !== today) {
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
      const streak = await this.updateStreak();
      return streak;
    }
    
    return await this.getCurrentStreak();
  }
}

export default new GamificationService();

