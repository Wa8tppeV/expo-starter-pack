import React, { ReactNode } from 'react';

import { View } from 'react-native';

import { Text } from '@ui';

interface ScreenHeaderProps {
  action?: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}

export function ScreenHeader({
  action,
  eyebrow = 'DMH İnşaat',
  subtitle,
  title,
}: ScreenHeaderProps) {
  return (
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
  );
}
