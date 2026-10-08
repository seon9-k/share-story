const db = require('../../models');
const access = require('../member/member.access');
const { fail, pageDocument } = require('../member/member.http');
const { toCrew } = require('../member/crew.service');
const { Op } = require('sequelize');

// 모임이 완료되면 모든 회차의 로그북 작성·수정·삭제 불가 (마지막 회차 포함)
function assertMeetupOpen(meetup) {
  if (meetup.status === 'COMPLETED') fail(409, '완료된 모임에는 로그북을 작성할 수 없습니다.');
}

// 다음 회차가 시작되면 이전 회차에 제출한 로그북은 수정·삭제 불가
// 취소된 회차는 건너뛰고, 시작 시각은 meetup.validation.js와 동일하게 KST로 해석
async function assertEditable(session, transaction) {
  const [next] = await db.Session.findAll({
    where: {
      meetup_id: session.meetup_id,
      session_number: { [Op.gt]: session.session_number },
      status: { [Op.ne]: 'CANCELLED' }
    },
    order: [['session_number', 'ASC']], limit: 1, transaction
  });
  if (!next) return;
  const startsAt = new Date(`${String(next.sch_date).slice(0, 10)}T${next.sch_st_time}:00+09:00`);
  if (Date.now() >= startsAt.getTime()) {
    fail(409, '다음 세션이 시작되어 이전 세션의 로그북은 수정할 수 없습니다.');
  }
}

async function save({ meetupId, sessionId, userId, content }) {
  return db.sequelize.transaction(async (transaction) => {
    assertMeetupOpen(await access.meetup(meetupId, transaction));
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
      // 삭제된 로그북을 다시 제출하는 경우는 새 제출로 보고 잠그지 않음
      if (!existing.deleted_at) await assertEditable(session, transaction);
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
  // 신청자를 기준으로 페이지를 구성해 미제출 크루도 유지함.
  // hasMany를 별도 조회하여 로그북 조인이 인원 수와 페이지에 영향을 주지 않게 함.
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
    assertMeetupOpen(await access.meetup(meetupId, transaction));
    const apply = await access.crew(meetupId, userId, transaction);
    const session = await access.session(meetupId, sessionId, transaction);
    const logbook = await db.Logbook.findOne({
      where: { session_id: sessionId, apply_id: apply.apply_id }, transaction
    });
    if (!logbook) fail(404, '삭제할 로그북이 없습니다.');
    await assertEditable(session, transaction);
    // 삭제자 기록 후 deleted_at 설정
    await logbook.update({ deleted_user_id: userId, updated_user_id: userId }, { transaction });
    await logbook.destroy({ transaction });
    return { logbook_id: logbook.logbook_id, session_id: logbook.session_id };
  });
}

// 모임장의 '숙제 확인 완료' 승인 (REQ-SES-003). 승인된 크루에게만 Zoom 접속 정보 메일이 발송됨
// 크루가 다시 제출하면 save()가 is_approved를 false로 되돌리므로 수정본은 다시 확인받아야 함
async function approve({ meetupId, sessionId, logbookId, userId, approved }) {
  return db.sequelize.transaction(async (transaction) => {
    const meetup = await access.meetup(meetupId, transaction);
    access.captain(meetup, userId);
    await access.session(meetupId, sessionId, transaction);
    // 이 모임·회차에 속한 로그북만 대상. 확인 중 크루가 재제출해도 덮어쓰지 않도록 행을 잠금
    const logbook = await db.Logbook.findOne({
      where: { logbook_id: logbookId, meetup_id: meetupId, session_id: sessionId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!logbook) fail(404, '로그북을 찾을 수 없습니다.');
    if (!logbook.submitted_at) fail(409, '제출되지 않은 로그북은 확인 처리할 수 없습니다.');
    await logbook.update({ is_approved: approved, updated_user_id: userId }, { transaction });
    return {
      logbook_id: logbook.logbook_id, session_id: logbook.session_id,
      apply_id: logbook.apply_id, is_approved: logbook.is_approved
    };
  });
}

module.exports = { save, mine, list, remove, approve };
