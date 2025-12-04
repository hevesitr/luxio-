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
  
  const currentProfile = profiles?.[currentIndex];
  
  // Handle swipe
  const handleSwipe = useCallback(async (action) => {
    if (!currentProfile) return;
    
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
      
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to process swipe');
    }
  }, [currentProfile, user?.id, swipeMutation]);
  
  // Handle super like
  const handleSuperLike = useCallback(async () => {
    if (!currentProfile) return;
    
    try {
      const result = await superLikeMutation.mutateAsync({
        userId: user.id,
        targetUserId: currentProfile.id,
      });
      
      if (result.matched) {
        setMatchedProfile(currentProfile);
        setShowMatchModal(true);
      }
      
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to send super like');
    }
  }, [currentProfile, user?.id, superLikeMutation]);
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Finding amazing people..." />
      </SafeAreaView>
    );
  }
  
  if (isError || !profiles || profiles.length === 0 || currentIndex >= profiles.length) {
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
            <ProfileCard profile={currentProfile} isActive={true} />
          </View>
        )}
      </View>
      
      <SwipeButtons
        onPass={() => handleSwipe('pass')}
        onLike={() => handleSwipe('like')}
        onSuperLike={handleSuperLike}
        disabled={swipeMutation.isLoading || superLikeMutation.isLoading}
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
