import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import EditProfileModal from '../components/EditProfileModal';
import ProfileCompletionService from '../services/ProfileCompletionService';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Te',
    age: 25,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    bio: 'Szeretem az életet, az utazást és a jó társaságot! 🌟',
    interests: ['Utazás', 'Fotózás', 'Sport', 'Zene', 'Olvasás', 'Főzés'],
    photos: [
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', isPrivate: false },
      { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop', isPrivate: true },
      { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', isPrivate: false },
    ],
    height: null,
    work: null,
    education: null,
    zodiacSign: 'Oroszlán',
    mbti: 'ENFP',
    relationshipGoal: 'serious',
  });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completionMessage, setCompletionMessage] = useState(null);

  useEffect(() => {
    const percentage = ProfileCompletionService.calculateCompletion(userProfile);
    const message = ProfileCompletionService.getCompletionMessage(percentage);
    setCompletionPercentage(percentage);
    setCompletionMessage(message);
  }, [userProfile]);

  const handleSaveProfile = (updatedProfile) => {
    setUserProfile({
      ...userProfile,
      ...updatedProfile,
    });
    Alert.alert('✅ Siker', 'Profilod sikeresen frissítve!');
  };

  const pickImage = async () => {
    // Kérj engedélyt
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Engedély szükséges', 'Kérlek engedélyezd a fotók eléréséhez!');
      return;
    }

    // Válassz képet
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const newPhoto = result.assets[0].uri;
      
      // Maximum 6 fotó
      if (userProfile.photos.length >= 6) {
        Alert.alert('Maximum elérve', 'Maximum 6 fotót tölthetsz fel!');
        return;
      }

      const newPhotoObj = { url: newPhoto, isPrivate: false };
      setUserProfile({
        ...userProfile,
        photos: [...userProfile.photos, newPhotoObj],
      });
      Alert.alert('✅ Siker', 'Fotó hozzáadva!');
    }
  };

  const removePhoto = (index) => {
    Alert.alert(
      'Fotó törlése',
      'Biztosan törölni szeretnéd ezt a fotót?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: () => {
            const newPhotos = userProfile.photos.filter((_, i) => i !== index);
            setUserProfile({ ...userProfile, photos: newPhotos });
            Alert.alert('✅ Törölve', 'Fotó eltávolítva!');
          },
        },
      ]
    );
  };

  const mainOptions = [
    { icon: 'rocket-outline', title: 'Boost', subtitle: 'Profil kiemelés 30 percre', color: '#FF3B75', screen: 'Boost' },
    { icon: 'heart-outline', title: 'Ki lájkolt téged', subtitle: 'Lásd azonnal', color: '#E91E63', screen: 'LikesYou' },
    { icon: 'diamond-outline', title: 'Top Picks', subtitle: 'AI napi ajánlások', color: '#9C27B0', screen: 'TopPicks' },
    { icon: 'earth-outline', title: 'Passport', subtitle: 'Swipelj bárhol', color: '#2196F3', screen: 'Passport' },
    { icon: 'star-outline', title: 'Prémium', subtitle: 'Frissíts most', color: '#FFD700', screen: 'Premium' },
    { icon: 'sparkles-outline', title: 'AI Javaslatok', subtitle: 'Jellemzés alapján találatok', color: '#FF6B9D', screen: 'AIRecommendations' },
    { icon: 'map-outline', title: 'Térkép', subtitle: 'GPS helyzet és közelben', color: '#4CAF50', screen: 'Map' },
    { icon: 'chatbubbles-outline', title: 'Profil Kérdések', subtitle: 'Válaszolj kérdésekre', color: '#9C27B0', screen: 'ProfilePrompts' },
    { icon: 'analytics-outline', title: 'Személyiség Teszt', subtitle: 'Fedezd fel magad', color: '#FF9800', screen: 'PersonalityTest' },
  ];

  const premiumOptions = [
    { icon: 'gift-outline', title: 'Ajándékok', subtitle: 'Küldj ajándékot', color: '#FF3B75', screen: 'Gifts' },
    { icon: 'diamond-outline', title: 'Kreditek', subtitle: 'Egyenleg és vásárlás', color: '#FFD700', screen: 'Credits' },
    { icon: 'eye-outline', title: 'Profil Megtekintések', subtitle: 'Ki nézte meg', color: '#2196F3', screen: 'ProfileViews' },
    { icon: 'heart-outline', title: 'Kedvencek', subtitle: 'Kedvenc profilok', color: '#E91E63', screen: 'Favorites' },
    { icon: 'people-outline', title: 'Hasonló Emberek', subtitle: 'AI alapú keresés', color: '#9C27B0', screen: 'Lookalikes' },
    { icon: 'videocam-outline', title: 'Videó Hívás', subtitle: 'Videó chat', color: '#4CAF50', screen: 'VideoChat' },
  ];

  const sugarOptions = [
    { icon: 'cash-outline', title: 'Sugar Daddy', subtitle: 'Gazdag partnerek keresése', color: '#FFD700', screen: 'SugarDaddy' },
    { icon: 'sparkles-outline', title: 'Sugar Baby', subtitle: 'Fiatal partnerek keresése', color: '#FF6B9D', screen: 'SugarBaby' },
  ];

  const communityOptions = [
    { icon: 'calendar-outline', title: 'Események', subtitle: 'Társkereső események és tréningek', color: '#FF3B75', screen: 'Events' },
  ];

  const settingsOptions = [
    { icon: 'share-social-outline', title: 'Social Media', color: '#E91E63', screen: 'SocialMedia' },
    { icon: 'settings-outline', title: 'Beállítások', color: '#FF3B75', screen: 'Settings' },
    { icon: 'stats-chart-outline', title: 'Statisztikák', color: '#9C27B0', screen: 'Analytics' },
    { icon: 'trophy-outline', title: 'Gamifikáció', color: '#FFC107', screen: 'Gamification' },
    { icon: 'checkmark-circle-outline', title: 'Profil Verifikáció', color: '#2196F3', screen: 'Verification' },
    { icon: 'shield-checkmark-outline', title: 'Biztonság', color: '#4CAF50', screen: 'Safety' },
    { icon: 'help-circle-outline', title: 'Súgó', color: '#FF9800', screen: null },
  ];

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}>
        <Image source={{ uri: userProfile.photo }} style={styles.mainPhoto} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.headerInfo}>
            <Text style={styles.name}>
              {userProfile.name}, {userProfile.age}
            </Text>
            
            {/* Profil kitöltési százalék */}
            <View style={styles.completionContainer}>
              <View style={styles.completionBar}>
                <View 
                  style={[
                    styles.completionFill, 
                    { width: `${completionPercentage}%`, backgroundColor: completionMessage?.color }
                  ]} 
                />
              </View>
              <Text style={[styles.completionText, { color: completionMessage?.color }]}>
                {completionPercentage}% - {completionMessage?.text}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Profil szerkesztése</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rólam</Text>
        <Text style={styles.bio}>{userProfile.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Érdeklődési körök</Text>
        <View style={styles.interestsContainer}>
          {userProfile.interests.map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fotóim ({userProfile.photos.length}/6)</Text>
          <TouchableOpacity onPress={pickImage}>
            <Ionicons name="add-circle" size={24} color="#FF3B75" />
          </TouchableOpacity>
        </View>
        <View style={styles.photosGrid}>
          {userProfile.photos.map((photoObj, index) => {
            const photo = typeof photoObj === 'string' ? photoObj : photoObj.url;
            const isPrivate = typeof photoObj === 'object' ? photoObj.isPrivate : false;
            return (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                {isPrivate && (
                  <View style={styles.privateBadge}>
                    <Ionicons name="lock-closed" size={14} color={theme.colors.text} />
                    <Text style={styles.privateText}>Privát</Text>
                  </View>
                )}
                <View style={styles.photoActions}>
                  <TouchableOpacity 
                    style={[styles.photoActionButton, isPrivate && styles.photoActionButtonActive]}
                    onPress={() => {
                      const newPhotos = [...userProfile.photos];
                      if (typeof newPhotos[index] === 'object') {
                        newPhotos[index].isPrivate = !newPhotos[index].isPrivate;
                      } else {
                        newPhotos[index] = { url: newPhotos[index], isPrivate: !isPrivate };
                      }
                      setUserProfile({ ...userProfile, photos: newPhotos });
                    }}
                  >
                    <Ionicons 
                      name={isPrivate ? "lock-closed" : "lock-open"} 
                      size={16} 
                      color={isPrivate ? theme.colors.warning : theme.colors.text} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deletePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {userProfile.photos.length < 6 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="add" size={40} color="rgba(255, 255, 255, 0.3)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Közösség</Text>
        {communityOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.settingItem}
            onPress={() => {
              if (option.screen) {
                navigation.navigate(option.screen);
              } else {
                Alert.alert(option.title, 'Ez a funkció hamarosan elérhető lesz!');
              }
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View>
                <Text style={styles.settingTitle}>{option.title}</Text>
                {option.subtitle && (
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                )}
              </View>
            </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sugar Dating</Text>
        {sugarOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.settingItem}
            onPress={() => {
              if (option.screen) {
                navigation.navigate(option.screen);
              } else {
                Alert.alert(option.title, 'Ez a funkció hamarosan elérhető lesz!');
              }
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View>
                <Text style={styles.settingTitle}>{option.title}</Text>
                {option.subtitle && (
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                )}
              </View>
            </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fő Funkciók</Text>
        {mainOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.settingItem}
            onPress={() => {
              if (option.screen) {
                navigation.navigate(option.screen);
              } else {
                Alert.alert(option.title, 'Ez a funkció hamarosan elérhető lesz!');
              }
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View>
                <Text style={styles.settingTitle}>{option.title}</Text>
                {option.subtitle && (
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                )}
              </View>
            </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prémium Funkciók</Text>
        {premiumOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.settingItem}
            onPress={() => {
              if (option.screen) {
                if (option.screen === 'Gifts') {
                  navigation.navigate(option.screen, { profile: null });
                } else if (option.screen === 'Lookalikes') {
                  navigation.navigate(option.screen, { 
                    onMatch: (profile) => {
                      Alert.alert('Match!', `Matcheltél ${profile.name}val!`);
                    }
                  });
                } else {
                  navigation.navigate(option.screen);
                }
              } else {
                Alert.alert(option.title, 'Ez a funkció hamarosan elérhető lesz!');
              }
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View>
                <Text style={styles.settingTitle}>{option.title}</Text>
                {option.subtitle && (
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                )}
              </View>
            </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Közösség</Text>
        {communityOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.settingItem}
            onPress={() => {
              if (option.screen) {
                navigation.navigate(option.screen);
              } else {
                Alert.alert(option.title, 'Ez a funkció hamarosan elérhető lesz!');
              }
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View>
                <Text style={styles.settingTitle}>{option.title}</Text>
                {option.subtitle && (
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                )}
              </View>
            </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beállítások</Text>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.settingItem}
            onPress={() => {
              if (option.screen) {
                navigation.navigate(option.screen);
              } else {
                Alert.alert(option.title, 'Ez a funkció hamarosan elérhető lesz!');
              }
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <Text style={styles.settingTitle}>{option.title}</Text>
            </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => {
          Alert.alert(
            'Kijelentkezés',
            'Biztosan ki szeretnél jelentkezni?',
            [
              { text: 'Mégse', style: 'cancel' },
              {
                text: 'Kijelentkezés',
                style: 'destructive',
                onPress: () => {
                  Alert.alert('Kijelentkezés', 'Sikeresen kijelentkeztél!');
                  // Itt lehetne valódi logout logika
                },
              },
            ]
          );
        }}
      >
        <Ionicons name="log-out-outline" size={20} color="#F44336" />
        <Text style={styles.logoutText}>Kijelentkezés</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Luxio v1.0.0</Text>
      </View>

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        userProfile={userProfile}
        onSave={handleSaveProfile}
      />
    </ScrollView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 400,
    position: 'relative',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  headerInfo: {
    gap: 15,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
  },
  editButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  bio: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  interestText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  privateBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  privateText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
  photoActions: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    gap: 5,
  },
  photoActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  photoActionButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  deletePhotoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  completionContainer: {
    marginVertical: 10,
    width: '100%',
  },
  completionBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  addPhotoButton: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingTitle: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 10,
    padding: 15,
    gap: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 67, 54, 0.4)',
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});

export default ProfileScreen;

