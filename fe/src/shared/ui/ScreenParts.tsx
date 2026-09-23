import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-heading__description">{description}</p>}</div>
      {action}
    </div>
  );
}

export function StatusTag({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'orange' | 'gray' }) {
  return <span className={`status-tag status-tag--${tone}`}><i />{children}</span>;
}

export function BookArt({ title = '함께 읽는\n시간' }: { title?: string }) {
  return <div className="book-art"><small>SHARE STORY · BOOK CLUB</small><strong>{title.split('\n').map((line) => <span key={line}>{line}</span>)}</strong><i /><em>함께 읽는 이야기, 더 멀리</em></div>;
}

export function VoyageCard({ compact = false, status = '모집 중', title = '퇴근 후, 함께 읽는 네 번의 저녁', to = '/voyages/1' }: { compact?: boolean; status?: string; title?: string; to?: string }) {
  return (
    <article className={`voyage-card${compact ? ' voyage-card--compact' : ''}`}>
      <Link className="voyage-card__cover" to={to} aria-label={`${title} 상세 보기`}><BookArt /></Link>
      <div className="voyage-card__body">
        <StatusTag>{status}</StatusTag>
        <Link to={to} className="voyage-card__title">{title}</Link>
        <p className="voyage-card__captain">캡틴 책읽는밤</p>
        <p className="voyage-card__meta">온라인(Zoom) · 20:00–21:30<br />신청 6명 / 정원 8명 · 총 4회</p>
        {!compact && <div className="voyage-card__footer"><strong>40,000원</strong><Link to={to}>상세 보기 <span aria-hidden="true">→</span></Link></div>}
      </div>
    </article>
  );
}

export function Field({ label, required = false, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return <label className="form-field"><span>{label}{required && <b>필수</b>}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="form-control" {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="form-control form-control--textarea" {...props} />;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span aria-hidden="true">✳</span><h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function ActionLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="button button--secondary" to={to}>{children}</Link>;
}