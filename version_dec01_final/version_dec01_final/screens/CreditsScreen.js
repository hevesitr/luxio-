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
import CreditsService, { CREDIT_PACKAGES, CREDIT_COSTS } from '../services/CreditsService';

const CreditsScreen = ({ navigation }) => {
  const [credits, setCredits] = useState(100);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentCredits = await CreditsService.getCredits();
    const creditHistory = await CreditsService.getHistory();
    setCredits(currentCredits);
    setHistory(creditHistory);
  };

  const handlePurchase = async (packageId) => {
    const result = await CreditsService.purchasePackage(packageId);
    
    if (result.success) {
      setCredits(result.balance);
      Alert.alert('✅ Sikeres vásárlás!', result.message);
      loadData();
    } else {
      Alert.alert('Hiba', result.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonText = (reason) => {
    const reasons = {
      'Gift: Rózsa': '🌹 Rózsa ajándék',
      'Gift: Csokoládé': '🍫 Csokoládé ajándék',
      'Gift: Kávé': '☕ Kávé ajándék',
      'Gift: Sör': '🍺 Sör ajándék',
      'Gift: Szívecske': '💝 Szívecske ajándék',
      'Gift: Csillag': '⭐ Csillag ajándék',
      'Gift: Doboz': '🎁 Doboz ajándék',
      'Gift: Gyémánt': '💎 Gyémánt ajándék',
      'Gift: Király': '👑 Király ajándék',
      'Gift: Rakéta': '🚀 Rakéta ajándék',
      'Package 1 purchase': 'Csomag vásárlás',
      'Package 2 purchase': 'Csomag vásárlás',
      'Package 3 purchase': 'Csomag vásárlás',
      'Package 4 purchase': 'Csomag vásárlás',
      'Package 5 purchase': 'Csomag vásárlás',
    };
    return reasons[reason] || reason;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kreditek</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Ionicons name="diamond" size={48} color="#FF3B75" />
          <Text style={styles.balanceLabel}>Jelenlegi egyenleg</Text>
          <Text style={styles.balanceAmount}>{credits}</Text>
          <Text style={styles.balanceSubtext}>kredit</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kredit csomagok</Text>
          <Text style={styles.sectionSubtitle}>
            Válassz egy csomagot és növeld a krediteidet!
          </Text>
        </View>

        {CREDIT_PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[styles.packageCard, pkg.popular && styles.popularPackage]}
            onPress={() => handlePurchase(pkg.id)}
          >
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>NÉPSZERŰ</Text>
              </View>
            )}
            <View style={styles.packageLeft}>
              <View style={styles.packageIconContainer}>
                <Ionicons name="diamond" size={28} color="#FF3B75" />
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageCredits}>
                  {pkg.credits + pkg.bonus} kredit
                  {pkg.bonus > 0 && (
                    <Text style={styles.packageBonus}> +{pkg.bonus} bónusz</Text>
                  )}
                </Text>
                <Text style={styles.packagePrice}>{pkg.price} Ft</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kredit árak</Text>
        </View>

        <View style={styles.costsContainer}>
          <View style={styles.costItem}>
            <Ionicons name="gift" size={20} color="#FF3B75" />
            <Text style={styles.costText}>Ajándék küldés</Text>
            <Text style={styles.costAmount}>{CREDIT_COSTS.sendGift} kredit</Text>
          </View>
          <View style={styles.costItem}>
            <Ionicons name="eye" size={20} color="#FF3B75" />
            <Text style={styles.costText}>Profil megtekintés</Text>
            <Text style={styles.costAmount}>{CREDIT_COSTS.seeProfileView} kredit</Text>
          </View>
          <View style={styles.costItem}>
            <Ionicons name="star" size={20} color="#FF3B75" />
            <Text style={styles.costText}>Super Like</Text>
            <Text style={styles.costAmount}>{CREDIT_COSTS.superLike} kredit</Text>
          </View>
          <View style={styles.costItem}>
            <Ionicons name="rocket" size={20} color="#FF3B75" />
            <Text style={styles.costText}>Boost</Text>
            <Text style={styles.costAmount}>{CREDIT_COSTS.boost} kredit</Text>
          </View>
          <View style={styles.costItem}>
            <Ionicons name="heart" size={20} color="#FF3B75" />
            <Text style={styles.costText}>Kedvenc feloldás</Text>
            <Text style={styles.costAmount}>{CREDIT_COSTS.unlockFavorite} kredit</Text>
          </View>
          <View style={styles.costItem}>
            <Ionicons name="videocam" size={20} color="#FF3B75" />
            <Text style={styles.costText}>Videó hívás</Text>
            <Text style={styles.costAmount}>{CREDIT_COSTS.videoCall} kredit</Text>
          </View>
        </View>

        {history.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Történet</Text>
            </View>

            {history.slice(0, 10).map((entry, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={[
                  styles.historyIcon,
                  entry.type === 'add' ? styles.historyIconAdd : styles.historyIconDeduct,
                ]}>
                  <Ionicons
                    name={entry.type === 'add' ? 'add' : 'remove'}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyReason}>{getReasonText(entry.reason)}</Text>
                  <Text style={styles.historyDate}>{formatDate(entry.timestamp)}</Text>
                </View>
                <Text style={[
                  styles.historyAmount,
                  entry.type === 'add' ? styles.historyAmountAdd : styles.historyAmountDeduct,
                ]}>
                  {entry.type === 'add' ? '+' : '-'}{entry.amount}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF3B75',
    marginTop: 5,
  },
  balanceSubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  packageCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  popularPackage: {
    borderWidth: 2,
    borderColor: '#FF3B75',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 15,
    backgroundColor: '#FF3B75',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B7520',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  packageInfo: {
    flex: 1,
  },
  packageCredits: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  packageBonus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 16,
    color: '#666',
  },
  costsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  costText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 8,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIconAdd: {
    backgroundColor: '#4CAF5020',
  },
  historyIconDeduct: {
    backgroundColor: '#F4433620',
  },
  historyInfo: {
    flex: 1,
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyAmountAdd: {
    color: '#4CAF50',
  },
  historyAmountDeduct: {
    color: '#F44336',
  },
  bottomSpacer: {
    height: 30,
  },
});

export default CreditsScreen;

