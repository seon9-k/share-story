const service = require('./profile.service');
const { endpoint } = require('./member.http');

exports.me = endpoint((req) => service.me({ userId: req.user_id }));
