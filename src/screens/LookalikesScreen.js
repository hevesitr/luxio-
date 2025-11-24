import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { profiles } from '../data/profiles';
import { currentUser } from '../data/userProfile';
import SwipeCard from '../components/SwipeCard';

const LookalikesScreen = ({ navigation, route }) => {
  const { onMatch } = route.params || { onMatch: () => {} };
  const [lookalikes, setLookalikes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    generateLookalikes();
  }, []);

  const generateLookalikes = () => {
    // Szűrjük a profilokat hasonlóság alapján
    // Jelenleg egyszerűen véletlenszerűen választunk, de valóságban AI alapú hasonlóság számítás lenne
    const shuffled = [...profiles].sort(() => Math.random() - 0.5);
    setLookalikes(shuffled.slice(0, 10));
  };

  const handleSwipeLeft = (profile) => {
    if (currentIndex < lookalikes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSwipeRight = (profile) => {
    if (onMatch) {
      onMatch(profile);
    }
    if (currentIndex < lookalikes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentProfile = lookalikes[currentIndex];
  const nextProfile = lookalikes[currentIndex + 1];

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hasonló Emberek</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Nincs több hasonló profil</Text>
          <Text style={styles.emptySubtext}>
            Próbáld ki a Top Picks funkciót új ajánlásokért!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hasonló Emberek</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="sparkles" size={24} color="#FF3B75" />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>AI alapú hasonlóság</Text>
          <Text style={styles.infoText}>
            Ezek az emberek hasonlítanak rád külsőre vagy személyiségre!
          </Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {nextProfile && (
          <View style={styles.nextCardWrapper}>
            <SwipeCard
              profile={nextProfile}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isFirst={false}
              userProfile={currentUser}
            />
          </View>
        )}
        <SwipeCard
          profile={currentProfile}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isFirst={true}
          userProfile={currentUser}
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleUndo}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="arrow-undo"
            size={28}
            color={currentIndex === 0 ? '#ccc' : '#FF3B75'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.nopeButton]}
          onPress={() => handleSwipeLeft(currentProfile)}
        >
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipeRight(currentProfile)}
        >
          <Ionicons name="heart" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {lookalikes.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / lookalikes.length) * 100}%` },
            ]}
          />
        </View>
      </View>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F5',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B75',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#C2185B',
    lineHeight: 18,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  nextCardWrapper: {
    position: 'absolute',
    width: '90%',
    height: '70%',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 20,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  nopeButton: {
    backgroundColor: '#FF6B6B',
  },
  likeButton: {
    backgroundColor: '#4ECDC4',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B75',
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LookalikesScreen;

