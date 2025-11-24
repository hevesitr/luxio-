import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AIRecommendationService from '../services/AIRecommendationService';
import { currentUser } from '../data/userProfile';

const AIRecommendationsScreen = ({ navigation, route }) => {
  const onMatch = route?.params?.onMatch; // Match callback
  const [description, setDescription] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (!description.trim()) {
      Alert.alert('Hiányzó leírás', 'Kérlek írj be egy jellemzést a leendő párodról!');
      return;
    }

    setIsLoading(true);
    
    // Szimulált késleltetés (valós AI esetén API hívás lenne)
    setTimeout(() => {
      const results = AIRecommendationService.getRecommendations(description, currentUser);
      setRecommendations(results);
      setIsLoading(false);
      
      if (results.length === 0) {
        Alert.alert('Nincs találat', 'Nem találtunk egyező profilt a leírásod alapján. Próbáld újra más kulcsszavakkal!');
      }
    }, 800);
  };

  const handleProfilePress = (profile) => {
    navigation.navigate('ProfileDetail', { profile });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Javaslatok</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <Text style={styles.label}>Írd le, milyen párt keresel:</Text>
          <TextInput
            style={styles.input}
            placeholder="Pl: Fiatal, sportos, komoly kapcsolatot kereső nő, aki szereti a zenét és utazást..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#FF3B75', '#FF6B9D']}
              style={styles.searchButtonGradient}
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>
                {isLoading ? 'Keresés...' : 'Találatok keresése'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {recommendations.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {recommendations.length} találat
            </Text>
            {recommendations.map((item, index) => (
              <TouchableOpacity
                key={item.profile.id}
                style={styles.recommendationCard}
                onPress={() => handleProfilePress(item.profile)}
              >
                <Image
                  source={{ uri: item.profile.photo }}
                  style={styles.profileImage}
                />
                <View style={styles.profileInfo}>
                  <View style={styles.profileHeader}>
                    <Text style={styles.profileName}>
                      {item.profile.name}, {item.profile.age}
                    </Text>
                    {item.profile.isVerified && (
                      <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
                    )}
                  </View>
                  <View style={styles.scoreContainer}>
                    <LinearGradient
                      colors={['#FF3B75', '#FF6B9D']}
                      style={styles.scoreBadge}
                    >
                      <Text style={styles.scoreText}>{item.score}%</Text>
                    </LinearGradient>
                  </View>
                  {item.reasons && item.reasons.length > 0 && (
                    <View style={styles.reasonsContainer}>
                      {item.reasons.map((reason, idx) => (
                        <View key={idx} style={styles.reasonTag}>
                          <Text style={styles.reasonText}>{reason}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {item.profile.bio && (
                    <Text style={styles.bio} numberOfLines={2}>
                      {item.profile.bio}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  searchButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF3B75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultsSection: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scoreContainer: {
    marginBottom: 8,
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  reasonTag: {
    backgroundColor: 'rgba(255, 59, 117, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 117, 0.5)',
  },
  reasonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
});

export default AIRecommendationsScreen;

