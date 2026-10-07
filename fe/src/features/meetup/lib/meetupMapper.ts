import type { CreateMeetupPayload, MeetupForm, MeetupSession } from '../types/meetupForm';
import type { MeetupListApiItem, MeetupDetailApiResponse } from '../api/meetupApi';
import type { MeetupListItem, MeetupStatus } from '../types/meetupList';
import type { MeetupDetail } from '../types/meetupDetail';

const KOR_DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const DEFAULT_MEETUP_IMAGE =
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=120&h=160&fit=crop&auto=format';

export const toKoreanMeetupStatus = (status: string): MeetupStatus => {
  switch (status) {
    case 'IN_PROGRESS':
      return '항해 중';
    case 'COMPLETED':
      return '입항 완료';
    case 'RECRUITING':
    case 'CLOSED':
    default:
      return '승선 대기';
  }
};

const toMonthDay = (value: string | null | undefined) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const toScheduleText = (day: string | null | undefined) => (day ? `${day} · 4회차` : '일정 미정 · 4회차');

const toDeadlineText = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '일정 안내 예정';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')} ${hh}:${mm}`;
};

const toStatItems = (
  record: Record<string, number> | undefined,
  labelMap: (key: string) => string = (key) => key,
) => Object.entries(record ?? {}).map(([label, count]) => ({ label: labelMap(label), count }));

const READING_VOLUME_LABELS: Record<string, string> = {
  BOOKS_1_2: '1~2권',
  BOOKS_3_4: '3~4권',
  BOOKS_5_6: '5~6권',
  BOOKS_7_PLUS: '7권 이상',
};

const toKoreanReadingVolume = (value: string) => READING_VOLUME_LABELS[value] ?? value;

export function mapMeetupListApiItem(item: MeetupListApiItem): MeetupListItem {
  return {
    id: item.meetup_id,
    title: item.title,
    book: item.book_title,
    captain: item.leader_name || '캡틴 미정',
    minMembers: item.min_capacity,
    maxMembers: item.max_capacity,
    schedule: toScheduleText(item.sch_day),
    time: item.sch_time || '시간 미정',
    firstDate: toMonthDay(item.sch_st_date),
    lastDate: toMonthDay(item.sch_ed_date),
    status: toKoreanMeetupStatus(item.status),
    image: item.book_image_url || DEFAULT_MEETUP_IMAGE,
  };
}

export function mapMeetupDetailToListItem(detail: MeetupDetailApiResponse): MeetupListItem {
  const { meetup, sessions } = detail;
  const orderedSessions = sessions.slice().sort((left, right) => left.session_number - right.session_number);
  const firstSession = orderedSessions[0];
  const lastSession = orderedSessions[orderedSessions.length - 1];
  return {
    id: meetup.meetup_id,
    title: meetup.title,
    book: meetup.book_title,
    captain: meetup.leader_name || '캡틴 미정',
    minMembers: meetup.min_capacity,
    maxMembers: meetup.max_capacity,
    schedule: toScheduleText(firstSession?.sch_day),
    time: firstSession?.sch_time || '시간 미정',
    firstDate: toMonthDay(firstSession?.sch_date),
    lastDate: toMonthDay(lastSession?.sch_date),
    status: toKoreanMeetupStatus(meetup.status),
    image: meetup.book_image_url || DEFAULT_MEETUP_IMAGE,
  };
}

export function mapMeetupDetailToDetail(detail: MeetupDetailApiResponse): MeetupDetail {
  const { meetup, sessions, apply_count, apply_user_stats } = detail;
  const firstSession = sessions[0];
  return {
    id: meetup.meetup_id,
    leaderId: meetup.leader_id,
    title: meetup.title,
    book: meetup.book_title,
    bookImageUrl: meetup.book_image_url,
    captain: meetup.leader_name || '캡틴 미정',
    intro: meetup.description || `${meetup.book_title}을 함께 읽고 이야기를 나누는 모임입니다.`,
    location: '장소 안내 예정',
    time: firstSession?.sch_time || '시간 미정',
    appliedMembers: apply_count ?? null,
    maxMembers: meetup.max_capacity,
    deadline: meetup.deadline ? toDeadlineText(meetup.deadline) : '일정 안내 예정',
    price: meetup.price ?? null,
    payment: '일시납',
    status: toKoreanMeetupStatus(meetup.status),
    image: meetup.book_image_url || DEFAULT_MEETUP_IMAGE,
    sessions: sessions
      .slice()
      .sort((left, right) => left.session_number - right.session_number)
      .map((session) => ({
        // BIGINT 컬럼은 pg 드라이버가 문자열로 반환하므로 명시적으로 숫자 변환한다.
        sessionId: Number(session.session_id),
        number: session.session_number,
        date: toMonthDay(session.sch_date),
        rawDate: session.sch_date ?? '',
        time: session.sch_time ?? '',
        endTime: session.sch_ed_time ?? '',
        topic: session.topic,
        zoomUrl: session.zoom_url ?? null,
        zoomPassword: session.zoom_password ?? null,
      })),
    stats: {
      age: toStatItems(apply_user_stats?.age_group),
      gender: toStatItems(apply_user_stats?.gender),
      reading: toStatItems(apply_user_stats?.monthly_reading_volume, toKoreanReadingVolume),
    },
    relatedMeetups: [],
  };
}

export const toKoreanDay = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return KOR_DAY_NAMES[date.getDay()];
};

export const addHoursToTime = (time: string, hoursToAdd: number) => {
  if (!/^\d{2}:\d{2}$/.test(time)) return time;

  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return time;

  const totalMinutes = (hour * 60 + minute + hoursToAdd * 60) % (24 * 60);
  const normalizedMinutes = totalMinutes < 0 ? totalMinutes + 24 * 60 : totalMinutes;
  const nextHour = Math.floor(normalizedMinutes / 60);
  const nextMinute = normalizedMinutes % 60;

  return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
};

export function toCreateMeetupRequest(
  form: MeetupForm,
  sessions: MeetupSession[],
  leaderId: string,
  userId: string,
): CreateMeetupPayload {
  const zoomUrl = form.zoomUrl.trim() || null;
  const zoomPassword = form.zoomPassword.trim() || null;

  return {
    leader_id: leaderId,
    user_id: userId,
    title: form.meetupTitle,
    description: form.intro,
    book_title: form.bookTitle,
    book_image_url: form.bookImageUrl.trim() || null,
    min_capacity: Number(form.minMembers),
    max_capacity: Number(form.maxMembers),
    deadline: `${form.deadline}T23:59:59`,
    price: Number(form.price),
    sessions: sessions.map((session) => ({
      session_number: session.number,
      topic: session.topic,
      sch_date: session.date,
      sch_day: toKoreanDay(session.date),
      sch_time: session.time,
      sch_st_time: session.time,
      sch_ed_time: session.endTime || addHoursToTime(session.time, 2),
      zoom_url: zoomUrl,
      zoom_password: zoomPassword,
    })),
  };
}
