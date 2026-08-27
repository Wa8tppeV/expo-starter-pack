import React from 'react';

import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { Screen } from '@components';
import { calculateEstimateTotals, formatKurus, useEstimateStore } from '@features';
import { Text } from '@ui';

const metrics = [
  { label: 'Aktif Proje', value: '6', icon: 'business-outline' as const },
  { label: 'Bekleyen Teklif', value: '4', icon: 'document-text-outline' as const },
];

export default function HomeScreen() {
  const router = useRouter();
  const drafts = useEstimateStore(state => state.drafts);
  const savedEstimateKurus = Object.values(drafts).reduce(
    (total, draft) =>
      total + calculateEstimateTotals(draft.lines, draft.adjustments).grandTotalKurus,
    0
  );
  const financeCards = [
    { label: 'Toplam Sözleşme', value: '₺18.450.000' },
    { label: 'Kayıtlı Keşifler', value: formatKurus(savedEstimateKurus) },
    { label: 'Beklenen Kâr', value: '₺3.730.000' },
  ];

  return (
    <Screen
      action={
        <Pressable className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-elevated">
          <Ionicons name="notifications-outline" size={22} color="#D4AF37" />
        </Pressable>
      }
      subtitle="Projeler, maliyetler ve teklifler tek ekranda."
      title="Kontrol Merkezi"
    >
      <View className="flex-row gap-3">
        {metrics.map(metric => (
          <View
            key={metric.label}
            className="flex-1 rounded-3xl border border-border bg-surface-elevated p-4"
          >
            <View className="mb-5 h-10 w-10 items-center justify-center rounded-2xl bg-surface">
              <Ionicons name={metric.icon} size={20} color="#D4AF37" />
            </View>
            <Text variant="h2" className="text-content">
              {metric.value}
            </Text>
            <Text variant="caption" className="mt-1 text-content-secondary">
              {metric.label}
            </Text>
          </View>
        ))}
      </View>

      <View className="rounded-3xl bg-accent p-5">
        <Text variant="caption" className="text-white/60">
          Finansal Özet
        </Text>
        <View className="mt-4 gap-4">
          {financeCards.map((card, index) => (
            <View
              key={card.label}
              className={index < financeCards.length - 1 ? 'border-b border-white/10 pb-4' : ''}
            >
              <Text variant="caption" className="text-white/60">
                {card.label}
              </Text>
              <Text variant="h2" className="mt-1 text-white">
                {card.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View>
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text variant="h3" className="text-content">
              Aktif Projeler
            </Text>
            <Text variant="caption" className="mt-1 text-content-secondary">
              Son hareket görülen projeler
            </Text>
          </View>
          <Pressable onPress={() => router.push('/projects')}>
            <Text variant="caption" className="font-manrope-semibold text-primary-dark">
              Tümünü Gör
            </Text>
          </Pressable>
        </View>

        <View className="rounded-3xl border border-border bg-surface-elevated p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text variant="h3" className="text-content">
                Çal Konut Projesi
              </Text>
              <Text variant="caption" className="mt-1 text-content-secondary">
                Çal / Denizli
              </Text>
            </View>
            <View className="bg-success/10 rounded-full px-3 py-1">
              <Text variant="small" className="font-manrope-semibold text-success">
                Devam Ediyor
              </Text>
            </View>
          </View>

          <View className="mt-5">
            <View className="mb-2 flex-row justify-between">
              <Text variant="caption" className="text-content-secondary">
                İlerleme
              </Text>
              <Text variant="caption" className="font-manrope-semibold text-content">
                %74
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-surface">
              <View className="h-full w-3/4 rounded-full bg-primary" />
            </View>
          </View>
        </View>
      </View>

      <Pressable
        className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4"
        onPress={() => router.push('/projects')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#171717" />
        <Text variant="body-sm" className="font-manrope-bold text-accent">
          Yeni Proje Oluştur
        </Text>
      </Pressable>
    </Screen>
  );
}
