import React, { useState } from 'react';
import {
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * AISearchModal Component
 * 
 * Modal for AI-powered profile search
 * User describes their ideal match and AI finds matching profiles
 */
const AISearchModal = ({ theme, visible, onClose, onSearch }) => {
  const [inputText, setInputText] = useState('');
  const styles = createStyles(theme);

  const handleSearch = () => {
    if (inputText && inputText.trim()) {
      onSearch(inputText.trim());
      setInputText('');
      onClose();
    } else {
      Alert.alert('Hiányzó leírás', 'Kérlek írj be egy leírást!');
    }
  };

  const handleCancel = () => {
    setInputText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AI Keresés</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Írd le, milyen párt keresel. Megadhatod a kapcsolati célját
            (laza/komoly/barátság), helyszínt (pl: budapest), korát, stb.
          </Text>

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="Pl: laza kapcsolatot keresek, budapest, 25-30 éves, sportos"
            placeholderTextColor={theme.colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonTextCancel}>Mégse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSearch]}
              onPress={handleSearch}
            >
              <Text style={styles.buttonTextSearch}>Keresés</Text>
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
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 5,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 15,
      lineHeight: 20,
    },
    input: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minHeight: 100,
      marginBottom: 20,
      textAlignVertical: 'top',
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
    buttonCancel: {
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonSearch: {
      backgroundColor: theme.colors.primary,
    },
    buttonTextCancel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    buttonTextSearch: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default AISearchModal;
