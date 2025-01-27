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
            backdropFilter: 'blur(2px)',
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
          },
          root: {
            backdropFilter: 'blur(2px)'
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(2px)'
          },
          paper: darkMode
            ? {
                backgroundColor: '#242424'
              }
            : {}
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
      }
    }
  });
}

export default function CustomThemeProvider(props: any) {
  return (
    <ThemeProvider theme={newTheme(props.darkMode)}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: props.darkMode ? '#242424' : '#f8fafc',
            scrollbarWidth: 'thin',
            scrollbarColor: `${props.darkMode ? green[500] : green[400]} transparent`,
            WebkitOverflowScrolling: 'touch'
          },
          // mobile scrolling
          '@media (max-width: 768px)': {
            '*': {
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x proximity',
              '& > *': {
                scrollSnapAlign: 'start'
              },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              },
              '-webkit-overflow-scrolling': 'touch',
              overscrollBehavior: 'none',
              touchAction: 'pan-x pan-y'
            }
          },
          // desktop scrolling
          '@media (min-width: 769px)': {
            '*::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '*::-webkit-scrollbar-track': {
              background: 'transparent',
              border: '4px solid transparent'
            },
            '*::-webkit-scrollbar-thumb': {
              background: props.darkMode ? green[500] : green[400],
              borderRadius: '4px',
              border: '2px solid transparent'
            },
            '*::-webkit-scrollbar-thumb:hover': {
              background: props.darkMode ? green[400] : green[300]
            }
          }
        }}
      />
      {props.children}
    </ThemeProvider>
  );
}
