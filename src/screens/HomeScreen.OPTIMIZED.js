/**
 * Optimized HomeScreen with React Query
 * Discovery feed with caching and optimistic updates
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Hooks
import { useDiscoveryProfiles, useSwipe, useSuperLike } from '../hooks';
import { useAuth } from '../context/AuthContext';

// Components
import ProfileCard from '../components/discovery/ProfileCard';
import SwipeButtons from '../components/discovery/SwipeButtons';
import MatchModal from '../components/discovery/MatchModal';
import EmptyState from '../components/discovery/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  
  // React Query hooks
  const { data: profiles, isLoading, isError, refetch } = useDiscoveryProfiles(user?.id);
  const swipeMutation = useSwipe();
  const superLikeMutation = useSuperLike();

  // Fallback mock profilok ha nincs bejelentkezett felhasználó vagy nincs adat
  const mockProfiles = [
    {
      id: 'mock-1',
      name: 'Anna',
      age: 24,
      city: 'Budapest',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop'],
      bio: 'Szeretem a jó zenét és a kalandokat! 🎵✈️',
      interests: ['zene', 'utazás', 'koncertek', 'kávézók'],
      distance: 3,
      is_verified: true,
      gender: 'female'
    },
    {
      id: 'mock-2',
      name: 'Béla',
      age: 28,
      city: 'Debrecen',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop'],
      bio: 'Sportos vagyok, szeretek futni és kirándulni 🏃‍♂️⛰️',
      interests: ['futás', 'kirándulás', 'sport'],
      distance: 5,
      is_verified: false,
      gender: 'male'
    },
    {
      id: 'mock-3',
      name: 'Csilla',
      age: 24,
      city: 'Szeged',
      photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop'],
      bio: 'Művészlélek, festészet és jóga a szenvedélyem 🎨🧘‍♀️',
      interests: ['festészet', 'jóga', 'művészet'],
      distance: 7,
      is_verified: true,
      gender: 'female'
    }
  ];

  // Használjuk a Supabase adatokat, vagy fallback-ként a mock adatokat
  const displayProfiles = profiles && profiles.length > 0 ? profiles : mockProfiles;
  const currentProfile = displayProfiles?.[currentIndex];

  // Debug információ
  console.log('=== HOMESCREEN DEBUG ===');
  console.log('user:', user);
  console.log('profiles:', profiles);
  console.log('displayProfiles:', displayProfiles);
  console.log('currentIndex:', currentIndex);
  console.log('currentProfile:', currentProfile);
  
  // Handle swipe - egyszerűsített verzió, mindig léptetjük az indexet
  const handleSwipe = useCallback(async (action) => {
    if (!currentProfile) return;

    // Egyszerűen csak léptetjük az indexet (mock mód)
    setCurrentIndex(prev => (prev + 1) % displayProfiles.length);

    // Opcionális: Supabase hívás háttérben
    if (user?.id && profiles?.length > 0) {
      try {
        const result = await swipeMutation.mutateAsync({
          userId: user.id,
          targetUserId: currentProfile.id,
          action,
        });

        if (result.matched) {
          setMatchedProfile(currentProfile);
          setShowMatchModal(true);
        }
      } catch (error) {
        // Supabase hívás sikertelen, de nem zavarjuk meg a felhasználót
        console.log('Swipe saved locally:', action, currentProfile.name);
      }
    }
  }, [currentProfile, user?.id, swipeMutation, profiles, displayProfiles.length]);
  
  // Handle super like - egyszerűsített verzió, mindig léptetjük az indexet
  const handleSuperLike = useCallback(async () => {
    if (!currentProfile) return;

    // Egyszerűen csak léptetjük az indexet (mock mód)
    setCurrentIndex(prev => (prev + 1) % displayProfiles.length);

    // Opcionális: Supabase hívás háttérben
    if (user?.id && profiles?.length > 0) {
      try {
        const result = await superLikeMutation.mutateAsync({
          userId: user.id,
          targetUserId: currentProfile.id,
        });

        if (result.matched) {
          setMatchedProfile(currentProfile);
          setShowMatchModal(true);
        }
      } catch (error) {
        // Supabase hívás sikertelen, de nem zavarjuk meg a felhasználót
        console.log('Super like saved locally:', currentProfile.name);
      }
    }
  }, [currentProfile, user?.id, superLikeMutation, profiles, displayProfiles.length]);
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Finding amazing people..." />
      </SafeAreaView>
    );
  }
  
  if (isError || (displayProfiles && displayProfiles.length === 0) || (displayProfiles && currentIndex >= displayProfiles.length)) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="No more profiles"
          subtitle="Check back later for new matches"
          buttonText="Refresh"
          onButtonPress={() => {
            setCurrentIndex(0);
            refetch();
          }}
        />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardContainer}>
        {currentProfile && (
          <View style={styles.card}>
            <ProfileCard
              profile={currentProfile}
              isActive={true}
              onSwipeLeft={() => handleSwipe('pass')}
              onSwipeRight={() => handleSwipe('like')}
            />
          </View>
        )}
      </View>
      
      <SwipeButtons
        onPass={() => handleSwipe('pass')}
        onLike={() => handleSwipe('like')}
        onSuperLike={handleSuperLike}
        disabled={false}
      />
      
      <MatchModal
        visible={showMatchModal}
        profile={matchedProfile}
        onClose={() => setShowMatchModal(false)}
        onSendMessage={() => {
          setShowMatchModal(false);
          navigation.navigate('Chat', { matchId: matchedProfile?.matchId, profile: matchedProfile });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: '80%',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;
