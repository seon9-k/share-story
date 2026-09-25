const { Meetup } = require('../../models');

/**
 * [Service]
 * - Meetup과 관련된 비즈니스 로직을 처리합니다.
 * - 필요한 경우 Model을 통해 DB에 접근합니다.
 * - HTTP 요청/응답 객체(req, res)는 직접 다루지 않습니다.
 */
const getMeetupById = async (meetupId) => {
  const meetup = await Meetup.findByPk(meetupId);

  if (!meetup) {
    const error = new Error('존재하지 않는 모임입니다.');
    error.status = 404;
    throw error;
  }

  return meetup;
};

module.exports = {
  getMeetupById,
};
