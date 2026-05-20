import colorTokens from '../../beghou-color-tokens.json';
import typographyTokens from '../../beghou-typography-tokens.json';

export const colors = colorTokens;
export const typography = typographyTokens;

export const theme = {
  colors,
  typography,
} as const;

export type Theme = typeof theme;
