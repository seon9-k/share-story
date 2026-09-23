import { Link } from 'react-router-dom';
import { Field, PageHeading, TextArea } from '../../shared/ui/ScreenParts';

export default function ReviewEditPage() {
  return (
    <main className="page-container page-container--narrow"><div className="breadcrumb"><Link to="/voyages/1/reviews">항해 일지</Link><span>/</span><span>후기 수정</span></div><PageHeading eyebrow="CREW JOURNAL / EDIT" title="내 항해 일지를 수정합니다." description="천천히 읽는 주말 · 본인이 작성한 후기" /><form className="form-panel review-form"><Field label="별점" required><div className="rating-input" role="radiogroup" aria-label="별점"><button type="button" aria-label="1점">★</button><button type="button" aria-label="2점">★</button><button type="button" aria-label="3점">★</button><button type="button" aria-label="4점">★</button><button className="rating-input__muted" type="button" aria-label="5점">★</button><span>4점</span></div></Field><Field label="항해 일지" required><TextArea rows={9} defaultValue="혼자라면 지나쳤을 문장을 함께 읽으며 새롭게 보게 되었습니다. 매주 다른 시각을 들을 수 있어 좋았고, 다음 항해에서도 함께 읽고 싶습니다." /><small className="character-count">96 / 1,000자</small></Field><div className="form-actions"><Link className="button button--secondary" to="/voyages/1/reviews">취소</Link><button className="button" type="button">수정 내용 저장 <span>→</span></button></div></form></main>
  );
}