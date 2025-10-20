import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ReciboScreen from './screens/ReciboScreen';
import BalancesScreen from './screens/BalancesScreen';
import ReportsScreen from './screens/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Balance" component={BalancesScreen} />
        <Tab.Screen name="Recibos" component={ReciboScreen} />
        <Tab.Screen name="Reporte" component={ReportsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
