import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import EditProfileModal from '../components/EditProfileModal';
import ProfileCompletionService from '../services/ProfileCompletionService';
import ProfileService from '../services/ProfileService';
import Logger from '../services/Logger';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import SupabaseStorageService from '../services/SupabaseStorageService';
import { useNavigation } from '../hooks/useNavigation';

const calculateAge = (dateInput) => {
  if (!dateInput) {
    return null;
  }
  const birth = new Date(dateInput);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { profile, signOut } = useAuth();
  const navService = useNavigation();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [discoverySettings, setDiscoverySettings] = useState({
    // Megjelenítési beállítások
    showTopButtons: true,
    showStories: true,
    showTopIcons: true,
    showRightActions: true,
    showBackButton: true,
    showActionButtons: true,
    showBottomNav: true,

    // Premium funkciók
    boostEnabled: false,
    superLikeEnabled: true,
    rewindEnabled: false,
    spotlightEnabled: false,

    // Kommunikációs funkciók
    voiceNotesEnabled: false,
    typingIndicatorEnabled: true,
    readReceiptsEnabled: true,
    videoChatEnabled: false,

    // Intelligens egyeztetés
    compatibilityQuestionsEnabled: false,
    personalityTestEnabled: false,
    zodiacCompatibilityEnabled: false,
    aiMatchPredictionEnabled: false,

    // Média és tartalom
    storiesEnabled: true,
    liveStreamingEnabled: false,
    photoVerificationEnabled: false,
    videoProfilesEnabled: false,

    // Események és találkozók
    datePlanningEnabled: false,
    eventsEnabled: false,
    coffeeMeetsBagelEnabled: false,
    ghostModeEnabled: false,

    // Extra funkciók
    giftsEnabled: false,
    icebreakersEnabled: true,
    stickersEnabled: true,
    emergencyContactsEnabled: false,

    // Biztonság és adatvédelem
    reportBlockEnabled: true,
    locationSharingEnabled: false,
    ageVerificationEnabled: false,
    privacyControlsEnabled: true
  });

  // Betöltjük a felfedezés oldal beállításait
  useEffect(() => {
    const loadDiscoverySettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('discoverySettings');
        if (savedSettings) {
          setDiscoverySettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.warn('Failed to load discovery settings:', error);
      }
    };
    loadDiscoverySettings();
  }, []);

  // Felfedezés oldal beállításainak mentése
  const updateDiscoverySetting = async (key, value) => {
    const newSettings = { ...discoverySettings, [key]: value };
    setDiscoverySettings(newSettings);
    try {
      await AsyncStorage.setItem('discoverySettings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save discovery settings:', error);
    }
  };
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
    if (!profile) {
      console.log('No profile data available');
      return;
    }

    // Segédfüggvény az érvényes kép URL előállításához
    const getValidPhotoUrl = (url) => {
      if (!url) {
        console.log('Nincs megadva profilkép URL');
        return null;
      }
      
      // Ha már teljes URL, akkor azt használjuk
      if (url.startsWith('http')) {
        return url;
      }
      
      // Ha csak egy fájlnév van megadva, akkor összeállítjuk a teljes URL-t
      const projectId = 'xgvubkbfhleeagdvkhds';
      // Módosított útvonal: public/profiles mappa használata
      const finalUrl = `https://${projectId}.supabase.co/storage/v1/object/public/profiles/${url}`;
      
      console.log('Profilkép URL:', {
        eredeti: url,
        végleges: finalUrl,
        profilId: profile?.id
      });
      
      return finalUrl;
    };

    // Használjuk a profile_picture mezőt, ha az létezik, különben az avatar_url-t
    const profilePicture = profile.profile_picture || profile.avatar_url;
    
    setUserProfile(prev => ({
      ...prev,
      name: profile.full_name || prev.name,
      age: calculateAge(profile.birth_date) || prev.age,
      bio: profile.bio || prev.bio,
      photo: getValidPhotoUrl(profilePicture) || prev.photo,
      interests: (profile.interests && profile.interests.length > 0)
        ? profile.interests
        : prev.interests,
    }));
  }, [profile]);

  useEffect(() => {
    const percentage = ProfileCompletionService.calculateCompletion(userProfile);
    const message = ProfileCompletionService.getCompletionMessage(percentage);
    setCompletionPercentage(percentage);
    setCompletionMessage(message);
  }, [userProfile]);

  const handleSaveProfile = async (updatedProfile) => {
    try {
      // Optimista UI frissítés
      setUserProfile({
        ...userProfile,
        ...updatedProfile,
      });

      // Mentés Supabase-be
      if (profile?.id) {
        const result = await ProfileService.updateProfile(profile.id, {
          bio: updatedProfile.bio,
          age: updatedProfile.age,
          interests: updatedProfile.interests,
          job_title: updatedProfile.job,
          education: updatedProfile.education,
          relationship_goal: updatedProfile.relationshipGoal,
        });

        if (result.success) {
          Logger.success('Profile updated successfully');
          Alert.alert('✅ Siker', 'Profilod sikeresen frissítve!');
        } else {
          Logger.error('Profile update failed', result.error);
          Alert.alert('Hiba', 'Nem sikerült frissíteni a profilt. Próbáld újra később.');
        }
      } else {
        Logger.warn('No user ID available, profile only updated locally');
        Alert.alert('✅ Siker', 'Profilod helyileg frissítve!');
      }
    } catch (error) {
      Logger.error('Save profile error', error);
      Alert.alert('Hiba', 'Nem sikerült menteni a profilt.');
    }
  };

  // ✅ PERFORMANCE: useCallback for pickImage
  const pickImage = useCallback(async () => {
    // Kérj engedélyt
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Engedély szükséges', 'Kérlek engedélyezd a fotók eléréséhez!');
      return;
    }

    // Ellenőrizd, hogy be van-e jelentkezve
    if (!profile?.id) {
      Alert.alert('Hiba', 'Kérlek jelentkezz be először!');
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
      const localUri = result.assets[0].uri;
      
      // Maximum 6 fotó
      if (userProfile.photos.length >= 6) {
        Alert.alert('Maximum elérve', 'Maximum 6 fotót tölthetsz fel!');
        return;
      }

      // Feltöltés Supabase Storage-ba
      Alert.alert('Feltöltés...', 'Kérlek várj, amíg a fotó feltöltődik...');
      
      const uploadResult = await SupabaseStorageService.uploadPhoto(
        localUri,
        profile.id,
        userProfile.photos.length
      );

      if (uploadResult.success) {
        Logger.success('Photo uploaded successfully', { url: uploadResult.url });
        const newPhotoObj = { 
          url: uploadResult.url, 
          isPrivate: false,
          path: uploadResult.path 
        };
        
        // Optimista UI frissítés
        setUserProfile(prev => ({
          ...prev,
          photos: [...prev.photos, newPhotoObj],
        }));

        // Profil frissítése Supabase-ben
        try {
          const photoUrls = [...userProfile.photos.map(p => p.url), uploadResult.url];
          const result = await ProfileService.updateProfile(profile.id, {
            photos: photoUrls,
          });
          
          if (result.success) {
            Alert.alert('✅ Siker', 'Fotó sikeresen feltöltve!');
          } else {
            Logger.error('Profile photo update failed', result.error);
            Alert.alert('✅ Siker', 'Fotó feltöltve, de a profil frissítése sikertelen.');
          }
        } catch (error) {
          Logger.error('Profile update error', error);
          Alert.alert('✅ Siker', 'Fotó feltöltve!');
        }
      } else {
        Alert.alert('Hiba', `Feltöltés sikertelen: ${uploadResult.error}`);
      }
    }
  }, [profile?.id, userProfile.photos.length]);

  // ✅ PERFORMANCE: useCallback for removePhoto
  const removePhoto = useCallback(async (index) => {
    Alert.alert(
      'Fotó törlése',
      'Biztosan törölni szeretnéd ezt a fotót?',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: async () => {
            const photoToRemove = userProfile.photos[index];
            
            // Ha van path (Supabase Storage-ból van), töröld onnan is
            if (photoToRemove?.path && profile?.id) {
              const deleteResult = await SupabaseStorageService.deleteFile(
                SupabaseStorageService.BUCKETS.PHOTOS,
                photoToRemove.path
              );
              
              if (!deleteResult.success) {
                console.warn('Failed to delete from storage:', deleteResult.error);
                // Folytatjuk a törlést lokálisan is, ha a Storage törlés sikertelen volt
              }
            }
            
            const newPhotos = userProfile.photos.filter((_, i) => i !== index);
            setUserProfile({ ...userProfile, photos: newPhotos });
            Alert.alert('✅ Törölve', 'Fotó eltávolítva!');
          },
        },
      ]
    );
  }, [profile?.id, userProfile.photos]); // ✅ Add missing useCallback dependency array

  const mainOptions = [
    { icon: 'eye-off-outline', title: 'Ghost Mode', subtitle: 'Legyél láthatatlan mások számára', color: '#9C27B0', screen: 'GhostMode' },
    { icon: 'chatbubble-ellipses-outline', title: 'Chat Szobák', subtitle: 'Csatlakozz közösségi csevegésekhez', color: '#FF3B75', screen: 'ChatRooms' },
    { icon: 'musical-notes-outline', title: 'Spotify Zene', subtitle: 'Oszd meg a kedvenc zenéidet', color: '#1DB954', screen: 'Spotify' },
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
    { icon: 'help-circle-outline', title: 'Súgó', color: '#FF9800', screen: 'Help' },
    { icon: 'lock-closed-outline', title: 'Adatvédelem', color: '#607D8B', screen: 'PrivacySettings' },
    { icon: 'ban-outline', title: 'Blokkolt Felhasználók', color: '#F44336', screen: 'BlockedUsers' },
    { icon: 'pause-circle-outline', title: 'Fiók Szüneteltetése', color: '#FF9800', screen: 'PauseAccount' },
  ];

  const styles = createStyles(theme);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Image
          source={{ uri: userProfile.photo }}
          style={styles.mainPhoto}
          contentFit="cover"
          transition={200}
          // ✅ PERFORMANCE: Image optimalizálás
          priority="high" // Fő profil kép - magas prioritás
          placeholder="Loading..." // Text placeholder
          placeholderContentFit="cover"
          cachePolicy="memory-disk" // Cache stratégia
          recyclingKey={`profile-main-${userProfile.id}`} // Recycling optimalizálás
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
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
            // Egyedi key generálása a kép URL alapján, hogy újrarenderelődjön változáskor
            const photoKey = photo || `photo-${index}`;
            return (
              <View key={`${photoKey}-${index}`} style={styles.photoContainer}>
                {photo ? (
                  <Image
                    source={{ uri: photo }}
                    style={styles.photo}
                    contentFit="cover"
                    transition={200}
                    // ✅ PERFORMANCE: Gallery képek optimalizálása
                    priority="normal" // Gallery képek - normál prioritás
                    placeholder="Loading..."
                    placeholderContentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={`profile-gallery-${photoKey}-${index}`}
                    // Error handling without console logs (performance)
                    onError={() => {/* Silent error handling */}}
                  />
                ) : (
                  <View style={[styles.photo, { backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={40} color={theme.colors.textSecondary} />
                  </View>
                )}
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

      {/* Új fejlett funkciók */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Premium Funkciók</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Boost - Kiemelés a keresésben (Hinge/Tinder)</Text>
            <Switch
              value={discoverySettings.boostEnabled}
              onValueChange={(value) => updateDiscoverySetting('boostEnabled', value)}
              trackColor={{ false: '#767577', true: '#FFD700' }}
              thumbColor={discoverySettings.boostEnabled ? '#FFD700' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Super Like - Kiemelt figyelem (Tinder)</Text>
            <Switch
              value={discoverySettings.superLikeEnabled}
              onValueChange={(value) => updateDiscoverySetting('superLikeEnabled', value)}
              trackColor={{ false: '#767577', true: '#FF69B4' }}
              thumbColor={discoverySettings.superLikeEnabled ? '#FF69B4' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Rewind - Utolsó akció visszavonása (Tinder)</Text>
            <Switch
              value={discoverySettings.rewindEnabled}
              onValueChange={(value) => updateDiscoverySetting('rewindEnabled', value)}
              trackColor={{ false: '#767577', true: '#00D4FF' }}
              thumbColor={discoverySettings.rewindEnabled ? '#00D4FF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Spotlight - Fényképek gyűjteménye (Bumble)</Text>
            <Switch
              value={discoverySettings.spotlightEnabled}
              onValueChange={(value) => updateDiscoverySetting('spotlightEnabled', value)}
              trackColor={{ false: '#767577', true: '#FF6B9D' }}
              thumbColor={discoverySettings.spotlightEnabled ? '#FF6B9D' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💬 Kommunikációs Funkciók</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Voice Notes - Hangüzenetek (Bumble)</Text>
            <Switch
              value={discoverySettings.voiceNotesEnabled}
              onValueChange={(value) => updateDiscoverySetting('voiceNotesEnabled', value)}
              trackColor={{ false: '#767577', true: '#9B59B6' }}
              thumbColor={discoverySettings.voiceNotesEnabled ? '#9B59B6' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Typing Indicator - Gépelés jelzése (WhatsApp)</Text>
            <Switch
              value={discoverySettings.typingIndicatorEnabled}
              onValueChange={(value) => updateDiscoverySetting('typingIndicatorEnabled', value)}
              trackColor={{ false: '#767577', true: '#25D366' }}
              thumbColor={discoverySettings.typingIndicatorEnabled ? '#25D366' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Read Receipts - Olvasási visszaigazolás (WhatsApp)</Text>
            <Switch
              value={discoverySettings.readReceiptsEnabled}
              onValueChange={(value) => updateDiscoverySetting('readReceiptsEnabled', value)}
              trackColor={{ false: '#767577', true: '#25D366' }}
              thumbColor={discoverySettings.readReceiptsEnabled ? '#25D366' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Video Chat - Videó hívás (Zoom/FaceTime)</Text>
            <Switch
              value={discoverySettings.videoChatEnabled}
              onValueChange={(value) => updateDiscoverySetting('videoChatEnabled', value)}
              trackColor={{ false: '#767577', true: '#E74C3C' }}
              thumbColor={discoverySettings.videoChatEnabled ? '#E74C3C' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Intelligens Egyeztetés</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Kompatibilitási Kérdések (OkCupid/eHarmony)</Text>
            <Switch
              value={discoverySettings.compatibilityQuestionsEnabled}
              onValueChange={(value) => updateDiscoverySetting('compatibilityQuestionsEnabled', value)}
              trackColor={{ false: '#767577', true: '#8E44AD' }}
              thumbColor={discoverySettings.compatibilityQuestionsEnabled ? '#8E44AD' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Personality Test - Személyiség teszt (16Personalities)</Text>
            <Switch
              value={discoverySettings.personalityTestEnabled}
              onValueChange={(value) => updateDiscoverySetting('personalityTestEnabled', value)}
              trackColor={{ false: '#767577', true: '#F39C12' }}
              thumbColor={discoverySettings.personalityTestEnabled ? '#F39C12' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Zodiákus Kompatibilitás (Co-Star)</Text>
            <Switch
              value={discoverySettings.zodiacCompatibilityEnabled}
              onValueChange={(value) => updateDiscoverySetting('zodiacCompatibilityEnabled', value)}
              trackColor={{ false: '#767577', true: '#9B59B6' }}
              thumbColor={discoverySettings.zodiacCompatibilityEnabled ? '#9B59B6' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>AI Match Prediction - MI egyezés előrejelzés</Text>
            <Switch
              value={discoverySettings.aiMatchPredictionEnabled}
              onValueChange={(value) => updateDiscoverySetting('aiMatchPredictionEnabled', value)}
              trackColor={{ false: '#767577', true: '#00D4FF' }}
              thumbColor={discoverySettings.aiMatchPredictionEnabled ? '#00D4FF' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 Média & Tartalom</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Stories - Pillanatképek (Instagram/Snapchat)</Text>
            <Switch
              value={discoverySettings.storiesEnabled}
              onValueChange={(value) => updateDiscoverySetting('storiesEnabled', value)}
              trackColor={{ false: '#767577', true: '#E91E63' }}
              thumbColor={discoverySettings.storiesEnabled ? '#E91E63' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Live Streaming - Élő közvetítés (TikTok/Instagram)</Text>
            <Switch
              value={discoverySettings.liveStreamingEnabled}
              onValueChange={(value) => updateDiscoverySetting('liveStreamingEnabled', value)}
              trackColor={{ false: '#767577', true: '#FF0000' }}
              thumbColor={discoverySettings.liveStreamingEnabled ? '#FF0000' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Photo Verification - Kép ellenőrzés (Tinder)</Text>
            <Switch
              value={discoverySettings.photoVerificationEnabled}
              onValueChange={(value) => updateDiscoverySetting('photoVerificationEnabled', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={discoverySettings.photoVerificationEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Video Profiles - Videó profilok (Bumble)</Text>
            <Switch
              value={discoverySettings.videoProfilesEnabled}
              onValueChange={(value) => updateDiscoverySetting('videoProfilesEnabled', value)}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={discoverySettings.videoProfilesEnabled ? '#2196F3' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Események & Találkozók</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Date Planning - Randi tervezés (Hinge)</Text>
            <Switch
              value={discoverySettings.datePlanningEnabled}
              onValueChange={(value) => updateDiscoverySetting('datePlanningEnabled', value)}
              trackColor={{ false: '#767577', true: '#FF9800' }}
              thumbColor={discoverySettings.datePlanningEnabled ? '#FF9800' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Events - Események és meetup-ok (Meetup)</Text>
            <Switch
              value={discoverySettings.eventsEnabled}
              onValueChange={(value) => updateDiscoverySetting('eventsEnabled', value)}
              trackColor={{ false: '#767577', true: '#FF5722' }}
              thumbColor={discoverySettings.eventsEnabled ? '#FF5722' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Coffee Meets Bagel - Napi párosítások</Text>
            <Switch
              value={discoverySettings.coffeeMeetsBagelEnabled}
              onValueChange={(value) => updateDiscoverySetting('coffeeMeetsBagelEnabled', value)}
              trackColor={{ false: '#767577', true: '#795548' }}
              thumbColor={discoverySettings.coffeeMeetsBagelEnabled ? '#795548' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Ghost Mode - Rejtett mód (Snapchat)</Text>
            <Switch
              value={discoverySettings.ghostModeEnabled}
              onValueChange={(value) => updateDiscoverySetting('ghostModeEnabled', value)}
              trackColor={{ false: '#767577', true: '#607D8B' }}
              thumbColor={discoverySettings.ghostModeEnabled ? '#607D8B' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 Extra Funkciók</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Gifts - Ajándék küldés (Tinder Gold)</Text>
            <Switch
              value={discoverySettings.giftsEnabled}
              onValueChange={(value) => updateDiscoverySetting('giftsEnabled', value)}
              trackColor={{ false: '#767577', true: '#E91E63' }}
              thumbColor={discoverySettings.giftsEnabled ? '#E91E63' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Icebreakers - Jégtörő kérdések (Hinge)</Text>
            <Switch
              value={discoverySettings.icebreakersEnabled}
              onValueChange={(value) => updateDiscoverySetting('icebreakersEnabled', value)}
              trackColor={{ false: '#767577', true: '#00BCD4' }}
              thumbColor={discoverySettings.icebreakersEnabled ? '#00BCD4' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Stickers & Reactions - Matricák és reakciók</Text>
            <Switch
              value={discoverySettings.stickersEnabled}
              onValueChange={(value) => updateDiscoverySetting('stickersEnabled', value)}
              trackColor={{ false: '#767577', true: '#FFC107' }}
              thumbColor={discoverySettings.stickersEnabled ? '#FFC107' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Emergency Contacts - Vészhelyzeti kapcsolatok</Text>
            <Switch
              value={discoverySettings.emergencyContactsEnabled}
              onValueChange={(value) => updateDiscoverySetting('emergencyContactsEnabled', value)}
              trackColor={{ false: '#767577', true: '#F44336' }}
              thumbColor={discoverySettings.emergencyContactsEnabled ? '#F44336' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Biztonság & Adatvédelem</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Report & Block - Jelentés és blokkolás</Text>
            <Switch
              value={discoverySettings.reportBlockEnabled}
              onValueChange={(value) => updateDiscoverySetting('reportBlockEnabled', value)}
              trackColor={{ false: '#767577', true: '#FF5722' }}
              thumbColor={discoverySettings.reportBlockEnabled ? '#FF5722' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Location Sharing - Helyzetmegosztás</Text>
            <Switch
              value={discoverySettings.locationSharingEnabled}
              onValueChange={(value) => updateDiscoverySetting('locationSharingEnabled', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={discoverySettings.locationSharingEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Age Verification - Kor ellenőrzés</Text>
            <Switch
              value={discoverySettings.ageVerificationEnabled}
              onValueChange={(value) => updateDiscoverySetting('ageVerificationEnabled', value)}
              trackColor={{ false: '#767577', true: '#2196F3' }}
              thumbColor={discoverySettings.ageVerificationEnabled ? '#2196F3' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Privacy Controls - Adatvédelmi beállítások</Text>
            <Switch
              value={discoverySettings.privacyControlsEnabled}
              onValueChange={(value) => updateDiscoverySetting('privacyControlsEnabled', value)}
              trackColor={{ false: '#767577', true: '#9C27B0' }}
              thumbColor={discoverySettings.privacyControlsEnabled ? '#9C27B0' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Felfedezés oldal megjelenítése</Text>
        <View style={styles.discoverySettingsContainer}>
          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Felső gombok (szűrők, térkép)</Text>
            <Switch
              value={discoverySettings.showTopButtons}
              onValueChange={(value) => updateDiscoverySetting('showTopButtons', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={discoverySettings.showTopButtons ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Stories</Text>
            <Switch
              value={discoverySettings.showStories}
              onValueChange={(value) => updateDiscoverySetting('showStories', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={discoverySettings.showStories ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Felső ikonsor (7 ikon)</Text>
            <Switch
              value={discoverySettings.showTopIcons}
              onValueChange={(value) => updateDiscoverySetting('showTopIcons', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={discoverySettings.showTopIcons ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Jobb oldali akciók</Text>
            <Switch
              value={discoverySettings.showRightActions}
              onValueChange={(value) => updateDiscoverySetting('showRightActions', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={discoverySettings.showRightActions ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Vissza gomb</Text>
            <Switch
              value={discoverySettings.showBackButton}
              onValueChange={(value) => updateDiscoverySetting('showBackButton', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={discoverySettings.showBackButton ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Alsó akció gombok (pass/like)</Text>
            <Switch
              value={discoverySettings.showActionButtons}
              onValueChange={(value) => updateDiscoverySetting('showActionButtons', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={discoverySettings.showActionButtons ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.discoverySettingItem}>
            <Text style={styles.discoverySettingText}>Alsó navigációs sáv</Text>
            <Switch
              value={discoverySettings.showBottomNav}
              onValueChange={(value) => updateDiscoverySetting('showBottomNav', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={discoverySettings.showBottomNav ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beállítások</Text>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={() => {
              console.log('Settings button pressed:', option.title, option.screen);
              if (option.screen) {
                try {
                  navigation.navigate(option.screen);
                } catch (error) {
                  console.error('Navigation error:', error);
                  Alert.alert('Hiba', `Nem sikerült megnyitni: ${option.title}`);
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
                onPress: async () => {
                  try {
                    await signOut();
                    Alert.alert('Kijelentkezés', 'Sikeresen kijelentkeztél!');
                  } catch (error) {
                    console.error('Logout error:', error);
                    Alert.alert('Hiba', 'Nem sikerült kijelentkezni.');
                  }
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
  discoverySettingsContainer: {
    marginTop: 10,
  },
  discoverySettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  discoverySettingText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
    marginRight: 15,
  },
});

export default ProfileScreen;

