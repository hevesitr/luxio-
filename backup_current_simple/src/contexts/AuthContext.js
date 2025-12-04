/**
 * AuthContext - Autentikációs state management
 * Implements Requirement 3.4
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/AuthService';
import AnalyticsService from '../services/AnalyticsService';
import Logger from '../services/Logger';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Session betöltése app indításkor
  useEffect(() => {
    loadSession();
    
    // Auth state változás figyelése
    const { data: authListener } = AuthService.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session);
    });

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  /**
   * Session betöltése
   */
  const loadSession = async () => {
    try {
      setLoading(true);
      
      const result = await AuthService.getCurrentUser();
      
      if (result.success && result.user) {
        setUser(result.user);
        setSession(AuthService.session);
        setIsAuthenticated(true);
        
        // Analytics session indítása
        AnalyticsService.initSession(result.user.id);
        
        Logger.debug('Session loaded', { userId: result.user.id });
      } else {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      Logger.error('Load session failed', error);
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auth state változás kezelése
   */
  const handleAuthStateChange = (event, session) => {
    Logger.debug('Auth state changed', { event });

    if (session) {
      setUser(session.user);
      setSession(session);
      setIsAuthenticated(true);
      
      // Analytics session
      if (event === 'SIGNED_IN') {
        AnalyticsService.initSession(session.user.id);
      }
    } else {
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      
      // Analytics session lezárása
      if (event === 'SIGNED_OUT') {
        AnalyticsService.endSession();
      }
    }
  };

  /**
   * Bejelentkezés
   */
  const signIn = async (email, password) => {
    try {
      const result = await AuthService.signIn(email, password);
      
      if (result.success) {
        setUser(result.user);
        setSession(result.session);
        setIsAuthenticated(true);
        
        AnalyticsService.initSession(result.user.id);
        AnalyticsService.trackEvent(AnalyticsService.eventTypes.USER_SIGNED_IN);
        
        return { success: true };
      }
      
      return result;
    } catch (error) {
      Logger.error('Sign in failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Regisztráció
   */
  const signUp = async (email, password, profileData) => {
    try {
      const result = await AuthService.signUp(email, password, profileData);
      
      if (result.success) {
        setUser(result.user);
        setSession(result.session);
        setIsAuthenticated(true);
        
        AnalyticsService.initSession(result.user.id);
        AnalyticsService.trackEvent(AnalyticsService.eventTypes.USER_SIGNED_UP, {
          age: profileData.age,
          gender: profileData.gender,
        });
        
        return { success: true };
      }
      
      return result;
    } catch (error) {
      Logger.error('Sign up failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Kijelentkezés
   */
  const signOut = async () => {
    try {
      AnalyticsService.endSession();
      
      const result = await AuthService.signOut();
      
      if (result.success) {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
        
        return { success: true };
      }
      
      return result;
    } catch (error) {
      Logger.error('Sign out failed', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Jelszó visszaállítás
   */
  const resetPassword = async (email) => {
    return await AuthService.resetPassword(email);
  };

  /**
   * Jelszó frissítése
   */
  const updatePassword = async (newPassword) => {
    return await AuthService.updatePassword(newPassword);
  };

  /**
   * Session frissítése
   */
  const refreshSession = async () => {
    const result = await AuthService.refreshSession();
    
    if (result.success) {
      setSession(result.session);
      setUser(result.session.user);
    }
    
    return result;
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook az AuthContext használatához
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
