/**
 * EmailVerificationSuccessScreen - Sikeres email verifikáció képernyő
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Logger from '../services/Logger';

const EmailVerificationSuccessScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    Logger.info('Email verification success screen shown');

    // Automatikus navigáció vissza a fő képernyőre 3 másodperc után
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleContinue = () => {
    Logger.info('User manually continued from email verification success');
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Sikeres ikon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>

        {/* Cím */}
        <Text style={styles.title}>Email cím megerősítve!</Text>

        {/* Üzenet */}
        <Text style={styles.message}>
          Köszönjük, hogy megerősítette email címét. Most már teljes mértékben
          használhatja az alkalmazás összes funkcióját.
        </Text>

        {/* Információs lista */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={20} color="#FF6B6B" style={styles.featureIcon} />
            <Text style={styles.featureText}>Swipe és match-elés</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="chatbubble" size={20} color="#FF6B6B" style={styles.featureIcon} />
            <Text style={styles.featureText}>Üzenetküldés</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="star" size={20} color="#FF6B6B" style={styles.featureIcon} />
            <Text style={styles.featureText}>Prémium funkciók</Text>
          </View>
        </View>

        {/* Folytatás gomb */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Folytatás</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* Automatikus továbbítás információ */}
        <Text style={styles.autoRedirect}>
          Automatikusan továbbítás 3 másodperc múlva...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    width: '100%',
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    marginBottom: 16,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  autoRedirect: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default EmailVerificationSuccessScreen;
