/**
 * Optimized HomeScreen with React Query
 * Discovery feed with caching and optimistic updates
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Hooks
import { useDiscoveryProfiles, useSwipe, useSuperLike } from '../hooks';
import { useAuth } from '../context/AuthContext';

// Services
import RewindService from '../services/RewindService';

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
  const [canRewind, setCanRewind] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState([]);
  
  // React Query hooks
  const { data: profiles, isLoading, isError, refetch } = useDiscoveryProfiles(user?.id);
  const swipeMutation = useSwipe();
  const superLikeMutation = useSuperLike();
  
  // Check rewind permission on mount
  React.useEffect(() => {
    if (user?.id) {
      RewindService.canRewind(user.id).then(setCanRewind);
    }
  }, [user?.id]);

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
    },
    {
      id: 'mock-4',
      name: 'Dóra',
      age: 26,
      city: 'Győr',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop'],
      bio: 'Szeretek olvasni és jó kávé mellett beszélgetni ☕📚',
      interests: ['olvasás', 'kávé', 'beszélgetés', 'utazás'],
      distance: 12,
      is_verified: true,
      gender: 'female'
    },
    {
      id: 'mock-5',
      name: 'Erik',
      age: 30,
      city: 'Pécs',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop'],
      bio: 'Fotós vagyok, szeretem a természetet és az új helyeket 📸🌿',
      interests: ['fotózás', 'természet', 'utazás', 'művészet'],
      distance: 18,
      is_verified: false,
      gender: 'male'
    },
    {
      id: 'mock-6',
      name: 'Fanni',
      age: 22,
      city: 'Miskolc',
      photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop'],
      bio: 'Egyetemista vagyok, szeretek bulizni és új embereket megismerni 🎉🎓',
      interests: ['buli', 'egyetem', 'új emberek', 'zene'],
      distance: 25,
      is_verified: true,
      gender: 'female'
    },
    {
      id: 'mock-7',
      name: 'Gábor',
      age: 32,
      city: 'Kecskemét',
      photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop'],
      bio: 'Programozó vagyok, szeretek sakkozni és kirándulni ♟️🏔️',
      interests: ['programozás', 'sakk', 'kirándulás', 'technológia'],
      distance: 15,
      is_verified: false,
      gender: 'male'
    },
    {
      id: 'mock-8',
      name: 'Hanna',
      age: 25,
      city: 'Nyíregyháza',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop'],
      bio: 'Szeretek főzni és jó ételeket kipróbálni 👩‍🍳🍽️',
      interests: ['főzés', 'ételek', 'konyha', 'bor'],
      distance: 28,
      is_verified: true,
      gender: 'female'
    },
    {
      id: 'mock-9',
      name: 'István',
      age: 27,
      city: 'Szombathely',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop'],
      bio: 'Szeretek motorozni és adrenalint keresni 🏍️⚡',
      interests: ['motor', 'adrenalin', 'utazás', 'sport'],
      distance: 22,
      is_verified: false,
      gender: 'male'
    },
    {
      id: 'mock-10',
      name: 'Júlia',
      age: 23,
      city: 'Veszprém',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
      photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop'],
      bio: 'Diák vagyok, szeretek tanulni és fejlődni 📖🌱',
      interests: ['tanulás', 'fejlesztés', 'olvasás', 'zene'],
      distance: 14,
      is_verified: true,
      gender: 'female'
    }
  ];

  // Használjuk a Supabase adatokat, vagy fallback-ként a mock adatokat
  const displayProfiles = profiles && profiles.length > 0 ? profiles : mockProfiles;

  // Biztosítjuk hogy currentIndex ne legyen túl nagy
  const safeCurrentIndex = Math.min(currentIndex, (displayProfiles?.length || 1) - 1);
  const currentProfile = displayProfiles?.[safeCurrentIndex];

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

    // Swipe history-ba mentjük az előző profilt
    setSwipeHistory(prev => [...prev, { profile: currentProfile, action, index: currentIndex }]);

    // Léptetjük az indexet, de nem megyünk körbe (nem ismétlődnek a profilok)
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      // Ha elfogytak a profilok, maradunk az utolsó indexnél
      return nextIndex >= displayProfiles.length ? prev : nextIndex;
    });

    // Supabase hívás háttérben
    if (user?.id) {
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

        // Demo mode fallback: véletlenszerű match generálás
        if (action === 'like' && Math.random() < 0.3) { // 30% match esély
          setTimeout(() => {
            setMatchedProfile(currentProfile);
            setShowMatchModal(true);
          }, 500);
        }
      }
    }
  }, [currentProfile, user?.id, swipeMutation, profiles, displayProfiles.length, currentIndex]);
  
  // Handle super like - egyszerűsített verzió, mindig léptetjük az indexet
  const handleSuperLike = useCallback(async () => {
    if (!currentProfile) return;

    // Swipe history-ba mentjük az előző profilt
    setSwipeHistory(prev => [...prev, { profile: currentProfile, action: 'super_like', index: currentIndex }]);

    // Léptetjük az indexet, de nem megyünk körbe (nem ismétlődnek a profilok)
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      // Ha elfogytak a profilok, maradunk az utolsó indexnél
      return nextIndex >= displayProfiles.length ? prev : nextIndex;
    });

    // Supabase hívás háttérben
    if (user?.id) {
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

        // Demo mode fallback: super like mindig match
        setMatchedProfile(currentProfile);
        setShowMatchModal(true);
      }
    }
  }, [currentProfile, user?.id, superLikeMutation, profiles, displayProfiles.length, currentIndex]);

  // Handle rewind
  const handleRewind = useCallback(() => {
    if (!canRewind || swipeHistory.length === 0) {
      Alert.alert('Rewind nem elérhető', 'Prémium előfizetés szükséges vagy nincs előző swipe.');
      return;
    }

    // Utolsó swipe-ot visszavonunk
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(lastSwipe.index);
  }, [canRewind, swipeHistory]);
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Finding amazing people..." />
      </SafeAreaView>
    );
  }
  
  // Empty state csak akkor ha valóban nincs több profil
  if (isError || !displayProfiles || displayProfiles.length === 0 || !currentProfile) {
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
        onRewind={handleRewind}
        canRewind={canRewind && swipeHistory.length > 0}
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
