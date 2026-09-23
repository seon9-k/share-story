import { Link } from 'react-router-dom';
import { Field, PageHeading, TextArea, TextInput } from '../../shared/ui/ScreenParts';

export default function GroupCreatePage() {
  return (
    <main className="page-container page-container--narrow">
      <PageHeading eyebrow="CREATE A VOYAGE" title="새로운 항해를 개설해요." description="함께 읽고 싶은 책과 모임 정보를 알려주세요." />
      <form className="form-panel">
        <div className="form-section"><h2>기본 정보</h2><Field label="항해명" required><TextInput placeholder="예: 퇴근 후, 함께 읽는 네 번의 저녁" /></Field><Field label="소개" required hint="어떤 사람들과 어떤 이야기를 나누고 싶은지 적어주세요."><TextArea rows={5} placeholder="항해를 소개해 주세요." /></Field><Field label="분야" required><select className="form-control" defaultValue=""><option value="" disabled>분야를 선택해 주세요</option><option>소설</option><option>에세이</option><option>인문</option><option>경제</option></select></Field></div>
        <div className="form-section"><h2>함께 읽을 책</h2><Field label="도서명" required><TextInput placeholder="책 제목" /></Field><Field label="저자"><TextInput placeholder="저자명" /></Field><Field label="표지 이미지"><input className="file-control" type="file" accept="image/*" /><small>JPG 또는 PNG · 10MB 이하</small></Field></div>
        <div className="form-section"><h2>일정과 참여 정보</h2><div className="form-grid"><Field label="모집 인원" required><TextInput type="number" min="2" defaultValue="8" /></Field><Field label="참여 금액" required><TextInput type="number" min="0" placeholder="40000" /></Field><Field label="시작일" required><TextInput type="date" /></Field><Field label="모임 횟수" required><TextInput type="number" min="1" defaultValue="4" /></Field></div><Field label="진행 방식" required><select className="form-control" defaultValue="online"><option value="online">온라인</option><option value="offline">오프라인</option></select></Field></div>
        <div className="form-actions"><Link className="button button--secondary" to="/voyages">취소</Link><button className="button" type="button">임시 저장 후 미리보기 <span>→</span></button></div>
      </form>
    </main>
  );
}