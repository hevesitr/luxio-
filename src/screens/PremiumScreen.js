import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumService from '../services/PremiumService';
import { useTheme } from '../context/ThemeContext';

const PremiumScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [currentTier, setCurrentTier] = useState(PremiumService.TIERS.FREE);
  const [selectedTier, setSelectedTier] = useState(PremiumService.TIERS.GOLD);

  useEffect(() => {
    loadCurrentTier();
  }, []);

  const loadCurrentTier = async () => {
    const tier = await PremiumService.getUserTier();
    setCurrentTier(tier);
  };

  const handlePurchase = async () => {
    Alert.alert(
      '✨ Előfizetés',
      `Szeretnéd aktiválni a ${PremiumService.getTierDisplayName(selectedTier)}-t ${PremiumService.PRICING[selectedTier]} Ft/hóért?`,
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Fizetés',
          onPress: async () => {
            // In real app, this would process payment
            const success = await PremiumService.setUserTier(selectedTier);
            if (success) {
              Alert.alert(
                '🎉 Sikeres vásárlás!',
                `Aktiváltad a ${PremiumService.getTierDisplayName(selectedTier)}-t!`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }
          },
        },
      ]
    );
  };

  const PricingCard = ({ tier, isPopular = false }) => {
    const isSelected = selectedTier === tier;
    const isCurrent = currentTier === tier;
    const displayName = PremiumService.getTierDisplayName(tier);
    const price = PremiumService.PRICING[tier];
    const benefits = PremiumService.getTierBenefits(tier);

    const colors = {
      [PremiumService.TIERS.PLUS]: ['#2196F3', '#42A5F5'],
      [PremiumService.TIERS.GOLD]: ['#FFD700', '#FFC107'],
      [PremiumService.TIERS.PLATINUM]: ['#E0E0E0', '#BDBDBD'],
    };

    return (
      <TouchableOpacity
        style={[
          styles.pricingCard,
          isSelected && styles.selectedCard,
          isCurrent && styles.currentCard,
        ]}
        onPress={() => setSelectedTier(tier)}
        activeOpacity={0.8}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>NÉPSZERŰ</Text>
          </View>
        )}

        <LinearGradient
          colors={colors[tier]}
          style={styles.tierHeader}
        >
          <Text style={styles.tierName}>{displayName}</Text>
          <Text style={styles.tierPrice}>{price.toLocaleString()} Ft</Text>
          <Text style={styles.tierPeriod}>/ hónap</Text>
        </LinearGradient>

        <View style={styles.benefitsList}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>Jelenlegi csomag</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prémium Előfizetés</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient
            colors={['#FF3B75', '#FF6B9D']}
            style={styles.heroGradient}
          >
            <Ionicons name="sparkles" size={60} color={theme.colors.text} />
            <Text style={styles.heroTitle}>Upgrade Your Experience</Text>
            <Text style={styles.heroSubtitle}>
              Szerezz több matchet és éld meg a teljes prémium élményt
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.pricingContainer}>
          <PricingCard tier={PremiumService.TIERS.PLUS} />
          <PricingCard tier={PremiumService.TIERS.GOLD} isPopular />
          <PricingCard tier={PremiumService.TIERS.PLATINUM} />
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Összes prémium funkció:</Text>
          
          <View style={styles.featureCard}>
            <Ionicons name="infinite" size={32} color="#FF3B75" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Korlátlan swipe</Text>
              <Text style={styles.featureDesc}>
                Swipelj annyit amennyit csak akarsz, minden nap
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="rocket" size={32} color="#FF3B75" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Boost</Text>
              <Text style={styles.featureDesc}>
                Profil kiemelés 30 percre, 10x több megtekintés
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="heart" size={32} color="#FF3B75" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Likes You</Text>
              <Text style={styles.featureDesc}>
                Lásd azonnal ki lájkolt téged
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="earth" size={32} color="#FF3B75" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Passport</Text>
              <Text style={styles.featureDesc}>
                Swipelj bárhol a világon
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="diamond" size={32} color="#FF3B75" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Top Picks</Text>
              <Text style={styles.featureDesc}>
                Extra prémium ajánlások minden nap
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Az előfizetés bármikor lemondható. Az első 7 nap ingyenes!
          </Text>
        </View>
      </ScrollView>

      {currentTier !== selectedTier && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
          >
            <LinearGradient
              colors={['#FF3B75', '#FF6B9D']}
              style={styles.purchaseGradient}
            >
              <Text style={styles.purchaseText}>
                Előfizetés - {PremiumService.PRICING[selectedTier].toLocaleString()} Ft/hó
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  hero: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  pricingContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  pricingCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: theme.colors.surface,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
  },
  currentCard: {
    opacity: 0.7,
  },
  popularBadge: {
    backgroundColor: '#FF3B75',
    paddingVertical: 8,
    alignItems: 'center',
  },
  popularText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierHeader: {
    padding: 20,
    alignItems: 'center',
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  tierPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  tierPeriod: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.9,
  },
  benefitsList: {
    padding: 20,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    alignItems: 'center',
  },
  currentText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuresSection: {
    padding: 20,
    gap: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    gap: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: 20,
    paddingBottom: 100,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
  },
  purchaseButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  purchaseGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  purchaseText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PremiumScreen;

