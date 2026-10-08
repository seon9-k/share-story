import { describe, expect, it } from 'vitest';
import type { MemberSession } from '../../member';
import { findTargetSession, kstToday } from './targetSession';

const session = (number: number, date: string, status: MemberSession['status'] = 'SCHEDULED'): MemberSession => ({
  session_id: `${number}`, meetup_id: '1', session_number: number, topic: `주제${number}`,
  sch_date: date, sch_day: '토', sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', status,
});
const sessions = [
  session(1, '2026-10-10'), session(2, '2026-10-17'), session(3, '2026-10-24'), session(4, '2026-10-31'),
];

describe('kstToday', () => {
  it('브라우저 시간대와 무관하게 KST 날짜를 돌려줌', () => {
    // 2026-10-09T15:30Z = KST 10/10 00:30
    expect(kstToday(new Date('2026-10-09T15:30:00Z'))).toBe('2026-10-10');
    expect(kstToday(new Date('2026-10-09T14:30:00Z'))).toBe('2026-10-09');
  });
});

describe('findTargetSession (로그북 작성 화면의 해당 회차 = 오늘 이후 첫 회차)', () => {
  it('모임 전이면 1회차', () => {
    expect(findTargetSession(sessions, new Date('2026-10-01T00:00:00Z'))?.session_number).toBe(1);
  });

  it('회차 당일에는 그 회차를 유지함', () => {
    expect(findTargetSession(sessions, new Date('2026-10-10T03:00:00Z'))?.session_number).toBe(1);
  });

  it('회차 다음 날부터는 다음 회차로 넘어가고 지난 회차는 대상이 아님', () => {
    expect(findTargetSession(sessions, new Date('2026-10-11T03:00:00Z'))?.session_number).toBe(2);
    expect(findTargetSession(sessions, new Date('2026-10-25T03:00:00Z'))?.session_number).toBe(4);
  });

  it('취소된 회차는 건너뜀', () => {
    const list = [session(1, '2026-10-10', 'CANCELLED'), ...sessions.slice(1)];
    expect(findTargetSession(list, new Date('2026-10-01T00:00:00Z'))?.session_number).toBe(2);
  });

  it('모든 회차가 지났으면 없음', () => {
    expect(findTargetSession(sessions, new Date('2026-11-01T03:00:00Z'))).toBeUndefined();
  });

  it('회차 순서가 뒤섞여도 번호가 가장 이른 회차를 고름', () => {
    expect(findTargetSession([...sessions].reverse(), new Date('2026-10-01T00:00:00Z'))?.session_number).toBe(1);
  });

  it('날짜가 시각까지 포함된 형식이어도 날짜만 비교함', () => {
    const list = [session(1, '2026-10-10T00:00:00.000Z')];
    expect(findTargetSession(list, new Date('2026-10-10T03:00:00Z'))?.session_number).toBe(1);
  });
});
