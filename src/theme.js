import { Platform } from 'react-native';

/**
 * Central design tokens — the single source of truth for the app's visual
 * language. Values mirror the palette already used across the screens so this
 * can be adopted incrementally without any visual change.
 *
 * Guideline (ui-ux-pro-max): semantic color tokens, 4/8dp spacing rhythm,
 * consistent radius/shadow scale, and one shared status-color helper.
 */

export const COLORS = {
  // Brand
  primary: '#EA580C',
  primaryDark: '#7C2D12',
  primaryTint: '#F97316',
  primarySoft: '#FFF7ED',
  primaryBorder: '#FFEDD5',

  // Neutrals / surfaces
  ink: '#111827',       // primary text & dark header
  inkDeep: '#0F172A',   // darkest background
  surface: '#FFFFFF',
  bg: '#F8F9FB',
  border: '#F3F4F6',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Feedback
  success: '#16A34A',
  successTint: '#22C55E',
  info: '#2563EB',
  infoTint: '#3B82F6',
  danger: '#DC2626',
  dangerTint: '#EF4444',
};

/** 4/8dp spacing scale. */
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

/** Corner radius scale. */
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 };

/** Type scale (1.25 ratio-ish) + weights used app-wide. */
export const TYPE = {
  h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '500' },
};

/** Cross-platform elevation presets. */
export const SHADOW = {
  card: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
    android: { elevation: 3 },
    web: { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
  }),
  modal: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24 },
    android: { elevation: 12 },
    web: { boxShadow: '0 12px 32px rgba(0,0,0,0.25)' },
  }),
};

/**
 * iOS Human Interface Guidelines tokens. Used by the HIG-styled screens so the
 * app reads as native iOS: grouped background, white inset cells, hairline
 * separators, system colors, and the SF type scale. The brand orange is kept as
 * the app's tint (the role systemBlue plays in stock iOS apps).
 *
 * Contrast (WCAG, verified): secondaryLabel #6E6E73 on white ≈ 5.0:1 (PASS);
 * tertiaryLabel #8E8E93 only for large/decorative text.
 */
export const HIG = {
  groupedBg: '#F2F2F7',       // systemGroupedBackground
  cardBg: '#FFFFFF',          // secondarySystemGroupedBackground (inset cells)
  label: '#1C1C1E',           // label
  secondaryLabel: '#6E6E73',  // secondaryLabel (opaque, passes 4.5:1 on white)
  tertiaryLabel: '#8E8E93',   // systemGray — large/decorative only
  separator: '#C6C6C8',       // opaqueSeparator
  // System accent colors (iOS light)
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  indigo: '#5856D6',
  purple: '#AF52DE',
  tint: '#EA580C',            // brand tint
  // Continuous-corner radii
  radiusCell: 10,
  radiusCard: 16,
  radiusButton: 14,
};

/** SF Pro type scale (point sizes + weights) per HIG Typography. */
export const HIG_TYPE = {
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.37 },
  title1: { fontSize: 28, fontWeight: '700' },
  title2: { fontSize: 22, fontWeight: '700' },
  title3: { fontSize: 20, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  callout: { fontSize: 16, fontWeight: '400' },
  subhead: { fontSize: 15, fontWeight: '400' },
  footnote: { fontSize: 13, fontWeight: '400' },
  caption1: { fontSize: 12, fontWeight: '400' },
};

/**
 * Order-status color set — one definition shared by the Dashboard and Orders
 * screens (previously duplicated in both). Returns { bg, text, dot }.
 */
export const statusStyle = (status) => {
  switch (status) {
    case 'Bekliyor': return { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' };
    case 'Yolda': return { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' };
    case 'Teslim Edildi': return { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' };
    default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF' };
  }
};
