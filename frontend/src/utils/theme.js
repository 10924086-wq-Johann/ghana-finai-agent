export const THEMES = {
  dark: {
    name: 'dark',
    label: '☀️',
    tooltip: 'Switch to light mode',

    // Backgrounds
    pageBg:       '#0a0e1a',
    cardBg:       '#0f172a',
    cardBg2:      '#1e293b',
    navBg:        '#0a0e1a',
    bannerBg:     '#0f172a',
    inputBg:      '#1e293b',

    // Borders
    border:       '#1e293b',
    border2:      '#334155',

    // Text
    textPrimary:  '#e2e8f0',
    textSecondary:'#94a3b8',
    textMuted:    '#64748b',
    textDim:      '#475569',
    textFaint:    '#334155',

    // Accents
    blue:         '#378ADD',
    green:        '#1D9E75',
    red:          '#E24B4A',
    orange:       '#FF9800',
    amber:        '#FFC107',
  },
  light: {
    name: 'light',
    label: '🌙',
    tooltip: 'Switch to dark mode',

    // Backgrounds
    pageBg:       '#f1f5f9',
    cardBg:       '#ffffff',
    cardBg2:      '#f8fafc',
    navBg:        '#ffffff',
    bannerBg:     '#ffffff',
    inputBg:      '#f1f5f9',

    // Borders
    border:       '#e2e8f0',
    border2:      '#cbd5e1',

    // Text
    textPrimary:  '#0f172a',
    textSecondary:'#334155',
    textMuted:    '#475569',
    textDim:      '#64748b',
    textFaint:    '#94a3b8',

    // Accents
    blue:         '#2563EB',
    green:        '#059669',
    red:          '#DC2626',
    orange:       '#EA580C',
    amber:        '#D97706',
  }
}

export function getTheme(themeName) {
  return THEMES[themeName] || THEMES.dark
}

export function getSavedTheme() {
  try {
    return localStorage.getItem('ghana-finai-theme') || 'dark'
  } catch {
    return 'dark'
  }
}

export function saveTheme(themeName) {
  try {
    localStorage.setItem('ghana-finai-theme', themeName)
  } catch {
    // localStorage not available
  }
}