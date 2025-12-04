import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const IceBreakerSuggestions = ({ iceBreakers, onSelectQuestion }) => {
  if (!iceBreakers || iceBreakers.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Beszélgetés Indítók</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {iceBreakers.map((iceBreaker, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.card,
              { borderLeftColor: getTypeColor(iceBreaker.type), borderLeftWidth: 4 }
            ]}
            onPress={() => onSelectQuestion(iceBreaker.question)}
          >
            <Text style={styles.icon}>{iceBreaker.icon}</Text>
            {iceBreaker.interest && (
              <Text style={styles.interest}>{iceBreaker.interest}</Text>
            )}
            <Text style={styles.question}>{iceBreaker.question}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getTypeLabel(iceBreaker.type)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const getTypeColor = (type) => {
  const colors = {
    'interest': '#FF3B75',
    'general': '#2196F3',
    'fun': '#FFC107',
    'deeper': '#9C27B0',
  };
  return colors[type] || '#999';
};

const getTypeLabel = (type) => {
  const labels = {
    'interest': 'Közös érdeklődés',
    'general': 'Általános',
    'fun': 'Vicces',
    'deeper': 'Mélyebb',
  };
  return labels[type] || 'Kérdés';
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  scrollView: {
    flexDirection: 'row',
  },
  card: {
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 15,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  interest: {
    fontSize: 12,
    color: '#FF3B75',
    fontWeight: '600',
    marginBottom: 6,
  },
  question: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
});

export default IceBreakerSuggestions;

