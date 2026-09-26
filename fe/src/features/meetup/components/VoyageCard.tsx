import { Link } from 'react-router-dom';
import { StatusTag } from '../../../shared/ui';

export function BookArt({ title = '함께 읽는\n시간' }: { title?: string }) {
  return (
    <div className="book-art">
      <small>SHARE STORY · BOOK CLUB</small>
      <strong>
        {title.split('\n').map((line) => (
          <span key={line}>{line}</span>
        ))}
      </strong>
      <i />
      <em>함께 읽는 이야기, 더 멀리</em>
    </div>
  );
}

export function VoyageCard({
  compact = false,
  status = '모집 중',
  title = '퇴근 후, 함께 읽는 네 번의 저녁',
  to = '/meetups/1',
}: {
  compact?: boolean;
  status?: string;
  title?: string;
  to?: string;
}) {
  return (
    <article className={`voyage-card${compact ? ' voyage-card--compact' : ''}`}>
      <Link className="voyage-card__cover" to={to} aria-label={`${title} 상세 보기`}>
        <BookArt />
      </Link>
      <div className="voyage-card__body">
        <StatusTag>{status}</StatusTag>
        <Link to={to} className="voyage-card__title">
          {title}
        </Link>
        <p className="voyage-card__captain">캡틴 책읽는밤</p>
        <p className="voyage-card__meta">
          온라인(Zoom) · 20:00–21:30
          <br />
          신청 6명 / 정원 8명 · 총 4회
        </p>
        {!compact && (
          <div className="voyage-card__footer">
            <strong>40,000원</strong>
            <Link to={to}>
              상세 보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
