import React, { createContext, useContext, useState, useEffect } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';

// 다크모드 컨텍스트 생성
const DarkModeContext = createContext();

// 다크모드 프로바이더
export const DarkModeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    
    // body에 클래스 추가/제거
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// 다크모드 Hook
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode는 DarkModeProvider 내에서 사용해야 합니다');
  }
  return context;
};

// 다크모드 토글 컴포넌트
function EnhancedDarkModeToggle() {
  const { isDark, toggleDarkMode } = useDarkMode();
  const theme = useTheme();

  return (
    <Tooltip title={isDark ? "라이트 모드로 변경" : "다크 모드로 변경"}>
      <IconButton
        onClick={toggleDarkMode}
        size="large"
        sx={{
          color: 'inherit',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'rotate(180deg)',
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        {isDark ? (
          <LightModeIcon 
            sx={{
              filter: 'drop-shadow(0 0 8px #ffd700)',
              color: '#ffd700',
            }}
          />
        ) : (
          <DarkModeIcon 
            sx={{
              filter: 'drop-shadow(0 0 8px #4a90e2)',
              color: '#4a90e2',
            }}
          />
        )}
      </IconButton>
    </Tooltip>
  );
}

export default EnhancedDarkModeToggle;
