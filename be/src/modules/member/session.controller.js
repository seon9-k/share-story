const db = require('../../models');
const access = require('./member.access');
const { endpoint, id } = require('./member.http');

exports.listSessions = endpoint(async (req) => {
  const meetupId = id(req.params.meetup_id, 'meetup_id');
  const meetup = await access.meetup(meetupId);
  if (meetup.leader_id !== req.user_id) await access.crew(meetupId, req.user_id);
  return db.Session.findAll({
    where: { meetup_id: meetupId },
    attributes: ['session_id', 'meetup_id', 'session_number', 'topic', 'sch_date', 'sch_day',
      'sch_time', 'sch_st_time', 'sch_ed_time', 'status'],
    order: [['session_number', 'ASC']]
  });
});
