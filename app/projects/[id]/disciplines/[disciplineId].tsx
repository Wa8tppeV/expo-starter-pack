import { useState } from 'react';

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

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  WORK_STATUSES,
  WorkStatus,
  formatCurrency,
  getDisciplineDetail,
  getProjectById,
} from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

function parseAmount(value: string): number {
  const normalized = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  return Number(normalized) || 0;
}

function Input({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View className="gap-2">
      <Text variant="caption" className="text-content-secondary">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor="#9B9389"
        className={`rounded-2xl border border-border bg-surface-elevated px-4 font-manrope text-base text-content ${
          multiline ? 'min-h-28 py-4' : 'h-13'
        }`}
      />
    </View>
  );
}

export default function DisciplineEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; disciplineId: string }>();
  const projects = useProjectOfficeStore(state => state.projects);
  const disciplines = useProjectOfficeStore(state => state.disciplines);
  const professionals = useProjectOfficeStore(state => state.professionals);
  const payments = useProjectOfficeStore(state => state.payments);
  const updateDiscipline = useProjectOfficeStore(state => state.updateDiscipline);
  const data = { projects, disciplines, professionals, payments };
  const discipline = disciplines.find(item => item.id === params.disciplineId);
  const detail = discipline ? getDisciplineDetail(discipline, data) : undefined;
  const project = getProjectById(params.id, data);

  const [professionalId, setProfessionalId] = useState(detail?.professionalId ?? null);
  const [professionalName, setProfessionalName] = useState(detail?.professional?.name ?? '');
  const [company, setCompany] = useState(detail?.professional?.company ?? '');
  const [phone, setPhone] = useState(detail?.professional?.phone ?? '');
  const [agreedFee, setAgreedFee] = useState(String(detail?.agreedFee ?? 0));
  const [paidAmount, setPaidAmount] = useState(String(detail?.paidAmount ?? 0));
  const [dueDate, setDueDate] = useState(detail?.dueDate ?? '');
  const [status, setStatus] = useState<WorkStatus>(detail?.status ?? 'Başlamadı');
  const [note, setNote] = useState(detail?.note ?? '');

  if (!detail || !project) return null;

  const agreed = parseAmount(agreedFee);
  const paid = parseAmount(paidAmount);
  const remaining = Math.max(agreed - paid, 0);

  const chooseProfessional = (id: string) => {
    const selected = professionals.find(item => item.id === id);
    if (!selected) return;
    setProfessionalId(selected.id);
    setProfessionalName(selected.name);
    setCompany(selected.company ?? '');
    setPhone(selected.phone);
  };

  const save = () => {
    if (paid > agreed) {
      Alert.alert('Tutarları kontrol edin', 'Ödenen tutar anlaşma bedelinden büyük olamaz.');
      return;
    }
    updateDiscipline(detail.id, {
      professionalId,
      professionalName,
      professionalCompany: company,
      phone,
      agreedFee: agreed,
      paidAmount: paid,
      dueDate,
      status,
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
          <View className="flex-1">
            <Text variant="caption" className="text-primary">
              {project.name}
            </Text>
            <Text variant="h2-sm" className="text-content">
              {detail.type} düzenle
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Text variant="caption" className="text-content-secondary">
            Kayıtlı projeciler
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {professionals.map(person => (
                <Pressable
                  key={person.id}
                  onPress={() => chooseProfessional(person.id)}
                  className={`min-h-11 justify-center rounded-2xl border px-4 ${
                    professionalId === person.id
                      ? 'border-primary bg-primary'
                      : 'border-border bg-surface-elevated'
                  }`}
                >
                  <Text
                    variant="caption"
                    className={professionalId === person.id ? 'text-white' : 'text-content'}
                  >
                    {person.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <Input label="Sorumlu kişi" value={professionalName} onChangeText={setProfessionalName} />
        <Input label="Firma" value={company} onChangeText={setCompany} />
        <Input label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Input
              label="Anlaşma bedeli"
              value={agreedFee}
              onChangeText={setAgreedFee}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Input
              label="Ödenen"
              value={paidAmount}
              onChangeText={setPaidAmount}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View className="rounded-2xl bg-primary/10 p-4">
          <Text variant="small" className="text-content-secondary">
            Kalan alacak (otomatik)
          </Text>
          <Text variant="h2-sm" className="mt-1 text-primary">
            {formatCurrency(remaining)}
          </Text>
        </View>
        <Input label="Son teslim tarihi" value={dueDate} onChangeText={setDueDate} />

        <View className="gap-2">
          <Text variant="caption" className="text-content-secondary">
            Durum
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {WORK_STATUSES.map(item => (
              <Pressable
                key={item}
                onPress={() => setStatus(item)}
                className={`min-h-11 justify-center rounded-2xl border px-4 ${
                  status === item
                    ? 'border-primary bg-primary'
                    : 'border-border bg-surface-elevated'
                }`}
              >
                <Text variant="caption" className={status === item ? 'text-white' : 'text-content'}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Input label="Not" value={note} onChangeText={setNote} multiline />
        <Pressable
          accessibilityRole="button"
          onPress={save}
          className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5"
        >
          <Text variant="body-medium" className="text-white">
            Disiplini kaydet
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
