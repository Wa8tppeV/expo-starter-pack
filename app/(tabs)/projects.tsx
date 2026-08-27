import React from 'react';

import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { Screen } from '@components';
import { calculateEstimateTotals, formatKurus, useEstimateStore } from '@features';
import { Text } from '@ui';

const projects = [
  {
    id: 'cal-konut' as const,
    location: 'Çal / Denizli',
    name: 'Çal Konut Projesi',
    progress: 74,
    width: 'w-3/4',
  },
  {
    id: 'merkez-ofis' as const,
    location: 'Merkezefendi / Denizli',
    name: 'Merkez Ofis Renovasyonu',
    progress: 48,
    width: 'w-1/2',
  },
  {
    id: 'villa-uygulama' as const,
    location: 'Pamukkale / Denizli',
    name: 'Villa Uygulama Projesi',
    progress: 22,
    width: 'w-1/4',
  },
] as const;

export default function ProjectsScreen() {
  const router = useRouter();
  const drafts = useEstimateStore(state => state.drafts);
  const setActiveProject = useEstimateStore(state => state.setActiveProject);

  return (
    <Screen
      action={
        <Pressable className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
          <Ionicons name="add" size={24} color="#171717" />
        </Pressable>
      }
      subtitle="Şantiyelerin ilerlemesini ve durumunu takip et."
      title="Projeler"
    >
      <View className="flex-row gap-3">
        <View className="flex-1 rounded-3xl border border-border bg-surface-elevated p-4">
          <Text variant="h2">6</Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            Aktif
          </Text>
        </View>
        <View className="flex-1 rounded-3xl border border-border bg-surface-elevated p-4">
          <Text variant="h2">2</Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            Tamamlanan
          </Text>
        </View>
        <View className="flex-1 rounded-3xl border border-border bg-surface-elevated p-4">
          <Text variant="h2">1</Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            Planlanan
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3">
        <Ionicons name="search-outline" size={20} color="#8C8C86" />
        <Text variant="body-sm" className="text-content-tertiary">
          Proje ara
        </Text>
      </View>

      <View className="gap-3">
        {projects.map(project => {
          const estimate = calculateEstimateTotals(
            drafts[project.id].lines,
            drafts[project.id].adjustments
          );

          return (
            <Pressable
              key={project.name}
              className="rounded-3xl border border-border bg-surface-elevated p-5"
              onPress={() => {
                setActiveProject(project.id);
                router.push('/costs');
              }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text variant="h3">{project.name}</Text>
                  <Text variant="caption" className="mt-1 text-content-secondary">
                    {project.location}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8C8C86" />
              </View>
              <View className="mt-5 flex-row justify-between">
                <Text variant="caption" className="text-content-secondary">
                  İlerleme
                </Text>
                <Text variant="caption" className="font-manrope-semibold">
                  %{project.progress}
                </Text>
              </View>
              <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                <View className={`h-full rounded-full bg-primary ${project.width}`} />
              </View>
              <View className="mt-4 flex-row items-center justify-between border-t border-border pt-4">
                <View>
                  <Text variant="small" className="text-content-secondary">
                    Kayıtlı işçilik keşfi
                  </Text>
                  <Text variant="body-medium" className="mt-1">
                    {formatKurus(estimate.grandTotalKurus)}
                  </Text>
                </View>
                <Text variant="small" className="text-content-tertiary">
                  {estimate.itemCount} kalem
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
