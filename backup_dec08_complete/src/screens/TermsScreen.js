/**
 * Terms of Service Screen
 * Phase 3: Legal Screens Completion
 * 
 * Displays the Terms of Service with consent tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';
import Logger from '../services/Logger';

const TermsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const { requireAcceptance = false, onAccept } = route.params || {};

  useEffect(() => {
    checkAcceptanceStatus();
  }, []);

  const checkAcceptanceStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', user.id)
        .eq('consent_type', 'terms_of_service')
        .eq('accepted', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setAccepted(true);
      }
    } catch (error) {
      Logger.error('[TermsScreen] Failed to check acceptance status', error);
    }
  };

  const handleAccept = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Record consent in database
      const { error } = await supabase
        .from('user_consents')
        .insert({
          user_id: user.id,
          consent_type: 'terms_of_service',
          accepted: true,
          version: '1.0',
          accepted_at: new Date().toISOString(),
          ip_address: null, // TODO: Get IP address if needed
        });

      if (error) throw error;

      setAccepted(true);
      Logger.success('[TermsScreen] Terms accepted', { userId: user.id });

      if (onAccept) {
        onAccept();
      }

      if (requireAcceptance) {
        navigation.goBack();
      }
    } catch (error) {
      Logger.error('[TermsScreen] Failed to accept terms', error);
      alert('Hiba történt az elfogadás során. Kérjük, próbálja újra.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginLeft: 16,
    },
    scrollContent: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    lastUpdated: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 12,
    },
    paragraph: {
      fontSize: 15,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: 16,
    },
    listItem: {
      fontSize: 15,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: 8,
      paddingLeft: 16,
    },
    acceptButton: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      margin: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    acceptButtonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    acceptedBadge: {
      backgroundColor: theme.colors.success,
      padding: 12,
      margin: 20,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    acceptedText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Általános Szerződési Feltételek</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Általános Szerződési Feltételek</Text>
        <Text style={styles.lastUpdated}>Utolsó frissítés: 2025. December 7.</Text>

        <Text style={styles.sectionTitle}>1. Bevezetés</Text>
        <Text style={styles.paragraph}>
          Üdvözöljük a LoveX alkalmazásban! Ezek az Általános Szerződési Feltételek ("ÁSZF") 
          szabályozzák az Ön és a LoveX közötti jogviszonyt az alkalmazás használata során.
        </Text>
        <Text style={styles.paragraph}>
          Az alkalmazás használatával Ön elfogadja ezeket a feltételeket. Ha nem ért egyet 
          bármely feltétellel, kérjük, ne használja az alkalmazást.
        </Text>

        <Text style={styles.sectionTitle}>2. Szolgáltatás leírása</Text>
        <Text style={styles.paragraph}>
          A LoveX egy társkereső alkalmazás, amely lehetővé teszi a felhasználók számára, hogy:
        </Text>
        <Text style={styles.listItem}>• Profilt hozzanak létre és kezeljék</Text>
        <Text style={styles.listItem}>• Más felhasználókkal kapcsolatba lépjenek</Text>
        <Text style={styles.listItem}>• Üzeneteket küldjenek és fogadjanak</Text>
        <Text style={styles.listItem}>• Prémium funkciókat vásároljanak</Text>

        <Text style={styles.sectionTitle}>3. Felhasználói fiókok</Text>
        <Text style={styles.paragraph}>
          A szolgáltatás használatához regisztrálnia kell egy fiókot. Ön felelős:
        </Text>
        <Text style={styles.listItem}>• Pontos információk megadásáért</Text>
        <Text style={styles.listItem}>• Fiókja biztonságának megőrzéséért</Text>
        <Text style={styles.listItem}>• Jelszava titkosságának megőrzéséért</Text>
        <Text style={styles.listItem}>• Fiókjában történt minden tevékenységért</Text>

        <Text style={styles.sectionTitle}>4. Felhasználói magatartás</Text>
        <Text style={styles.paragraph}>
          Ön vállalja, hogy NEM fog:
        </Text>
        <Text style={styles.listItem}>• Hamis információkat megadni</Text>
        <Text style={styles.listItem}>• Más felhasználókat zaklatni vagy bántalmazni</Text>
        <Text style={styles.listItem}>• Spam vagy kéretlen üzeneteket küldeni</Text>
        <Text style={styles.listItem}>• Illegális tevékenységet folytatni</Text>
        <Text style={styles.listItem}>• Szellemi tulajdonjogokat megsérteni</Text>

        <Text style={styles.sectionTitle}>5. Prémium előfizetések</Text>
        <Text style={styles.paragraph}>
          Prémium előfizetéseket kínálunk extra funkciókkal. Az előfizetések:
        </Text>
        <Text style={styles.listItem}>• Automatikusan megújulnak, hacsak nem mondja le</Text>
        <Text style={styles.listItem}>• Bármikor lemondhatók</Text>
        <Text style={styles.listItem}>• Nem visszatéríthetők, kivéve jogszabályi kötelezettség esetén</Text>

        <Text style={styles.sectionTitle}>6. Szellemi tulajdon</Text>
        <Text style={styles.paragraph}>
          Az alkalmazás és annak tartalma (kivéve a felhasználók által feltöltött tartalmakat) 
          a LoveX szellemi tulajdonát képezik. Tilos az alkalmazás vagy annak bármely részének 
          másolása, módosítása vagy terjesztése engedély nélkül.
        </Text>

        <Text style={styles.sectionTitle}>7. Felelősség korlátozása</Text>
        <Text style={styles.paragraph}>
          A LoveX nem vállal felelősséget:
        </Text>
        <Text style={styles.listItem}>• Más felhasználók magatartásáért</Text>
        <Text style={styles.listItem}>• Felhasználók közötti interakciókért</Text>
        <Text style={styles.listItem}>• Szolgáltatás megszakadásáért</Text>
        <Text style={styles.listItem}>• Adatvesztésért</Text>

        <Text style={styles.sectionTitle}>8. Felmondás</Text>
        <Text style={styles.paragraph}>
          Fenntartjuk a jogot, hogy felfüggesszük vagy megszüntessük fiókját, ha megsérti 
          ezeket a feltételeket vagy bármilyen módon visszaél a szolgáltatással.
        </Text>

        <Text style={styles.sectionTitle}>9. Módosítások</Text>
        <Text style={styles.paragraph}>
          Fenntartjuk a jogot, hogy bármikor módosítsuk ezeket a feltételeket. A módosításokról 
          értesítjük Önt az alkalmazáson keresztül. A módosítások után történő használat 
          az új feltételek elfogadását jelenti.
        </Text>

        <Text style={styles.sectionTitle}>10. Kapcsolat</Text>
        <Text style={styles.paragraph}>
          Ha kérdése van ezekkel a feltételekkel kapcsolatban, kérjük, lépjen kapcsolatba 
          velünk a support@lovex.app címen.
        </Text>

        <Text style={styles.sectionTitle}>11. Irányadó jog</Text>
        <Text style={styles.paragraph}>
          Ezekre a feltételekre a magyar jog az irányadó. Bármilyen vita esetén a magyar 
          bíróságok rendelkeznek kizárólagos joghatósággal.
        </Text>
      </ScrollView>

      {requireAcceptance && !accepted && (
        <TouchableOpacity
          style={[styles.acceptButton, loading && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Elfogadom az ÁSZF-et</Text>
          )}
        </TouchableOpacity>
      )}

      {accepted && (
        <View style={styles.acceptedBadge}>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          <Text style={styles.acceptedText}>Elfogadva</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default TermsScreen;
