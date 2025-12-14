import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const COMPATIBILITY_QUESTIONS = [
  {
    id: 1,
    question: "Milyen gyakran szeretnél randevúzni?",
    category: "Kapcsolat",
    options: [
      { text: "Minden nap", value: "very_frequent", weight: 1 },
      { text: "Hetente többször", value: "frequent", weight: 2 },
      { text: "Hetente egyszer", value: "moderate", weight: 3 },
      { text: "Hetente egyszer-kétszer", value: "occasional", weight: 4 },
      { text: "Ritkábban", value: "rare", weight: 5 }
    ]
  },
  {
    id: 2,
    question: "Hogyan viszonyulsz a gyerekekhez?",
    category: "Család",
    options: [
      { text: "Már vannak gyermekeim", value: "has_kids", weight: 1 },
      { text: "Szeretnék gyerekeket a jövőben", value: "wants_kids", weight: 2 },
      { text: "Lehetőség szerint szeretnék", value: "maybe_kids", weight: 3 },
      { text: "Nem szeretnék gyerekeket", value: "no_kids", weight: 4 },
      { text: "Még nem döntöttem el", value: "undecided", weight: 5 }
    ]
  },
  {
    id: 3,
    question: "Milyen fontos számodra a vallás?",
    category: "Életszemlélet",
    options: [
      { text: "Nagyon fontos, gyakorló vagyok", value: "very_important", weight: 1 },
      { text: "Fontos, de nem gyakorlom aktívan", value: "somewhat_important", weight: 2 },
      { text: "Nem fontos", value: "not_important", weight: 3 },
      { text: "Ateista/agnosztikus vagyok", value: "atheist", weight: 4 },
      { text: "Más vallású vagyok", value: "different_religion", weight: 5 }
    ]
  },
  {
    id: 4,
    question: "Hogyan töltöd a szabadidődet?",
    category: "Életstílus",
    options: [
      { text: "Aktív sportolással, outdoor tevékenységekkel", value: "active_outdoor", weight: 1 },
      { text: "Otthon töltéssel, olvasással, filmekkel", value: "home_relaxation", weight: 2 },
      { text: "Barátokkal, szórakozással", value: "social_entertainment", weight: 3 },
      { text: "Munkával, tanulással", value: "work_study", weight: 4 },
      { text: "Művészeti tevékenységekkel", value: "artistic", weight: 5 }
    ]
  },
  {
    id: 5,
    question: "Milyen az ideális kapcsolatod?",
    category: "Kapcsolat",
    options: [
      { text: "Hagyományos, házasságközpontú", value: "traditional_marriage", weight: 1 },
      { text: "Modern, egyenlőségen alapuló", value: "modern_equal", weight: 2 },
      { text: "Nyitott, szabad kapcsolat", value: "open_relationship", weight: 3 },
      { text: "Könnyed, kötelezettségek nélküli", value: "casual", weight: 4 },
      { text: "Még keresem az ideálisat", value: "exploring", weight: 5 }
    ]
  },
  {
    id: 6,
    question: "Hogyan kezeled a konfliktusokat?",
    category: "Kommunikáció",
    options: [
      { text: "Nyíltan megbeszélem azonnal", value: "direct_immediate", weight: 1 },
      { text: "Várok egy kicsit, aztán megbeszélem", value: "wait_discuss", weight: 2 },
      { text: "Próbálom elkerülni a konfliktust", value: "avoid_conflict", weight: 3 },
      { text: "Emocionális vagyok, de megoldom", value: "emotional_resolved", weight: 4 },
      { text: "Mindenáron békét akarok", value: "peace_at_any_cost", weight: 5 }
    ]
  },
  {
    id: 7,
    question: "Milyen az anyagi helyzeted?",
    category: "Életstílus",
    options: [
      { text: "Jól állok anyagilag", value: "financially_secure", weight: 1 },
      { text: "Átlagos jövedelemmel rendelkezem", value: "average_income", weight: 2 },
      { text: "Diák vagyok, tanulok", value: "student", weight: 3 },
      { text: "Még keresem a helyem a munkaerőpiacon", value: "finding_job", weight: 4 },
      { text: "Anyagilag kihívásokkal küzdök", value: "financial_challenges", weight: 5 }
    ]
  },
  {
    id: 8,
    question: "Milyen fontos számodra a karrier?",
    category: "Karrier",
    options: [
      { text: "Nagyon fontos, ambiciózus vagyok", value: "very_important", weight: 1 },
      { text: "Fontos, de az élet többi része is számít", value: "balanced", weight: 2 },
      { text: "Nem prioritás, más dolgokra koncentrálok", value: "not_priority", weight: 3 },
      { text: "Inkább szabadúszó/alkotó vagyok", value: "creative_freelance", weight: 4 },
      { text: "Még keresem az utam", value: "exploring_career", weight: 5 }
    ]
  }
];

const CompatibilityQuestionsModal = ({ visible, onClose, onComplete, existingAnswers = {} }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(existingAnswers);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    if (currentQuestion < COMPATIBILITY_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
      if (onComplete) {
        onComplete(newAnswers);
      }
    }
  };

  const resetQuestions = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const progress = (currentQuestion + 1) / COMPATIBILITY_QUESTIONS.length;
  const question = COMPATIBILITY_QUESTIONS[currentQuestion];

  if (showResults) {
    const answeredCount = Object.keys(answers).length;
    const completionPercentage = Math.round((answeredCount / COMPATIBILITY_QUESTIONS.length) * 100);

    return (
      <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Kompatibilitási profil kész!</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.resultsContent}>
              <View style={styles.completionContainer}>
                <LinearGradient
                  colors={['#00D4FF', '#0099CC']}
                  style={styles.completionCircle}
                >
                  <Text style={styles.completionPercentage}>{completionPercentage}%</Text>
                  <Text style={styles.completionText}>kész</Text>
                </LinearGradient>
                <Text style={styles.completionDescription}>
                  {answeredCount}/{COMPATIBILITY_QUESTIONS.length} kérdés megválaszolva
                </Text>
              </View>

              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Előnyök:</Text>
                <View style={styles.benefitsList}>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#00D4FF" />
                    <Text style={styles.benefitText}>Jobb match-ek</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#00D4FF" />
                    <Text style={styles.benefitText}>Kompatibilitási pontszámok</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#00D4FF" />
                    <Text style={styles.benefitText}>Jobb beszélgetések</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.resultsFooter}>
              <TouchableOpacity style={styles.retakeButton} onPress={resetQuestions}>
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
                {currentQuestion + 1} / {COMPATIBILITY_QUESTIONS.length}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{question.category}</Text>
            </View>

            <Text style={styles.question}>{question.question}</Text>

            <View style={styles.optionsContainer}>
              {question.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswer(question.id, option)}
                >
                  <Text style={styles.optionText}>{option.text}</Text>
                  <View style={styles.optionArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#00D4FF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 Ezek a válaszok segítenek megtalálni a hozzád illő partnereket!
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
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00D4FF',
  },
  categoryText: {
    color: '#00D4FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  question: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
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
  optionArrow: {
    marginLeft: 12,
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
  completionContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  completionCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionPercentage: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  completionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completionDescription: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  benefitsContainer: {
    marginTop: 20,
  },
  benefitsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    color: '#ccc',
    fontSize: 16,
    marginLeft: 12,
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

export default CompatibilityQuestionsModal;
