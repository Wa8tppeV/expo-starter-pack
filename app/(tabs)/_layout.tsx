import React from 'react';

import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { Tabs } from 'expo-router';

import { colors, getColor } from '@constants';

const tabIcons = {
  costs: ['wallet-outline', 'wallet'],
  home: ['home-outline', 'home'],
  menu: ['grid-outline', 'grid'],
  offers: ['document-text-outline', 'document-text'],
  projects: ['business-outline', 'business'],
} as const;

type TabName = keyof typeof tabIcons;

function iconFor(name: TabName, focused: boolean) {
  return tabIcons[name][focused ? 1 : 0];
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: getColor('content-tertiary', theme),
        tabBarLabelStyle: {
          fontFamily: 'Manrope-SemiBold',
          fontSize: 10,
        },
        tabBarStyle: {
          backgroundColor: getColor('surface-elevated', theme),
          borderTopColor: getColor('border', theme),
          height: 78,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={iconFor('home', focused)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projeler',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={iconFor('projects', focused)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="costs"
        options={{
          title: 'Maliyet',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={iconFor('costs', focused)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Teklifler',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={iconFor('offers', focused)} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menü',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons color={color} name={iconFor('menu', focused)} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
