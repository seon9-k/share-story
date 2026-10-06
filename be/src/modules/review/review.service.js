const db = require('../../models');
const access = require('../member/member.access');
const { fail, pageDocument } = require('../member/member.http');

async function create({ meetupId, userId, content, rating }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail(400, 'rating은 1~5 사이의 정수여야 합니다.');
  return db.sequelize.transaction(async (transaction) => {
    const meetup = await access.meetup(meetupId, transaction);
    const apply = await access.crew(meetupId, userId, transaction);
    if (meetup.status !== 'COMPLETED') fail(409, '종료된 모임에만 리뷰를 남길 수 있습니다.');
    const existing = await db.Review.findOne({ where: { apply_id: apply.apply_id }, transaction });
    if (existing) fail(409, '이미 리뷰를 작성한 모임입니다.');
    return db.Review.create({
      apply_id: apply.apply_id, content, rating, reviewed_at: new Date(),
      created_user_id: userId, updated_user_id: userId
    }, { transaction });
  });
}

async function list({ meetupId, userId, paging }) {
  const meetup = await access.meetup(meetupId);
  if (meetup.leader_id !== userId) await access.crew(meetupId, userId);
  return pageDocument(await db.Review.findAndCountAll({
    attributes: ['review_id', 'apply_id', 'content', 'rating', 'reviewed_at'],
    include: [{ model: db.Apply, as: 'apply', required: true,
      where: { meetup_id: meetupId }, attributes: ['user_id'],
      include: [{ model: db.User, attributes: ['name'] }] }],
    order: [['reviewed_at', 'DESC'], ['review_id', 'DESC']],
    limit: paging.limit, offset: paging.offset
  }), paging);
}

module.exports = { create, list };
