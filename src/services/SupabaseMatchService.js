/**
 * SupabaseMatchService - Match-ek kezelése Supabase-zel
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import MatchService from './MatchService'; // Lokális cache

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
      return { success: false, error: error.message };
    }
  }

  /**
   * Pass mentése
   */
  async savePass(userId, passedUserId) {
    try {
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
}

export default new SupabaseMatchService();
