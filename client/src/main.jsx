import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeModeProvider, useThemeMode } from './contexts/ThemeModeContext';
import './styles/main.scss';

function ThemedRoot() {
  const { muiTheme } = useThemeMode();
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

function Root() {
  return (
    <ThemeModeProvider>
      <ThemedRoot />
    </ThemeModeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
