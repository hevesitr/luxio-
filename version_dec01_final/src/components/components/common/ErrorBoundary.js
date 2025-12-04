/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logger from '../../services/Logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    Logger.error('Error Boundary caught error', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          
          <Text style={styles.title}>Oops! Something went wrong</Text>
          
          <Text style={styles.message}>
            We're sorry for the inconvenience. Please try again.
          </Text>
          
          {__DEV__ && this.state.error && (
            <Text style={styles.error}>
              {this.state.error.toString()}
            </Text>
          )}
          
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  error: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
