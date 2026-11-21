import './States.css';

export function Skeleton() {
  return (
    <div className="depot-skeleton" aria-busy="true" aria-label="Loading manifest">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="depot-skeleton-row">
          <span className="skeleton-line w-num" />
          <span className="skeleton-line w-glyph" />
          <span className="skeleton-line w-key" />
          <span className="skeleton-line w-size" />
          <span className="skeleton-line w-date" />
        </div>
      ))}
    </div>
  );
}
