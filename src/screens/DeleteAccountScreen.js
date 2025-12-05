import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AccountService from '../services/AccountService';
import DataDeletionService from '../services/DataDeletionService';
import Logger from '../services/Logger';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.datingapp.com/api/v1';

const DeleteAccountScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [currentStep, setCurrentStep] = useState('warning'); // warning, confirm, pending, cancelled

  // Check for existing deletion request on mount
  useEffect(() => {
    checkExistingDeletionRequest();
    loadPreviewData();
  }, []);

  const checkExistingDeletionRequest = async () => {
    if (!user?.id) return;

    try {
      const status = await AccountService.getAccountStatus(user.id);
      if (status.hasPendingDeletion) {
        setDeletionRequest(status.deletionRequest);
        setCurrentStep('pending');
      }
    } catch (error) {
      Logger.error('Failed to check existing deletion request', error);
    }
  };

  const loadPreviewData = async () => {
    if (!user?.id) return;

    try {
      const preview = await DataDeletionService.getDeletionPreview(user.id);
      setPreviewData(preview);
    } catch (error) {
      Logger.error('Failed to load preview data', error);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user?.id) return;

    if (!password.trim()) {
      Alert.alert('Hiba', 'Kérjük, add meg a jelszavadat a megerősítéshez.');
      return;
    }

    setLoading(true);
    try {
      const result = await AccountService.requestAccountDeletion(
        user.id,
        password.trim(),
        reason.trim()
      );

      if (result.success) {
        setDeletionRequest({
          id: 'temp', // Will be set by the service
          scheduled_deletion_date: result.deletionRequest?.scheduled_deletion_date || result.gracePeriodEnds,
        });
        setCurrentStep('pending');

        Alert.alert(
          'Törlési kérés elküldve',
          `A fiókod ${result.gracePeriodDays} napon belül törlésre kerül. ` +
          'Ezen idő alatt bármikor visszavonhatod a kérést.',
          [{ text: 'Rendben' }]
        );

        Logger.info('Account deletion requested from UI', { userId: user.id });
      } else {
        throw new Error(result.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      Logger.error('Account deletion request failed', error);
      Alert.alert('Hiba', 'Nem sikerült elküldeni a törlési kérést. Próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user?.id || !deletionRequest?.id) return;

    Alert.alert(
      'Kérés visszavonása',
      'Biztosan visszavonod a fiók törlési kérelmet?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Visszavonás',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AccountService.cancelAccountDeletion(user.id, deletionRequest.id);

              if (result.success) {
                setDeletionRequest(null);
                setCurrentStep('warning');

                Alert.alert(
                  'Kérés visszavonva',
                  'A fiók törlési kérelmet sikeresen visszavontad.'
                );

                Logger.info('Account deletion cancelled from UI', { userId: user.id });
              } else {
                throw new Error(result.error || 'Ismeretlen hiba');
              }
            } catch (error) {
              Logger.error('Account deletion cancellation failed', error);
              Alert.alert('Hiba', 'Nem sikerült visszavonni a kérést. Próbáld újra.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!password.trim()) {
      Alert.alert('Hiba', 'Kérjük, add meg a jelszavadat a megerősítéshez.');
      return;
    }

    Alert.alert(
      '⚠️ Fiók Törlése',
      'Biztosan törölni szeretnéd a fiókodat?\n\n' +
      'Ez a művelet:\n' +
      '• 30 napon belül végrehajtódik\n' +
      '• Ezen idő alatt visszavonhatod a kérést\n' +
      '• Az összes adatod törlésre kerül\n' +
      '• Matchek és üzenetek is törlődnek\n\n' +
      'Ez a művelet VISSZAVONHATATLAN!',
      [
        {
          text: 'Mégse',
          style: 'cancel',
        },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const token = await StorageService.getToken();
              
              if (!token) {
                Alert.alert('Hiba', 'Nincs bejelentkezve.');
                navigation.goBack();
                return;
              }

              const response = await fetch(`${API_BASE_URL}/gdpr/delete`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  password,
                  reason: reason.trim() || null,
                }),
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert(
                  '✅ Kérés elküldve',
                  'Fiókod törlési kérése elküldve. A törlés 30 napon belül történik.\n\n' +
                  'Ezen idő alatt visszavonhatod a kérést a Beállítások menüben.',
                  [
                    {
                      text: 'Rendben',
                      onPress: () => {
                        // Kijelentkezés
                        StorageService.logout();
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      },
                    },
                  ]
                );
              } else {
                throw new Error(result.error?.message || 'Delete failed');
              }
            } catch (error) {
              console.error('Delete account error:', error);
              
              if (error.message?.includes('password')) {
                Alert.alert('Hiba', 'Hibás jelszó. Kérjük, próbáld újra.');
              } else {
                Alert.alert('Hiba', 'Hiba történt a fiók törlése során. Kérjük, próbáld újra később.');
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fiók Törlése</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={32} color={theme.colors.error} />
          <Text style={styles.warningTitle}>Figyelem!</Text>
          <Text style={styles.warningText}>
            A fiók törlése VISSZAVONHATATLAN művelet. Az összes adatod, matchek és üzenetek törlésre kerülnek.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Mi történik a törléssel?</Text>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              Fiókod 30 napon belül törlésre kerül (grace period)
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              Ezen idő alatt visszavonhatod a kérést
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              Az összes adatod véglegesen törlődik
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              Matchek és üzenetek is törlődnek
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Jelszó *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Add meg a jelszavadat"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            A jelszó megerősítéshez szükséges
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Törlés oka (opcionális)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Opcionális: Miért szeretnéd törölni a fiókodat?"
            placeholderTextColor={theme.colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.helperText}>
            Segíts nekünk javítani a szolgáltatást
          </Text>
        </View>

        <View style={styles.alternativesBox}>
          <Text style={styles.alternativesTitle}>Alternatívák a törlés helyett:</Text>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.alternativeText}>Beállítások módosítása</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => navigation.navigate('Moderation', { screen: 'Blocked' })}
          >
            <Ionicons name="ban-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.alternativeText}>Felhasználók blokkolása</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => navigation.navigate('Settings', { screen: 'Notifications' })}
          >
            <Ionicons name="notifications-off-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.alternativeText}>Értesítések kikapcsolása</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deleteButton, (!password.trim() || loading) && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={!password.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <LinearGradient
              colors={[theme.colors.error, '#D32F2F']}
              style={styles.deleteButtonGradient}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.deleteButtonText}>Fiók Törlése</Text>
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
  warningBox: {
    backgroundColor: theme.colors.errorBackground || '#FFEBEE',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  alternativesBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
  },
  alternativeText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  deleteButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeleteAccountScreen;

