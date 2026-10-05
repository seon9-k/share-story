const {
  validateCreateMeetup,
  validateUpdateMeetup,
  validateApplyMeetup
} = require('./meetup.validation');
const meetupService = require('./meetup.service');

/* POST /meetup/book-image 도서 이미지 업로드. 저장된 파일명을 book_image_url 후보값으로 반환한다. */
function uploadBookImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '이미지 파일이 필요합니다.' });
  }
  const url = `/files/${req.file.filename}`;
  return res.status(201).json({
    success: true,
    message: '이미지가 업로드되었습니다.',
    document: { filename: req.file.filename, url }
  });
}

const getLoginUserId = (req) => req.user?.user_id || req.user?.id || req.user_id;
const getRequestUserId = (req, bodyField = 'user_id') =>
  getLoginUserId(req) || (process.env.NODE_ENV === 'development' ? req.body?.[bodyField] : undefined);

/* POST /meetup  모임 개설 */
async function createMeetup(req, res, next) {
  try {
    const errors = validateCreateMeetup(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: '입력값을 확인해주세요.', errors });
    }
    // Allow a body-supplied leader only for local development tests.
    // 항해 개설(create)에서는 leader_id와 user_id 일치 여부를 검증하지 않는다.
    const leaderId = getRequestUserId(req, 'leader_id');
    if (!leaderId) {
      return res.status(400).json({ success: false, message: 'leader_id가 필요합니다.' });
    }
    const document = await meetupService.createMeetup({ leaderId, payload: req.body });
   
    res.status(201).json({
      success: true,
      message: '모임이 개설되었습니다.',
      document
    });
  } catch (error) {
    if (!error.status) {
      if (process.env.NODE_ENV === 'development') console.error(error);
      return res.status(500).json({ success: false, message: '모임 개설에 실패하였습니다.' });
    }
    return res.status(error.status).json({ success: false, message: error.message });
  }
}

/* PATCH /meetup/:meetup_id  모임 수정 */
async function updateMeetup(req, res) {
  try {
    const errors = validateUpdateMeetup(req.params.meetup_id, req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: '입력값을 확인해주세요.', errors });
    }
    console.log('Updating meetup with meetupId:', req.params.meetup_id, 'and body:', req.body);
    const userId = getRequestUserId(req); // 로그인 개발 전에는 body.user_id로 테스트

    if (!userId) {
      return res.status(401).json({ success: false, message: '사용자 인증 정보가 부족합니다.' });
    }

    const document = await meetupService.updateMeetup({
      meetupId: Number(req.params.meetup_id),
      userId,
      payload: req.body
    });

    return res.status(200).json({ success: true, message: '모임이 수정되었습니다.', document });
  } catch (error) {
    if (!error.status) {
      return res.status(500).json({ success: false, message: '모임 수정에 실패하였습니다.' });
    }
    return res.status(error.status).json({ success: false, message: error.message });
  }
}

/* GET /meetup  모임 목록 조회 */
async function listMeetups(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const keyword = req.query.keyword;
    const status = req.query.status;

    const document = await meetupService.listMeetups({ page, limit, keyword, status });
    return res.status(200).json({ success: true, document });
  } catch (error) {
    return res.status(500).json({ success: false, message: '모임 목록 조회에 실패하였습니다.' });
  }
}

/* GET /meetup/:meetup_id  모임 상세 조회 */
async function getMeetupDetail(req, res) {
  try {
    const meetupId = Number(req.params.meetup_id);
    if (!Number.isInteger(meetupId) || meetupId <= 0) {
      return res.status(400).json({ success: false, message: 'meetup_id가 올바르지 않습니다.' });
    }

    const document = await meetupService.getMeetupDetail({ meetupId });
    return res.status(200).json({ success: true, document });
  } catch (error) {
    if (!error.status) {
      return res.status(500).json({ success: false, message: '모임 상세 조회에 실패하였습니다.' });
    }
    return res.status(error.status).json({ success: false, message: error.message });
  }
}

/* POST /meetup/:meetup_id/apply  모임 가입 신청*/
async function applyMeetup(req, res) {
  try {
    const userId = getRequestUserId(req);
    const meetupId = Number(req.params.meetup_id);

    const errors = validateApplyMeetup({ userId, meetupId, body: req.body });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: '입력값을 확인해주세요.', errors });
    }

    const document = await meetupService.applyMeetup({ meetupId, userId });
    return res.status(201).json({ success: true, message: '모임 가입 신청이 완료되었습니다.', document });
  } catch (error) {
    if (!error.status) {
      return res.status(500).json({ success: false, message: '모임 가입에 실패하였습니다.' });
    }
    return res.status(error.status).json({ success: false, message: error.message });
  }
}

module.exports = {
  createMeetup,
  updateMeetup,
  listMeetups,
  getMeetupDetail,
  applyMeetup,
  uploadBookImage
};
