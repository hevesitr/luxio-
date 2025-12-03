/**
 * SupabaseMatchService - Match-ek kezelése Supabase-zel
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import MatchService from './MatchService'; // Lokális cache
import ErrorHandler, { ErrorCodes } from './ErrorHandler';
import LocationService from './LocationService';

class SupabaseMatchService {
  /**
   * Match létrehozása
   */
  async createMatch(userId, matchedUserId) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          user_id: userId,
          matched_user_id: matchedUserId,
          matched_at: new Date().toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      Logger.success('Match created', { userId, matchedUserId });
      
      // Lokális cache frissítése
      await this.syncMatchesToLocal(userId);
      
      return { success: true, data };
    } catch (error) {
      Logger.error('Match creation failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Match-ek lekérése
   */
  async getMatches(userId) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          matched_profile:profiles!matches_matched_user_id_fkey(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('matched_at', { ascending: false });

      if (error) throw error;

      Logger.debug('Matches fetched', { userId, count: data.length });
      
      // Lokális cache frissítése
      const profiles = data.map(match => ({
        ...match.matched_profile,
        matchedAt: match.matched_at,
        matchId: match.id,
      }));
      await MatchService.saveMatches(profiles);
      
      return { success: true, data: profiles };
    } catch (error) {
      Logger.error('Matches fetch failed', error);
      
      // Fallback: lokális cache
      const localMatches = await MatchService.loadMatches();
      return { success: false, error: error.message, data: localMatches };
    }
  }

  /**
   * Match törlése (unmatch)
   */
  async deleteMatch(matchId) {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'unmatched' })
        .eq('id', matchId);

      if (error) throw error;

      Logger.success('Match deleted', { matchId });
      return { success: true };
    } catch (error) {
      Logger.error('Match deletion failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Like mentése
   */
  async saveLike(userId, likedUserId) {
    try {
      // Ellenőrizzük, hogy már like-oltuk-e ezt a profilt
      const { data: alreadyLiked, error: checkOwnError } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .eq('liked_user_id', likedUserId)
        .single();

      if (checkOwnError && checkOwnError.code !== 'PGRST116') {
        throw checkOwnError;
      }

      // Ha már like-oltuk, ne csináljunk semmit
      if (alreadyLiked) {
        Logger.debug('Already liked this profile', { userId, likedUserId });
        return { success: true, isMatch: false, alreadyLiked: true };
      }

      // Ellenőrizzük, hogy a másik fél is like-olt-e minket
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', likedUserId)
        .eq('liked_user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Like mentése
      const { error: insertError } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          liked_user_id: likedUserId,
          liked_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Ha mutual like, akkor match
      if (existingLike) {
        Logger.info('Mutual like detected, creating match', { userId, likedUserId });
        await this.createMatch(userId, likedUserId);
        await this.createMatch(likedUserId, userId); // Kétirányú match
        return { success: true, isMatch: true };
      }

      Logger.debug('Like saved', { userId, likedUserId });
      return { success: true, isMatch: false };
    } catch (error) {
      Logger.error('Like save failed', error);
      console.error('DETAILED ERROR:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }
  }

  /**
   * Pass mentése
   */
  async savePass(userId, passedUserId) {
    try {
      // Ellenőrizzük, hogy már pass-oltuk-e ezt a profilt
      const { data: alreadyPassed, error: checkError } = await supabase
        .from('passes')
        .select('*')
        .eq('user_id', userId)
        .eq('passed_user_id', passedUserId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Ha már pass-oltuk, ne csináljunk semmit
      if (alreadyPassed) {
        Logger.debug('Already passed this profile', { userId, passedUserId });
        return { success: true, alreadyPassed: true };
      }

      const { error } = await supabase
        .from('passes')
        .insert({
          user_id: userId,
          passed_user_id: passedUserId,
          passed_at: new Date().toISOString(),
        });

      if (error) throw error;

      Logger.debug('Pass saved', { userId, passedUserId });
      return { success: true };
    } catch (error) {
      Logger.error('Pass save failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lokális cache szinkronizálása
   */
  async syncMatchesToLocal(userId) {
    try {
      const result = await this.getMatches(userId);
      if (result.success) {
        await MatchService.saveMatches(result.data);
        Logger.debug('Matches synced to local', { count: result.data.length });
      }
    } catch (error) {
      Logger.error('Match sync failed', error);
    }
  }

  /**
   * Offline match-ek szinkronizálása
   */
  async syncOfflineMatches(userId) {
    try {
      // Lokális match-ek betöltése
      const localMatches = await MatchService.loadMatches();
      
      // Szerver match-ek betöltése
      const serverResult = await this.getMatches(userId);
      
      if (!serverResult.success) {
        Logger.warn('Cannot sync offline matches, server unavailable');
        return { success: false };
      }

      const serverMatches = serverResult.data;
      const serverMatchIds = new Set(serverMatches.map(m => m.id));

      // Lokális match-ek, amik nincsenek a szerveren
      const offlineMatches = localMatches.filter(m => !serverMatchIds.has(m.id));

      // Feltöltés a szerverre
      for (const match of offlineMatches) {
        await this.createMatch(userId, match.id);
      }

      Logger.success('Offline matches synced', { count: offlineMatches.length });
      return { success: true, count: offlineMatches.length };
    } catch (error) {
      Logger.error('Offline match sync failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Discovery Feed lekérése szűrőkkel
   * Implements Requirements 5.1, 5.5
   */
  async getDiscoveryFeed(userId, filters = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Felhasználó profiljának lekérése
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Alapértelmezett szűrők a felhasználó preferenciáiból
      const effectiveFilters = {
        minAge: filters.minAge || userProfile.age_min || 18,
        maxAge: filters.maxAge || userProfile.age_max || 99,
        gender: filters.gender || userProfile.gender_preference || 'everyone',
        maxDistance: filters.maxDistance || userProfile.distance_max || 50,
        relationshipGoal: filters.relationshipGoal || null,
      };

      // Már látott profilok (likes + passes)
      const { data: seenProfiles } = await supabase
        .from('likes')
        .select('liked_user_id')
        .eq('user_id', userId);

      const { data: passedProfiles } = await supabase
        .from('passes')
        .select('passed_user_id')
        .eq('user_id', userId);

      const seenIds = [
        ...seenProfiles.map(p => p.liked_user_id),
        ...passedProfiles.map(p => p.passed_user_id),
      ];

      // Profilok lekérése szűrőkkel
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId) // Saját profil kizárása
        .gte('age', effectiveFilters.minAge)
        .lte('age', effectiveFilters.maxAge);

      // Gender szűrő
      if (effectiveFilters.gender !== 'everyone') {
        query = query.eq('gender', effectiveFilters.gender);
      }

      // Relationship goal szűrő
      if (effectiveFilters.relationshipGoal) {
        query = query.eq('relationship_goal', effectiveFilters.relationshipGoal);
      }

      // Már látott profilok kizárása
      if (seenIds.length > 0) {
        query = query.not('id', 'in', `(${seenIds.join(',')})`);
      }

      // Limit
      query = query.limit(50);

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Távolság szűrés (ha van helyzet)
      let filteredProfiles = profiles;
      if (userProfile.location && effectiveFilters.maxDistance) {
        filteredProfiles = LocationService.filterByDistance(
          profiles,
          userProfile.location,
          effectiveFilters.maxDistance
        );
      }

      // Távolság hozzáadása minden profilhoz
      filteredProfiles = filteredProfiles.map(profile => ({
        ...profile,
        distance: userProfile.location && profile.location
          ? LocationService.calculateDistance(userProfile.location, profile.location)
          : null,
      }));

      // Rendezés távolság szerint
      if (userProfile.location) {
        filteredProfiles = LocationService.sortByDistance(
          filteredProfiles,
          userProfile.location
        );
      }

      Logger.debug('Discovery feed fetched', {
        userId,
        count: filteredProfiles.length,
        filters: effectiveFilters,
      });

      return filteredProfiles;
    }, { operation: 'getDiscoveryFeed', userId });
  }

  /**
   * Szűrők mentése
   * Implements Requirement 5.5
   */
  async saveFilters(userId, filters) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          age_min: filters.minAge,
          age_max: filters.maxAge,
          gender_preference: filters.gender,
          distance_max: filters.maxDistance,
        })
        .eq('id', userId);

      if (error) throw error;

      Logger.success('Filters saved', { userId, filters });
      return filters;
    }, { operation: 'saveFilters', userId });
  }

  /**
   * Kompatibilitási pontszám számítása
   * Implements Requirement 5.3
   */
  calculateCompatibility(user1Profile, user2Profile) {
    let score = 0;
    let maxScore = 0;

    // Közös érdeklődési körök (40 pont)
    maxScore += 40;
    if (user1Profile.interests && user2Profile.interests) {
      const interests1 = new Set(user1Profile.interests);
      const interests2 = new Set(user2Profile.interests);
      const commonInterests = [...interests1].filter(i => interests2.has(i));
      score += (commonInterests.length / Math.max(interests1.size, interests2.size)) * 40;
    }

    // Távolság (30 pont) - minél közelebb, annál jobb
    maxScore += 30;
    if (user1Profile.location && user2Profile.location) {
      const distance = LocationService.calculateDistance(
        user1Profile.location,
        user2Profile.location
      );
      if (distance !== null) {
        // 0-5 km: 30 pont, 5-20 km: 20 pont, 20-50 km: 10 pont, 50+ km: 0 pont
        if (distance <= 5) score += 30;
        else if (distance <= 20) score += 20;
        else if (distance <= 50) score += 10;
      }
    }

    // Kapcsolati cél egyezés (20 pont)
    maxScore += 20;
    if (user1Profile.relationship_goal && user2Profile.relationship_goal) {
      if (user1Profile.relationship_goal === user2Profile.relationship_goal) {
        score += 20;
      }
    }

    // Aktivitási minta (10 pont) - hasonló online idők
    maxScore += 10;
    if (user1Profile.last_active && user2Profile.last_active) {
      const hoursDiff = Math.abs(
        new Date(user1Profile.last_active).getHours() -
        new Date(user2Profile.last_active).getHours()
      );
      score += Math.max(0, 10 - hoursDiff);
    }

    // Normalizálás 0-100 skálára
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Discovery feed kompatibilitási pontszámmal
   */
  async getDiscoveryFeedWithCompatibility(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const feedResult = await this.getDiscoveryFeed(userId);
      if (!feedResult.success) throw new Error(feedResult.error);

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const profilesWithScore = feedResult.data.map(profile => ({
        ...profile,
        compatibilityScore: this.calculateCompatibility(userProfile, profile),
      }));

      // Rendezés kompatibilitás szerint
      profilesWithScore.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      Logger.debug('Discovery feed with compatibility', {
        userId,
        count: profilesWithScore.length,
      });

      return profilesWithScore;
    }, { operation: 'getDiscoveryFeedWithCompatibility', userId });
  }

  /**
   * Napi swipe limit ellenőrzése
   * Implements Requirement 7.1
   */
  async checkSwipeLimit(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Premium user check
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', userId)
        .single();

      // Premium users have unlimited swipes
      if (profile?.is_premium) {
        return { hasLimit: false, remaining: Infinity };
      }

      // Count today's swipes
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('liked_at', today.toISOString());

      const { count: passesCount } = await supabase
        .from('passes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('passed_at', today.toISOString());

      const totalSwipes = (likesCount || 0) + (passesCount || 0);
      const limit = 100; // Free user daily limit
      const remaining = Math.max(0, limit - totalSwipes);

      Logger.debug('Swipe limit checked', { userId, totalSwipes, remaining });

      return {
        hasLimit: true,
        limit,
        used: totalSwipes,
        remaining,
        exceeded: remaining === 0,
      };
    }, { operation: 'checkSwipeLimit', userId });
  }
}

export default new SupabaseMatchService();
