import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ReciboScreen from './screens/ReciboScreen';
import BalancesScreen from './screens/BalancesScreen';
import ReportsScreen from './screens/ReportsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const TAB_COLORS = {
  Inicio: '#6C63FF',
  Balance: '#FF6B9D',
  Recibos: '#4ECDC4',
  Reporte: '#FFA500',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Inicio') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Balance') {
              iconName = focused ? 'calculator' : 'calculator-outline';
            } else if (route.name === 'Recibos') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            } else if (route.name === 'Reporte') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: TAB_COLORS[route.name as keyof typeof TAB_COLORS],
          tabBarInactiveTintColor: '#999',
          headerShown: false,
          tabBarStyle: {
            height: 65,
            paddingBottom: 10,
            paddingTop: 8,
            backgroundColor: '#FFF',
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Balance" component={BalancesScreen} />
        <Tab.Screen name="Recibos" component={ReciboScreen} />
        <Tab.Screen name="Reporte" component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}