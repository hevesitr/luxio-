import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ProgressBarAndroid,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const QUESTIONS = [
  {
    id: 1,
    question: "Egy bulin inkább...",
    options: [
      { text: "A középpontban vagyok, mindenki körülöttem forog", type: "extrovert" },
      { text: "Inkább a sarokban beszélgetek egy-két emberrel", type: "introvert" }
    ]
  },
  {
    id: 2,
    question: "Amikor döntést kell hoznom...",
    options: [
      { text: "Részletesen átgondolom az összes lehetőséget", type: "thinking" },
      { text: "Inkább az intuíciómra hallgatok", type: "feeling" }
    ]
  },
  {
    id: 3,
    question: "Az ideális hétvége...",
    options: [
      { text: "Tervezett és szervezett programokkal", type: "judging" },
      { text: "Spontán és rugalmas tevékenységekkel", type: "perceiving" }
    ]
  },
  {
    id: 4,
    question: "A munkában jobban szeretem...",
    options: [
      { text: "A konkrét, gyakorlati feladatokat", type: "sensing" },
      { text: "Az új ötleteket és lehetőségeket", type: "intuitive" }
    ]
  },
  {
    id: 5,
    question: "A barátaimmal való kapcsolattartás...",
    options: [
      { text: "Rendszeres, megbízható vagyok", type: "reliable" },
      { text: "Rugalmas és alkalmazkodó vagyok", type: "adaptable" }
    ]
  }
];

const PERSONALITY_TYPES = {
  extrovert: "Extrovertált",
  introvert: "Introvertált",
  thinking: "Logikus gondolkodású",
  feeling: "Érzelmi alapú",
  judging: "Strukturált",
  perceiving: "Spontán",
  sensing: "Gyakorlatias",
  intuitive: "Látomásos",
  reliable: "Megbízható",
  adaptable: "Rugalmas"
};

const PersonalityTestModal = ({ visible, onClose, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (type) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQuestion].id]: type };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate personality type
      const personalityCounts = {};
      Object.values(newAnswers).forEach(type => {
        personalityCounts[type] = (personalityCounts[type] || 0) + 1;
      });

      const topTraits = Object.entries(personalityCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type]) => PERSONALITY_TYPES[type] || type);

      setShowResults(true);
      if (onComplete) {
        onComplete(topTraits);
      }
    }
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const progress = (currentQuestion + 1) / QUESTIONS.length;

  if (showResults) {
    const personalityCounts = {};
    Object.values(answers).forEach(type => {
      personalityCounts[type] = (personalityCounts[type] || 0) + 1;
    });

    const topTraits = Object.entries(personalityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return (
      <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>A személyiségtípusod</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultsContent}>
              <View style={styles.traitsContainer}>
                {topTraits.map(([type, count], index) => (
                  <View key={type} style={styles.traitItem}>
                    <View style={styles.traitRank}>
                      <Text style={styles.traitRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.traitInfo}>
                      <Text style={styles.traitName}>{PERSONALITY_TYPES[type] || type}</Text>
                      <Text style={styles.traitScore}>{count}/{QUESTIONS.length} pont</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.compatibilityNote}>
                <Ionicons name="heart" size={20} color="#FF69B4" />
                <Text style={styles.compatibilityText}>
                  Ezek az eredmények segítenek megtalálni a hozzád illő partnereket!
                </Text>
              </View>
            </ScrollView>

            <View style={styles.resultsFooter}>
              <TouchableOpacity style={styles.retakeButton} onPress={resetTest}>
                <Text style={styles.retakeButtonText}>Újra kitöltöm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeResultsButton} onPress={onClose}>
                <Text style={styles.closeResultsButtonText}>Kész</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {currentQuestion + 1} / {QUESTIONS.length}
              </Text>
              {Platform.OS === 'android' ? (
                <ProgressBarAndroid
                  styleAttr="Horizontal"
                  indeterminate={false}
                  progress={progress}
                  color="#00D4FF"
                  style={styles.progressBar}
                />
              ) : (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
              )}
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.question}>{question.question}</Text>

            <View style={styles.optionsContainer}>
              {question.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswer(option.type)}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#00D4FF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Őszintén válaszolj a kérdésekre a legjobb eredményért!
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    minHeight: height * 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    marginLeft: 10,
  },
  progressText: {
    color: '#00D4FF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D4FF',
    borderRadius: 2,
  },
  questionContainer: {
    padding: 20,
    flex: 1,
  },
  question: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Results styles
  resultsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  resultsContent: {
    padding: 20,
  },
  traitsContainer: {
    marginBottom: 20,
  },
  traitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  traitRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  traitRankText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  traitInfo: {
    flex: 1,
  },
  traitName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  traitScore: {
    color: '#00D4FF',
    fontSize: 14,
    marginTop: 4,
  },
  compatibilityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.3)',
  },
  compatibilityText: {
    color: '#FF69B4',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  resultsFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeResultsButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeResultsButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalityTestModal;
