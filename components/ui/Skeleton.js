import styles from './Skeleton.module.css';

export function Skeleton({ width, height = 16, rounded = false, className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${rounded ? styles.rounded : ''} ${className}`}
      style={{ width: width || '100%', height }}
    />
  );
}

export function SkeletonRow({ columns = 4 }) {
  return (
    <div className={styles.row}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={16} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton width={120} height={14} />
      <Skeleton width="60%" height={24} />
      <Skeleton width="80%" height={14} />
    </div>
  );
}
