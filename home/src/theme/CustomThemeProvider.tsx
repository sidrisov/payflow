import { ThemeProvider } from '@emotion/react';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { createTheme, Theme } from '@mui/material/styles';

function newTheme(darkMode: boolean): Theme {
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light'
    },
    components: {
      ...(darkMode
        ? {
            MuiDrawer: {
              styleOverrides: {
                paper: {
                  backgroundColor: '#242424'
                }
              }
            }
          }
        : {})
    }
  });
}

export default function CustomThemeProvider(props: any) {
  return (
    <ThemeProvider theme={newTheme(props.darkMode)}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: { backgroundColor: props.darkMode ? '#242424' : '#f8fafc' }
        }}
      />
      {props.children}
    </ThemeProvider>
  );
}
