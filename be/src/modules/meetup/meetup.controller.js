const meetupService = require('./meetup.service');

/**
 * [Controller]
 * - 요청(req)에서 필요한 값을 가져옵니다.
 * - Service를 호출합니다.
 * - Service의 처리 결과를 HTTP 응답으로 반환합니다.
 * - 비즈니스 로직은 Service에서 처리합니다.
 */
const getMeetup = async (req, res, next) => {
  try {
    const { meetupId } = req.params;

    const meetup = await meetupService.getMeetupById(meetupId);

    return res.status(200).json({
      success: true,
      data: meetup,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMeetup,
};
