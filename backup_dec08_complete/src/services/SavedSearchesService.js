import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_SEARCHES_KEY = '@saved_searches';

class SavedSearchesService {
  // Mentett keresések lekérése
  static async getSavedSearches() {
    try {
      const data = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting saved searches:', error);
      return [];
    }
  }

  // Keresés mentése
  static async saveSearch(searchParams) {
    try {
      const searches = await this.getSavedSearches();
      const newSearch = {
        id: Date.now().toString(),
        name: searchParams.name || `Keresés ${searches.length + 1}`,
        params: {
          distance: searchParams.distance,
          ageMin: searchParams.ageMin,
          ageMax: searchParams.ageMax,
          relationshipGoal: searchParams.relationshipGoal,
          verifiedOnly: searchParams.verifiedOnly,
          onlineOnly: searchParams.onlineOnly,
        },
        createdAt: new Date().toISOString(),
      };
      
      searches.unshift(newSearch); // Legújabb elöl
      // Maximum 10 mentett keresés
      const limitedSearches = searches.slice(0, 10);
      
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(limitedSearches));
      return newSearch;
    } catch (error) {
      console.error('Error saving search:', error);
      return null;
    }
  }

  // Keresés törlése
  static async deleteSearch(searchId) {
    try {
      const searches = await this.getSavedSearches();
      const filtered = searches.filter(s => s.id !== searchId);
      await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting search:', error);
      return false;
    }
  }

  // Összes keresés törlése
  static async clearAllSearches() {
    try {
      await AsyncStorage.removeItem(SAVED_SEARCHES_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing searches:', error);
      return false;
    }
  }
}

export default SavedSearchesService;

