import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MetricasScreen from './MetricasScreen';
import ControleScreen from './ControleScreen';
import MetasProgressoScreen from './MetasProgressoScreen';
import HistoricoMensalScreen from './HistoricoMensalScreen';
import ConfigScreen from './ConfigScreen';

const Tab = createBottomTabNavigator();

export default function Navigator({ onReset }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#6d54ff',
        tabBarInactiveTintColor: '#62626e',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarIcon: ({ color }) => {
          const icons = {
            Dashboard: 'grid-outline',
            Controle: 'wallet-outline',
            Desejos: 'gift-outline',
            Histórico: 'calendar-outline',
            Painel: 'options-outline',
          };
          return <Ionicons name={icons[route.name]} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={MetricasScreen} />
      <Tab.Screen name="Controle" component={ControleScreen} />
      <Tab.Screen name="Desejos" component={MetasProgressoScreen} />
      <Tab.Screen name="Histórico" component={HistoricoMensalScreen} />
      <Tab.Screen name="Painel">
        {() => <ConfigScreen onReset={onReset} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}