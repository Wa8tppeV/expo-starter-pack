import React from 'react';

import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import {
  Project,
  WorkStatus,
  formatCurrency,
  formatShortDate,
  getDashboardSummary,
  getUpcomingDiscipline,
  projects,
} from '@features';
import { useTheme } from '@hooks';
import { Text } from '@ui';

const statusClasses: Record<WorkStatus, { container: string; text: string }> = {
  Başlamadı: { container: 'bg-surface', text: 'text-content-secondary' },
  Çalışılıyor: { container: 'bg-info/10', text: 'text-info' },
  Revizyonda: { container: 'bg-warning/10', text: 'text-warning' },
  'Onay Bekliyor': { container: 'bg-primary/10', text: 'text-primary' },
  Tamamlandı: { container: 'bg-success/10', text: 'text-success' },
};

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="min-h-32 flex-1 rounded-3xl border border-border bg-surface-elevated p-4">
      <View className="mb-5 h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Ionicons name={icon} size={19} color="#C17F4F" />
      </View>
      <Text variant="h2-sm" className="text-content">
        {value}
      </Text>
      <Text variant="caption" className="mt-1 text-content-secondary">
        {label}
      </Text>
    </View>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const upcoming = getUpcomingDiscipline(project.id);
  const statusStyle = upcoming ? statusClasses[upcoming.status] : statusClasses.Tamamlandı;

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
          <View className="mt-1 flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={14} color="#9B9389" />
            <Text variant="caption-sm" className="text-content-tertiary">
              {project.district} / {project.city}
            </Text>
          </View>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${statusStyle.container}`}>
          <Text variant="small" className={statusStyle.text}>
            {upcoming?.status ?? 'Tamamlandı'}
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
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={16} color="#68615B" />
          <Text variant="caption" className="text-content-secondary">
            {upcoming
              ? `${upcoming.type} · ${formatShortDate(upcoming.dueDate)}`
              : 'Tüm disiplinler tamamlandı'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9B9389" />
      </View>
    </Pressable>
  );
}

export default function Index() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const summary = getDashboardSummary();
  const activeProjects = projects.filter(project => project.status === 'Aktif');

  return (
    <ScrollView
      className="bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 px-4 pb-12 pt-safe"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between pt-5">
        <View>
          <Text variant="caption" className="uppercase tracking-widest text-primary">
            DMH İnşaat
          </Text>
          <Text variant="h1-sm" className="mt-1 text-content">
            Proje Ofisi
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Temayı değiştir"
          onPress={toggleTheme}
          className="h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-elevated active:opacity-70"
        >
          <Ionicons
            name={theme === 'light' ? 'moon-outline' : 'sunny-outline'}
            size={22}
            color={theme === 'light' ? '#1A1715' : '#F5F1ED'}
          />
        </Pressable>
      </View>

      <View className="rounded-3xl bg-primary p-5">
        <View className="flex-row items-start justify-between">
          <View>
            <Text variant="caption" className="text-white/75">
              Toplam proje borcu
            </Text>
            <Text variant="h1" className="mt-1 text-white">
              {formatCurrency(summary.totalDebt)}
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <Ionicons name="wallet-outline" size={22} color="#FFFFFF" />
          </View>
        </View>
        <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-black/10 px-4 py-3">
          <View>
            <Text variant="small" className="text-white/70">
              Bu ay teslimli kalan
            </Text>
            <Text variant="h3-sm" className="mt-0.5 text-white">
              {formatCurrency(summary.dueThisMonth)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text variant="caption" className="text-white">
              Ödemeler
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View className="flex-row gap-3">
        <MetricCard
          icon="business-outline"
          value={String(summary.activeCount)}
          label="Aktif proje"
        />
        <MetricCard
          icon="checkmark-done-outline"
          value={String(summary.completedCount)}
          label="Tamamlanan"
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Geciken işleri görüntüle"
        className="border-error/20 bg-error/10 flex-row items-center gap-4 rounded-3xl border p-4 active:opacity-70"
      >
        <View className="bg-error/15 h-11 w-11 items-center justify-center rounded-2xl">
          <Ionicons name="alert-circle-outline" size={23} color="#C73E3A" />
        </View>
        <View className="flex-1">
          <Text variant="body-medium" className="text-content">
            {summary.overdueCount} geciken iş var
          </Text>
          <Text variant="caption" className="mt-0.5 text-content-secondary">
            Teslim tarihi geçen disiplinleri kontrol edin
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color="#C73E3A" />
      </Pressable>

      <View className="gap-3">
        <View className="mb-1 flex-row items-end justify-between">
          <View>
            <Text variant="h2-sm" className="text-content">
              Aktif projeler
            </Text>
            <Text variant="caption" className="mt-1 text-content-secondary">
              Son teslim ve ilerleme özeti
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tüm projeleri görüntüle"
            onPress={() => router.push('/projects')}
          >
            <Text variant="caption" className="text-primary">
              Tümünü gör
            </Text>
          </Pressable>
        </View>

        {activeProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </View>
    </ScrollView>
  );
}
