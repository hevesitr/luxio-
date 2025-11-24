/**
 * MatchService - Matchek és előzmények perzisztens tárolása
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

class MatchService {
  static STORAGE_KEY_MATCHES = '@dating_app_matches';
  static STORAGE_KEY_HISTORY = '@dating_app_swipe_history';
  static STORAGE_KEY_LIKED = '@dating_app_liked_profiles';
  static STORAGE_KEY_PASSED = '@dating_app_passed_profiles';
  static STORAGE_KEY_LAST_MESSAGES = '@dating_app_last_messages';

  /**
   * Matchek mentése
   */
  static async saveMatches(matches) {
    try {
      const matchesData = matches.map(match => ({
        ...match,
        matchedAt: match.matchedAt || new Date().toISOString(),
      }));
      await AsyncStorage.setItem(
        this.STORAGE_KEY_MATCHES,
        JSON.stringify(matchesData)
      );
      console.log('MatchService: Matches saved', matchesData.length);
    } catch (error) {
      console.error('MatchService: Error saving matches:', error);
    }
  }

  /**
   * Matchek betöltése
   */
  static async loadMatches() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY_MATCHES);
      if (jsonValue != null) {
        const matches = JSON.parse(jsonValue);
        console.log('MatchService: Matches loaded', matches.length);
        return matches;
      }
      return [];
    } catch (error) {
      console.error('MatchService: Error loading matches:', error);
      return [];
    }
  }

  /**
   * Match hozzáadása
   */
  static async addMatch(profile) {
    try {
      const matches = await this.loadMatches();
      
      // Ellenőrizzük, hogy nincs-e már ilyen match
      const existingMatch = matches.find(m => m.id === profile.id);
      if (existingMatch) {
        console.log('MatchService: Match already exists', profile.id);
        return matches;
      }

      const newMatch = {
        ...profile,
        matchedAt: new Date().toISOString(),
      };

      matches.push(newMatch);
      await this.saveMatches(matches);
      return matches;
    } catch (error) {
      console.error('MatchService: Error adding match:', error);
      return [];
    }
  }

  /**
   * Match törlése
   */
  static async removeMatch(profileId) {
    try {
      const matches = await this.loadMatches();
      const filtered = matches.filter(m => m.id !== profileId);
      await this.saveMatches(filtered);
      console.log('MatchService: Match removed', profileId);
      return filtered;
    } catch (error) {
      console.error('MatchService: Error removing match:', error);
      return [];
    }
  }

  /**
   * Swipe előzmények mentése
   */
  static async saveHistory(history) {
    try {
      // Csak az utolsó 100 elemet tároljuk
      const limitedHistory = history.slice(-100);
      await AsyncStorage.setItem(
        this.STORAGE_KEY_HISTORY,
        JSON.stringify(limitedHistory)
      );
      console.log('MatchService: History saved', limitedHistory.length);
    } catch (error) {
      console.error('MatchService: Error saving history:', error);
    }
  }

  /**
   * Swipe előzmények betöltése
   */
  static async loadHistory() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY_HISTORY);
      if (jsonValue != null) {
        const history = JSON.parse(jsonValue);
        console.log('MatchService: History loaded', history.length);
        return history;
      }
      return [];
    } catch (error) {
      console.error('MatchService: Error loading history:', error);
      return [];
    }
  }

  /**
   * Liked profilok mentése (map-hez)
   */
  static async saveLikedProfiles(likedProfiles) {
    try {
      const profileIds = Array.from(likedProfiles);
      await AsyncStorage.setItem(
        this.STORAGE_KEY_LIKED,
        JSON.stringify(profileIds)
      );
    } catch (error) {
      console.error('MatchService: Error saving liked profiles:', error);
    }
  }

  /**
   * Liked profilok betöltése
   */
  static async loadLikedProfiles() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY_LIKED);
      if (jsonValue != null) {
        const profileIds = JSON.parse(jsonValue);
        return new Set(profileIds);
      }
      return new Set();
    } catch (error) {
      console.error('MatchService: Error loading liked profiles:', error);
      return new Set();
    }
  }

  /**
   * Passed profilok mentése
   */
  static async savePassedProfiles(passedProfiles) {
    try {
      const profileIds = Array.from(passedProfiles);
      await AsyncStorage.setItem(
        this.STORAGE_KEY_PASSED,
        JSON.stringify(profileIds)
      );
    } catch (error) {
      console.error('MatchService: Error saving passed profiles:', error);
    }
  }

  /**
   * Passed profilok betöltése
   */
  static async loadPassedProfiles() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY_PASSED);
      if (jsonValue != null) {
        const profileIds = JSON.parse(jsonValue);
        return new Set(profileIds);
      }
      return new Set();
    } catch (error) {
      console.error('MatchService: Error loading passed profiles:', error);
      return new Set();
    }
  }

  /**
   * Összes adat törlése (teszteléshez)
   */
  static async clearAll() {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEY_MATCHES,
        this.STORAGE_KEY_HISTORY,
        this.STORAGE_KEY_LIKED,
        this.STORAGE_KEY_PASSED,
      ]);
      console.log('MatchService: All data cleared');
    } catch (error) {
      console.error('MatchService: Error clearing data:', error);
    }
  }

  /**
   * Utolsó üzenetek mentése
   */
  static async saveLastMessages(messages) {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY_LAST_MESSAGES,
        JSON.stringify(messages || {})
      );
    } catch (error) {
      console.error('MatchService: Error saving last messages:', error);
    }
  }

  /**
   * Utolsó üzenetek betöltése
   */
  static async loadLastMessages() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY_LAST_MESSAGES);
      if (jsonValue) {
        return JSON.parse(jsonValue);
      }
      return {};
    } catch (error) {
      console.error('MatchService: Error loading last messages:', error);
      return {};
    }
  }

  /**
   * Utolsó üzenet frissítése egy match-hez
   */
  static async updateLastMessage(matchId, messageData) {
    if (!matchId || !messageData) {
      return {};
    }

    try {
      const allMessages = await this.loadLastMessages();
      allMessages[matchId] = {
        text: messageData.text || '',
        sender: messageData.sender || 'me',
        type: messageData.type || 'text',
        timestamp: messageData.timestamp || new Date().toISOString(),
      };
      await this.saveLastMessages(allMessages);
      return allMessages;
    } catch (error) {
      console.error('MatchService: Error updating last message:', error);
      return {};
    }
  }
}

export default MatchService;

