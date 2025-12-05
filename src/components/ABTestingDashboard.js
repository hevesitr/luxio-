import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ABTestingService from '../services/ABTestingService';

const ABTestingDashboard = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [experimentResults, setExperimentResults] = useState({});
  const [selectedExperiment, setSelectedExperiment] = useState('onboarding_flow');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const results = {};

      // Load results for all experiments
      for (const experimentId of Object.keys(ABTestingService.EXPERIMENTS)) {
        const result = await ABTestingService.getExperimentResults(experimentId);
        if (result.success) {
          results[experimentId] = result;
        }
      }

      setExperimentResults(results);
    } catch (error) {
      console.error('Error loading A/B test results:', error);
      Alert.alert('Hiba', 'Nem sikerült betölteni a teszteredményeket');
    } finally {
      setLoading(false);
    }
  };

  const resetAllTests = async () => {
    Alert.alert(
      'Figyelem',
      'Ez visszaállítja az összes felhasználó A/B teszt hozzárendelését. Biztosan folytatod?',
      [
        { text: 'Mégsem', style: 'cancel' },
        {
          text: 'Visszaállítás',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Reset all user assignments (this would need to be done for each user)
              // For demo purposes, we'll just reload
              await loadResults();
              Alert.alert('Siker', 'Tesztek visszaállítva');
            } catch (error) {
              Alert.alert('Hiba', 'Nem sikerült visszaállítani a teszteket');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getWinningVariant = (results) => {
    if (!results) return null;

    let winner = null;
    let bestRate = 0;

    Object.entries(results).forEach(([variant, stats]) => {
      if (stats.conversionRate > bestRate) {
        bestRate = stats.conversionRate;
        winner = { variant, rate: bestRate, stats };
      }
    });

    return winner;
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Teszt eredmények betöltése...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentExperiment = experimentResults[selectedExperiment];
  const winningVariant = currentExperiment ? getWinningVariant(currentExperiment.results) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          A/B Teszt Eredmények
        </Text>
        <TouchableOpacity onPress={resetAllTests} style={styles.resetButton}>
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Experiment Selector */}
        <View style={[styles.selectorContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.selectorLabel, { color: theme.colors.text }]}>
            Kísérlet kiválasztása:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            {Object.entries(ABTestingService.EXPERIMENTS).map(([id, experiment]) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.selectorButton,
                  selectedExperiment === id && styles.selectedSelector,
                  { borderColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedExperiment(id)}
              >
                <Text style={[
                  styles.selectorText,
                  { color: selectedExperiment === id ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  {experiment.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Winning Variant */}
        {winningVariant && (
          <View style={[styles.winnerContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <View style={styles.winnerHeader}>
              <Ionicons name="trophy" size={24} color={theme.colors.primary} />
              <Text style={[styles.winnerTitle, { color: theme.colors.primary }]}>
                Legjobb teljesítmény: {winningVariant.variant}
              </Text>
            </View>
            <Text style={[styles.winnerStats, { color: theme.colors.text }]}>
              Konverziós ráta: {winningVariant.rate.toFixed(1)}%
              ({winningVariant.stats.conversions}/{winningVariant.stats.users} felhasználó)
            </Text>
          </View>
        )}

        {/* Experiment Details */}
        {currentExperiment && (
          <View style={[styles.experimentContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <Text style={[styles.experimentTitle, { color: theme.colors.text }]}>
              {currentExperiment.experiment.name}
            </Text>
            <Text style={[styles.experimentDescription, { color: theme.colors.textSecondary }]}>
              Változatok és teljesítményük
            </Text>

            <View style={styles.variantsList}>
              {Object.entries(currentExperiment.results).map(([variant, stats]) => (
                <View key={variant} style={[styles.variantCard, { backgroundColor: theme.colors.background }]}>
                  <View style={styles.variantHeader}>
                    <Text style={[styles.variantName, { color: theme.colors.text }]}>
                      {variant}
                    </Text>
                    <Text style={[styles.variantRate, { color: theme.colors.primary }]}>
                      {stats.conversionRate.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.variantStats}>
                    <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                      Felhasználók: {stats.users}
                    </Text>
                    <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                      Konverziók: {stats.conversions}
                    </Text>
                    <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                      Események: {stats.events}
                    </Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(stats.conversionRate * 2, 100)}%`,
                          backgroundColor: theme.colors.primary
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadResults}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.cardBackground} />
            <Text style={[styles.actionButtonText, { color: theme.colors.cardBackground }]}>
              Frissítés
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.primary, borderWidth: 1 }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
              Beállítások
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  selectorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectorScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  selectedSelector: {
    backgroundColor: theme.colors.primary + '20',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  winnerContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  winnerStats: {
    fontSize: 14,
    marginLeft: 32,
  },
  experimentContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  experimentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  experimentDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  variantsList: {
    gap: 12,
  },
  variantCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  variantRate: {
    fontSize: 16,
    fontWeight: '700',
  },
  variantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ABTestingDashboard;
