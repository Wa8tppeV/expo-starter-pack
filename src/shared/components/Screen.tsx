import React, { ReactNode } from 'react';

import { ScrollView, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@ui';

interface ScreenProps {
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}

export function Screen({ action, children, eyebrow = 'DMH İnşaat', subtitle, title }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView
        className="bg-background"
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName="gap-6 px-4 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pt-2">
          <View className="flex-1 pr-4">
            <Text
              variant="caption"
              className="font-manrope-semibold uppercase tracking-widest text-primary"
            >
              {eyebrow}
            </Text>
            <Text variant="h1" className="mt-1 text-content">
              {title}
            </Text>
            <Text variant="body-sm" className="mt-1 text-content-secondary">
              {subtitle}
            </Text>
          </View>
          {action}
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
