/**
 * DiscoveryService - Felfedezési feed kezelése és szűrés
 */
import { supabase } from './supabaseClient';

class DiscoveryService {
  constructor() {
    this.serviceName = 'DiscoveryService';
  }

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // Distance in kilometers
  }

  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Discovery profiles lekérése Supabase-ból valódi adatokkal
   */
  async getDiscoveryProfiles(filters = {}, excludeIds = []) {
    // Check if we should use demo mode
    const isDemoMode = __DEV__ && (!supabase || typeof supabase.from !== 'function' || !supabase.from('profiles').select);

    if (isDemoMode) {
      console.log('DiscoveryService: Using demo mode for profiles');
      return this.getMockProfiles(filters, excludeIds);
    }

    try {
      // Real Supabase query for profiles
      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          bio,
          interests,
          relationship_goal,
          communication_style,
          height,
          work,
          education,
          exercise,
          smoking,
          drinking,
          children,
          religion,
          politics,
          zodiac_sign,
          mbti,
          location_latitude,
          location_longitude,
          location_city,
          location_country,
          is_verified,
          is_premium,
          is_sugar_dating,
          completion_percentage,
          created_at,
          updated_at,
          users!inner(
            id,
            email,
            name,
            birth_date,
            gender,
            looking_for,
            last_active,
            created_at
          ),
          profile_photos(
            url,
            thumbnail_url,
            is_private,
            is_primary,
            order_index
          )
        `)
        .eq('users.is_active', true)
        .neq('users.id', supabase.auth.getUser()?.id) // Exclude current user
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (filters.gender) {
        query = query.eq('users.gender', filters.gender);
      }

      if (filters.lookingFor) {
        query = query.contains('users.looking_for', [filters.lookingFor]);
      }

      if (filters.minAge || filters.maxAge) {
        const now = new Date();
        const minDate = filters.minAge ? new Date(now.getFullYear() - filters.minAge, now.getMonth(), now.getDate()) : null;
        const maxDate = filters.maxAge ? new Date(now.getFullYear() - filters.maxAge, now.getMonth(), now.getDate()) : null;

        if (minDate) query = query.lte('users.birth_date', minDate.toISOString());
        if (maxDate) query = query.gte('users.birth_date', maxDate.toISOString());
      }

      if (filters.verifiedOnly) {
        query = query.eq('is_verified', true);
      }

      if (filters.premiumOnly) {
        query = query.eq('is_premium', true);
      }

      if (excludeIds && excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('DiscoveryService: Supabase query error:', error);
        // Fallback to mock data on error
        return this.getMockProfiles(filters, excludeIds);
      }

      if (!data || data.length === 0) {
        console.log('DiscoveryService: No profiles found, using mock data');
        return this.getMockProfiles(filters, excludeIds);
      }

      // Transform Supabase data to expected format
      const profiles = data.map(profile => ({
        id: profile.user_id,
        name: profile.users.name,
        age: this.calculateAge(profile.users.birth_date),
        distance: filters.location ? this.calculateDistance(
          filters.location.latitude,
          filters.location.longitude,
          profile.location_latitude,
          profile.location_longitude
        ) : Math.floor(Math.random() * 50) + 1, // Fallback distance
        verified: profile.is_verified || false,
        premium: profile.is_premium || false,
        sugarDating: profile.is_sugar_dating || false,
        photo: profile.profile_photos?.find(p => p.is_primary)?.url ||
               profile.profile_photos?.[0]?.url ||
               'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
        photos: profile.profile_photos?.map(p => p.url) || [],
        bio: profile.bio || '',
        interests: profile.interests || [],
        relationshipGoal: profile.relationship_goal,
        work: profile.work,
        education: profile.education,
        location: profile.location_city ? `${profile.location_city}, ${profile.location_country || ''}`.trim() : null,
        lastActive: profile.users.last_active,
      }));

      console.log('DiscoveryService: Loaded profiles from Supabase:', profiles.length);
      return profiles;
    } catch (error) {
      console.error('DiscoveryService: Error loading profiles:', error);
      // Fallback to mock data
      return this.getMockProfiles(filters, excludeIds);
    }
  }

  /**
   * Mock profiles fallback (only used when Supabase fails)
   */
  async getMockProfiles(filters = {}, excludeIds = []) {
    const mockProfiles = [
      {
          id: 1,
          name: 'Anna',
          age: 24,
          distance: 3,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek utazni és új helyeket felfedezni 🌍',
          interests: ['Utazás', 'Fotózás']
        },
        {
          id: 2,
          name: 'Béla',
          age: 28,
          distance: 5,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Sportos vagyok, szeretek futni 🏃‍♂️',
          interests: ['Futás', 'Sport']
        },
        {
          id: 3,
          name: 'Kata',
          age: 26,
          distance: 8,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Művész vagyok, szeretek alkotni 🎨',
          interests: ['Művészet', 'Zene', 'Olvasás']
        },
        {
          id: 4,
          name: 'István',
          age: 31,
          distance: 12,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          ],
          bio: 'Informatikus vagyok, szeretek programozni 💻',
          interests: ['Programozás', 'Technológia', 'Tudomány']
        },
        {
          id: 5,
          name: 'Laura',
          age: 23,
          distance: 6,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Diák vagyok, szeretek táncolni 💃',
          interests: ['Tánc', 'Zene', 'Utazás']
        },
        {
          id: 6,
          name: 'Gábor',
          age: 29,
          distance: 15,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek főzni és jó ételeket kóstolni 🍳',
          interests: ['Főzés', 'Ételek', 'Bor']
        },
        {
          id: 7,
          name: 'Zsófia',
          age: 27,
          distance: 9,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek olvasni és könyvekről beszélgetni 📚',
          interests: ['Olvasás', 'Irodalom', 'Kávé']
        },
        {
          id: 8,
          name: 'Mária',
          age: 25,
          distance: 4,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kávézni és jó beszélgetéseket folytatni ☕',
          interests: ['Kávé', 'Beszélgetés', 'Pszichológia']
        },
        {
          id: 9,
          name: 'Péter',
          age: 32,
          distance: 7,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kirándulni a természetben 🌲',
          interests: ['Kirándulás', 'Természet', 'Fotózás']
        },
        {
          id: 10,
          name: 'Eszter',
          age: 22,
          distance: 2,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          ],
          bio: 'Egyetemista vagyok, szeretek tanulni 📖',
          interests: ['Tanulás', 'Tudomány', 'Kutatás']
        },
        {
          id: 11,
          name: 'Tamás',
          age: 30,
          distance: 11,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek zenét hallgatni és koncertekre járni 🎵',
          interests: ['Zene', 'Koncertek', 'Gitár']
        },
        {
          id: 12,
          name: 'Réka',
          age: 28,
          distance: 14,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kertészkedni és növényeket nevelni 🌱',
          interests: ['Kertészet', 'Növények', 'Természet']
        },
        {
          id: 13,
          name: 'Balázs',
          age: 26,
          distance: 10,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek motorozni és kalandokat keresni 🏍️',
          interests: ['Motorozás', 'Kaland', 'Utazás']
        },
        {
          id: 14,
          name: 'Anikó',
          age: 29,
          distance: 5,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek főzni és új recepteket kipróbálni 👩‍🍳',
          interests: ['Főzés', 'Receptek', 'Ételek']
        },
        {
          id: 15,
          name: 'László',
          age: 33,
          distance: 16,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek sakkozni és stratégiai játékokat játszani ♟️',
          interests: ['Sakkozás', 'Stratégiai játékok', 'Logika']
        },
        {
          id: 16,
          name: 'Edit',
          age: 24,
          distance: 8,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek rajzolni és kreatív lenni 🎨',
          interests: ['Rajzolás', 'Kreativitás', 'Művészet']
        },
        {
          id: 17,
          name: 'Ferenc',
          age: 27,
          distance: 6,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek biciklizni és aktív életmódot folytatni 🚴‍♂️',
          interests: ['Biciklizés', 'Aktív életmód', 'Sport']
        },
        {
          id: 18,
          name: 'Judit',
          age: 31,
          distance: 9,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek hímezni és kézműves dolgokat csinálni 🧵',
          interests: ['Hímezés', 'Kézművesség', 'Kreativitás']
        },
        {
          id: 19,
          name: 'Attila',
          age: 25,
          distance: 12,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek videójátékokat játszani 🎮',
          interests: ['Videójátékok', 'Technológia', 'Programozás']
        },
        {
          id: 20,
          name: 'Krisztina',
          age: 26,
          distance: 7,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek jógázni és meditálni 🧘‍♀️',
          interests: ['Jóga', 'Meditáció', 'Egészség']
        },
        {
          id: 21,
          name: 'Zoltán',
          age: 34,
          distance: 13,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek kertészkedni és zöldségeket termeszteni 🌽',
          interests: ['Kertészet', 'Zöldségek', 'Ökológia']
        },
        {
          id: 22,
          name: 'Viktória',
          age: 23,
          distance: 4,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek állatokat és kutyáskodni 🐕',
          interests: ['Állatok', 'Kutyák', 'Természet']
        },
        {
          id: 23,
          name: 'Mihály',
          age: 29,
          distance: 11,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek túrázni a hegyekben ⛰️',
          interests: ['Túrázás', 'Hegyek', 'Fotózás']
        },
        {
          id: 24,
          name: 'Andrea',
          age: 28,
          distance: 8,
          verified: false,
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek sütni és desszerteket készíteni 🍰',
          interests: ['Sütés', 'Desszertek', 'Ételek']
        },
        {
          id: 25,
          name: 'Gergő',
          age: 26,
          distance: 5,
          verified: true,
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
          photos: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
            'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=600&h=800&fit=crop',
          ],
          bio: 'Szeretek snowboard-ozni és téli sportokat űzni 🏂',
          interests: ['Snowboard', 'Téli sportok', 'Kaland']
        }
      ];

      let filtered = [...mockProfiles];

      // Apply filters similar to Supabase query
      if (filters.ageMin) {
        filtered = filtered.filter(p => p.age >= filters.ageMin);
      }
      if (filters.ageMax) {
        filtered = filtered.filter(p => p.age <= filters.ageMax);
      }
      if (filters.distance) {
        filtered = filtered.filter(p => !p.distance || p.distance <= filters.distance);
      }
      if (filters.verifiedOnly) {
        filtered = filtered.filter(p => p.verified);
      }

      // Exclude already processed profiles
      if (Array.isArray(excludeIds) && excludeIds.length > 0) {
        filtered = filtered.filter(p => !excludeIds.includes(p.id));
      }

      // Shuffle results
      return filtered.sort(() => Math.random() - 0.5);
    }
  }

const discoveryService = new DiscoveryService();

export default discoveryService;
