export const LABEL_COLOR_PALETTE = [
  '#2563EB',
  '#16A34A',
  '#DC2626',
  '#D97706',
  '#7C3AED',
  '#0891B2'
] as const;

export const DEFAULT_LABEL_COLOR = LABEL_COLOR_PALETTE[0];

const labelColorSet = new Set<string>(LABEL_COLOR_PALETTE);

export const isSupportedLabelColor = (value: unknown): value is string => (
  typeof value === 'string' && labelColorSet.has(value.toUpperCase())
);

export const normalizeLabelColor = (value: unknown): string => {
  if (typeof value !== 'string') return DEFAULT_LABEL_COLOR;
  const normalized = value.trim().toUpperCase();
  return labelColorSet.has(normalized) ? normalized : DEFAULT_LABEL_COLOR;
};
