import React from 'react';

import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import {
  LicenseStatus,
  Project,
  formatShortDate,
  getUpcomingDiscipline,
  projects,
} from '@features';
import { Text } from '@ui';

const licenseClasses: Record<LicenseStatus, { container: string; text: string }> = {
  Hazırlanıyor: { container: 'bg-warning/10', text: 'text-warning' },
  Başvuruda: { container: 'bg-info/10', text: 'text-info' },
  'Ruhsat Alındı': { container: 'bg-success/10', text: 'text-success' },
};

function ProjectListCard({ project }: { project: Project }) {
  const router = useRouter();
  const upcoming = getUpcomingDiscipline(project.id);
  const licenseStyle = licenseClasses[project.licenseStatus];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${project.name} detayını aç`}
      onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })}
      className="rounded-3xl border border-border bg-surface-elevated p-5 active:opacity-70"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="h3" className="text-content">
            {project.name}
          </Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            {project.employer}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${licenseStyle.container}`}>
          <Text variant="small" className={licenseStyle.text}>
            {project.licenseStatus}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="location-outline" size={16} color="#68615B" />
          <Text variant="caption" className="text-content-secondary">
            {project.neighborhood}, {project.district} / {project.city}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="map-outline" size={16} color="#68615B" />
          <Text variant="caption" className="text-content-secondary">
            Ada {project.block} · Parsel {project.parcel}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <Text variant="caption" className="text-content-secondary">
          Genel ilerleme
        </Text>
        <Text variant="caption" className="font-manrope-bold text-content">
          %{project.progress}
        </Text>
      </View>
      <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${project.progress}%` }}
        />
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-border pt-4">
        <View className="flex-1 flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={16} color="#C17F4F" />
          <Text variant="caption" className="text-content-secondary">
            {upcoming
              ? `${upcoming.type} teslimi · ${formatShortDate(upcoming.dueDate)}`
              : 'Tüm disiplinler tamamlandı'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9B9389" />
      </View>
    </Pressable>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();

  return (
    <ScrollView
      className="bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-5 px-4 pb-12 pt-safe"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center gap-3 pt-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ana ekrana dön"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-elevated active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#68615B" />
        </Pressable>
        <View>
          <Text variant="h1-sm" className="text-content">
            Projeler
          </Text>
          <Text variant="caption" className="mt-0.5 text-content-secondary">
            {projects.length} proje · Güncel durum
          </Text>
        </View>
      </View>

      <View className="gap-3">
        {projects.map(project => (
          <ProjectListCard key={project.id} project={project} />
        ))}
      </View>
    </ScrollView>
  );
}
