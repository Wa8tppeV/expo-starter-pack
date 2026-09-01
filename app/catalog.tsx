import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { ScreenFrame, ScreenHeader } from '@components';
import {
  CatalogItem,
  CatalogItemKind,
  formatKurus,
  getActiveDraft,
  queryCatalog,
  useEstimateStore,
  YFK_CATALOG_SOURCE,
} from '@features';
import { Text } from '@ui';

import { OFFICIAL_CATALOG_ITEMS } from '../src/features/catalog/data/officialCatalog';

type KindFilter = CatalogItemKind | 'all';
type InstitutionFilter = 'all' | 'YFK' | 'İLBANK' | 'KVGM/VGM' | 'KGM' | 'DSİ';
type RecordTypeFilter = 'all' | 'rate' | 'unit_price';

const FILTERS: { kind: KindFilter; label: string }[] = [
  { kind: 'all', label: 'Tümü' },
  { kind: 'construction', label: 'İnşaat Pozları' },
  { kind: 'mechanical', label: 'Mekanik' },
  { kind: 'electrical', label: 'Elektrik' },
  { kind: 'labor', label: 'İşçilik' },
  { kind: 'material', label: 'Malzeme' },
  { kind: 'equipment', label: 'Makine' },
  { kind: 'transport', label: 'Nakliye' },
];

const KIND_LABELS: Record<CatalogItemKind, string> = {
  construction: 'İnşaat Pozu',
  electrical: 'Elektrik',
  equipment: 'Makine',
  labor: 'İşçilik',
  material: 'Malzeme',
  mechanical: 'Mekanik',
  transport: 'Nakliye',
};

const PAGE_SIZE = 100;
const RECORD_TYPE_FILTERS: { label: string; value: RecordTypeFilter }[] = [
  { label: 'Tüm Fiyatlar', value: 'all' },
  { label: 'Rayiçler', value: 'rate' },
  { label: 'Birim Fiyatlar', value: 'unit_price' },
];
const INSTITUTION_FILTERS: { label: string; value: InstitutionFilter }[] = [
  { label: 'Tüm Kurumlar', value: 'all' },
  { label: 'YFK', value: 'YFK' },
  { label: 'İLBANK', value: 'İLBANK' },
  { label: 'Restorasyon', value: 'KVGM/VGM' },
  { label: 'KGM', value: 'KGM' },
  { label: 'DSİ', value: 'DSİ' },
];

function itemId(item: CatalogItem) {
  return `${item.sourceVersionId}:${item.kind}:${item.code}`;
}

export default function CatalogScreen() {
  const [filter, setFilter] = useState<KindFilter>('all');
  const [institution, setInstitution] = useState<InstitutionFilter>('all');
  const [page, setPage] = useState(1);
  const [recordType, setRecordType] = useState<RecordTypeFilter>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const activeDraft = useEstimateStore(getActiveDraft);
  const setCatalogItemQuantity = useEstimateStore(state => state.setCatalogItemQuantity);

  useEffect(() => setPage(1), [deferredSearch, filter, institution, recordType]);

  const scopedItems = useMemo(
    () =>
      OFFICIAL_CATALOG_ITEMS.filter(item => {
        const itemInstitution = String(item.metadata?.institution ?? 'YFK');
        const itemRecordType = String(item.metadata?.recordType ?? 'rate');
        const matchesInstitution = institution === 'all' || itemInstitution === institution;
        const matchesRecordType =
          recordType === 'all' ||
          itemRecordType === recordType ||
          (recordType === 'rate' && itemRecordType.includes('rate')) ||
          (recordType === 'unit_price' && itemRecordType.includes('unit_price'));
        return matchesInstitution && matchesRecordType;
      }),
    [institution, recordType]
  );

  const result = useMemo(
    () =>
      queryCatalog(scopedItems, {
        filters: filter === 'all' ? undefined : { kinds: [filter] },
        page,
        pageSize: PAGE_SIZE,
        search: deferredSearch,
      }),
    [deferredSearch, filter, page, scopedItems]
  );
  const quantities = useMemo(
    () => new Map(activeDraft.lines.map(line => [line.itemId, line.quantity])),
    [activeDraft.lines]
  );

  const renderItem = ({ item }: { item: CatalogItem }) => {
    const quantity = quantities.get(itemId(item)) ?? 0;
    const basePriceKurus = Number(item.metadata?.baseUnitPriceKurus ?? 0);
    const installationPriceKurus = Number(item.metadata?.installationPriceKurus ?? 0);
    const hasOfficialPrice = item.metadata?.priced === true || item.unitPriceKurus !== 0;
    const isSelectable = item.unitPriceKurus > 0;

    return (
      <View className="mx-4 mb-3 rounded-3xl border border-border bg-surface-elevated p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="small" className="font-manrope-semibold text-primary-dark">
              {item.code} · {KIND_LABELS[item.kind]}
            </Text>
            <Text variant="body-medium" className="mt-1">
              {item.name}
            </Text>
            <Text variant="small" className="mt-1 text-content-tertiary">
              {item.category}
            </Text>
            <Text variant="small" className="mt-1 text-content-tertiary">
              {String(item.metadata?.institution ?? 'YFK')} ·{' '}
              {String(item.metadata?.recordType ?? 'rate').includes('unit_price')
                ? 'Resmî Birim Fiyat'
                : 'Resmî Rayiç'}
            </Text>
            {installationPriceKurus > 0 ? (
              <Text variant="small" className="mt-1 text-content-tertiary">
                Birim {formatKurus(basePriceKurus)} + montaj {formatKurus(installationPriceKurus)}
              </Text>
            ) : null}
          </View>
          <View className="items-end">
            <Text variant="body-medium">
              {hasOfficialPrice ? formatKurus(item.unitPriceKurus) : 'Formüllü poz'}
            </Text>
            <Text variant="small" className="text-content-tertiary">
              / {item.unit}
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-center justify-between border-t border-border pt-4">
          <View>
            <Text variant="small" className="text-content-secondary">
              Keşif miktarı
            </Text>
            <Text variant="caption" className="mt-1 font-manrope-semibold">
              {hasOfficialPrice
                ? formatKurus(Math.round(item.unitPriceKurus * quantity))
                : 'Fiyat yok'}
            </Text>
          </View>
          <View className="flex-row items-center rounded-2xl bg-surface p-1">
            <Pressable
              accessibilityLabel={`${item.name} miktar azalt`}
              className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated"
              disabled={quantity === 0}
              onPress={() => setCatalogItemQuantity(item, quantity - 1)}
            >
              <Ionicons name="remove" size={18} color={quantity === 0 ? '#B8B8B3' : '#171717'} />
            </Pressable>
            <Text variant="caption" className="w-20 text-center font-manrope-bold">
              {quantity} {item.unit}
            </Text>
            <Pressable
              accessibilityLabel={`${item.name} miktar artır`}
              className={`h-9 w-9 items-center justify-center rounded-xl ${
                isSelectable ? 'bg-primary' : 'bg-border'
              }`}
              disabled={!isSelectable}
              onPress={() => setCatalogItemQuantity(item, quantity + 1)}
            >
              <Ionicons name="add" size={18} color="#171717" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenFrame>
      <FlatList
        data={result.items as CatalogItem[]}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        keyExtractor={item => itemId(item)}
        maxToRenderPerBatch={12}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        windowSize={7}
        ListHeaderComponent={
          <View className="gap-5 px-4 pb-4 pt-2">
            <ScreenHeader
              action={
                <Pressable
                  accessibilityLabel="Maliyet ekranına dön"
                  className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-elevated"
                  onPress={() => router.back()}
                >
                  <Ionicons name="close" size={23} color="#171717" />
                </Pressable>
              }
              eyebrow="Resmî 2026 Tüm Pozlar"
              subtitle="Poz numarası veya adla ara, miktarı belirle ve keşfine ekle."
              title="Kalem Kataloğu"
            />
            <View className="flex-row items-center rounded-2xl border border-border bg-surface-elevated px-4 py-3">
              <Ionicons name="search-outline" size={20} color="#8C8C86" />
              <TextInput
                className="ml-3 flex-1 font-manrope text-body-sm text-content"
                onChangeText={setSearch}
                placeholder="Örn. beton, 15., KGM, DSİ..."
                placeholderTextColor="#8C8C86"
                returnKeyType="search"
                value={search}
              />
              {search ? (
                <Pressable accessibilityLabel="Aramayı temizle" onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#8C8C86" />
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              className="-mx-4"
              contentContainerClassName="gap-2 px-4"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {FILTERS.map(item => {
                const selected = filter === item.kind;
                return (
                  <Pressable
                    key={item.kind}
                    className={`rounded-full border px-4 py-2 ${
                      selected ? 'border-primary bg-primary' : 'border-border bg-surface-elevated'
                    }`}
                    onPress={() => setFilter(item.kind)}
                  >
                    <Text
                      variant="caption"
                      className={
                        selected ? 'font-manrope-semibold text-accent' : 'text-content-secondary'
                      }
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView
              className="-mx-4"
              contentContainerClassName="gap-2 px-4"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {INSTITUTION_FILTERS.map(item => {
                const selected = institution === item.value;
                return (
                  <Pressable
                    key={item.value}
                    className={`rounded-full border px-4 py-2 ${
                      selected ? 'border-info bg-info' : 'border-border bg-surface-elevated'
                    }`}
                    onPress={() => setInstitution(item.value)}
                  >
                    <Text
                      variant="caption"
                      className={
                        selected ? 'font-manrope-semibold text-white' : 'text-content-secondary'
                      }
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <ScrollView
              className="-mx-4"
              contentContainerClassName="gap-2 px-4"
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {RECORD_TYPE_FILTERS.map(item => {
                const selected = recordType === item.value;
                return (
                  <Pressable
                    key={item.value}
                    className={`rounded-full border px-4 py-2 ${
                      selected ? 'border-accent bg-accent' : 'border-border bg-surface-elevated'
                    }`}
                    onPress={() => setRecordType(item.value)}
                  >
                    <Text
                      variant="caption"
                      className={
                        selected ? 'font-manrope-semibold text-white' : 'text-content-secondary'
                      }
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View className="flex-row items-center justify-between">
              <Text variant="caption" className="text-content-secondary">
                {result.totalItems.toLocaleString('tr-TR')} kalem · {activeDraft.lines.length}{' '}
                seçili
              </Text>
              <Text variant="small" className="text-content-tertiary">
                {YFK_CATALOG_SOURCE.validFrom} itibarıyla
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="mx-4 items-center rounded-3xl border border-border bg-surface-elevated p-8">
            <Ionicons name="search-outline" size={30} color="#8C8C86" />
            <Text variant="h3" className="mt-3">
              Kalem bulunamadı
            </Text>
            <Text variant="caption" className="mt-1 text-center text-content-secondary">
              Aramayı veya kategori filtresini değiştir.
            </Text>
          </View>
        }
        ListFooterComponent={
          result.totalPages > 1 ? (
            <View className="flex-row items-center justify-between px-4 pb-8 pt-2">
              <Pressable
                className={`rounded-2xl border px-5 py-3 ${
                  result.hasPreviousPage ? 'border-border bg-surface-elevated' : 'border-border/50'
                }`}
                disabled={!result.hasPreviousPage}
                onPress={() => setPage(current => Math.max(1, current - 1))}
              >
                <Text variant="caption">Önceki</Text>
              </Pressable>
              <Text variant="caption" className="text-content-secondary">
                {result.page} / {result.totalPages}
              </Text>
              <Pressable
                className={`rounded-2xl border px-5 py-3 ${
                  result.hasNextPage ? 'border-primary bg-primary' : 'border-border/50'
                }`}
                disabled={!result.hasNextPage}
                onPress={() => setPage(current => current + 1)}
              >
                <Text variant="caption">Sonraki</Text>
              </Pressable>
            </View>
          ) : (
            <View className="h-8" />
          )
        }
      />
    </ScreenFrame>
  );
}
