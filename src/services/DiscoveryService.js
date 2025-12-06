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
  async getDiscoveryProfiles(filters = {}, excludeIds = []) {
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
        },
        {
          id: 8,
          name: 'Mária',
          age: 25,
          distance: 4,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kávézni és jó beszélgetéseket folytatni ☕',
          interests: ['Kávé', 'Beszélgetés', 'Pszichológia']
        },
        {
          id: 9,
          name: 'Péter',
          age: 32,
          distance: 7,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kirándulni a természetben 🌲',
          interests: ['Kirándulás', 'Természet', 'Fotózás']
        },
        {
          id: 10,
          name: 'Eszter',
          age: 22,
          distance: 2,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          ],
          bio: 'Egyetemista vagyok, szeretek tanulni 📖',
          interests: ['Tanulás', 'Tudomány', 'Kutatás']
        },
        {
          id: 11,
          name: 'Tamás',
          age: 30,
          distance: 11,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek zenét hallgatni és koncertekre járni 🎵',
          interests: ['Zene', 'Koncertek', 'Gitár']
        },
        {
          id: 12,
          name: 'Réka',
          age: 28,
          distance: 14,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kertészkedni és növényeket nevelni 🌱',
          interests: ['Kertészet', 'Növények', 'Természet']
        },
        {
          id: 13,
          name: 'Balázs',
          age: 26,
          distance: 10,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek motorozni és kalandokat keresni 🏍️',
          interests: ['Motorozás', 'Kaland', 'Utazás']
        },
        {
          id: 14,
          name: 'Anikó',
          age: 29,
          distance: 5,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek főzni és új recepteket kipróbálni 👩‍🍳',
          interests: ['Főzés', 'Receptek', 'Ételek']
        },
        {
          id: 15,
          name: 'László',
          age: 33,
          distance: 16,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek sakkozni és stratégiai játékokat játszani ♟️',
          interests: ['Sakkozás', 'Stratégiai játékok', 'Logika']
        },
        {
          id: 16,
          name: 'Edit',
          age: 24,
          distance: 8,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek rajzolni és kreatív lenni 🎨',
          interests: ['Rajzolás', 'Kreativitás', 'Művészet']
        },
        {
          id: 17,
          name: 'Ferenc',
          age: 27,
          distance: 6,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek biciklizni és aktív életmódot folytatni 🚴‍♂️',
          interests: ['Biciklizés', 'Aktív életmód', 'Sport']
        },
        {
          id: 18,
          name: 'Judit',
          age: 31,
          distance: 9,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek hímezni és kézműves dolgokat csinálni 🧵',
          interests: ['Hímezés', 'Kézművesség', 'Kreativitás']
        },
        {
          id: 19,
          name: 'Attila',
          age: 25,
          distance: 12,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek videójátékokat játszani 🎮',
          interests: ['Videójátékok', 'Technológia', 'Programozás']
        },
        {
          id: 20,
          name: 'Krisztina',
          age: 26,
          distance: 7,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek jógázni és meditálni 🧘‍♀️',
          interests: ['Jóga', 'Meditáció', 'Egészség']
        },
        {
          id: 21,
          name: 'Zoltán',
          age: 34,
          distance: 13,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kertészkedni és zöldségeket termeszteni 🌽',
          interests: ['Kertészet', 'Zöldségek', 'Ökológia']
        },
        {
          id: 22,
          name: 'Viktória',
          age: 23,
          distance: 4,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek állatokat és kutyáskodni 🐕',
          interests: ['Állatok', 'Kutyák', 'Természet']
        },
        {
          id: 23,
          name: 'Mihály',
          age: 29,
          distance: 11,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek túrázni a hegyekben ⛰️',
          interests: ['Túrázás', 'Hegyek', 'Fotózás']
        },
        {
          id: 24,
          name: 'Andrea',
          age: 28,
          distance: 8,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek sütni és desszerteket készíteni 🍰',
          interests: ['Sütés', 'Desszertek', 'Ételek']
        },
        {
          id: 25,
          name: 'Gergő',
          age: 26,
          distance: 5,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek snowboard-ozni és téli sportokat űzni 🏂',
          interests: ['Snowboard', 'Téli sportok', 'Kaland']
        }
      ];

      let filtered = [...mockProfiles];

      // ✅ FIX: Exclude already liked/passed profiles
      if (excludeIds && excludeIds.length > 0) {
        filtered = filtered.filter(p => !excludeIds.includes(p.id));
      }

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

      // ✅ FIX: Shuffle results so not always the same order
      return filtered.sort(() => Math.random() - 0.5);
    } catch (error) {
      console.error('DiscoveryService error:', error);
      return [];
    }
  }
}

const discoveryService = new DiscoveryService();

export default discoveryService;
