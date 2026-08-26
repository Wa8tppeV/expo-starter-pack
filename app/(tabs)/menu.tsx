import React from 'react';

import { Pressable, Switch, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@components';
import { useTheme } from '@hooks';
import { Text } from '@ui';

const menuItems = [
  { icon: 'people-outline' as const, label: 'Ekip ve Yetkiler' },
  { icon: 'business-outline' as const, label: 'Firma Bilgileri' },
  { icon: 'notifications-outline' as const, label: 'Bildirim Ayarları' },
  { icon: 'shield-checkmark-outline' as const, label: 'Güvenlik' },
  { icon: 'help-circle-outline' as const, label: 'Yardım ve Destek' },
];

export default function MenuScreen() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Screen subtitle="Hesabını ve uygulama tercihlerini yönet." title="Menü">
      <View className="flex-row items-center rounded-3xl bg-accent p-5">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Text variant="h3" className="text-accent">
            DMH
          </Text>
        </View>
        <View className="ml-4 flex-1">
          <Text variant="h3" className="text-white">
            DMH İnşaat
          </Text>
          <Text variant="caption" className="mt-1 text-white/60">
            Yönetici hesabı
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
      </View>

      <View className="overflow-hidden rounded-3xl border border-border bg-surface-elevated">
        <View className="flex-row items-center border-b border-border p-4">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface">
            <Ionicons name="moon-outline" size={20} color="#D4AF37" />
          </View>
          <Text variant="body-medium" className="ml-3 flex-1">
            Koyu Tema
          </Text>
          <Switch
            onValueChange={toggleTheme}
            thumbColor="#FFFFFF"
            trackColor={{ false: '#D8D8D2', true: '#A88722' }}
            value={theme === 'dark'}
          />
        </View>

        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            className={`flex-row items-center p-4 ${index < menuItems.length - 1 ? 'border-b border-border' : ''}`}
          >
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface">
              <Ionicons name={item.icon} size={20} color="#D4AF37" />
            </View>
            <Text variant="body-medium" className="ml-3 flex-1">
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={19} color="#8C8C86" />
          </Pressable>
        ))}
      </View>

      <Text variant="small" className="text-center text-content-tertiary">
        DMH İnşaat Mobil · Sürüm 1.0.0
      </Text>
    </Screen>
  );
}
