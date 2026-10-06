import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { applyMeetup, getMeetupDetail } from '../../api/meetupApi';
import { getCurrentUserId } from '../../lib/currentUser';
import type { MeetupDetail } from '../../types/meetupDetail';
import { EmptyState, ActionLink, Notice } from '../../../../shared/ui';

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

  const [meetup, setMeetup] = useState<MeetupDetail | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [message, setMessage] = useState('');

  const loginUserId = getCurrentUserId();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getMeetupDetail(id)
      .then((detail) => {
        if (isMounted) setMeetup(detail);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) return null;
  if (!meetup)
    return (
      <EmptyState
        title="모임을 찾을 수 없습니다."
        description="모임 목록에서 다시 선택해 주세요."
        action={<ActionLink to="/meetups">모임 목록</ActionLink>}
      />
    );

  const isLeader = Boolean(loginUserId && loginUserId === meetup.leaderId?.trim());
  if (import.meta.env.DEV) {
    console.log('[MeetupDetail] loginUserId / leaderId / isLeader', loginUserId, meetup.leaderId, isLeader);
  }

  const handleJoin = async () => {
    const userId = getCurrentUserId();

    if (!userId) {
      setMessage('참여 신청을 위해 localStorage user_id 또는 VITE_DEV_USER_ID 설정이 필요합니다.');
      return;
    }

    try {
      setIsJoining(true);
      setMessage('');
      await applyMeetup(id, userId);
      setMessage('항해 참여 신청이 완료되었습니다.');

      const refreshed = await getMeetupDetail(id);
      if (refreshed) setMeetup(refreshed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '참여 신청 중 오류가 발생했습니다.');
    } finally {
      setIsJoining(false);
    }
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
      <DetailBottomBar
        meetupId={meetup.id}
        canEdit={isLeader}
        onJoin={handleJoin}
        isJoining={isJoining}
      />
    </div>
  );
}

export default MeetupDetailView;
