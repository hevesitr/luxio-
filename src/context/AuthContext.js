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
    // #region agent log - AuthProvider init start
    console.log('[AuthProvider] Initializing auth...');
    fetch('http://127.0.0.1:7242/ingest/022fb2c2-86a2-4f93-ba8d-988a08e55344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/context/AuthContext.js:89',message:'AuthProvider init start',data:{loading:loading},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-stuck-run',hypothesisId:'L2'})}).catch(()=>{});
    // #endregion

    // Check if we're in demo mode (no Supabase credentials)
    const isDemoMode = !supabase || typeof supabase.auth?.getSession !== 'function';

    if (isDemoMode) {
      console.log('🔒 Demo mode: Auth initialization');
      // In demo mode, simulate successful auth
      setSession({ user: { id: 'demo-user', email: 'demo@luxio.app' } });
      setLoading(false);
      // #region agent log - Demo mode complete
      fetch('http://127.0.0.1:7242/ingest/022fb2c2-86a2-4f93-ba8d-988a08e55344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/context/AuthContext.js:89',message:'Demo mode auth complete',data:{demoMode:true,loading:false},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-stuck-run',hypothesisId:'L6'})}).catch(()=>{});
      // #endregion
      return; // Exit early, no need for real auth listener
    }

    const init = async () => {
      try {
        console.log('[AuthProvider] Getting session...');
        const { data } = await supabase.auth.getSession();
        console.log('[AuthProvider] Session result:', !!data.session);
        setSession(data.session);
        if (data.session?.user) {
          console.log('[AuthProvider] Loading profile...');
          await loadProfile(data.session.user);
        }
        console.log('[AuthProvider] Setting loading to false');
        setLoading(false);
        // #region agent log - AuthProvider init complete
        fetch('http://127.0.0.1:7242/ingest/022fb2c2-86a2-4f93-ba8d-988a08e55344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/context/AuthContext.js:89',message:'AuthProvider init complete',data:{hasSession:!!data.session,loading:false},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-stuck-run',hypothesisId:'L3'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        console.error('[AuthProvider] Init error:', error);
        setLoading(false);
        // #region agent log - AuthProvider init error
        fetch('http://127.0.0.1:7242/ingest/022fb2c2-86a2-4f93-ba8d-988a08e55344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/context/AuthContext.js:89',message:'AuthProvider init error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-stuck-run',hypothesisId:'L4'})}).catch(()=>{});
        // #endregion
      }
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


