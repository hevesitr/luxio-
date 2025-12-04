import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SocialMediaScreen = ({ navigation }) => {
  const [connections, setConnections] = useState({
    instagram: { connected: true, username: '@anna_photos', followers: 2453, showInProfile: true },
    tiktok: { connected: false, username: '', followers: 0, showInProfile: false },
    facebook: { connected: false, username: '', followers: 0, showInProfile: false },
    spotify: { connected: true, username: 'Anna', topArtists: ['The Weeknd', 'Dua Lipa'], showInProfile: true },
    twitter: { connected: false, username: '', followers: 0, showInProfile: false },
    youtube: { connected: false, username: '', followers: 0, showInProfile: false },
    snapchat: { connected: false, username: '', followers: 0, showInProfile: false },
    linkedin: { connected: false, username: '', followers: 0, showInProfile: false },
  });

  const socialPlatforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#E4405F',
      gradient: ['#405DE6', '#5851DB', '#833AB4', '#C13584', '#E1306C', '#FD1D1D'],
      description: 'Mutasd meg a fotóidat',
      benefits: ['Több fotó', 'Követők láthatóak', 'Stories megosztása'],
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: 'musical-notes',
      color: '#000000',
      gradient: ['#00f2ea', '#ff0050'],
      description: 'Oszd meg a videóidat',
      benefits: ['Népszerű videók', 'Kreativitás mutatása', 'Trend követés'],
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877F2',
      gradient: ['#1877F2', '#0C63D4'],
      description: 'Barátok és események',
      benefits: ['Közös barátok', 'Események', 'Csoportok'],
    },
    {
      id: 'spotify',
      name: 'Spotify',
      icon: 'musical-note',
      color: '#1DB954',
      gradient: ['#1DB954', '#1ED760'],
      description: 'Zenei ízlés mutatása',
      benefits: ['Top előadók', 'Anthem', 'Közös zenei ízlés'],
    },
    {
      id: 'twitter',
      name: 'Twitter / X',
      icon: 'logo-twitter',
      color: '#1DA1F2',
      gradient: ['#1DA1F2', '#0C85D0'],
      description: 'Gondolataid megosztása',
      benefits: ['Tweetek', 'Érdeklődési körök', 'Követők'],
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'logo-youtube',
      color: '#FF0000',
      gradient: ['#FF0000', '#CC0000'],
      description: 'Videó tartalmak',
      benefits: ['Videók', 'Előfizetők', 'Tartalom típus'],
    },
    {
      id: 'snapchat',
      name: 'Snapchat',
      icon: 'logo-snapchat',
      color: '#FFFC00',
      gradient: ['#FFFC00', '#FFF200'],
      description: 'Snappek és Bitmoji',
      benefits: ['Bitmoji', 'Snap Score', 'Stories'],
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      color: '#0A66C2',
      gradient: ['#0A66C2', '#004182'],
      description: 'Szakmai háttér',
      benefits: ['Munkahely', 'Végzettség', 'Skills'],
    },
  ];

  const handleConnect = (platformId) => {
    const platform = socialPlatforms.find(p => p.id === platformId);
    
    if (connections[platformId].connected) {
      // Disconnect
      Alert.alert(
        `${platform.name} lekapcsolása`,
        `Biztosan lekapcsolod a ${platform.name} fiókodat?`,
        [
          { text: 'Mégse', style: 'cancel' },
          {
            text: 'Lekapcsolás',
            style: 'destructive',
            onPress: () => {
              setConnections({
                ...connections,
                [platformId]: {
                  connected: false,
                  username: '',
                  followers: 0,
                  showInProfile: false,
                },
              });
              Alert.alert('Sikeres!', `${platform.name} lekapcsolva.`);
            },
          },
        ]
      );
    } else {
      // Connect (mock connection)
      Alert.alert(
        `${platform.name} összekapcsolása`,
        'Ez megnyitná a hivatalos bejelentkezési oldalt.',
        [
          { text: 'Mégse', style: 'cancel' },
          {
            text: 'Összekapcsolás',
            onPress: () => {
              // Mock successful connection
              setConnections({
                ...connections,
                [platformId]: {
                  connected: true,
                  username: `@user_${platformId}`,
                  followers: Math.floor(Math.random() * 10000),
                  showInProfile: true,
                },
              });
              Alert.alert('Sikeres!', `${platform.name} sikeresen összekapcsolva!`);
            },
          },
        ]
      );
    }
  };

  const toggleShowInProfile = (platformId) => {
    setConnections({
      ...connections,
      [platformId]: {
        ...connections[platformId],
        showInProfile: !connections[platformId].showInProfile,
      },
    });
  };

  const renderPlatformCard = (platform) => {
    const connection = connections[platform.id];
    const isConnected = connection.connected;

    return (
      <View key={platform.id} style={styles.platformCard}>
        <View style={styles.platformHeader}>
          <View style={[styles.iconContainer, { backgroundColor: platform.color }]}>
            <Ionicons name={platform.icon} size={28} color="#fff" />
          </View>
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>{platform.name}</Text>
            <Text style={styles.platformDescription}>
              {isConnected ? connection.username : platform.description}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.connectButton,
              isConnected && styles.connectedButton,
            ]}
            onPress={() => handleConnect(platform.id)}
          >
            <Text style={[
              styles.connectButtonText,
              isConnected && styles.connectedButtonText,
            ]}>
              {isConnected ? 'Kapcsolva' : 'Összekapcsolás'}
            </Text>
          </TouchableOpacity>
        </View>

        {isConnected && (
          <>
            <View style={styles.connectionDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Felhasználónév:</Text>
                <Text style={styles.detailValue}>{connection.username}</Text>
              </View>
              {connection.followers > 0 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Követők:</Text>
                  <Text style={styles.detailValue}>{connection.followers.toLocaleString()}</Text>
                </View>
              )}
            </View>

            <View style={styles.visibilityToggle}>
              <View style={styles.visibilityInfo}>
                <Ionicons name="eye" size={20} color="#666" />
                <Text style={styles.visibilityText}>
                  Megjelenjen a profilodban
                </Text>
              </View>
              <Switch
                value={connection.showInProfile}
                onValueChange={() => toggleShowInProfile(platform.id)}
                trackColor={{ false: '#E0E0E0', true: '#FF3B75' }}
                thumbColor={connection.showInProfile ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Előnyök:</Text>
              {platform.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {!isConnected && (
          <View style={styles.notConnectedBenefits}>
            <Text style={styles.whyConnectTitle}>Miért érdemes összekapcsolni?</Text>
            {platform.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#999" />
                <Text style={styles.benefitTextGray}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const connectedCount = Object.values(connections).filter(c => c.connected).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social Media</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Ionicons name="link" size={32} color="#FF3B75" />
          <Text style={styles.summaryTitle}>Összekapcsolt fiókok</Text>
          <Text style={styles.summaryCount}>{connectedCount} / {socialPlatforms.length}</Text>
          <Text style={styles.summaryDescription}>
            Kapcsolj össze több social media fiókot, hogy gazdagabb profilt mutass!
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Biztonságos és privát</Text>
            <Text style={styles.infoText}>
              Csak azt a tartalmat osztjuk meg, amit te engedélyezel. Bármikor lekapcsolhatod.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Platformok</Text>

        {socialPlatforms.map(renderPlatformCard)}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  summaryCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF3B75',
    marginTop: 10,
  },
  summaryDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 15,
    marginBottom: 15,
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
    color: '#2E7D32',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#558B2F',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 15,
    marginBottom: 15,
    marginTop: 5,
  },
  platformCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformInfo: {
    flex: 1,
    marginLeft: 12,
  },
  platformName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  platformDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF3B75',
  },
  connectedButton: {
    backgroundColor: '#E8F5E9',
  },
  connectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  connectedButtonText: {
    color: '#4CAF50',
  },
  connectionDetails: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  visibilityToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visibilityText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  benefitsContainer: {
    marginTop: 5,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#4CAF50',
  },
  notConnectedBenefits: {
    marginTop: 10,
  },
  whyConnectTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  benefitTextGray: {
    fontSize: 13,
    color: '#999',
  },
  bottomSpacer: {
    height: 30,
  },
});

export default SocialMediaScreen;


