import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Button,
  Divider,
  Chip,
  useTheme,
  Fade,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Clear as ClearIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  Reply as ReplyIcon,
  PersonAdd as PersonAddIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useImprovedNotificationSocket from './Notifications/useImprovedNotificationSocket';
import { markAsRead as apiMarkAsRead, markAllAsRead, deleteNotification } from '../api/notificationApi';

const getNotificationIcon = (type) => {
  const iconProps = { fontSize: 'small' };
  switch (type) {
    case 'comment': return <CommentIcon {...iconProps} color="primary" />;
    case 'like': return <FavoriteIcon {...iconProps} color="error" />;
    case 'reply': return <ReplyIcon {...iconProps} color="success" />;
    case 'follow': return <PersonAddIcon {...iconProps} color="info" />;
    default: return <NotificationsIcon {...iconProps} />;
  }
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  let time;
  if (typeof timestamp === 'string') {
    time = timestamp.endsWith('Z') 
      ? new Date(new Date(timestamp).getTime() + 9 * 60 * 60 * 1000)
      : new Date(timestamp);
  } else {
    time = new Date(timestamp);
  }
  
  if (isNaN(time.getTime())) return '';
  
  const now = new Date();
  const diff = (now - time) / 1000;
  
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
};

function EnhancedNotificationSystem({ userId }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useImprovedNotificationSocket(userId);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
      try {
        await apiMarkAsRead(notification.id);
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }
    
    handleClose();
    
    if (notification.postId) {
      navigate(`/posts/${notification.postId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  return (
    <>
      <Tooltip title={`알림 ${unreadCount > 0 ? `(${unreadCount}개)` : ''}`}>
        <IconButton
          onClick={handleClick}
          size="large"
          sx={{
            position: 'relative',
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s ease',
            },
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.75rem',
                fontWeight: 600,
                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
              },
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsActiveIcon 
                sx={{ 
                  color: theme.palette.primary.main,
                  filter: 'drop-shadow(0 0 6px rgba(25, 118, 210, 0.4))',
                }} 
              />
            ) : (
              <NotificationsIcon sx={{ color: 'inherit' }} />
            )}
          </Badge>
          
          {/* 연결 상태 표시 */}
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isConnected 
                ? 'linear-gradient(45deg, #4caf50, #81c784)'
                : 'linear-gradient(45deg, #f44336, #ef5350)',
              boxShadow: `0 0 8px ${isConnected ? '#4caf50' : '#f44336'}`,
            }}
          />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          },
        }}
      >
        {/* 헤더 */}
        <Box
          sx={{
            p: 2,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
              : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                알림
              </Typography>
              <Chip
                icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
                label={isConnected ? '실시간' : '연결끊김'}
                size="small"
                color={isConnected ? 'success' : 'error'}
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
            
            {unreadCount > 0 && (
              <Button
                startIcon={<MarkEmailReadIcon />}
                onClick={handleMarkAllAsRead}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                모두 읽음
              </Button>
            )}
          </Box>
        </Box>

        {/* 알림 목록 */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon 
                sx={{ 
                  fontSize: 48, 
                  color: theme.palette.text.secondary,
                  mb: 2 
                }} 
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                새로운 알림이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                활동이 있으면 여기에 표시됩니다
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      cursor: 'pointer',
                      position: 'relative',
                      pl: 2,
                      pr: 1,
                      py: 1.5,
                      background: !notification.read 
                        ? `linear-gradient(135deg, ${theme.palette.primary.light}15, ${theme.palette.primary.main}08)`
                        : 'transparent',
                      borderLeft: !notification.read 
                        ? `4px solid ${theme.palette.primary.main}` 
                        : '4px solid transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        transform: 'translateX(4px)',
                        transition: 'all 0.3s ease',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(45deg, #424242, #616161)'
                            : 'linear-gradient(45deg, #e3f2fd, #bbdefb)',
                          border: `2px solid ${theme.palette.background.paper}`,
                          position: 'relative',
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Typography 
                          variant="subtitle2" 
                          fontWeight={!notification.read ? 600 : 400}
                          sx={{ mb: 0.5 }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mb: 0.5, lineHeight: 1.4 }}
                          >
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(notification.createdAt || notification.created_at)}
                            </Typography>
                            {!notification.read && (
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: theme.palette.primary.main,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        '.MuiListItem-root:hover &': {
                          opacity: 1,
                        },
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  
                  {index < notifications.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* 푸터 */}
        {notifications.length > 0 && (
          <Box
            sx={{
              p: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.default,
            }}
          >
            <Button
              fullWidth
              size="small"
              onClick={() => {
                handleClose();
                navigate('/notifications');
              }}
              sx={{ textTransform: 'none' }}
            >
              모든 알림 보기 →
            </Button>
          </Box>
        )}
      </Popover>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default EnhancedNotificationSystem;
