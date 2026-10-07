const db = require('../../models');
const access = require('../member/member.access');
const { fail, pageDocument } = require('../member/member.http');

async function create({ meetupId, userId, content, rating }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail(400, 'rating은 1~5 사이의 정수여야 합니다.');
  return db.sequelize.transaction(async (transaction) => {
    const meetup = await access.meetup(meetupId, transaction);
    const apply = await access.crew(meetupId, userId, transaction);
    if (meetup.status !== 'COMPLETED') fail(409, '종료된 모임에만 리뷰를 남길 수 있습니다.');
    // 삭제한 리뷰도 함께 조회 (paranoid: false)
    // apply_id unique 제약이 삭제 행도 포함 → 삭제 후 재작성은 복구 후 덮어씀
    const existing = await db.Review.findOne({
      where: { apply_id: apply.apply_id }, transaction, paranoid: false
    });
    if (existing && !existing.deleted_at) fail(409, '이미 리뷰를 작성한 모임입니다.');
    if (existing) {
      await existing.restore({ transaction });
      return existing.update({
        content, rating, reviewed_at: new Date(), updated_user_id: userId, deleted_user_id: null
      }, { transaction });
    }
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

// 본인 리뷰 수정 (별점·내용). 본인 크루 신청(apply_id) 기준이라 다른 사람 리뷰는 수정 불가
async function update({ meetupId, userId, content, rating }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail(400, 'rating은 1~5 사이의 정수여야 합니다.');
  return db.sequelize.transaction(async (transaction) => {
    await access.meetup(meetupId, transaction);
    const apply = await access.crew(meetupId, userId, transaction);
    const review = await db.Review.findOne({ where: { apply_id: apply.apply_id }, transaction });
    if (!review) fail(404, '수정할 리뷰가 없습니다.');
    return review.update({ content, rating, updated_user_id: userId }, { transaction });
  });
}

// 본인 리뷰 삭제 (soft delete)
// 본인 크루 신청(apply_id) 기준으로만 조회하므로 다른 사람 리뷰는 삭제 불가
async function remove({ meetupId, userId }) {
  return db.sequelize.transaction(async (transaction) => {
    await access.meetup(meetupId, transaction);
    const apply = await access.crew(meetupId, userId, transaction);
    const review = await db.Review.findOne({ where: { apply_id: apply.apply_id }, transaction });
    if (!review) fail(404, '삭제할 리뷰가 없습니다.');
    await review.update({ deleted_user_id: userId, updated_user_id: userId }, { transaction });
    await review.destroy({ transaction });
    return { review_id: review.review_id };
  });
}

module.exports = { create, list, update, remove };
