import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatInput = ({ 
  value, 
  onChangeText, 
  onSend, 
  onVoicePress,
  onVideoPress,
  onGifPress,
  onPhotoPress,
  placeholder = 'Írj üzenetet...',
  theme 
}) => {
  const canSend = value.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.inputContainer}>
        {/* Media buttons */}
        <View style={styles.mediaButtons}>
          <TouchableOpacity onPress={onPhotoPress} style={styles.mediaButton}>
            <Ionicons name="image" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onGifPress} style={styles.mediaButton}>
            <Ionicons name="happy" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Text input */}
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={500}
        />

        {/* Send or voice button */}
        {canSend ? (
          <TouchableOpacity onPress={onSend} style={styles.sendButton}>
            <View style={[styles.sendButtonCircle, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="send" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.voiceButtons}>
            <TouchableOpacity onPress={onVoicePress} style={styles.voiceButton}>
              <Ionicons name="mic" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onVideoPress} style={styles.voiceButton}>
              <Ionicons name="videocam" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  mediaButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  sendButton: {
    padding: 4,
  },
  sendButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    padding: 4,
  },
});

export default ChatInput;
