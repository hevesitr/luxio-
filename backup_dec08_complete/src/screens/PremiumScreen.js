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
import PaymentService from '../services/PaymentService';
import ABTestingService from '../services/ABTestingService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PremiumScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('premium_gold');
  const [plans, setPlans] = useState([]);
  const [paywallVariant, setPaywallVariant] = useState(null);
  const [variantContent, setVariantContent] = useState({});

  useEffect(() => {
    initializePaywall();
  }, []);

  const initializePaywall = async () => {
    // Initialize A/B testing for paywall
    if (user?.id) {
      try {
        const variants = await ABTestingService.getUserVariants(user.id);
        setPaywallVariant(variants.paywall_design || 'minimal');

        // Get variant content
        const designContent = await ABTestingService.getVariantContent(
          'paywall_design',
          variants.paywall_design || 'minimal'
        );
        const pricingContent = await ABTestingService.getVariantContent(
          'paywall_pricing',
          variants.paywall_pricing || 'quarterly_focus'
        );

        setVariantContent({
          design: designContent.success ? designContent.content : {},
          pricing: pricingContent.success ? pricingContent.content : {}
        });

        // Track paywall view
        await ABTestingService.trackEvent(
          user.id,
          'paywall_design',
          variants.paywall_design || 'minimal',
          'paywall_viewed'
        );

      } catch (error) {
        console.error('Paywall A/B testing error:', error);
      }
    }

    loadSubscriptionData();
  };

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Get available plans
      const plansResult = PaymentService.getSubscriptionPlans();
      if (plansResult.success) {
        setPlans(plansResult.data);
        // Set default selected plan to Gold (middle tier)
        const goldPlan = plansResult.data.find(p => p.id === 'premium_quarterly');
        if (goldPlan) {
          setSelectedPlan(goldPlan.id);
        }
      }

      // Get current subscription status
      if (user?.id) {
        const statusResult = await PaymentService.getSubscriptionStatus(user.id);
        if (statusResult.success) {
          setSubscriptionStatus(statusResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni az előfizetési adatokat');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user?.id) {
      Alert.alert('Hiba', 'Jelentkezz be az előfizetéshez');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) {
      Alert.alert('Hiba', 'Érvénytelen csomag');
      return;
    }

    Alert.alert(
      '✨ Előfizetés',
      `Szeretnéd aktiválni a ${plan.name}-t $${plan.price}/${plan.duration} napért?`,
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Fizetés',
          onPress: async () => {
            try {
              setLoading(true);

              // Process payment (mock implementation)
              const paymentResult = await PaymentService.processPayment(
                user.id,
                plan.price,
                'card'
              );

              if (!paymentResult.success) {
                throw new Error('Payment failed');
              }

              // Create subscription
              const subscriptionResult = await PaymentService.createSubscription(
                user.id,
                plan.id
              );

              if (subscriptionResult.success) {
                // Track conversion for A/B testing
                if (user?.id && paywallVariant) {
                  try {
                    await ABTestingService.trackEvent(
                      user.id,
                      'paywall_design',
                      paywallVariant,
                      'subscription_started',
                      {
                        planId: plan.id,
                        planName: plan.name,
                        price: plan.price,
                        duration: plan.duration
                      }
                    );
                  } catch (error) {
                    console.error('A/B testing tracking error:', error);
                  }
                }

                Alert.alert(
                  '🎉 Sikeres vásárlás!',
                  `Aktiváltad a ${plan.name}-t!`,
                  [{
                    text: 'OK',
                    onPress: () => {
                      loadSubscriptionData();
                      navigation.goBack();
                    }
                  }]
                );
              }
            } catch (error) {
              console.error('Purchase error:', error);
              Alert.alert(
                'Hiba',
                error.message || 'Nem sikerült feldolgozni a fizetést'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const PricingCard = ({ plan, isPopular = false }) => {
    const isSelected = selectedPlan === plan.id;
    const isCurrent = subscriptionStatus?.isPremium && 
                      subscriptionStatus?.subscription?.plan_id === plan.id;

    const colors = {
      'premium_monthly': ['#2196F3', '#42A5F5'],
      'premium_quarterly': ['#FFD700', '#FFC107'],
      'premium_yearly': ['#E0E0E0', '#BDBDBD'],
    };

    return (
      <TouchableOpacity
        style={[
          styles.pricingCard,
          isSelected && styles.selectedCard,
          isCurrent && styles.currentCard,
        ]}
        onPress={() => !isCurrent && setSelectedPlan(plan.id)}
        activeOpacity={0.8}
        disabled={isCurrent}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>NÉPSZERŰ</Text>
          </View>
        )}

        <LinearGradient
          colors={colors[plan.id] || ['#2196F3', '#42A5F5']}
          style={styles.tierHeader}
        >
          <Text style={styles.tierName}>{plan.name}</Text>
          <Text style={styles.tierPrice}>${plan.price}</Text>
          <Text style={styles.tierPeriod}>/ {plan.duration} nap</Text>
        </LinearGradient>

        <View style={styles.benefitsList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>
                {getFeatureDisplayName(feature)}
              </Text>
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

  const getFeatureDisplayName = (feature) => {
    const featureNames = {
      'unlimited_swipes': 'Korlátlan swipe',
      'see_who_liked': 'Lásd ki lájkolt',
      'super_likes': '5 Super Like / nap',
      'unlimited_rewinds': 'Korlátlan visszavonás',
      'boost': 'Havi Boost',
      'priority_support': 'Prioritásos támogatás',
    };
    return featureNames[feature] || feature;
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.footerText, { marginTop: 20 }]}>
            Előfizetési adatok betöltése...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        {subscriptionStatus?.isPremium && (
          <View style={styles.currentSubscriptionBanner}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Aktív előfizetés</Text>
              <Text style={styles.bannerText}>
                {subscriptionStatus.daysRemaining} nap van hátra
              </Text>
            </View>
          </View>
        )}

        <View style={styles.hero}>
          <LinearGradient
            colors={['#FF3B75', '#FF6B9D']}
            style={styles.heroGradient}
          >
            <Ionicons name="sparkles" size={60} color="#FFF" />
            <Text style={styles.heroTitle}>Upgrade Your Experience</Text>
            <Text style={styles.heroSubtitle}>
              Szerezz több matchet és éld meg a teljes prémium élményt
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.pricingContainer}>
          {plans.map((plan, index) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              isPopular={index === 1} 
            />
          ))}
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

      {!subscriptionStatus?.isPremium && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={handlePurchase}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF3B75', '#FF6B9D']}
              style={styles.purchaseGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.purchaseText}>
                  Előfizetés - ${plans.find(p => p.id === selectedPlan)?.price || 0}
                </Text>
              )}
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
  currentSubscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 5,
  },
  bannerText: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.8,
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

