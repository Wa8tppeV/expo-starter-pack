import React, { useMemo, useState } from 'react';

import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@components';
import {
  calculateLaborEstimate,
  formatTry,
  LABOR_CATEGORIES,
  LaborCategory,
  LaborHours,
  LABOR_RATE_SOURCE,
  LABOR_RATES,
} from '@features';
import { Text } from '@ui';

type CategoryFilter = LaborCategory | 'Tümü';

export default function CostsScreen() {
  const [category, setCategory] = useState<CategoryFilter>('Tümü');
  const [hours, setHours] = useState<LaborHours>({});
  const [query, setQuery] = useState('');

  const filteredRates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');

    return LABOR_RATES.filter(item => {
      const isInCategory = category === 'Tümü' || item.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        item.code.includes(normalizedQuery);

      return isInCategory && matchesQuery;
    });
  }, [category, query]);

  const estimate = useMemo(() => calculateLaborEstimate(LABOR_RATES, hours), [hours]);

  const changeHours = (code: string, amount: number) => {
    setHours(current => {
      const nextHours = Math.max(0, (current[code] ?? 0) + amount);

      if (nextHours === 0) {
        const { [code]: _removed, ...remaining } = current;
        return remaining;
      }

      return { ...current, [code]: nextHours };
    });
  };

  return (
    <Screen
      action={
        <Pressable
          className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-elevated"
          onPress={() => Linking.openURL(LABOR_RATE_SOURCE.url)}
        >
          <Ionicons name="information-circle-outline" size={23} color="#D4AF37" />
        </Pressable>
      }
      subtitle="91 resmî işçilik rayicini ara, saat gir ve toplamı anında hesapla."
      title="Maliyet"
    >
      <View className="rounded-3xl bg-accent p-5">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text variant="caption" className="text-white/60">
              Seçili İşçilik Toplamı
            </Text>
            <Text variant="h1-sm" className="mt-2 text-white">
              {formatTry(estimate.total)}
            </Text>
          </View>
          {estimate.itemCount > 0 ? (
            <Pressable className="rounded-full bg-white/10 px-3 py-2" onPress={() => setHours({})}>
              <Text variant="small" className="font-manrope-semibold text-white">
                Temizle
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white/10 p-3">
            <Text variant="small" className="text-white/60">
              Toplam Saat
            </Text>
            <Text variant="body-medium" className="mt-1 text-white">
              {estimate.totalHours} sa
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/10 p-3">
            <Text variant="small" className="text-white/60">
              Seçili Kalem
            </Text>
            <Text variant="body-medium" className="mt-1 text-primary-light">
              {estimate.itemCount}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        className="border-info/20 bg-info/10 rounded-3xl border p-4"
        onPress={() => Linking.openURL(LABOR_RATE_SOURCE.url)}
      >
        <View className="flex-row items-start">
          <Ionicons name="shield-checkmark-outline" size={20} color="#356FA8" />
          <View className="ml-3 flex-1">
            <Text variant="body-medium" className="text-info">
              {LABOR_RATE_SOURCE.label}
            </Text>
            <Text variant="caption" className="mt-1 text-content-secondary">
              {LABOR_RATE_SOURCE.validFrom} tarihinden geçerli · {LABOR_RATE_SOURCE.publishedAt}{' '}
              tarihinde yayımlandı
            </Text>
            <Text variant="small" className="mt-2 text-content-tertiary">
              {LABOR_RATE_SOURCE.note}
            </Text>
          </View>
          <Ionicons name="open-outline" size={17} color="#356FA8" />
        </View>
      </Pressable>

      <View>
        <Text variant="h3">İşçilik Rayiç Kataloğu</Text>
        <Text variant="caption" className="mt-1 text-content-secondary">
          Poz numarası veya meslek adıyla arama yapabilirsin.
        </Text>

        <View className="mt-4 flex-row items-center rounded-2xl border border-border bg-surface-elevated px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#8C8C86" />
          <TextInput
            className="ml-3 flex-1 font-manrope text-body-sm text-content"
            onChangeText={setQuery}
            placeholder="Örn. sıvacı, elektrik, 1085"
            placeholderTextColor="#8C8C86"
            returnKeyType="search"
            value={query}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8C8C86" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          className="-mx-4 mt-3"
          contentContainerClassName="gap-2 px-4"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {LABOR_CATEGORIES.map(item => {
            const isSelected = item === category;

            return (
              <Pressable
                key={item}
                className={`rounded-full border px-4 py-2 ${
                  isSelected ? 'border-primary bg-primary' : 'border-border bg-surface-elevated'
                }`}
                onPress={() => setCategory(item)}
              >
                <Text
                  variant="caption"
                  className={
                    isSelected ? 'font-manrope-semibold text-accent' : 'text-content-secondary'
                  }
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-4 flex-row items-center justify-between">
          <Text variant="caption" className="text-content-secondary">
            {filteredRates.length} kalem gösteriliyor
          </Text>
          <Text variant="caption" className="font-manrope-semibold text-primary-dark">
            Birim: saat
          </Text>
        </View>
      </View>

      <View className="gap-3">
        {filteredRates.map(item => {
          const itemHours = hours[item.code] ?? 0;
          const itemTotal = itemHours * item.hourlyRate;

          return (
            <View
              key={item.code}
              className="rounded-3xl border border-border bg-surface-elevated p-4"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text variant="small" className="font-manrope-semibold text-primary-dark">
                    {item.code} · {item.category}
                  </Text>
                  <Text variant="body-medium" className="mt-1">
                    {item.name}
                  </Text>
                </View>
                <View className="items-end">
                  <Text variant="body-medium">{formatTry(item.hourlyRate)}</Text>
                  <Text variant="small" className="text-content-tertiary">
                    / saat
                  </Text>
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-between border-t border-border pt-4">
                <View>
                  <Text variant="small" className="text-content-secondary">
                    Kalem toplamı
                  </Text>
                  <Text variant="caption" className="mt-1 font-manrope-semibold">
                    {formatTry(itemTotal)}
                  </Text>
                </View>
                <View className="flex-row items-center rounded-2xl bg-surface p-1">
                  <Pressable
                    accessibilityLabel={`${item.name} saat azalt`}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated"
                    disabled={itemHours === 0}
                    onPress={() => changeHours(item.code, -1)}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={itemHours === 0 ? '#B8B8B3' : '#171717'}
                    />
                  </Pressable>
                  <View className="w-16 items-center">
                    <Text variant="caption" className="font-manrope-bold">
                      {itemHours} sa
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel={`${item.name} saat artır`}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-primary"
                    onPress={() => changeHours(item.code, 1)}
                  >
                    <Ionicons name="add" size={18} color="#171717" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {filteredRates.length === 0 ? (
        <View className="items-center rounded-3xl border border-border bg-surface-elevated p-8">
          <Ionicons name="search-outline" size={30} color="#8C8C86" />
          <Text variant="h3" className="mt-3">
            Kalem bulunamadı
          </Text>
          <Text variant="caption" className="mt-1 text-center text-content-secondary">
            Arama kelimesini veya kategori filtresini değiştir.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}
