import type { MeetupForm, MeetupSession } from '../types/meetupForm';

const REQUIRED_SESSION_COUNT = 4;
const MIN_CAPACITY = 4;
const MAX_CAPACITY = 8;

const toLocalIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function validateMeetup(form: MeetupForm, sessions: MeetupSession[]): string | undefined {
  const today = toLocalIsoDate(new Date());

  if (
    ![
      form.bookTitle,
      form.meetupTitle,
      form.intro,
      form.zoomUrl,
      form.zoomPassword,
      form.deadline,
      form.minMembers,
      form.maxMembers,
      form.price,
    ].every((value) => value.trim())
  )
    return '필수 항목을 모두 입력해 주세요.';
  const min = Number(form.minMembers),
    max = Number(form.maxMembers),
    price = Number(form.price);
  if (!Number.isInteger(min) || !Number.isInteger(max))
    return '모집 인원은 정수로 입력해 주세요.';
  if (min < MIN_CAPACITY || max > MAX_CAPACITY || max < min)
    return `모집 인원은 ${MIN_CAPACITY}~${MAX_CAPACITY}명이며 최대 인원은 최소 인원 이상이어야 합니다.`;
  if (!Number.isFinite(price) || price < 0) return '참여 금액은 0원 이상으로 입력해 주세요.';
  if (form.deadline < today) return '모집 마감일은 오늘 이후(또는 오늘)로 선택해 주세요.';

  if (sessions.length !== REQUIRED_SESSION_COUNT)
    return `회차는 정확히 ${REQUIRED_SESSION_COUNT}개를 입력해 주세요.`;

  if (
    sessions.some((session) => !session.date || !session.time || !session.endTime || !session.topic.trim())
  )
    return '모든 회차의 날짜, 시작 시간, 종료 시간, 주제를 입력해 주세요.';

  const pastSessionIndex = sessions.findIndex((session) => session.date < today);
  if (pastSessionIndex >= 0)
    return `${pastSessionIndex + 1}회차 날짜는 오늘 이후(또는 오늘)로 선택해 주세요.`;
}

/* 로그인 개발 전 임시 신원 값(leader_id, user_id)의 존재 및 일치 여부를 검증한다. */
export function validateLeaderUserIdentity(
  leaderId: string | undefined,
  userId: string | undefined,
): string | undefined {
  if (!leaderId || !userId)
    return '개발 테스트를 위해 leader_id와 user_id가 모두 필요합니다.';
  if (leaderId !== userId) return '본인 명의(user_id)로만 항해를 개설할 수 있습니다.';
}
