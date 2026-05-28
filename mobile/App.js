import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

// Screen Imports
import DashboardScreen from './screens/DashboardScreen';
import AccountsScreen from './screens/AccountsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import RemindersScreen from './screens/RemindersScreen';
import SettingsScreen from './screens/SettingsScreen';

// Core Themes Mapping
const THEMES = {
  dark: {
    background: '#050508',
    cardBg: 'rgba(255, 255, 255, 0.035)',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    accentPurple: '#8B5CF6',
    accentEmerald: '#10B981',
    accentCyan: '#06B6D4',
    accentRose: '#F43F5E'
  },
  light: {
    background: '#FDFBF7',
    cardBg: 'rgba(139, 92, 246, 0.04)',
    cardBorder: 'rgba(139, 92, 246, 0.08)',
    textPrimary: '#2A1B0E',
    textSecondary: '#6B5A4E',
    accentPurple: '#7C3AED',
    accentEmerald: '#059669',
    accentCyan: '#0891B2',
    accentRose: '#E11D48'
  }
};

const { width } = Dimensions.get('window');

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [themeName, setThemeName] = useState('dark');

  // Load theme from persistent storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('kylr_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeName(savedTheme);
        }
      } catch (e) {
        console.warn('Could not load theme: ', e);
      }
    };
    loadTheme();
  }, []);

  // Toggle active theme
  const toggleTheme = async () => {
    const nextTheme = themeName === 'dark' ? 'light' : 'dark';
    setThemeName(nextTheme);
    try {
      await AsyncStorage.setItem('kylr_theme', nextTheme);
    } catch (e) {
      console.warn('Could not save theme: ', e);
    }
  };

  const theme = THEMES[themeName];

  // Tab screen selector
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen theme={theme} />;
      case 'accounts':
        return <AccountsScreen theme={theme} />;
      case 'analytics':
        return <AnalyticsScreen theme={theme} />;
      case 'categories':
        return <CategoriesScreen theme={theme} />;
      case 'reminders':
        return <RemindersScreen theme={theme} />;
      case 'settings':
        return (
          <SettingsScreen 
            theme={theme} 
            activeThemeName={themeName} 
            toggleTheme={toggleTheme} 
          />
        );
      default:
        return <DashboardScreen theme={theme} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Visual Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.logoText, { color: theme.textPrimary }]}>KYLR CAPITAL</Text>
        <TouchableOpacity style={styles.themeTogglePill} onPress={toggleTheme}>
          <Text style={[styles.themeToggleText, { color: theme.accentPurple }]}>
            {themeName === 'dark' ? '🌙 Dark' : '☀️ Latte'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Screen Rendering */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* FLOATING CUSTOM BOTTOM TAB BAR */}
      <View style={[styles.floatingTabBar, { backgroundColor: themeName === 'dark' ? 'rgba(10, 10, 15, 0.92)' : 'rgba(253, 251, 247, 0.95)', borderColor: theme.cardBorder }]}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'home' },
          { id: 'analytics', label: 'Analytics', icon: 'trending-up' },
          { id: 'accounts', label: 'Accounts', icon: 'credit-card' },
          { id: 'categories', label: 'Categories', icon: 'grid' },
          { id: 'reminders', label: 'Reminders', icon: 'bell' },
          { id: 'settings', label: 'Settings', icon: 'settings' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity 
              key={tab.id} 
              style={styles.tabItem} 
              onPress={() => setActiveTab(tab.id)}
            >
              <Feather 
                name={tab.icon} 
                size={18} 
                color={isActive ? theme.accentPurple : theme.textSecondary} 
                style={{ marginBottom: 3 }}
              />
              <Text 
                style={[
                  styles.tabLabel, 
                  { 
                    color: isActive ? theme.accentPurple : theme.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                    fontSize: 9
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  themeTogglePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  themeToggleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  screenContainer: {
    flex: 1,
    marginBottom: 85, // Clear the absolute bottom floating tab-bar completely
  },
  floatingTabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    // Shadows for premium floating visual effect
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  }
});
