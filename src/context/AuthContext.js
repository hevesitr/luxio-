import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { SupabaseAuthService } from '../services/SupabaseAuthService';
import AuthService from '../services/AuthService';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  hasCompletedOnboarding: false,
  refreshProfile: () => {},
  completeOnboarding: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
});

const buildProfilePayload = (user, fallback = {}) => {
  const metadata = user?.user_metadata || {};

  return {
    id: user?.id,
    email: user?.email,
    full_name: metadata.full_name || fallback.full_name || '',
    gender: metadata.gender || fallback.gender || null,
    birth_date: metadata.birth_date || fallback.birth_date || null,
    looking_for: metadata.looking_for || fallback.looking_for || [],
    phone: metadata.phone || fallback.phone || null,
    consent_terms:
      metadata.consent_terms ??
      fallback.consent_terms ??
      false,
    consent_privacy:
      metadata.consent_privacy ??
      fallback.consent_privacy ??
      false,
    consent_marketing:
      metadata.consent_marketing ??
      fallback.consent_marketing ??
      false,
    consent_analytics:
      metadata.consent_analytics ??
      fallback.consent_analytics ??
      false,
  };
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const loadProfile = useCallback(
    async (currentUser) => {
      if (!currentUser) {
        setProfile(null);
        return;
      }

      try {
        let profileData = await SupabaseAuthService.fetchProfile(
          currentUser.id
        );

        if (!profileData) {
          profileData = await SupabaseAuthService.upsertProfile(
            buildProfilePayload(currentUser)
          );
        }

        setProfile(profileData);

        // Check onboarding status
        const onboardingCompleted = profileData?.onboarding_completed || false;
        setHasCompletedOnboarding(onboardingCompleted);
      } catch (error) {
        console.warn('AuthContext: profile load failed', error.message);
      }
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user);
      }
      setLoading(false);
    };

    init();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const handleSignOut = async () => {
    await SupabaseAuthService.signOut();
    setProfile(null);
    setHasCompletedOnboarding(false);
  };

  const handleCompleteOnboarding = async () => {
    if (!session?.user) return;

    try {
      await SupabaseAuthService.upsertProfile({
        id: session.user.id,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      });

      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const handleSignUp = async (email, password, profileData) => {
    try {
      const result = await AuthService.signUp({
        email,
        password,
        profileData: {
          firstName: profileData.full_name,
          age: profileData.birth_date ? new Date().getFullYear() - new Date(profileData.birth_date).getFullYear() : null,
          gender: profileData.gender,
          bio: '',
          location: null,
          phone: profileData.phone,
          lookingFor: profileData.looking_for,
          birthDate: profileData.birth_date,
        }
      });

      if (result.success) {
        // Load the new profile
        await loadProfile(result.user);
        return { success: true, requiresEmailConfirmation: !result.user?.email_confirmed_at };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('SignUp failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    hasCompletedOnboarding,
    refreshProfile: () =>
      session?.user ? loadProfile(session.user) : Promise.resolve(),
    completeOnboarding: handleCompleteOnboarding,
    signUp: handleSignUp,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


