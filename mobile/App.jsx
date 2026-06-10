import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import TaskScreen from './src/screens/TaskScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1e1b4b' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: { backgroundColor: '#1e1b4b', borderTopColor: '#312e81' },
          tabBarActiveTintColor: '#a5b4fc',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        <Tab.Screen
          name="Daily"
          options={{
            title: 'Daily Tasks',
            tabBarIcon: ({ focused }) => <TabIcon emoji="☀️" focused={focused} />,
          }}
        >
          {() => <TaskScreen category="daily" />}
        </Tab.Screen>
        <Tab.Screen
          name="Weekly"
          options={{
            title: 'Weekly Tasks',
            tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
          }}
        >
          {() => <TaskScreen category="weekly" />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
