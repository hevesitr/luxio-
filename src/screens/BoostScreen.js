import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BoostService from '../services/BoostService';
import PremiumService from '../services/PremiumService';

const BoostScreen = ({ navigation }) => {
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [canBoost, setCanBoost] = useState(true);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    checkBoostStatus();
    const interval = setInterval(() => {
      checkBoostStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isBoostActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isBoostActive]);

  const checkBoostStatus = async () => {
    const boost = await BoostService.getActiveBoost();
    if (boost) {
      setIsBoostActive(true);
      setRemainingTime(await BoostService.getRemainingTime());
      setProfileViews(boost.profileViews);
    } else {
      setIsBoostActive(false);
      setRemainingTime(0);
    }

    // Check if user can boost (monthly limit)
    const boostCount = await PremiumService.getMonthlyBoostCount();
    const canBoostNow = await PremiumService.canBoost(boostCount);
    setCanBoost(canBoostNow);
  };

  const handleActivateBoost = async () => {
    if (!canBoost) {
      Alert.alert(
        'Boost Limit Elérve',
        'Elérted a havi Boost limitedet. Frissíts prémiumra hogy több Boost-ot kapj!',
        [
          { text: 'Mégsem', style: 'cancel' },
          { text: 'Prémium', onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }

    Alert.alert(
      '🚀 Boost Aktiválása',
      'Aktiválod a Boost-ot 30 percre? A profilod 10x többször fog megjelenni!',
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Aktiválás',
          onPress: async () => {
            const boost = await BoostService.activateBoost();
            if (boost) {
              await PremiumService.incrementBoostCount();
              setIsBoostActive(true);
              Alert.alert('🚀 Boost Aktív!', 'A profilod most kiemelve van 30 percre!');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boost</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isBoostActive ? (
          <View style={styles.activeBoostContainer}>
            <Animated.View style={[styles.boostIcon, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['#FF3B75', '#FF6B9D']}
                style={styles.iconGradient}
              >
                <Ionicons name="rocket" size={80} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.activeTitle}>Boost Aktív! 🔥</Text>
            <Text style={styles.activeSubtitle}>A profilod most kiemelve van</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{BoostService.formatRemainingTime(remainingTime)}</Text>
                <Text style={styles.statLabel}>Hátralévő idő</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{profileViews}</Text>
                <Text style={styles.statLabel}>Megtekintések</Text>
              </View>
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitText}>✓ 10x több profil megtekintés</Text>
              <Text style={styles.benefitText}>✓ Kiemelt pozíció</Text>
              <Text style={styles.benefitText}>✓ Több match lehetőség</Text>
            </View>
          </View>
        ) : (
          <View style={styles.inactiveBoostContainer}>
            <View style={styles.boostIconInactive}>
              <LinearGradient
                colors={['#FF3B75', '#FF6B9D']}
                style={styles.iconGradient}
              >
                <Ionicons name="rocket-outline" size={80} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Boost a Profilod</Text>
            <Text style={styles.subtitle}>
              Légy az első 30 percre és szerezz 10x több megtekintést!
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Ionicons name="eye" size={32} color="#FF3B75" />
                <Text style={styles.featureTitle}>10x Több Megtekintés</Text>
                <Text style={styles.featureDesc}>
                  A profilod a legtöbbeknek fog megjelenni
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="star" size={32} color="#FF3B75" />
                <Text style={styles.featureTitle}>Kiemelt Pozíció</Text>
                <Text style={styles.featureDesc}>
                  Elsők között jelenítjük meg a profilod
                </Text>
              </View>
              <View style={styles.feature}>
                <Ionicons name="heart" size={32} color="#FF3B75" />
                <Text style={styles.featureTitle}>Több Match</Text>
                <Text style={styles.featureDesc}>
                  Nagyobb esély a sikeres találkozásra
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.activateButton, !canBoost && styles.disabledButton]}
              onPress={handleActivateBoost}
              disabled={!canBoost}
            >
              <LinearGradient
                colors={canBoost ? ['#FF3B75', '#FF6B9D'] : ['#ccc', '#999']}
                style={styles.buttonGradient}
              >
                <Ionicons name="rocket" size={24} color="#fff" />
                <Text style={styles.buttonText}>
                  {canBoost ? 'Boost Aktiválása' : 'Havi Limit Elérve'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!canBoost && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={styles.upgradeText}>Frissíts Prémiumra →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    color: '#fff',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  activeBoostContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBoostContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  boostIcon: {
    marginBottom: 30,
  },
  boostIconInactive: {
    marginBottom: 30,
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },
  activeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 20,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  benefitsContainer: {
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  featuresContainer: {
    width: '100%',
    gap: 25,
    marginBottom: 40,
  },
  feature: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  activateButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  upgradeButton: {
    marginTop: 15,
    padding: 10,
  },
  upgradeText: {
    color: '#FF3B75',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BoostScreen;

