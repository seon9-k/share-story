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
    // 삭제한 로그북도 함께 조회 (paranoid: false)
    // unique 인덱스(session_id, apply_id)가 삭제 행도 포함 → 새로 만들면 충돌하므로 복구 후 덮어씀
    const existing = await db.Logbook.findOne({
      where: { session_id: sessionId, apply_id: apply.apply_id }, transaction, paranoid: false
    });
    const values = { content, submitted_at: new Date(), is_approved: false, updated_user_id: userId };
    if (existing) {
      if (existing.deleted_at) await existing.restore({ transaction });
      return existing.update({ ...values, deleted_user_id: null }, { transaction });
    }
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

// 본인 로그북 삭제 (soft delete)
// 본인 크루 신청(apply_id) 기준으로만 조회하므로 다른 사람 로그북은 삭제 불가
async function remove({ meetupId, sessionId, userId }) {
  return db.sequelize.transaction(async (transaction) => {
    await access.meetup(meetupId, transaction);
    const apply = await access.crew(meetupId, userId, transaction);
    await access.session(meetupId, sessionId, transaction);
    const logbook = await db.Logbook.findOne({
      where: { session_id: sessionId, apply_id: apply.apply_id }, transaction
    });
    if (!logbook) fail(404, '삭제할 로그북이 없습니다.');
    // 삭제자 기록 후 deleted_at 설정
    await logbook.update({ deleted_user_id: userId, updated_user_id: userId }, { transaction });
    await logbook.destroy({ transaction });
    return { logbook_id: logbook.logbook_id, session_id: logbook.session_id };
  });
}

module.exports = { save, mine, list, remove };
