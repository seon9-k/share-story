const service = require('./meetup.service');
const { endpoint, id, pagination } = require('./member.http');

const listByRole = (role) => endpoint((req) => service.listMeetups({
  userId: req.user_id, role, paging: pagination(req.query)
}));

exports.listCaptainMeetups = listByRole('captain');
exports.listCrewMeetups = listByRole('crew');

exports.listMeetups = endpoint((req) => service.listMeetups({
  userId: req.user_id, role: req.query.role || 'captain', paging: pagination(req.query)
}));
exports.applyMeetup = endpoint((req) => service.applyMeetup({
  userId: req.user_id, meetupId: id(req.params.meetup_id, 'meetup_id')
}), 201);
