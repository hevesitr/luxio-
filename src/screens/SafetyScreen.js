import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SafetyService from '../services/SafetyService';
import { useAuth } from '../context/AuthContext';

const SafetyScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Get reported user from navigation params (if coming from profile/chat)
  const reportedUserId = route?.params?.userId;
  const reportedUserName = route?.params?.userName;

  const safetyTips = [
    {
      icon: '🛡️',
      title: 'Ne ossz meg személyes adatokat',
      description: 'Ne add meg a teljes neved, címed, munkahelyed vagy pénzügyi információid idegeneknek.',
      color: '#F44336',
    },
    {
      icon: '👥',
      title: 'Első találkozó nyilvános helyen',
      description: 'Az első néhány találkozó mindig nyilvános, forgalmas helyen legyen. Kávézó, étterem vagy park ideális.',
      color: '#FF9800',
    },
    {
      icon: '📱',
      title: 'Értesíts valakit',
      description: 'Mondd el egy barátnak vagy családtagnak, hova mész, kivel találkozol és mikor térsz haza.',
      color: '#FFC107',
    },
    {
      icon: '🚫',
      title: 'Bízz a megérzéseidben',
      description: 'Ha valami nem érzi jól magát, menj el. A biztonságod a legfontosabb.',
      color: '#FF3B75',
    },
    {
      icon: '🚗',
      title: 'Saját közlekedés',
      description: 'Az első találkozókra saját közlekedéssel menj, ne fogadj el fuvart ismeretlentől.',
      color: '#9C27B0',
    },
    {
      icon: '🍷',
      title: 'Figyelj az italaidra',
      description: 'Ne hagyd felügyelet nélkül az italodat és ismerd a határaidat az alkohollal.',
      color: '#673AB7',
    },
    {
      icon: '📞',
      title: 'Telefonos beszélgetés előbb',
      description: 'Találkozó előtt beszélj telefonon is a személlyel, hogy érezd a vibe-ot.',
      color: '#3F51B5',
    },
    {
      icon: '⏰',
      title: 'Safety Check-in',
      description: 'Használd az app safety check-in funkcióját, hogy barátaid tudjanak rólad.',
      color: '#2196F3',
    },
  ];

  const emergencyContacts = [
    { name: 'Rendőrség', number: '112', icon: '🚨', color: '#F44336' },
    { name: 'Mentők', number: '104', icon: '🚑', color: '#FF9800' },
    { name: 'Áldozatsegítő', number: '06-80-225-225', icon: '💚', color: '#4CAF50' },
  ];

  const reportReasons = [
    'Káromkodás vagy zaklatás',
    'Hamis vagy átverős profil',
    'Nem megfelelő tartalom',
    'Spam vagy reklám',
    'Kiskorú felhasználó',
    'Veszélyes viselkedés',
    'Egyéb',
  ];

  const handleEmergencyCall = (number) => {
    Alert.alert(
      'Segélyhívás',
      `Biztosan hívni szeretnéd a következő számot: ${number}?`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Hívás',
          onPress: () => {
            // Itt valódi alkalmazásban: Linking.openURL(`tel:${number}`)
            Alert.alert('Hívás indítva', `Hívás: ${number}`);
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (!user?.id) {
      Alert.alert('Hiba', 'Jelentkezz be a jelentéshez');
      return;
    }

    if (!reportedUserId) {
      Alert.alert('Hiba', 'Nincs kiválasztva felhasználó a jelentéshez');
      return;
    }

    Alert.alert(
      'Felhasználó jelentése',
      reportedUserName ? `${reportedUserName} jelentése` : 'Válassz egy okot:',
      [
        ...reportReasons.map(reason => ({
          text: reason,
          onPress: () => submitReport(reason),
        })),
        { text: 'Mégse', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const submitReport = async (reason) => {
    try {
      setLoading(true);

      const result = await SafetyService.reportUser(
        user.id,
        reportedUserId,
        reason,
        '' // Optional evidence/details
      );

      if (result.success) {
        Alert.alert(
          '✅ Jelentés elküldve',
          'Köszönjük a jelentésed. Csapatunk hamarosan átnézi és megteszi a szükséges lépéseket.\n\nA biztonságod a legfontosabb számunkra!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(result.error?.message || 'Jelentés sikertelen');
      }
    } catch (error) {
      console.error('Report error:', error);
      Alert.alert('Hiba', error.message || 'Nem sikerült elküldeni a jelentést');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = () => {
    if (!user?.id) {
      Alert.alert('Hiba', 'Jelentkezz be a blokkoláshoz');
      return;
    }

    if (!reportedUserId) {
      Alert.alert('Hiba', 'Nincs kiválasztva felhasználó a blokkoláshoz');
      return;
    }

    Alert.alert(
      'Felhasználó blokkolása',
      reportedUserName 
        ? `Biztosan blokkolni szeretnéd ${reportedUserName}-t? Többé nem fog tudni kapcsolatba lépni veled.`
        : 'Biztosan blokkolni szeretnéd ezt a felhasználót? Többé nem fog tudni kapcsolatba lépni veled.',
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Blokkolás',
          style: 'destructive',
          onPress: submitBlock,
        },
      ]
    );
  };

  const submitBlock = async () => {
    try {
      setLoading(true);

      const result = await SafetyService.blockUser(user.id, reportedUserId);

      if (result.success) {
        Alert.alert(
          '🚫 Blokkolva',
          'A felhasználó sikeresen blokkolva. Többé nem fog tudni kapcsolatba lépni veled.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(result.error?.message || 'Blokkolás sikertelen');
      }
    } catch (error) {
      console.error('Block error:', error);
      Alert.alert('Hiba', error.message || 'Nem sikerült blokkolni a felhasználót');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biztonság</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        {/* Gyors műveletek */}
        {reportedUserId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Gyors műveletek</Text>
            {reportedUserName && (
              <Text style={styles.sectionSubtitle}>
                Műveletek: {reportedUserName}
              </Text>
            )}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionButton} 
                onPress={handleReport}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#F44336', '#E53935']}
                  style={styles.quickActionGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flag" size={24} color="#fff" />
                      <Text style={styles.quickActionText}>Jelentés</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickActionButton} 
                onPress={handleBlock}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#9C27B0', '#8E24AA']}
                  style={styles.quickActionGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="ban" size={24} color="#fff" />
                      <Text style={styles.quickActionText}>Blokkolás</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Segélyhívó számok */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 Segélyhívó számok</Text>
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.emergencyCard}
              onPress={() => handleEmergencyCall(contact.number)}
            >
              <View style={[styles.emergencyIcon, { backgroundColor: contact.color + '20' }]}>
                <Text style={styles.emergencyEmoji}>{contact.icon}</Text>
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyName}>{contact.name}</Text>
                <Text style={styles.emergencyNumber}>{contact.number}</Text>
              </View>
              <Ionicons name="call" size={24} color={contact.color} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Biztonsági tippek */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Biztonsági tippek</Text>
          {safetyTips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <View style={[styles.tipIcon, { backgroundColor: tip.color + '15' }]}>
                <Text style={styles.tipEmoji}>{tip.icon}</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* További információk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 További információk</Text>
          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="book" size={20} color="#2196F3" />
            <Text style={styles.linkText}>Közösségi irányelvek</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.linkText}>Adatvédelmi irányelvek</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton}>
            <Ionicons name="help-circle" size={20} color="#FF9800" />
            <Text style={styles.linkText}>GYIK - Gyakori kérdések</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🛡️ A biztonságod a legfontosabb számunkra!
          </Text>
          <Text style={styles.footerSubtext}>
            Ha veszélyben érzed magad, azonnal hívj segítséget!
          </Text>
        </View>
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginTop: -10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 10,
  },
  emergencyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emergencyEmoji: {
    fontSize: 24,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emergencyNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tipEmoji: {
    fontSize: 20,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SafetyScreen;

