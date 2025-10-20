import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ReciboScreen from './screens/ReciboScreen';
import BalancesScreen from './screens/BalancesScreen';
import ReportsScreen from './screens/ReportsScreen';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

// Colores modernos para cada tab
const TAB_COLORS = {
  Inicio: '#2563EB',
  Balance: '#9333EA',
  Recibos: '#EA580C',
  Reporte: '#5B5FF9',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Inicio') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Balance') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Recibos') {
              iconName = focused ? 'image' : 'image-outline';
            } else if (route.name === 'Reporte') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else {
              iconName = 'help-outline';
            }

            const tabColor = TAB_COLORS[route.name as keyof typeof TAB_COLORS];

            return (
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={iconName} 
                  size={24} 
                  color={focused ? tabColor : '#94A3B8'} 
                />
              </View>
            );
          },
          tabBarLabel: ({ focused, children }) => {
            const tabColor = TAB_COLORS[route.name as keyof typeof TAB_COLORS];
            return (
              <Text 
                style={[
                  styles.tabLabel,
                  { color: focused ? tabColor : '#94A3B8' }
                ]}
              >
                {children}
              </Text>
            );
          },
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: true,
        })}
      >
        <Tab.Screen 
          name="Inicio" 
          component={HomeScreen}
          options={{ title: 'Inicio' }}
        />
        <Tab.Screen 
          name="Balance" 
          component={BalancesScreen}
          options={{ title: 'Balance' }}
        />
        <Tab.Screen 
          name="Recibos" 
          component={ReciboScreen}
          options={{ title: 'Recibos' }}
        />
        <Tab.Screen 
          name="Reporte" 
          component={ReportsScreen}
          options={{ title: 'Reporte' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});