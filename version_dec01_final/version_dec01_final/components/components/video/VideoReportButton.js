/**
 * VideoReportButton Component
 * Button to report inappropriate videos
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VideoService from '../../services/VideoService';
import Logger from '../../services/Logger';

const REPORT_REASONS = [
  'Inappropriate content',
  'Nudity or sexual content',
  'Violence or harmful behavior',
  'Harassment or bullying',
  'Spam or misleading',
  'Other',
];

const VideoReportButton = ({ videoId, userId, style }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = () => {
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;

    if (!reason || reason.trim() === '') {
      Alert.alert('Error', 'Please select or enter a reason');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await VideoService.reportVideo(videoId, userId, reason);

      if (result.success) {
        Alert.alert('Success', result.message || 'Video reported successfully');
        setShowModal(false);
        setSelectedReason(null);
        setCustomReason('');
      }
    } catch (error) {
      Logger.error('Failed to report video', error);
      Alert.alert('Error', 'Failed to report video. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.reportButton, style]}
        onPress={handleReport}
      >
        <Ionicons name="flag" size={20} color="#dc2626" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Video</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Why are you reporting this video?
            </Text>

            <View style={styles.reasonsList}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason && styles.reasonTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                  {selectedReason === reason && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedReason === 'Other' && (
              <TextInput
                style={styles.customReasonInput}
                placeholder="Please describe the issue..."
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting || !selectedReason}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  reportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reasonsList: {
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  reasonItemSelected: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  reasonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  reasonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#dc2626',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default VideoReportButton;
