import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../auth';
import { meetupStatusLabel, type MemberMeetup, type MemberRole } from '../../../member';
import { useProfile } from '../../../user';
import { useAllPages } from '../../../../shared/hooks/useResource';
import { PageContainer, PageHeading, ActionLink, EmptyState } from '../../../../shared/ui';
import RequestState from '../../../../shared/ui/RequestState';
import styles from '../../../../shared/ui/Voyage.module.css';

export default function JournalDashboard({ initialView = 'crew' }: { initialView?: MemberRole }) {
  const [search, setSearch] = useSearchParams();
  const role =
    search.get('role') === 'captain'
      ? 'captain'
      : search.get('role') === 'crew'
        ? 'crew'
        : initialView;
  const { user } = useAuth();
  const profile = useProfile();
  // URL의 role은 선택한 탭을 복원하는 용도이며, 조회 요청은 역할별 전용 API로 보냄
  const result = useAllPages<MemberMeetup>(`/member/meetups/${role}`);
  return (
    <PageContainer>
      <PageHeading
        eyebrow="MY VOYAGE"
        title="나의 항해 일지"
        description={`${profile.data?.name || user?.user_id || '회원'}님, 함께 읽고 나눈 이야기를 이어가세요.`}
      />
      <div className={styles.tabs} aria-label="모임 역할 선택">
        <button aria-pressed={role === 'crew'} onClick={() => setSearch({ role: 'crew' })}>
          크루로 참여한 모임
        </button>
        <button aria-pressed={role === 'captain'} onClick={() => setSearch({ role: 'captain' })}>
          캡틴으로 만든 모임
        </button>
      </div>
      <RequestState {...result} retry={result.reload} />
      {result.data?.length === 0 && (
        <EmptyState
          title={role === 'captain' ? '아직 만든 모임이 없어요.' : '아직 참여한 모임이 없어요.'}
          description="새로운 책과 사람을 만나 항해를 시작해 보세요."
          action={
            <ActionLink to={role === 'captain' ? '/meetups/create' : '/meetups'}>
              {role === 'captain' ? '항해 만들기' : '항해 찾아보기'}
            </ActionLink>
          }
        />
      )}
      <div className={styles.grid}>
        {result.data?.map((meetup) => (
          <article className={styles.card} key={meetup.meetup_id}>
            {meetup.book_image_url && (
              <img className={styles.cover} src={meetup.book_image_url} alt="" />
            )}
            <span className={styles.badge}>{meetupStatusLabel(meetup)}</span>
            <h2>{meetup.title}</h2>
            <p>{meetup.book_title}</p>
            <div className={styles.actions}>
              <ActionLink
                to={`/meetups/${meetup.meetup_id}/logbooks${role === 'captain' ? '/review' : ''}`}
              >
                {role === 'captain' ? '크루 로그북 확인' : '로그북 작성·조회'}
              </ActionLink>
              <ActionLink to={`/meetups/${meetup.meetup_id}`}>모임 상세</ActionLink>
              <ActionLink to={`/meetups/${meetup.meetup_id}/reviews`}>항해 후기</ActionLink>
            </div>
          </article>
        ))}
      </div>
    </PageContainer>
  );
}
