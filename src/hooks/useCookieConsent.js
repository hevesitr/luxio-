import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccountService from '../services/AccountService';
import { useAuth } from '../context/AuthContext';

const COOKIE_CONSENT_KEY = '@cookie_consent_shown';

export const useCookieConsent = () => {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [loading, setLoading] = useState(false);

  // Check if banner should be shown
  useEffect(() => {
    checkCookieConsent();
  }, [user]);

  // Load cookie settings when user changes
  useEffect(() => {
    if (user?.id) {
      loadCookieSettings();
    }
  }, [user?.id]);

  const checkCookieConsent = async () => {
    try {
      const hasShownConsent = await AsyncStorage.getItem(COOKIE_CONSENT_KEY);

      // Show banner if user is logged in and hasn't seen it recently
      if (user?.id && !hasShownConsent) {
        // Check if user has any cookie settings saved
        const settings = await AccountService.getCookieSettings(user.id);
        const hasAnyConsent = settings.analytics_consent || settings.marketing_consent;

        // Show banner if no explicit consent given yet
        setShowBanner(!hasAnyConsent);
      } else {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Failed to check cookie consent:', error);
      setShowBanner(false);
    }
  };

  const loadCookieSettings = async () => {
    if (!user?.id) return;

    try {
      const settings = await AccountService.getCookieSettings(user.id);
      setCookieSettings({
        necessary: settings.necessary_cookies ?? true,
        analytics: settings.analytics_consent ?? false,
        marketing: settings.marketing_consent ?? false,
      });
    } catch (error) {
      console.error('Failed to load cookie settings:', error);
    }
  };

  const acceptAllCookies = useCallback(async () => {
    setLoading(true);
    try {
      await AccountService.updateCookieSettings({
        necessary: true,
        analytics: true,
        marketing: true,
      });

      setCookieSettings({
        necessary: true,
        analytics: true,
        marketing: true,
      });

      await AsyncStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setShowBanner(false);
    } catch (error) {
      console.error('Failed to accept all cookies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptNecessaryOnly = useCallback(async () => {
    setLoading(true);
    try {
      await AccountService.updateCookieSettings({
        necessary: true,
        analytics: false,
        marketing: false,
      });

      setCookieSettings({
        necessary: true,
        analytics: false,
        marketing: false,
      });

      await AsyncStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setShowBanner(false);
    } catch (error) {
      console.error('Failed to accept necessary cookies only:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const declineCookies = useCallback(async () => {
    setLoading(true);
    try {
      await AccountService.updateCookieSettings({
        necessary: true,
        analytics: false,
        marketing: false,
      });

      setCookieSettings({
        necessary: true,
        analytics: false,
        marketing: false,
      });

      await AsyncStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setShowBanner(false);
    } catch (error) {
      console.error('Failed to decline cookies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCookieSettings = useCallback(async (newSettings) => {
    setLoading(true);
    try {
      await AccountService.updateCookieSettings(newSettings);
      setCookieSettings(newSettings);
    } catch (error) {
      console.error('Failed to update cookie settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    showBanner,
    cookieSettings,
    loading,
    acceptAllCookies,
    acceptNecessaryOnly,
    declineCookies,
    updateCookieSettings,
    hideBanner: () => setShowBanner(false),
  };
};

export default useCookieConsent;
