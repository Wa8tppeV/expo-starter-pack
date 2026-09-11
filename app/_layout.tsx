import '../global.css';

import { useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { getColor } from '@constants';
import { useTheme } from '@hooks';
import { ThemeProvider } from '@providers';

SplashScreen.preventAutoHideAsync();

const tabIcons = {
  index: ['home-outline', 'home'],
  'projects/index': ['business-outline', 'business'],
  professionals: ['people-outline', 'people'],
  payments: ['wallet-outline', 'wallet'],
} as const;

function AppTabs() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: getColor('primary', theme),
        tabBarInactiveTintColor: getColor('content-tertiary', theme),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          height: 82,
          paddingBottom: 18,
          paddingTop: 8,
          backgroundColor: getColor('surface-elevated', theme),
          borderTopColor: getColor('border', theme),
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons = tabIcons[route.name as keyof typeof tabIcons];
          if (!icons) return null;
          return <Ionicons name={icons[focused ? 1 : 0]} color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="projects/index" options={{ title: 'Projeler' }} />
      <Tabs.Screen name="professionals" options={{ title: 'Projeciler' }} />
      <Tabs.Screen name="payments" options={{ title: 'Ödemeler' }} />
      <Tabs.Screen name="projects/[id]" options={{ href: null }} />
      <Tabs.Screen name="projects/new" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]/edit" options={{ href: null }} />
      <Tabs.Screen name="projects/[id]/disciplines/[disciplineId]" options={{ href: null }} />
      <Tabs.Screen name="professionals/[id]" options={{ href: null }} />
      <Tabs.Screen name="payments/new" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope: require('../assets/fonts/Manrope-Regular.ttf'),
    'Manrope-Medium': require('../assets/fonts/Manrope-Medium.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <AppTabs />
    </ThemeProvider>
  );
}
