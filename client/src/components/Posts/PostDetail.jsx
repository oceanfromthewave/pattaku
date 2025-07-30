import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ImageList,
  ImageListItem,
  Link,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import CommentList from './CommentList';
import { notifySuccess, notifyError } from '../../utils/notify';
import { getPost, deletePost, likePost, dislikePost } from '../../api/postApi';

const API_SERVER = import.meta.env.VITE_API_SERVER || '';
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || (API_SERVER + '/uploads');

function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const data = await getPost(postId);
        setPost(data);
        setLikeCount(data.likes || 0);
        setDislikeCount(data.dislikes || 0);
        setIsLiked(data.isLiked || false);
        setIsDisliked(data.isDisliked || false);
      } catch (err) {
        notifyError(err.message || 'Failed to load post.');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(postId);
      notifySuccess('Post deleted successfully.');
      navigate('/posts');
    } catch (err) {
      notifyError(err.message || 'Failed to delete post.');
    }
  };

  const handleLike = async () => {
    try {
      const data = await likePost(postId);
      setLikeCount(data.likes);
      setDislikeCount(data.dislikes);
      setIsLiked(data.liked);
      setIsDisliked(data.disliked);
      notifySuccess(data.liked ? 'Liked!' : 'Like cancelled.');
    } catch (err) {
      notifyError(err.message || 'Failed to process like.');
    }
  };

  const handleDislike = async () => {
    try {
      const data = await dislikePost(postId);
      setLikeCount(data.likes);
      setDislikeCount(data.dislikes);
      setIsLiked(data.liked);
      setIsDisliked(data.disliked);
      notifySuccess(data.disliked ? 'Disliked!' : 'Dislike cancelled.');
    } catch (err) {
      notifyError(err.message || 'Failed to process dislike.');
    }
  };

  const renderAttachments = () => {
    if (!post?.files || post.files.length === 0) return null;
    return (
      <ImageList sx={{ width: '100%', height: 'auto' }} cols={3} rowHeight={164}>
        {post.files.map((file, idx) => {
          const fileUrl = file.url.startsWith('http')
            ? file.url
            : `${UPLOADS_URL}/${file.url.replace(/^\/?uploads\//, '')}`;
          return fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <ImageListItem key={idx}>
              <img
                srcSet={`${fileUrl}?w=164&h=164&fit=crop&auto=format 1x,
                        ${fileUrl}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                src={`${fileUrl}?w=164&h=164&fit=crop&auto=format`}
                alt={`Attachment ${idx + 1}`}
                loading="lazy"
                style={{ objectFit: 'contain' }}
              />
            </ImageListItem>
          ) : (
            <ImageListItem key={idx}>
              <Link href={fileUrl} download target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid #eee', textDecoration: 'none', color: 'primary.main' }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', textAlign: 'center' }}>
                  {file.name || 'Download File'}
                </Typography>
              </Link>
            </ImageListItem>
          );
        })}
      </ImageList>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading post...</Typography>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Post not found.</Typography>
      </Container>
    );
  }

  const isAuthor = String(post.user_id) === String(userId);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {post.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 2 }}>
          <Typography variant="subtitle2">
            By {post.author_nickname || post.author}
          </Typography>
          <Typography variant="subtitle2" sx={{ mx: 1 }}>
            |
          </Typography>
          <Typography variant="subtitle2">
            {new Date(post.created_at).toLocaleString()}
          </Typography>
          <Typography variant="subtitle2" sx={{ ml: 2 }}>
            <VisibilityIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
            {post.views ?? 0}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" sx={{ minHeight: '100px', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </Typography>

        {renderAttachments()}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 3 }}>
          <Button
            variant={isLiked ? 'contained' : 'outlined'}
            startIcon={<ThumbUpIcon />}
            onClick={handleLike}
          >
            <Badge badgeContent={likeCount} color="primary">
              Like
            </Badge>
          </Button>
          <Button
            variant={isDisliked ? 'contained' : 'outlined'}
            startIcon={<ThumbDownIcon />}
            onClick={handleDislike}
          >
            <Badge badgeContent={dislikeCount} color="error">
              Dislike
            </Badge>
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          {isAuthor && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/posts/${postId}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          )}
          <Button variant="outlined" onClick={() => navigate('/posts')}>
            Back to List
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <CommentList 
          postId={post.id} 
          currentUser={userId} 
          isLogin={!!localStorage.getItem('token')}
        />
      </Box>
    </Container>
  );
}

export default PostDetail;

