/**
 * Optimized MatchesScreen with React Query
 * Shows matches and conversations with real-time updates
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Hooks
import {
  useMatches,
  useUnmatch,
} from '../hooks';
import { useAuth } from '../context/AuthContext';

// Components
import MatchCard from '../components/matches/MatchCard';
import ConversationCard from '../components/matches/ConversationCard';
import EmptyState from '../components/discovery/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Services
import Logger from '../services/Logger';

const MatchesScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' or 'messages'
  
  // React Query hooks
  const {
    data: matches,
    isLoading: matchesLoading,
    isError: matchesError,
    refetch: refetchMatches,
    isFetching: matchesFetching,
  } = useMatches(user?.id);
  
  // Use matches for both tabs for now
  const conversations = matches;
  
  const unmatchMutation = useUnmatch();
  
  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);
  
  // Handle match press
  const handleMatchPress = useCallback((match) => {
    navigation.navigate('Chat', {
      matchId: match.id,
      profile: match.profile,
    });
  }, [navigation]);
  
  // Handle unmatch
  const handleUnmatch = useCallback(async (matchId) => {
    try {
      await unmatchMutation.mutateAsync({
        userId: user.id,
        matchId,
      });
    } catch (error) {
      Logger.error('Unmatch failed', error);
    }
  }, [user?.id, unmatchMutation]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetchMatches();
  }, [refetchMatches]);
  
  // Render match item
  const renderMatch = useCallback(({ item: match }) => {
    return (
      <MatchCard
        match={match}
        onPress={() => handleMatchPress(match)}
        onUnmatch={() => handleUnmatch(match.id)}
      />
    );
  }, [handleMatchPress, handleUnmatch]);
  
  // Render conversation item
  const renderConversation = useCallback(({ item: conversation }) => {
    return (
      <ConversationCard
        conversation={conversation}
        onPress={() => handleMatchPress(conversation)}
        onUnmatch={() => handleUnmatch(conversation.id)}
      />
    );
  }, [handleMatchPress, handleUnmatch]);
  
  // Loading state
  if (matchesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading your matches..." />
      </SafeAreaView>
    );
  }
  
  // Error state
  if (matchesError) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Oops! Something went wrong"
          subtitle="We couldn't load your matches"
          buttonText="Try Again"
          onButtonPress={handleRefresh}
        />
      </SafeAreaView>
    );
  }
  
  const isLoading = matchesFetching;
  const data = activeTab === 'matches' ? matches : conversations;
  const isEmpty = !data || data.length === 0;
  
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
          
          {isLoading && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
        </View>
        
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'matches' && styles.tabActive
            ]}
            onPress={() => handleTabChange('matches')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'matches' && styles.tabTextActive
            ]}>
              New Matches
            </Text>
            {matches && matches.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{matches.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'messages' && styles.tabActive
            ]}
            onPress={() => handleTabChange('messages')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'messages' && styles.tabTextActive
            ]}>
              Messages
            </Text>
            {conversations && conversations.filter(c => c.unread_count > 0).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {conversations.filter(c => c.unread_count > 0).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        {isEmpty ? (
          <EmptyState
            icon={activeTab === 'matches' ? 'heart-outline' : 'chatbubble-outline'}
            title={activeTab === 'matches' ? 'No matches yet' : 'No conversations yet'}
            subtitle={
              activeTab === 'matches'
                ? 'Start swiping to find your perfect match!'
                : 'Send a message to your matches to start chatting'
            }
            buttonText={activeTab === 'matches' ? 'Start Swiping' : 'View Matches'}
            onButtonPress={() => {
              if (activeTab === 'matches') {
                navigation.navigate('Home');
              } else {
                setActiveTab('matches');
              }
            }}
          />
        ) : (
          <FlatList
            data={data}
            renderItem={activeTab === 'matches' ? renderMatch : renderConversation}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor="#007AFF"
              />
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
          />
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    paddingVertical: 8,
  },
});

export default MatchesScreen;
