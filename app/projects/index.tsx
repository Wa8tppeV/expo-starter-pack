import React, { useState } from 'react';

import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import {
  LicenseStatus,
  Project,
  ProjectOfficeData,
  formatShortDate,
  getUpcomingDiscipline,
} from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

const licenseClasses: Record<LicenseStatus, { container: string; text: string }> = {
  Hazırlanıyor: { container: 'bg-warning/10', text: 'text-warning' },
  Başvuruda: { container: 'bg-info/10', text: 'text-info' },
  'Ruhsat Alındı': { container: 'bg-success/10', text: 'text-success' },
};

function ProjectListCard({ project, data }: { project: Project; data: ProjectOfficeData }) {
  const router = useRouter();
  const upcoming = getUpcomingDiscipline(project.id, data);
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
  const [showArchived, setShowArchived] = useState(false);
  const projects = useProjectOfficeStore(state => state.projects);
  const disciplines = useProjectOfficeStore(state => state.disciplines);
  const professionals = useProjectOfficeStore(state => state.professionals);
  const payments = useProjectOfficeStore(state => state.payments);
  const data = { projects, disciplines, professionals, payments };
  const visibleProjects = projects.filter(project => Boolean(project.archivedAt) === showArchived);

  return (
    <ScrollView
      className="bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-5 px-4 pb-12 pt-safe"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between pt-4">
        <View>
          <Text variant="h1-sm" className="text-content">
            Projeler
          </Text>
          <Text variant="caption" className="mt-0.5 text-content-secondary">
            {visibleProjects.length} proje · {showArchived ? 'Arşiv' : 'Güncel durum'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yeni proje ekle"
          onPress={() => router.push('/projects/new')}
          className="h-12 flex-row items-center gap-2 rounded-2xl bg-primary px-4 active:opacity-80"
        >
          <Ionicons name="add" size={21} color="#FFFFFF" />
          <Text variant="caption" className="text-white">
            Yeni
          </Text>
        </Pressable>
      </View>

      <View className="flex-row rounded-2xl bg-surface p-1">
        {[
          { label: 'Aktif', value: false },
          { label: 'Arşiv', value: true },
        ].map(option => (
          <Pressable
            key={option.label}
            onPress={() => setShowArchived(option.value)}
            className={`min-h-11 flex-1 items-center justify-center rounded-xl ${
              showArchived === option.value ? 'bg-surface-elevated' : ''
            }`}
          >
            <Text
              variant="caption"
              className={showArchived === option.value ? 'text-primary' : 'text-content-secondary'}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-3">
        {visibleProjects.map(project => (
          <ProjectListCard key={project.id} project={project} data={data} />
        ))}
        {visibleProjects.length === 0 ? (
          <View className="items-center rounded-3xl border border-border bg-surface-elevated p-8">
            <Text variant="body" className="text-content-secondary">
              Bu bölümde proje yok.
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
