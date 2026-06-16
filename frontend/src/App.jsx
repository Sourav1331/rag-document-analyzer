import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const isLight = theme === 'light'

    root.classList.toggle('theme-light', isLight)
    root.classList.toggle('theme-dark', !isLight)
    body.classList.toggle('theme-light', isLight)
    body.classList.toggle('theme-dark', !isLight)
    root.dataset.theme = theme
    body.dataset.theme = theme
    root.style.colorScheme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(current => current === 'light' ? 'dark' : 'light')
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/analyze" element={<AnalyzePage theme={theme} onToggleTheme={toggleTheme} />} />
    </Routes>
  )
}
