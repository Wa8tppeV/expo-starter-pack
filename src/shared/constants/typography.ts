/**
 * Typography system constants for the Coffee App
 * Defines font weights, variants, and styles following Tailwind/NativeWind patterns
 */

/**
 * Font weight constants matching Manrope font files
 */
export const FontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export type FontWeight = (typeof FontWeights)[keyof typeof FontWeights];

/**
 * All available typography variants
 * Maps directly to Tailwind fontSize and fontFamily classes
 */
export type TypographyVariant =
  | 'display'
  | 'display-sm'
  | 'h1'
  | 'h1-sm'
  | 'h2'
  | 'h2-sm'
  | 'h3'
  | 'h3-sm'
  | 'body'
  | 'body-sm'
  | 'body-medium'
  | 'caption'
  | 'caption-sm'
  | 'small';

/**
 * Typography variant metadata
 * Each variant includes the Tailwind fontSize and fontFamily classes to apply
 */
export interface TypographyVariantMeta {
  sizeClass: string;
  fontClass: string;
  fontWeight: FontWeight;
  description: string;
}

/**
 * Mapping of typography variants to their Tailwind classes and metadata
 * The sizeClass and fontClass are combined to form the full className
 * Example: "text-display font-manrope-extrabold"
 */
export const TypographyVariantMap: Record<TypographyVariant, TypographyVariantMeta> = {
  // Display: Large hero numbers and scores
  display: {
    sizeClass: 'text-display',
    fontClass: 'font-manrope-extrabold',
    fontWeight: FontWeights.extrabold,
    description: 'Display text: 56px, ExtraBold (800), for hero numbers',
  },
  'display-sm': {
    sizeClass: 'text-display-sm',
    fontClass: 'font-manrope-extrabold',
    fontWeight: FontWeights.extrabold,
    description: 'Display Small: 48px, ExtraBold (800), for large numbers',
  },

  // H1: Page titles
  h1: {
    sizeClass: 'text-h1',
    fontClass: 'font-manrope-bold',
    fontWeight: FontWeights.bold,
    description: 'Heading 1: 32px, Bold (700), for page titles',
  },
  'h1-sm': {
    sizeClass: 'text-h1-sm',
    fontClass: 'font-manrope-bold',
    fontWeight: FontWeights.bold,
    description: 'Heading 1 Small: 28px, Bold (700), for smaller page titles',
  },

  // H2: Section headers
  h2: {
    sizeClass: 'text-h2',
    fontClass: 'font-manrope-semibold',
    fontWeight: FontWeights.semibold,
    description: 'Heading 2: 24px, Semibold (600), for section headers',
  },
  'h2-sm': {
    sizeClass: 'text-h2-sm',
    fontClass: 'font-manrope-semibold',
    fontWeight: FontWeights.semibold,
    description: 'Heading 2 Small: 20px, Semibold (600), for smaller sections',
  },

  // H3: Subsection headers
  h3: {
    sizeClass: 'text-h3',
    fontClass: 'font-manrope-semibold',
    fontWeight: FontWeights.semibold,
    description: 'Heading 3: 18px, Semibold (600), for subsection headers',
  },
  'h3-sm': {
    sizeClass: 'text-h3-sm',
    fontClass: 'font-manrope-semibold',
    fontWeight: FontWeights.semibold,
    description: 'Heading 3 Small: 16px, Semibold (600), for smaller subsections',
  },

  // Body: Main text content
  body: {
    sizeClass: 'text-body',
    fontClass: 'font-manrope',
    fontWeight: FontWeights.regular,
    description: 'Body: 16px, Regular (400), for main text content',
  },
  'body-sm': {
    sizeClass: 'text-body-sm',
    fontClass: 'font-manrope',
    fontWeight: FontWeights.regular,
    description: 'Body Small: 15px, Regular (400), for smaller body text',
  },

  // Body Medium: Emphasized body text
  'body-medium': {
    sizeClass: 'text-body',
    fontClass: 'font-manrope-medium',
    fontWeight: FontWeights.medium,
    description: 'Body Medium: 16px, Medium (500), for emphasized body text',
  },

  // Caption: Labels and metadata
  caption: {
    sizeClass: 'text-caption',
    fontClass: 'font-manrope-medium',
    fontWeight: FontWeights.medium,
    description: 'Caption: 13px, Medium (500), for labels and metadata',
  },
  'caption-sm': {
    sizeClass: 'text-caption-sm',
    fontClass: 'font-manrope-medium',
    fontWeight: FontWeights.medium,
    description: 'Caption Small: 12px, Medium (500), for smaller labels',
  },

  // Small: Fine print
  small: {
    sizeClass: 'text-small',
    fontClass: 'font-manrope',
    fontWeight: FontWeights.regular,
    description: 'Small: 11px, Regular (400), for fine print',
  },
};

/**
 * Get the combined Tailwind className for a typography variant
 * @param variant - The typography variant
 * @returns The combined className string
 * @example
 * getTypographyClassName('h1') // => 'text-h1 font-manrope-bold'
 */
export function getTypographyClassName(variant: TypographyVariant): string {
  const meta = TypographyVariantMap[variant];
  return `${meta.sizeClass} ${meta.fontClass}`;
}

/**
 * Get metadata for a typography variant
 * @param variant - The typography variant
 * @returns The metadata object with size class, font class, weight, and description
 */
export function getTypographyMeta(variant: TypographyVariant): TypographyVariantMeta {
  return TypographyVariantMap[variant];
}
