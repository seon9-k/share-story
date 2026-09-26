import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { meetupListMocks } from '../../mocks/meetupListMocks';
import MeetupListItem from '../MeetupListItem';
import type { MeetupGenreFilter } from '../../types/meetupList';

import styles from './MeetupListView.module.css';

const GENRES: MeetupGenreFilter[] = [
  '전체',
  '현대소설',
  '인문·철학',
  '과학·기술',
  '시·에세이',
  '경제·경영',
  '역사·문화',
];

function MeetupListView() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<MeetupGenreFilter>('전체');

  const filteredMeetups = useMemo(() => {
    const keyword = search.trim();

    return meetupListMocks.filter((meetup) => {
      const matchesGenre = selectedGenre === '전체' || meetup.genre === selectedGenre;

      const matchesSearch =
        keyword === '' || meetup.title.includes(keyword) || meetup.book.includes(keyword);

      return matchesGenre && matchesSearch;
    });
  }, [search, selectedGenre]);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <p className={styles.eyebrow}>항해 찾기</p>

          <h1 className={styles.title}>지금 항해 중인 모임</h1>

          <p className={styles.description}>함께 읽을 책과 크루를 찾아보세요.</p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />

              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="항해명 또는 도서명으로 검색"
              className={styles.searchInput}
              aria-label="항해 검색"
            />
          </div>

          <Link to="/meetups/create" className={styles.createButton}>
            항해 개설
          </Link>
        </div>

        <div className={styles.genreFilters} aria-label="장르 필터">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              className={`${styles.genreButton} ${
                selectedGenre === genre ? styles.activeGenreButton : ''
              }`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        <p className={styles.resultCount}>총 {filteredMeetups.length}개의 항해</p>

        {filteredMeetups.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              ⚓
            </div>

            <p className={styles.emptyTitle}>검색 결과가 없습니다.</p>

            <p className={styles.emptyDescription}>다른 검색어나 필터를 사용해 보세요.</p>
          </div>
        ) : (
          <div className={styles.meetupList}>
            {filteredMeetups.map((meetup) => (
              <MeetupListItem key={meetup.id} meetup={meetup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetupListView;
