import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import LegalService from '../services/LegalService';
import AuthService from '../services/AuthService';

const LegalUpdateScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState({});
  const [accepting, setAccepting] = useState(false);

  const { forceUpdate = false } = route?.params || {};

  useEffect(() => {
    loadUpdates();
  }, []);

  const loadUpdates = async () => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        navigation.goBack();
        return;
      }

      const result = await LegalService.checkDocumentUpdates(currentUser.id);
      if (result.success && result.hasUpdates) {
        setUpdates(result.updates);
      } else if (!forceUpdate) {
        // Nincs frissítés, visszalépés
        navigation.goBack();
        return;
      }
    } catch (error) {
      console.error('Error loading updates:', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni a dokumentum frissítéseket.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    setAccepting(true);
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) return;

      const promises = Object.entries(updates).map(([docType, update]) =>
        LegalService.acceptDocumentUpdate(currentUser.id, docType, update.currentVersion)
      );

      await Promise.all(promises);

      Alert.alert(
        'Frissítések elfogadva',
        'Köszönjük, hogy átnézte és elfogadta a jogi dokumentumok frissítéseit.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error accepting updates:', error);
      Alert.alert('Hiba', 'Hiba történt a frissítések elfogadásakor.');
    } finally {
      setAccepting(false);
    }
  };

  const handleViewDocument = (docType) => {
    try {
      const url = LegalService.getDocumentUrl(docType);
      navigation.navigate('WebView', {
        url,
        title: getDocumentTitle(docType)
      });
    } catch (error) {
      Alert.alert('Hiba', 'Nem sikerült betölteni a dokumentumot.');
    }
  };

  const getDocumentTitle = (docType) => {
    const titles = {
      terms_of_service: 'Felhasználási Feltételek',
      privacy_policy: 'Adatvédelmi Szabályzat',
      safety_guidelines: 'Biztonsági Útmutató',
      community_guidelines: 'Közösségi Irányelvek'
    };
    return titles[docType] || docType;
  };

  const getDocumentIcon = (docType) => {
    const icons = {
      terms_of_service: 'document-text',
      privacy_policy: 'shield-checkmark',
      safety_guidelines: 'shield',
      community_guidelines: 'people'
    };
    return icons[docType] || 'document';
  };

  const getUpdateReason = (update) => {
    // Ez egy placeholder - valós implementációban specifikus változások leírása
    return 'Fontos frissítések és javítások a jobb felhasználói élmény érdekében.';
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Frissítések betöltése...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const updateKeys = Object.keys(updates);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Jogi Dokumentum Frissítések</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.introContainer}>
          <Ionicons name="information-circle" size={48} color={theme.colors.primary} />
          <Text style={styles.introTitle}>Dokumentum Frissítések</Text>
          <Text style={styles.introText}>
            A következő jogi dokumentumok frissültek. Kérjük, olvassa át és fogadja el az új verziókat a folytatáshoz.
          </Text>
        </View>

        {updateKeys.map((docType) => {
          const update = updates[docType];
          return (
            <View key={docType} style={styles.updateCard}>
              <View style={styles.updateHeader}>
                <View style={styles.updateHeaderLeft}>
                  <Ionicons
                    name={getDocumentIcon(docType)}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={styles.updateHeaderText}>
                    <Text style={styles.updateTitle}>{getDocumentTitle(docType)}</Text>
                    <Text style={styles.updateVersion}>
                      Verzió: {update.currentVersion}
                      {update.userVersion && ` (előző: ${update.userVersion})`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleViewDocument(docType)}
                  style={styles.viewButton}
                >
                  <Text style={styles.viewButtonText}>Megtekintés</Text>
                  <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.updateDescription}>
                {getUpdateReason(update)}
              </Text>

              <View style={styles.updateMeta}>
                <Text style={styles.updateDate}>
                  Frissítve: {new Date().toLocaleDateString('hu-HU')}
                </Text>
              </View>
            </View>
          );
        })}

        <View style={styles.warningBox}>
          <Ionicons name="warning" size={24} color={theme.colors.warning} />
          <Text style={styles.warningText}>
            Az új dokumentumok elfogadása kötelező az alkalmazás további használatához.
            Az elutasítás esetén az alkalmazás korlátozott funkcionalitással működik.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptButton, accepting && styles.acceptButtonDisabled]}
          onPress={handleAcceptAll}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.acceptButtonGradient}
            >
              <Text style={styles.acceptButtonText}>
                Összes Frissítés Elfogadása ({updateKeys.length})
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
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
  introContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  updateCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  updateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  updateHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  updateVersion: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  viewButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
  },
  updateDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  updateMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warningBackground || '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 24,
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
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LegalUpdateScreen;
