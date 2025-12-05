/**
 * useEmailVerification - Custom hook email verifikáció kezeléséhez
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EmailService from '../services/EmailService';
import Logger from '../services/Logger';

export const useEmailVerification = () => {
  const { user, isAuthenticated } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState({
    verified: false,
    checking: true,
    emailConfirmedAt: null,
    error: null
  });

  // Email verifikáció státuszának ellenőrzése
  const checkVerificationStatus = useCallback(async () => {
    if (!user?.id) {
      setVerificationStatus({
        verified: false,
        checking: false,
        emailConfirmedAt: null,
        error: null
      });
      return;
    }

    try {
      setVerificationStatus(prev => ({ ...prev, checking: true, error: null }));

      const status = await EmailService.checkEmailVerificationStatus();

      setVerificationStatus({
        verified: status.verified || false,
        checking: false,
        emailConfirmedAt: status.emailConfirmedAt,
        error: status.error || null
      });

      Logger.info('Email verification status checked', {
        userId: user.id,
        verified: status.verified
      });

    } catch (error) {
      Logger.error('Failed to check email verification status', error);

      setVerificationStatus({
        verified: false,
        checking: false,
        emailConfirmedAt: null,
        error: error.message
      });
    }
  }, [user?.id]);

  // Verifikációs email újraküldése
  const resendVerificationEmail = useCallback(async () => {
    if (!user?.email) {
      throw new Error('Nincs elérhető email cím');
    }

    try {
      const result = await EmailService.resendVerificationEmail(user.email);

      if (!result.success) {
        throw new Error(result.error || 'Ismeretlen hiba');
      }

      Logger.info('Verification email resent via hook', { userId: user.id });

      return result;
    } catch (error) {
      Logger.error('Failed to resend verification email via hook', error);
      throw error;
    }
  }, [user?.email, user?.id]);

  // Password reset email küldése
  const sendPasswordResetEmail = useCallback(async () => {
    if (!user?.email) {
      throw new Error('Nincs elérhető email cím');
    }

    try {
      const result = await EmailService.sendPasswordResetEmail(user.email);

      if (!result.success) {
        throw new Error(result.error || 'Ismeretlen hiba');
      }

      Logger.info('Password reset email sent via hook', { userId: user.id });

      return result;
    } catch (error) {
      Logger.error('Failed to send password reset email via hook', error);
      throw error;
    }
  }, [user?.email, user?.id]);

  // Email token verifikálása
  const verifyEmailToken = useCallback(async (token) => {
    try {
      const result = await EmailService.verifyEmailToken(token);

      if (result.success) {
        // Státusz frissítése
        await checkVerificationStatus();
        Logger.info('Email token verified successfully', { userId: result.user?.id });
      }

      return result;
    } catch (error) {
      Logger.error('Failed to verify email token', error);
      throw error;
    }
  }, [checkVerificationStatus]);

  // Automatikus ellenőrzés bejelentkezéskor vagy user változáskor
  useEffect(() => {
    if (isAuthenticated && user) {
      checkVerificationStatus();
    } else {
      setVerificationStatus({
        verified: false,
        checking: false,
        emailConfirmedAt: null,
        error: null
      });
    }
  }, [isAuthenticated, user, checkVerificationStatus]);

  return {
    // Státusz
    isVerified: verificationStatus.verified,
    isChecking: verificationStatus.checking,
    emailConfirmedAt: verificationStatus.emailConfirmedAt,
    error: verificationStatus.error,

    // Műveletek
    checkVerificationStatus,
    resendVerificationEmail,
    sendPasswordResetEmail,
    verifyEmailToken,

    // Segédfunkciók
    needsVerification: !verificationStatus.verified && !verificationStatus.checking,
    canResendEmail: user?.email && !verificationStatus.checking,
  };
};

export default useEmailVerification;
