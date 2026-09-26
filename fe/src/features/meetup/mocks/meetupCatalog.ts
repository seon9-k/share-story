import { meetupListMocks } from './meetupListMocks';
import { meetupDetailMocks, defaultMeetupDetail } from './meetupDetailMocks';
import type { MeetupDetail } from '../types/meetupDetail';
import type { MeetupListItem } from '../types/meetupList';

// Listed and captain-owned meetups share one identity across screens.
const captainMeetups: MeetupListItem[] = [
  { ...meetupListMocks[4], id: 10, status: '승선 대기' },
  { ...meetupListMocks[5], id: 11, status: '항해 중' },
  {
    ...meetupListMocks[1],
    id: 12,
    title: '천천히 읽는 주말',
    book: '조금 느린 독서',
    status: '입항 완료',
  },
];
const catalog = [...meetupListMocks, ...captainMeetups];
export function getMeetup(id: number): MeetupListItem | undefined {
  return Number.isSafeInteger(id) && id > 0 ? catalog.find((item) => item.id === id) : undefined;
}
export function getMeetupDetail(id: number): MeetupDetail | undefined {
  const item = getMeetup(id);
  if (!item) return undefined;
  const fixture = id === 1 ? defaultMeetupDetail : meetupDetailMocks[id];
  return {
    id: item.id,
    title: item.title,
    book: item.book,
    captain: item.captain,
    intro: fixture?.intro ?? `${item.book}을 함께 읽고 이야기를 나누는 모임입니다.`,
    location: fixture?.location ?? '장소 안내 예정',
    time: item.time,
    appliedMembers: fixture?.appliedMembers ?? null,
    maxMembers: item.maxMembers,
    deadline: fixture?.deadline ?? '일정 안내 예정',
    price: fixture?.price ?? null,
    payment: fixture?.payment ?? '금액 안내 예정',
    status: item.status,
    image: item.image,
    sessions: fixture?.sessions ?? [],
    stats: fixture?.stats ?? { age: [], gender: [], reading: [] },
    relatedMeetups: fixture?.relatedMeetups ?? [],
  };
}
