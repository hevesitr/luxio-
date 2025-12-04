import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const WebViewScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { url, title } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const webViewRef = React.useRef(null);

  if (!url) {
    Alert.alert('Hiba', 'Nincs megadva URL.');
    navigation.goBack();
    return null;
  }

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setLoading(navState.loading);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    Alert.alert(
      'Hiba',
      'Nem sikerült betölteni az oldalt. Kérjük, próbáld újra később.',
      [{ text: 'Rendben', onPress: () => navigation.goBack() }]
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {loading && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />}
          <View style={styles.headerTitle}>
            {title ? (
              <Text style={styles.headerTitleText} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <Text style={styles.headerTitleText} numberOfLines={1}>
                Dokumentáció
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          {canGoBack && (
            <TouchableOpacity
              onPress={() => webViewRef.current?.goBack()}
              style={styles.headerButton}
            >
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          {canGoForward && (
            <TouchableOpacity
              onPress={() => webViewRef.current?.goForward()}
              style={styles.headerButton}
            >
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        // Security settings
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // iOS specific
        allowsBackForwardNavigationGestures={true}
        // Android specific
        androidHardwareAccelerationDisabled={false}
      />
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
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default WebViewScreen;

