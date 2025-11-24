import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.datingapp.com/api/v1';

const ConsentScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    analytics: false,
  });

  const isRegistration = route?.params?.isRegistration || false;

  useEffect(() => {
    // Ha nem regisztráció, töltse be a meglévő consent-eket
    if (!isRegistration) {
      loadConsents();
    }
  }, []);

  const loadConsents = async () => {
    try {
      const StorageService = require('../services/StorageService').default;
      const token = await StorageService.getToken();
      
      if (!token) {
        navigation.goBack();
        return;
      }

      // TODO: Backend API hívás a meglévő consent-ek lekéréséhez
      // Most csak placeholder
    } catch (error) {
      console.error('Error loading consents:', error);
    }
  };

  const handleConsentChange = (type, value) => {
    setConsents(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleSave = async () => {
    // Regisztráció esetén terms és privacy kötelező
    if (isRegistration && (!consents.terms || !consents.privacy)) {
      Alert.alert(
        'Kötelező mezők',
        'A Felhasználási Feltételek és az Adatvédelmi Szabályzat elfogadása kötelező a regisztrációhoz.'
      );
      return;
    }

    setLoading(true);
    try {
      const StorageService = require('../services/StorageService').default;
      const token = await StorageService.getToken();

      if (!token && !isRegistration) {
        Alert.alert('Hiba', 'Nincs bejelentkezve.');
        navigation.goBack();
        return;
      }

      // Backend API hívás minden consent-hez
      const consentPromises = Object.entries(consents).map(([type, accepted]) => {
        if (isRegistration && (type === 'terms' || type === 'privacy')) {
          // Regisztráció során ezek automatikusan mentésre kerülnek
          return Promise.resolve();
        }

        return fetch(`${API_BASE_URL}/gdpr/consent`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            consentType: type,
            accepted,
          }),
        });
      });

      await Promise.all(consentPromises);

      Alert.alert('Siker', 'Consent beállítások mentve.');
      
      if (isRegistration) {
        // Regisztráció folytatása
        navigation.navigate('Home');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving consents:', error);
      Alert.alert('Hiba', 'Hiba történt a mentés során.');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adatkezelési Beállítások</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.introText}>
          Kérjük, olvasd el figyelmesen és válaszd ki, hogy mely adatkezeléseket engedélyezed.
        </Text>

        {/* Terms of Service */}
        <View style={styles.consentCard}>
          <View style={styles.consentHeader}>
            <View style={styles.consentHeaderLeft}>
              <Ionicons name="document-text" size={24} color={theme.colors.primary} />
              <View style={styles.consentHeaderText}>
                <Text style={styles.consentTitle}>Felhasználási Feltételek</Text>
                <Text style={styles.consentRequired}>
                  {isRegistration ? '(Kötelező)' : '(Ajánlott)'}
                </Text>
              </View>
            </View>
            <Switch
              value={consents.terms}
              onValueChange={(value) => handleConsentChange('terms', value)}
              disabled={isRegistration && consents.terms} // Regisztráció során kötelező
            />
          </View>
          <Text style={styles.consentDescription}>
            Elfogadom a Felhasználási Feltételeket és hozzájárulok, hogy az alkalmazást használhassam.
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Navigate to Terms of Service
              navigation.navigate('WebView', { url: 'https://datingapp.com/terms' });
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Teljes szöveg megtekintése</Text>
            <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Privacy Policy */}
        <View style={styles.consentCard}>
          <View style={styles.consentHeader}>
            <View style={styles.consentHeaderLeft}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
              <View style={styles.consentHeaderText}>
                <Text style={styles.consentTitle}>Adatvédelmi Szabályzat</Text>
                <Text style={styles.consentRequired}>
                  {isRegistration ? '(Kötelező)' : '(Ajánlott)'}
                </Text>
              </View>
            </View>
            <Switch
              value={consents.privacy}
              onValueChange={(value) => handleConsentChange('privacy', value)}
              disabled={isRegistration && consents.privacy} // Regisztráció során kötelező
            />
          </View>
          <Text style={styles.consentDescription}>
            Elfogadom az Adatvédelmi Szabályzatot és hozzájárulok az adatkezeléshez.
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Navigate to Privacy Policy
              navigation.navigate('WebView', { url: 'https://datingapp.com/privacy' });
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Teljes szöveg megtekintése</Text>
            <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Marketing */}
        <View style={styles.consentCard}>
          <View style={styles.consentHeader}>
            <View style={styles.consentHeaderLeft}>
              <Ionicons name="mail" size={24} color={theme.colors.primary} />
              <View style={styles.consentHeaderText}>
                <Text style={styles.consentTitle}>Marketing Kommunikáció</Text>
                <Text style={styles.consentOptional}>(Opcionális)</Text>
              </View>
            </View>
            <Switch
              value={consents.marketing}
              onValueChange={(value) => handleConsentChange('marketing', value)}
            />
          </View>
          <Text style={styles.consentDescription}>
            Hozzájárulok, hogy marketing célú email-eket és értesítéseket kapjak (ajánlatok, újdonságok).
          </Text>
        </View>

        {/* Analytics */}
        <View style={styles.consentCard}>
          <View style={styles.consentHeader}>
            <View style={styles.consentHeaderLeft}>
              <Ionicons name="analytics" size={24} color={theme.colors.primary} />
              <View style={styles.consentHeaderText}>
                <Text style={styles.consentTitle}>Analytics Adatgyűjtés</Text>
                <Text style={styles.consentOptional}>(Opcionális)</Text>
              </View>
            </View>
            <Switch
              value={consents.analytics}
              onValueChange={(value) => handleConsentChange('analytics', value)}
            />
          </View>
          <Text style={styles.consentDescription}>
            Hozzájárulok az anonimizált használati statisztikák gyűjtéséhez, hogy javíthassuk a szolgáltatást.
          </Text>
        </View>

        {isRegistration && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={24} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              A Felhasználási Feltételek és az Adatvédelmi Szabályzat elfogadása kötelező a regisztrációhoz.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {isRegistration ? 'Elfogadás és Folytatás' : 'Mentés'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  consentCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  consentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  consentHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  consentRequired: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 2,
  },
  consentOptional: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  consentDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warningBackground || '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning || '#856404',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsentScreen;

