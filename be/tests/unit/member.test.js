// 서비스의 실제 권한/상태 분기를 실행하며 DB I/O만 대체함.
// 컨트롤러·라우트 계층은 Supertest로 실제 요청을 보내 검증함.
const mockDb = {};
jest.mock('../../src/models', () => mockDb);

const request = require('supertest');
const member = require('../../src/modules/member/meetup.service');
const crew = require('../../src/modules/member/crew.service');
const logbook = require('../../src/modules/logbook/logbook.service');
const review = require('../../src/modules/review/review.service');
const http = require('../../src/modules/member/member.http');
const app = require('../../src/app');
const { bearer } = require('../api/helpers/token');

const db = mockDb;
let meetup;
let apply;
let session;
let writes;

beforeEach(() => {
  meetup = {
    meetup_id: '1',
    leader_id: 'captain',
    status: 'RECRUITING',
    deadline: new Date(Date.now() + 86400000),
    max_capacity: 4,
  };
  apply = { apply_id: '10', user_id: 'crew', meetup_id: '1' };
  session = { session_id: '2', meetup_id: '1', status: 'SCHEDULED' };
  writes = [];
  db.sequelize = { transaction: async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } }) };
  db.Meetup = { findByPk: async () => meetup };
  db.Apply = {
    findOne: async () => apply,
    count: async () => 0,
    create: async (values) => {
      writes.push(values);
      return values;
    },
  };
  db.Session = {
    findOne: async ({ where }) => (where.meetup_id === session.meetup_id ? session : null),
  };
  db.Logbook = {
    findOne: async () => null,
    create: async (values) => {
      writes.push(values);
      return values;
    },
  };
  db.Review = {
    findOne: async () => null,
    create: async (values) => {
      writes.push(values);
      return values;
    },
  };
});

const args = { meetupId: '1', sessionId: '2', userId: 'crew', content: '독서 기록', rating: 5 };
const rejectsWith = (fn, status) => expect(fn()).rejects.toMatchObject({ status });
const paging = { page: 1, limit: 10, offset: 0 };

test('captain and crew lists scope queries to the authenticated user', async () => {
  const queries = [];
  db.Meetup.findAndCountAll = async (options) => {
    queries.push(options);
    return { count: 0, rows: [] };
  };
  for (const role of ['captain', 'crew']) {
    await member.listMeetups({ userId: 'crew', role, paging });
  }
  expect(queries[0].where).toEqual({ leader_id: 'crew' });
  expect(queries[1].include[0].where).toEqual({ user_id: 'crew' });
  expect(queries[1].include[0].required).toBe(true);
});

test('application locks meetup and uses authenticated identity', async () => {
  apply = null;
  const findByPk = jest.fn(async () => meetup);
  db.Meetup.findByPk = findByPk;

  const result = await member.applyMeetup(args);

  const options = findByPk.mock.calls[0][1];
  expect(options.lock).toBe('UPDATE');
  expect(options.transaction).toBeTruthy();
  expect(result.user_id).toBe('crew');
  expect(result.status).toBe('ING');
});

test('application that fills capacity closes meetup in the same transaction', async () => {
  apply = null;
  meetup.update = jest.fn();
  db.Apply.count = async () => 3;
  await member.applyMeetup(args);
  expect(meetup.update).toHaveBeenCalledTimes(1);
  expect(meetup.update.mock.calls[0][0]).toEqual({ status: 'CLOSED', updated_user_id: 'crew' });
  expect(meetup.update.mock.calls[0][1].transaction).toBeTruthy();

  meetup.update.mockClear();
  db.Apply.count = async () => 2;
  await member.applyMeetup(args);
  expect(meetup.update).not.toHaveBeenCalled();
});

test('reject duplicate, captain, deadline, closed status, full meetup applications', async () => {
  await rejectsWith(() => member.applyMeetup(args), 409);
  await rejectsWith(() => member.applyMeetup({ ...args, userId: 'captain' }), 400);
  apply = null;
  meetup.deadline = new Date(0);
  await rejectsWith(() => member.applyMeetup(args), 409);
  meetup.deadline = new Date(Date.now() + 86400000);
  meetup.status = 'CLOSED';
  await rejectsWith(() => member.applyMeetup(args), 409);
  meetup.status = 'RECRUITING';
  db.Apply.count = async () => 4;
  await rejectsWith(() => member.applyMeetup(args), 409);
  expect(writes).toHaveLength(0);
});

test('logbook submission derives membership and submission metadata', async () => {
  const result = await logbook.save(args);
  expect(result.apply_id).toBe('10');
  expect(result.created_user_id).toBe('crew');
  expect(result.submitted_at).toBeInstanceOf(Date);
  expect(result.is_approved).toBe(false);
});

test('logbook revision updates existing row and resets approval', async () => {
  db.Logbook.findOne = async () => ({ update: async (values) => values });
  const result = await logbook.save(args);
  expect(result.content).toBe(args.content);
  expect(result.is_approved).toBe(false);
  expect(writes).toHaveLength(0);
});

test('non-members cannot read or write logbooks or write reviews', async () => {
  apply = null;
  for (const operation of [logbook.mine, logbook.save, review.create]) {
    await rejectsWith(() => operation(args), 403);
  }
});

test('cross-meetup and cancelled sessions cannot receive submissions', async () => {
  session.meetup_id = '9';
  await rejectsWith(() => logbook.save(args), 404);
  session.meetup_id = '1';
  session.status = 'CANCELLED';
  await rejectsWith(() => logbook.save(args), 409);
});

test('only the meetup captain can list crews or crew logbooks', async () => {
  for (const operation of [crew.list, logbook.list]) {
    await rejectsWith(() => operation(args), 403);
    await rejectsWith(() => operation({ ...args, userId: 'other-captain' }), 403);
  }
});

test('crew list exposes only crew identity and includes completed membership', async () => {
  db.Apply.findAndCountAll = async (query) => {
    expect(query.where).toEqual({ meetup_id: '1' });
    expect(query.include[0].attributes).toEqual(['name']);
    expect(query.limit).toBe(10);
    expect(query.offset).toBe(0);
    return {
      count: 1,
      rows: [
        {
          apply_id: '10',
          user_id: 'crew',
          status: 'COMPLETED',
          User: { name: '크루', email: 'private@example.com', password: 'private' },
        },
      ],
    };
  };
  const result = await crew.list({ ...args, userId: 'captain', paging });
  expect(result.items).toEqual([
    { apply_id: '10', user_id: 'crew', name: '크루', status: 'COMPLETED' },
  ]);
});

test('session logbooks include submitted and unsubmitted crews and paginate by membership', async () => {
  const book = { logbook_id: '20', session_id: '2', content: '독서 기록' };
  db.Apply.findAndCountAll = async (query) => {
    expect(query.where).toEqual({ meetup_id: '1' });
    expect(query.include[1].where).toEqual({ meetup_id: '1', session_id: '2' });
    expect(query.include[1].required).toBe(false);
    expect(query.include[1].separate).toBe(true);
    expect(query.order).toEqual([['apply_id', 'ASC']]);
    expect(query.limit).toBe(2);
    expect(query.offset).toBe(0);
    return {
      count: 3,
      rows: [
        { apply_id: '10', user_id: 'crew1', status: 'ING', User: { name: '크루1' }, Logbooks: [book] },
        { apply_id: '11', user_id: 'crew2', status: 'ING', User: { name: '크루2' }, Logbooks: [] },
      ],
    };
  };
  const result = await logbook.list({
    ...args,
    userId: 'captain',
    paging: { page: 1, limit: 2, offset: 0 },
  });
  expect(result.total).toBe(3);
  expect(result.nextPage).toBe(2);
  expect(result.items).toEqual([
    { apply_id: '10', user_id: 'crew1', name: '크루1', status: 'ING', logbook: book },
    { apply_id: '11', user_id: 'crew2', name: '크루2', status: 'ING', logbook: null },
  ]);
});

test('captain cannot retrieve a session belonging to another meetup', async () => {
  session.meetup_id = '9';
  db.Apply.findAndCountAll = jest.fn();
  await rejectsWith(() => logbook.list({ ...args, userId: 'captain' }), 404);
  expect(db.Apply.findAndCountAll).not.toHaveBeenCalled(); // 크루 조회 전에 거부
});

test('empty crew list returns an empty page for both endpoints', async () => {
  db.Apply.findAndCountAll = async () => ({ count: 0, rows: [] });
  for (const operation of [crew.list, logbook.list]) {
    const result = await operation({ ...args, userId: 'captain', paging });
    expect(result).toEqual({ page: 1, limit: 10, total: 0, nextPage: null, items: [] });
  }
});

test('deleted user does not hide the crew or break unsubmitted logbook output', async () => {
  db.Apply.findAndCountAll = async () => ({
    count: 1,
    rows: [{ apply_id: '10', user_id: 'crew', status: 'ING', User: null, Logbooks: [] }],
  });
  const result = await logbook.list({ ...args, userId: 'captain', paging });
  expect(result.items[0].name).toBeNull();
  expect(result.items[0].logbook).toBeNull();
});

test('review requires completed meetup and valid rating; one review per membership', async () => {
  await rejectsWith(() => review.create(args), 409);
  meetup.status = 'COMPLETED';
  for (const rating of [0, 6, 1.5, '5', null]) {
    await rejectsWith(() => review.create({ ...args, rating }), 400);
  }
  const result = await review.create(args);
  expect(result.apply_id).toBe('10');
  expect(result.rating).toBe(5);
  db.Review.findOne = async () => result;
  await rejectsWith(() => review.create(args), 409);
});

test('missing or deleted meetups return 404', async () => {
  meetup = null;
  for (const operation of [member.applyMeetup, logbook.save, logbook.mine, review.create]) {
    await rejectsWith(() => operation(args), 404);
  }
});

test('validation preserves BIGINT and rejects invalid IDs, content, pagination', () => {
  expect(http.id('9007199254740993', 'id')).toBe('9007199254740993');
  for (const value of ['0', '-1', '1.5', '9223372036854775808', '1 OR 1=1']) {
    expect(() => http.id(value, 'id')).toThrow(expect.objectContaining({ status: 400 }));
  }
  for (const body of [null, {}, { content: ' ' }, { content: 42 }]) {
    expect(() => http.content(body)).toThrow(expect.objectContaining({ status: 400 }));
  }
  expect(() => http.pagination({ limit: '101' })).toThrow(expect.objectContaining({ status: 400 }));
});

test('endpoint rejects missing identity and maps uniqueness errors to 409', async () => {
  const res = { status: jest.fn(() => res), json: jest.fn((body) => body) };
  const next = jest.fn();
  const handler = jest.fn();

  await http.endpoint(handler)({}, res, next);
  expect(res.status).toHaveBeenLastCalledWith(401);
  expect(handler).not.toHaveBeenCalled();

  await http.endpoint(() => {
    throw { name: 'SequelizeUniqueConstraintError' };
  })({ user_id: 'crew' }, res, next);
  expect(res.status).toHaveBeenLastCalledWith(409);
  expect(next).not.toHaveBeenCalled();
});

test('separate captain and crew endpoints fix the role and preserve pagination', async () => {
  const queries = [];
  db.Meetup.findAndCountAll = async (query) => {
    queries.push(query);
    return { count: 4, rows: [] };
  };
  for (const path of ['captain', 'crew']) {
    // role 쿼리는 무시되고 경로가 역할을 결정함
    const res = await request(app)
      .get(`/member/meetups/${path}?role=invalid-ignored&page=2&limit=2`)
      .set('Authorization', bearer('reader'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.document.page).toBe(2);
    expect(res.body.document.limit).toBe(2);
  }
  expect(queries[0].where).toEqual({ leader_id: 'reader' });
  expect(queries[0].include).toHaveLength(0);
  expect(queries[1].include[0].where).toEqual({ user_id: 'reader' });
  expect(queries[1].include[0].required).toBe(true);
  for (const query of queries) {
    expect(query.offset).toBe(2);
    expect(query.limit).toBe(2);
  }
});

// 삭제 기능: 본인 apply_id 기준으로만 조회·삭제, 삭제 후 재작성은 복구
const softRow = (values) => {
  const row = {
    ...values,
    deleted_at: values.deleted_at ?? null,
    calls: [],
    update: async (v) => {
      row.calls.push(['update', v]);
      Object.assign(row, v);
      return row;
    },
    destroy: async () => {
      row.calls.push(['destroy']);
      row.deleted_at = new Date();
    },
    restore: async () => {
      row.calls.push(['restore']);
      row.deleted_at = null;
    },
  };
  return row;
};

test('logbook delete removes only the requester logbook', async () => {
  const book = softRow({ logbook_id: '5', session_id: '2', apply_id: '10' });
  const findOne = jest.fn(async () => book);
  db.Logbook.findOne = findOne;
  const result = await logbook.remove(args);
  expect(findOne.mock.calls[0][0].where).toEqual({ session_id: '2', apply_id: '10' });
  expect(result.logbook_id).toBe('5');
  expect(book.deleted_user_id).toBe('crew');
  expect(book.deleted_at).toBeTruthy();
});

test('logbook delete rejects missing logbook and non-members', async () => {
  await rejectsWith(() => logbook.remove(args), 404);
  apply = null;
  await rejectsWith(() => logbook.remove(args), 403);
});

test('logbook resubmission after delete restores the same row', async () => {
  const book = softRow({ logbook_id: '5', session_id: '2', apply_id: '10', deleted_at: new Date() });
  const findOne = jest.fn(async () => book);
  db.Logbook.findOne = findOne;
  const result = await logbook.save(args);
  expect(findOne.mock.calls[0][0].paranoid).toBe(false);
  expect(result.deleted_at).toBeNull();
  expect(result.deleted_user_id).toBeNull();
  expect(result.content).toBe(args.content);
  expect(writes).toHaveLength(0);
});

test('review delete removes only the requester review and allows rewriting', async () => {
  meetup.status = 'COMPLETED';
  const own = softRow({ review_id: '7', apply_id: '10' });
  db.Review.findOne = async () => own;
  const removed = await review.remove(args);
  expect(removed.review_id).toBe('7');
  expect(own.deleted_user_id).toBe('crew');
  expect(own.deleted_at).toBeTruthy();
  // 삭제 후 재작성: 같은 행 복구 + 내용 갱신
  const rewritten = await review.create({ ...args, rating: 3 });
  expect(rewritten.deleted_at).toBeNull();
  expect(rewritten.rating).toBe(3);
  expect(writes).toHaveLength(0);
});

test('review delete rejects missing review and non-members', async () => {
  await rejectsWith(() => review.remove(args), 404);
  apply = null;
  await rejectsWith(() => review.remove(args), 403);
});
