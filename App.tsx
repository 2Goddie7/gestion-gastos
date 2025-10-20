import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ReciboScreen from './screens/ReciboScreen';
import BalancesScreen from './screens/BalancesScreen';
import ReportsScreen from './screens/ReportsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

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
          tabBarActiveTintColor: '#4A90E2',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
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