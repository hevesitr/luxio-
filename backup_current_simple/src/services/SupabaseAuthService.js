import Constants from 'expo-constants';
import { supabase } from './supabaseClient';

const extra =
  Constants?.expoConfig?.extra ||
  Constants?.manifest?.extra ||
  {};

const DEFAULT_REDIRECT =
  extra?.SUPABASE_REDIRECT_URL || 'https://hevesitr.github.io/luxio-/';

const sanitizeArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

export const SupabaseAuthService = {
  async signUpUser({
    name,
    email,
    password,
    phone,
    gender,
    lookingFor,
    birthDate,
    consents = {},
  }) {
    const payload = {
      email,
      password,
      options: {
        emailRedirectTo: DEFAULT_REDIRECT,
        data: {
          full_name: name,
          phone,
          gender,
          looking_for: sanitizeArray(lookingFor),
          birth_date: birthDate,
          consent_terms: !!consents.terms,
          consent_privacy: !!consents.privacy,
          consent_marketing: !!consents.marketing,
          consent_analytics: !!consents.analytics,
        },
      },
    };

    const { data, error } = await supabase.auth.signUp(payload);
    if (error) {
      throw error;
    }
    return data;
  },

  async signInUser({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return true;
  },

  async sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: DEFAULT_REDIRECT,
    });
    if (error) {
      throw error;
    }
    return true;
  },

  async upsertProfile(profile) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  },
};


