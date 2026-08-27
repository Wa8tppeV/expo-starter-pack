import React, { ReactNode } from 'react';

import { ScrollView } from 'react-native';

import { ScreenFrame } from './ScreenFrame';
import { ScreenHeader } from './ScreenHeader';

interface ScreenProps {
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}

export function Screen({ action, children, eyebrow = 'DMH İnşaat', subtitle, title }: ScreenProps) {
  return (
    <ScreenFrame>
      <ScrollView
        className="bg-background"
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName="gap-6 px-4 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader action={action} eyebrow={eyebrow} subtitle={subtitle} title={title} />

        {children}
      </ScrollView>
    </ScreenFrame>
  );
}
