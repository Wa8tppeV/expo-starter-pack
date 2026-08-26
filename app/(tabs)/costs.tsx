import React from 'react';

import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@components';
import { Text } from '@ui';

const categories = [
  { label: 'Malzeme', percent: '%46', value: '₺6.771.200', width: 'w-1/2' },
  { label: 'İşçilik', percent: '%31', value: '₺4.563.200', width: 'w-1/3' },
  { label: 'Makine & Ekipman', percent: '%15', value: '₺2.208.000', width: 'w-1/6' },
  { label: 'Diğer', percent: '%8', value: '₺1.177.600', width: 'w-1/12' },
] as const;

export default function CostsScreen() {
  return (
    <Screen
      action={
        <Pressable className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-elevated">
          <Ionicons name="calendar-outline" size={21} color="#D4AF37" />
        </Pressable>
      }
      subtitle="Bütçe, gerçekleşen gider ve kârlılığı izle."
      title="Maliyet"
    >
      <View className="rounded-3xl bg-accent p-5">
        <Text variant="caption" className="text-white/60">
          Toplam Tahmini Maliyet
        </Text>
        <Text variant="h1-sm" className="mt-2 text-white">
          ₺14.720.000
        </Text>
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white/10 p-3">
            <Text variant="small" className="text-white/60">
              Gerçekleşen
            </Text>
            <Text variant="body-medium" className="mt-1 text-white">
              ₺9.180.000
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/10 p-3">
            <Text variant="small" className="text-white/60">
              Kalan Bütçe
            </Text>
            <Text variant="body-medium" className="mt-1 text-primary-light">
              ₺5.540.000
            </Text>
          </View>
        </View>
      </View>

      <View>
        <Text variant="h3">Gider Dağılımı</Text>
        <View className="mt-3 gap-3">
          {categories.map(category => (
            <View
              key={category.label}
              className="rounded-3xl border border-border bg-surface-elevated p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text variant="body-medium">{category.label}</Text>
                <Text variant="caption" className="font-manrope-semibold text-primary-dark">
                  {category.percent}
                </Text>
              </View>
              <Text variant="caption" className="mt-1 text-content-secondary">
                {category.value}
              </Text>
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                <View className={`h-full rounded-full bg-primary ${category.width}`} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <Pressable className="flex-row items-center justify-center gap-2 rounded-2xl border border-primary px-5 py-4">
        <Ionicons name="add-circle-outline" size={20} color="#A88722" />
        <Text variant="body-sm" className="font-manrope-bold text-primary-dark">
          Yeni Gider Ekle
        </Text>
      </Pressable>
    </Screen>
  );
}
