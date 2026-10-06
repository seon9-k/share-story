const db = require('../../models');
const { fail } = require('./member.http');

async function meetup(meetupId, transaction) {
  const row = await db.Meetup.findByPk(meetupId, {
    transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {})
  });
  if (!row) fail(404, '모임을 찾을 수 없습니다.');
  return row;
}

async function crew(meetupId, userId, transaction) {
  const apply = await db.Apply.findOne({
    where: { meetup_id: meetupId, user_id: userId }, transaction
  });
  if (!apply) fail(403, '이 모임의 크루만 이용할 수 있습니다.');
  return apply;
}

function captain(row, userId) {
  if (row.leader_id !== userId) fail(403, '이 모임의 캡틴만 이용할 수 있습니다.');
}

async function session(meetupId, sessionId, transaction) {
  const row = await db.Session.findOne({
    where: { meetup_id: meetupId, session_id: sessionId }, transaction
  });
  if (!row) fail(404, '이 모임의 세션을 찾을 수 없습니다.');
  return row;
}

module.exports = { meetup, crew, captain, session };
