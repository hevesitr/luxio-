import AsyncStorage from '@react-native-async-storage/async-storage';

class BoostService {
  constructor() {
    this.STORAGE_KEY = '@boost_data';
    this.BOOST_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  async activateBoost() {
    try {
      const boostData = {
        isActive: true,
        startTime: Date.now(),
        endTime: Date.now() + this.BOOST_DURATION,
        profileViews: 0,
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(boostData));
      return boostData;
    } catch (error) {
      console.error('Error activating boost:', error);
      return null;
    }
  }

  async getActiveBoost() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const boostData = JSON.parse(data);
        if (boostData.isActive && Date.now() < boostData.endTime) {
          return boostData;
        } else {
          // Boost expired, deactivate it
          await this.deactivateBoost();
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting active boost:', error);
      return null;
    }
  }

  async deactivateBoost() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error deactivating boost:', error);
      return false;
    }
  }

  async isBoostActive() {
    const boost = await this.getActiveBoost();
    return boost !== null;
  }

  async getRemainingTime() {
    const boost = await this.getActiveBoost();
    if (boost) {
      return Math.max(0, boost.endTime - Date.now());
    }
    return 0;
  }

  formatRemainingTime(milliseconds) {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async incrementViews() {
    try {
      const boost = await this.getActiveBoost();
      if (boost) {
        boost.profileViews += 1;
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(boost));
        return boost.profileViews;
      }
      return 0;
    } catch (error) {
      console.error('Error incrementing views:', error);
      return 0;
    }
  }

  async getBoostStats() {
    const boost = await this.getActiveBoost();
    if (boost) {
      return {
        isActive: true,
        profileViews: boost.profileViews,
        remainingTime: this.getRemainingTime(),
        startTime: boost.startTime,
        endTime: boost.endTime,
      };
    }
    return {
      isActive: false,
      profileViews: 0,
      remainingTime: 0,
    };
  }
}

export default new BoostService();

