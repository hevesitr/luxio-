import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ProfileDetailScreen = ({ route, navigation }) => {
  const profile = route?.params?.profile;
  const onLike = route?.params?.onLike;
  const onSuperLike = route?.params?.onSuperLike;
  const onDislike = route?.params?.onDislike;
  const onUnmatch = route?.params?.onUnmatch;
  const hideActionButtons = route?.params?.hideActionButtons || false;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState(false);
  const flatListRef = useRef(null);

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' }}>Nincs profil adat</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Generate multiple photos for gallery (using same photo for demo, but in real app these would be different)
  const photos = profile.photos || [
    profile.photo,
    profile.photo,
    profile.photo,
    profile.photo,
  ];

  const DetailSection = ({ icon, title, value }) => (
    <View style={styles.detailSection}>
      <Ionicons name={icon} size={24} color="#FF3B75" />
      <View style={styles.detailContent}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation?.goBack) {
              navigation.goBack();
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            const options = [
              { text: 'Mégse', style: 'cancel' },
              { text: 'Jelentés', style: 'destructive', onPress: () => {
                Alert.alert('Jelentés', 'Profil jelentve. Köszönjük a visszajelzést!');
              }},
            ];

            // Add unmatch option if onUnmatch callback is available
            if (onUnmatch) {
              options.push({
                text: 'Match törlése',
                style: 'destructive',
                onPress: () => {
                  Alert.alert(
                    'Match törlése',
                    `Biztosan törölni szeretnéd a match-et ${profile.name}val?`,
                    [
                      { text: 'Mégse', style: 'cancel' },
                      {
                        text: 'Törlés',
                        style: 'destructive',
                        onPress: () => {
                          try {
                            if (onUnmatch && profile?.id) {
                              onUnmatch(profile.id);
                              Alert.alert('Match törölve', `${profile.name} eltávolítva a matchek közül.`);
                              // Close the profile screen after unmatch
                              setTimeout(() => {
                                if (navigation?.goBack) {
                                  navigation.goBack();
                                }
                              }, 500);
                            }
                          } catch (error) {
                            console.error('Error unmatching:', error);
                            Alert.alert('Hiba', 'Hiba történt a match törlése során.');
                          }
                        },
                      },
                    ]
                  );
                },
              });
            }

            options.push({
              text: 'Blokkolás',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Blokkolás', `${profile.name} blokkolva.`);
              },
            });

            Alert.alert(profile.name, 'Mit szeretnél csinálni?', options);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery with Swipe */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `photo-${index}`}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setFullScreenImage(true)}
              >
                <Image source={{ uri: item }} style={styles.profileImage} />
              </TouchableOpacity>
            )}
          />

          {/* Photo Indicators (Dots) */}
          <View style={styles.indicatorContainer}>
            {photos.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index, animated: true });
                  setCurrentImageIndex(index);
                }}
              >
                <View
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.indicatorActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tap Areas for Navigation */}
          <View style={styles.tapAreaContainer}>
            <TouchableOpacity
              style={styles.tapAreaLeft}
              onPress={() => {
                if (currentImageIndex > 0) {
                  flatListRef.current?.scrollToIndex({ index: currentImageIndex - 1, animated: true });
                  setCurrentImageIndex(currentImageIndex - 1);
                }
              }}
            />
            <TouchableOpacity
              style={styles.tapAreaRight}
              onPress={() => {
                if (currentImageIndex < photos.length - 1) {
                  flatListRef.current?.scrollToIndex({ index: currentImageIndex + 1, animated: true });
                  setCurrentImageIndex(currentImageIndex + 1);
                }
              }}
            />
          </View>

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
            pointerEvents="none"
          >
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.age}>{profile.age}</Text>
              {profile.isVerified && (
                <Ionicons name="checkmark-circle" size={28} color="#2196F3" />
              )}
            </View>
          </LinearGradient>
        </View>

        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Prompts */}
        {profile.prompts && profile.prompts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Személyiség</Text>
            {profile.prompts.map((prompt, index) => (
              <View key={index} style={styles.promptCard}>
                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                <Text style={styles.promptAnswer}>{prompt.answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alapinformációk</Text>
          
          {profile.height && (
            <DetailSection
              icon="resize-outline"
              title="Magasság"
              value={`${profile.height.value} ${profile.height.unit}`}
            />
          )}

          {profile.zodiacSign && (
            <DetailSection
              icon="planet-outline"
              title="Csillagjegy"
              value={profile.zodiacSign}
            />
          )}

          {profile.mbti && (
            <DetailSection
              icon="person-outline"
              title="Személyiségtípus"
              value={profile.mbti}
            />
          )}

          {profile.relationshipGoal && (
            <DetailSection
              icon="heart-outline"
              title="Kapcsolati cél"
              value={
                profile.relationshipGoal === 'serious' ? 'Komoly kapcsolat' :
                profile.relationshipGoal === 'casual' ? 'Laza randik' :
                'Barátság'
              }
            />
          )}
        </View>

        {/* Lifestyle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Életmód</Text>
          
          {profile.exercise && (
            <DetailSection
              icon="fitness-outline"
              title="Sportolás"
              value={profile.exercise}
            />
          )}

          {profile.smoking && (
            <DetailSection
              icon="ban-outline"
              title="Dohányzás"
              value={profile.smoking}
            />
          )}

          {profile.drinking && (
            <DetailSection
              icon="wine-outline"
              title="Ivás"
              value={profile.drinking}
            />
          )}
        </View>

        {/* Work & Education */}
        {(profile.work || profile.education) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Karrier & Tanulmányok</Text>
            
            {profile.work && (
              <DetailSection
                icon="briefcase-outline"
                title="Munka"
                value={`${profile.work.title} @ ${profile.work.company}`}
              />
            )}

            {profile.education && (
              <DetailSection
                icon="school-outline"
                title="Tanulmányok"
                value={`${profile.education.degree}, ${profile.education.school}`}
              />
            )}
          </View>
        )}

        {/* Family Plans */}
        {profile.children && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Családtervezés</Text>
            <DetailSection
              icon="people-outline"
              title="Gyerekek"
              value={profile.children.wants}
            />
          </View>
        )}

        {/* Beliefs */}
        {(profile.religion || profile.politics) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Értékek</Text>
            
            {profile.religion && (
              <DetailSection
                icon="moon-outline"
                title="Vallás"
                value={profile.religion}
              />
            )}

            {profile.politics && (
              <DetailSection
                icon="newspaper-outline"
                title="Politikai nézetek"
                value={profile.politics}
              />
            )}
          </View>
        )}

        {/* Music */}
        {profile.music && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎵 Zenei ízlés</Text>
            
            {profile.music.anthem && (
              <View style={styles.anthemCard}>
                <Ionicons name="musical-notes" size={40} color="#FF3B75" />
                <View style={styles.anthemInfo}>
                  <Text style={styles.anthemLabel}>Anthem</Text>
                  <Text style={styles.anthemTitle}>{profile.music.anthem.title}</Text>
                  <Text style={styles.anthemArtist}>{profile.music.anthem.artist}</Text>
                </View>
              </View>
            )}

            {profile.music.topArtists && profile.music.topArtists.length > 0 && (
              <View style={styles.musicSection}>
                <Text style={styles.musicLabel}>Kedvenc előadók</Text>
                <View style={styles.artistsList}>
                  {profile.music.topArtists.map((artist, index) => (
                    <View key={index} style={styles.artistTag}>
                      <Text style={styles.artistText}>{artist}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {profile.music.favoriteGenres && profile.music.favoriteGenres.length > 0 && (
              <View style={styles.musicSection}>
                <Text style={styles.musicLabel}>Kedvenc műfajok</Text>
                <View style={styles.genresList}>
                  {profile.music.favoriteGenres.map((genre, index) => (
                    <View key={index} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Érdeklődési körök</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {!hideActionButtons && (
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (onDislike) {
              onDislike(profile);
            }
            if (navigation?.goBack) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="close" size={32} color="#F44336" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Gifts navigation disabled when in modal
            Alert.alert('Ajándékok', 'Ez a funkció csak a navigációs menüből érhető el.');
          }}
        >
          <Ionicons name="gift" size={28} color="#FF3B75" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (onSuperLike) {
              onSuperLike(profile);
            } else {
              Alert.alert('Super Like', `Super Like küldve ${profile.name}nak! ⭐`);
            }
            if (navigation?.goBack) {
              setTimeout(() => navigation.goBack(), 500);
            }
          }}
        >
          <Ionicons name="star" size={28} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            if (onLike) {
              onLike(profile);
            } else {
              Alert.alert('Szív elküldve', `Szív elküldve ${profile.name}nak! ❤️`);
            }
            if (navigation?.goBack) {
              setTimeout(() => navigation.goBack(), 500);
            }
          }}
        >
          <Ionicons name="heart" size={32} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      )}

      {/* Full Screen Photo Viewer */}
      <Modal
        visible={fullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(false)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeFullScreen}
            onPress={() => setFullScreenImage(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentImageIndex}
            keyExtractor={(item, index) => `fullscreen-${index}`}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setFullScreenImage(false)}
                style={styles.fullScreenImageWrapper}
              >
                <Image
                  source={{ uri: item }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          />

          <View style={styles.fullScreenIndicatorContainer}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.fullScreenIndicator,
                  currentImageIndex === index && styles.fullScreenIndicatorActive,
                ]}
              />
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: height * 0.6,
    position: 'relative',
  },
  profileImage: {
    width: width,
    height: height * 0.6,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  indicator: {
    width: width / 4 - 16,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: '#fff',
  },
  tapAreaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  tapAreaLeft: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tapAreaRight: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  age: {
    fontSize: 32,
    color: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  bio: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  promptCard: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  promptQuestion: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  promptAnswer: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  detailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  detailContent: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  anthemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    marginBottom: 15,
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  anthemInfo: {
    flex: 1,
  },
  anthemLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 5,
  },
  anthemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },
  anthemArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  musicSection: {
    marginBottom: 15,
  },
  musicLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  artistsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  artistTag: {
    backgroundColor: '#FF3B75',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  artistText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  genreText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  interestText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 30,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullScreen: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageWrapper: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenIndicatorContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  fullScreenIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  fullScreenIndicatorActive: {
    backgroundColor: '#fff',
  },
});

export default ProfileDetailScreen;

