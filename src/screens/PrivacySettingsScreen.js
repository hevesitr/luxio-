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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AccountService from '../services/AccountService';
import Logger from '../services/Logger';

const PrivacySettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fallback theme if theme is not initialized
  const safeTheme = theme || {
    colors: {
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      primary: '#FF3B75',
      border: 'rgba(255, 255, 255, 0.1)',
    }
  };
  const [settings, setSettings] = useState({
    // Cookie settings
    necessary_cookies: true,
    analytics_consent: false,
    marketing_consent: false,

    // Privacy settings
    profile_visible: true,
    show_online_status: true,
    allow_messages: true,
    allow_likes: true,
    data_sharing: false,

    // Notification settings
    push_notifications: true,
    email_notifications: true,
    match_notifications: true,
    message_notifications: true,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [privacySettings, cookieSettings] = await Promise.all([
        AccountService.getPrivacySettings(user.id),
        AccountService.getCookieSettings(user.id),
      ]);

      setSettings({
        ...privacySettings,
        ...cookieSettings,
      });
    } catch (error) {
      Logger.error('Failed to load privacy settings', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni az adatvédelmi beállításokat.');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Separate cookie and privacy settings
      const cookieSettings = {
        necessary: settings.necessary_cookies,
        analytics: settings.analytics_consent,
        marketing: settings.marketing_consent,
      };

      const privacySettings = {
        profile_visible: settings.profile_visible,
        show_online_status: settings.show_online_status,
        allow_messages: settings.allow_messages,
        allow_likes: settings.allow_likes,
        data_sharing: settings.data_sharing,
        push_notifications: settings.push_notifications,
        email_notifications: settings.email_notifications,
        match_notifications: settings.match_notifications,
        message_notifications: settings.message_notifications,
      };

      await Promise.all([
        AccountService.updateCookieSettings(cookieSettings),
        AccountService.updatePrivacySettings(privacySettings),
      ]);

      Alert.alert('Siker', 'Adatvédelmi beállítások mentve!', [
        { text: 'OK' }
      ]);
    } catch (error) {
      Logger.error('Failed to save privacy settings', error);
      Alert.alert('Hiba', 'Nem sikerült menteni az adatvédelmi beállításokat.');
    } finally {
      setSaving(false);
    }
  };

  const SettingItem = ({ title, description, value, onValueChange, disabled = false }) => (
    <View style={[styles.settingItem, { backgroundColor: safeTheme.colors.surface }]}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: safeTheme.colors.text }]}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, { color: safeTheme.colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || saving}
        trackColor={{ false: safeTheme.colors.border, true: safeTheme.colors.primary }}
        thumbColor={value ? '#FFFFFF' : safeTheme.colors.textSecondary}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: safeTheme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={safeTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: safeTheme.colors.textSecondary }]}>
            Beállítások betöltése...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: safeTheme.colors.background }]}>
      <LinearGradient
        colors={[safeTheme.colors.primary, 'rgba(255, 59, 117, 0.8)']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adatvédelmi Beállítások</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cookie Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: safeTheme.colors.text }]}>
            🍪 Cookie Beállítások
          </Text>

          <SettingItem
            title="Szükséges Cookie-k"
            description="Alapvető funkcionalitáshoz szükséges cookie-k"
            value={settings.necessary_cookies}
            onValueChange={(value) => updateSetting('necessary_cookies', value)}
            disabled={true} // Always required
          />

          <SettingItem
            title="Analitikai Cookie-k"
            description="Használat elemzéséhez és fejlesztéshez"
            value={settings.analytics_consent}
            onValueChange={(value) => updateSetting('analytics_consent', value)}
          />

          <SettingItem
            title="Marketing Cookie-k"
            description="Személyre szabott hirdetésekhez és ajánlatokhoz"
            value={settings.marketing_consent}
            onValueChange={(value) => updateSetting('marketing_consent', value)}
          />
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: safeTheme.colors.text }]}>
            🔒 Adatvédelmi Beállítások
          </Text>

          <SettingItem
            title="Profil Láthatósága"
            description="Más felhasználók láthatják-e a profilomat"
            value={settings.profile_visible}
            onValueChange={(value) => updateSetting('profile_visible', value)}
          />

          <SettingItem
            title="Online Státusz"
            description="Más felhasználók láthatják-e, hogy online vagyok"
            value={settings.show_online_status}
            onValueChange={(value) => updateSetting('show_online_status', value)}
          />

          <SettingItem
            title="Üzenetek Engedélyezése"
            description="Más felhasználók küldhetnek-e üzenetet"
            value={settings.allow_messages}
            onValueChange={(value) => updateSetting('allow_messages', value)}
          />

          <SettingItem
            title="Kedvelések Engedélyezése"
            description="Más felhasználók kedvelhetnek-e"
            value={settings.allow_likes}
            onValueChange={(value) => updateSetting('allow_likes', value)}
          />

          <SettingItem
            title="Adatmegosztás"
            description="Adatok megosztása harmadik felekkel kutatáshoz"
            value={settings.data_sharing}
            onValueChange={(value) => updateSetting('data_sharing', value)}
          />
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: safeTheme.colors.text }]}>
            🔔 Értesítési Beállítások
          </Text>

          <SettingItem
            title="Push Értesítések"
            description="Push értesítések engedélyezése"
            value={settings.push_notifications}
            onValueChange={(value) => updateSetting('push_notifications', value)}
          />

          <SettingItem
            title="Email Értesítések"
            description="Email értesítések engedélyezése"
            value={settings.email_notifications}
            onValueChange={(value) => updateSetting('email_notifications', value)}
          />

          <SettingItem
            title="Match Értesítések"
            description="Értesítések új párosításokról"
            value={settings.match_notifications}
            onValueChange={(value) => updateSetting('match_notifications', value)}
          />

          <SettingItem
            title="Üzenet Értesítések"
            description="Értesítések új üzenetekről"
            value={settings.message_notifications}
            onValueChange={(value) => updateSetting('message_notifications', value)}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: safeTheme.colors.primary,
              opacity: saving ? 0.7 : 1,
            },
          ]}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Beállítások Mentése</Text>
          )}
        </TouchableOpacity>

        {/* GDPR Links */}
        <View style={styles.gdprSection}>
          <Text style={[styles.gdprTitle, { color: safeTheme.colors.text }]}>
            📜 GDPR Jogok
          </Text>

          <TouchableOpacity
            style={[styles.gdprButton, { borderColor: safeTheme.colors.border }]}
            onPress={() => navigation.navigate('DataExport')}
          >
            <Ionicons name="download" size={20} color={safeTheme.colors.primary} />
            <Text style={[styles.gdprButtonText, { color: safeTheme.colors.text }]}>
              Adat Exportálása
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gdprButton, { borderColor: safeTheme.colors.border }]}
            onPress={() => navigation.navigate('DeleteAccount')}
          >
            <Ionicons name="trash" size={20} color="#F44336" />
            <Text style={[styles.gdprButtonText, { color: safeTheme.colors.text }]}>
              Fiók Törlése
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gdprSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  gdprTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  gdprButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  gdprButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PrivacySettingsScreen;
