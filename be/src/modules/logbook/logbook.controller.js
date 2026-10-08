const service = require('./logbook.service');
const { endpoint, id, content, pagination, fail } = require('../member/member.http');
const params = (req) => ({
  userId: req.user_id, meetupId: id(req.params.meetup_id, 'meetup_id'),
  sessionId: id(req.params.session_id, 'session_id')
});
exports.save = endpoint((req) => service.save({ ...params(req), content: content(req.body) }));
exports.mine = endpoint((req) => service.mine(params(req)));
// 내가 제출한 모든 모임의 로그북 모아보기 (모임별로 묶음)
exports.listMine = endpoint((req) => service.listMine({ userId: req.user_id }));
exports.remove = endpoint((req) => service.remove(params(req)));
exports.list = endpoint((req) => service.list({ ...params(req), paging: pagination(req.query) }));
// body.is_approved를 생략하면 승인(true), 보내면 boolean만 허용 (false로 승인 취소 가능)
const approval = (body) => {
  const value = body?.is_approved;
  if (value === undefined) return true;
  if (typeof value !== 'boolean') fail(400, 'is_approved는 true 또는 false여야 합니다.');
  return value;
};
exports.approve = endpoint((req) => service.approve({
  ...params(req), logbookId: id(req.params.logbook_id, 'logbook_id'), approved: approval(req.body)
}));
