import { describe, expect, it } from 'vitest';
import { validateLeaderUserIdentity, validateMeetup } from './meetupValidation';
import type { MeetupForm, MeetupSession } from '../types/meetupForm';

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const form = (over: Partial<MeetupForm> = {}): MeetupForm => ({
  bookTitle: '채식주의자',
  bookImageUrl: '',
  meetupTitle: '소설 모임',
  intro: '함께 읽어요',
  zoomUrl: 'https://zoom.us/j/1',
  zoomPassword: '1234',
  minMembers: '4',
  maxMembers: '8',
  deadline: iso(5),
  price: '40000',
  payment: '일시납',
  ...over,
});

const sessions = (count = 4): MeetupSession[] =>
  Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    date: iso(10 + i * 7),
    time: '20:00',
    endTime: '22:00',
    topic: `${i + 1}회차`,
  }));

describe('모임 등록 입력 검증 (REQ-GRP-001)', () => {
  it('정상 입력이면 오류가 없음', () => {
    expect(validateMeetup(form(), sessions())).toBeUndefined();
  });

  it('오늘 마감·오늘 회차는 허용함 (경계값)', () => {
    expect(validateMeetup(form({ deadline: iso(0) }), sessions().map((s) => ({ ...s, date: iso(0) })))).toBeUndefined();
  });

  it.each(['bookTitle', 'meetupTitle', 'intro', 'zoomUrl', 'zoomPassword', 'deadline', 'price'] as const)(
    '%s가 비어 있으면 필수 항목 오류',
    (field) => {
      expect(validateMeetup(form({ [field]: '  ' }), sessions())).toBe('필수 항목을 모두 입력해 주세요.');
    },
  );

  it.each([
    ['최소 3명', { minMembers: '3' }],
    ['최대 9명', { maxMembers: '9' }],
    ['최대가 최소보다 작음', { minMembers: '6', maxMembers: '5' }],
  ])('모집 인원 %s이면 4~8명 안내', (_label, over) => {
    expect(validateMeetup(form(over), sessions())).toContain('4~8명');
  });

  it('인원이 소수면 정수 안내', () => {
    expect(validateMeetup(form({ minMembers: '4.5' }), sessions())).toBe('모집 인원은 정수로 입력해 주세요.');
  });

  it('최소 4명, 최대 8명은 허용함 (경계값)', () => {
    expect(validateMeetup(form({ minMembers: '4', maxMembers: '4' }), sessions())).toBeUndefined();
    expect(validateMeetup(form({ minMembers: '8', maxMembers: '8' }), sessions())).toBeUndefined();
  });

  it('금액이 음수면 오류, 0원은 허용', () => {
    expect(validateMeetup(form({ price: '-1' }), sessions())).toContain('0원 이상');
    expect(validateMeetup(form({ price: '0' }), sessions())).toBeUndefined();
  });

  it('모집 마감일이 과거면 오류', () => {
    expect(validateMeetup(form({ deadline: iso(-1) }), sessions())).toContain('모집 마감일');
  });

  it.each([3, 5])('회차가 %i개면 정확히 4개 안내', (count) => {
    expect(validateMeetup(form(), sessions(count))).toBe('회차는 정확히 4개를 입력해 주세요.');
  });

  it('회차에 빈 값이 있으면 오류', () => {
    const list = sessions();
    list[2] = { ...list[2], topic: ' ' };
    expect(validateMeetup(form(), list)).toContain('모든 회차');
  });

  it('과거 날짜 회차는 몇 회차인지 안내', () => {
    const list = sessions();
    list[1] = { ...list[1], date: iso(-3) };
    expect(validateMeetup(form(), list)).toBe('2회차 날짜는 오늘 이후(또는 오늘)로 선택해 주세요.');
  });
});

describe('validateLeaderUserIdentity', () => {
  it('둘 중 하나라도 없으면 오류', () => {
    expect(validateLeaderUserIdentity(undefined, 'a')).toBeDefined();
    expect(validateLeaderUserIdentity('a', undefined)).toBeDefined();
  });

  it('서로 다르면 오류, 같으면 통과', () => {
    expect(validateLeaderUserIdentity('a', 'b')).toContain('본인 명의');
    expect(validateLeaderUserIdentity('a', 'a')).toBeUndefined();
  });
});
