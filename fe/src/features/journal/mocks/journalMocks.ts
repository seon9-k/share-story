import { getMeetup } from '../../meetup';
import type { CaptainJournalItem, CrewJournalItem } from '../types/journal';

export const crewJournalMocks: CrewJournalItem[] = [
  {
    id: 1,
    title: '책, 함께 이야기 해요',
    book: '함께 이야기',
    appliedMembers: 6,
    maxMembers: 8,
    confirmedMembers: 6,
    period: '2026.10.06–10.27',
    schedule: '매주 목요일 저녁 8시',
    status: '항해 중',

    writableLogbookSession: {
      sessionNumber: 3,
      topic: '함께 노래를 해요',
      deadline: '10.20',
    },
  },
  {
    id: 2,
    title: '천천히 읽는 주말',
    book: '조금 느린 독서',
    appliedMembers: 6,
    maxMembers: 8,
    confirmedMembers: 6,
    period: '2026.09.26–12.29',
    schedule: '매월 마지막주 토요일 저녁 8시',
    status: '승선 대기',

    writableLogbookSession: null,
  },
];

export const captainJournalMocks: CaptainJournalItem[] = [
  {
    id: 10,
    title: '퇴근 후, 함께 읽는 네 번의 저녁',
    appliedMembers: 6,
    maxMembers: 8,
    confirmedMembers: 6,
    period: '2026.10.06–10.27',
    status: '모집 중',
  },
  {
    id: 11,
    title: '문장으로 쉬어 가는 밤',
    appliedMembers: 8,
    maxMembers: 8,
    confirmedMembers: 8,
    period: '2026.09.16–10.07',
    status: '모집 마감',
  },
  {
    id: 12,
    title: '천천히 읽는 주말',
    appliedMembers: 6,
    maxMembers: 8,
    confirmedMembers: 6,
    period: '2026.08.08–08.29',
    status: '종료',
  },
];

// Use the shared identity while retaining journal-specific progress and schedule fields.
for (const item of crewJournalMocks) {
  const meetup = getMeetup(item.id);
  if (meetup) {
    item.title = meetup.title;
    item.book = meetup.book;
  }
}
for (const item of captainJournalMocks) {
  const meetup = getMeetup(item.id);
  if (meetup) item.title = meetup.title;
}
