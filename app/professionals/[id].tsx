import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  formatCurrency,
  formatDate,
  getProfessionalAssignments,
  getProfessionalSummary,
} from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

export default function ProfessionalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projects = useProjectOfficeStore(state => state.projects);
  const disciplines = useProjectOfficeStore(state => state.disciplines);
  const professionals = useProjectOfficeStore(state => state.professionals);
  const payments = useProjectOfficeStore(state => state.payments);
  const data = { projects, disciplines, professionals, payments };
  const person = professionals.find(item => item.id === id);

  if (!person) return null;

  const summary = getProfessionalSummary(person.id, data);
  const assignments = getProfessionalAssignments(person.id, data);

  return (
    <ScrollView
      className="bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-5 px-4 pb-12 pt-safe"
    >
      <View className="flex-row items-center gap-3 pt-4">
        <Pressable
          accessibilityLabel="Geri dön"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-elevated"
        >
          <Ionicons name="chevron-back" size={22} color="#68615B" />
        </Pressable>
        <View className="flex-1">
          <Text variant="h2-sm" className="text-content">
            {person.name}
          </Text>
          <Text variant="caption" className="text-content-secondary">
            {person.company ?? person.disciplines.join(' · ')} · {person.phone}
          </Text>
        </View>
      </View>

      <View className="rounded-3xl bg-primary p-5">
        <Text variant="caption" className="text-white/75">
          Toplam kalan alacak
        </Text>
        <Text variant="h1" className="mt-1 text-white">
          {formatCurrency(summary.totalRemaining)}
        </Text>
        <View className="mt-4 flex-row gap-4 border-t border-white/20 pt-4">
          <View className="flex-1">
            <Text variant="small" className="text-white/70">
              Toplam anlaşma
            </Text>
            <Text variant="caption" className="mt-1 text-white">
              {formatCurrency(summary.totalAgreed)}
            </Text>
          </View>
          <View className="flex-1">
            <Text variant="small" className="text-white/70">
              Toplam ödenen
            </Text>
            <Text variant="caption" className="mt-1 text-white">
              {formatCurrency(summary.totalPaid)}
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3">
        <Text variant="h2-sm" className="text-content">
          Çalıştığı projeler
        </Text>
        {assignments.map(({ project, discipline }) => (
          <Pressable
            key={discipline.id}
            onPress={() =>
              router.push({ pathname: '/projects/[id]', params: { id: project?.id ?? '' } })
            }
            className="rounded-3xl border border-border bg-surface-elevated p-5 active:opacity-80"
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text variant="h3" className="text-content">
                  {project?.name}
                </Text>
                <Text variant="caption" className="mt-1 text-primary">
                  {discipline.type} · {discipline.status}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color="#9B9389" />
            </View>
            <Text variant="caption" className="mt-3 text-content-secondary">
              Son tarih {formatDate(discipline.dueDate)}
            </Text>
            <Text variant="caption" className="mt-1 text-content-secondary">
              {formatCurrency(discipline.paidAmount)} ödendi ·{' '}
              {formatCurrency(discipline.remainingAmount)} kaldı
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
