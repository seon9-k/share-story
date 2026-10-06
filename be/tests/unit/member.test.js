const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// 서비스의 실제 권한/상태 분기를 실행하며 DB I/O만 대체한다.
const db = {};
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '../../models') return db;
  return originalLoad.call(this, request, parent, isMain);
};
const member = require('../../src/modules/member/meetup.service');
const crew = require('../../src/modules/member/crew.service');
const logbook = require('../../src/modules/logbook/logbook.service');
const review = require('../../src/modules/review/review.service');
const http = require('../../src/modules/member/member.http');
Module._load = originalLoad;

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
const rejects = (fn, status) => assert.rejects(fn, (e) => e.status === status);

test('captain and crew lists scope queries to the authenticated user', async () => {
  const queries = [];
  db.Meetup.findAndCountAll = async (options) => {
    queries.push(options);
    return { count: 0, rows: [] };
  };
  for (const role of ['captain', 'crew']) {
    await member.listMeetups({ userId: 'crew', role, paging: { page: 1, limit: 10, offset: 0 } });
  }
  assert.deepEqual(queries[0].where, { leader_id: 'crew' });
  assert.deepEqual(queries[1].include[0].where, { user_id: 'crew' });
  assert.equal(queries[1].include[0].required, true);
});

test('application locks meetup and uses authenticated identity', async () => {
  apply = null;
  db.Meetup.findByPk = async (id, options) => {
    assert.equal(options.lock, 'UPDATE');
    assert.ok(options.transaction);
    return meetup;
  };
  const result = await member.applyMeetup(args);
  assert.equal(result.user_id, 'crew');
  assert.equal(result.status, 'ING');
});

test('reject duplicate, captain, deadline, closed status, full meetup applications', async () => {
  await rejects(() => member.applyMeetup(args), 409);
  await rejects(() => member.applyMeetup({ ...args, userId: 'captain' }), 400);
  apply = null;
  meetup.deadline = new Date(0);
  await rejects(() => member.applyMeetup(args), 409);
  meetup.deadline = new Date(Date.now() + 86400000);
  meetup.status = 'CLOSED';
  await rejects(() => member.applyMeetup(args), 409);
  meetup.status = 'RECRUITING';
  db.Apply.count = async () => 4;
  await rejects(() => member.applyMeetup(args), 409);
  assert.equal(writes.length, 0);
});

test('logbook submission derives membership and submission metadata', async () => {
  const result = await logbook.save(args);
  assert.equal(result.apply_id, '10');
  assert.equal(result.created_user_id, 'crew');
  assert.ok(result.submitted_at instanceof Date);
  assert.equal(result.is_approved, false);
});

test('logbook revision updates existing row and resets approval', async () => {
  db.Logbook.findOne = async () => ({ update: async (values) => values });
  const result = await logbook.save(args);
  assert.equal(result.content, args.content);
  assert.equal(result.is_approved, false);
  assert.equal(writes.length, 0);
});

test('non-members cannot read or write logbooks or write reviews', async () => {
  apply = null;
  for (const operation of [logbook.mine, logbook.save, review.create]) {
    await rejects(() => operation(args), 403);
  }
});

test('cross-meetup and cancelled sessions cannot receive submissions', async () => {
  session.meetup_id = '9';
  await rejects(() => logbook.save(args), 404);
  session.meetup_id = '1';
  session.status = 'CANCELLED';
  await rejects(() => logbook.save(args), 409);
});

test('only the meetup captain can list crews or crew logbooks', async () => {
  for (const operation of [crew.list, logbook.list]) {
    await rejects(() => operation(args), 403);
    await rejects(() => operation({ ...args, userId: 'other-captain' }), 403);
  }
});

test('crew list exposes only crew identity and includes completed membership', async () => {
  db.Apply.findAndCountAll = async (query) => {
    assert.deepEqual(query.where, { meetup_id: '1' });
    assert.deepEqual(query.include[0].attributes, ['name']);
    assert.equal(query.limit, 10);
    assert.equal(query.offset, 0);
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
  const result = await crew.list({
    ...args,
    userId: 'captain',
    paging: { page: 1, limit: 10, offset: 0 },
  });
  assert.deepEqual(result.items, [
    { apply_id: '10', user_id: 'crew', name: '크루', status: 'COMPLETED' },
  ]);
});

test('session logbooks include submitted and unsubmitted crews and paginate by membership', async () => {
  const book = { logbook_id: '20', session_id: '2', content: '독서 기록' };
  db.Apply.findAndCountAll = async (query) => {
    assert.deepEqual(query.where, { meetup_id: '1' });
    assert.deepEqual(query.include[1].where, { meetup_id: '1', session_id: '2' });
    assert.equal(query.include[1].required, false);
    assert.equal(query.include[1].separate, true);
    assert.deepEqual(query.order, [['apply_id', 'ASC']]);
    assert.equal(query.limit, 2);
    assert.equal(query.offset, 0);
    return {
      count: 3,
      rows: [
        {
          apply_id: '10',
          user_id: 'crew1',
          status: 'ING',
          User: { name: '크루1' },
          Logbooks: [book],
        },
        { apply_id: '11', user_id: 'crew2', status: 'ING', User: { name: '크루2' }, Logbooks: [] },
      ],
    };
  };
  const result = await logbook.list({
    ...args,
    userId: 'captain',
    paging: { page: 1, limit: 2, offset: 0 },
  });
  assert.equal(result.total, 3);
  assert.equal(result.nextPage, 2);
  assert.deepEqual(result.items, [
    { apply_id: '10', user_id: 'crew1', name: '크루1', status: 'ING', logbook: book },
    { apply_id: '11', user_id: 'crew2', name: '크루2', status: 'ING', logbook: null },
  ]);
});

test('captain cannot retrieve a session belonging to another meetup', async () => {
  session.meetup_id = '9';
  db.Apply.findAndCountAll = () => assert.fail('must reject before querying crews');
  await rejects(() => logbook.list({ ...args, userId: 'captain' }), 404);
});

test('empty crew list returns an empty page for both endpoints', async () => {
  db.Apply.findAndCountAll = async () => ({ count: 0, rows: [] });
  for (const operation of [crew.list, logbook.list]) {
    const result = await operation({
      ...args,
      userId: 'captain',
      paging: { page: 1, limit: 10, offset: 0 },
    });
    assert.deepEqual(result, { page: 1, limit: 10, total: 0, nextPage: null, items: [] });
  }
});

test('deleted user does not hide the crew or break unsubmitted logbook output', async () => {
  db.Apply.findAndCountAll = async () => ({
    count: 1,
    rows: [{ apply_id: '10', user_id: 'crew', status: 'ING', User: null, Logbooks: [] }],
  });
  const result = await logbook.list({
    ...args,
    userId: 'captain',
    paging: { page: 1, limit: 10, offset: 0 },
  });
  assert.equal(result.items[0].name, null);
  assert.equal(result.items[0].logbook, null);
});

test('review requires completed meetup and valid rating; one review per membership', async () => {
  await rejects(() => review.create(args), 409);
  meetup.status = 'COMPLETED';
  for (const rating of [0, 6, 1.5, '5', null]) {
    await rejects(() => review.create({ ...args, rating }), 400);
  }
  const result = await review.create(args);
  assert.equal(result.apply_id, '10');
  assert.equal(result.rating, 5);
  db.Review.findOne = async () => result;
  await rejects(() => review.create(args), 409);
});

test('missing or deleted meetups return 404', async () => {
  meetup = null;
  for (const operation of [member.applyMeetup, logbook.save, logbook.mine, review.create]) {
    await rejects(() => operation(args), 404);
  }
});

test('validation preserves BIGINT and rejects invalid IDs, content, pagination', () => {
  assert.equal(http.id('9007199254740993', 'id'), '9007199254740993');
  for (const value of ['0', '-1', '1.5', '9223372036854775808', '1 OR 1=1']) {
    assert.throws(() => http.id(value, 'id'), { status: 400 });
  }
  for (const body of [null, {}, { content: ' ' }, { content: 42 }]) {
    assert.throws(() => http.content(body), { status: 400 });
  }
  assert.throws(() => http.pagination({ limit: '101' }), { status: 400 });
});

test('endpoint rejects missing identity and maps uniqueness errors to 409', async () => {
  let status;
  const res = {
    status: (value) => {
      status = value;
      return res;
    },
    json: (body) => body,
  };
  await http.endpoint(() => assert.fail('must not run'))({}, res, assert.fail);
  assert.equal(status, 401);
  await http.endpoint(() => {
    throw { name: 'SequelizeUniqueConstraintError' };
  })({ user_id: 'crew' }, res, assert.fail);
  assert.equal(status, 409);
});

test('separate captain and crew controllers fix the role and preserve pagination', async () => {
  const controller = require('../../src/modules/member/meetup.controller');
  const queries = [];
  db.Meetup.findAndCountAll = async (query) => {
    queries.push(query);
    return { count: 4, rows: [] };
  };
  for (const handler of [controller.listCaptainMeetups, controller.listCrewMeetups]) {
    let response;
    const res = {
      status(code) {
        assert.equal(code, 200);
        return this;
      },
      json(body) {
        response = body;
      },
    };
    await handler(
      { user_id: 'reader', query: { role: 'invalid-ignored', page: '2', limit: '2' } },
      res,
      assert.fail,
    );
    assert.equal(response.success, true);
    assert.equal(response.document.page, 2);
    assert.equal(response.document.limit, 2);
  }
  assert.deepEqual(queries[0].where, { leader_id: 'reader' });
  assert.equal(queries[0].include.length, 0);
  assert.deepEqual(queries[1].include[0].where, { user_id: 'reader' });
  assert.equal(queries[1].include[0].required, true);
  for (const query of queries) {
    assert.equal(query.offset, 2);
    assert.equal(query.limit, 2);
  }
});
