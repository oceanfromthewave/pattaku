import { createTheme } from '@mui/material/styles';

// Aligning MUI theme with the custom design system defined in variables.scss
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff9800', // Corresponds to --primary-500
    },
    secondary: {
      main: '#9c27b0', // Corresponds to --secondary-500
    },
    error: {
      main: '#f44336', // Corresponds to --error
    },
    warning: {
      main: '#ff9800', // Corresponds to --warning
    },
    info: {
      main: '#2196f3', // Corresponds to --info
    },
    success: {
      main: '#4caf50', // Corresponds to --success
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

export default theme;