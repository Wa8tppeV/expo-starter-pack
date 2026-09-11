import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { formatCurrency, getProfessionalSummary } from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

export default function ProfessionalsScreen() {
  const router = useRouter();
  const projects = useProjectOfficeStore(state => state.projects);
  const disciplines = useProjectOfficeStore(state => state.disciplines);
  const professionals = useProjectOfficeStore(state => state.professionals);
  const payments = useProjectOfficeStore(state => state.payments);
  const data = { projects, disciplines, professionals, payments };

  return (
    <ScrollView
      className="bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-5 px-4 pb-12 pt-safe"
    >
      <View className="pt-4">
        <Text variant="h1-sm" className="text-content">
          Projeciler
        </Text>
        <Text variant="caption" className="mt-1 text-content-secondary">
          {professionals.length} mimar, mühendis ve uzman
        </Text>
      </View>

      <View className="gap-3">
        {professionals.map(person => {
          const summary = getProfessionalSummary(person.id, data);
          return (
            <Pressable
              key={person.id}
              accessibilityRole="button"
              accessibilityLabel={`${person.name} detayını aç`}
              onPress={() =>
                router.push({ pathname: '/professionals/[id]', params: { id: person.id } })
              }
              className="rounded-3xl border border-border bg-surface-elevated p-5 active:opacity-80"
            >
              <View className="flex-row items-start gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <Text variant="h3" className="text-primary">
                    {person.name.charAt(0)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text variant="h3" className="text-content">
                    {person.name}
                  </Text>
                  <Text variant="caption" className="mt-0.5 text-content-secondary">
                    {person.company ?? person.disciplines.join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color="#9B9389" />
              </View>
              <View className="mt-4 flex-row items-center gap-2">
                <Ionicons name="call-outline" size={16} color="#68615B" />
                <Text variant="caption" className="text-content-secondary">
                  {person.phone}
                </Text>
                <View className="mx-1 h-1 w-1 rounded-full bg-content-tertiary" />
                <Text variant="caption" className="text-content-secondary">
                  {summary.activeProjectCount} aktif proje
                </Text>
              </View>
              <View className="mt-4 flex-row gap-3 border-t border-border pt-4">
                {[
                  ['Anlaşma', summary.totalAgreed],
                  ['Ödenen', summary.totalPaid],
                  ['Kalan', summary.totalRemaining],
                ].map(([label, amount]) => (
                  <View key={String(label)} className="flex-1">
                    <Text variant="small" className="text-content-tertiary">
                      {label}
                    </Text>
                    <Text variant="caption-sm" className="mt-1 font-manrope-bold text-content">
                      {formatCurrency(Number(amount))}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
