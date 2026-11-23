import { useMemo } from 'react'
import { ThemeProvider } from 'styled-components'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import Router from './router/router'
import theme from './styles/theme'
import { AdminProvider } from './context/admin'
import { useTheme } from './store/theme'

// antd derives hover/active shades from real colours, so it gets hex values per theme
// (same values as the student app's App.tsx)
const hex = {
  light : { surface : '#ffffff', line : '#e5e5e9', ink : '#262626', ink4 : '#babac1', accent : '#007aff' },
  dark : { surface : '#282828', line : '#3c3c3c', ink : '#ececec', ink4 : '#626262', accent : '#4a9eff' },
}

const antdThemeFor = (mode : 'light' | 'dark') => ({
  algorithm : mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token : {
    colorPrimary : hex[mode].accent,
    colorLink : hex[mode].accent,
    colorBorder : hex[mode].line,
    colorText : hex[mode].ink,
    colorTextPlaceholder : hex[mode].ink4,
    colorBgContainer : hex[mode].surface,
    colorBgElevated : hex[mode].surface,
    colorBgMask : mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(15,15,15,0.4)',
    borderRadius : 8,
    borderRadiusLG : 12,
    fontFamily : 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize : 14,
    controlHeight : 36,
  },
})

function App() {
  const { resolved } = useTheme()
  const antd = useMemo(() => antdThemeFor(resolved), [resolved])
  return (
    <ThemeProvider theme={theme}>
      <ConfigProvider theme={antd}>
        <AdminProvider>
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </AdminProvider>
      </ConfigProvider>
    </ThemeProvider>
  )
}

export default App
