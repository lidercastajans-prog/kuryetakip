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
