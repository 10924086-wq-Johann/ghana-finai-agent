import { createContext, useContext, useState, useEffect } from 'react'
import { getTheme, getSavedTheme, saveTheme } from '../utils/theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(getSavedTheme)
  const theme = getTheme(themeName)

  useEffect(() => {
    saveTheme(themeName)
    // Update body background
    document.body.style.background = theme.pageBg
    document.body.style.color      = theme.textPrimary
  }, [themeName, theme])

  const toggleTheme = () => {
    setThemeName(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}