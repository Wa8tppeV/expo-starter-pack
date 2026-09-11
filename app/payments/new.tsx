import { useMemo, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { formatCurrency, getDisciplineDetail } from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

function parseAmount(value: string): number {
  return (
    Number(
      value
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.]/g, '')
    ) || 0
  );
}

export default function NewPaymentScreen() {
  const router = useRouter();
  const projects = useProjectOfficeStore(state => state.projects);
  const disciplines = useProjectOfficeStore(state => state.disciplines);
  const professionals = useProjectOfficeStore(state => state.professionals);
  const payments = useProjectOfficeStore(state => state.payments);
  const addPayment = useProjectOfficeStore(state => state.addPayment);
  const activeProjects = projects.filter(project => !project.archivedAt);
  const [projectId, setProjectId] = useState(activeProjects[0]?.id ?? '');
  const projectDisciplines = disciplines.filter(item => item.projectId === projectId);
  const [disciplineId, setDisciplineId] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const data = useMemo(
    () => ({ projects, disciplines, professionals, payments }),
    [projects, disciplines, professionals, payments]
  );
  const discipline = disciplines.find(item => item.id === disciplineId);
  const detail = discipline ? getDisciplineDetail(discipline, data) : undefined;
  const person = professionals.find(item => item.id === detail?.professionalId);

  const chooseProject = (id: string) => {
    setProjectId(id);
    setDisciplineId('');
  };

  const save = () => {
    const numericAmount = parseAmount(amount);
    if (!detail || !person) {
      Alert.alert('Disiplin seçin', 'Projeci atanmış bir disiplin seçmelisiniz.');
      return;
    }
    if (numericAmount <= 0 || numericAmount > detail.remainingAmount) {
      Alert.alert(
        'Tutarı kontrol edin',
        `Ödeme 0'dan büyük ve kalan ${formatCurrency(detail.remainingAmount)} tutarı aşmamalı.`
      );
      return;
    }
    addPayment({
      projectId,
      disciplineId: detail.id,
      professionalId: person.id,
      amount: numericAmount,
      paidAt,
      note,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
          <Text variant="h2-sm" className="text-content">
            Ödeme ekle
          </Text>
        </View>

        <View className="gap-2">
          <Text variant="caption" className="text-content-secondary">
            Proje
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {activeProjects.map(project => (
                <Pressable
                  key={project.id}
                  onPress={() => chooseProject(project.id)}
                  className={`min-h-12 justify-center rounded-2xl border px-4 ${
                    projectId === project.id
                      ? 'border-primary bg-primary'
                      : 'border-border bg-surface-elevated'
                  }`}
                >
                  <Text
                    variant="caption"
                    className={projectId === project.id ? 'text-white' : 'text-content'}
                  >
                    {project.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="gap-2">
          <Text variant="caption" className="text-content-secondary">
            Disiplin
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {projectDisciplines.map(item => {
              const assigned = Boolean(item.professionalId);
              return (
                <Pressable
                  key={item.id}
                  disabled={!assigned}
                  onPress={() => setDisciplineId(item.id)}
                  className={`min-h-12 justify-center rounded-2xl border px-4 ${
                    disciplineId === item.id
                      ? 'border-primary bg-primary'
                      : 'border-border bg-surface-elevated'
                  } ${assigned ? '' : 'opacity-40'}`}
                >
                  <Text
                    variant="caption"
                    className={disciplineId === item.id ? 'text-white' : 'text-content'}
                  >
                    {item.type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="rounded-2xl bg-surface p-4">
          <Text variant="small" className="text-content-tertiary">
            Projeci
          </Text>
          <Text variant="body-medium" className="mt-1 text-content">
            {person?.name ?? 'Önce disiplin seçin'}
          </Text>
          {detail ? (
            <Text variant="caption" className="mt-1 text-content-secondary">
              Kalan: {formatCurrency(detail.remainingAmount)}
            </Text>
          ) : null}
        </View>

        {[
          { label: 'Tutar', value: amount, onChangeText: setAmount, keyboardType: 'numeric' },
          { label: 'Tarih', value: paidAt, onChangeText: setPaidAt, keyboardType: 'default' },
        ].map(field => (
          <View key={field.label} className="gap-2">
            <Text variant="caption" className="text-content-secondary">
              {field.label}
            </Text>
            <TextInput
              accessibilityLabel={field.label}
              value={field.value}
              onChangeText={field.onChangeText}
              keyboardType={field.keyboardType as 'numeric' | 'default'}
              className="h-13 rounded-2xl border border-border bg-surface-elevated px-4 font-manrope text-base text-content"
            />
          </View>
        ))}
        <View className="gap-2">
          <Text variant="caption" className="text-content-secondary">
            Açıklama
          </Text>
          <TextInput
            accessibilityLabel="Açıklama"
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
            className="min-h-28 rounded-2xl border border-border bg-surface-elevated px-4 py-4 font-manrope text-base text-content"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={save}
          className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5"
        >
          <Text variant="body-medium" className="text-white">
            Ödemeyi kaydet
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
