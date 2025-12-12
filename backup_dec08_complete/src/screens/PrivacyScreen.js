/**
 * Privacy Policy Screen
 * Phase 3: Legal Screens Completion
 * 
 * Displays the Privacy Policy with GDPR compliance
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

const PrivacyScreen = ({ navigation, route }) => {
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
        .eq('consent_type', 'privacy_policy')
        .eq('accepted', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setAccepted(true);
      }
    } catch (error) {
      Logger.error('[PrivacyScreen] Failed to check acceptance status', error);
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

      const { error } = await supabase
        .from('user_consents')
        .insert({
          user_id: user.id,
          consent_type: 'privacy_policy',
          accepted: true,
          version: '1.0',
          accepted_at: new Date().toISOString(),
          ip_address: null,
        });

      if (error) throw error;

      setAccepted(true);
      Logger.success('[PrivacyScreen] Privacy policy accepted', { userId: user.id });

      if (onAccept) {
        onAccept();
      }

      if (requireAcceptance) {
        navigation.goBack();
      }
    } catch (error) {
      Logger.error('[PrivacyScreen] Failed to accept privacy policy', error);
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
    highlight: {
      backgroundColor: theme.colors.primaryLight,
      padding: 12,
      borderRadius: 8,
      marginVertical: 12,
    },
    highlightText: {
      fontSize: 15,
      color: theme.colors.text,
      fontWeight: '500',
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
        <Text style={styles.headerTitle}>Adatvédelmi Tájékoztató</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Adatvédelmi Tájékoztató</Text>
        <Text style={styles.lastUpdated}>Utolsó frissítés: 2025. December 7.</Text>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>
            🔒 Az Ön adatainak védelme kiemelt fontosságú számunkra. Ez a tájékoztató 
            részletezi, hogyan gyűjtjük, használjuk és védjük személyes adatait.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Adatkezelő</Text>
        <Text style={styles.paragraph}>
          Adatkezelő: LoveX Kft.{'\n'}
          Székhely: 1234 Budapest, Példa utca 1.{'\n'}
          E-mail: privacy@lovex.app{'\n'}
          Adatvédelmi tisztviselő: dpo@lovex.app
        </Text>

        <Text style={styles.sectionTitle}>2. Gyűjtött adatok</Text>
        <Text style={styles.paragraph}>
          Az alábbi személyes adatokat gyűjtjük:
        </Text>
        <Text style={styles.listItem}>• Név, életkor, nem</Text>
        <Text style={styles.listItem}>• E-mail cím</Text>
        <Text style={styles.listItem}>• Profilképek és leírás</Text>
        <Text style={styles.listItem}>• Tartózkodási hely (hozzájárulás esetén)</Text>
        <Text style={styles.listItem}>• Használati adatok (swipe-ok, üzenetek)</Text>
        <Text style={styles.listItem}>• Eszközinformációk (IP cím, eszköz típus)</Text>

        <Text style={styles.sectionTitle}>3. Adatkezelés célja</Text>
        <Text style={styles.paragraph}>
          Adatait az alábbi célokra használjuk:
        </Text>
        <Text style={styles.listItem}>• Szolgáltatás nyújtása és működtetése</Text>
        <Text style={styles.listItem}>• Felhasználói élmény javítása</Text>
        <Text style={styles.listItem}>• Személyre szabott ajánlások</Text>
        <Text style={styles.listItem}>• Biztonság és visszaélések megelőzése</Text>
        <Text style={styles.listItem}>• Ügyfélszolgálat biztosítása</Text>
        <Text style={styles.listItem}>• Jogszabályi kötelezettségek teljesítése</Text>

        <Text style={styles.sectionTitle}>4. Jogalap</Text>
        <Text style={styles.paragraph}>
          Adatkezelésünk jogalapja:
        </Text>
        <Text style={styles.listItem}>• Szerződés teljesítése (szolgáltatás nyújtása)</Text>
        <Text style={styles.listItem}>• Hozzájárulás (opcionális funkciók)</Text>
        <Text style={styles.listItem}>• Jogos érdek (biztonság, fejlesztés)</Text>
        <Text style={styles.listItem}>• Jogi kötelezettség (adatmegőrzés)</Text>

        <Text style={styles.sectionTitle}>5. Adattárolás időtartama</Text>
        <Text style={styles.paragraph}>
          Adatait az alábbi időtartamig tároljuk:
        </Text>
        <Text style={styles.listItem}>• Aktív fiók: a fiók törlésééig</Text>
        <Text style={styles.listItem}>• Törölt fiók: 30 nap (helyreállítási időszak)</Text>
        <Text style={styles.listItem}>• Biztonsági naplók: 90 nap</Text>
        <Text style={styles.listItem}>• Pénzügyi adatok: 8 év (jogszabályi kötelezettség)</Text>

        <Text style={styles.sectionTitle}>6. Adatbiztonság</Text>
        <Text style={styles.paragraph}>
          Adatai védelmére az alábbi intézkedéseket alkalmazzuk:
        </Text>
        <Text style={styles.listItem}>• Titkosított adattárolás</Text>
        <Text style={styles.listItem}>• HTTPS kommunikáció</Text>
        <Text style={styles.listItem}>• Hozzáférés-korlátozás</Text>
        <Text style={styles.listItem}>• Rendszeres biztonsági auditok</Text>
        <Text style={styles.listItem}>• Incidenskezelési protokoll</Text>

        <Text style={styles.sectionTitle}>7. Adattovábbítás</Text>
        <Text style={styles.paragraph}>
          Adatait az alábbi esetekben továbbítjuk harmadik félnek:
        </Text>
        <Text style={styles.listItem}>• Szolgáltatók (hosting, analytics)</Text>
        <Text style={styles.listItem}>• Fizetési szolgáltatók</Text>
        <Text style={styles.listItem}>• Hatóságok (jogszabályi kötelezettség esetén)</Text>
        <Text style={styles.paragraph}>
          Minden adattovábbítás megfelelő adatvédelmi garanciákkal történik.
        </Text>

        <Text style={styles.sectionTitle}>8. Az Ön jogai (GDPR)</Text>
        <Text style={styles.paragraph}>
          Ön jogosult:
        </Text>
        <Text style={styles.listItem}>• Hozzáférés: adatai megtekintése</Text>
        <Text style={styles.listItem}>• Helyesbítés: adatai javítása</Text>
        <Text style={styles.listItem}>• Törlés: adatai törlése ("elfeledtetéshez való jog")</Text>
        <Text style={styles.listItem}>• Korlátozás: adatkezelés korlátozása</Text>
        <Text style={styles.listItem}>• Hordozhatóság: adatok exportálása</Text>
        <Text style={styles.listItem}>• Tiltakozás: adatkezelés elleni tiltakozás</Text>
        <Text style={styles.listItem}>• Panasz: felügyeleti hatóságnál</Text>

        <Text style={styles.sectionTitle}>9. Adatexport és törlés</Text>
        <Text style={styles.paragraph}>
          Az alkalmazásban bármikor kérheti:
        </Text>
        <Text style={styles.listItem}>• Adatai exportálását (Beállítások → Adataim letöltése)</Text>
        <Text style={styles.listItem}>• Fiókja törlését (Beállítások → Fiók törlése)</Text>
        <Text style={styles.paragraph}>
          Adatexport 48 órán belül, fiók törlés azonnal megtörténik.
        </Text>

        <Text style={styles.sectionTitle}>10. Sütik (Cookies)</Text>
        <Text style={styles.paragraph}>
          Az alkalmazás sütiket használ a következő célokra:
        </Text>
        <Text style={styles.listItem}>• Munkamenet fenntartása</Text>
        <Text style={styles.listItem}>• Beállítások mentése</Text>
        <Text style={styles.listItem}>• Használati statisztikák</Text>
        <Text style={styles.paragraph}>
          A sütik kezelését a Beállítások menüben módosíthatja.
        </Text>

        <Text style={styles.sectionTitle}>11. Gyermekek védelme</Text>
        <Text style={styles.paragraph}>
          Szolgáltatásunk 18 év alatti személyek számára nem elérhető. Ha tudomásunkra jut, 
          hogy 18 év alatti személy regisztrált, azonnal töröljük fiókját és adatait.
        </Text>

        <Text style={styles.sectionTitle}>12. Módosítások</Text>
        <Text style={styles.paragraph}>
          Fenntartjuk a jogot, hogy ezt a tájékoztatót bármikor módosítsuk. A módosításokról 
          értesítjük Önt az alkalmazáson keresztül. A módosítások után történő használat 
          az új tájékoztató elfogadását jelenti.
        </Text>

        <Text style={styles.sectionTitle}>13. Kapcsolat</Text>
        <Text style={styles.paragraph}>
          Adatvédelmi kérdéseivel forduljon hozzánk bizalommal:{'\n\n'}
          E-mail: privacy@lovex.app{'\n'}
          Adatvédelmi tisztviselő: dpo@lovex.app{'\n'}
          Postacím: 1234 Budapest, Példa utca 1.
        </Text>

        <Text style={styles.sectionTitle}>14. Felügyeleti hatóság</Text>
        <Text style={styles.paragraph}>
          Panasszal a Nemzeti Adatvédelmi és Információszabadság Hatósághoz fordulhat:{'\n\n'}
          Cím: 1055 Budapest, Falk Miksa utca 9-11.{'\n'}
          Telefon: +36 (1) 391-1400{'\n'}
          E-mail: ugyfelszolgalat@naih.hu{'\n'}
          Web: www.naih.hu
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
            <Text style={styles.acceptButtonText}>Elfogadom az Adatvédelmi Tájékoztatót</Text>
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

export default PrivacyScreen;
