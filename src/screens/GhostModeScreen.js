import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const GhostModeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [isGhostModeEnabled, setIsGhostModeEnabled] = useState(false);
  const [ghostModeDuration, setGhostModeDuration] = useState(24); // hours

  // Fallback theme protection
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

  const handleToggleGhostMode = async () => {
    try {
      // Here you would typically call an API to enable/disable ghost mode
      setIsGhostModeEnabled(!isGhostModeEnabled);

      Alert.alert(
        isGhostModeEnabled ? 'Ghost Mode Kikapcsolva' : 'Ghost Mode Bekapcsolva',
        isGhostModeEnabled
          ? 'Most már látható vagy mások számára.'
          : `Mostantól láthatatlan vagy mások számára ${ghostModeDuration} órán keresztül.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Hiba', 'Nem sikerült módosítani a ghost mode állapotát.');
    }
  };

  const durationOptions = [
    { hours: 1, label: '1 óra', premium: false },
    { hours: 6, label: '6 óra', premium: false },
    { hours: 24, label: '24 óra', premium: false },
    { hours: 72, label: '3 nap', premium: true },
    { hours: 168, label: '1 hét', premium: true },
  ];

  const styles = createStyles(safeTheme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={safeTheme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ghost Mode</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Icon and Title */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#9C27B0', '#673AB7']}
              style={styles.iconGradient}
            >
              <Ionicons name="eye-off" size={48} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Légy Láthatatlan</Text>
          <Text style={styles.description}>
            A Ghost Mode bekapcsolásával mások nem láthatnak téged a felfedezésben,
            de te továbbra is böngészheted a profilokat és lájkolgathatsz.
          </Text>

          {/* Ghost Mode Toggle */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Ghost Mode</Text>
                <Text style={styles.toggleSubtitle}>
                  {isGhostModeEnabled ? 'Bekapcsolva' : 'Kikapcsolva'}
                </Text>
              </View>
              <Switch
                value={isGhostModeEnabled}
                onValueChange={handleToggleGhostMode}
                trackColor={{ false: '#767577', true: safeTheme.colors.primary }}
                thumbColor={isGhostModeEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Duration Selection */}
          {isGhostModeEnabled && (
            <View style={styles.durationContainer}>
              <Text style={styles.sectionTitle}>Időtartam kiválasztása</Text>
              {durationOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.durationOption,
                    ghostModeDuration === option.hours && styles.durationOptionSelected,
                  ]}
                  onPress={() => setGhostModeDuration(option.hours)}
                >
                  <View style={styles.durationContent}>
                    <Text style={[
                      styles.durationLabel,
                      ghostModeDuration === option.hours && styles.durationLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    {option.premium && (
                      <View style={styles.premiumBadge}>
                        <Ionicons name="diamond" size={12} color="#FFD700" />
                        <Text style={styles.premiumText}>Premium</Text>
                      </View>
                    )}
                  </View>
                  {ghostModeDuration === option.hours && (
                    <Ionicons name="checkmark" size={20} color={safeTheme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.sectionTitle}>Előnyök</Text>
            <View style={styles.benefit}>
              <Ionicons name="eye-off-outline" size={20} color={safeTheme.colors.primary} />
              <Text style={styles.benefitText}>Mások nem látnak téged</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="search-outline" size={20} color={safeTheme.colors.primary} />
              <Text style={styles.benefitText}>Továbbra is böngészheted a profilokat</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="heart-outline" size={20} color={safeTheme.colors.primary} />
              <Text style={styles.benefitText}>Lájkolhatsz és super lájkolhatsz</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="shield-outline" size={20} color={safeTheme.colors.primary} />
              <Text style={styles.benefitText}>Extra biztonság és magánszféra</Text>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              A Ghost Mode automatikusan kikapcsol a kiválasztott időtartam után,
              vagy manuálisan kikapcsolhatod bármikor.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  toggleContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  durationContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.colors.background,
  },
  durationOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  durationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  durationLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD70020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  benefitsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  benefitText: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FF980020',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FF980040',
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    flex: 1,
    lineHeight: 20,
  },
});

export default GhostModeScreen;
