class DateIdeasService {
  // Date helyszínek kategóriánként (Budapest központi helyei)
  static dateSpots = {
    coffee: [
      {
        name: 'Espresso Embassy',
        type: 'Kávézó',
        location: { latitude: 47.5006, longitude: 19.0544 },
        vibe: '☕ Nyugodt, beszélgetős',
        budget: '💰',
        description: 'Chill specialty kávézó a belvárosban',
      },
      {
        name: 'Starbucks Reserve',
        type: 'Kávézó',
        location: { latitude: 47.4979, longitude: 19.0402 },
        vibe: '☕ Modern, kényelmes',
        budget: '💰💰',
        description: 'Prémium kávék és hangulatos környezet',
      },
    ],
    restaurant: [
      {
        name: 'Bors GasztróBár',
        type: 'Étterem',
        location: { latitude: 47.4989, longitude: 19.0572 },
        vibe: '🍜 Casual, finom',
        budget: '💰',
        description: 'Ízes levesek és szendvicsek',
      },
      {
        name: 'Mazel Tov',
        type: 'Étterem',
        location: { latitude: 47.4971, longitude: 19.0625 },
        vibe: '🍽️ Trendy, vibráló',
        budget: '💰💰',
        description: 'Mediterrán konyha, gyönyörű kert',
      },
    ],
    activity: [
      {
        name: 'Margitsziget',
        type: 'Park',
        location: { latitude: 47.5280, longitude: 19.0510 },
        vibe: '🌳 Természet, aktív',
        budget: '💚 Ingyenes',
        description: 'Séta, biciklizés, piknik',
      },
      {
        name: 'Budapest Eye',
        type: 'Látnivaló',
        location: { latitude: 47.5213, longitude: 19.0567 },
        vibe: '🎡 Romantikus, izgalmas',
        budget: '💰💰',
        description: 'Óriáskerék csodálatos kilátással',
      },
    ],
    culture: [
      {
        name: 'Szépművészeti Múzeum',
        type: 'Múzeum',
        location: { latitude: 47.5176, longitude: 19.0766 },
        vibe: '🎨 Kulturált, elegáns',
        budget: '💰',
        description: 'Világszínvonalú művészeti gyűjtemény',
      },
      {
        name: 'Magyar Állami Operaház',
        type: 'Opera',
        location: { latitude: 47.5028, longitude: 19.0589 },
        vibe: '🎭 Kifinomult, lenyűgöző',
        budget: '💰💰💰',
        description: 'Operaelőadások gyönyörű épületben',
      },
    ],
    drink: [
      {
        name: 'Szimpla Kert',
        type: 'Romkocsma',
        location: { latitude: 47.4971, longitude: 19.0625 },
        vibe: '🍺 Laza, egyedi',
        budget: '💰',
        description: 'Ikonikus romkocsma, különleges hangulat',
      },
      {
        name: '360 Bar',
        type: 'Tetőterasz bár',
        location: { latitude: 47.5070, longitude: 19.0528 },
        vibe: '🍸 Elegáns, panorámás',
        budget: '💰💰💰',
        description: 'Lélegzetelállító kilátás a városra',
      },
    ],
  };

  // Date ötletek kompatibilitás alapján
  static dateActivitySuggestions = {
    high: [  // 85%+ kompatibilitás
      {
        title: 'Romantikus séta és vacsora',
        description: 'Kezdjétek egy sétával a Dunakorzón, majd vacsorázatok egy hangulatos étteremben.',
        duration: '3-4 óra',
        emoji: '💕',
      },
      {
        title: 'Múzeum látogatás + kávé',
        description: 'Nézzetek meg egy érdekes kiállítást, aztán beszéljétek meg egy kávé mellett.',
        duration: '2-3 óra',
        emoji: '🎨',
      },
      {
        title: 'Piknik a parkban',
        description: 'Vigyetek finom falatokat és élvezzétek a szabadtéri időtöltést.',
        duration: '2-3 óra',
        emoji: '🧺',
      },
    ],
    medium: [  // 55-84% kompatibilitás
      {
        title: 'Kávé és beszélgetés',
        description: 'Egy nyugodt kávézóban ismerkedjetek meg közelebbről.',
        duration: '1-2 óra',
        emoji: '☕',
      },
      {
        title: 'Séta a városban',
        description: 'Fedezzétek fel együtt a város egy szép részét.',
        duration: '1-2 óra',
        emoji: '🚶',
      },
    ],
    low: [  // <55% kompatibilitás
      {
        title: 'Gyors kávé',
        description: 'Ismerkedjetek meg egy rövid kávé erejéig.',
        duration: '30-60 perc',
        emoji: '☕',
      },
    ],
  };

  // Date javaslat generálása kompatibilitás és távolság alapján
  static generateDateSuggestions(compatibility, userLocation, matchLocation) {
    const suggestions = [];

    // Válassz aktivitási javaslatokat kompatibilitás alapján
    let activityLevel = 'low';
    if (compatibility >= 85) activityLevel = 'high';
    else if (compatibility >= 55) activityLevel = 'medium';

    const activities = this.dateActivitySuggestions[activityLevel];

    // Keress helyszíneket minden kategóriából
    const nearbySpots = this.findNearbySpots(userLocation, 5); // 5 km-en belül

    // Kombináld az aktivitásokat helyszínekkel
    activities.forEach(activity => {
      const spot = this.selectBestSpot(activity, nearbySpots);
      if (spot) {
        suggestions.push({
          ...activity,
          spot,
          distance: this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            spot.location.latitude,
            spot.location.longitude
          ),
        });
      }
    });

    return suggestions;
  }

  // Közeli helyszínek keresése
  static findNearbySpots(userLocation, maxDistance) {
    const nearby = [];

    Object.values(this.dateSpots).forEach(category => {
      category.forEach(spot => {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          spot.location.latitude,
          spot.location.longitude
        );

        if (distance <= maxDistance) {
          nearby.push({ ...spot, distance });
        }
      });
    });

    return nearby.sort((a, b) => a.distance - b.distance);
  }

  // Legjobb helyszín kiválasztása aktivitáshoz
  static selectBestSpot(activity, nearbySpots) {
    // Egyszerű logika: válassz egy random közeli helyszínt
    if (nearbySpots.length === 0) return null;
    
    // Próbálj megfelelő típust találni
    const activityWords = activity.title.toLowerCase();
    if (activityWords.includes('kávé')) {
      const coffeeSpots = nearbySpots.filter(s => s.type === 'Kávézó');
      if (coffeeSpots.length > 0) return coffeeSpots[0];
    } else if (activityWords.includes('vacsora') || activityWords.includes('étterem')) {
      const restaurants = nearbySpots.filter(s => s.type === 'Étterem');
      if (restaurants.length > 0) return restaurants[0];
    } else if (activityWords.includes('séta') || activityWords.includes('park')) {
      const parks = nearbySpots.filter(s => s.type === 'Park');
      if (parks.length > 0) return parks[0];
    }

    return nearbySpots[0];
  }

  // Távolság számítása (Haversine formula egyszerűsített)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Föld sugara km-ben
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // 1 tizedesjegyre kerekítve
  }

  static deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Biztonsági tippek első találkozóhoz
  static getFirstDateSafetyTips() {
    return [
      '👥 Találkozzatok nyilvános helyen',
      '📱 Értesíts egy barátot a találkozóról',
      '🚗 Saját közlekedéssel menj',
      '🍷 Figyelj az italodra',
      '🕐 Első alkalom: rövid program (1-2 óra)',
      '💬 Maradj józan az első randin',
      '📍 Ossz meg élőben helyet egy baráttal',
    ];
  }
}

export default DateIdeasService;

