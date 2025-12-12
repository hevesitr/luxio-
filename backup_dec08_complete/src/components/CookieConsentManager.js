import React from 'react';
import { View } from 'react-native';
import CookieConsentBanner from './CookieConsentBanner';
import useCookieConsent from '../hooks/useCookieConsent';

const CookieConsentManager = () => {
  const {
    showBanner,
    loading,
    acceptAllCookies,
    acceptNecessaryOnly,
    declineCookies,
    hideBanner,
  } = useCookieConsent();

  return (
    <CookieConsentBanner
      visible={showBanner}
      onAccept={acceptAllCookies}
      onDecline={acceptNecessaryOnly}
    />
  );
};

export default CookieConsentManager;
