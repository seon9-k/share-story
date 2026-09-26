import type { Meetup } from '../types/meetup';
import { meetupListMocks } from './meetupListMocks';
export const meetupMocks: Meetup[] = meetupListMocks.map((item) => ({
  id: item.id,
  title: item.title,
  captain: item.captain,
  genre: item.genre,
  book: item.book,
  members: null,
  maxMembers: item.maxMembers,
  status: item.status,
  nextMeeting: `${item.schedule} · ${item.time}`,
  location: '상세 안내 확인',
  image: item.image,
}));
