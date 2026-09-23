import { Link } from 'react-router-dom';
import { PageHeading, VoyageCard } from '../../shared/ui/ScreenParts';

const voyages = [
  { title: '퇴근 후, 함께 읽는 네 번의 저녁', category: '에세이', people: '6 / 8명' },
  { title: '천천히 읽는 주말', category: '소설', people: '6 / 8명' },
  { title: '도시를 걷고 문장을 줍다', category: '인문', people: '3 / 6명' },
];

export default function GroupListPage() {
  return (
    <main className="page-container">
      <PageHeading eyebrow="FIND YOUR CREW" title="함께 읽을 항해를 찾아보세요." description="책 한 권에서 시작하는 새로운 만남." action={<Link className="button" to="/voyages/new">항해 개설 <span>＋</span></Link>} />
      <section className="filter-panel" aria-label="항해 검색 및 필터">
        <label className="search-control"><span aria-hidden="true">⌕</span><input aria-label="항해 검색" placeholder="책 또는 항해명을 검색해 보세요" /><button type="button">검색</button></label>
        <div className="filter-row"><div className="filter-chips" aria-label="분야"><button className="filter-chip filter-chip--active" type="button">전체</button><button className="filter-chip" type="button">소설</button><button className="filter-chip" type="button">에세이</button><button className="filter-chip" type="button">인문</button><button className="filter-chip" type="button">경제</button></div><label className="sort-select">정렬<select defaultValue="recent"><option value="recent">최근 개설순</option><option value="popular">인기순</option><option value="closing">마감 임박순</option></select></label></div>
      </section>
      <div className="list-summary"><strong>모집 중인 항해</strong><span>총 24개</span></div>
      <section className="voyage-grid" aria-label="항해 목록">{voyages.map((voyage, index) => <VoyageCard key={voyage.title} title={voyage.title} status={`${voyage.category} · ${voyage.people}`} to={`/voyages/${index + 1}`} />)}</section>
      <nav className="pagination" aria-label="페이지 이동"><button type="button" disabled>이전</button><button className="pagination__current" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">다음</button></nav>
    </main>
  );
}