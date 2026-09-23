import { Link } from 'react-router-dom';
import { Field, PageHeading, TextArea, TextInput } from '../../shared/ui/ScreenParts';

export default function GroupEditPage() {
  return (
    <main className="page-container page-container--narrow">
      <div className="breadcrumb"><Link to="/captain/voyages">나의 항해 일지</Link><span>/</span><span>항해 정보 수정</span></div>
      <PageHeading eyebrow="EDIT VOYAGE" title="항해 정보를 수정합니다." description="모집 중인 항해의 정보를 확인하고 업데이트하세요." />
      <form className="form-panel"><div className="form-section"><h2>기본 정보</h2><Field label="항해명" required><TextInput defaultValue="퇴근 후, 함께 읽는 네 번의 저녁" /></Field><Field label="소개" required><TextArea rows={5} defaultValue="책 한 권을 천천히 읽고, 매주 서로의 생각을 나누는 온라인 독서 항해입니다." /></Field><Field label="분야" required><select className="form-control" defaultValue="에세이"><option>소설</option><option>에세이</option><option>인문</option><option>경제</option></select></Field><Field label="참여 금액" required><TextInput type="number" defaultValue="40000" /></Field></div><div className="form-actions"><Link className="button button--secondary" to="/voyages/1">취소</Link><button className="button" type="button">수정 내용 저장 <span>→</span></button></div></form>
    </main>
  );
}