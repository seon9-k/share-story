const service = require('./crew.service');
const { endpoint, id, pagination } = require('./member.http');

exports.list = endpoint((req) => service.list({
  userId: req.user_id,
  meetupId: id(req.params.meetup_id, 'meetup_id'),
  paging: pagination(req.query)
}));
