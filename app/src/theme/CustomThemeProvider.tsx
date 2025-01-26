import { ThemeProvider } from '@emotion/react';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { green, teal } from '@mui/material/colors';
import { createTheme, Theme } from '@mui/material/styles';

function newTheme(darkMode: boolean): Theme {
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: green.A700,
        light: green.A400,
        dark: green[800]
      },
      secondary: {
        main: teal[500],
        light: teal[300],
        dark: teal[700]
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            textTransform: 'none',
            borderRadius:
              ownerState.size === 'small' ? '12px' : ownerState.size === 'large' ? '16px' : '14px'
          })
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            m: 1
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '16px'
          },
          paperFullScreen: {
            borderRadius: '0px'
          }
        }
      },
      MuiModal: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(2px)'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px'
            }
          }
        }
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: '16px'
          }
        }
      },
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
