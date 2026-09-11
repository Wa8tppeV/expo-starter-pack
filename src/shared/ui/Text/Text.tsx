import React, { forwardRef } from 'react';

import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import Animated from 'react-native-reanimated';

import { getTypographyClassName, TypographyVariant } from '@constants';

/**
 * Props for the Text component
 * Extends React Native TextProps with typography variant support
 */
export interface TextProps extends RNTextProps {
  /**
   * The typography variant to apply
   * Determines font size, font family, weight, and line height
   * @example
   * variant="h1"     // Bold heading, 32px
   * variant="body"   // Regular body text, 16px
   * variant="display" // Extra bold display text, 56px
   */
  variant?: TypographyVariant;

  /**
   * Additional Tailwind classes to merge with variant styles
   * Custom classes override variant classes when there are conflicts
   * @example
   * className="text-blue-500"  // Override text color
   * className="mb-4"           // Add margin
   */
  className?: string;

  /**
   * Test ID for testing purposes
   * Used in unit tests to query the component
   */
  testID?: string;

  /**
   * Children can be strings or React elements
   */
  children?: React.ReactNode;
}

/**
 * Text Component
 * A type-safe, typography-aware text component that integrates Manrope font
 * with Tailwind CSS classes through NativeWind.
 *
 * Provides a clean API for applying consistent typography across the app.
 *
 * @example
 * // Using typography variants
 * <Text variant="h1">Page Title</Text>
 * <Text variant="body">Body text content</Text>
 * <Text variant="caption">Small caption text</Text>
 *
 * @example
 * // With custom styling
 * <Text variant="h2" className="text-blue-500 mb-4">
 *   Styled Heading
 * </Text>
 *
 * @example
 * // Without variant (defaults to system font)
 * <Text>Unstyled text</Text>
 */
export const Text = forwardRef<RNText, TextProps>(
  ({ variant, className = '', testID, children, ...rest }, ref) => {
    // Build the combined className from variant and custom classes
    let combinedClassName = '';

    if (variant) {
      const variantClass = getTypographyClassName(variant);
      combinedClassName = `${variantClass} ${className}`.trim();
    } else {
      combinedClassName = className;
    }

    return (
      <RNText ref={ref} testID={testID} className={`text-content ${combinedClassName}`} {...rest}>
        {children}
      </RNText>
    );
  }
);

export const AnimatedText = Animated.createAnimatedComponent(Text);

Text.displayName = 'Text';
AnimatedText.displayName = 'AnimatedText';
