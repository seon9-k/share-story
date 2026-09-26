import { Link, useParams } from 'react-router-dom';

import { getMeetupDetail } from '../../mocks/meetupCatalog';
import { EmptyState, ActionLink, Notice } from '../../../../shared/ui';
import { useState } from 'react';

import CrewStatsSection from './CrewStatsSection';
import DetailBottomBar from './DetailBottomBar';
import LogbookRequirement from './LogbookRequirement';
import MeetupHeroSection from './MeetupHeroSection';
import MeetupInfoSection from './MeetupInfoSection';
import MeetupSessionsSection from './MeetupSessionsSection';
import RelatedMeetupsSection from './RelatedMeetupsSection';

import styles from './MeetupDetailView.module.css';

function MeetupDetailView() {
  const { meetupId } = useParams<{ meetupId: string }>();

  const id = Number(meetupId);

  const meetup = getMeetupDetail(id);
  const [message, setMessage] = useState('');
  if (!meetup)
    return (
      <EmptyState
        title="모임을 찾을 수 없습니다."
        description="모임 목록에서 다시 선택해 주세요."
        action={<ActionLink to="/meetups">모임 목록</ActionLink>}
      />
    );

  const handleJoin = () => {
    // TODO: Meetup 참여 기능 연결
    setMessage('참여 신청은 아직 준비 중입니다. 신청이 접수되지 않았습니다.');
  };

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbInner}>
          <Link to="/meetups" className={styles.breadcrumbLink}>
            항해 찾기
          </Link>

          <span>/</span>

          <span className={styles.breadcrumbCurrent}>항해 상세</span>
        </div>
      </div>

      <div className={styles.content}>
        <MeetupHeroSection meetup={meetup} />

        <MeetupInfoSection meetup={meetup} />

        <MeetupSessionsSection sessions={meetup.sessions} price={meetup.price} />

        <CrewStatsSection stats={meetup.stats} />

        <LogbookRequirement />

        <RelatedMeetupsSection meetups={meetup.relatedMeetups} />
      </div>

      {message && <Notice>{message}</Notice>}
      <DetailBottomBar onJoin={handleJoin} />
    </div>
  );
}

export default MeetupDetailView;
