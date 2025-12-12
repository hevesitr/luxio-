/**
 * Profile Repository
 *
 * Data access layer for profile operations
 * Implements Repository pattern for clean separation of concerns
 */

class ProfileRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Find profile by ID
   * @param {string} id - Profile ID
   * @returns {Promise<Object>} Profile data
   */
  async findById(id) {
    const { data, error } = await this.dataSource
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Profile not found: ${error.message}`);
    }

    return this.transformProfile(data);
  }

  /**
   * Find profiles by filters
   * @param {Object} filters - Search filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Filtered profiles
   */
  async findByFilters(filters = {}, options = {}) {
    const { limit = 50, offset = 0 } = options;

    let query = this.dataSource
      .from('profiles')
      .select(`
        id,
        full_name,
        age,
        bio,
        avatar_url,
        updated_at,
        gender
      `)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.minAge) {
      query = query.gte('age', filters.minAge);
    }

    if (filters.maxAge) {
      query = query.lte('age', filters.maxAge);
    }

    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }

    if (filters.interests && filters.interests.length > 0) {
      // Overlap with interests array
      query = query.overlaps('interests', filters.interests);
    }

    if (filters.verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`Profile search failed: ${error.message} (Code: ${error.code})`);
    }

    return data ? data.map(profile => this.transformProfile(profile)) : [];
  }

  /**
   * Create new profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Created profile
   */
  async create(profileData) {
    const { data, error } = await this.dataSource
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      throw new Error(`Profile creation failed: ${error.message}`);
    }

    return this.transformProfile(data);
  }

  /**
   * Update profile
   * @param {string} id - Profile ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated profile
   */
  async update(id, updates) {
    const { data, error } = await this.dataSource
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }

    return this.transformProfile(data);
  }

  /**
   * Delete profile
   * @param {string} id - Profile ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const { error } = await this.dataSource
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Profile deletion failed: ${error.message}`);
    }

    return true;
  }

  /**
   * Find profiles near location
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radiusKm - Search radius in km
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Nearby profiles
   */
  async findNearby(latitude, longitude, radiusKm = 50, filters = {}) {
    // Note: This would require PostGIS extension for proper geospatial queries
    // For now, we'll use a simplified distance calculation

    const { data, error } = await this.dataSource
      .from('profiles')
      .select(`
        id,
        full_name,
        age,
        bio,
        interests,
        avatar_url,
        is_verified
      `);

    if (error) {
      throw new Error(`Nearby search failed: ${error.message}`);
    }

    // Apply filters (location-based filtering not available without latitude/longitude)
    let filtered = data;
    if (filters.minAge) {
      filtered = filtered.filter(p => p.age >= filters.minAge);
    }
    if (filters.maxAge) {
      filtered = filtered.filter(p => p.age <= filters.maxAge);
    }
    if (filters.gender) {
      filtered = filtered.filter(p => p.gender === filters.gender);
    }

    return filtered
      .map(profile => this.transformProfile(profile));
  }

  /**
   * Transform raw profile data
   * @param {Object} rawProfile - Raw profile from database
   * @returns {Object} Transformed profile
   */
  transformProfile(rawProfile) {
    return {
      id: rawProfile.id,
      name: rawProfile.full_name,
      age: rawProfile.age,
      bio: rawProfile.bio,
      gender: rawProfile.gender,
      interests: Array.isArray(rawProfile.interests) ? rawProfile.interests : [],
      prompts: Array.isArray(rawProfile.prompts) ? rawProfile.prompts : [],
      photos: Array.isArray(rawProfile.photos) ? rawProfile.photos : [],
      avatarUrl: rawProfile.avatar_url,
      isVerified: rawProfile.is_verified !== undefined ? rawProfile.is_verified : false,
      updatedAt: rawProfile.updated_at,
      // Additional computed fields
      profileCompleteness: this.calculateProfileCompleteness(rawProfile)
    };
  }

  /**
   * Calculate profile completeness score
   * @param {Object} profile - Profile data
   * @returns {number} Completeness percentage
   */
  calculateProfileCompleteness(profile) {
    const fields = [
      { field: 'full_name', weight: 10 },
      { field: 'age', weight: 25 },
      { field: 'bio', weight: 25 },
      { field: 'avatar_url', weight: 25 },
      { field: 'gender', weight: 15 },
      { field: 'full_name', weight: 10 }
    ];

    let totalScore = 0;

    fields.forEach(({ field, weight, check }) => {
      const value = profile[field];
      const hasValue = check ? check(value) : (value !== null && value !== undefined && value !== '');

      if (hasValue) {
        totalScore += weight;
      }
    });

    return Math.min(100, totalScore);
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export default ProfileRepository;
