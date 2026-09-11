import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { ProjectForm } from '@features';
import { useProjectOfficeStore } from '@project-office-store';
import { Text } from '@ui';

export default function NewProjectScreen() {
  const router = useRouter();
  const addProject = useProjectOfficeStore(state => state.addProject);

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
          <View>
            <Text variant="h2-sm" className="text-content">
              Yeni proje
            </Text>
            <Text variant="caption" className="text-content-secondary">
              Altı disiplin otomatik oluşturulur
            </Text>
          </View>
        </View>
        <ProjectForm
          submitLabel="Projeyi oluştur"
          onSubmit={input => {
            const id = addProject(input);
            router.replace({ pathname: '/projects/[id]', params: { id } });
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
