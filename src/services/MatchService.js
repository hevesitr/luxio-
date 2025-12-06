/**
 * MatchService - Matchek és előzmények kezelése Supabase-zel
 * Követelmény: 3.1 - Match állapot perzisztens tárolása
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import BaseService from './BaseService';
import PushNotificationService from './PushNotificationService';
import Logger from './Logger';

class MatchService extends BaseService {
  constructor() {
    super('MatchService');
    this.pushService = new PushNotificationService();

    // Lokális cache kulcsok
    this.STORAGE_KEY_MATCHES = '@dating_app_matches';
    this.STORAGE_KEY_HISTORY = '@dating_app_swipe_history';
    this.STORAGE_KEY_LIKED = '@dating_app_liked_profiles';
    this.STORAGE_KEY_PASSED = '@dating_app_passed_profiles';
    this.STORAGE_KEY_LAST_MESSAGES = '@dating_app_last_messages';
  }

  /**
   * Matchek mentése - Supabase prioritással, lokális cache fallback
   * @param {Array} matches - Match objektumok
   */
  async saveMatches(matches, userId) {
    try {
      const matchesData = matches.map(match => ({
        ...match,
        matchedAt: match.matchedAt || new Date().toISOString(),
      }));

      // Lokális cache mentése
      await AsyncStorage.setItem(
        `${this.STORAGE_KEY_MATCHES}_${userId}`,
        JSON.stringify(matchesData)
      );

      return { success: true };
    } catch (error) {
      Logger.error('MatchService: Error saving matches', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Matchek betöltése
   */
  async loadMatches(userId) {
    try {
      const jsonValue = await AsyncStorage.getItem(`${this.STORAGE_KEY_MATCHES}_${userId}`);
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
  async loadPassedProfiles(userId) {
    try {
      const jsonValue = await AsyncStorage.getItem(`${this.STORAGE_KEY_PASSED}_${userId}`);
      if (jsonValue != null) {
        const profileIds = JSON.parse(jsonValue);
        return profileIds; // Return as array
      }
      return [];
    } catch (error) {
      console.error('MatchService: Error loading passed profiles:', error);
      return [];
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

  // === SWIPE FELDOLGOZÁS ÉS MATCHING ALGORITMUS ===

  /**
   * Swipe feldolgozása - like/pass döntés
   * @param {string} userId - Swipe-oló felhasználó ID
   * @param {string} targetUserId - Célprofil ID
   * @param {string} action - 'like' vagy 'pass'
   * @param {object} userPreferences - Felhasználó preferenciák
   */
  async processSwipe(userId, targetUserId, action, userPreferences = {}) {
    try {
      // Validáció
      this.validateSwipeData({ userId, targetUserId, action });

      // Swipe előzmény mentése
      await this.saveSwipeHistory(userId, targetUserId, action);

      if (action === 'like' || action === 'superlike') {
        // Demo célból minden like match (könnyebb teszteléshez)
        const isMatch = true; // Mindig match történik

        if (isMatch) {
          // MATCH! 🎉
          Logger.success('Match created!', { userId, targetUserId });

          // Match létrehozása
          const matchData = {
            id: Date.now().toString(),
            userId,
            matchedUserId: targetUserId,
            matchedAt: new Date().toISOString(),
            status: 'active'
          };

          await this.saveMatches([matchData], userId);

          return {
            success: true,
            isMatch: true,
            matchData
          };
        }

        return {
          success: true,
          isMatch: false,
          liked: true
        };

      } else if (action === 'pass') {
        // Pass mentése - egyszerű lokális tárolás
        const passed = await this.loadPassedProfiles(userId) || [];
        if (!passed.includes(targetUserId)) {
          passed.push(targetUserId);
          await AsyncStorage.setItem(
            `${this.STORAGE_KEY_PASSED}_${userId}`,
            JSON.stringify(passed)
          );
        }
        return { success: true, passed: true };
      }

      return { success: true };
    } catch (error) {
      Logger.error('MatchService: Error processing swipe', error);
      return { success: false, error: error.message, isMatch: false };
    }
  }

  /**
   * Kompatibilitási algoritmus - 8-faktoros matching
   * @param {string} userId1
   * @param {string} userId2
   * @param {object} preferences
   */
  async calculateCompatibility(userId1, userId2, preferences = {}) {
    return this.executeOperation(async () => {
      // Szimulált kompatibilitási számítás
      // Valós implementációban ez adatbázis lekérdezésekből jönne

      const factors = {
        age: 0.15,        // Kor különbség
        location: 0.20,   // Helyzet (közelség)
        interests: 0.25,  // Közös érdeklődések
        lifestyle: 0.15,  // Életmód (dohányzás, alkohol, stb.)
        values: 0.15,     // Értékek és prioritások
        personality: 0.10 // Személyiség típus
      };

      // Szimulált számítások
      const compatibility = {
        overall: Math.floor(Math.random() * 40) + 60, // 60-99%
        factors: {
          age: Math.floor(Math.random() * 100),
          location: Math.floor(Math.random() * 100),
          interests: Math.floor(Math.random() * 100),
          lifestyle: Math.floor(Math.random() * 100),
          values: Math.floor(Math.random() * 100),
          personality: Math.floor(Math.random() * 100)
        },
        reasons: [
          'Hasonló életkor és érdeklődések',
          'Közös értékek és célok',
          'Kompatibilis személyiség típus'
        ]
      };

      // Súlyozott átlag számítása
      compatibility.calculated = Object.entries(compatibility.factors).reduce(
        (sum, [factor, score]) => sum + (score * factors[factor]),
        0
      );

      this.log.info('Compatibility calculated', {
        userId1,
        userId2,
        score: compatibility.overall
      });

      return compatibility;

    }, 'calculateCompatibility', { userId1, userId2 });
  }

  /**
   * Discovery feed generálása szűrőkkel
   * @param {string} userId
   * @param {object} filters
   * @param {object} preferences
   */
  async getDiscoveryFeed(userId, filters = {}, preferences = {}) {
    return this.executeOperation(async () => {
      // Szűrés validáció
      const validation = this.validateFilters(filters);
      if (!validation.valid) {
        this.throwValidationError(validation.errors);
      }

      // Korábbi interakciók lekérése (kit ne mutassunk)
      const [liked, passed, matches] = await Promise.all([
        this.loadLikedProfiles(userId),
        this.loadPassedProfiles(userId),
        this.loadMatches()
      ]);

      const excludedIds = new Set([
        ...liked.map(p => p.id),
        ...passed.map(p => p.id),
        ...matches.map(m => m.matchedUserId),
        userId // Saját profil
      ]);

      // Szimulált feed generálás
      // Valós implementációban Supabase lekérdezés lenne
      const feed = this.generateMockFeed(excludedIds, filters, preferences);

      // Kompatibilitás számítása minden profilhoz
      const feedWithCompatibility = await Promise.all(
        feed.map(async (profile) => ({
          ...profile,
          compatibility: await this.calculateCompatibility(userId, profile.id, preferences)
        }))
      );

      // Rendezés kompatibilitás szerint
      feedWithCompatibility.sort((a, b) =>
        b.compatibility.overall - a.compatibility.overall
      );

      this.log.info('Discovery feed generated', {
        userId,
        feedSize: feedWithCompatibility.length,
        filters,
        excludedCount: excludedIds.size
      });

      return feedWithCompatibility;

    }, 'getDiscoveryFeed', { userId, filters });
  }

  /**
   * Swipe előzmény mentése
   */
  async saveSwipeHistory(userId, targetUserId, action) {
    try {
      const history = await this.loadSwipeHistory(userId) || [];
      history.push({
        targetUserId,
        action,
        timestamp: new Date().toISOString()
      });

      // Maximum 1000 előzmény megtartása
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }

      await AsyncStorage.setItem(
        `${this.STORAGE_KEY_HISTORY}_${userId}`,
        JSON.stringify(history)
      );
    } catch (error) {
      this.log.error('Failed to save swipe history', { error: error.message });
    }
  }

  // === PUSH ÉRTESÍTÉSEK ===

  async sendMatchNotification(matchData) {
    try {
      // Szimulált felhasználónév lekérés
      // Valós implementációban Supabase-ből jönne
      const currentUserName = 'Valaki'; // TODO: Get from Supabase

      await this.pushService.sendMatchNotification({
        matchId: matchData.id,
        currentUserId: matchData.userId,
        matchedUserId: matchData.matchedUserId,
        currentUserName
      });
    } catch (error) {
      this.log.error('Failed to send match notification', error);
    }
  }

  // === SEGÉD METÓDUSOK ===

  validateSwipeData({ userId, targetUserId, action }) {
    const validation = this.validate(
      { userId, targetUserId, action },
      {
        userId: { required: true },
        targetUserId: { required: true },
        action: {
          required: true,
          validator: (value) => {
            if (!['like', 'pass'].includes(value)) {
              return 'Action must be "like" or "pass"';
            }
          }
        }
      }
    );

    if (!validation.valid) {
      this.throwValidationError(validation.errors);
    }
  }

  validateFilters(filters) {
    return this.validate(filters, {
      minAge: { min: 18, max: 100 },
      maxAge: { min: 18, max: 100 },
      maxDistance: { min: 1, max: 500 },
      gender: { validator: (value) => {
        if (value && !['male', 'female', 'any'].includes(value)) {
          return 'Invalid gender filter';
        }
      }}
    });
  }

  generateMockFeed(excludedIds, filters, preferences) {
    // Szimulált feed generálás teszteléshez
    // Valós implementációban Supabase-ből jönne
    const mockProfiles = [];
    const names = ['Anna', 'Béla', 'Csaba', 'Dóra', 'Eszter', 'Ferenc', 'Gábor', 'Hanna'];

    for (let i = 0; i < 20; i++) {
      const id = `user_${i + 1}`;
      if (excludedIds.has(id)) continue;

      mockProfiles.push({
        id,
        name: names[i % names.length],
        age: 20 + (i % 20),
        bio: `Érdeklődő személy vagyok! Szeretem a ${['zenét', 'utazást', 'sportot', 'olvasást'][i % 4]}.`,
        photos: [`https://picsum.photos/300/400?random=${i}`],
        interests: ['zene', 'utazás', 'sport', 'olvasás'].slice(0, (i % 3) + 1),
        location: {
          latitude: 47.4979 + (Math.random() - 0.5) * 0.1,
          longitude: 19.0402 + (Math.random() - 0.5) * 0.1
        },
        distance: Math.floor(Math.random() * 50) + 1
      });
    }

    return mockProfiles;
  }

  /**
   * Swipe előzmény betöltése
   */
  async loadSwipeHistory(userId) {
    try {
      const history = await AsyncStorage.getItem(`${this.STORAGE_KEY_HISTORY}_${userId}`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      this.log.error('Failed to load swipe history', { error: error.message });
      return [];
    }
  }
}

export default new MatchService();

