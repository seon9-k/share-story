// 요구사항 기반 검증: REQ-SES-001 과제 알림 메일(D-3), REQ-SES-004 Zoom 접속 정보 메일(D-1·당일, 숙제 승인자만),
// REQ-BAT-001 회차 완료(익일). 날짜는 모두 한국 시간(KST) 기준
jest.mock('../../src/models', () => require('./helpers/fakeDb'));
jest.mock('../../src/common/services/mailer.service');

const { Op } = require('sequelize');
const db = require('./helpers/fakeDb');
const { sendMail } = require('../../src/common/services/mailer.service');
const service = require('../../src/modules/meetup/meetup.service');

// 2099-01-10 12:00 KST. 서버 시간대와 무관하게 같은 순간
const NOW = new Date('2099-01-10T12:00:00+09:00');

const row = (over = {}) => ({
  Session: { sch_date: '2099-01-11', sch_day: '일', sch_time: '20:00', zoom_url: 'https://zoom.us/j/123', zoom_password: 'pw1234' },
  Apply: { User: { name: '독서왕', email: 'reader@example.com' } },
  ...over,
});

beforeEach(() => {
  db.reset();
  sendMail.mockReset();
});

describe('REQ-SES-004 Zoom 접속 정보 메일', () => {
  test('제출 완료 + 숙제 확인 완료(승인)된 신청자만 조회함', async () => {
    db.Logbook.findAll.mockResolvedValue([]);
    await service.sendZoomMailBatch({ now: NOW });
    const { where, include } = db.Logbook.findAll.mock.calls[0][0];
    expect(where.is_approved).toBe(true);
    expect(where.submitted_at).toEqual({ [Op.ne]: null });
    expect(include[0].where.status).toBe('SCHEDULED');
  });

  test('조회 범위는 모임 1일 전과 당일뿐 (오늘~내일, 모레는 제외)', async () => {
    db.Logbook.findAll.mockResolvedValue([]);
    await service.sendZoomMailBatch({ now: NOW });
    const range = db.Logbook.findAll.mock.calls[0][0].include[0].where.sch_date;
    expect(range[Op.gte]).toBe('2099-01-10'); // 당일
    expect(range[Op.lt]).toBe('2099-01-12'); // 내일(01-11)까지 포함, 모레(01-12)부터 제외
  });

  test('자정 직후(00:10 KST)에도 KST 날짜로 판단함 (UTC로는 전날)', async () => {
    db.Logbook.findAll.mockResolvedValue([]);
    await service.sendZoomMailBatch({ now: new Date('2099-01-10T00:10:00+09:00') }); // = 01-09 15:10 UTC
    const range = db.Logbook.findAll.mock.calls[0][0].include[0].where.sch_date;
    expect(range[Op.gte]).toBe('2099-01-10');
  });

  test('승인된 신청자에게 Zoom URL과 비밀번호를 메일로 발송함', async () => {
    db.Logbook.findAll.mockResolvedValue([row()]);
    sendMail.mockResolvedValue({ messageId: 'm1', accepted: ['reader@example.com'] });

    const result = await service.sendZoomMailBatch({ now: NOW });

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe('reader@example.com');
    expect(mail.subject).toContain('2099-01-11');
    expect(mail.text).toContain('https://zoom.us/j/123');
    expect(mail.text).toContain('pw1234');
    expect(result).toMatchObject({ processed_count: 1, failed_count: 0, skipped_count: 0 });
  });

  test('Zoom URL·비밀번호·이메일이 없으면 발송하지 않고 건너뜀', async () => {
    db.Logbook.findAll.mockResolvedValue([
      row({ Session: { sch_date: '2099-01-11', zoom_url: null, zoom_password: 'pw' } }),
      row({ Apply: { User: { name: 'x', email: null } } }),
    ]);

    const result = await service.sendZoomMailBatch({ now: NOW });

    expect(result).toMatchObject({ total_candidate_count: 2, skipped_count: 2, processed_count: 0 });
    expect(result.skipped_targets[0].skipped_reason).toBe('missing:zoom_url');
    expect(result.skipped_targets[1].skipped_reason).toBe('missing:user_email');
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('한 명의 발송이 실패해도 나머지에게는 계속 발송함', async () => {
    db.Logbook.findAll.mockResolvedValue([
      row({ Apply: { User: { name: 'A', email: 'a@example.com' } } }),
      row({ Apply: { User: { name: 'B', email: 'b@example.com' } } }),
    ]);
    sendMail.mockRejectedValueOnce(new Error('smtp timeout')).mockResolvedValueOnce({ messageId: 'm2' });

    const result = await service.sendZoomMailBatch({ now: NOW });

    expect(result).toMatchObject({ processed_count: 1, failed_count: 1 });
    expect(result.failed_targets[0]).toMatchObject({ user_email: 'a@example.com', failed_reason: 'smtp timeout' });
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  test('발송 대상이 없으면 메일을 보내지 않음', async () => {
    db.Logbook.findAll.mockResolvedValue([]);
    const result = await service.sendZoomMailBatch({ now: NOW });
    expect(result).toMatchObject({ processed_count: 0, total_candidate_count: 0 });
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('REQ-SES-001 과제 알림 메일 (각 회차 3일 전)', () => {
  const session = (over = {}) => ({
    session_id: 1, meetup_id: 7, status: 'SCHEDULED', topic: '1장 읽기',
    sch_date: '2099-01-13', sch_day: '화', sch_time: '20:00', Meetup: { title: '소설 모임' }, ...over,
  });
  const apply = (name, email, meetup_id = 7) => ({ meetup_id, User: { name, email } });

  test('3일 뒤 회차의 확정된 모임(CLOSED·IN_PROGRESS)만 조회함', async () => {
    db.Session.findAll.mockResolvedValue([]);
    await service.sendLogbookMailBatch({ now: NOW });
    const { where, include } = db.Session.findAll.mock.calls[0][0];
    expect(where.status).toBe('SCHEDULED');
    expect(where.sch_date[Op.gte]).toBe('2099-01-13'); // 01-10 + 3일
    expect(where.sch_date[Op.lt]).toBe('2099-01-14');
    expect(include[0].where.status[Op.in]).toEqual(['CLOSED', 'IN_PROGRESS']);
  });

  test('해당 회차 모임의 신청자 모두에게 제출 안내 메일을 발송함', async () => {
    db.Session.findAll.mockResolvedValue([session()]);
    db.Apply.findAll.mockResolvedValue([apply('A', 'a@example.com'), apply('B', 'b@example.com')]);
    sendMail.mockResolvedValue({ messageId: 'm' });

    const result = await service.sendLogbookMailBatch({ now: NOW });

    expect(sendMail.mock.calls.map(([mail]) => mail.to).sort()).toEqual(['a@example.com', 'b@example.com']);
    const { subject, text } = sendMail.mock.calls[0][0];
    expect(subject).toContain('2099-01-13');
    expect(text).toContain('소설 모임');
    expect(text).toContain('1장 읽기');
    expect(text).toContain('2099-01-11'); // 제출 기한 = 모임 2일 전
    expect(result).toMatchObject({ processed_count: 2, failed_count: 0 });
  });

  test('같은 날 여러 모임의 회차는 각 모임의 신청자에게만 발송함', async () => {
    db.Session.findAll.mockResolvedValue([
      session({ session_id: 1, meetup_id: 7, Meetup: { title: '소설 모임' } }),
      session({ session_id: 2, meetup_id: 8, Meetup: { title: '경제 모임' } }),
    ]);
    db.Apply.findAll.mockResolvedValue([apply('A', 'a@example.com', 7), apply('B', 'b@example.com', 8)]);
    sendMail.mockResolvedValue({});

    await service.sendLogbookMailBatch({ now: NOW });

    const byTo = Object.fromEntries(sendMail.mock.calls.map(([mail]) => [mail.to, mail.text]));
    expect(byTo['a@example.com']).toContain('소설 모임');
    expect(byTo['a@example.com']).not.toContain('경제 모임');
    expect(byTo['b@example.com']).toContain('경제 모임');
  });

  test('이메일이 없는 신청자는 건너뛰고, 한 건 실패해도 나머지는 발송함', async () => {
    db.Session.findAll.mockResolvedValue([session()]);
    db.Apply.findAll.mockResolvedValue([apply('A', null), apply('B', 'b@example.com'), apply('C', 'c@example.com')]);
    sendMail.mockRejectedValueOnce(new Error('smtp down')).mockResolvedValueOnce({});

    const result = await service.sendLogbookMailBatch({ now: NOW });

    expect(result).toMatchObject({ total_candidate_count: 3, skipped_count: 1, failed_count: 1, processed_count: 1 });
  });

  test('3일 뒤 모임이 없으면 신청자 조회·메일 발송을 하지 않음', async () => {
    db.Session.findAll.mockResolvedValue([]);
    const result = await service.sendLogbookMailBatch({ now: NOW });
    expect(result).toMatchObject({ processed_count: 0, failed_count: 0, targets: [] });
    expect(db.Apply.findAll).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});

describe('REQ-BAT-001 회차 완료 (진행일 익일, KST)', () => {
  test('KST 오늘보다 이전 날짜의 SCHEDULED 회차만 COMPLETED로 변경함', async () => {
    db.Session.update.mockResolvedValue([3]);
    const result = await service.closePastSessions({ now: NOW });
    const [values, { where }] = db.Session.update.mock.calls[0];
    expect(values).toEqual({ status: 'COMPLETED' });
    expect(where.status).toBe('SCHEDULED');
    expect(where.sch_date[Op.lt]).toBe('2099-01-10');
    expect(result).toEqual({ completed_count: 3 });
  });

  test('00:10 KST 호출(= 전날 15:10 UTC)에도 KST 날짜로 어제 회차를 완료 대상에 포함함', async () => {
    db.Session.update.mockResolvedValue([1]);
    await service.closePastSessions({ now: new Date('2099-01-11T00:10:00+09:00') });
    expect(db.Session.update.mock.calls[0][1].where.sch_date[Op.lt]).toBe('2099-01-11');
  });
});
