import { Link } from 'react-router-dom';
import { EmptyState, PageHeading, StatusTag } from '../../shared/ui/ScreenParts';

const voyages = [
	{ title: '함께 이야기 해요', dates: '2026.10.06–10.27 · 매주 목요일 저녁 8시', status: '승선 대기', tone: 'orange' as const, count: '신청 6 / 8명 · 확정 6명' },
	{ title: '천천히 읽는 주말', dates: '2026.09.26–10.17 · 매주 토요일 오전 10시', status: '항해 중', tone: 'blue' as const, count: '신청 6 / 8명 · 확정 6명' },
	{ title: '조용한 문장 수집가', dates: '2026.08.08–08.29 · 총 4회', status: '입항 완료', tone: 'gray' as const, count: '후기를 작성해 주세요' },
];

export default function MyPage() {
	return (
		<main className="page-container">
			<div className="journal-layout"><aside className="account-sidebar"><div className="account-profile"><span>후</span><div><strong>후로란탄00 님</strong><small>member01@gmail.com</small></div></div><nav aria-label="마이페이지 메뉴"><Link className="account-sidebar__active" to="/my/voyages">나의 항해 일지</Link><Link to="/captain/voyages">내가 만든 항해</Link><Link to="/my/voyages">계정 설정</Link></nav></aside><section className="journal-content"><PageHeading eyebrow="MY JOURNAL / CREW" title="나의 항해 일지" description="신청한 항해의 소식과 여정을 한곳에서 확인하세요." /><div className="filter-chips journal-filters"><button className="filter-chip filter-chip--active" type="button">전체</button><button className="filter-chip" type="button">승선 대기</button><button className="filter-chip" type="button">항해 중</button><button className="filter-chip" type="button">입항 완료</button><label className="sort-select">정렬<select defaultValue="recent"><option value="recent">최근 개설순</option><option value="old">오래된 순</option></select></label></div><div className="journal-list">{voyages.map((voyage, index) => <article className="journal-card" key={voyage.title}><div className="journal-card__number">0{index + 1}</div><div className="journal-card__body"><div className="journal-card__title"><Link to={`/voyages/${index + 1}`}>{voyage.title}</Link><StatusTag tone={voyage.tone}>{voyage.status}</StatusTag></div><p>{voyage.count}</p><small>{voyage.dates}</small></div><Link className="journal-card__arrow" to={voyage.status === '입항 완료' ? `/voyages/${index + 1}/reviews` : `/voyages/${index + 1}`}>→</Link></article>)}</div>{voyages.length === 0 && <EmptyState title="아직 신청한 항해가 없어요." description="마음에 드는 책 모임을 찾아 첫 항해를 시작해 보세요." action={<Link className="button" to="/voyages">항해 찾기</Link>} />}</section></div>
		</main>
	);
}
