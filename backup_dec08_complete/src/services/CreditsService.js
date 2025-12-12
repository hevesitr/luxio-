import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDITS_KEY = '@dating_app_credits';
const CREDITS_HISTORY_KEY = '@dating_app_credits_history';

// Credit árak különböző akciókhoz
export const CREDIT_COSTS = {
  sendGift: 10,           // Ajándék küldése
  seeProfileView: 5,      // Profil megtekintés látható
  superLike: 5,           // Super Like
  boost: 50,              // Boost
  unlockFavorite: 3,      // Kedvenc feloldás
  videoCall: 20,          // Videó hívás
  sendMessage: 1,         // Üzenet küldés (prémium nélkül)
};

// Credit csomagok
export const CREDIT_PACKAGES = [
  { id: 1, credits: 50, price: 499, bonus: 0, popular: false },
  { id: 2, credits: 120, price: 999, bonus: 20, popular: true },
  { id: 3, credits: 250, price: 1999, bonus: 50, popular: false },
  { id: 4, credits: 500, price: 3499, bonus: 100, popular: false },
  { id: 5, credits: 1000, price: 5999, bonus: 250, popular: false },
];

class CreditsService {
  // Jelenlegi kreditek lekérése
  async getCredits() {
    try {
      const credits = await AsyncStorage.getItem(CREDITS_KEY);
      return credits ? parseInt(credits, 10) : 100; // Alapértelmezett 100 kredit
    } catch (error) {
      console.error('Error getting credits:', error);
      return 100;
    }
  }

  // Kreditek beállítása
  async setCredits(amount) {
    try {
      await AsyncStorage.setItem(CREDITS_KEY, amount.toString());
      return true;
    } catch (error) {
      console.error('Error setting credits:', error);
      return false;
    }
  }

  // Kreditek hozzáadása
  async addCredits(amount, reason = 'Purchase') {
    try {
      const current = await this.getCredits();
      const newAmount = current + amount;
      await this.setCredits(newAmount);
      
      // Hozzáadás a történethez
      await this.addToHistory({
        type: 'add',
        amount: amount,
        reason: reason,
        timestamp: new Date().toISOString(),
        balance: newAmount,
      });
      
      return newAmount;
    } catch (error) {
      console.error('Error adding credits:', error);
      return current;
    }
  }

  // Kreditek levonása
  async deductCredits(amount, reason = 'Usage') {
    try {
      const current = await this.getCredits();
      
      if (current < amount) {
        return { success: false, balance: current, message: 'Nincs elég kredit!' };
      }
      
      const newAmount = current - amount;
      await this.setCredits(newAmount);
      
      // Hozzáadás a történethez
      await this.addToHistory({
        type: 'deduct',
        amount: amount,
        reason: reason,
        timestamp: new Date().toISOString(),
        balance: newAmount,
      });
      
      return { success: true, balance: newAmount, message: 'Kreditek levonva!' };
    } catch (error) {
      console.error('Error deducting credits:', error);
      return { success: false, balance: current, message: 'Hiba történt!' };
    }
  }

  // Van-e elég kredit?
  async hasEnoughCredits(amount) {
    const current = await this.getCredits();
    return current >= amount;
  }

  // Történet hozzáadása
  async addToHistory(entry) {
    try {
      const history = await this.getHistory();
      history.unshift(entry);
      
      // Csak az utolsó 50 bejegyzést tároljuk
      const limitedHistory = history.slice(0, 50);
      
      await AsyncStorage.setItem(CREDITS_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  // Történet lekérése
  async getHistory() {
    try {
      const history = await AsyncStorage.getItem(CREDITS_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  // Kredit csomag vásárlás (mock)
  async purchasePackage(packageId) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return { success: false, message: 'Érvénytelen csomag!' };
    }

    // Mock vásárlás - valóságban itt lenne a fizetési integráció
    const totalCredits = pkg.credits + pkg.bonus;
    const newBalance = await this.addCredits(totalCredits, `Package ${packageId} purchase`);
    
    return {
      success: true,
      message: `${totalCredits} kredit hozzáadva!`,
      balance: newBalance,
    };
  }
}

export default new CreditsService();

