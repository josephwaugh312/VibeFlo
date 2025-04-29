import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9333EA', // Purple 600 from Tailwind
    },
    secondary: {
      main: '#7E22CE', // Purple 700 from Tailwind
    },
    background: {
      default: '#121212',
      paper: 'rgba(31, 41, 55, 0.8)', // bg-gray-800 with opacity
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(209, 213, 219, 0.8)', // text-gray-300 with opacity
    }
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    button: {
      textTransform: 'none',
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121212',
          color: '#ffffff',
          minHeight: '100vh',
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#2b2b2b",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#6b6b6b",
            minHeight: 24,
            border: "3px solid #2b2b2b",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#2b2b2b",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(31, 41, 55, 0.8)', // bg-gray-800 with opacity
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.375rem', // rounded-md
        },
        contained: {
          backgroundColor: '#9333EA', // Purple 600
          '&:hover': {
            backgroundColor: '#7E22CE', // Purple 700
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem', // rounded-lg
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // shadow-md
        }
      }
    }
  },
}); 