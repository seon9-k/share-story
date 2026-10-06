import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import MeetupListItem from '../MeetupListItem';
import { getMeetups } from '../../api/meetupApi';
import { mapMeetupListApiItem } from '../../lib/meetupMapper';
import type { MeetupListItem as MeetupListItemType } from '../../types/meetupList';

import styles from './MeetupListView.module.css';

function MeetupListView() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MeetupListItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const apiItems = await getMeetups();
        if (!isMounted) return;
        setItems(apiItems.map(mapMeetupListApiItem));
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : '목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMeetups = useMemo(() => {
    const keyword = search.trim();

    return items.filter(
      (meetup) => keyword === '' || meetup.title.includes(keyword) || meetup.book.includes(keyword),
    );
  }, [items, search]);

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

        <p className={styles.resultCount}>총 {filteredMeetups.length}개의 항해</p>

        {isLoading ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>항해 목록을 불러오는 중입니다.</p>
          </div>
        ) : errorMessage ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>목록 조회에 실패했습니다.</p>
            <p className={styles.emptyDescription}>{errorMessage}</p>
          </div>
        ) : filteredMeetups.length === 0 ? (
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
