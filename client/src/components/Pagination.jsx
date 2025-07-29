import styles from '../styles/Pagination.module.scss';

export default function Pagination({ 
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0
}) {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.paginationInfo}>
        {totalItems > 0 && (
          <span>
            {startItem}-{endItem} / 총 {totalItems}개
          </span>
        )}
      </div>
      
      <div className={styles.pagination}>
        <button
          className={`${styles.pageBtn} ${styles.navBtn}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="이전 페이지"
        >
          ‹
        </button>

        {generatePageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              ...
            </span>
          ) : (
            <button
              key={page}
              className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
              onClick={() => onPageChange(page)}
              aria-label={`페이지 ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          )
        ))}

        <button
          className={`${styles.pageBtn} ${styles.navBtn}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="다음 페이지"
        >
          ›
        </button>
      </div>
    </div>
  );
}
