import { DEFAULT_QUALITY_KEY, PRIMARY_COLOR_KEY, THEME_KEY, type Theme } from '@/constants'
import type { GlobalSettings } from '@/types'
import { create } from 'zustand'

interface SettingsStore {
  settings: GlobalSettings
  changeTheme: (theme: Theme) => void
  changePrimaryColor: (color: string) => void
  changeDefaultQuality: (quality: number | null) => void
  changeSettings: (settings: GlobalSettings) => void
}

const useSettings = create<SettingsStore>((set, get) => ({
  settings: {
    theme: (localStorage.getItem(THEME_KEY) as Theme | null) || 'light',
    primaryColor: localStorage.getItem(PRIMARY_COLOR_KEY) || '#1677ff',
    defaultQuality: Number(localStorage.getItem(DEFAULT_QUALITY_KEY) || 80)
  },

  changeTheme: theme => {
    set({ settings: { ...get().settings, theme } })
    localStorage.setItem(THEME_KEY, theme)
  },

  changePrimaryColor: color => {
    set({ settings: { ...get().settings, primaryColor: color } })
    localStorage.setItem(PRIMARY_COLOR_KEY, color)
  },

  changeDefaultQuality: quality => {
    set({ settings: { ...get().settings, defaultQuality: quality || 80 } })
    localStorage.setItem(DEFAULT_QUALITY_KEY, String(quality))
  },

  changeSettings: settings => {
    set({ settings })
    localStorage.setItem(THEME_KEY, settings.theme)
    localStorage.setItem(PRIMARY_COLOR_KEY, settings.primaryColor)
    localStorage.setItem(DEFAULT_QUALITY_KEY, String(settings.defaultQuality))
  }
}))

export default useSettings
