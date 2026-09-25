/**
 * [Validation]
 * - 요청으로 전달된 값이 올바른 형식인지 확인합니다.
 * - 잘못된 요청은 Controller에 도달하기 전에 차단합니다.
 */
const validateMeetupId = (req, res, next) => {
  const { meetupId } = req.params;

  const parsedMeetupId = Number(meetupId);

  if (!Number.isInteger(parsedMeetupId) || parsedMeetupId <= 0) {
    return res.status(400).json({
      success: false,
      message: '올바른 미트업 ID를 입력해주세요.',
    });
  }

  next();
};

module.exports = {
  validateMeetupId,
};
