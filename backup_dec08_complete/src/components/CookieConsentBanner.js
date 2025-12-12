import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccountService from '../services/AccountService';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const CookieConsentBanner = ({ visible = true, onAccept, onDecline }) => {
  const { theme } = useTheme();
  const [slideAnim] = useState(new Animated.Value(height));
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleAcceptAll = async () => {
    setLoading(true);
    try {
      await AccountService.updateCookieSettings({
        necessary: true,
        analytics: true,
        marketing: true,
      });
      onAccept?.();
    } catch (error) {
      console.error('Failed to update cookie settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptNecessary = async () => {
    setLoading(true);
    try {
      await AccountService.updateCookieSettings({
        necessary: true,
        analytics: false,
        marketing: false,
      });
      onAccept?.();
    } catch (error) {
      console.error('Failed to update cookie settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await AccountService.updateCookieSettings({
        necessary: true,
        analytics: false,
        marketing: false,
      });
      onDecline?.();
    } catch (error) {
      console.error('Failed to update cookie settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://hevesitr.github.io/lovex-/web/privacy-policy.html');
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons
              name="cookie-bite"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              🍪 Cookie Beállítások
            </Text>
          </View>

          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Weboldalunk cookie-kat használ a jobb felhasználói élmény érdekében.
            Kérjük, válassza ki, hogy mely cookie-kat fogadja el.
          </Text>

          {showDetails && (
            <View style={styles.detailsContainer}>
              <View style={styles.cookieType}>
                <View style={styles.cookieTypeHeader}>
                  <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                  <Text style={[styles.cookieTypeTitle, { color: theme.colors.text }]}>
                    Szükséges Cookie-k
                  </Text>
                </View>
                <Text style={[styles.cookieTypeDesc, { color: theme.colors.textSecondary }]}>
                  Ezek a cookie-k szükségesek az alkalmazás alapvető működéséhez.
                  Nem tilthatók le.
                </Text>
              </View>

              <View style={styles.cookieType}>
                <View style={styles.cookieTypeHeader}>
                  <Ionicons name="analytics" size={16} color="#FF9800" />
                  <Text style={[styles.cookieTypeTitle, { color: theme.colors.text }]}>
                    Analitikai Cookie-k
                  </Text>
                </View>
                <Text style={[styles.cookieTypeDesc, { color: theme.colors.textSecondary }]}>
                  Segítenek megérteni, hogyan használják az alkalmazást,
                  hogy javíthassuk a felhasználói élményt.
                </Text>
              </View>

              <View style={styles.cookieType}>
                <View style={styles.cookieTypeHeader}>
                  <Ionicons name="megaphone" size={16} color="#2196F3" />
                  <Text style={[styles.cookieTypeTitle, { color: theme.colors.text }]}>
                    Marketing Cookie-k
                  </Text>
                </View>
                <Text style={[styles.cookieTypeDesc, { color: theme.colors.textSecondary }]}>
                  Lehetővé teszik személyre szabott hirdetések megjelenítését
                  és marketing tartalmak küldését.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.privacyLink}
                onPress={openPrivacyPolicy}
              >
                <Text style={[styles.privacyLinkText, { color: theme.colors.primary }]}>
                  📖 Részletes információk az adatvédelmi szabályzatban
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.detailButton, { borderColor: theme.colors.border }]}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={[styles.detailButtonText, { color: theme.colors.textSecondary }]}>
                {showDetails ? 'Kevesebb információ' : 'Több információ'}
              </Text>
              <Ionicons
                name={showDetails ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                onPress={handleAcceptNecessary}
                disabled={loading}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                  Csak szükségesek
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAcceptAll}
                disabled={loading}
              >
                <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>
                  {loading ? 'Mentés...' : 'Összes elfogadása'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  safeArea: {
    maxHeight: height * 0.8,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  cookieType: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cookieTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cookieTypeTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  cookieTypeDesc: {
    fontSize: 14,
    lineHeight: 18,
  },
  privacyLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  privacyLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  actions: {
    gap: 16,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CookieConsentBanner;
