import { useState } from 'react';

import { Alert, Pressable, TextInput, View } from 'react-native';

import { Text } from '@ui';

import { NewProjectInput } from '../store/projectOfficeStore';
import { LICENSE_STATUSES, LicenseStatus, Project } from '../types';

interface ProjectFormProps {
  initialProject?: Project;
  submitLabel: string;
  onSubmit: (input: NewProjectInput) => void;
}

const emptyForm: NewProjectInput = {
  name: '',
  employer: '',
  city: 'Denizli',
  district: 'Çal',
  neighborhood: '',
  block: '',
  parcel: '',
  projectType: '',
  licenseStatus: 'Hazırlanıyor',
  startDate: new Date().toISOString().slice(0, 10),
  estimatedEndDate: '',
  note: '',
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
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
        placeholder={placeholder}
        placeholderTextColor="#9B9389"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-2xl border border-border bg-surface-elevated px-4 font-manrope text-base text-content ${
          multiline ? 'min-h-28 py-4' : 'h-13'
        }`}
      />
    </View>
  );
}

export function ProjectForm({ initialProject, submitLabel, onSubmit }: ProjectFormProps) {
  const [form, setForm] = useState<NewProjectInput>(() =>
    initialProject
      ? {
          name: initialProject.name,
          employer: initialProject.employer,
          city: initialProject.city,
          district: initialProject.district,
          neighborhood: initialProject.neighborhood,
          block: initialProject.block,
          parcel: initialProject.parcel,
          projectType: initialProject.projectType,
          licenseStatus: initialProject.licenseStatus,
          startDate: initialProject.startDate,
          estimatedEndDate: initialProject.estimatedEndDate,
          note: initialProject.note,
        }
      : emptyForm
  );

  const update = <K extends keyof NewProjectInput>(key: K, value: NewProjectInput[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.employer.trim()) {
      Alert.alert('Eksik bilgi', 'Proje adı ve işveren alanlarını doldurun.');
      return;
    }
    if (!form.startDate || !form.estimatedEndDate) {
      Alert.alert('Eksik tarih', 'Başlangıç ve tahmini bitiş tarihlerini girin.');
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      employer: form.employer.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      neighborhood: form.neighborhood.trim(),
      projectType: form.projectType.trim(),
      note: form.note.trim(),
    });
  };

  return (
    <View className="gap-5">
      <Field label="Proje adı" value={form.name} onChangeText={value => update('name', value)} />
      <Field
        label="İşveren"
        value={form.employer}
        onChangeText={value => update('employer', value)}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="İl" value={form.city} onChangeText={value => update('city', value)} />
        </View>
        <View className="flex-1">
          <Field
            label="İlçe"
            value={form.district}
            onChangeText={value => update('district', value)}
          />
        </View>
      </View>
      <Field
        label="Mahalle"
        value={form.neighborhood}
        onChangeText={value => update('neighborhood', value)}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field label="Ada" value={form.block} onChangeText={value => update('block', value)} />
        </View>
        <View className="flex-1">
          <Field
            label="Parsel"
            value={form.parcel}
            onChangeText={value => update('parcel', value)}
          />
        </View>
      </View>
      <Field
        label="Proje türü"
        value={form.projectType}
        onChangeText={value => update('projectType', value)}
        placeholder="Konut, villa, ticari..."
      />

      <View className="gap-2">
        <Text variant="caption" className="text-content-secondary">
          Ruhsat durumu
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {LICENSE_STATUSES.map(status => (
            <Pressable
              key={status}
              onPress={() => update('licenseStatus', status as LicenseStatus)}
              className={`min-h-11 justify-center rounded-2xl border px-4 ${
                form.licenseStatus === status
                  ? 'border-primary bg-primary'
                  : 'border-border bg-surface-elevated'
              }`}
            >
              <Text
                variant="caption"
                className={form.licenseStatus === status ? 'text-white' : 'text-content'}
              >
                {status}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field
            label="Başlangıç tarihi"
            value={form.startDate}
            onChangeText={value => update('startDate', value)}
            placeholder="YYYY-AA-GG"
          />
        </View>
        <View className="flex-1">
          <Field
            label="Tahmini bitiş"
            value={form.estimatedEndDate}
            onChangeText={value => update('estimatedEndDate', value)}
            placeholder="YYYY-AA-GG"
          />
        </View>
      </View>
      <Field
        label="Not"
        value={form.note}
        onChangeText={value => update('note', value)}
        multiline
      />
      <Pressable
        accessibilityRole="button"
        onPress={handleSubmit}
        className="min-h-14 items-center justify-center rounded-2xl bg-primary px-5 active:opacity-80"
      >
        <Text variant="body-medium" className="text-white">
          {submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}
