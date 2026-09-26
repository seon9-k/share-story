import type { MeetupForm, MeetupSession } from '../types/meetupForm';
export function validateMeetup(form: MeetupForm, sessions: MeetupSession[]): string | undefined {
  if (
    ![
      form.bookTitle,
      form.meetupTitle,
      form.intro,
      form.location,
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
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min)
    return '모집 인원은 1명 이상이며 최대 인원은 최소 인원 이상이어야 합니다.';
  if (!Number.isFinite(price) || price < 0) return '참여 금액은 0원 이상으로 입력해 주세요.';
  if (
    !sessions.length ||
    sessions.some((session) => !session.date || !session.time || !session.topic.trim())
  )
    return '모든 회차의 날짜, 시간, 주제를 입력해 주세요.';
}
