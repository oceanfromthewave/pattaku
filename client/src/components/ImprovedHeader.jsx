import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Article as PostIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Login as LoginIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import EnhancedNotificationSystem from './EnhancedNotificationSystem';
import EnhancedDarkModeToggle, { useDarkMode } from './EnhancedDarkModeToggle';
import logo from '../assets/pattaku-transparent.png';

function ImprovedHeader() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isDark } = useDarkMode(); // isDark 변수 추가
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  const token = localStorage.getItem('token');
  const userInfo = token ? JSON.parse(localStorage.getItem('userInfo') || '{}') : null;
  const userId = userInfo?.id;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setUserMenuAnchor(null);
    navigate('/login');
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const menuItems = [
    { text: '홈', icon: <HomeIcon />, path: '/' },
    { text: '게시글', icon: <PostIcon />, path: '/posts' },
    { text: '스케줄', icon: <ScheduleIcon />, path: '/schedules' },
  ];

  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={toggleMobileMenu}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      }}
    >
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <img src={logo} alt="Pattaku Logo" style={{ height: 40, marginBottom: 8 }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
          Pattaku
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileMenuOpen(false);
            }}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'translateX(8px)',
                transition: 'all 0.3s ease',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ color: 'white' }} />
          </ListItem>
        ))}
        
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
        
        {token ? (
          <>
            <ListItem
              button
              onClick={() => {
                navigate('/mypage');
                setMobileMenuOpen(false);
              }}
              sx={{
                mx: 1,
                mb: 1,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateX(8px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="마이페이지" sx={{ color: 'white' }} />
            </ListItem>
            <ListItem
              button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              sx={{
                mx: 1,
                mb: 1,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateX(8px)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="로그아웃" sx={{ color: 'white' }} />
            </ListItem>
          </>
        ) : (
          <ListItem
            button
            onClick={() => {
              navigate('/login');
              setMobileMenuOpen(false);
            }}
            sx={{
              mx: 1,
              mb: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'translateX(8px)',
                transition: 'all 0.3s ease',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              <LoginIcon />
            </ListItemIcon>
            <ListItemText primary="로그인" sx={{ color: 'white' }} />
          </ListItem>
        )}
      </List>
    </Drawer>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
          sx={{
            background: isDark
              ? 'linear-gradient(135deg, #1a1b20 0%, #23242a 100%)'
              : 'linear-gradient(135deg, #fcf6e7 0%, #eddcb5 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${isDark ? '#23242a' : '#eddcb5'}`,
            boxShadow: isDark ? '0 3px 16px rgba(0,0,0,0.5)' : '0 3px 16px rgba(191,174,124,0.14)',
          }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {/* 모바일 메뉴 버튼 */}
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleMobileMenu}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* 로고 & 타이틀 */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link 
              to="/" 
              style={{ 
                textDecoration: 'none', 
                color: isDark ? '#a9c3fd' : '#977f45',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <img 
                src={logo} 
                alt="Pattaku Logo" 
                style={{ 
                  height: isMobile ? 32 : 40, 
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }} 
              />
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                sx={{ 
                  fontWeight: 900,
                  fontSize: isMobile ? '1em' : '1.33em',
                  color: isDark ? '#a9c3fd' : '#977f45',
                  letterSpacing: '-1.2px',
                  userSelect: 'none',
                  transition: 'color 0.16s',
                  '&:hover': {
                    color: isDark ? '#4076fa' : '#ffb6b6',
                  },
                }}
              >
                Pattaku
              </Typography>
            </Link>
          </Box>

          {/* 데스크톱 네비게이션 */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    mx: 0.5,
                    px: 2,
                    py: 1,
                    height: '38px',
                    borderRadius: '7px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1em',
                    color: isDark ? '#a9c3fd' : '#977f45',
                    '&:hover': {
                      color: isDark ? '#4076fa' : '#ffb6b6',
                      backgroundColor: isDark ? '#232942' : 'rgba(255,182,182,0.1)',
                      transform: 'none',
                      transition: 'all 0.16s ease',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {/* 우측 메뉴 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            {/* 다크모드 토글 */}
            <EnhancedDarkModeToggle />

            {token ? (
              <>
                {/* 알림 시스템 */}
                {userId && <EnhancedNotificationSystem userId={userId} />}
                
                {/* 사용자 아바타 & 메뉴 */}
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    {userInfo?.nickname?.charAt(0) || userInfo?.name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>

                {/* 사용자 드롭다운 메뉴 */}
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      border: `1px solid ${theme.palette.divider}`,
                    },
                  }}
                >
                  <MenuItem 
                    onClick={() => {
                      navigate('/mypage');
                      handleUserMenuClose();
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <PersonIcon sx={{ mr: 2, fontSize: 20 }} />
                    마이페이지
                  </MenuItem>
                  <MenuItem 
                    onClick={handleLogout}
                    sx={{ py: 1.5, color: 'error.main' }}
                  >
                    <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                    로그아웃
                  </MenuItem>
                </Menu>
              </>
            ) : (
              !isMobile && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  startIcon={<LoginIcon />}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  로그인
                </Button>
              )
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* 모바일 드로어 */}
      <MobileDrawer />
    </>
  );
}

export default ImprovedHeader;
