/**
 * Onboarding Step 1: Welcome & Feature Highlights
 *
 * First step of onboarding flow showing app features and getting user excited
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const OnboardingStep1 = ({ onNext, onSkip, variantContent }) => {
  const { theme } = useTheme();

  const features = [
    {
      icon: 'heart',
      title: 'Intelligens Matching',
      description: 'AI-alapú algoritmus segít megtalálni a tökéletes párt'
    },
    {
      icon: 'shield-checkmark',
      title: 'Biztonságos Környezet',
      description: 'Ellenőrzött profilok és biztonságos üzenetküldés'
    },
    {
      icon: 'location',
      title: 'Helyi Partnerek',
      description: 'Találd meg a közeledben lévő érdeklődőket'
    },
    {
      icon: 'chatbubbles',
      title: 'Könnyű Kommunikáció',
      description: 'Kezdd el a beszélgetést ice breaker kérdésekkel'
    },
    {
      icon: 'gift',
      title: 'Prémium Funkciók',
      description: 'Boost, Super Like és prémium előnyök várnak rád'
    },
    {
      icon: 'trophy',
      title: 'Gamifikáció',
      description: 'Keresd meg az egyezéseket és gyűjtögess pontokat'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="heart" size={48} color={theme.colors.cardBackground} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {variantContent?.title || 'Üdvözöl a LoveX!'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {variantContent?.subtitle || 'Találd meg a tökéletes párt intelligens matching rendszerünkkel'}
          </Text>
        </View>

        {/* Features Grid */}
        {(variantContent?.showFeatures !== false) && (
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureCard, { backgroundColor: theme.colors.cardBackground }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons
                  name={feature.icon}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {feature.description}
              </Text>
            </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>1M+</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Felhasználó</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>500K+</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Match</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>50+</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Ország</Text>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <Text style={[styles.ctaText, { color: theme.colors.textSecondary }]}>
            Kész vagy elkezdeni? Csak 2 percet vesz igénybe a profil beállítása!
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.cardBackground }]}>
        {onSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
          >
            <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
              Kihagyás
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={onNext}
        >
          <Text style={[styles.nextButtonText, { color: theme.colors.cardBackground }]}>
            Kezdjük!
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={theme.colors.cardBackground}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContainer: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 120, // Space for bottom actions
  },

  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },

  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  featuresContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  featureCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },

  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  stat: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },

  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  ctaText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 34, // Account for safe area
  },

  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    gap: 8,
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingStep1;
