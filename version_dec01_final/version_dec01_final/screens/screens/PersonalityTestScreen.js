import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ProgressViewIOS,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const QUESTIONS = [
  {
    id: 1,
    question: "Hogyan töltöd a legtöbb szabadidődet?",
    options: [
      { text: "Barátokkal vagyok", value: "extrovert" },
      { text: "Otthon pihenek", value: "introvert" },
      { text: "Sportolok vagy aktív vagyok", value: "active" },
      { text: "Olvasok vagy tanulok", value: "intellectual" },
    ],
  },
  {
    id: 2,
    question: "Milyen típusú kapcsolatot keresel?",
    options: [
      { text: "Komoly, hosszú távú kapcsolat", value: "serious" },
      { text: "Laza, játékos kapcsolat", value: "casual" },
      { text: "Barátság", value: "friendship" },
      { text: "Még nem tudom", value: "unsure" },
    ],
  },
  {
    id: 3,
    question: "Mi a legfontosabb egy kapcsolatban?",
    options: [
      { text: "Kommunikáció és őszinteség", value: "communication" },
      { text: "Közös érdeklődések", value: "interests" },
      { text: "Fizikai vonzalom", value: "physical" },
      { text: "Érzelmi kapcsolat", value: "emotional" },
    ],
  },
  {
    id: 4,
    question: "Hogyan szeretsz kommunikálni?",
    options: [
      { text: "Személyesen", value: "in-person" },
      { text: "Üzenetekben", value: "messages" },
      { text: "Videóhívásokban", value: "video" },
      { text: "Telefonhívásokban", value: "phone" },
    ],
  },
  {
    id: 5,
    question: "Mi a legjobb első randid?",
    options: [
      { text: "Kávézó vagy étterem", value: "coffee" },
      { text: "Sétálás a parkban", value: "walk" },
      { text: "Közös tevékenység (pl. mozi)", value: "activity" },
      { text: "Otthon, beszélgetés", value: "home" },
    ],
  },
];

const PersonalityTestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (allAnswers) => {
    // Számítsuk ki a személyiség típust
    const traits = {
      extrovert: 0,
      introvert: 0,
      serious: 0,
      casual: 0,
      communication: 0,
      interests: 0,
    };

    Object.values(allAnswers).forEach((answer) => {
      if (traits.hasOwnProperty(answer)) {
        traits[answer]++;
      }
    });

    const personalityType = 
      traits.extrovert > traits.introvert ? 'extrovert' : 'introvert';
    const relationshipStyle = 
      traits.serious > traits.casual ? 'serious' : 'casual';

    setResult({
      personalityType,
      relationshipStyle,
      traits,
    });
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetTest} style={styles.backButton}>
            <Ionicons name="refresh" size={24} color="#FF3B75" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Eredmény</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <LinearGradient
            colors={['#FF3B75', '#FF6B9D']}
            style={styles.resultCard}
          >
            <Ionicons name="sparkles" size={60} color={theme.colors.text} />
            <Text style={styles.resultTitle}>Személyiség Típusod</Text>
            <Text style={styles.resultType}>
              {result.personalityType === 'extrovert' ? 'Extrovertált' : 'Introvertált'}
            </Text>
            <Text style={styles.resultSubtype}>
              {result.relationshipStyle === 'serious' ? 'Komoly kapcsolat' : 'Laza kapcsolat'} orientált
            </Text>
          </LinearGradient>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Részletek</Text>
            <View style={styles.detailItem}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
              <Text style={styles.detailText}>
                {result.personalityType === 'extrovert' 
                  ? 'Szereted a társaságot és az aktív programokat'
                  : 'Szereted a csendesebb, intimebb környezetet'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="heart" size={20} color="#FF3B75" />
              <Text style={styles.detailText}>
                {result.relationshipStyle === 'serious'
                  ? 'Komoly, hosszú távú kapcsolatot keresel'
                  : 'Laza, játékos kapcsolatot keresel'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              Alert.alert('✅ Mentve', 'A személyiség típusod elmentve a profilodba!');
              navigation.goBack();
            }}
          >
            <LinearGradient
              colors={['#FF3B75', '#FF6B9D']}
              style={styles.saveGradient}
            >
              <Text style={styles.saveButtonText}>Eredmény mentése</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const progress = (currentQuestion + 1) / QUESTIONS.length;

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Személyiség Teszt</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        {Platform.OS === 'ios' ? (
          <ProgressViewIOS progress={progress} progressTintColor={theme.colors.primary} />
        ) : (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}
        <Text style={styles.progressText}>
          {currentQuestion + 1} / {QUESTIONS.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionNumber}>Kérdés {currentQuestion + 1}</Text>
          <Text style={styles.questionText}>
            {QUESTIONS[currentQuestion].question}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {QUESTIONS[currentQuestion].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswer(option.value)}
            >
              <Text style={styles.optionText}>{option.text}</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
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
  closeButton: {
    padding: 5,
  },
  placeholder: {
    width: 34,
  },
  progressContainer: {
    padding: 15,
    gap: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  questionNumber: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  resultCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    color: theme.colors.text,
    marginTop: 15,
    marginBottom: 10,
    fontWeight: '600',
  },
  resultType: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  resultSubtype: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  saveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  saveGradient: {
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PersonalityTestScreen;

