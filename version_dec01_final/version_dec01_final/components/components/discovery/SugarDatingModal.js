import React from 'react';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SugarDatingModal Component
 * 
 * Intro modal for Sugar Dating mode (18+)
 * Explains what sugar dating is and safety guidelines
 */
const SugarDatingModal = ({ theme, visible, onClose, onContinue }) => {
  const styles = createStyles(theme);

  const handleContinue = () => {
    onContinue();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.ageBadgeLarge}>
              <Text style={styles.ageBadgeTextLarge}>18+</Text>
            </View>
            <Text style={styles.title}>Sugar Dating</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>Mi a Sugar Dating?</Text>
            <Text style={styles.text}>
              A Sugar Dating egy olyan kapcsolatforma, ahol generózus, sikeres
              férfiak (Sugar Daddies) és ambiciózus, fiatal nők (Sugar Babies)
              találkoznak.
            </Text>

            <Text style={styles.subtitle}>Hogyan működik?</Text>
            <Text style={styles.text}>
              • A Sugar Daddies anyagi támogatást nyújthatnak{'\n'}• A Sugar
              Babies társaságot és kompaniát nyújthatnak{'\n'}• Mindkét fél
              tisztán kommunikál az elvárásokról{'\n'}• Diszkréció és biztonság
              a legfontosabb
            </Text>

            <Text style={styles.subtitle}>Fontos tudnivalók</Text>
            <Text style={styles.text}>
              ⚠️ Ez a funkció csak 18 év feletti felhasználók számára elérhető.
              {'\n'}⚠️ Mindig legyél óvatos és találkozz nyilvános helyeken.
              {'\n'}⚠️ Tisztán kommunikálj az elvárásokról és határokról.
            </Text>
          </ScrollView>

          {/* Button */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleContinue}
            >
              <Text style={styles.buttonTextPrimary}>Értem, folytatom</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
      position: 'relative',
    },
    ageBadgeLarge: {
      backgroundColor: '#FF3B75',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignSelf: 'center',
      marginBottom: 10,
    },
    ageBadgeTextLarge: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 10,
    },
    closeButton: {
      position: 'absolute',
      top: 0,
      right: 0,
      padding: 5,
    },
    content: {
      maxHeight: 400,
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 10,
    },
    text: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: 15,
    },
    buttons: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimary: {
      backgroundColor: theme.colors.primary,
    },
    buttonTextPrimary: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default SugarDatingModal;
