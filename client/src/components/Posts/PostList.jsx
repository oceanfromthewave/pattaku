import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import styles from '../../styles/PostList.module.scss';

export default function PostList({ refreshCount }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ keyword: '', author: '', sort: 'recent' });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // 게시글 불러오기
  useEffect(() => {
    setLoading(true);
    const query = [];
    if (filter.keyword) query.push(`q=${encodeURIComponent(filter.keyword)}`);
    if (filter.author) query.push(`author=${encodeURIComponent(filter.author)}`);
    if (filter.sort) query.push(`sort=${filter.sort}`);
    // 페이지네이션 등 추가 가능
    fetch(`/api/posts?${query.join('&')}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshCount, filter]);

  // 검색 폼 전송
  const handleSearch = (e) => {
    e.preventDefault();
    setFilter({ ...filter, keyword: search });
  };

  // 정렬 토글
  const toggleSort = () =>
    setFilter(f => ({
      ...f,
      sort: f.sort === 'recent' ? 'popular' : 'recent'
    }));

  if (loading)
    return <div className={styles.postList}>게시글 불러오는 중...</div>;

  return (
    <div className={classNames(styles.postList, 'postList')}>
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="제목/내용/태그 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <input
          type="text"
          placeholder="작성자"
          value={filter.author}
          onChange={e => setFilter(f => ({ ...f, author: e.target.value }))}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchBtn}>검색</button>
        <button type="button" className={styles.sortBtn} onClick={toggleSort}>
          {filter.sort === 'recent' ? '최신순' : '인기순'}
        </button>
      </form>
      {posts.length === 0 && <div className={styles.noPost}>게시글이 없습니다.</div>}
      <ul className={styles.postListUl}>
        {posts.map(post => (
          <li key={post.id} className={styles.postItem}>
            <span
              className={styles.postTitleLink}
              onClick={() => navigate(`/board/free/${post.id}`)}
              tabIndex={0}
              role="button"
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/board/free/${post.id}`);
                }
              }}
            >
              {post.title}
            </span>
            <span className={styles.postMeta}>
              | <span className={styles.postAuthor}>{post.author_nickname || post.author}</span>
              | {new Date(post.created_at).toLocaleString()}
              {typeof post.views === 'number' && <> | 조회수 {post.views}</>}
              {typeof post.likes === 'number' && <> | 추천 {post.likes}</>}
              {typeof post.comments_count === 'number' && <> | 댓글 {post.comments_count}</>}
            </span>
          </li>
        ))}
      </ul>
      {/* 페이지네이션 자리: 추후 확장시 */}
    </div>
  );
}
