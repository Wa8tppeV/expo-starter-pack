import React from 'react';

import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@components';
import { Text } from '@ui';

const offers = [
  {
    company: 'Akdeniz Yapı',
    date: '24 Ağustos 2026',
    status: 'Bekliyor',
    tone: 'warning',
    value: '₺2.480.000',
  },
  {
    company: 'Denizli Proje A.Ş.',
    date: '19 Ağustos 2026',
    status: 'Onaylandı',
    tone: 'success',
    value: '₺1.725.000',
  },
  {
    company: 'Ege Gayrimenkul',
    date: '12 Ağustos 2026',
    status: 'Revize',
    tone: 'info',
    value: '₺3.150.000',
  },
] as const;

const toneClasses = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
} as const;

export default function OffersScreen() {
  return (
    <Screen
      action={
        <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
          <Ionicons name="add" size={24} color="#171717" />
        </Pressable>
      }
      subtitle="Teklif süreçlerini ve dönüşleri tek yerden yönet."
      title="Teklifler"
    >
      <View className="flex-row gap-3">
        <View className="flex-1 rounded-3xl border border-border bg-surface-elevated p-4">
          <Text variant="h2">4</Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            Bekleyen
          </Text>
        </View>
        <View className="flex-1 rounded-3xl border border-border bg-surface-elevated p-4">
          <Text variant="h2">₺7,3 M</Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            Teklif Hacmi
          </Text>
        </View>
      </View>

      <View>
        <View className="mb-3 flex-row items-center justify-between">
          <Text variant="h3">Son Teklifler</Text>
          <Pressable className="flex-row items-center gap-1">
            <Ionicons name="filter-outline" size={16} color="#A88722" />
            <Text variant="caption" className="font-manrope-semibold text-primary-dark">
              Filtrele
            </Text>
          </Pressable>
        </View>
        <View className="gap-3">
          {offers.map(offer => (
            <Pressable
              key={offer.company}
              className="rounded-3xl border border-border bg-surface-elevated p-5"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text variant="h3">{offer.company}</Text>
                  <Text variant="caption" className="mt-1 text-content-secondary">
                    {offer.date}
                  </Text>
                </View>
                <View className={`rounded-full px-3 py-1 ${toneClasses[offer.tone]}`}>
                  <Text
                    variant="small"
                    className={`font-manrope-semibold ${toneClasses[offer.tone]}`}
                  >
                    {offer.status}
                  </Text>
                </View>
              </View>
              <View className="mt-5 flex-row items-end justify-between border-t border-border pt-4">
                <View>
                  <Text variant="small" className="text-content-secondary">
                    Teklif Tutarı
                  </Text>
                  <Text variant="h3" className="mt-1">
                    {offer.value}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8C8C86" />
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
