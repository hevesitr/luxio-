import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EditProfileModal = ({ visible, onClose, userProfile, onSave }) => {
  const [name, setName] = useState(userProfile.name);
  const [age, setAge] = useState(userProfile.age.toString());
  const [bio, setBio] = useState(userProfile.bio);
  const [selectedInterests, setSelectedInterests] = useState(userProfile.interests);

  const availableInterests = [
    'Utazás', 'Fotózás', 'Sport', 'Zene', 'Olvasás', 'Főzés',
    'Film', 'Természetjárás', 'Művészet', 'Koncertek', 'Gaming', 'Jóga'
  ];

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 8) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        Alert.alert('Maximum 8 érdeklődési kör választható!');
      }
    }
  };

  const handleSave = () => {
    // Name validation
    if (!name.trim()) {
      Alert.alert('❌ Hiba', 'A név nem lehet üres!');
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert('❌ Hiba', 'A név legalább 2 karakter hosszú legyen!');
      return;
    }
    if (name.trim().length > 30) {
      Alert.alert('❌ Hiba', 'A név maximum 30 karakter hosszú lehet!');
      return;
    }

    // Age validation
    if (!age || isNaN(age)) {
      Alert.alert('❌ Hiba', 'Adj meg egy érvényes életkort!');
      return;
    }
    const ageNum = parseInt(age);
    if (ageNum < 18) {
      Alert.alert('❌ Hiba', 'Legalább 18 évesnek kell lenned!');
      return;
    }
    if (ageNum > 100) {
      Alert.alert('❌ Hiba', 'Az életkor nem lehet több mint 100 év!');
      return;
    }

    // Interests validation
    if (selectedInterests.length === 0) {
      Alert.alert('❌ Hiba', 'Válassz legalább 1 érdeklődési kört!');
      return;
    }

    // Bio validation
    if (bio.trim().length > 150) {
      Alert.alert('❌ Hiba', 'A bemutatkozás maximum 150 karakter lehet!');
      return;
    }

    onSave({
      name: name.trim(),
      age: ageNum,
      bio: bio.trim(),
      interests: selectedInterests,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil szerkesztése</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Mentés</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Név *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Add meg a neved"
              maxLength={30}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Életkor *</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Életkor"
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Rólam</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Írj pár sort magadról..."
              multiline
              maxLength={150}
            />
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Érdeklődési körök ({selectedInterests.length}/8) *</Text>
            <View style={styles.interestsContainer}>
              {availableInterests.map((interest, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.interestChip,
                    selectedInterests.includes(interest) && styles.interestChipSelected
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[
                    styles.interestChipText,
                    selectedInterests.includes(interest) && styles.interestChipTextSelected
                  ]}>
                    {interest}
                  </Text>
                  {selectedInterests.includes(interest) && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: 50,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 5,
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B75',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  interestChipSelected: {
    backgroundColor: '#FF3B75',
  },
  interestChipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  interestChipTextSelected: {
    color: '#fff',
  },
});

export default EditProfileModal;

