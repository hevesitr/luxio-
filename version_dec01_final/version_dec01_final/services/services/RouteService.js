/**
 * RouteService - Valódi útvonal generálás Google Directions API vagy Mapbox Directions API használatával
 */

class RouteService {
  // Google Directions API endpoint
  static GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';
  
  // Mapbox Directions API endpoint
  static MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox/driving';
  
  // API kulcsok (environment változókból vagy Expo config-ból)
  static get GOOGLE_API_KEY() {
    // Expo esetén: Expo.Constants.expoConfig?.extra?.googleMapsApiKey
    // React Native esetén: process.env.GOOGLE_MAPS_API_KEY
    if (typeof process !== 'undefined' && process.env) {
      return process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    }
    return '';
  }
  
  static get MAPBOX_ACCESS_TOKEN() {
    // Expo esetén: Expo.Constants.expoConfig?.extra?.mapboxAccessToken
    // React Native esetén: process.env.MAPBOX_ACCESS_TOKEN
    if (typeof process !== 'undefined' && process.env) {
      return process.env.MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    }
    return '';
  }

  /**
   * Valódi útvonal koordinátáinak lekérése két pont között
   * @param {number} originLat - Kiindulási pont szélesség
   * @param {number} originLon - Kiindulási pont hosszúság
   * @param {number} destLat - Célpont szélesség
   * @param {number} destLon - Célpont hosszúság
   * @param {string} provider - 'google' vagy 'mapbox' (default: 'google')
   * @returns {Promise<Array>} Útvonal koordináták tömbje
   */
  static async getRouteCoordinates(originLat, originLon, destLat, destLon, provider = 'google') {
    try {
      if (provider === 'google') {
        return await this.getGoogleRoute(originLat, originLon, destLat, destLon);
      } else if (provider === 'mapbox') {
        return await this.getMapboxRoute(originLat, originLon, destLat, destLon);
      } else {
        // Fallback: szimulált útvonal
        return this.getSimulatedRoute(originLat, originLon, destLat, destLon);
      }
    } catch (error) {
      console.error('RouteService: Error getting route:', error);
      // Fallback: szimulált útvonal hiba esetén
      return this.getSimulatedRoute(originLat, originLon, destLat, destLon);
    }
  }

  /**
   * Google Directions API használata
   */
  static async getGoogleRoute(originLat, originLon, destLat, destLon) {
    const apiKey = this.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('RouteService: Google API key not set, using simulated route');
      return this.getSimulatedRoute(originLat, originLon, destLat, destLon);
    }

    const origin = `${originLat},${originLon}`;
    const destination = `${destLat},${destLon}`;
    const url = `${this.GOOGLE_DIRECTIONS_API}?origin=${origin}&destination=${destination}&key=${apiKey}&mode=driving`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = [];

        // Extract coordinates from the route polyline or legs
        if (route.overview_polyline && route.overview_polyline.points) {
          // Decode polyline (Google uses encoded polylines)
          const decoded = this.decodePolyline(route.overview_polyline.points);
          return decoded.map(point => ({
            latitude: point.lat,
            longitude: point.lng,
          }));
        } else if (route.legs && route.legs.length > 0) {
          // Extract from steps
          route.legs.forEach(leg => {
            if (leg.steps) {
              leg.steps.forEach(step => {
                if (step.start_location) {
                  coordinates.push({
                    latitude: step.start_location.lat,
                    longitude: step.start_location.lng,
                  });
                }
                if (step.end_location) {
                  coordinates.push({
                    latitude: step.end_location.lat,
                    longitude: step.end_location.lng,
                  });
                }
              });
            }
          });
        }

        return coordinates.length > 0 ? coordinates : this.getSimulatedRoute(originLat, originLon, destLat, destLon);
      } else {
        console.warn('RouteService: Google API returned error:', data.status);
        return this.getSimulatedRoute(originLat, originLon, destLat, destLon);
      }
    } catch (error) {
      console.error('RouteService: Google API error:', error);
      return this.getSimulatedRoute(originLat, originLon, destLat, destLat);
    }
  }

  /**
   * Mapbox Directions API használata
   */
  static async getMapboxRoute(originLat, originLon, destLat, destLon) {
    const accessToken = this.MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.warn('RouteService: Mapbox access token not set, using simulated route');
      return this.getSimulatedRoute(originLat, originLon, destLat, destLon);
    }

    const coordinates = `${originLon},${originLat};${destLon},${destLat}`;
    const url = `${this.MAPBOX_DIRECTIONS_API}/${coordinates}?access_token=${accessToken}&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        if (route.geometry && route.geometry.coordinates) {
          // Mapbox returns coordinates as [lon, lat]
          return route.geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
        }
      }

      return this.getSimulatedRoute(originLat, originLon, destLat, destLon);
    } catch (error) {
      console.error('RouteService: Mapbox API error:', error);
      return this.getSimulatedRoute(originLat, originLon, destLat, destLon);
    }
  }

  /**
   * Szimulált útvonal (fallback)
   */
  static getSimulatedRoute(lat1, lon1, lat2, lon2) {
    const numPoints = 25;
    const coordinates = [];
    
    const latDiff = lat2 - lat1;
    const lonDiff = lon2 - lon1;
    const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
    
    const controlPoint1Lat = lat1 + latDiff * 0.33;
    const controlPoint1Lon = lon1 + lonDiff * 0.33;
    const controlPoint2Lat = lat1 + latDiff * 0.67;
    const controlPoint2Lon = lon1 + lonDiff * 0.67;
    
    const perpOffset = Math.min(distance * 0.15, 0.0015);
    const perpLat1 = -lonDiff * perpOffset;
    const perpLon1 = latDiff * perpOffset;
    const perpLat2 = lonDiff * perpOffset * 0.7;
    const perpLon2 = -latDiff * perpOffset * 0.7;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;
      
      const lat = mt3 * lat1 + 
                  3 * mt2 * t * (controlPoint1Lat + perpLat1) + 
                  3 * mt * t2 * (controlPoint2Lat + perpLat2) + 
                  t3 * lat2;
      
      const lon = mt3 * lon1 + 
                  3 * mt2 * t * (controlPoint1Lon + perpLon1) + 
                  3 * mt * t2 * (controlPoint2Lon + perpLon2) + 
                  t3 * lon2;
      
      coordinates.push({ latitude: lat, longitude: lon });
    }
    
    return coordinates;
  }

  /**
   * Google encoded polyline dekódolása
   */
  static decodePolyline(encoded) {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      poly.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
    }
    return poly;
  }
}

export default RouteService;

