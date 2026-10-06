const db = require('../../models');
const access = require('../member/member.access');
const { fail, pageDocument } = require('../member/member.http');
const { toCrew } = require('../member/crew.service');

async function save({ meetupId, sessionId, userId, content }) {
  return db.sequelize.transaction(async (transaction) => {
    await access.meetup(meetupId, transaction);
    const apply = await access.crew(meetupId, userId, transaction);
    const session = await access.session(meetupId, sessionId, transaction);
    if (session.status === 'CANCELLED') fail(409, '취소된 세션에는 로그북을 제출할 수 없습니다.');
    const existing = await db.Logbook.findOne({
      where: { session_id: sessionId, apply_id: apply.apply_id }, transaction
    });
    const values = { content, submitted_at: new Date(), is_approved: false, updated_user_id: userId };
    if (existing) return existing.update(values, { transaction });
    return db.Logbook.create({
      ...values, meetup_id: meetupId, session_id: sessionId,
      apply_id: apply.apply_id, created_user_id: userId
    }, { transaction });
  });
}

async function mine({ meetupId, sessionId, userId }) {
  await access.meetup(meetupId);
  const apply = await access.crew(meetupId, userId);
  await access.session(meetupId, sessionId);
  return db.Logbook.findOne({ where: { session_id: sessionId, apply_id: apply.apply_id } });
}

async function list({ meetupId, sessionId, userId, paging }) {
  const meetup = await access.meetup(meetupId);
  access.captain(meetup, userId);
  await access.session(meetupId, sessionId);
  // 신청자를 기준으로 페이지를 구성해 미제출 크루도 유지한다.
  // hasMany를 별도 조회하여 로그북 조인이 인원 수와 페이지에 영향을 주지 않게 한다.
  const result = await db.Apply.findAndCountAll({
    where: { meetup_id: meetupId },
    attributes: ['apply_id', 'user_id', 'status'],
    include: [
      { model: db.User, attributes: ['name'], required: false },
      {
        model: db.Logbook,
        separate: true,
        required: false,
        where: { meetup_id: meetupId, session_id: sessionId },
        attributes: ['logbook_id', 'apply_id', 'meetup_id', 'session_id', 'content',
          'submitted_at', 'is_approved', 'updated_at']
      }
    ],
    order: [['apply_id', 'ASC']],
    limit: paging.limit, offset: paging.offset
  });
  const rows = result.rows.map((apply) => ({
    ...toCrew(apply),
    logbook: apply.Logbooks?.[0] ?? null
  }));
  return pageDocument({ count: result.count, rows }, paging);
}

module.exports = { save, mine, list };
