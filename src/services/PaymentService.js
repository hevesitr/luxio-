/**
 * PaymentService - Prémium előfizetések és fizetések kezelése
 * Implements Requirements 7.1, 7.2, 7.3, 7.4
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';
// Phase 1: Idempotency for Payment Duplicate Prevention
import { idempotencyService } from './IdempotencyService';

class PaymentService {
  constructor() {
    // ✅ PAYMENT: Idempotency tracking for duplicate prevention
    this.pendingPayments = new Map(); // paymentId -> { status, timestamp, retryCount }
    this.completedPayments = new Set(); // Set of completed payment IDs
    this.IDEMPOTENCY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    this.subscriptionPlans = {
      MONTHLY: {
        id: 'premium_monthly',
        name: 'Prémium Havi',
        price: 3590,
        currency: 'HUF',
        duration: 30, // days
        features: [
          'unlimited_swipes',
          'see_who_liked',
          'super_likes',
          'unlimited_rewinds',
          'boost',
        ],
      },
      QUARTERLY: {
        id: 'premium_quarterly',
        name: 'Prémium Negyedéves',
        price: 8990,
        currency: 'HUF',
        duration: 90, // days
        features: [
          'unlimited_swipes',
          'see_who_liked',
          'super_likes',
          'unlimited_rewinds',
          'boost',
        ],
      },
      YEARLY: {
        id: 'premium_yearly',
        name: 'Prémium Éves',
        price: 28990,
        currency: 'HUF',
        duration: 365, // days
        features: [
          'unlimited_swipes',
          'see_who_liked',
          'super_likes',
          'unlimited_rewinds',
          'boost',
          'priority_support',
        ],
      },
    };
  }

  /**
   * Előfizetés létrehozása
   * Phase 1: Enhanced with idempotency to prevent duplicate charges
   */
  async createSubscription(userId, planId) {
    // Phase 1: Generate idempotency key for this payment
    const idempotencyKey = idempotencyService.generateKey();
    
    return ErrorHandler.wrapServiceCall(async () => {
      // Phase 1: Execute with idempotency protection
      return await idempotencyService.executeWithIdempotency(
        idempotencyKey,
        async () => {
          const plan = Object.values(this.subscriptionPlans).find(p => p.id === planId);
          
          if (!plan) {
            throw new Error('Invalid subscription plan');
          }

          // Előfizetés mentése
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + plan.duration);

          const { data, error } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_id: planId,
              status: 'active',
              started_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              price: plan.price,
              currency: plan.currency,
              idempotency_key: idempotencyKey, // Store idempotency key
            })
            .select()
            .single();

          if (error) throw error;

          // Profil frissítése - premium státusz
          await this.grantPremiumFeatures(userId, expiresAt);

          Logger.success('Subscription created with idempotency', { 
            userId, 
            planId,
            idempotencyKey: idempotencyKey.substring(0, 8) + '...'
          });
          return data;
        }
      );
    }, { operation: 'createSubscription', userId, planId });
  }

  /**
   * Előfizetés lemondása
   */
  async cancelSubscription(userId, subscriptionId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .eq('user_id', userId);

      if (error) throw error;

      // Premium funkciók visszavonása
      await this.revokePremiumFeatures(userId);

      Logger.success('Subscription cancelled', { userId, subscriptionId });
      return true;
    }, { operation: 'cancelSubscription', userId, subscriptionId });
  }

  /**
   * Előfizetés státusz lekérése
   */
  async getSubscriptionStatus(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Ha nincs aktív előfizetés
      if (!data) {
        return {
          isPremium: false,
          subscription: null,
        };
      }

      // Lejárat ellenőrzése
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const isExpired = now > expiresAt;

      if (isExpired) {
        // Előfizetés lejárt, státusz frissítése
        await supabase
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', data.id);

        await this.revokePremiumFeatures(userId);

        return {
          isPremium: false,
          subscription: { ...data, status: 'expired' },
        };
      }

      Logger.debug('Subscription status fetched', { userId, isPremium: true });

      return {
        isPremium: true,
        subscription: data,
        expiresAt: data.expires_at,
        daysRemaining: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)),
      };
    }, { operation: 'getSubscriptionStatus', userId });
  }

  /**
   * ✅ PAYMENT: Idempotent fizetés feldolgozása duplicate prevention-nel
   */
  async processPayment(userId, amount, method = 'card', idempotencyKey = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      // ✅ IDEMPOTENCY: Generate or validate idempotency key
      const paymentIdempotencyKey = idempotencyKey || this.generateIdempotencyKey(userId, amount, method);

      // ✅ DUPLICATE PREVENTION: Check database for existing payment
      const { data: existingPayment, error: checkError } = await supabase
        .from('payments')
        .select('id, status')
        .eq('user_id', userId)
        .eq('amount', amount)
        .eq('method', method)
        .eq('idempotency_key', paymentIdempotencyKey)
        .single();

      if (!checkError && existingPayment) {
        Logger.info('Payment already exists', {
          paymentIdempotencyKey,
          userId,
          existingPaymentId: existingPayment.id,
          status: existingPayment.status
        });

        return {
          success: true,
          paymentId: existingPayment.id,
          amount: amount,
          status: existingPayment.status,
          idempotencyKey: paymentIdempotencyKey,
          wasDuplicate: true
        };
      }

      Logger.info('Processing payment', { userId, amount, method, paymentIdempotencyKey });

      // MOCK PAYMENT PROCESSING - In production integrate with Stripe/PayPal
      Logger.warn('Mock payment processing', { userId, amount, method });

      // Simulate network delay and potential failure
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate occasional failures (10%)
      if (Math.random() < 0.1) {
        throw new Error('Payment gateway timeout');
      }

      // ✅ ATOMIC: Insert payment with idempotency key
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: amount,
          currency: 'USD',
          method: method,
          status: 'completed',
          idempotency_key: paymentIdempotencyKey,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation (duplicate idempotency key)
        if (error.code === '23505') { // PostgreSQL unique violation
          Logger.info('Concurrent payment detected, fetching existing', { paymentIdempotencyKey });

          // Re-check for the payment that was inserted concurrently
          const { data: concurrentPayment } = await supabase
            .from('payments')
            .select('id, status')
            .eq('idempotency_key', paymentIdempotencyKey)
            .single();

          if (concurrentPayment) {
            return {
              success: true,
              paymentId: concurrentPayment.id,
              amount: amount,
              status: concurrentPayment.status,
              idempotencyKey: paymentIdempotencyKey,
              wasDuplicate: true
            };
          }
        }
        throw error;
      }

      Logger.success('Payment processed successfully', {
        paymentId: data.id,
        userId,
        amount,
        idempotencyKey: paymentIdempotencyKey
      });

      return {
        success: true,
        paymentId: data.id,
        amount: data.amount,
        status: 'completed',
        idempotencyKey: paymentIdempotencyKey,
        wasDuplicate: false
      };
    }, { operation: 'processPayment', userId, amount, idempotencyKey });
  }

  /**
   * ✅ PAYMENT: Generate idempotency key for duplicate prevention
   */
  generateIdempotencyKey(userId, amount, method) {
    const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute window
    const components = [userId, amount.toString(), method, timestamp.toString()];
    return components.join('_');
  }

  /**
   * ✅ PAYMENT: Check payment status by idempotency key
   */
  async getPaymentStatus(idempotencyKey) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, status, amount, created_at')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (data) {
        return {
          found: true,
          paymentId: data.id,
          status: data.status,
          amount: data.amount,
          createdAt: data.created_at,
          idempotencyKey
        };
      }

      return {
        found: false,
        idempotencyKey
      };
    }, { operation: 'getPaymentStatus', idempotencyKey });
  }

  /**
   * Premium user ellenőrzése
   */
  async isPremiumUser(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, premium_expires_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Lejárat ellenőrzése
      if (data.is_premium && data.premium_expires_at) {
        const expiresAt = new Date(data.premium_expires_at);
        const now = new Date();
        
        if (now > expiresAt) {
          // Lejárt, frissítés
          await this.revokePremiumFeatures(userId);
          return false;
        }
      }

      return data.is_premium || false;
    }, { operation: 'isPremiumUser', userId });
  }

  /**
   * Premium funkciók megadása
   */
  async grantPremiumFeatures(userId, expiresAt = null) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt ? expiresAt.toISOString() : null,
          premium_granted_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      Logger.success('Premium features granted', { userId });
      return true;
    }, { operation: 'grantPremiumFeatures', userId });
  }

  /**
   * Premium funkciók visszavonása
   */
  async revokePremiumFeatures(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: false,
          premium_expires_at: null,
        })
        .eq('id', userId);

      if (error) throw error;

      Logger.success('Premium features revoked', { userId });
      return true;
    }, { operation: 'revokePremiumFeatures', userId });
  }

  /**
   * Super Like használata
   * Implements Requirement 7.3
   */
  async useSuperLike(userId, targetUserId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Premium user ellenőrzése
      const isPremium = await this.isPremiumUser(userId);
      if (!isPremium.success || !isPremium.data) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_PREMIUM_REQUIRED,
          'Super likes require premium subscription',
          { userId }
        );
      }

      // Napi limit ellenőrzése (5 super like / nap)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'super')
        .gte('liked_at', today.toISOString());

      if (countError) throw countError;

      if (count >= 5) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_DAILY_LIMIT_EXCEEDED,
          'Daily super like limit exceeded',
          { userId, used: count, limit: 5 }
        );
      }

      // Super like mentése
      const { data, error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          liked_user_id: targetUserId,
          type: 'super',
          liked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Értesítés küldése a célszemélynek
      await this.sendSuperLikeNotification(targetUserId, userId);

      Logger.success('Super like used', { userId, targetUserId, remaining: 4 - count });

      return {
        like: data,
        remaining: 4 - count,
      };
    }, { operation: 'useSuperLike', userId, targetUserId });
  }

  /**
   * Super like értesítés küldése
   */
  async sendSuperLikeNotification(recipientId, senderId) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'super_like',
          from_user_id: senderId,
          created_at: new Date().toISOString(),
          is_read: false,
        });

      Logger.debug('Super like notification sent', { recipientId, senderId });
    } catch (error) {
      Logger.error('Super like notification failed', error);
    }
  }

  /**
   * Rewind használata (utolsó swipe visszavonása)
   * Implements Requirement 7.4
   */
  async useRewind(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Premium user ellenőrzése
      const isPremium = await this.isPremiumUser(userId);
      if (!isPremium.success || !isPremium.data) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_PREMIUM_REQUIRED,
          'Rewind requires premium subscription',
          { userId }
        );
      }

      // Utolsó like vagy pass lekérése
      const { data: lastLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .order('liked_at', { ascending: false })
        .limit(1)
        .single();

      const { data: lastPass } = await supabase
        .from('passes')
        .select('*')
        .eq('user_id', userId)
        .order('passed_at', { ascending: false })
        .limit(1)
        .single();

      // Melyik volt később
      let lastAction = null;
      let actionType = null;

      if (lastLike && lastPass) {
        const likeTime = new Date(lastLike.liked_at);
        const passTime = new Date(lastPass.passed_at);
        
        if (likeTime > passTime) {
          lastAction = lastLike;
          actionType = 'like';
        } else {
          lastAction = lastPass;
          actionType = 'pass';
        }
      } else if (lastLike) {
        lastAction = lastLike;
        actionType = 'like';
      } else if (lastPass) {
        lastAction = lastPass;
        actionType = 'pass';
      }

      if (!lastAction) {
        throw new Error('No action to rewind');
      }

      // Akció törlése
      const table = actionType === 'like' ? 'likes' : 'passes';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', lastAction.id);

      if (error) throw error;

      Logger.success('Rewind used', { userId, actionType, targetUserId: lastAction.liked_user_id || lastAction.passed_user_id });

      return {
        rewound: true,
        actionType,
        profile: lastAction.liked_user_id || lastAction.passed_user_id,
      };
    }, { operation: 'useRewind', userId });
  }

  /**
   * Boost használata (profil kiemelése)
   */
  async useBoost(userId, duration = 30) {
    return ErrorHandler.wrapServiceCall(async () => {
      // Premium user ellenőrzése
      const isPremium = await this.isPremiumUser(userId);
      if (!isPremium.success || !isPremium.data) {
        throw ErrorHandler.createError(
          ErrorCodes.BUSINESS_PREMIUM_REQUIRED,
          'Boost requires premium subscription',
          { userId }
        );
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + duration);

      const { data, error } = await supabase
        .from('boosts')
        .insert({
          user_id: userId,
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      Logger.success('Boost activated', { userId, duration });

      return {
        boost: data,
        expiresAt: expiresAt.toISOString(),
        duration,
      };
    }, { operation: 'useBoost', userId, duration });
  }

  /**
   * Előfizetési tervek lekérése
   */
  getSubscriptionPlans() {
    return {
      success: true,
      data: Object.values(this.subscriptionPlans),
    };
  }

  /**
   * Fizetési előzmények lekérése
   */
  async getPaymentHistory(userId) {
    return ErrorHandler.wrapServiceCall(async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      Logger.debug('Payment history fetched', { userId, count: data.length });
      return data;
    }, { operation: 'getPaymentHistory', userId });
  }
}

export default new PaymentService();
