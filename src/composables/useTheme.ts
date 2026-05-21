import { reactive } from 'vue'

export interface ThemeConfig {
  primaryColor: string
  backgroundStyle: 'light' | 'dark' | 'gradient'
}

interface ThemePreset {
  layoutBg: string
  headerBg: string
  sidebarBg: string
  sidebarText: string
  sidebarActiveText: string
  mainBg: string
  mainText: string
  menuBg: string
  menuText: string
  menuActiveText: string
  menuActiveBg: string
  menuActiveAfterBg: string
  logoBg: string
  userInfoBg: string
  timeBg: string
  headerText: string
  headerSubText: string
  bgSecondary: string
  bgTertiary: string
  bgElevated: string
  borderColor: string
  textMuted: string
  textStrong: string
  successColor: string
  dangerColor: string
  warningColor: string
  infoColor: string
  gradientPrimary: string
  gradientSuccess: string
  gradientWarning: string
  gradientDanger: string
  tableStripe: string
  shadow: string
  sidebarShadow: string
}

const THEME_KEY = 'app-theme-config'

const defaultConfig: ThemeConfig = {
  primaryColor: '#667eea',
  backgroundStyle: 'gradient',
}

function loadConfig(): ThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw) return { ...defaultConfig, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...defaultConfig }
}

export const themeConfig = reactive<ThemeConfig>(loadConfig())

// ---- color utilities ----

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function mixColors(a: string, b: string, ratio: number) {
  const c1 = hexToRgb(a)
  const c2 = hexToRgb(b)
  const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio)
  const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio)
  const bl = Math.round(c1.b * (1 - ratio) + c2.b * ratio)
  return '#' + [r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// ---- theme presets ----

const lightPreset: ThemePreset = {
  layoutBg: '#f0f2f5',
  headerBg: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  sidebarBg: '#ffffff',
  sidebarText: '#606266',
  sidebarActiveText: '#409eff',
  mainBg: '#ffffff',
  mainText: '#303133',
  menuBg: 'transparent',
  menuText: '#606266',
  menuActiveText: '#409eff',
  menuActiveBg: 'rgba(64,158,255,0.08)',
  menuActiveAfterBg: 'linear-gradient(180deg, #409eff 0%, #66b1ff 100%)',
  logoBg: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  userInfoBg: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  timeBg: 'rgba(64,158,255,0.08)',
  headerText: '#ffffff',
  headerSubText: 'rgba(255,255,255,0.85)',
  bgSecondary: '#f5f7fa',
  bgTertiary: '#ebeef5',
  bgElevated: '#ffffff',
  borderColor: '#ebeef5',
  textMuted: '#909399',
  textStrong: '#303133',
  successColor: '#67c23a',
  dangerColor: '#f56c6c',
  warningColor: '#e6a23c',
  infoColor: '#909399',
  gradientPrimary: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  gradientSuccess: 'linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%)',
  gradientWarning: 'linear-gradient(135deg, #fdf6ec 0%, #fff8e1 100%)',
  gradientDanger: 'linear-gradient(135deg, #fef0f0 0%, #ffebee 100%)',
  tableStripe: '#fafafa',
  shadow: '0 4px 12px rgba(0,0,0,0.08)',
  sidebarShadow: '0 4px 16px rgba(0,0,0,0.06)',
}

const darkPreset: ThemePreset = {
  layoutBg: '#141414',
  headerBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  sidebarBg: '#1a1a2e',
  sidebarText: '#a0aec0',
  sidebarActiveText: '#ffffff',
  mainBg: '#1e1e1e',
  mainText: '#e0e0e0',
  menuBg: 'transparent',
  menuText: '#a0aec0',
  menuActiveText: '#ffffff',
  menuActiveBg: 'rgba(240,147,251,0.12)',
  menuActiveAfterBg: 'linear-gradient(180deg, #f093fb 0%, #f5576c 100%)',
  logoBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  userInfoBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  timeBg: 'rgba(255,255,255,0.06)',
  headerText: '#ffffff',
  headerSubText: 'rgba(255,255,255,0.55)',
  bgSecondary: '#252525',
  bgTertiary: '#2a2a2a',
  bgElevated: '#1e1e1e',
  borderColor: '#333333',
  textMuted: '#666666',
  textStrong: '#ffffff',
  successColor: '#67c23a',
  dangerColor: '#f56c6c',
  warningColor: '#e6a23c',
  infoColor: '#909399',
  gradientPrimary: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
  gradientSuccess: 'linear-gradient(135deg, rgba(103,194,58,0.15) 0%, rgba(103,194,58,0.08) 100%)',
  gradientWarning: 'linear-gradient(135deg, rgba(230,162,60,0.15) 0%, rgba(230,162,60,0.08) 100%)',
  gradientDanger: 'linear-gradient(135deg, rgba(245,108,108,0.15) 0%, rgba(245,108,108,0.08) 100%)',
  tableStripe: '#252525',
  shadow: '0 4px 12px rgba(0,0,0,0.3)',
  sidebarShadow: '0 4px 16px rgba(0,0,0,0.3)',
}

const gradientPreset: ThemePreset = {
  layoutBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  headerBg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  sidebarBg: 'linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)',
  sidebarText: '#b8c7ee',
  sidebarActiveText: '#ffffff',
  mainBg: 'rgba(255,255,255,0.95)',
  mainText: '#303133',
  menuBg: 'transparent',
  menuText: '#b8c7ee',
  menuActiveText: '#ffffff',
  menuActiveBg: 'rgba(240,147,251,0.2)',
  menuActiveAfterBg: 'linear-gradient(180deg, #f093fb 0%, #f5576c 100%)',
  logoBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  userInfoBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  timeBg: 'rgba(255,255,255,0.1)',
  headerText: '#ffffff',
  headerSubText: 'rgba(255,255,255,0.7)',
  bgSecondary: '#f5f7fa',
  bgTertiary: '#ebeef5',
  bgElevated: '#ffffff',
  borderColor: '#ebeef5',
  textMuted: '#909399',
  textStrong: '#303133',
  successColor: '#67c23a',
  dangerColor: '#f56c6c',
  warningColor: '#e6a23c',
  infoColor: '#909399',
  gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradientSuccess: 'linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%)',
  gradientWarning: 'linear-gradient(135deg, #fdf6ec 0%, #fff8e1 100%)',
  gradientDanger: 'linear-gradient(135deg, #fef0f0 0%, #ffebee 100%)',
  tableStripe: '#fafafa',
  shadow: '0 4px 12px rgba(0,0,0,0.08)',
  sidebarShadow: '0 8px 32px rgba(30,60,114,0.3)',
}

const presets: Record<string, ThemePreset> = {
  light: lightPreset,
  dark: darkPreset,
  gradient: gradientPreset,
}

// ---- CSS variable keys to apply ----

const PRESET_VAR_KEYS: Array<[string, keyof ThemePreset]> = [
  ['--app-layout-bg', 'layoutBg'],
  ['--app-header-bg', 'headerBg'],
  ['--app-sidebar-bg', 'sidebarBg'],
  ['--app-sidebar-text', 'sidebarText'],
  ['--app-sidebar-active-text', 'sidebarActiveText'],
  ['--app-main-bg', 'mainBg'],
  ['--app-main-text', 'mainText'],
  ['--app-menu-bg', 'menuBg'],
  ['--app-menu-text', 'menuText'],
  ['--app-menu-active-text', 'menuActiveText'],
  ['--app-menu-active-bg', 'menuActiveBg'],
  ['--app-menu-active-after-bg', 'menuActiveAfterBg'],
  ['--app-logo-bg', 'logoBg'],
  ['--app-user-info-bg', 'userInfoBg'],
  ['--app-time-bg', 'timeBg'],
  ['--app-header-text', 'headerText'],
  ['--app-header-sub-text', 'headerSubText'],
  ['--app-bg-secondary', 'bgSecondary'],
  ['--app-bg-tertiary', 'bgTertiary'],
  ['--app-bg-elevated', 'bgElevated'],
  ['--app-border-color', 'borderColor'],
  ['--app-text-muted', 'textMuted'],
  ['--app-text-strong', 'textStrong'],
  ['--app-success-color', 'successColor'],
  ['--app-danger-color', 'dangerColor'],
  ['--app-warning-color', 'warningColor'],
  ['--app-info-color', 'infoColor'],
  ['--app-gradient-primary', 'gradientPrimary'],
  ['--app-gradient-success', 'gradientSuccess'],
  ['--app-gradient-warning', 'gradientWarning'],
  ['--app-gradient-danger', 'gradientDanger'],
  ['--app-table-stripe', 'tableStripe'],
  ['--app-shadow', 'shadow'],
  ['--app-sidebar-shadow', 'sidebarShadow'],
]

// ---- apply theme ----

function applyPrimaryColor(color: string) {
  const root = document.documentElement
  root.style.setProperty('--el-color-primary', color)
  root.style.setProperty('--el-color-primary-light-3', mixColors(color, '#ffffff', 0.3))
  root.style.setProperty('--el-color-primary-light-5', mixColors(color, '#ffffff', 0.5))
  root.style.setProperty('--el-color-primary-light-7', mixColors(color, '#ffffff', 0.7))
  root.style.setProperty('--el-color-primary-light-8', mixColors(color, '#ffffff', 0.8))
  root.style.setProperty('--el-color-primary-light-9', mixColors(color, '#ffffff', 0.9))
  root.style.setProperty('--el-color-primary-dark-2', mixColors(color, '#000000', 0.2))
}

function applyPreset(preset: ThemePreset) {
  const root = document.documentElement
  for (const [varName, key] of PRESET_VAR_KEYS) {
    root.style.setProperty(varName, preset[key] as string)
  }
}

function applyDarkMode(style: string) {
  const html = document.documentElement
  if (style === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

export function applyTheme(config?: ThemeConfig) {
  const cfg = config ?? themeConfig
  applyPrimaryColor(cfg.primaryColor)
  applyDarkMode(cfg.backgroundStyle)
  const preset = presets[cfg.backgroundStyle] ?? gradientPreset
  applyPreset(preset)
}

export function saveTheme(config: ThemeConfig) {
  Object.assign(themeConfig, config)
  localStorage.setItem(THEME_KEY, JSON.stringify(themeConfig))
  applyTheme(themeConfig)
}

// Apply on load + inject transition style
applyTheme(themeConfig)

// Global transition for smooth theme switching
const style = document.createElement('style')
style.id = 'theme-transition'
style.textContent = `
  html, body, #app, .home-layout, .page-header, .page-aside, .page-main,
  .el-card, .el-menu, .el-table, .el-button, .el-tag, .el-input__wrapper,
  .stat-card, .table-mini-card, .revenue-item, .ranking-item, .breakdown-item,
  .activity-item, .chart-bar-item, .el-dialog, .el-form-item, .el-radio-group {
    transition: background-color 0.35s ease, color 0.35s ease,
                border-color 0.35s ease, background 0.35s ease,
                box-shadow 0.35s ease !important;
  }
`
document.head.appendChild(style)
