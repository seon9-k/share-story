// 요구사항 기반 배치 검증: 실제 PostgreSQL에서 배치 SQL을 실행함
//   REQ-PAY-002 모집 마감 자동 처리, REQ-BAT-001 회차·모임 완료 자동 배치, NFR-REL-001 안정 수행(멱등)
// 일회용 DB를 만들어 사용하므로 TEST_DATABASE_URL이 있을 때만 수행함
//   TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres npm run test:db
jest.mock('../../src/common/services/mailer.service');

const path = require('node:path');
const { promisify } = require('node:util');
const { execFile: execFileCb } = require('node:child_process');
const { Client } = require('pg');

const execFile = promisify(execFileCb);

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

// 배치는 한국 시간(KST) 기준으로 날짜를 판단함
const kstDate = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const hoursFromNow = (h) => new Date(Date.now() + h * 3600000);

run('배치 SQL (실제 PostgreSQL)', () => {
  let admin;
  let database;
  let db;
  let batch;
  const originalEnv = { ...process.env };
  let seq = 0;

  beforeAll(async () => {
    admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await admin.connect();
    database = `batch_sql_${process.pid}_${Date.now()}`;
    await admin.query(`CREATE DATABASE "${database}"`);
    // 운영 DB처럼 UTC로 동작하게 해 시간대 의존 버그를 드러냄
    await admin.query(`ALTER DATABASE "${database}" SET timezone TO 'UTC'`);

    const url = new URL(process.env.TEST_DATABASE_URL);
    Object.assign(process.env, {
      NODE_ENV: 'test',
      DIALECT: 'postgres',
      DB_HOST: url.hostname,
      DB_PORT: url.port || '5432',
      DB_NAME: database,
      DB_USER: decodeURIComponent(url.username),
      DB_PASSWORD: decodeURIComponent(url.password),
      DB_SSL: 'false',
    });
    db = require('../../src/models');
    batch = require('../../src/modules/meetup/meetup.batch.service');
    await db.sequelize.sync();
    for (const id of ['leader', 'u1', 'u2', 'u3', 'u4', 'u5']) {
      await db.User.create({
        user_id: id, name: id, email: `${id}@example.com`, monthly_reading_volume: 'BOOKS_1_2',
        age_group: '30대', gender: 'F', created_user_id: 't', updated_user_id: 't',
      });
    }
  }, 60000);

  afterAll(async () => {
    if (db) await db.sequelize.close();
    if (admin) {
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await admin.end();
    }
    Object.keys(process.env).forEach((k) => !(k in originalEnv) && delete process.env[k]);
    Object.assign(process.env, originalEnv);
  });

  const meetup = (over = {}) =>
    db.Meetup.create({
      leader_id: 'leader', title: `모임${++seq}`, description: 'd', book_title: 'b', price: 0,
      min_capacity: 4, max_capacity: 4, deadline: hoursFromNow(48), status: 'RECRUITING',
      created_user_id: 't', updated_user_id: 't', ...over,
    });
  const sessions = (m, dates, status = 'SCHEDULED') =>
    Promise.all(
      dates.map((sch_date, i) =>
        db.Session.create({
          meetup_id: m.meetup_id, session_number: i + 1, topic: `t${i}`, sch_date, sch_day: '토',
          sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', status: Array.isArray(status) ? status[i] : status,
          created_user_id: 't', updated_user_id: 't',
        }),
      ),
    );
  const applies = (m, users) =>
    Promise.all(
      users.map((user_id) =>
        db.Apply.create({ meetup_id: m.meetup_id, user_id, status: 'ING', created_user_id: 't', updated_user_id: 't' }),
      ),
    );
  const statusOf = async (m) => (await db.Meetup.findByPk(m.meetup_id)).status;

  describe('REQ-PAY-002 모집 마감 자동 처리', () => {
    test('모집 마감일이 지나면 CLOSED로 변경하고 변경 주체를 기록함', async () => {
      const m = await meetup({ deadline: hoursFromNow(-1) });
      const result = await batch.closeRecruitingMeetups();
      expect(result.meetups.map((x) => x.meetup_id)).toContain(m.meetup_id);
      const row = await db.Meetup.findByPk(m.meetup_id);
      expect(row.status).toBe('CLOSED');
      expect(row.updated_user_id).toBe('SYSTEM_BATCH');
    });

    test('마감일 전이라도 최대 인원이 차면 CLOSED', async () => {
      const m = await meetup({ max_capacity: 2, deadline: hoursFromNow(72) });
      await applies(m, ['u1', 'u2']);
      await batch.closeRecruitingMeetups();
      expect(await statusOf(m)).toBe('CLOSED');
    });

    test('마감일 전이고 정원이 남았으면 모집을 계속함', async () => {
      const m = await meetup({ max_capacity: 4, deadline: hoursFromNow(72) });
      await applies(m, ['u1', 'u2', 'u3']);
      await batch.closeRecruitingMeetups();
      expect(await statusOf(m)).toBe('RECRUITING');
    });

    test('취소(삭제)된 신청은 인원 수에서 제외함', async () => {
      const m = await meetup({ max_capacity: 2, deadline: hoursFromNow(72) });
      const [a] = await applies(m, ['u1', 'u2']);
      await a.destroy(); // soft delete
      await batch.closeRecruitingMeetups();
      expect(await statusOf(m)).toBe('RECRUITING');
    });

    test('삭제된 모임은 건드리지 않음', async () => {
      const m = await meetup({ deadline: hoursFromNow(-5) });
      await m.destroy();
      await batch.closeRecruitingMeetups();
      const row = await db.Meetup.findByPk(m.meetup_id, { paranoid: false });
      expect(row.status).toBe('RECRUITING');
    });

    test('다시 실행해도 결과가 같음 (멱등, NFR-REL-001)', async () => {
      await meetup({ deadline: hoursFromNow(-2) });
      await batch.closeRecruitingMeetups();
      const second = await batch.closeRecruitingMeetups();
      expect(second.closed_count).toBe(0);
    });

    test('이미 진행·완료된 모임의 상태는 되돌리지 않음', async () => {
      const inProgress = await meetup({ status: 'IN_PROGRESS', deadline: hoursFromNow(-9) });
      const completed = await meetup({ status: 'COMPLETED', deadline: hoursFromNow(-9) });
      await batch.closeRecruitingMeetups();
      expect(await statusOf(inProgress)).toBe('IN_PROGRESS');
      expect(await statusOf(completed)).toBe('COMPLETED');
    });
  });

  describe('REQ-BAT-001 모임 완료 자동 배치 (마지막 회차 익일)', () => {
    test('마지막 회차가 어제(KST)면 COMPLETED', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      await sessions(m, [kstDate(-22), kstDate(-15), kstDate(-8), kstDate(-1)]);
      await batch.completeFinishedMeetups();
      expect(await statusOf(m)).toBe('COMPLETED');
    });

    test('마지막 회차가 오늘이면 아직 완료하지 않음 (익일에 처리)', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      await sessions(m, [kstDate(-21), kstDate(-14), kstDate(-7), kstDate(0)]);
      await batch.completeFinishedMeetups();
      expect(await statusOf(m)).toBe('IN_PROGRESS');
    });

    test('남은 회차가 있으면 완료하지 않음', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      await sessions(m, [kstDate(-14), kstDate(-7), kstDate(1), kstDate(8)]);
      await batch.completeFinishedMeetups();
      expect(await statusOf(m)).toBe('IN_PROGRESS');
    });

    test('취소된 회차는 마지막 회차 계산에서 제외함', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      await sessions(m, [kstDate(-14), kstDate(-7), kstDate(-2), kstDate(30)], ['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED']);
      await batch.completeFinishedMeetups();
      expect(await statusOf(m)).toBe('COMPLETED');
    });

    test('회차가 없는 모임은 대상에서 제외함', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      await batch.completeFinishedMeetups();
      expect(await statusOf(m)).toBe('IN_PROGRESS');
    });

    test('모집 중인 모임은 완료 처리하지 않음', async () => {
      const m = await meetup({ status: 'RECRUITING' });
      await sessions(m, [kstDate(-9), kstDate(-8), kstDate(-7), kstDate(-6)]);
      await batch.completeFinishedMeetups();
      expect(await statusOf(m)).toBe('RECRUITING');
    });

    test('다시 실행해도 결과가 같음 (멱등)', async () => {
      const m = await meetup({ status: 'CLOSED' });
      await sessions(m, [kstDate(-9), kstDate(-8), kstDate(-7), kstDate(-6)]);
      await batch.completeFinishedMeetups();
      const second = await batch.completeFinishedMeetups();
      expect(second.meetups.map((x) => x.meetup_id)).not.toContain(m.meetup_id);
    });
  });

  describe('메일 배치와 숙제 승인 흐름 (실제 DB 쿼리 검증)', () => {
    const { sendMail } = require('../../src/common/services/mailer.service');
    const logbookService = () => require('../../src/modules/logbook/logbook.service');
    const mailService = () => require('../../src/modules/meetup/meetup.service');

    beforeEach(async () => {
      // 배치는 DB 전체를 대상으로 하므로 앞 테스트의 데이터가 섞이지 않게 비움 (회원은 유지)
      await db.sequelize.query('TRUNCATE "logbook", "session", "apply", "meetup" RESTART IDENTITY CASCADE');
      sendMail.mockReset();
      sendMail.mockResolvedValue({ messageId: 'test', accepted: [] });
    });

    const zoomSession = (m, n, date, over = {}) =>
      db.Session.create({
        meetup_id: m.meetup_id, session_number: n, topic: `주제${n}`, sch_date: date, sch_day: '토',
        sch_time: '20:00', sch_st_time: '20:00', sch_ed_time: '22:00', status: 'SCHEDULED',
        zoom_url: `https://zoom.us/j/${n}`, zoom_password: `pw${n}`, created_user_id: 't', updated_user_id: 't', ...over,
      });
    const logbookOf = (m, session, apply, over = {}) =>
      db.Logbook.create({
        meetup_id: m.meetup_id, session_id: session.session_id, apply_id: apply.apply_id, content: '독후감',
        submitted_at: new Date(), is_approved: true, created_user_id: 't', updated_user_id: 't', ...over,
      });
    const recipients = () => sendMail.mock.calls.map(([mail]) => mail.to).sort();

    test('REQ-SES-004: 승인된 신청자에게만, 모임 1일 전·당일 회차의 Zoom 정보를 발송함', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      const [a1, a2, a3, a4, a5] = await applies(m, ['u1', 'u2', 'u3', 'u4', 'u5']);
      const today = await zoomSession(m, 1, kstDate(0));
      const tomorrow = await zoomSession(m, 2, kstDate(1));
      const inTwoDays = await zoomSession(m, 3, kstDate(2));
      const yesterday = await zoomSession(m, 4, kstDate(-1));
      await logbookOf(m, today, a1); // 당일 + 승인 → 발송
      await logbookOf(m, today, a2, { is_approved: false }); // 미승인 → 제외
      await logbookOf(m, tomorrow, a3); // 1일 전 + 승인 → 발송
      await logbookOf(m, inTwoDays, a4); // 2일 전 → 제외 (요구사항은 1일 전·당일)
      await logbookOf(m, yesterday, a5); // 지난 회차 → 제외

      const result = await mailService().sendZoomMailBatch();

      expect(recipients()).toEqual(['u1@example.com', 'u3@example.com']);
      expect(result).toMatchObject({ processed_count: 2, failed_count: 0 });
      const forU1 = sendMail.mock.calls.find(([mail]) => mail.to === 'u1@example.com')[0];
      expect(forU1.text).toContain('https://zoom.us/j/1');
      expect(forU1.text).toContain('pw1');
    });

    test('REQ-SES-004: 제출하지 않았거나(submitted_at 없음) 삭제된 로그북은 제외함', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      const [a1, a2] = await applies(m, ['u1', 'u2']);
      const session = await zoomSession(m, 1, kstDate(0));
      await logbookOf(m, session, a1, { submitted_at: null });
      const removed = await logbookOf(m, session, a2);
      await removed.destroy();

      await mailService().sendZoomMailBatch();

      expect(sendMail).not.toHaveBeenCalled();
    });

    test('REQ-SES-001: 3일 뒤 회차의 신청자 전원에게 안내하고 대상이 아닌 회차는 제외함', async () => {
      const target = await meetup({ status: 'CLOSED', title: 'D3 모임' });
      await applies(target, ['u1', 'u2']);
      await zoomSession(target, 1, kstDate(3));

      const recruiting = await meetup({ status: 'RECRUITING' }); // 모집 중 → 제외
      await applies(recruiting, ['u3']);
      await zoomSession(recruiting, 1, kstDate(3));

      const otherDay = await meetup({ status: 'CLOSED' }); // D-2, D-4 → 제외
      await applies(otherDay, ['u4']);
      await zoomSession(otherDay, 1, kstDate(2));
      await zoomSession(otherDay, 2, kstDate(4));

      const cancelled = await meetup({ status: 'CLOSED' }); // 취소된 회차 → 제외
      await applies(cancelled, ['u5']);
      await zoomSession(cancelled, 1, kstDate(3), { status: 'CANCELLED' });

      const result = await mailService().sendLogbookMailBatch();

      expect(recipients()).toEqual(['u1@example.com', 'u2@example.com']);
      expect(result).toMatchObject({ processed_count: 2, failed_count: 0 });
      const { subject, text } = sendMail.mock.calls[0][0];
      expect(subject).toContain(kstDate(3));
      expect(text).toContain('D3 모임');
      expect(text).toContain(kstDate(1)); // 제출 기한: 모임 2일 전
    });

    test('REQ-SES-002~004 전체 흐름: 제출 → 모임장 승인 → Zoom 메일', async () => {
      const m = await meetup({ status: 'IN_PROGRESS', leader_id: 'leader' });
      const [apply] = await applies(m, ['u1']);
      const session = await zoomSession(m, 1, kstDate(1));
      const service = logbookService();
      const args = { meetupId: String(m.meetup_id), sessionId: String(session.session_id) };

      // 1) 크루가 로그북 제출 → 아직 미승인이라 메일 대상 아님
      const saved = await service.save({ ...args, userId: 'u1', content: '독후감 내용' });
      expect(saved.is_approved).toBe(false);
      await mailService().sendZoomMailBatch();
      expect(sendMail).not.toHaveBeenCalled();

      // 2) 크루는 승인할 수 없음 (모임장만)
      await expect(
        service.approve({ ...args, logbookId: String(saved.logbook_id), userId: 'u1', approved: true }),
      ).rejects.toMatchObject({ status: 403 });

      // 3) 모임장 승인 → Zoom 메일 발송 대상
      const approved = await service.approve({ ...args, logbookId: String(saved.logbook_id), userId: 'leader', approved: true });
      expect(approved).toMatchObject({ is_approved: true, apply_id: apply.apply_id });
      await mailService().sendZoomMailBatch();
      expect(recipients()).toEqual(['u1@example.com']);

      // 4) 크루가 수정본을 다시 제출하면 승인이 풀려 다시 확인을 받아야 함
      sendMail.mockClear();
      await service.save({ ...args, userId: 'u1', content: '수정한 독후감' });
      await mailService().sendZoomMailBatch();
      expect(sendMail).not.toHaveBeenCalled();

      // 5) 승인 취소·다른 모임의 로그북 승인 시도
      await expect(
        service.approve({ ...args, logbookId: '999999', userId: 'leader', approved: true }),
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('모임 시작 배치', () => {
    test('첫 회차 당일부터 CLOSED → IN_PROGRESS', async () => {
      const today = await meetup({ status: 'CLOSED' });
      await sessions(today, [kstDate(0), kstDate(7), kstDate(14), kstDate(21)]);
      const future = await meetup({ status: 'CLOSED' });
      await sessions(future, [kstDate(1), kstDate(8), kstDate(15), kstDate(22)]);

      await batch.startMeetups();

      expect(await statusOf(today)).toBe('IN_PROGRESS');
      expect(await statusOf(future)).toBe('CLOSED');
    });
  });

  describe('회차 완료 배치 closePastSessions (REQ-BAT-001: 회차 완료일 익일)', () => {
    const service = () => require('../../src/modules/meetup/meetup.service');
    const sessionStatus = async (s) => (await db.Session.findByPk(s.session_id)).status;

    test('지난 회차는 COMPLETED, 오늘·미래 회차는 그대로', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      const [past, today, future] = await sessions(m, [kstDate(-3), kstDate(0), kstDate(5)]);
      // 서버 시간대와 무관하게 기준일을 고정해 검증
      const now = new Date(`${kstDate(0)}T12:00:00`);
      const result = await service().closePastSessions({ now });
      expect(result.completed_count).toBeGreaterThanOrEqual(1);
      expect(await sessionStatus(past)).toBe('COMPLETED');
      expect(await sessionStatus(today)).toBe('SCHEDULED');
      expect(await sessionStatus(future)).toBe('SCHEDULED');
    });

    // Azure App Service는 UTC로 동작함. Jest 샌드박스에서는 TZ를 바꿀 수 없으므로
    // 서비스를 별도 프로세스로 실행해 서버 시간대를 실제로 재현함
    const closeInProcess = async (tz, now) => {
      const { stdout } = await execFile(
        process.execPath,
        ['-e', `require('./src/modules/meetup/meetup.service').closePastSessions({ now: new Date('${now}') }).then((r) => { console.log(JSON.stringify(r)); process.exit(0); })`],
        { cwd: path.resolve(__dirname, '../..'), env: { ...process.env, TZ: tz } },
      );
      return JSON.parse(stdout.trim().split('\n').pop());
    };

    test('한국 시간대 서버에서는 00:10 KST 호출 시 어제 회차를 완료함 (대조군)', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      const [yesterday] = await sessions(m, [kstDate(-1)]);
      await closeInProcess('Asia/Seoul', `${kstDate(0)}T00:10:00+09:00`);
      expect(await sessionStatus(yesterday)).toBe('COMPLETED');
    });

    // 과거 결함(수정됨): closePastSessions가 날짜를 서버 로컬 시간으로 계산해,
    // 00:10 KST(= 전날 15:10 UTC) 호출 시 UTC 서버에서 어제(KST) 회차 완료가 하루 늦어졌음. 지금은 KST로 판단함
    test('UTC 서버에서도 00:10 KST 호출 시 어제 회차를 완료함', async () => {
      const m = await meetup({ status: 'IN_PROGRESS' });
      const [yesterday] = await sessions(m, [kstDate(-1)]);
      await closeInProcess('UTC', `${kstDate(0)}T00:10:00+09:00`);
      expect(await sessionStatus(yesterday)).toBe('COMPLETED');
    });
  });
});
