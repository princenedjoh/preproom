import { ThemeProvider } from 'styled-components'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import Router from './router/router'
import theme from './styles/theme'
import { AdminProvider } from './context/admin'

// antd controls (selects, switches) follow the same tokens as the kit
const antdTheme = {
  token : {
    colorPrimary : theme.colors.main.primary,
    colorLink : theme.colors2.brand.blue,
    colorBorder : theme.colors.border.light.primary,
    colorText : theme.colors.main.primary,
    colorTextPlaceholder : theme.colors2.gray.gray4,
    fontFamily : theme.fonts.body,
    fontSize : 14,
    borderRadius : 9,
    controlHeight : 40,
    controlOutline : 'rgba(0, 145, 255, 0.12)',
  },
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ConfigProvider theme={antdTheme}>
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
