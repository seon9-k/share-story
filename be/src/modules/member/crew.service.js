const db = require('../../models');
const access = require('./member.access');
const { pageDocument } = require('./member.http');

const toCrew = (apply) => ({
  apply_id: apply.apply_id,
  user_id: apply.user_id,
  name: apply.User?.name ?? null,
  status: apply.status
});

async function list({ meetupId, userId, paging }) {
  const meetup = await access.meetup(meetupId);
  access.captain(meetup, userId);
  const result = await db.Apply.findAndCountAll({
    where: { meetup_id: meetupId },
    attributes: ['apply_id', 'user_id', 'status'],
    include: [{ model: db.User, attributes: ['name'], required: false }],
    order: [['apply_id', 'ASC']],
    limit: paging.limit,
    offset: paging.offset
  });
  return pageDocument({ count: result.count, rows: result.rows.map(toCrew) }, paging);
}

module.exports = { list, toCrew };
