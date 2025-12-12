/**
 * GiftsService - Ajándék küldés és kezelés
 * Követelmény: Premium feature - gift sending
 */
import BaseService from './BaseService';
import { supabase } from './supabaseClient';
import CreditsService from './CreditsService';
import Logger from './Logger';
import ErrorHandler from './ErrorHandler';

class GiftsService extends BaseService {
  constructor() {
    super('GiftsService');
  }

  /**
   * Elérhető ajándékok listája
   */
  static GIFTS = [
    { id: 1, name: 'Rózsa', emoji: '🌹', price: 10, color: '#FF3B75', category: 'romantic' },
    { id: 2, name: 'Csokoládé', emoji: '🍫', price: 10, color: '#8B4513', category: 'sweet' },
    { id: 3, name: 'Kávé', emoji: '☕', price: 10, color: '#6F4E37', category: 'drink' },
    { id: 4, name: 'Sör', emoji: '🍺', price: 10, color: '#FFD700', category: 'drink' },
    { id: 5, name: 'Szívecske', emoji: '💝', price: 15, color: '#FF69B4', category: 'romantic' },
    { id: 6, name: 'Csillag', emoji: '⭐', price: 15, color: '#FFD700', category: 'special' },
    { id: 7, name: 'Doboz', emoji: '🎁', price: 20, color: '#FF6B6B', category: 'special' },
    { id: 8, name: 'Gyémánt', emoji: '💎', price: 30, color: '#00CED1', category: 'luxury' },
    { id: 9, name: 'Király', emoji: '👑', price: 50, color: '#FFD700', category: 'luxury' },
    { id: 10, name: 'Rakéta', emoji: '🚀', price: 50, color: '#4169E1', category: 'fun' },
  ];

  /**
   * Ajándék küldése
   * @param {string} senderId - Küldő felhasználó ID
   * @param {string} receiverId - Fogadó felhasználó ID
   * @param {number} giftId - Ajándék ID
   * @returns {Promise<Object>} Küldés eredménye
   */
  async sendGift(senderId, receiverId, giftId) {
    try {
      const gift = GiftsService.GIFTS.find(g => g.id === giftId);
      if (!gift) {
        throw new Error(`Invalid gift ID: ${giftId}`);
      }

      // Ellenőrizzük, hogy a felhasználó küldhet-e ajándékot magának
      if (senderId === receiverId) {
        throw new Error('Cannot send gift to yourself');
      }

      // Kredit levonás
      const creditResult = await CreditsService.deductCredits(gift.price, `Gift: ${gift.name}`);
      if (!creditResult.success) {
        throw new Error(creditResult.error || 'Failed to deduct credits');
      }

      // Ajándék mentése az adatbázisba
      const { data, error } = await supabase
        .from('gifts')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          gift_id: giftId,
          gift_name: gift.name,
          gift_emoji: gift.emoji,
          gift_price: gift.price,
          gift_category: gift.category,
          status: 'delivered'
        })
        .select()
        .single();

      if (error) {
        // Kredit visszautalás hiba esetén
        await CreditsService.addCredits(gift.price, 'Gift send failed - refund');
        throw error;
      }

      // Értesítés létrehozása a fogadónak
      try {
        await supabase.rpc('create_notification', {
          p_user_id: receiverId,
          p_type: 'gift',
          p_title: '🎁 Új ajándék!',
          p_message: `Ajándékot kaptál: ${gift.emoji} ${gift.name}`,
          p_data: {
            gift_id: data.id,
            sender_id: senderId,
            gift_emoji: gift.emoji,
            gift_name: gift.name
          }
        });
      } catch (notificationError) {
        this.log.warn('Failed to create gift notification', notificationError);
        // Nem kritikus hiba, folytatjuk
      }

      this.log.info('Gift sent successfully', {
        giftId: gift.id,
        senderId,
        receiverId,
        giftName: gift.name
      });

      return {
        success: true,
        gift: data,
        newBalance: creditResult.balance
      };

    } catch (error) {
      this.log.error('Failed to send gift', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Felhasználó kapott ajándékai
   * @param {string} userId - Felhasználó ID
   * @param {number} limit - Maximum eredmények száma
   * @returns {Promise<Object>} Ajándékok listája
   */
  async getReceivedGifts(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        gifts: data
      };

    } catch (error) {
      this.log.error('Failed to get received gifts', error);
      return {
        success: false,
        error: error.message,
        gifts: []
      };
    }
  }

  /**
   * Felhasználó küldött ajándékai
   * @param {string} userId - Felhasználó ID
   * @param {number} limit - Maximum eredmények száma
   * @returns {Promise<Object>} Ajándékok listája
   */
  async getSentGifts(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          receiver:profiles!receiver_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        gifts: data
      };

    } catch (error) {
      this.log.error('Failed to get sent gifts', error);
      return {
        success: false,
        error: error.message,
        gifts: []
      };
    }
  }

  /**
   * Ajándék részleteinek lekérése
   * @param {string} giftId - Ajándék ID
   * @returns {Promise<Object>} Ajándék részletei
   */
  async getGiftDetails(giftId) {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          ),
          receiver:profiles!receiver_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', giftId)
        .single();

      if (error) throw error;

      return {
        success: true,
        gift: data
      };

    } catch (error) {
      this.log.error('Failed to get gift details', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Népszerű ajándékok statisztikái
   * @returns {Promise<Object>} Statisztikák
   */
  async getGiftStats() {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('gift_id, gift_name, gift_price')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Statisztikák számítása
      const stats = {};
      data.forEach(gift => {
        if (!stats[gift.gift_id]) {
          stats[gift.gift_id] = {
            id: gift.gift_id,
            name: gift.gift_name,
            price: gift.gift_price,
            count: 0
          };
        }
        stats[gift.gift_id].count++;
      });

      const sortedStats = Object.values(stats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        success: true,
        stats: sortedStats
      };

    } catch (error) {
      this.log.error('Failed to get gift stats', error);
      return {
        success: false,
        error: error.message,
        stats: []
      };
    }
  }

  /**
   * Ajándék törlése (csak admin vagy a küldő)
   * @param {string} giftId - Ajándék ID
   * @param {string} userId - Felhasználó ID (ellenőrzéshez)
   * @returns {Promise<Object>} Törlés eredménye
   */
  async deleteGift(giftId, userId) {
    try {
      // Ellenőrizzük, hogy a felhasználó jogosult-e törölni
      const { data: gift, error: fetchError } = await supabase
        .from('gifts')
        .select('sender_id')
        .eq('id', giftId)
        .single();

      if (fetchError) throw fetchError;

      if (gift.sender_id !== userId) {
        throw new Error('Unauthorized to delete this gift');
      }

      const { error } = await supabase
        .from('gifts')
        .delete()
        .eq('id', giftId);

      if (error) throw error;

      this.log.info('Gift deleted successfully', { giftId, userId });

      return {
        success: true
      };

    } catch (error) {
      this.log.error('Failed to delete gift', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new GiftsService();
