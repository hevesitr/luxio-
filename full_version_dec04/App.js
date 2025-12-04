import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Egyszerű demo komponens React Query nélkül
const SimpleDemo = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Home');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Mock adat betöltés
  const loadData = async (tabName) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (tabName) {
      case 'Profiles':
        setData([
          { id: 1, name: 'Anna', age: 25, bio: 'Szeretem az utazást! ✈️' },
          { id: 2, name: 'Béla', age: 28, bio: 'Sportos vagyok 🍳' },
        ]);
        break;
      case 'Matches':
        setData([
          { id: 1, name: 'Dávid', matchedAt: '2025-12-04T10:00:00Z' },
        ]);
        break;
      case 'Messages':
        setData([
          { id: 1, sender: 'Dávid', text: 'Szia!', time: '10:30' },
        ]);
        break;
      case 'Videos':
        setData([
          { id: 1, title: 'Videó', duration: '45s', views: 125 },
        ]);
        break;
      default:
        setData(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const TabButton = ({ title, iconName, isActive, onPress }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginHorizontal: 8,
        borderRadius: 20,
        backgroundColor: isActive ? 'rgba(255, 105, 180, 0.15)' : 'transparent',
        borderWidth: isActive ? 1 : 0,
        borderColor: isActive ? '#FF69B4' : 'transparent',
        minWidth: 80,
      }}
      onPress={onPress}
    >
      <Ionicons
        name={iconName}
        size={24}
        color={isActive ? '#FF69B4' : 'rgba(255, 255, 255, 0.6)'}
        style={{ marginBottom: 4 }}
      />
      <Text style={{
        color: isActive ? '#FF69B4' : 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: isActive ? '700' : '500',
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 }}>
        📱 Egyszerű Demo App
      </Text>
      <Text style={{ fontSize: 18, color: '#FF69B4', marginBottom: 10 }}>
        Aktív tab: {activeTab}
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: '#FF69B4',
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={() => loadData(activeTab)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          🔄 Újratöltés
        </Text>
      </TouchableOpacity>

      {loading ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ color: '#FF69B4', fontSize: 18 }}>⏳ Betöltés...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {data && data.map((item, index) => (
            <View key={index} style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              borderLeftWidth: 3,
              borderLeftColor: '#FF69B4',
            }}>
              {Object.entries(item).map(([key, value]) => (
                <Text key={key} style={{ color: '#fff', marginBottom: 5 }}>
                  <Text style={{ color: '#FF69B4', fontWeight: 'bold' }}>
                    {key}:
                  </Text> {String(value)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#000',
      paddingBottom: insets.bottom
    }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {renderContent()}
      </View>

      <View style={{
        position: 'absolute',
        bottom: insets.bottom > 0 ? insets.bottom : 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
      }}>
        <TabButton
          title="Profiles"
          iconName="people"
          isActive={activeTab === 'Profiles'}
          onPress={() => setActiveTab('Profiles')}
        />
        <TabButton
          title="Matches"
          iconName="heart"
          isActive={activeTab === 'Matches'}
          onPress={() => setActiveTab('Matches')}
        />
        <TabButton
          title="Messages"
          iconName="chatbubbles"
          isActive={activeTab === 'Messages'}
          onPress={() => setActiveTab('Messages')}
        />
        <TabButton
          title="Videos"
          iconName="videocam"
          isActive={activeTab === 'Videos'}
          onPress={() => setActiveTab('Videos')}
        />
      </View>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <SimpleDemo />
    </SafeAreaView>
  );
}