import React, { useMemo, useState } from 'react';

import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@components';
import {
  calculateEstimateTotals,
  ESTIMATE_PROJECTS,
  EstimateAdjustments,
  EstimateProjectId,
  formatKurus,
  getActiveDraft,
  LABOR_CATEGORIES,
  LaborCategory,
  LABOR_RATE_SOURCE,
  LABOR_RATES,
  tryToKurus,
  useEstimateStore,
} from '@features';
import { Text } from '@ui';

type CategoryFilter = LaborCategory | 'Tümü';

interface RateControlProps {
  label: string;
  onChange: (value: number) => void;
  value: number;
}

function RateControl({ label, onChange, value }: RateControlProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-border py-3 last:border-b-0">
      <Text variant="body-sm" className="text-content-secondary">
        {label}
      </Text>
      <View className="flex-row items-center rounded-xl bg-surface p-1">
        <Pressable
          accessibilityLabel={`${label} azalt`}
          className="h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated"
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Ionicons name="remove" size={16} color="#171717" />
        </Pressable>
        <Text variant="caption" className="w-14 text-center font-manrope-bold">
          %{value}
        </Text>
        <Pressable
          accessibilityLabel={`${label} artır`}
          className="h-8 w-8 items-center justify-center rounded-lg bg-primary"
          onPress={() => onChange(Math.min(100, value + 1))}
        >
          <Ionicons name="add" size={16} color="#171717" />
        </Pressable>
      </View>
    </View>
  );
}

export default function CostsScreen() {
  const [category, setCategory] = useState<CategoryFilter>('Tümü');
  const [query, setQuery] = useState('');
  const activeDraft = useEstimateStore(getActiveDraft);
  const clearActiveDraft = useEstimateStore(state => state.clearActiveDraft);
  const setActiveProject = useEstimateStore(state => state.setActiveProject);
  const setAdjustment = useEstimateStore(state => state.setAdjustment);
  const setLineQuantity = useEstimateStore(state => state.setLineQuantity);

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

  const totals = useMemo(
    () => calculateEstimateTotals(activeDraft.lines, activeDraft.adjustments),
    [activeDraft.adjustments, activeDraft.lines]
  );
  const linesByCode = useMemo(
    () => new Map(activeDraft.lines.map(line => [line.code, line])),
    [activeDraft.lines]
  );

  const changeAdjustment = (key: keyof EstimateAdjustments, value: number) => {
    setAdjustment(key, value);
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
      subtitle="Projene işçilik ekle; gider, kâr ve KDV dâhil keşfini oluştur."
      title="Keşif ve Maliyet"
    >
      <View>
        <Text variant="h3">Proje Seçimi</Text>
        <Text variant="caption" className="mt-1 text-content-secondary">
          Her projenin keşfi ayrı ve kalıcı olarak saklanır.
        </Text>
        <ScrollView
          className="-mx-4 mt-3"
          contentContainerClassName="gap-2 px-4"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {ESTIMATE_PROJECTS.map(project => {
            const isSelected = project.id === activeDraft.projectId;

            return (
              <Pressable
                key={project.id}
                className={`min-w-56 rounded-2xl border p-4 ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border bg-surface-elevated'
                }`}
                onPress={() => setActiveProject(project.id as EstimateProjectId)}
              >
                <Text variant="body-medium">{project.name}</Text>
                <Text variant="small" className="mt-1 text-content-secondary">
                  {project.location}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="rounded-3xl bg-accent p-5">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text variant="caption" className="text-white/60">
              {activeDraft.projectName} · Genel Toplam
            </Text>
            <Text variant="h1-sm" className="mt-2 text-white">
              {formatKurus(totals.grandTotalKurus)}
            </Text>
          </View>
          {totals.itemCount > 0 ? (
            <Pressable className="rounded-full bg-white/10 px-3 py-2" onPress={clearActiveDraft}>
              <Text variant="small" className="font-manrope-semibold text-white">
                Temizle
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white/10 p-3">
            <Text variant="small" className="text-white/60">
              İşçilik
            </Text>
            <Text variant="body-medium" className="mt-1 text-white">
              {formatKurus(totals.laborSubtotalKurus)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/10 p-3">
            <Text variant="small" className="text-white/60">
              Saat / Kalem
            </Text>
            <Text variant="body-medium" className="mt-1 text-primary-light">
              {totals.totalHours} / {totals.itemCount}
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-center gap-2">
          <Ionicons name="cloud-done-outline" size={16} color="#E8D78D" />
          <Text variant="small" className="text-white/60">
            Taslak bu cihazda otomatik kaydediliyor
          </Text>
        </View>
      </View>

      <View className="rounded-3xl border border-border bg-surface-elevated p-5">
        <View className="mb-2 flex-row items-center justify-between">
          <View>
            <Text variant="h3">Teklif Ayarları</Text>
            <Text variant="small" className="mt-1 text-content-secondary">
              İşçilik üstüne sırasıyla uygulanır.
            </Text>
          </View>
          <Ionicons name="calculator-outline" size={22} color="#D4AF37" />
        </View>
        <RateControl
          label="Genel gider"
          onChange={value => changeAdjustment('overheadRate', value)}
          value={activeDraft.adjustments.overheadRate}
        />
        <RateControl
          label="Kâr"
          onChange={value => changeAdjustment('profitRate', value)}
          value={activeDraft.adjustments.profitRate}
        />
        <RateControl
          label="KDV"
          onChange={value => changeAdjustment('vatRate', value)}
          value={activeDraft.adjustments.vatRate}
        />
        <View className="mt-3 gap-2 border-t border-border pt-4">
          <View className="flex-row justify-between">
            <Text variant="caption" className="text-content-secondary">
              Genel gider
            </Text>
            <Text variant="caption">{formatKurus(totals.overheadKurus)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="caption" className="text-content-secondary">
              Kâr
            </Text>
            <Text variant="caption">{formatKurus(totals.profitKurus)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="caption" className="text-content-secondary">
              KDV
            </Text>
            <Text variant="caption">{formatKurus(totals.vatKurus)}</Text>
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
              {activeDraft.catalog.label}
            </Text>
            <Text variant="caption" className="mt-1 text-content-secondary">
              {activeDraft.catalog.validFrom} tarihinden geçerli · fiyatlar keşfe eklenince
              kilitlenir
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
          const selectedLine = linesByCode.get(item.code);
          const itemHours = selectedLine?.quantity ?? 0;
          const unitPriceKurus = selectedLine?.unitPriceKurus ?? tryToKurus(item.hourlyRate);
          const itemTotalKurus = Math.round(itemHours * unitPriceKurus);

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
                  <Text variant="body-medium">{formatKurus(unitPriceKurus)}</Text>
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
                    {formatKurus(itemTotalKurus)}
                  </Text>
                </View>
                <View className="flex-row items-center rounded-2xl bg-surface p-1">
                  <Pressable
                    accessibilityLabel={`${item.name} saat azalt`}
                    className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated"
                    disabled={itemHours === 0}
                    onPress={() => setLineQuantity(item.code, itemHours - 1)}
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
                    onPress={() => setLineQuantity(item.code, itemHours + 1)}
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
