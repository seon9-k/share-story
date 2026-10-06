const db = require('../../models');
const access = require('./member.access');
const { fail, pageDocument } = require('./member.http');

async function listMeetups({ userId, role, paging }) {
  if (!['captain', 'crew'].includes(role)) fail(400, 'role은 captain 또는 crew여야 합니다.');
  const result = await db.Meetup.findAndCountAll({
    where: role === 'captain' ? { leader_id: userId } : {},
    include: role === 'crew' ? [{
      model: db.Apply, required: true, where: { user_id: userId },
      attributes: ['apply_id', 'status']
    }] : [],
    distinct: true,
    order: [['created_at', 'DESC'], ['meetup_id', 'DESC']],
    limit: paging.limit, offset: paging.offset
  });
  return pageDocument(result, paging);
}

async function applyMeetup({ meetupId, userId }) {
  return db.sequelize.transaction(async (transaction) => {
    const meetup = await access.meetup(meetupId, transaction);
    if (meetup.leader_id === userId) fail(400, '캡틴은 자신의 모임에 신청할 수 없습니다.');
    if (meetup.status !== 'RECRUITING' || new Date(meetup.deadline) <= new Date()) {
      fail(409, '신청 가능한 모집 기간이 아닙니다.');
    }
    const existing = await db.Apply.findOne({ where: { meetup_id: meetupId, user_id: userId }, transaction });
    if (existing) fail(409, '이미 신청한 모임입니다.');
    const count = await db.Apply.count({ where: { meetup_id: meetupId }, transaction });
    if (count >= meetup.max_capacity) fail(409, '모집 인원이 마감되었습니다.');
    return db.Apply.create({
      meetup_id: meetupId, user_id: userId, status: 'ING',
      created_user_id: userId, updated_user_id: userId
    }, { transaction });
  });
}

module.exports = { listMeetups, applyMeetup };
