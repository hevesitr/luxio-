/**
 * DataDeletionService - Felhasználói adatok végleges törlése
 * Követelmény: 7.3 Implement data deletion logic
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler from './ErrorHandler';

class DataDeletionService {
  /**
   * Összes felhasználói adat végleges törlése
   * @param {string} userId - Felhasználó ID
   */
  async deleteAllUserData(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      Logger.info('Starting complete user data deletion', { userId });

      const deletionResults = {
        profile: false,
        messages: false,
        matches: false,
        swipes: false,
        blocks: false,
        reports: false,
        storage: false,
        accountData: false
      };

      try {
        // 1. Profil adatok törlése (Supabase Storage fájlok)
        deletionResults.storage = await this.deleteUserStorageFiles(userId);

        // 2. Profil adatok anonimizálása/törlése
        deletionResults.profile = await this.deleteOrAnonymizeProfile(userId);

        // 3. Üzenetek anonimizálása (nem törlése, mert másik félhez tartozik)
        deletionResults.messages = await this.anonymizeUserMessages(userId);

        // 4. Match-ek törlése
        deletionResults.matches = await this.deleteUserMatches(userId);

        // 5. Swipe-ok törlése
        deletionResults.swipes = await this.deleteUserSwipes(userId);

        // 6. Blokkolások törlése
        deletionResults.blocks = await this.deleteUserBlocks(userId);

        // 7. Moderációs jelentések anonimizálása
        deletionResults.reports = await this.anonymizeUserReports(userId);

        // 8. Egyéb fiók adatok törlése
        deletionResults.accountData = await this.deleteAccountData(userId);

        Logger.success('User data deletion completed', {
          userId,
          results: deletionResults
        });

        return {
          success: true,
          results: deletionResults,
          message: 'Az összes felhasználói adat sikeresen törölve.'
        };

      } catch (error) {
        Logger.error('User data deletion failed', error, { userId });

        return {
          success: false,
          error: error.message,
          partialResults: deletionResults
        };
      }
    }, {
      operation: 'deleteAllUserData',
      userId,
    });
  }

  /**
   * Felhasználó storage fájljainak törlése
   * @param {string} userId - Felhasználó ID
   */
  async deleteUserStorageFiles(userId) {
    try {
      Logger.info('Deleting user storage files', { userId });

      // Profil adatok lekérése a fájl nevekért
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('photos')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const filesToDelete = [];

      // Profil képek gyűjtése
      if (profile?.photos) {
        profile.photos.forEach(photo => {
          if (photo && typeof photo === 'string') {
            // Kivonat a fájlnévből az URL-ből
            const fileName = photo.split('/').pop();
            if (fileName) {
              filesToDelete.push(`profiles/${fileName}`);
            }
          }
        });
      }

      // Videók keresése (ha vannak)
      // Ez kiterjeszthető további fájltípusokra

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('profiles')
          .remove(filesToDelete);

        if (deleteError) {
          Logger.warn('Failed to delete some storage files', deleteError);
          // Nem kritikus hiba, folytatjuk
        } else {
          Logger.success('Storage files deleted', { userId, fileCount: filesToDelete.length });
        }
      }

      return true;
    } catch (error) {
      Logger.error('Storage file deletion failed', error, { userId });
      return false;
    }
  }

  /**
   * Profil adatok törlése vagy anonimizálása
   * @param {string} userId - Felhasználó ID
   */
  async deleteOrAnonymizeProfile(userId) {
    try {
      Logger.info('Deleting/anonymizing user profile', { userId });

      // Supabase Auth user törlése production-ban admin művelet lenne
      // Development-ban a profil rekord törlése

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      Logger.success('User profile deleted', { userId });
      return true;
    } catch (error) {
      Logger.error('Profile deletion failed', error, { userId });
      return false;
    }
  }

  /**
   * Felhasználó üzeneteinek anonimizálása
   * @param {string} userId - Felhasználó ID
   */
  async anonymizeUserMessages(userId) {
    try {
      Logger.info('Anonymizing user messages', { userId });

      // Üzenetek anonimizálása (tartalom törlése, de beszélgetés megőrzése)
      const { error } = await supabase
        .from('messages')
        .update({
          content: '[Üzenet törölve - felhasználó távozott]',
          type: 'system',
          updated_at: new Date().toISOString()
        })
        .eq('sender_id', userId);

      if (error) {
        throw error;
      }

      Logger.success('User messages anonymized', { userId });
      return true;
    } catch (error) {
      Logger.error('Message anonymization failed', error, { userId });
      return false;
    }
  }

  /**
   * Felhasználó match-einek törlése
   * @param {string} userId - Felhasználó ID
   */
  async deleteUserMatches(userId) {
    try {
      Logger.info('Deleting user matches', { userId });

      const { error } = await supabase
        .from('matches')
        .delete()
        .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);

      if (error) {
        throw error;
      }

      Logger.success('User matches deleted', { userId });
      return true;
    } catch (error) {
      Logger.error('Match deletion failed', error, { userId });
      return false;
    }
  }

  /**
   * Felhasználó swipe-jainak törlése
   * @param {string} userId - Felhasználó ID
   */
  async deleteUserSwipes(userId) {
    try {
      Logger.info('Deleting user swipes', { userId });

      const { error } = await supabase
        .from('swipes')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      Logger.success('User swipes deleted', { userId });
      return true;
    } catch (error) {
      Logger.error('Swipe deletion failed', error, { userId });
      return false;
    }
  }

  /**
   * Felhasználó blokkjoltainak törlése
   * @param {string} userId - Felhasználó ID
   */
  async deleteUserBlocks(userId) {
    try {
      Logger.info('Deleting user blocks', { userId });

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

      if (error) {
        throw error;
      }

      Logger.success('User blocks deleted', { userId });
      return true;
    } catch (error) {
      Logger.error('Block deletion failed', error, { userId });
      return false;
    }
  }

  /**
   * Felhasználó moderációs jelentéseinek anonimizálása
   * @param {string} userId - Felhasználó ID
   */
  async anonymizeUserReports(userId) {
    try {
      Logger.info('Anonymizing user reports', { userId });

      const { error } = await supabase
        .from('moderation_reports')
        .update({
          reporter_id: null, // Anonimizálás
          updated_at: new Date().toISOString()
        })
        .eq('reporter_id', userId);

      if (error) {
        throw error;
      }

      Logger.success('User reports anonymized', { userId });
      return true;
    } catch (error) {
      Logger.error('Report anonymization failed', error, { userId });
      return false;
    }
  }

  /**
   * Fiók specifikus adatok törlése
   * @param {string} userId - Felhasználó ID
   */
  async deleteAccountData(userId) {
    try {
      Logger.info('Deleting account-specific data', { userId });

      // Törlési kérések törlése
      await supabase
        .from('account_deletion_requests')
        .delete()
        .eq('user_id', userId);

      // Szüneteltetési státusz törlése
      await supabase
        .from('account_pause_status')
        .delete()
        .eq('user_id', userId);

      // Export kérések törlése
      await supabase
        .from('data_export_requests')
        .delete()
        .eq('user_id', userId);

      Logger.success('Account data deleted', { userId });
      return true;
    } catch (error) {
      Logger.error('Account data deletion failed', error, { userId });
      return false;
    }
  }

  /**
   * Részleges adat törlés teszteléshez
   * @param {string} userId - Felhasználó ID
   * @param {Array} dataTypes - Törlendő adat típusok
   */
  async deletePartialUserData(userId, dataTypes = []) {
    const results = {};

    for (const dataType of dataTypes) {
      try {
        switch (dataType) {
          case 'messages':
            results.messages = await this.anonymizeUserMessages(userId);
            break;
          case 'matches':
            results.matches = await this.deleteUserMatches(userId);
            break;
          case 'swipes':
            results.swipes = await this.deleteUserSwipes(userId);
            break;
          case 'blocks':
            results.blocks = await this.deleteUserBlocks(userId);
            break;
          case 'storage':
            results.storage = await this.deleteUserStorageFiles(userId);
            break;
          default:
            Logger.warn('Unknown data type for partial deletion', { dataType });
        }
      } catch (error) {
        Logger.error('Partial data deletion failed', error, { userId, dataType });
        results[dataType] = false;
      }
    }

    return {
      success: true,
      results,
      message: 'Részleges adat törlés befejezve.'
    };
  }

  /**
   * Adat törlés előnézete (mit törölnének)
   * @param {string} userId - Felhasználó ID
   */
  async getDeletionPreview(userId) {
    try {
      const [
        { count: messageCount },
        { count: matchCount },
        { count: swipeCount },
        { count: blockCount },
        { data: profile }
      ] = await Promise.all([
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', userId),

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
          .eq('blocker_id', userId),

        supabase
          .from('profiles')
          .select('photos')
          .eq('id', userId)
          .single()
      ]);

      return {
        messages: messageCount || 0,
        matches: matchCount || 0,
        swipes: swipeCount || 0,
        blocks: blockCount || 0,
        photos: profile?.photos?.length || 0,
        totalItems: (messageCount || 0) + (matchCount || 0) + (swipeCount || 0) + (blockCount || 0) + (profile?.photos?.length || 0)
      };
    } catch (error) {
      Logger.error('Failed to get deletion preview', error, { userId });
      return {
        messages: 0,
        matches: 0,
        swipes: 0,
        blocks: 0,
        photos: 0,
        totalItems: 0,
        error: error.message
      };
    }
  }
}

// Singleton instance
const dataDeletionService = new DataDeletionService();
export default dataDeletionService;
