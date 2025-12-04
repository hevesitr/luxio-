import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const VerificationScreen = ({ navigation }) => {
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);

  const benefits = [
    {
      icon: '✅',
      title: 'Hitelesség',
      description: 'Mutasd meg, hogy valódi vagy!',
      color: '#4CAF50',
    },
    {
      icon: '⭐',
      title: 'Több match',
      description: 'Hitelesített profilok 40%-kal több matchet kapnak',
      color: '#FFC107',
    },
    {
      icon: '🛡️',
      title: 'Biztonság',
      description: 'Védd magad és másokat a hamis profiloktól',
      color: '#2196F3',
    },
    {
      icon: '💎',
      title: 'Exkluzív jelvény',
      description: 'Kék pipa a profilodon',
      color: '#9C27B0',
    },
  ];

  const verificationSteps = [
    {
      step: 1,
      title: 'Készíts egy szelfit',
      description: 'Nézz a kamerába és kövesd az utasításokat',
      icon: 'camera',
    },
    {
      step: 2,
      title: 'Ellenőrzés',
      description: 'AI-unk összehasonlítja a profilfotóiddal',
      icon: 'scan',
    },
    {
      step: 3,
      title: 'Jóváhagyás',
      description: 'Csapatunk megerősíti a hitelességed',
      icon: 'checkmark-circle',
    },
  ];

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Engedély szükséges', 'Kamera hozzáférés szükséges a verifikációhoz');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setVerificationPhoto(result.assets[0].uri);
      setVerificationStep(2);
      
      // Szimulált AI ellenőrzés
      setTimeout(() => {
        setVerificationStep(3);
        setTimeout(() => {
          setIsVerified(true);
          Alert.alert(
            '🎉 Gratulálunk!',
            'Profilod sikeresen hitelesítve!\n\nMost már kék pipával jelenik meg a neved a profilodon.',
            [{ text: 'Rendben', onPress: () => navigation.goBack() }]
          );
        }, 2000);
      }, 3000);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Verifikáció</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        {!isVerified ? (
          <>
            <View style={styles.heroSection}>
              <LinearGradient
                colors={['#2196F3', '#64B5F6']}
                style={styles.heroGradient}
              >
                <Ionicons name="shield-checkmark" size={80} color="#fff" />
                <Text style={styles.heroTitle}>Hitelesítsd magad!</Text>
                <Text style={styles.heroSubtitle}>
                  Szerezd meg a kék pipát és növeld a bizalmat
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Miért érdemes?</Text>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitCard}>
                  <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '20' }]}>
                    <Text style={styles.benefitEmoji}>{benefit.icon}</Text>
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hogyan működik?</Text>
              {verificationSteps.map((item, index) => (
                <View key={index} style={styles.stepCard}>
                  <View style={[
                    styles.stepNumber,
                    verificationStep > item.step && styles.stepNumberCompleted
                  ]}>
                    {verificationStep > item.step ? (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    ) : (
                      <Text style={styles.stepNumberText}>{item.step}</Text>
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepDescription}>{item.description}</Text>
                    {verificationStep === item.step && (
                      <View style={styles.stepActive}>
                        <Text style={styles.stepActiveText}>Folyamatban...</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name={item.icon} size={32} color="#2196F3" style={styles.stepIcon} />
                </View>
              ))}
            </View>

            {verificationPhoto && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Verifikációs fotó</Text>
                <Image source={{ uri: verificationPhoto }} style={styles.previewImage} />
              </View>
            )}

            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleTakePhoto}
              disabled={verificationStep > 1}
            >
              <LinearGradient
                colors={verificationStep > 1 ? ['#ccc', '#999'] : ['#2196F3', '#64B5F6']}
                style={styles.buttonGradient}
              >
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.buttonText}>
                  {verificationStep === 1 ? 'Verifikáció indítása' : 
                   verificationStep === 2 ? 'Ellenőrzés...' : 
                   'Jóváhagyás folyamatban...'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successSection}>
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={styles.successGradient}
            >
              <Ionicons name="checkmark-circle" size={100} color="#fff" />
              <Text style={styles.successTitle}>Hitelesítve! 🎉</Text>
              <Text style={styles.successDescription}>
                Profilod mostantól kék pipával jelenik meg!
              </Text>
              
              <View style={styles.badgePreview}>
                <Text style={styles.badgePreviewName}>Te</Text>
                <Ionicons name="checkmark-circle" size={32} color="#2196F3" />
              </View>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.doneButtonText}>Kész</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Adataid biztonságban vannak. A verifikációs fotót csak ellenőrzésre használjuk, nem jelenik meg a profilodon.
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
  heroSection: {
    margin: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 40,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  benefitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  benefitEmoji: {
    fontSize: 24,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  benefitDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  stepActive: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  stepActiveText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  stepIcon: {
    marginLeft: 10,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
  startButton: {
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successSection: {
    margin: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  successGradient: {
    padding: 40,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  successDescription: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  badgePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
  },
  badgePreviewName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  doneButton: {
    marginTop: 30,
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  footer: {
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default VerificationScreen;

