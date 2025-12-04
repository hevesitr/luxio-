import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import PremiumService from '../services/PremiumService';
import { profiles } from '../data/profiles';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const LikesYouScreen = ({ navigation }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [likesYou, setLikesYou] = useState([]);

  useEffect(() => {
    checkAccess();
    generateLikesYou();
  }, []);

  const checkAccess = async () => {
    const canSeeLikes = await PremiumService.hasFeature('likesYou');
    setHasAccess(canSeeLikes);
  };

  const generateLikesYou = () => {
    // Simulate users who liked you (in real app, this would come from backend)
    const randomProfiles = profiles
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    setLikesYou(randomProfiles);
  };

  const handleProfilePress = (profile) => {
    if (!hasAccess) {
      Alert.alert(
        '🔒 Prémium Funkció',
        'Frissíts Gold vagy Platinum előfizetésre hogy lásd ki lájkolt téged!',
        [
          { text: 'Mégsem', style: 'cancel' },
          { text: 'Prémium', onPress: () => navigation.navigate('Premium') },
        ]
      );
      return;
    }

    // Navigate to profile details or start swiping from this profile
    Alert.alert('💝 Match!', `${profile.name} lájkolt téged! Kezdd el a beszélgetést!`);
  };

  const renderLikeCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleProfilePress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.photo }} style={styles.cardImage} />
      
      {!hasAccess && (
        <BlurView intensity={80} style={styles.blurOverlay}>
          <Ionicons name="lock-closed" size={40} color="#fff" />
        </BlurView>
      )}
      
      {hasAccess && (
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardAge}>{item.age}</Text>
          </View>
        </LinearGradient>
      )}
      
      <View style={styles.likeIndicator}>
        <Ionicons name="heart" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ki Lájkolt Téged</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.countContainer}>
          <Text style={styles.countNumber}>{likesYou.length}</Text>
          <Text style={styles.countLabel}>személy lájkolt téged</Text>
        </View>

        {!hasAccess && (
          <View style={styles.upgradePrompt}>
            <LinearGradient
              colors={['#FF3B75', '#FF6B9D']}
              style={styles.upgradeGradient}
            >
              <Ionicons name="star" size={40} color="#fff" />
              <Text style={styles.upgradeTitle}>Frissíts Gold-ra</Text>
              <Text style={styles.upgradeSubtitle}>
                Lásd azonnal ki lájkolt téged és szerezz több matchet!
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => navigation.navigate('Premium')}
              >
                <Text style={styles.upgradeButtonText}>Prémium Megtekintése</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <FlatList
          data={likesYou}
          renderItem={renderLikeCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  },
  countContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  countLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 5,
  },
  upgradePrompt: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 25,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 10,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  upgradeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  upgradeButtonText: {
    color: '#FF3B75',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: 10,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardAge: {
    fontSize: 14,
    color: '#fff',
  },
  likeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF3B75',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LikesYouScreen;

