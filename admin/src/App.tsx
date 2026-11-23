import { ThemeProvider } from 'styled-components'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme as antdTheme } from 'antd'
import Router from './router/router'
import theme from './styles/theme'
import { AdminProvider } from './context/admin'

// PrepRoom is dark-only. antd derives hover/active shades from real colours,
// so it gets the dark palette as hex (same values as the student app's App.tsx).
const hex = { surface : '#141417', line : '#26262b', ink : '#f3f3f5', ink4 : '#4c4c55', accent : '#4a9eff' }

const antd = {
  algorithm : antdTheme.darkAlgorithm,
  token : {
    colorPrimary : hex.accent,
    colorLink : hex.accent,
    colorBorder : hex.line,
    colorText : hex.ink,
    colorTextPlaceholder : hex.ink4,
    colorBgContainer : hex.surface,
    colorBgElevated : hex.surface,
    colorBgMask : 'rgba(0,0,0,0.6)',
    borderRadius : 8,
    borderRadiusLG : 12,
    fontFamily : 'Inter, -apple-system, ui-sans-serif, system-ui, sans-serif',
    fontSize : 14,
    controlHeight : 36,
  },
}

function App() {
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
