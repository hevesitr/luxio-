import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const HelpScreen = ({ navigation }) => {
  const { theme } = useTheme();

  const helpItems = [
    {
      icon: 'help-circle-outline',
      title: 'Gyakori Kérdések',
      subtitle: 'Válaszok a leggyakoribb kérdésekre',
      action: () => {
        // TODO: Implement FAQ screen or WebView
        alert('FAQ hamarosan elérhető');
      },
    },
    {
      icon: 'mail-outline',
      title: 'Kapcsolatfelvétel',
      subtitle: 'Írj nekünk egy emailt',
      action: () => {
        Linking.openURL('mailto:support@lovex.app');
      },
    },
    {
      icon: 'document-text-outline',
      title: 'Felhasználási Feltételek',
      subtitle: 'Olvass el a feltételeket',
      action: () => {
        navigation.navigate('WebView', {
          url: 'https://lovex.app/terms',
          title: 'Felhasználási Feltételek',
        });
      },
    },
    {
      icon: 'shield-outline',
      title: 'Adatvédelmi Nyilatkozat',
      subtitle: 'Hogyan kezeljük az adataidat',
      action: () => {
        navigation.navigate('WebView', {
          url: 'https://lovex.app/privacy',
          title: 'Adatvédelmi Nyilatkozat',
        });
      },
    },
    {
      icon: 'bug-outline',
      title: 'Hiba Bejelentés',
      subtitle: 'Jelezz egy hibát',
      action: () => {
        Linking.openURL('mailto:bugs@lovex.app?subject=Hiba%20bejelentés');
      },
    },
    {
      icon: 'information-circle-outline',
      title: 'Verzió Információ',
      subtitle: 'App verzió: 1.0.0',
      action: () => {
        alert('LoveX Dating App\nVerzió: 1.0.0\nBuild: 1');
      },
    },
  ];

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Súgó & Támogatás</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {helpItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.helpItem}
            onPress={item.action}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Szükséged van további segítségre?
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@lovex.app')}
          >
            <Text style={styles.contactButtonText}>Írj nekünk</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    helpItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    itemSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    footer: {
      marginTop: 32,
      paddingVertical: 24,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    contactButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 24,
    },
    contactButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default HelpScreen;
