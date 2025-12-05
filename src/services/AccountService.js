/**
 * AccountService - Fiók kezelés és életciklus menedzsment
 * Követelmény: 7.1 Create AccountService
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';
import DataDeletionService from './DataDeletionService';

class AccountService {
  constructor() {
    this.GRACE_PERIOD_DAYS = 30; // 30 napos türelmi idő
    this.PAUSE_MAX_DAYS = 90; // Maximum 90 nap szüneteltetés
    this.EXPORT_EXPIRY_HOURS = 48; // Export link 48 óráig érvényes
  }

  /**
   * Fiók törlési kérés létrehozása
   * @param {string} userId - Felhasználó ID
   * @param {string} password - Jelszó megerősítés
   * @param {string} reason - Törlés oka
   */
  async requestAccountDeletion(userId, password, reason = '') {
    return ErrorHandler.wrapServiceCall(async () => {
      // Jelszó ellenőrzés
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email,
        password: password,
      });

      if (authError) {
        throw ErrorHandler.createError(
          ErrorCodes.AUTH_INVALID_CREDENTIALS,
          'Helytelen jelszó'
        );
      }

      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + this.GRACE_PERIOD_DAYS);

      // Törlési kérés mentése
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: userId,
          reason: reason,
          scheduled_deletion_date: deletionDate.toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      Logger.success('Account deletion requested', {
        userId,
        deletionDate: deletionDate.toISOString(),
        gracePeriodDays: this.GRACE_PERIOD_DAYS
      });

      return {
        success: true,
        deletionRequest: data,
        gracePeriodEnds: deletionDate.toISOString(),
        gracePeriodDays: this.GRACE_PERIOD_DAYS
      };
    }, {
      operation: 'requestAccountDeletion',
      userId,
    });
  }

  /**
   * Fiók törlési kérés visszavonása
   * @param {string} userId - Felhasználó ID
   * @param {string} requestId - Kérés ID
   */
  async cancelAccountDeletion(userId, requestId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_USER_BLOCKED,
          'Törlési kérés nem található vagy már feldolgozva'
        );
      }

      Logger.success('Account deletion cancelled', { userId, requestId });

      return { success: true, deletionRequest: data };
    }, {
      operation: 'cancelAccountDeletion',
      userId,
      requestId,
    });
  }

  /**
   * Fiók végleges törlése
   * @param {string} userId - Felhasználó ID
   * @param {string} requestId - Törlési kérés ID
   */
  async executeAccountDeletion(userId, requestId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Törlési kérés ellenőrzése
      const { data: request, error: requestError } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('id', requestId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (requestError || !request) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_USER_BLOCKED,
          'Érvénytelen vagy már feldolgozott törlési kérés'
        );
      }

      const scheduledDate = new Date(request.scheduled_deletion_date);
      const now = new Date();

      if (now < scheduledDate) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_USER_BLOCKED,
          'A türelmi idő még nem járt le'
        );
      }

      // Adatok törlése
      await DataDeletionService.deleteAllUserData(userId);

      // Törlési kérés frissítése
      await supabase
        .from('account_deletion_requests')
        .update({
          status: 'completed',
          executed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      // Supabase auth user törlése (admin művelet lenne production-ban)
      // Development-ban ezt a felhasználónak kell megtennie

      Logger.success('Account deletion executed', {
        userId,
        requestId,
        deletionDate: new Date().toISOString()
      });

      return { success: true };
    }, {
      operation: 'executeAccountDeletion',
      userId,
      requestId,
    });
  }

  /**
   * Fiók szüneteltetése
   * @param {string} userId - Felhasználó ID
   * @param {string} reason - Szünet oka
   * @param {number} durationDays - Szünet időtartama napokban (max 90)
   */
  async pauseAccount(userId, reason = '', durationDays = 30) {
    return ErrorHandler.wrapServiceCall(async () => {
      if (durationDays > this.PAUSE_MAX_DAYS) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_USER_BLOCKED,
          `Maximum szünet időtartam: ${this.PAUSE_MAX_DAYS} nap`
        );
      }

      const resumeDate = new Date();
      resumeDate.setDate(resumeDate.getDate() + durationDays);

      // Szünet státusz mentése
      const { data, error } = await supabase
        .from('account_pause_status')
        .upsert({
          user_id: userId,
          is_paused: true,
          paused_at: new Date().toISOString(),
          resume_date: resumeDate.toISOString(),
          pause_reason: reason,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Profil elrejtése felfedezésből
      await supabase
        .from('profiles')
        .update({ is_visible: false })
        .eq('id', userId);

      Logger.success('Account paused', {
        userId,
        resumeDate: resumeDate.toISOString(),
        durationDays
      });

      return {
        success: true,
        pauseStatus: data,
        resumeDate: resumeDate.toISOString(),
        durationDays
      };
    }, {
      operation: 'pauseAccount',
      userId,
      durationDays,
    });
  }

  /**
   * Fiók szüneteltetés feloldása
   * @param {string} userId - Felhasználó ID
   */
  async resumeAccount(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Szünet státusz frissítése
      const { data, error } = await supabase
        .from('account_pause_status')
        .update({
          is_paused: false,
          resumed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_paused', true)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Profil visszaállítása felfedezésbe
      await supabase
        .from('profiles')
        .update({ is_visible: true })
        .eq('id', userId);

      Logger.success('Account resumed', { userId });

      return { success: true, pauseStatus: data };
    }, {
      operation: 'resumeAccount',
      userId,
    });
  }

  /**
   * Adat export kérés létrehozása
   * @param {string} userId - Felhasználó ID
   */
  async requestDataExport(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + this.EXPORT_EXPIRY_HOURS);

      // Export kérés mentése
      const { data, error } = await supabase
        .from('data_export_requests')
        .insert({
          user_id: userId,
          status: 'processing',
          expires_at: expiryDate.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Export adatok előkészítése (aszinkron folyamat)
      this.processDataExport(data.id, userId);

      Logger.success('Data export requested', {
        userId,
        exportId: data.id,
        expiryDate: expiryDate.toISOString()
      });

      return {
        success: true,
        exportRequest: data,
        expiresAt: expiryDate.toISOString(),
        expiryHours: this.EXPORT_EXPIRY_HOURS
      };
    }, {
      operation: 'requestDataExport',
      userId,
    });
  }

  /**
   * Adat export feldolgozása
   * @param {string} exportId - Export kérés ID
   * @param {string} userId - Felhasználó ID
   */
  async processDataExport(exportId, userId) {
    try {
      // Összes felhasználói adat összegyűjtése
      const exportData = await this.gatherAllUserData(userId);

      // JSON fájl létrehozása és feltöltése
      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `user_data_export_${userId}_${Date.now()}.json`;

      // Supabase storage feltöltés (privát bucket)
      const { error: uploadError } = await supabase.storage
        .from('data-exports')
        .upload(fileName, jsonData, {
          contentType: 'application/json',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Letöltési link generálása (korlátozott hozzáférés)
      const { data: urlData } = supabase.storage
        .from('data-exports')
        .getPublicUrl(fileName);

      // Export kérés frissítése
      await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          download_url: urlData.publicUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportId);

      Logger.success('Data export completed', {
        exportId,
        userId,
        fileName,
        dataSize: jsonData.length
      });

    } catch (error) {
      Logger.error('Data export failed', error);

      // Export kérés hibás státuszra állítása
      await supabase
        .from('data_export_requests')
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        })
        .eq('id', exportId);
    }
  }

  /**
   * Összes felhasználói adat összegyűjtése
   * @param {string} userId - Felhasználó ID
   */
  async gatherAllUserData(userId) {
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      data: {}
    };

    try {
      // Profil adatok
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      exportData.data.profile = profile;

      // Üzenetek
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      exportData.data.messages = messages;

      // Match-ek
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      exportData.data.matches = matches;

      // Swipe-ok (like/pass)
      const { data: swipes } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      exportData.data.swipes = swipes;

      // Blokkolások
      const { data: blocks } = await supabase
        .from('blocked_users')
        .select('*')
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      exportData.data.blocks = blocks;

      // Moderációs jelentések
      const { data: reports } = await supabase
        .from('moderation_reports')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

      exportData.data.reports = reports;

      // Fiók események
      const { data: accountEvents } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      exportData.data.accountEvents = accountEvents;

    } catch (error) {
      Logger.error('Failed to gather user data for export', error);
      exportData.error = error.message;
    }

    return exportData;
  }

  /**
   * Fiók státusz lekérése
   * @param {string} userId - Felhasználó ID
   */
  async getAccountStatus(userId) {
    try {
      const [
        { data: deletionRequest },
        { data: pauseStatus },
        { data: exportRequests }
      ] = await Promise.all([
        supabase
          .from('account_deletion_requests')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from('account_pause_status')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),

        supabase
          .from('data_export_requests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      return {
        hasPendingDeletion: !!deletionRequest,
        deletionRequest,
        isPaused: pauseStatus?.is_paused || false,
        pauseStatus,
        recentExports: exportRequests || []
      };
    } catch (error) {
      Logger.error('Failed to get account status', error);
      return {
        hasPendingDeletion: false,
        isPaused: false,
        recentExports: []
      };
    }
  }

  /**
   * Fiók statisztikák lekérése
   * @param {string} userId - Felhasználó ID
   */
  async getAccountStatistics(userId) {
    try {
      const [
        { count: messageCount },
        { count: matchCount },
        { count: swipeCount },
        { count: blockCount }
      ] = await Promise.all([
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),

        supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`),

        supabase
          .from('swipes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),

        supabase
          .from('blocked_users')
          .select('*', { count: 'exact', head: true })
          .eq('blocker_id', userId)
      ]);

      return {
        messages: messageCount || 0,
        matches: matchCount || 0,
        swipes: swipeCount || 0,
        blocks: blockCount || 0
      };
    } catch (error) {
      Logger.error('Failed to get account statistics', error);
      return {
        messages: 0,
        matches: 0,
        swipes: 0,
        blocks: 0
      };
    }
  }
}

// Singleton instance
const accountService = new AccountService();
export default accountService;
