import { Link } from 'react-router-dom';
import { PageHeading, StatusTag } from '../../shared/ui/ScreenParts';

const createdVoyages = [
  ['퇴근 후, 함께 읽는 네 번의 저녁', '모집 중', '6 / 8명', '2026.10.06–10.27'],
  ['도시를 걷고 문장을 줍다', '모집 중', '3 / 6명', '2026.11.02–11.23'],
  ['느리게 읽는 계절', '입항 완료', '8 / 8명', '2026.08.08–08.29'],
];

export default function CaptainVoyagesPage() {
  return (
    <main className="page-container"><div className="journal-layout"><aside className="account-sidebar"><div className="account-profile"><span>후</span><div><strong>책읽는밤 님</strong><small>캡틴 계정</small></div></div><nav aria-label="캡틴 메뉴"><Link to="/captain/voyages" className="account-sidebar__active">내가 만든 항해</Link><Link to="/captain/voyages">신청자 관리</Link><Link to="/captain/voyages">계정 설정</Link></nav></aside><section className="journal-content"><PageHeading eyebrow="CAPTAIN / MY VOYAGES" title="내가 만든 항해" description="개설한 항해의 신청 현황과 진행 상태를 확인하세요." action={<Link className="button" to="/voyages/new">새 항해 개설 <span>＋</span></Link>} /><div className="filter-chips journal-filters"><button className="filter-chip filter-chip--active" type="button">전체</button><button className="filter-chip" type="button">출항 대기</button><button className="filter-chip" type="button">항해 중</button><button className="filter-chip" type="button">입항 완료</button></div><div className="captain-table"><div className="captain-table__head"><span>항해</span><span>모집 상태</span><span>신청 인원</span><span>일정</span><span>관리</span></div>{createdVoyages.map(([title, status, people, dates], index) => <article className="captain-row" key={title}><div><Link to={`/voyages/${index + 1}`}>{title}</Link><small>캡틴 책읽는밤 · 온라인</small></div><StatusTag tone={status === '입항 완료' ? 'gray' : 'blue'}>{status}</StatusTag><span>{people}</span><span>{dates}</span><div className="captain-row__actions"><Link to={`/voyages/${index + 1}`}>현황</Link><Link to={`/voyages/${index + 1}/edit`}>수정</Link></div></article>)}</div></section></div></main>
  );
}