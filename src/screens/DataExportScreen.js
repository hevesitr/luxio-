import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AccountService from '../services/AccountService';
import StorageService from '../services/StorageService';
import Logger from '../services/Logger';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api/v1'
  : 'https://api.datingapp.com/api/v1';

const DataExportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [exportRequest, setExportRequest] = useState(null);
  const [recentExports, setRecentExports] = useState([]);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [exportedData, setExportedData] = useState(null);
  const [exportDate, setExportDate] = useState(null);

  // Load existing export requests on mount
  useEffect(() => {
    loadExistingExports();
  }, []);

  const loadExistingExports = async () => {
    if (!user?.id) return;

    try {
      const status = await AccountService.getAccountStatus(user.id);
      setRecentExports(status.recentExports || []);

      // Check if there's an active export request
      const activeExport = status.recentExports?.find(exp =>
        exp.status === 'processing' || exp.status === 'pending'
      );
      if (activeExport) {
        setExportRequest(activeExport);
        // Start polling for status updates
        startStatusPolling(activeExport.id);
      }
    } catch (error) {
      Logger.error('Failed to load existing exports', error);
    }
  };

  const startStatusPolling = (exportId) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await AccountService.getAccountStatus(user.id);
        const currentExport = status.recentExports?.find(exp => exp.id === exportId);

        if (currentExport && (currentExport.status === 'completed' || currentExport.status === 'failed')) {
          setExportRequest(currentExport);
          setRecentExports(status.recentExports || []);
          clearInterval(pollInterval);
        }
      } catch (error) {
        Logger.error('Failed to poll export status', error);
        clearInterval(pollInterval);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
  };

  const handleRequestExport = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await AccountService.requestDataExport(user.id);

      if (result.success) {
        setExportRequest(result.exportRequest);
        startStatusPolling(result.exportRequest.id);

        Alert.alert(
          'Export kérés elküldve',
          'Az adat export folyamatban van. Értesítést kapsz, amikor elkészül.',
          [{ text: 'Rendben' }]
        );

        Logger.info('Data export requested from UI', { userId: user.id });
      } else {
        throw new Error(result.error || 'Ismeretlen hiba');
      }
    } catch (error) {
      Logger.error('Data export request failed', error);
      Alert.alert('Hiba', 'Nem sikerült elküldeni az export kérést. Próbáld újra.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (exportData) => {
    if (!exportData.download_url) return;

    try {
      await Linking.openURL(exportData.download_url);
      Logger.info('Export download opened', { exportId: exportData.id });
    } catch (error) {
      Logger.error('Failed to open export download', error);
      Alert.alert('Hiba', 'Nem sikerült megnyitni a letöltési linket.');
    }
  };

  const handleShareExport = async (exportData) => {
    if (!exportData.download_url) return;

    try {
      await Share.share({
        message: `LoveX adat export - Letöltési link: ${exportData.download_url}`,
        url: exportData.download_url,
      });
      Logger.info('Export shared', { exportId: exportData.id });
    } catch (error) {
      Logger.error('Failed to share export', error);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = await StorageService.getToken();
      
      if (!token) {
        Alert.alert('Hiba', 'Nincs bejelentkezve.');
        navigation.goBack();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/gdpr/data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setExportedData(result.data);
        setExportDate(new Date().toLocaleString('hu-HU'));
        
        Alert.alert(
          'Siker',
          'Adataid sikeresen exportálva. Megoszthatod vagy letöltheted a fájlt.',
          [
            { text: 'Rendben' },
            {
              text: 'Megosztás',
              onPress: handleShare,
            },
          ]
        );
      } else {
        throw new Error(result.error?.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Hiba', 'Hiba történt az adatok exportálása során.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!exportedData) {
      Alert.alert('Hiba', 'Nincs exportált adat.');
      return;
    }

    try {
      const jsonString = JSON.stringify(exportedData, null, 2);
      
      await Share.share({
        message: jsonString,
        title: 'Adataim exportálása',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Hiba', 'Hiba történt a megosztás során.');
    }
  };

  const handleDownload = () => {
    // TODO: Implement file download
    Alert.alert('Info', 'Letöltési funkció hamarosan elérhető.');
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adataim Exportálása</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            A GDPR (General Data Protection Regulation) szerint jogod van hozzáférni az összes adatodhoz.
            Ez az export tartalmazza az összes adatodat JSON formátumban.
          </Text>
        </View>

        {exportedData ? (
          <View style={styles.exportedBox}>
            <View style={styles.exportedHeader}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success || '#4CAF50'} />
              <View style={styles.exportedHeaderText}>
                <Text style={styles.exportedTitle}>Adatok exportálva</Text>
                <Text style={styles.exportedDate}>{exportDate}</Text>
              </View>
            </View>

            <View style={styles.dataSection}>
              <Text style={styles.sectionTitle}>Felhasználói Adatok</Text>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Név:</Text>
                <Text style={styles.dataValue}>{exportedData.user?.name || 'N/A'}</Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Email:</Text>
                <Text style={styles.dataValue}>{exportedData.user?.email || 'N/A'}</Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Regisztráció dátuma:</Text>
                <Text style={styles.dataValue}>
                  {exportedData.user?.createdAt 
                    ? new Date(exportedData.user.createdAt).toLocaleDateString('hu-HU')
                    : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.dataSection}>
              <Text style={styles.sectionTitle}>Profil Adatok</Text>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Bemutatkozás:</Text>
                <Text style={styles.dataValue}>{exportedData.profile?.bio || 'Nincs'}</Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Érdeklődési körök:</Text>
                <Text style={styles.dataValue}>
                  {exportedData.profile?.interests?.join(', ') || 'Nincs'}
                </Text>
              </View>
            </View>

            <View style={styles.dataSection}>
              <Text style={styles.sectionTitle}>Statisztikák</Text>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Matchek száma:</Text>
                <Text style={styles.dataValue}>
                  {exportedData.matches?.length || 0}
                </Text>
              </View>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Üzenetek száma:</Text>
                <Text style={styles.dataValue}>
                  {exportedData.messages?.length || 0}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Megosztás</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownload}
              >
                <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Letöltés</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={theme.colors.warning || '#FF9800'} />
              <Text style={styles.warningText}>
                Figyelem: Ez a fájl érzékeny adatokat tartalmaz. Tartsd biztonságban és ne oszd meg senkivel.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              Még nincs exportált adat. Kattints az "Adatok Exportálása" gombra, hogy letöltsd az összes adatodat.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportButton, loading && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.exportButtonGradient}
            >
              <Ionicons name="download" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.exportButtonText}>
                {exportedData ? 'Újra Exportálás' : 'Adatok Exportálása'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
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
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  exportedBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exportedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  exportedHeaderText: {
    marginLeft: 12,
  },
  exportedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  exportedDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  dataSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  dataItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    width: 140,
  },
  dataValue: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warningBackground || '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.warning || '#856404',
    marginLeft: 8,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DataExportScreen;

