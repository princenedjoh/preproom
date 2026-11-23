import Router from './router/router';
import { ThemeProvider } from "styled-components"
import { BrowserRouter } from 'react-router-dom';
import theme from './styles/theme';
import Context from './context/context';
import { ToastContainer, toast } from 'react-toastify';
import { ConfigProvider } from 'antd';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import SmoothScroll from './components/smoothScroll/smoothScroll';
import { useEffect } from 'react';
import { boot, useSession } from './store/session';
import { loadCatalog, useCatalog } from './data/catalog';

const antdTheme = {
  token : {
    colorPrimary : theme.colors2.main.primary,
    colorLink : theme.colors2.brand.blue,
    colorBorder : theme.colors.border.light.primary,
    colorText : theme.colors2.gray.gray1,
    colorTextPlaceholder : theme.colors2.gray.gray4,
    borderRadius : 9,
    fontFamily : theme.fonts.body,
    controlHeight : 40,
  }
}

const muiTheme = createTheme({
  palette : {
    primary : { main : theme.colors2.main.primary },
    text : { primary : theme.colors2.gray.gray1, secondary : theme.colors2.gray.gray3 },
  },
  typography : {
    fontFamily : theme.fonts.body,
    button : { textTransform : 'none', fontWeight : 700 },
  },
  shape : { borderRadius : 9 },
  components : {
    MuiChip : {
      styleOverrides : {
        root : {
          borderRadius : 9999,
          background : theme.colors2.gray.gray8,
          border : `1px solid ${theme.colors.border.light.primary}`,
        }
      }
    }
  }
})

function App() {

  // Re-render the tree when the catalog or session resolves
  useCatalog()
  useSession()
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
          <MuiThemeProvider theme={muiTheme}>
            <ConfigProvider theme={antdTheme}>
              <BrowserRouter>
                <SmoothScroll />
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
