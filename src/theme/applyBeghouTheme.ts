import { colors, typography } from './tokens';

/**
 * Writes Beghou tokens as CSS custom properties on :root.
 * Must run AFTER `@progress/kendo-theme-default/dist/all.css` is imported
 * so our overrides take precedence over Kendo's base theme.
 */
export function applyBeghouTheme(): void {
  const root = document.documentElement;

  const fontStack = typography.fontFamily.fallbackStack;

  const vars: Record<string, string> = {
    // Kendo typography
    '--kendo-font-family': fontStack,
    '--kendo-font-family-monospace':
      'ui-monospace, SFMono-Regular, Menlo, monospace',
    '--kendo-font-size': '14px',
    '--kendo-letter-spacing': '0',

    // Kendo brand colors (Primary → Navy)
    '--kendo-color-primary': colors.brand.navy.value,
    '--kendo-color-primary-hover': colors.brand.navyHover.value,
    '--kendo-color-primary-active': colors.brand.navyHover.value,
    '--kendo-color-primary-emphasis': colors.brand.navyHover.value,
    '--kendo-color-on-primary': colors.brand.onPrimary.value,

    // Kendo surfaces
    '--kendo-color-base': colors.surface.app.value,
    '--kendo-color-surface': colors.surface.card.value,
    '--kendo-color-surface-alt': colors.surface.soft.value,

    // Kendo semantic
    '--kendo-color-success': colors.semantic.success.main,
    '--kendo-color-success-hover': colors.semantic.success.hover,
    '--kendo-color-on-success': colors.semantic.success.onColor,
    '--kendo-color-warning': colors.semantic.warning.main,
    '--kendo-color-warning-hover': colors.semantic.warning.hover,
    '--kendo-color-on-warning': colors.semantic.warning.onColor,
    '--kendo-color-error': colors.semantic.error.main,
    '--kendo-color-error-hover': colors.semantic.error.hover,
    '--kendo-color-on-error': colors.semantic.error.onColor,
    '--kendo-color-info': colors.semantic.info.main,
    '--kendo-color-info-hover': colors.semantic.info.hover,
    '--kendo-color-on-info': colors.semantic.info.onColor,

    // Beghou-specific border tokens
    '--border-form-input': colors.border.formInput.value,
    '--border-container': colors.border.container.value,
    '--border-emphasized': colors.border.emphasized.value,

    // App-level convenience tokens (used by chrome components)
    '--beghou-navy': colors.brand.navy.value,
    '--beghou-navy-hover': colors.brand.navyHover.value,
    '--beghou-on-navy': colors.brand.onPrimary.value,
    '--beghou-surface-app': colors.surface.app.value,
    '--beghou-surface-card': colors.surface.card.value,
    '--beghou-surface-soft': colors.surface.soft.value,
    '--beghou-neutral-50': colors.neutral['50'].value,
    '--beghou-neutral-100': colors.neutral['100'].value,
    '--beghou-neutral-200': colors.neutral['200'].value,
    '--beghou-focus-ring': colors.focusRing.value,
    // Alt border: the more visible container border used to frame white cards.
    '--beghou-border-alt': colors.border.emphasized.value,
  };

  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}
