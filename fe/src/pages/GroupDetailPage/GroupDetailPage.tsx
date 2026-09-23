import { Link } from 'react-router-dom';
import { BookArt, StatusTag } from '../../shared/ui/ScreenParts';

export default function GroupDetailPage() {
  return (
    <main className="page-container page-container--detail">
      <div className="breadcrumb"><Link to="/voyages">항해 찾기</Link><span>/</span><span>항해 상세 정보</span></div>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-cover"><BookArt /></div>
          <div className="detail-title"><StatusTag>모집 중</StatusTag><p className="eyebrow">BOOK CLUB · ONLINE</p><h1>퇴근 후, 함께 읽는 네 번의 저녁</h1><p>캡틴 <strong>책읽는밤</strong></p></div>
          <section className="content-section"><h2>이 항해를 소개합니다</h2><p>책 한 권을 천천히 읽고, 매주 서로의 생각을 나누는 온라인 독서 항해입니다. 각자의 하루 끝에 모여 한 문장씩 읽고 이야기해요.</p></section>
          <section className="content-section"><h2>함께 읽을 책</h2><div className="book-info"><BookArt /><div><strong>함께 읽는 시간</strong><p>김다은 · 이야기숲 · 2025</p><p>매주 읽은 문장과 감상을 편하게 나눕니다.</p></div></div></section>
          <section className="content-section"><h2>일정과 진행 방식</h2><div className="detail-facts"><div><small>모임 일정</small><strong>2026.10.06–10.27 · 매주 화요일</strong></div><div><small>진행 시간</small><strong>20:00–21:30 · 온라인(Zoom)</strong></div><div><small>모임 횟수</small><strong>총 4회</strong></div></div></section>
          <section className="content-section"><h2>캡틴 소개</h2><p>안녕하세요, 책읽는밤입니다. 낯선 책도 함께라면 천천히 즐겁게 읽을 수 있도록 모임을 이끌어요.</p></section>
        </div>
        <aside className="apply-panel"><StatusTag>모집 중</StatusTag><h2>함께 읽을 준비가 되셨나요?</h2><p>신청 6명 <span>/</span> 정원 8명</p><div className="apply-panel__price"><small>총 참여 금액</small><strong>40,000원</strong></div><button className="button button--wide" type="button">이 항해에 참여하기 <span>→</span></button><small className="apply-panel__note">참여 신청 후 캡틴의 승인을 기다려 주세요.</small><Link to="/voyages/1/reviews">완료된 항해 후기 보기</Link></aside>
      </div>
    </main>
  );
}