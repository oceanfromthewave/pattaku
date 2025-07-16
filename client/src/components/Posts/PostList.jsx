// PostList.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/PostList.module.scss';

export default function PostList({ refreshCount }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshCount]);

  if (loading) return <div className={styles.postList}>게시글 불러오는 중...</div>;

  return (
    <div className={styles.postList}>
      {posts.length === 0 && <div>게시글이 없습니다.</div>}
      <ul>
        {posts.map(post => (
          <li key={post.id} className={styles.postItem}>
            <span
              className={styles.postTitleLink}
              onClick={() => navigate(`/board/free/${post.id}`)}
              tabIndex={0}
              role="button"
            >
              {post.title}
            </span>
            <span className={styles.postMeta}>
              &nbsp;| {post.author} | {new Date(post.created_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
