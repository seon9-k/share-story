// REQ-BAT-001 회차·모임 완료 배치, REQ-PAY-002 모집 마감 배치, NFR-REL-001 배치 안정 수행
jest.mock('../../src/models', () => require('./helpers/fakeDb'));
jest.mock('../../src/modules/meetup/meetup.batch.service');
jest.mock('../../src/modules/meetup/meetup.service');

const request = require('supertest');
const batchService = require('../../src/modules/meetup/meetup.batch.service');
const meetupService = require('../../src/modules/meetup/meetup.service');
const app = require('../../src/app');

const KEY = 'test-batch-key';
const endpoints = [
  ['/batch/meetups/close-recruitment', 'closeRecruitingMeetups'],
  ['/batch/meetups/start', 'startMeetups'],
  ['/batch/meetups/complete', 'completeFinishedMeetups'],
];

describe.each(endpoints)('POST %s', (path, serviceFn) => {
  test('x-batch-key가 없으면 401이며 배치를 실행하지 않음', async () => {
    const res = await request(app).post(path);
    expect(res.status).toBe(401);
    expect(batchService[serviceFn]).not.toHaveBeenCalled();
  });

  test('키가 틀리면 401', async () => {
    const res = await request(app).post(path).set('x-batch-key', 'wrong-key-value');
    expect(res.status).toBe(401);
  });

  test('길이만 같은 틀린 키도 401', async () => {
    const res = await request(app).post(path).set('x-batch-key', 'x'.repeat(KEY.length));
    expect(res.status).toBe(401);
  });

  test('사용자 JWT로는 호출할 수 없음', async () => {
    const { bearer } = require('./helpers/token');
    const res = await request(app).post(path).set('Authorization', bearer('leader01'));
    expect(res.status).toBe(401);
  });

  test('올바른 키면 배치를 실행하고 결과를 반환함', async () => {
    batchService[serviceFn].mockResolvedValue({ processed: 3 });
    const res = await request(app).post(path).set('x-batch-key', KEY);
    expect(res.status).toBe(200);
    expect(res.body.document).toEqual({ processed: 3 });
  });

  test('배치가 실패하면 500 (내부 오류 내용은 노출하지 않음)', async () => {
    batchService[serviceFn].mockRejectedValue(new Error('db password leaked'));
    const res = await request(app).post(path).set('x-batch-key', KEY);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('leaked');
  });
});

test('BATCH_API_KEY가 설정되지 않은 서버는 모든 배치 요청을 거부함', async () => {
  const original = process.env.BATCH_API_KEY;
  delete process.env.BATCH_API_KEY;
  try {
    const res = await request(app).post('/batch/meetups/complete').set('x-batch-key', '');
    expect(res.status).toBe(401);
  } finally {
    process.env.BATCH_API_KEY = original;
  }
});

describe.each([
  ['/session/zoom-mail', 'sendZoomMailBatch'],
  ['/session/close', 'closePastSessions'],
  ['/session/logbook-mail', 'sendLogbookMailBatch'],
])('POST %s (메일 발송·회차 완료, 스케줄러 전용)', (path, serviceFn) => {
  test('인증 없이 호출하면 401이며 메일 발송·처리를 실행하지 않음', async () => {
    const res = await request(app).post(path);
    expect(res.status).toBe(401);
    expect(meetupService[serviceFn]).not.toHaveBeenCalled();
  });

  test('키가 틀리면 401', async () => {
    const res = await request(app).post(path).set('x-batch-key', 'wrong-key-value');
    expect(res.status).toBe(401);
    expect(meetupService[serviceFn]).not.toHaveBeenCalled();
  });

  test('사용자 JWT로는 호출할 수 없음', async () => {
    const { bearer } = require('./helpers/token');
    const res = await request(app).post(path).set('Authorization', bearer('leader01'));
    expect(res.status).toBe(401);
    expect(meetupService[serviceFn]).not.toHaveBeenCalled();
  });

  test('올바른 키면 실행하고 결과를 반환함', async () => {
    meetupService[serviceFn].mockResolvedValue({ sent: 2 });
    const res = await request(app).post(path).set('x-batch-key', KEY);
    expect(res.status).toBe(200);
    expect(res.body.document).toEqual({ sent: 2 });
  });

  test('처리가 실패하면 500이며 내부 오류는 노출하지 않음', async () => {
    meetupService[serviceFn].mockRejectedValue(new Error('smtp password leaked'));
    const res = await request(app).post(path).set('x-batch-key', KEY);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('leaked');
  });
});

describe('메일 발송 실패는 스케줄러가 알 수 있게 500으로 응답함', () => {
  const failed = { processed_count: 1, failed_count: 2, failed_targets: [{ failed_reason: 'SMTP configuration is missing' }] };

  test.each([
    ['/session/zoom-mail', 'sendZoomMailBatch'],
    ['/session/logbook-mail', 'sendLogbookMailBatch'],
  ])('%s: 발송 실패가 있으면 500과 실패 내역을 반환함', async (path, serviceFn) => {
    meetupService[serviceFn].mockResolvedValue(failed);
    const res = await request(app).post(path).set('x-batch-key', KEY);
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ success: false, document: { failed_count: 2 } });
  });

  test('/session/zoom-mail: 실패가 없으면 200', async () => {
    meetupService.sendZoomMailBatch.mockResolvedValue({ processed_count: 3, failed_count: 0 });
    const res = await request(app).post('/session/zoom-mail').set('x-batch-key', KEY);
    expect(res.status).toBe(200);
  });
});
