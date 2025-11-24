import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const EventsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Összes', icon: 'grid-outline' },
    { id: 'upcoming', label: 'Közelgő', icon: 'calendar-outline' },
    { id: 'online', label: 'Online', icon: 'videocam-outline' },
    { id: 'local', label: 'Helyi', icon: 'location-outline' },
  ];

  // Mock események
  const events = [
    {
      id: 1,
      title: 'Társkereső Tréning - Budapest',
      date: '2024-02-15',
      time: '18:00',
      location: 'Budapest, Váci utca 1.',
      type: 'local',
      attendees: 45,
      maxAttendees: 50,
      price: 'Ingyenes',
      description: 'Ismerkedj meg új emberekkel és tanulj társkeresési tippeket szakértőktől.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
      organizer: 'Randivonal.hu',
    },
    {
      id: 2,
      title: 'Online Speed Dating',
      date: '2024-02-20',
      time: '19:00',
      location: 'Online',
      type: 'online',
      attendees: 32,
      maxAttendees: 40,
      price: '2,990 Ft',
      description: 'Gyors ismerkedés online videóhívásokon keresztül. 5 perces beszélgetések.',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop',
      organizer: 'Love.hu',
    },
    {
      id: 3,
      title: 'Kávézó Randi Est',
      date: '2024-02-22',
      time: '17:00',
      location: 'Debrecen, Piac utca 1.',
      type: 'local',
      attendees: 28,
      maxAttendees: 30,
      price: '1,500 Ft',
      description: 'Laza hangulatú kávézó est, ahol könnyedén ismerkedhetsz.',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4c7cfe?w=800&h=400&fit=crop',
      organizer: 'Párom.hu',
    },
    {
      id: 4,
      title: 'Séta a Margitszigeten',
      date: '2024-02-18',
      time: '14:00',
      location: 'Budapest, Margitsziget',
      type: 'local',
      attendees: 15,
      maxAttendees: 25,
      price: 'Ingyenes',
      description: 'Természetben sétálás és ismerkedés. Aktív programokkal.',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
      organizer: 'Randivonal.hu',
    },
  ];

  const filteredEvents = events.filter(event => {
    if (selectedCategory === 'upcoming') {
      return new Date(event.date) >= new Date();
    }
    if (selectedCategory === 'online') return event.type === 'online';
    if (selectedCategory === 'local') return event.type === 'local';
    return true;
  });

  const handleJoinEvent = (event) => {
    Alert.alert(
      'Eseményre jelentkezés',
      `Szeretnél jelentkezni erre az eseményre?\n\n${event.title}\n${event.date} ${event.time}`,
      [
        { text: 'Mégse', style: 'cancel' },
        {
          text: 'Jelentkezem',
          onPress: () => {
            Alert.alert('✅ Sikeres', 'Jelentkezésedet rögzítettük! Részleteket emailben küldünk.');
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.surface, theme.colors.background]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Események</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <Ionicons name="calendar" size={32} color="#FF3B75" />
            <Text style={styles.infoTitle}>Társkereső Események</Text>
            <Text style={styles.infoText}>
              Találkozz új emberekkel személyesen vagy online eseményeinken!
            </Text>
          </View>

          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon}
                    size={18}
                    color={selectedCategory === category.id ? theme.colors.primary : theme.colors.text}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.categoryTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.eventsContainer}>
            {filteredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => handleJoinEvent(event)}
              >
                <Image source={{ uri: event.image }} style={styles.eventImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.eventGradient}
                >
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventTypeBadge}>
                        <Ionicons
                          name={event.type === 'online' ? 'videocam' : 'location'}
                          size={14}
                          color={theme.colors.text}
                        />
                        <Text style={styles.eventTypeText}>
                          {event.type === 'online' ? 'Online' : 'Helyi'}
                        </Text>
                      </View>
                      <Text style={styles.eventPrice}>{event.price}</Text>
                    </View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetail}>
                        <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.eventDetailText}>
                          {event.date} {event.time}
                        </Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.eventDetailText}>{event.location}</Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.eventDetailText}>
                          {event.attendees}/{event.maxAttendees} résztvevő
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => handleJoinEvent(event)}
                    >
                      <Text style={styles.joinButtonText}>Jelentkezés</Text>
                      <Ionicons name="arrow-forward" size={16} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footerInfo}>
            <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
            <Text style={styles.footerText}>
              Új eseményeket rendszeresen hirdetünk. Nézd vissza gyakran!
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 59, 117, 0.1)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 117, 0.3)',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B75',
    marginTop: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  categoryText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: theme.colors.primary,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 20,
  },
  eventCard: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  eventGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  eventContent: {
    gap: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  eventTypeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  eventPrice: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  eventDetails: {
    gap: 6,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  eventDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B75',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  joinButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    flex: 1,
  },
});

export default EventsScreen;

