import AsyncStorage from '@react-native-async-storage/async-storage';
import CompatibilityService from './CompatibilityService';

class TopPicksService {
  constructor() {
    this.STORAGE_KEY = '@top_picks';
    this.BASE_DAILY_PICKS = 10;
  }

  async generateTopPicks(allProfiles, userProfile, extraPicks = 0) {
    try {
      // Calculate compatibility for all profiles
      const profilesWithScores = allProfiles.map(profile => ({
        ...profile,
        compatibility: CompatibilityService.calculateCompatibility(userProfile, profile),
      }));

      // Sort by compatibility score (highest first)
      const sortedProfiles = profilesWithScores.sort(
        (a, b) => b.compatibility.score - a.compatibility.score
      );

      // Select top picks based on daily limit + extra picks for premium users
      const dailyLimit = this.BASE_DAILY_PICKS + extraPicks;
      const topPicks = sortedProfiles.slice(0, dailyLimit);

      // Save to storage with today's date
      const today = new Date().toDateString();
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        date: today,
        picks: topPicks,
      }));

      return topPicks;
    } catch (error) {
      console.error('Error generating top picks:', error);
      return [];
    }
  }

  async getTodaysTopPicks() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const { date, picks } = JSON.parse(data);
        const today = new Date().toDateString();
        
        if (date === today) {
          return picks;
        }
      }
      return null; // Need to regenerate
    } catch (error) {
      console.error('Error getting top picks:', error);
      return null;
    }
  }

  async getRefreshTime() {
    // Top picks refresh at 12:00 PM daily
    const now = new Date();
    const refreshTime = new Date();
    refreshTime.setHours(12, 0, 0, 0);

    if (now > refreshTime) {
      // If already past 12:00, show next day's refresh time
      refreshTime.setDate(refreshTime.getDate() + 1);
    }

    return refreshTime;
  }

  async getTimeUntilRefresh() {
    const refreshTime = await this.getRefreshTime();
    const now = new Date();
    return refreshTime - now;
  }

  formatTimeUntilRefresh(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ó ${minutes}p`;
  }

  getPickReason(compatibility) {
    if (compatibility.commonInterests.length >= 3) {
      return `${compatibility.commonInterests.length} közös érdeklődés`;
    }
    if (compatibility.score >= 85) {
      return 'Nagyon magas kompatibilitás';
    }
    if (compatibility.level.name === 'Kiváló') {
      return 'Tökéletes találat';
    }
    if (compatibility.details.zodiacMatch) {
      return 'Kompatibilis csillagjegy';
    }
    if (compatibility.details.mbtiMatch === 'Excellent') {
      return 'Kompatibilis személyiség';
    }
    return 'Ajánlott számodra';
  }

  async clearTopPicks() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing top picks:', error);
      return false;
    }
  }
}

export default new TopPicksService();

