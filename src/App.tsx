import { ConfigProvider, theme as antdTheme } from 'antd'

import EmptyView from '@/components/EmptyView'
import ImageList from '@/components/ImageList'
import useSettings from '@/hooks/useSettings'
import { useEffect, useState } from 'react'
import Header from './components/Header'

function App() {
  const { settings } = useSettings()
  const [theme, setTheme] = useState(settings.theme)

  useEffect(() => {
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
      }
    }

    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const initialTheme = mediaQuery.matches ? 'dark' : 'light'
      setTheme(initialTheme)
      mediaQuery.addEventListener('change', handleSystemThemeChange)

      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      }
    }
    setTheme(settings.theme)
  }, [settings.theme])

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="h-screen flex flex-col relative">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: settings.primaryColor
          },
          algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
        }}
      >
        <Header />
        <EmptyView />
        <ImageList />
      </ConfigProvider>
    </div>
  )
}

export default App
