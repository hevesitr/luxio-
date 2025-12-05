/**
 * DiscoveryService - Felfedezési feed kezelése és szűrés
 */

class DiscoveryService {
  constructor() {
    this.serviceName = 'DiscoveryService';
  }

  /**
   * Egyszerű discovery profiles lekérése szűrőkkel
   */
  async getDiscoveryProfiles(filters = {}) {
    try {
      const mockProfiles = [
        {
          id: 1,
          name: 'Anna',
          age: 24,
          distance: 3,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek utazni és új helyeket felfedezni 🌍',
          interests: ['Utazás', 'Fotózás']
        },
        {
          id: 2,
          name: 'Béla',
          age: 28,
          distance: 5,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Sportos vagyok, szeretek futni 🏃‍♂️',
          interests: ['Futás', 'Sport']
        },
        {
          id: 3,
          name: 'Kata',
          age: 26,
          distance: 8,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Művész vagyok, szeretek alkotni 🎨',
          interests: ['Művészet', 'Zene', 'Olvasás']
        },
        {
          id: 4,
          name: 'István',
          age: 31,
          distance: 12,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          ],
          bio: 'Informatikus vagyok, szeretek programozni 💻',
          interests: ['Programozás', 'Technológia', 'Tudomány']
        },
        {
          id: 5,
          name: 'Laura',
          age: 23,
          distance: 6,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Diák vagyok, szeretek táncolni 💃',
          interests: ['Tánc', 'Zene', 'Utazás']
        },
        {
          id: 6,
          name: 'Gábor',
          age: 29,
          distance: 15,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek főzni és jó ételeket kóstolni 🍳',
          interests: ['Főzés', 'Ételek', 'Bor']
        },
        {
          id: 7,
          name: 'Zsófia',
          age: 27,
          distance: 9,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek olvasni és könyvekről beszélgetni 📚',
          interests: ['Olvasás', 'Irodalom', 'Kávé']
        }
      ];

      let filtered = [...mockProfiles];

      if (filters.ageMin) {
        filtered = filtered.filter(p => p.age >= filters.ageMin);
      }
      if (filters.ageMax) {
        filtered = filtered.filter(p => p.age <= filters.ageMax);
      }
      if (filters.distance) {
        filtered = filtered.filter(p => !p.distance || p.distance <= filters.distance);
      }
      if (filters.verifiedOnly) {
        filtered = filtered.filter(p => p.verified);
      }

      return filtered;
    } catch (error) {
      console.error('DiscoveryService error:', error);
      return [];
    }
  }
}

const discoveryService = new DiscoveryService();

export default discoveryService;
