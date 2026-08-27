import React, { useMemo } from 'react';

import { Linking, Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { Screen } from '@components';
import {
  calculateEstimateTotals,
  ESTIMATE_PROJECTS,
  EstimateAdjustments,
  EstimateProjectId,
  formatKurus,
  getActiveDraft,
  useEstimateStore,
  YFK_CATALOG_SOURCE,
} from '@features';
import { Text } from '@ui';

function RateControl({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
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
  const activeDraft = useEstimateStore(getActiveDraft);
  const clearActiveDraft = useEstimateStore(state => state.clearActiveDraft);
  const setActiveProject = useEstimateStore(state => state.setActiveProject);
  const setAdjustment = useEstimateStore(state => state.setAdjustment);
  const setLineQuantity = useEstimateStore(state => state.setLineQuantity);
  const totals = useMemo(
    () => calculateEstimateTotals(activeDraft.lines, activeDraft.adjustments),
    [activeDraft.adjustments, activeDraft.lines]
  );
  const changeAdjustment = (key: keyof EstimateAdjustments, value: number) =>
    setAdjustment(key, value);

  return (
    <Screen
      action={
        <Pressable
          accessibilityLabel="Resmî kaynağı aç"
          className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-elevated"
          onPress={() => Linking.openURL(YFK_CATALOG_SOURCE.sourceUrl)}
        >
          <Ionicons name="information-circle-outline" size={23} color="#D4AF37" />
        </Pressable>
      }
      subtitle="İşçilik, malzeme, makine ve nakliye kalemleriyle keşfini oluştur."
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
            const selected = project.id === activeDraft.projectId;
            return (
              <Pressable
                key={project.id}
                className={`min-w-56 rounded-2xl border p-4 ${selected ? 'border-primary bg-primary/10' : 'border-border bg-surface-elevated'}`}
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
              Doğrudan Maliyet
            </Text>
            <Text variant="body-medium" className="mt-1 text-white">
              {formatKurus(totals.directSubtotalKurus)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/10 p-3">
            <Text variant="small" className="text-white/60">
              Seçili Kalem
            </Text>
            <Text variant="body-medium" className="mt-1 text-primary-light">
              {totals.itemCount}
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

      <Pressable
        className="flex-row items-center justify-between rounded-3xl bg-primary p-5"
        onPress={() => router.push('/catalog')}
      >
        <View className="flex-1 pr-4">
          <Text variant="h3" className="text-accent">
            Keşfe Kalem Ekle
          </Text>
          <Text variant="caption" className="mt-1 text-accent/70">
            5.521 resmî rayiçte ara ve miktar gir
          </Text>
        </View>
        <Ionicons name="add-circle" size={32} color="#171717" />
      </Pressable>

      {activeDraft.lines.length > 0 ? (
        <View>
          <Text variant="h3">Seçili Kalemler</Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            Birim fiyatlar keşfe eklendiği tarihte kilitlenir.
          </Text>
          <View className="mt-4 gap-3">
            {activeDraft.lines.map(line => (
              <View
                key={line.itemId}
                className="rounded-3xl border border-border bg-surface-elevated p-4"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text variant="small" className="font-manrope-semibold text-primary-dark">
                      {line.code}
                    </Text>
                    <Text variant="body-medium" className="mt-1">
                      {line.description}
                    </Text>
                  </View>
                  <Text variant="body-medium">
                    {formatKurus(Math.round(line.unitPriceKurus * line.quantity))}
                  </Text>
                </View>
                <View className="mt-4 flex-row items-center justify-between border-t border-border pt-4">
                  <Text variant="small" className="text-content-secondary">
                    {formatKurus(line.unitPriceKurus)} / {line.unit}
                  </Text>
                  <View className="flex-row items-center rounded-2xl bg-surface p-1">
                    <Pressable
                      accessibilityLabel={`${line.description} miktar azalt`}
                      className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated"
                      onPress={() => setLineQuantity(line.code, line.quantity - 1)}
                    >
                      <Ionicons name="remove" size={18} color="#171717" />
                    </Pressable>
                    <Text variant="caption" className="w-20 text-center font-manrope-bold">
                      {line.quantity} {line.unit}
                    </Text>
                    <Pressable
                      accessibilityLabel={`${line.description} miktar artır`}
                      className="h-9 w-9 items-center justify-center rounded-xl bg-primary"
                      onPress={() => setLineQuantity(line.code, line.quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color="#171717" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View className="items-center rounded-3xl border border-dashed border-border bg-surface-elevated p-7">
          <Ionicons name="receipt-outline" size={30} color="#8C8C86" />
          <Text variant="h3" className="mt-3">
            Keşif henüz boş
          </Text>
          <Text variant="caption" className="mt-1 text-center text-content-secondary">
            İşçilikten malzemeye tüm kalemleri resmî katalogdan ekleyebilirsin.
          </Text>
        </View>
      )}

      <View className="rounded-3xl border border-border bg-surface-elevated p-5">
        <View className="mb-2 flex-row items-center justify-between">
          <View>
            <Text variant="h3">Teklif Ayarları</Text>
            <Text variant="small" className="mt-1 text-content-secondary">
              Doğrudan maliyet üstüne sırasıyla uygulanır.
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
              İşçilik / Malzeme
            </Text>
            <Text variant="caption">
              {formatKurus(totals.laborSubtotalKurus)} / {formatKurus(totals.materialSubtotalKurus)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="caption" className="text-content-secondary">
              Makine / Nakliye
            </Text>
            <Text variant="caption">
              {formatKurus(totals.equipmentSubtotalKurus)} /{' '}
              {formatKurus(totals.transportSubtotalKurus)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text variant="caption" className="text-content-secondary">
              Genel gider / Kâr / KDV
            </Text>
            <Text variant="caption">
              {formatKurus(totals.overheadKurus)} / {formatKurus(totals.profitKurus)} /{' '}
              {formatKurus(totals.vatKurus)}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        className="border-info/20 bg-info/10 rounded-3xl border p-4"
        onPress={() => Linking.openURL(YFK_CATALOG_SOURCE.sourceUrl)}
      >
        <View className="flex-row items-start">
          <Ionicons name="shield-checkmark-outline" size={20} color="#356FA8" />
          <View className="ml-3 flex-1">
            <Text variant="body-medium" className="text-info">
              {YFK_CATALOG_SOURCE.label}
            </Text>
            <Text variant="caption" className="mt-1 text-content-secondary">
              {YFK_CATALOG_SOURCE.validFrom} tarihinden geçerli · 5.521 benzersiz kalem
            </Text>
          </View>
          <Ionicons name="open-outline" size={17} color="#356FA8" />
        </View>
      </Pressable>
    </Screen>
  );
}
