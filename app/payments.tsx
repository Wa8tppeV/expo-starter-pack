import { Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { formatCurrency, formatDate } from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

export default function PaymentsScreen() {
  const router = useRouter();
  const projects = useProjectOfficeStore(state => state.projects);
  const disciplines = useProjectOfficeStore(state => state.disciplines);
  const professionals = useProjectOfficeStore(state => state.professionals);
  const payments = useProjectOfficeStore(state => state.payments);
  const sortedPayments = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return (
    <ScrollView
      className="bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-5 px-4 pb-12 pt-safe"
    >
      <View className="flex-row items-center justify-between pt-4">
        <View>
          <Text variant="h1-sm" className="text-content">
            Ödemeler
          </Text>
          <Text variant="caption" className="mt-1 text-content-secondary">
            {payments.length} ödeme kaydı
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ödeme ekle"
          onPress={() => router.push('/payments/new')}
          className="h-12 flex-row items-center gap-2 rounded-2xl bg-primary px-4 active:opacity-80"
        >
          <Ionicons name="add" size={21} color="#FFFFFF" />
          <Text variant="caption" className="text-white">
            Ödeme Ekle
          </Text>
        </Pressable>
      </View>

      <View className="gap-3">
        {sortedPayments.map(payment => {
          const project = projects.find(item => item.id === payment.projectId);
          const discipline = disciplines.find(item => item.id === payment.disciplineId);
          const person = professionals.find(item => item.id === payment.professionalId);
          return (
            <View
              key={payment.id}
              className="rounded-3xl border border-border bg-surface-elevated p-5"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text variant="h3" className="text-content">
                    {project?.name ?? 'Proje bulunamadı'}
                  </Text>
                  <Text variant="caption" className="mt-1 text-primary">
                    {discipline?.type} · {person?.name ?? 'Projeci bulunamadı'}
                  </Text>
                </View>
                <Text variant="h3-sm" className="text-success">
                  {formatCurrency(payment.amount)}
                </Text>
              </View>
              <View className="mt-4 flex-row items-center gap-2 border-t border-border pt-4">
                <Ionicons name="calendar-outline" size={16} color="#68615B" />
                <Text variant="caption" className="text-content-secondary">
                  {formatDate(payment.paidAt)}
                </Text>
              </View>
              {payment.note ? (
                <Text variant="caption" className="mt-2 text-content-secondary">
                  {payment.note}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
