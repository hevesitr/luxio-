import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROMPTS = [
  "A legjobb dolog, amit valaki megtehet velem:",
  "A legfurcsább dolog, ami a hűtőmben van:",
  "A legjobb tanács, amit valaha kaptam:",
  "Amit a legjobban szeretek magamban:",
  "Amit a legjobban szeretek másokban:",
  "Amit a legjobban utálok:",
  "A legjobb dolog, amit valaki megtehet velem:",
  "Amit a legjobban szeretek csinálni szabadidőmben:",
  "Amit a legjobban szeretek a munkámban:",
  "Amit a legjobban szeretek a szabadidőmben:",
  "Amit a legjobban szeretek a hétvégén:",
  "Amit a legjobban szeretek az éjszakában:",
  "Amit a legjobban szeretek a reggelen:",
  "Amit a legjobban szeretek a nyáron:",
  "Amit a legjobban szeretek a télen:",
  "Amit a legjobban szeretek a tavaszon:",
  "Amit a legjobban szeretek az őszön:",
  "Amit a legjobban szeretek a hétköznapokon:",
  "Amit a legjobban szeretek a hétvégén:",
  "Amit a legjobban szeretek a szünetben:",
  "Amit a legjobban szeretek a munka után:",
  "Amit a legjobban szeretek a munka előtt:",
  "Amit a legjobban szeretek a reggeli után:",
  "Amit a legjobban szeretek az ebéd után:",
  "Amit a legjobban szeretek a vacsora után:",
  "Amit a legjobban szeretek az estén:",
  "Amit a legjobban szeretek az éjszakán:",
  "Amit a legjobban szeretek a hajnalban:",
  "Amit a legjobban szeretek a délelőttön:",
  "Amit a legjobban szeretek a délutánon:",
  "Amit a legjobban szeretek az estén:",
];

const ProfilePromptsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const saved = await AsyncStorage.getItem('@user_prompts');
      if (saved) {
        const data = JSON.parse(saved);
        setSelectedPrompts(data.selectedPrompts || []);
        setAnswers(data.answers || {});
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const savePrompts = async () => {
    try {
      await AsyncStorage.setItem('@user_prompts', JSON.stringify({
        selectedPrompts,
        answers,
      }));
      Alert.alert('✅ Mentve', 'A válaszaid sikeresen elmentve!');
    } catch (error) {
      Alert.alert('Hiba', 'Nem sikerült menteni a válaszokat.');
    }
  };

  const togglePrompt = (prompt) => {
    if (selectedPrompts.includes(prompt)) {
      setSelectedPrompts(selectedPrompts.filter(p => p !== prompt));
      const newAnswers = { ...answers };
      delete newAnswers[prompt];
      setAnswers(newAnswers);
    } else {
      if (selectedPrompts.length >= 3) {
        Alert.alert('Maximum 3 kérdés', 'Maximum 3 kérdés válaszolható meg.');
        return;
      }
      setSelectedPrompts([...selectedPrompts, prompt]);
      setAnswers({ ...answers, [prompt]: '' });
    }
  };

  const updateAnswer = (prompt, answer) => {
    setAnswers({ ...answers, [prompt]: answer });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Kérdések</Text>
        <TouchableOpacity onPress={savePrompts} style={styles.saveButton}>
          <Ionicons name="checkmark" size={24} color="#FF3B75" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#FF3B75" />
          <Text style={styles.infoText}>
            Válassz ki maximum 3 kérdést és válaszold meg őket. Ez segít, hogy jobban megismerjenek!
          </Text>
        </View>

        {selectedPrompts.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>Kiválasztott Kérdések</Text>
            {selectedPrompts.map((prompt, index) => (
              <View key={index} style={styles.promptCard}>
                <View style={styles.promptHeader}>
                  <Text style={styles.promptText}>{prompt}</Text>
                  <TouchableOpacity onPress={() => togglePrompt(prompt)}>
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Írd ide a válaszod..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={answers[prompt] || ''}
                  onChangeText={(text) => updateAnswer(prompt, text)}
                  multiline
                  maxLength={300}
                />
                <Text style={styles.charCount}>
                  {(answers[prompt] || '').length}/300
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.availableSection}>
          <Text style={styles.sectionTitle}>
            Elérhető Kérdések ({selectedPrompts.length}/3)
          </Text>
          {PROMPTS.filter(p => !selectedPrompts.includes(p)).map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptOption}
              onPress={() => togglePrompt(prompt)}
            >
              <Text style={styles.promptOptionText}>{prompt}</Text>
              <Ionicons name="add-circle-outline" size={24} color="#FF3B75" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  saveButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  selectedSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
    letterSpacing: -0.3,
  },
  promptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  promptText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 10,
  },
  answerInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 12,
    color: theme.colors.text,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
    marginTop: 5,
  },
  availableSection: {
    marginBottom: 30,
  },
  promptOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  promptOptionText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginRight: 10,
  },
});

export default ProfilePromptsScreen;

