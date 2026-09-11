import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { ProjectForm, getProjectById } from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projects = useProjectOfficeStore(state => state.projects);
  const disciplines = useProjectOfficeStore(state => state.disciplines);
  const professionals = useProjectOfficeStore(state => state.professionals);
  const payments = useProjectOfficeStore(state => state.payments);
  const updateProject = useProjectOfficeStore(state => state.updateProject);
  const project = getProjectById(id, { projects, disciplines, professionals, payments });

  if (!project) return null;

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
            Projeyi düzenle
          </Text>
        </View>
        <ProjectForm
          initialProject={project}
          submitLabel="Değişiklikleri kaydet"
          onSubmit={input => {
            updateProject(project.id, input);
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
