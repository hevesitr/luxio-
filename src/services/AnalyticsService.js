import AsyncStorage from '@react-native-async-storage/async-storage';

class AnalyticsService {
  static STORAGE_KEY = '@dating_app_analytics';

  // Alapértelmezett statisztikák
  static defaultStats = {
    totalSwipes: 0,
    rightSwipes: 0,
    leftSwipes: 0,
    superLikes: 0,
    matches: 0,
    messagesSent: 0,
    profileViews: 0,
    undoUsed: 0,
    likesReceived: 0,
    activeConversations: 0,
    textMessages: 0,
    voiceMessages: 0,
    videoMessages: 0,
    dailyActivity: this.generateEmptyDailyActivity(),
    matchGrowth7d: 0,
    avgResponseTime: 'N/A',
    lastReset: new Date().toISOString(),
  };

  // Üres napi aktivitás generálása
  static generateEmptyDailyActivity() {
    return Array.from({ length: 7 }, () => ({ swipes: 0, matches: 0 }));
  }

  // Statisztikák betöltése
  static async getStats() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : this.defaultStats;
    } catch (e) {
      console.error('Error loading stats:', e);
      return this.defaultStats;
    }
  }

  // Statisztikák mentése
  static async saveStats(stats) {
    try {
      const jsonValue = JSON.stringify(stats);
      await AsyncStorage.setItem(this.STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Error saving stats:', e);
    }
  }

  // Esemény rögzítése
  static async trackEvent(eventType) {
    const stats = await this.getStats();
    
    switch (eventType) {
      case 'swipe_right':
        stats.rightSwipes += 1;
        stats.totalSwipes += 1;
        break;
      case 'swipe_left':
        stats.leftSwipes += 1;
        stats.totalSwipes += 1;
        break;
      case 'super_like':
        stats.superLikes += 1;
        stats.totalSwipes += 1;
        break;
      case 'match':
        stats.matches += 1;
        break;
      case 'message_sent':
        stats.messagesSent += 1;
        break;
      case 'profile_view':
        stats.profileViews += 1;
        break;
      case 'undo':
        stats.undoUsed += 1;
        break;
      case 'like_received':
        stats.likesReceived += 1;
        break;
      case 'text_message':
        stats.textMessages += 1;
        stats.messagesSent += 1;
        break;
      case 'voice_message':
        stats.voiceMessages += 1;
        stats.messagesSent += 1;
        break;
      case 'video_message':
        stats.videoMessages += 1;
        stats.messagesSent += 1;
        break;
      case 'conversation_started':
        stats.activeConversations += 1;
        break;
    }

    // Napi aktivitás frissítése
    const today = new Date().getDay();
    if (!stats.dailyActivity) {
      stats.dailyActivity = this.generateEmptyDailyActivity();
    }
    if (eventType === 'swipe_right' || eventType === 'swipe_left' || eventType === 'super_like') {
      stats.dailyActivity[today].swipes += 1;
    }
    if (eventType === 'match') {
      stats.dailyActivity[today].matches += 1;
    }

    await this.saveStats(stats);
    return stats;
  }

  // Statisztikák visszaállítása
  static async resetStats() {
    await this.saveStats({
      ...this.defaultStats,
      dailyActivity: this.generateEmptyDailyActivity(),
      lastReset: new Date().toISOString(),
    });
  }

  // Statisztikák inicializálása hiányzó mezőkkel
  static async initializeStats() {
    const stats = await this.getStats();
    const initialized = {
      ...this.defaultStats,
      ...stats,
      dailyActivity: stats.dailyActivity || this.generateEmptyDailyActivity(),
      likesReceived: stats.likesReceived || 0,
      activeConversations: stats.activeConversations || 0,
      textMessages: stats.textMessages || 0,
      voiceMessages: stats.voiceMessages || 0,
      videoMessages: stats.videoMessages || 0,
    };
    await this.saveStats(initialized);
    return initialized;
  }

  // Számított metrikák
  static calculateMetrics(stats) {
    const rightSwipeRate = stats.totalSwipes > 0
      ? Math.round((stats.rightSwipes / stats.totalSwipes) * 100)
      : 0;

    const matchRate = stats.rightSwipes > 0
      ? Math.round((stats.matches / stats.rightSwipes) * 100)
      : 0;

    const avgMessagesPerMatch = stats.matches > 0
      ? Math.round(stats.messagesSent / stats.matches)
      : 0;

    // Match növekedés számítása (7 nap)
    const matchGrowth7d = this.calculateMatchGrowth(stats);

    // Átlagos válaszidő (szimulált)
    const avgResponseTime = this.calculateAvgResponseTime(stats);

    return {
      rightSwipeRate,
      matchRate,
      avgMessagesPerMatch,
      selectivityScore: 100 - rightSwipeRate, // Minél alacsonyabb a swipe rate, annál szelektívebb
      matchGrowth7d,
      avgResponseTime,
    };
  }

  // Match növekedés számítása
  static calculateMatchGrowth(stats) {
    if (!stats.dailyActivity || stats.dailyActivity.length < 7) {
      return 0;
    }
    
    const last7Days = stats.dailyActivity.slice(-7);
    const firstHalf = last7Days.slice(0, 3).reduce((sum, day) => sum + day.matches, 0);
    const secondHalf = last7Days.slice(4).reduce((sum, day) => sum + day.matches, 0);
    
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }

  // Átlagos válaszidő számítása (szimulált)
  static calculateAvgResponseTime(stats) {
    if (stats.messagesSent === 0) return 'N/A';
    
    // Szimulált válaszidő: 5-120 perc között véletlenszerű
    const avgMinutes = Math.floor(Math.random() * 115) + 5;
    
    if (avgMinutes < 60) {
      return `${avgMinutes} perc`;
    } else {
      const hours = Math.floor(avgMinutes / 60);
      const mins = avgMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours} óra`;
    }
  }

  // Statisztikák szöveges összegzése
  static getInsights(stats, metrics) {
    const insights = [];

    if (metrics.rightSwipeRate > 70) {
      insights.push({
        icon: '❤️',
        title: 'Kedves vagy!',
        description: 'Sokaknak adsz esélyt, ez növeli a match esélyedet!',
      });
    } else if (metrics.rightSwipeRate < 30) {
      insights.push({
        icon: '🎯',
        title: 'Szelektív vagy!',
        description: 'Tudod mit keresel, és ez jó stratégia!',
      });
    }

    if (metrics.matchRate > 50) {
      insights.push({
        icon: '🔥',
        title: 'Vonzó Profil!',
        description: 'Magas match arányod van, tetszesz az embereknek!',
      });
    }

    if (stats.superLikes > 10) {
      insights.push({
        icon: '⭐',
        title: 'Super Liker!',
        description: 'Szereted kimutatni, ha valaki nagyon tetszik!',
      });
    }

    if (stats.undoUsed > 20) {
      insights.push({
        icon: '🔄',
        title: 'Meggondolod magad!',
        description: 'Gyakran használod az visszafordítás gombot!',
      });
    }

    return insights;
  }
}

export default AnalyticsService;

