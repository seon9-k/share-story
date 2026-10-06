const service = require('./review.service');
const { endpoint, id, content, pagination } = require('../member/member.http');
const params = (req) => ({ userId: req.user_id, meetupId: id(req.params.meetup_id, 'meetup_id') });
exports.create = endpoint((req) => service.create({
  ...params(req), content: content(req.body), rating: req.body.rating
}), 201);
exports.list = endpoint((req) => service.list({ ...params(req), paging: pagination(req.query) }));
