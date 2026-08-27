import React, { ReactNode } from 'react';

import { View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenFrameProps {
  children: ReactNode;
}

export function ScreenFrame({ children }: ScreenFrameProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-1 bg-background">{children}</View>
    </SafeAreaView>
  );
}
