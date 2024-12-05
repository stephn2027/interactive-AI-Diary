import { createTheme } from '@mui/material/styles';
import { red, blue, green, orange, grey, teal, amber } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    mode: 'light', // Ensure the theme operates in light mode

    // Primary color palette
    primary: {
      main: blue[600], // Primary color
      light: blue[300], // Light variant
      dark: blue[900], // Dark variant
      contrastText: '#ffffff', // Text color on primary background
    },

    // Secondary color palette
    secondary: {
      main: orange[500], // Secondary color
      light: orange[300], // Light variant
      dark: orange[700], // Dark variant
      contrastText: '#ffffff', // Text color on secondary background
    },

    // Error color palette
    error: {
      main: red[700],
      light: red[400],
      dark: red[900],
      contrastText: '#ffffff',
    },

    // Warning color palette
    warning: {
      main: orange[700],
      light: orange[400],
      dark: orange[900],
      contrastText: '#ffffff',
    },

    // Info color palette
    info: {
      main: blue[500],
      light: blue[300],
      dark: blue[700],
      contrastText: '#ffffff',
    },

    // Success color palette
    success: {
      main: green[600],
      light: green[300],
      dark: green[700],
      contrastText: '#ffffff',
    },

    // Background colors
    background: {
      default: '#f5f5f5', // Light gray background
      paper: '#ffffff', // White background for Paper components
    },

    // Text colors
    text: {
      primary: grey[900], // Nearly black for primary text
      secondary: grey[700], // Dark gray for secondary text
      disabled: grey[500], // Medium gray for disabled text
    },

    // Additional custom color (optional)
    // tertiary: {
    //   main: teal[500],
    //   light: teal[300],
    //   dark: teal[700],
    //   contrastText: '#ffffff',
    // },
  },

  // Typography settings
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),

    h1: {
      fontWeight: 700,
      fontSize: '2.2rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.8rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.6rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none', // Prevent uppercase transformation
      fontWeight: 600,
    },
  },

  // Component-specific customizations
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Rounded corners
        },
        containedPrimary: {
          backgroundColor: blue[600],
          color: '#ffffff',
          '&:hover': {
            backgroundColor: blue[700],
          },
        },
        containedSecondary: {
          backgroundColor: orange[500],
          color: '#ffffff',
          '&:hover': {
            backgroundColor: orange[600],
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff', // Consistent white background
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px', // Rounded corners for cards
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Subtle shadow
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              borderColor: grey[400],
            },
            '&:hover fieldset': {
              borderColor: blue[600],
            },
            '&.Mui-focused fieldset': {
              borderColor: blue[600],
            },
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        body1: {
          color: grey[900],
        },
        body2: {
          color: grey[700],
        },
      },
    },
    // Add more component customizations as needed
  },
});

export default theme;