import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SugarDaddyScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Összes', icon: 'grid-outline' },
    { id: 'verified', label: 'Verifikált', icon: 'checkmark-circle' },
    { id: 'online', label: 'Online', icon: 'radio-button-on' },
    { id: 'premium', label: 'Prémium', icon: 'diamond' },
  ];

  // Mock sugar daddy profiles
  const sugarDaddies = [
    {
      id: 1,
      name: 'Márton',
      age: 45,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
      income: 'Magas',
      verified: true,
      online: true,
      premium: true,
      location: 'Budapest',
      lookingFor: 'Fiatal nőt keresek',
    },
    {
      id: 2,
      name: 'Péter',
      age: 52,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop',
      income: 'Nagyon magas',
      verified: true,
      online: false,
      premium: true,
      location: 'Debrecen',
      lookingFor: 'Komoly kapcsolatot',
    },
    {
      id: 3,
      name: 'László',
      age: 38,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop',
      income: 'Magas',
      verified: false,
      online: true,
      premium: false,
      location: 'Szeged',
      lookingFor: 'Laza kapcsolatot',
    },
  ];

  const filteredProfiles = sugarDaddies.filter(profile => {
    if (selectedCategory === 'verified') return profile.verified;
    if (selectedCategory === 'online') return profile.online;
    if (selectedCategory === 'premium') return profile.premium;
    return true;
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#0a0a0a']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sugar Daddy</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Ionicons name="diamond" size={32} color="#FFD700" />
            <Text style={styles.infoTitle}>Prémium Társkeresés</Text>
            <Text style={styles.infoText}>
              Találj gazdag partnereket, akik készek támogatni téged anyagilag.
            </Text>
          </View>

          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={selectedCategory === category.id ? '#FF3B75' : '#fff'}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.profilesContainer}>
            {filteredProfiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={styles.profileCard}
                onPress={() => {
                  Alert.alert(
                    'Prémium Funkció',
                    'A profil megtekintéséhez prémium tagság szükséges.',
                    [
                      { text: 'Mégse', style: 'cancel' },
                      {
                        text: 'Prémium',
                        onPress: () => navigation.navigate('Premium'),
                      },
                    ]
                  );
                }}
              >
                <View style={styles.profileImageContainer}>
                  <Image source={{ uri: profile.photo }} style={styles.profileImage} />
                  {profile.online && (
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                    </View>
                  )}
                  {profile.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                  {profile.premium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="diamond" size={14} color="#FFD700" />
                    </View>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {profile.name}, {profile.age}
                  </Text>
                  <View style={styles.profileDetails}>
                    <Ionicons name="cash" size={14} color="#FFD700" />
                    <Text style={styles.profileDetailText}>{profile.income}</Text>
                  </View>
                  <View style={styles.profileDetails}>
                    <Ionicons name="location" size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.profileDetailText}>{profile.location}</Text>
                  </View>
                  <Text style={styles.profileLookingFor} numberOfLines={2}>
                    {profile.lookingFor}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footerInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.footerText}>
              Minden profil ellenőrzött és biztonságos
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 59, 117, 0.2)',
    borderColor: '#FF3B75',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FF3B75',
  },
  profilesContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  profileDetailText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  profileLookingFor: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    fontStyle: 'italic',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default SugarDaddyScreen;

