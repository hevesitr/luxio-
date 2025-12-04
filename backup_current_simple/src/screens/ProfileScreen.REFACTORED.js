/**
 * ProfileScreen - REFACTORED VERSION
 * 
 * This is a refactored version using modular components.
 * Test this version before replacing the original ProfileScreen.js
 * 
 * Changes:
 * - Split into 6 modular components
 * - Cleaner code structure
 * - Better maintainability
 * - Same functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import EditProfileModal from '../components/EditProfileModal';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileBio from '../components/profile/ProfileBio';
import ProfileInterests from '../components/profile/ProfileInterests';
import ProfileDetails from '../components/profile/ProfileDetails';
import ProfilePhotos from '../components/profile/ProfilePhotos';
import ProfileActions from '../components/profile/ProfileActions';
import ProfileCompletionService from '../services/ProfileCompletionService';
import ProfileService from '../services/ProfileService';
import SupabaseStorageService from '../services/SupabaseStorageService';
import Logger from '../services/Logger';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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

  // Load profile from Auth context
  useEffect(() => {
    if (!profile) {
      return;
    }

    setUserProfile(prev => ({
      ...prev,
      name: profile.full_name || prev.name,
      age: calculateAge(profile.birth_date) || prev.age,
      bio: profile.bio || prev.bio,
      photo: profile.avatar_url || prev.photo,
      interests:
        (profile.interests && profile.interests.length > 0
          ? profile.interests
          : prev.interests),
    }));
  }, [profile]);

  // Calculate profile completion
  useEffect(() => {
    const percentage = ProfileCompletionService.calculateCompletion(userProfile);
    const message = ProfileCompletionService.getCompletionMessage(percentage);
    setCompletionPercentage(percentage);
    setCompletionMessage(message);
  }, [userProfile]);

  // Save profile handler
  const handleSaveProfile = async (updatedProfile) => {
    try {
      // Optimistic UI update
      setUserProfile({
        ...userProfile,
        ...updatedProfile,
      });

      // Save to Supabase
      if (profile?.id) {
        const result = await ProfileService.updateProfile(profile.id, {
          full_name: updatedProfile.name,
          bio: updatedProfile.bio,
          interests: updatedProfile.interests,
          birth_date: updatedProfile.birthDate,
          gender: updatedProfile.gender,
          location: updatedProfile.location,
        });

        if (result.success) {
          Logger.success('Profile updated successfully');
          Alert.alert('Siker', 'Profil sikeresen frissítve!');
        } else {
          throw new Error(result.error?.message || 'Update failed');
        }
      }

      setEditModalVisible(false);
    } catch (error) {
      Logger.error('Profile update failed', error);
      Alert.alert('Hiba', 'Nem sikerült frissíteni a profilt');
      
      // Revert optimistic update
      if (profile) {
        setUserProfile(prev => ({
          ...prev,
          name: profile.full_name || prev.name,
          bio: profile.bio || prev.bio,
        }));
      }
    }
  };

  // Photo press handler
  const handlePhotoPress = async () => {
    Alert.alert(
      'Profilkép módosítása',
      'Válassz egy opciót',
      [
        {
          text: 'Fotó készítése',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Galéria',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Mégsem',
          style: 'cancel',
        },
      ]
    );
  };

  // Image picker
  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Engedély szükséges', 'Kamera hozzáférés szükséges');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Engedély szükséges', 'Galéria hozzáférés szükséges');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Logger.error('Image picker error', error);
      Alert.alert('Hiba', 'Nem sikerült kiválasztani a képet');
    }
  };

  // Upload profile photo
  const uploadProfilePhoto = async (uri) => {
    try {
      if (!profile?.id) {
        Alert.alert('Hiba', 'Nincs bejelentkezve');
        return;
      }

      // Upload to Supabase Storage
      const uploadResult = await SupabaseStorageService.uploadProfilePhoto(
        profile.id,
        uri
      );

      if (uploadResult.success) {
        // Update profile with new photo URL
        const updateResult = await ProfileService.updateProfile(profile.id, {
          avatar_url: uploadResult.data.url,
        });

        if (updateResult.success) {
          setUserProfile(prev => ({
            ...prev,
            photo: uploadResult.data.url,
          }));
          Alert.alert('Siker', 'Profilkép sikeresen frissítve!');
        }
      } else {
        throw new Error(uploadResult.error?.message || 'Upload failed');
      }
    } catch (error) {
      Logger.error('Photo upload error', error);
      Alert.alert('Hiba', 'Nem sikerült feltölteni a képet');
    }
  };

  // Photo item press handler
  const handlePhotoItemPress = (photo, index) => {
    Alert.alert(
      'Fotó',
      'Mit szeretnél csinálni?',
      [
        {
          text: 'Megtekintés',
          onPress: () => {
            // TODO: Open photo viewer
            console.log('View photo:', photo);
          },
        },
        {
          text: photo.isPrivate ? 'Nyilvánossá tétel' : 'Priváttá tétel',
          onPress: () => {
            const updatedPhotos = [...userProfile.photos];
            updatedPhotos[index] = {
              ...photo,
              isPrivate: !photo.isPrivate,
            };
            setUserProfile(prev => ({
              ...prev,
              photos: updatedPhotos,
            }));
          },
        },
        {
          text: 'Törlés',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Törlés megerősítése',
              'Biztosan törölni szeretnéd ezt a fotót?',
              [
                { text: 'Mégsem', style: 'cancel' },
                {
                  text: 'Törlés',
                  style: 'destructive',
                  onPress: () => {
                    const updatedPhotos = userProfile.photos.filter((_, i) => i !== index);
                    setUserProfile(prev => ({
                      ...prev,
                      photos: updatedPhotos,
                    }));
                  },
                },
              ]
            );
          },
        },
        {
          text: 'Mégsem',
          style: 'cancel',
        },
      ]
    );
  };

  // Add photo handler
  const handleAddPhoto = () => {
    pickImage('library');
  };

  // Settings press handler
  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  // Logout handler
  const handleLogoutPress = () => {
    Alert.alert(
      'Kijelentkezés',
      'Biztosan ki szeretnél jelentkezni?',
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Kijelentkezés',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation handled by AuthContext
            } catch (error) {
              Logger.error('Logout error', error);
              Alert.alert('Hiba', 'Nem sikerült kijelentkezni');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with photo and completion */}
        <ProfileHeader
          userProfile={userProfile}
          completionPercentage={completionPercentage}
          completionMessage={completionMessage}
          onEditPress={() => setEditModalVisible(true)}
          onPhotoPress={handlePhotoPress}
          theme={theme}
        />

        {/* Bio section */}
        <ProfileBio
          bio={userProfile.bio}
          theme={theme}
        />

        {/* Interests section */}
        <ProfileInterests
          interests={userProfile.interests}
          theme={theme}
        />

        {/* Details section */}
        <ProfileDetails
          userProfile={userProfile}
          theme={theme}
        />

        {/* Photos section */}
        <ProfilePhotos
          photos={userProfile.photos}
          onPhotoPress={handlePhotoItemPress}
          onAddPhoto={handleAddPhoto}
          theme={theme}
        />

        {/* Actions section */}
        <ProfileActions
          onSettingsPress={handleSettingsPress}
          onLogoutPress={handleLogoutPress}
          theme={theme}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
        currentProfile={userProfile}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});

export default ProfileScreen;
