/**
 * AuthService - Biztonságos autentikáció és session kezelés
 * Implements Requirements 1.2, 1.4
 */
import { supabase } from './supabaseClient';
import Logger from './Logger';
import * as SecureStore from 'expo-secure-store';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.refreshTimer = null;
  }

  /**
   * Felhasználó regisztrációja
   * @param {string} email 
   * @param {string} password - Minimum 8 karakter
   * @param {object} profileData - Profil adatok
   */
  async signUp(email, password, profileData) {
    try {
      // Jelszó erősség ellenőrzése
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Supabase regisztráció (automatikusan bcrypt-tel hash-eli)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData.firstName,
            age: profileData.age,
          }
        }
      });

      if (error) throw error;

      // Profil létrehozása
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            first_name: profileData.firstName,
            age: profileData.age,
            gender: profileData.gender,
            bio: profileData.bio || '',
            location: profileData.location || null,
            photos: [],
            is_premium: false,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          Logger.error('Profile creation failed', profileError);
          throw profileError;
        }
      }

      Logger.success('User signed up', { email });
      
      // Session mentése
      if (data.session) {
        await this.saveSession(data.session);
        this.session = data.session;
        this.currentUser = data.user;
        this.startRefreshTimer();
      }

      return { 
        success: true, 
        user: data.user,
        session: data.session 
      };
    } catch (error) {
      Logger.error('Sign up failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Felhasználó bejelentkezése
   * @param {string} email 
   * @param {string} password 
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Logger.success('User signed in', { email });
      
      // Session mentése
      if (data.session) {
        await this.saveSession(data.session);
        this.session = data.session;
        this.currentUser = data.user;
        this.startRefreshTimer();
      }

      return { 
        success: true, 
        user: data.user,
        session: data.session 
      };
    } catch (error) {
      Logger.error('Sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Kijelentkezés
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Session törlése
      await this.clearSession();
      this.currentUser = null;
      this.session = null;
      this.stopRefreshTimer();

      Logger.success('User signed out');
      return { success: true };
    } catch (error) {
      Logger.error('Sign out failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Jelszó visszaállítás kérése
   * @param {string} email 
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'lovex://reset-password',
      });

      if (error) throw error;

      Logger.success('Password reset email sent', { email });
      return { success: true };
    } catch (error) {
      Logger.error('Password reset failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Jelszó frissítése
   * @param {string} newPassword 
   */
  async updatePassword(newPassword) {
    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Logger.success('Password updated');
      return { success: true };
    } catch (error) {
      Logger.error('Password update failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Aktuális felhasználó lekérése
   */
  async getCurrentUser() {
    try {
      // Ha már van cache-elt user, visszaadjuk
      if (this.currentUser) {
        return { success: true, user: this.currentUser };
      }

      // Session ellenőrzése
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session) {
        this.session = session;
        this.currentUser = session.user;
        this.startRefreshTimer();
        
        return { 
          success: true, 
          user: session.user 
        };
      }

      return { 
        success: false, 
        error: 'No active session' 
      };
    } catch (error) {
      Logger.error('Get current user failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Session frissítése
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      if (data.session) {
        await this.saveSession(data.session);
        this.session = data.session;
        this.currentUser = data.user;
        
        Logger.debug('Session refreshed');
        return { 
          success: true, 
          session: data.session 
        };
      }

      return { 
        success: false, 
        error: 'No session to refresh' 
      };
    } catch (error) {
      Logger.error('Session refresh failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Token validálása
   * @param {string} token 
   */
  async validateToken(token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) throw error;

      return { 
        success: true, 
        valid: !!data.user,
        user: data.user 
      };
    } catch (error) {
      Logger.error('Token validation failed', error);
      return { 
        success: false, 
        valid: false,
        error: error.message 
      };
    }
  }

  /**
   * OAuth - Google bejelentkezés
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'lovex://auth/callback',
        }
      });

      if (error) throw error;

      Logger.success('Google sign in initiated');
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      Logger.error('Google sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * OAuth - Apple bejelentkezés
   */
  async signInWithApple() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'lovex://auth/callback',
        }
      });

      if (error) throw error;

      Logger.success('Apple sign in initiated');
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      Logger.error('Apple sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * OAuth - Facebook bejelentkezés
   */
  async signInWithFacebook() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'lovex://auth/callback',
        }
      });

      if (error) throw error;

      Logger.success('Facebook sign in initiated');
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      Logger.error('Facebook sign in failed', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Session mentése biztonságos tárolóba
   * @param {object} session 
   */
  async saveSession(session) {
    try {
      await SecureStore.setItemAsync(
        'supabase_session',
        JSON.stringify(session)
      );
      Logger.debug('Session saved securely');
    } catch (error) {
      Logger.error('Session save failed', error);
    }
  }

  /**
   * Session betöltése biztonságos tárolóból
   */
  async loadSession() {
    try {
      const sessionStr = await SecureStore.getItemAsync('supabase_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        this.session = session;
        this.currentUser = session.user;
        return session;
      }
      return null;
    } catch (error) {
      Logger.error('Session load failed', error);
      return null;
    }
  }

  /**
   * Session törlése
   */
  async clearSession() {
    try {
      await SecureStore.deleteItemAsync('supabase_session');
      Logger.debug('Session cleared');
    } catch (error) {
      Logger.error('Session clear failed', error);
    }
  }

  /**
   * Automatikus session frissítés indítása
   * Token lejárat előtt 5 perccel frissít
   */
  startRefreshTimer() {
    this.stopRefreshTimer();

    if (this.session?.expires_at) {
      const expiresAt = this.session.expires_at * 1000; // ms-ra
      const now = Date.now();
      const refreshTime = expiresAt - now - (5 * 60 * 1000); // 5 perc előtt

      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshSession();
        }, refreshTime);

        Logger.debug('Refresh timer started', { 
          refreshIn: Math.round(refreshTime / 1000 / 60) + ' minutes' 
        });
      }
    }
  }

  /**
   * Automatikus session frissítés leállítása
   */
  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      Logger.debug('Refresh timer stopped');
    }
  }

  /**
   * Auth state változás figyelése
   * @param {function} callback 
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      Logger.debug('Auth state changed', { event });
      
      if (session) {
        this.session = session;
        this.currentUser = session.user;
        this.saveSession(session);
        this.startRefreshTimer();
      } else {
        this.session = null;
        this.currentUser = null;
        this.clearSession();
        this.stopRefreshTimer();
      }

      callback(event, session);
    });
  }

  /**
   * Session lejárt-e
   */
  isSessionExpired() {
    if (!this.session?.expires_at) return true;
    
    const expiresAt = this.session.expires_at * 1000;
    const now = Date.now();
    
    return now >= expiresAt;
  }

  /**
   * Felhasználó be van-e jelentkezve
   */
  isAuthenticated() {
    return !!this.currentUser && !!this.session && !this.isSessionExpired();
  }
}

export default new AuthService();
