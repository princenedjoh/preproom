import Router from './router/router';
import { ThemeProvider } from "styled-components"
import { BrowserRouter } from 'react-router-dom';
import theme from './styles/theme';
import Context from './context/context';
import { ToastContainer, toast } from 'react-toastify';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { useEffect, useMemo } from 'react';
import { useTheme } from './store/theme';
import { boot, useSession } from './store/session';
import { loadCatalog, useCatalog } from './data/catalog';

// antd and MUI derive hover/active shades from real colours, so they get hex values per theme
const hex = {
  light : { canvas : '#f7f8fa', surface : '#ffffff', line : '#e5e5e9', ink : '#262626', ink2 : '#54545c', ink4 : '#babac1', accent : '#007aff' },
  dark : { canvas : '#1a1a1a', surface : '#282828', line : '#3c3c3c', ink : '#ececec', ink2 : '#bebebe', ink4 : '#626262', accent : '#4a9eff' },
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
    fontFamily : theme.font.sans,
    controlHeight : 36,
  }
})

const muiThemeFor = (mode : 'light' | 'dark') => createTheme({
  palette : {
    mode,
    primary : { main : hex[mode].accent },
    background : { default : hex[mode].canvas, paper : hex[mode].surface },
    text : { primary : hex[mode].ink, secondary : hex[mode].ink2 },
    divider : hex[mode].line,
  },
  typography : {
    fontFamily : 'Inter, ui-sans-serif, system-ui, sans-serif',
    button : { textTransform : 'none', fontWeight : 500 },
  },
  shape : { borderRadius : 8 },
})

function App() {

  // Re-render the tree when the catalog or session resolves
  useCatalog()
  useSession()
  const { resolved } = useTheme()
  const antd = useMemo(() => antdThemeFor(resolved), [resolved])
  const mui = useMemo(() => muiThemeFor(resolved), [resolved])
  useEffect(()=>{
    loadCatalog()
    boot()
  },[])

  return (
    <div className="App">
      <header className="App-header">
      </header>
      <Context.Provider 
        value={
          [toast, ToastContainer]
        }
      >
        <ThemeProvider theme = {theme}>
          <MuiThemeProvider theme={mui}>
            <ConfigProvider theme={antd}>
              <BrowserRouter>
                <Router />
              </BrowserRouter>
            </ConfigProvider>
          </MuiThemeProvider>
        </ThemeProvider>
      </Context.Provider>
    </div>
  );
}

export default App;
