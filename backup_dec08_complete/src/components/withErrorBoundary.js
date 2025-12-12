/**
 * Higher Order Component for Error Boundary
 * Automatikusan hozzáadja a hibakezelést bármely képernyőhöz
 */
import React from 'react';
import ScreenErrorBoundary from './ScreenErrorBoundary';

/**
 * HOC that wraps a screen component with error boundary
 * @param {React.Component} ScreenComponent - The screen component to wrap
 * @param {string} screenName - Name of the screen for logging
 * @returns {React.Component} Wrapped component with error boundary
 * 
 * @example
 * export default withErrorBoundary(BoostScreen, 'BoostScreen');
 */
const withErrorBoundary = (ScreenComponent, screenName) => {
  return (props) => (
    <ScreenErrorBoundary
      screenName={screenName}
      navigation={props.navigation}
      onRetry={() => {
        // Force re-render by updating a key
        if (props.navigation) {
          props.navigation.setParams({ _errorBoundaryKey: Date.now() });
        }
      }}
    >
      <ScreenComponent {...props} />
    </ScreenErrorBoundary>
  );
};

export default withErrorBoundary;
