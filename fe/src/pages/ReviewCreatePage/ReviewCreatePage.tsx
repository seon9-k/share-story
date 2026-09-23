import { Link } from 'react-router-dom';
import { Field, PageHeading, TextArea } from '../../shared/ui/ScreenParts';

export default function ReviewCreatePage() {
  return (
    <main className="page-container page-container--narrow"><div className="breadcrumb"><Link to="/voyages/1/reviews">항해 일지</Link><span>/</span><span>후기 작성</span></div><PageHeading eyebrow="CREW JOURNAL / NEW" title="이번 항해는 어떠셨나요?" description="천천히 읽는 주말 · 조금 느린 독서 · 항해 종료" /><form className="form-panel review-form"><Field label="별점" required><div className="rating-input" role="radiogroup" aria-label="별점"><button type="button" aria-label="1점">★</button><button type="button" aria-label="2점">★</button><button type="button" aria-label="3점">★</button><button type="button" aria-label="4점">★</button><button type="button" aria-label="5점">★</button><span>별점을 선택해 주세요</span></div></Field><Field label="항해 일지" required hint="함께 읽으며 좋았던 경험과 나눈 생각을 들려주세요."><TextArea rows={9} maxLength={1000} placeholder="항해에서 나눈 생각과 느낀 점을 남겨 주세요." /><small className="character-count">0 / 1,000자</small></Field><div className="form-actions"><Link className="button button--secondary" to="/voyages/1/reviews">취소</Link><button className="button" type="button">후기 등록 <span>→</span></button></div></form></main>
  );
}