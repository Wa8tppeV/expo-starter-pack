import React from 'react';

import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  DisciplineDetail,
  WorkStatus,
  formatCurrency,
  formatDate,
  getProjectById,
  getProjectDisciplines,
} from '@features';
import { Text } from '@ui';

const statusClasses: Record<WorkStatus, { container: string; text: string }> = {
  Başlamadı: { container: 'bg-surface', text: 'text-content-secondary' },
  Çalışılıyor: { container: 'bg-info/10', text: 'text-info' },
  Revizyonda: { container: 'bg-warning/10', text: 'text-warning' },
  'Onay Bekliyor': { container: 'bg-primary/10', text: 'text-primary' },
  Tamamlandı: { container: 'bg-success/10', text: 'text-success' },
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3 border-b border-border py-3 last:border-b-0">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface">
        <Ionicons name={icon} size={17} color="#68615B" />
      </View>
      <View className="flex-1">
        <Text variant="small" className="text-content-tertiary">
          {label}
        </Text>
        <Text variant="body-sm" className="mt-0.5 text-content">
          {value}
        </Text>
      </View>
    </View>
  );
}

function FinancialItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text variant="small" className="text-content-tertiary">
        {label}
      </Text>
      <Text variant="caption" className="mt-1 font-manrope-bold text-content">
        {value}
      </Text>
    </View>
  );
}

function DisciplineCard({ discipline }: { discipline: DisciplineDetail }) {
  const statusStyle = statusClasses[discipline.status];
  const professionalName = discipline.professional?.name ?? 'Sorumlu atanmadı';
  const professionalCompany = discipline.professional?.company ?? 'Kişi seçilmedi';
  const professionalPhone = discipline.professional?.phone ?? 'Telefon girilmedi';
  const paidRatio =
    discipline.agreedFee === 0
      ? 0
      : Math.min((discipline.paidAmount / discipline.agreedFee) * 100, 100);

  return (
    <View className="rounded-3xl border border-border bg-surface-elevated p-5">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="h3" className="text-content">
          {discipline.type}
        </Text>
        <View className={`rounded-full px-3 py-1.5 ${statusStyle.container}`}>
          <Text variant="small" className={statusStyle.text}>
            {discipline.status}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-surface p-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/15">
          <Text variant="h3-sm" className="text-primary">
            {professionalName === 'Sorumlu atanmadı' ? '?' : professionalName.charAt(0)}
          </Text>
        </View>
        <View className="flex-1">
          <Text variant="body-medium" className="text-content">
            {professionalName}
          </Text>
          <Text variant="caption-sm" className="mt-0.5 text-content-secondary">
            {professionalCompany}
          </Text>
        </View>
        <Ionicons name="person-outline" size={19} color="#9B9389" />
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <Ionicons name="call-outline" size={17} color="#68615B" />
        <Text variant="caption" className="text-content-secondary">
          {professionalPhone}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3 border-y border-border py-4">
        <FinancialItem label="Anlaşma" value={formatCurrency(discipline.agreedFee)} />
        <FinancialItem label="Ödenen" value={formatCurrency(discipline.paidAmount)} />
        <FinancialItem label="Kalan" value={formatCurrency(discipline.remainingAmount)} />
      </View>

      <View className="mt-4 flex-row items-center justify-between">
        <Text variant="caption-sm" className="text-content-secondary">
          Ödeme ilerlemesi
        </Text>
        <Text variant="caption-sm" className="font-manrope-bold text-content">
          %{Math.round(paidRatio)}
        </Text>
      </View>
      <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <View className="h-full rounded-full bg-success" style={{ width: `${paidRatio}%` }} />
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={17} color="#C17F4F" />
        <Text variant="caption" className="text-content-secondary">
          Son tarih: {formatDate(discipline.dueDate)}
        </Text>
      </View>

      <View className="mt-3 rounded-2xl bg-surface p-3">
        <Text variant="small" className="text-content-tertiary">
          Not
        </Text>
        <Text variant="caption" className="mt-1 text-content-secondary">
          {discipline.note}
        </Text>
      </View>
    </View>
  );
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const project = projectId ? getProjectById(projectId) : undefined;

  if (!project) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Ionicons name="alert-circle-outline" size={38} color="#C73E3A" />
        <Text variant="h2-sm" className="text-center text-content">
          Proje bulunamadı
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="rounded-2xl bg-primary px-5 py-3 active:opacity-70"
        >
          <Text variant="body-medium" className="text-white">
            Projelere dön
          </Text>
        </Pressable>
      </View>
    );
  }

  const projectDisciplines = getProjectDisciplines(project.id);

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
          accessibilityLabel="Projeler listesine dön"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-elevated active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#68615B" />
        </Pressable>
        <View className="flex-1">
          <Text variant="caption" className="uppercase tracking-widest text-primary">
            Proje detayı
          </Text>
          <Text variant="h2-sm" className="mt-0.5 text-content" numberOfLines={1}>
            {project.name}
          </Text>
        </View>
      </View>

      <View className="rounded-3xl bg-primary p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="caption" className="text-white/70">
              Genel ilerleme
            </Text>
            <Text variant="h1" className="mt-1 text-white">
              %{project.progress}
            </Text>
          </View>
          <View className="rounded-full bg-white/15 px-3 py-1.5">
            <Text variant="caption-sm" className="text-white">
              {project.licenseStatus}
            </Text>
          </View>
        </View>
        <View className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
          <View
            className="h-full rounded-full bg-white"
            style={{ width: `${project.progress}%` }}
          />
        </View>
      </View>

      <View>
        <Text variant="h2-sm" className="mb-3 text-content">
          Genel bilgiler
        </Text>
        <View className="rounded-3xl border border-border bg-surface-elevated px-4">
          <InfoRow icon="business-outline" label="İşveren" value={project.employer} />
          <InfoRow
            icon="location-outline"
            label="Konum"
            value={`${project.neighborhood}, ${project.district} / ${project.city}`}
          />
          <InfoRow
            icon="map-outline"
            label="Ada / Parsel"
            value={`${project.block} / ${project.parcel}`}
          />
          <InfoRow icon="home-outline" label="Proje tipi" value={project.projectType} />
          <InfoRow
            icon="calendar-outline"
            label="Proje dönemi"
            value={`${formatDate(project.startDate)} — ${formatDate(project.estimatedEndDate)}`}
          />
          <InfoRow icon="document-text-outline" label="Genel not" value={project.note} />
        </View>
      </View>

      <View className="gap-3">
        <View>
          <Text variant="h2-sm" className="text-content">
            Disiplinler
          </Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            Sorumlu, teslim ve ödeme durumu
          </Text>
        </View>

        {projectDisciplines.map(discipline => (
          <DisciplineCard key={discipline.id} discipline={discipline} />
        ))}
      </View>
    </ScrollView>
  );
}
