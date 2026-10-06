const service = require('./logbook.service');
const { endpoint, id, content, pagination } = require('../member/member.http');
const params = (req) => ({
  userId: req.user_id, meetupId: id(req.params.meetup_id, 'meetup_id'),
  sessionId: id(req.params.session_id, 'session_id')
});
exports.save = endpoint((req) => service.save({ ...params(req), content: content(req.body) }));
exports.mine = endpoint((req) => service.mine(params(req)));
exports.remove = endpoint((req) => service.remove(params(req)));
exports.list = endpoint((req) => service.list({ ...params(req), paging: pagination(req.query) }));
