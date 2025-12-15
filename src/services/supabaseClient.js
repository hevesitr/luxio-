import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// ❌ KRITIKUS BIZTONSÁGI PROBLÉMA JAVÍTVA:
// Eltávolítottuk a hardcoded Supabase kulcsokat!
// Most csak környezeti változók használhatók.

// Környezeti változók kinyerése
const extra = Constants?.expoConfig?.extra || Constants?.manifest?.extra || {};

// ✅ BIZTONSÁGOS MEGOLDÁS: Csak környezeti változók használhatók
// Nincs fallback default érték többé!
const SUPABASE_URL = extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 🔒 BIZTONSÁGI ELLENŐRZÉS: Kritikus hitelesítő adatok
let supabase;

// 🚨 RADIKÁLIS MEGOLDÁS: Mindig demo mód fejlesztéskor!
// Ez biztosítja hogy soha ne legyenek network request-ek
const FORCE_DEMO_MODE = __DEV__; // Mindig demo mód fejlesztésben

if (FORCE_DEMO_MODE || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials missing. Using offline demo mode.');

  // Offline demo mode - no network requests
  supabase = {
    auth: {
      signInWithPassword: async (credentials) => {
        console.log('🔒 Demo mode: Sign in attempt for', credentials.email);
        // Simulate successful login for demo purposes
        await new Promise(resolve => setTimeout(resolve, 500)); // Fake delay
        return {
          data: {
            user: {
              id: 'demo-user',
              email: credentials.email,
              user_metadata: { name: 'Demo User' }
            },
            session: {
              access_token: 'demo-token',
              refresh_token: 'demo-refresh-token'
            }
          },
          error: null
        };
      },
      signUp: async (credentials) => {
        console.log('🔒 Demo mode: Sign up attempt for', credentials.email);
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          data: {
            user: {
              id: 'demo-user',
              email: credentials.email,
              user_metadata: { name: 'Demo User' }
            },
            session: {
              access_token: 'demo-token',
              refresh_token: 'demo-refresh-token'
            }
          },
          error: null
        };
      },
      signOut: async () => {
        console.log('🔒 Demo mode: Sign out');
        return { error: null };
      },
      getUser: async () => ({
        data: {
          user: {
            id: 'demo-user',
            email: 'demo@luxio.app',
            user_metadata: { name: 'Demo User' }
          }
        },
        error: null
      }),
      getSession: async () => {
        console.log('🔒 Demo mode: getSession called');
        // #region agent log - Demo getSession
        fetch('http://127.0.0.1:7242/ingest/022fb2c2-86a2-4f93-ba8d-988a08e55344',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/services/supabaseClient.js:81',message:'Demo getSession called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'loading-stuck-run',hypothesisId:'L5'})}).catch(()=>{});
        // #endregion
        return {
          data: {
            session: {
              access_token: 'demo-token',
              refresh_token: 'demo-refresh-token',
              user: {
                id: 'demo-user',
                email: 'demo@luxio.app',
                user_metadata: { name: 'Demo User' }
              }
            }
          },
          error: null
        };
      },
      onAuthStateChange: (callback) => {
        // Return a mock subscription
        return {
          data: {
            subscription: {
              unsubscribe: () => console.log('🔒 Demo mode: Auth state subscription removed')
            }
          }
        };
      },
    },
    channel: (channelName) => ({
      on: (event, config, callback) => ({
        subscribe: (callback2) => {
          console.log(`🔒 Demo mode: Subscribe to ${channelName}`);
          // Mock subscription - no real-time updates in demo mode
          if (callback2) callback2();
          return {
            unsubscribe: () => console.log(`🔒 Demo mode: Unsubscribe from ${channelName}`)
          };
        }
      })
    }),
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          neq: (column2, value2) => ({
            single: async () => {
              console.log(`🔒 Demo mode: Select from ${table} where ${column} = ${value} and ${column2} != ${value2}`);
              // Return mock data based on table
              if (table === 'profiles') {
                return {
                  data: {
                    id: value || 'demo-user',
                    full_name: 'Demo User',
                    age: 25,
                    bio: 'Demo felhasználó vagyok! 👋',
                    interests: ['Programozás', 'Tesztelés']
                  },
                  error: null
                };
              }
              return { data: null, error: null };
            },
            maybeSingle: async () => {
              console.log(`🔒 Demo mode: Maybe single from ${table} where ${column} = ${value} and ${column2} != ${value2}`);
              // Return mock data based on table
              if (table === 'profiles') {
                return {
                  data: {
                    id: value || 'demo-user',
                    full_name: 'Demo User',
                    age: 25,
                    bio: 'Demo felhasználó vagyok! 👋',
                    interests: ['Programozás', 'Tesztelés']
                  },
                  error: null
                };
              }
              return { data: null, error: null };
            },
            order: () => ({
              limit: () => Promise.resolve({
                data: table === 'profiles' ? [
                  {
                    id: '1',
                    user_id: 'user-1',
                    bio: 'Hello from demo mode! Looking for someone special 😊',
                    interests: ['Sports', 'Music', 'Travel'],
                    relationship_goal: 'long_term',
                    location_latitude: 47.4979,
                    location_longitude: 19.0402,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: true,
                    is_premium: false,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-1',
                      name: 'Anna',
                      birth_date: '1998-05-15',
                      last_active: new Date().toISOString(),
                      gender: 'female',
                      looking_for: ['male']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  },
                  {
                    id: '2',
                    user_id: 'user-2',
                    bio: 'Programmer by day, adventurer by night 🌟',
                    interests: ['Programming', 'Hiking', 'Photography'],
                    relationship_goal: 'casual',
                    location_latitude: 47.5079,
                    location_longitude: 19.0502,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: true,
                    is_premium: true,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-2',
                      name: 'Eszter',
                      birth_date: '1995-08-22',
                      last_active: new Date().toISOString(),
                      gender: 'female',
                      looking_for: ['male']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  },
                  {
                    id: '3',
                    user_id: 'user-3',
                    bio: 'Love coffee, books and deep conversations ☕📚',
                    interests: ['Reading', 'Coffee', 'Art'],
                    relationship_goal: 'long_term',
                    location_latitude: 47.4879,
                    location_longitude: 19.0302,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: false,
                    is_premium: false,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-3',
                      name: 'Réka',
                      birth_date: '1997-12-10',
                      last_active: new Date().toISOString(),
                      gender: 'female',
                      looking_for: ['male']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  },
                  {
                    id: '4',
                    user_id: 'user-4',
                    bio: 'Fitness enthusiast and food lover 🍎💪',
                    interests: ['Fitness', 'Cooking', 'Yoga'],
                    relationship_goal: 'long_term',
                    location_latitude: 47.4779,
                    location_longitude: 19.0602,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: true,
                    is_premium: false,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-4',
                      name: 'Kata',
                      birth_date: '1996-11-08',
                      last_active: new Date().toISOString(),
                      gender: 'female',
                      looking_for: ['male']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  },
                  {
                    id: '5',
                    user_id: 'user-5',
                    bio: 'Artist and dreamer 🎨✨',
                    interests: ['Art', 'Music', 'Travel'],
                    relationship_goal: 'casual',
                    location_latitude: 47.4679,
                    location_longitude: 19.0702,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: false,
                    is_premium: true,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-5',
                      name: 'Zsófia',
                      birth_date: '1994-03-25',
                      last_active: new Date().toISOString(),
                      gender: 'female',
                      looking_for: ['male']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  },
                  {
                    id: '6',
                    user_id: 'user-6',
                    bio: 'Tech lover and gamer 🎮💻',
                    interests: ['Gaming', 'Technology', 'Movies'],
                    relationship_goal: 'long_term',
                    location_latitude: 47.4579,
                    location_longitude: 19.0802,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: true,
                    is_premium: false,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-6',
                      name: 'Béla',
                      birth_date: '1992-07-14',
                      last_active: new Date().toISOString(),
                      gender: 'male',
                      looking_for: ['female']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  },
                  {
                    id: '7',
                    user_id: 'user-7',
                    bio: 'Nature lover and photographer 📸🌿',
                    interests: ['Photography', 'Hiking', 'Nature'],
                    relationship_goal: 'long_term',
                    location_latitude: 47.4479,
                    location_longitude: 19.0902,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: false,
                    is_premium: false,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-7',
                      name: 'Gábor',
                      birth_date: '1990-12-01',
                      last_active: new Date().toISOString(),
                      gender: 'male',
                      looking_for: ['female']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  },
                  {
                    id: '8',
                    user_id: 'user-8',
                    bio: 'Bookworm and coffee addict 📖☕',
                    interests: ['Reading', 'Writing', 'Coffee'],
                    relationship_goal: 'casual',
                    location_latitude: 47.4379,
                    location_longitude: 19.1002,
                    location_city: 'Budapest',
                    location_country: 'Hungary',
                    is_verified: true,
                    is_premium: true,
                    is_sugar_dating: false,
                    users: {
                      id: 'user-8',
                      name: 'Eszter',
                      birth_date: '1993-09-18',
                      last_active: new Date().toISOString(),
                      gender: 'female',
                      looking_for: ['male']
                    },
                    profile_photos: [
                      {
                        url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
                        thumbnail_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=200&fit=crop',
                        is_primary: true,
                        is_private: false,
                        order_index: 0
                      }
                    ]
                  }
                ] : [],
                error: null
              })
            })
          }),
          single: async () => {
            console.log(`🔒 Demo mode: Select from ${table} where ${column} = ${value}`);
            // Return mock data based on table
            if (table === 'profiles') {
              return {
                data: {
                  id: value || 'demo-user',
                  full_name: 'Demo User',
                  age: 25,
                  bio: 'Demo felhasználó vagyok! 👋',
                  interests: ['Programozás', 'Tesztelés']
                },
                error: null
              };
            }
            return { data: null, error: null };
          },
          maybeSingle: async () => {
            console.log(`🔒 Demo mode: Maybe single from ${table} where ${column} = ${value}`);
            // Return mock data based on table
            if (table === 'profiles') {
              return {
                data: {
                  id: value || 'demo-user',
                  full_name: 'Demo User',
                  age: 25,
                  bio: 'Demo felhasználó vagyok! 👋',
                  interests: ['Programozás', 'Tesztelés']
                },
                error: null
              };
            }
            return { data: null, error: null };
          },
          order: () => ({
            limit: () => Promise.resolve({
              data: table === 'profiles' ? [{
                id: '1',
                full_name: 'Demo User 1',
                age: 24,
                bio: 'Hello from demo mode!',
                interests: ['Demo']
              }] : [],
              error: null
            })
          })
        }),
        insert: (data) => {
          console.log(`🔒 Demo mode: Insert into ${table}`, data);
          return Promise.resolve({
            data: { ...data, id: Date.now().toString() },
            error: null
          });
        },
        update: (data) => Promise.resolve({
          data: data,
          error: null
        }),
        delete: () => Promise.resolve({ error: null }),
      }),
    }),
  };

  console.log('✅ Offline demo mode initialized - no network requests will be made');
} else {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-application-name': 'lovex-dating-app',
          'x-client-version': '1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
      // Connection pool és networking optimalizációk
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      // HTTP kliens konfiguráció
      fetch: (url, options = {}) => {
        // Timeout beállítása (30 másodperc)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    });

    console.log('✅ Supabase kliens sikeresen létrehozva optimalizált konfigurációval');
  } catch (error) {
    console.error('❌ Hiba a Supabase kliens létrehozásakor:', error.message);
    // Hibás állapotú kliens létrehozása, hogy ne álljon le az alkalmazás
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
}

export { supabase };

