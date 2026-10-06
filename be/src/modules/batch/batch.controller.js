const meetupBatchService = require('../meetup/meetup.batch.service');

async function closeRecruitment(req, res) {
  try {
    const document = await meetupBatchService.closeRecruitingMeetups();
    return res.status(200).json({ success: true, message: '모집 마감 배치 처리를 완료했습니다.', document });
  } catch (error) {
    console.error('[batch] closeRecruitment', error); // 원인 로그는 남김
    return res.status(500).json({ success: false, message: '모집 마감 배치 처리에 실패하였습니다.' });
  }
}

async function startMeetups(req, res) {
  try {
    const document = await meetupBatchService.startMeetups();
    return res.status(200).json({ success: true, message: '모임 시작 배치 처리를 완료했습니다.', document });
  } catch (error) {
    console.error('[batch] startMeetups', error);
    return res.status(500).json({ success: false, message: '모임 시작 배치 처리에 실패하였습니다.' });
  }
}

async function completeMeetups(req, res) {
  try {
    const document = await meetupBatchService.completeFinishedMeetups();
    return res.status(200).json({ success: true, message: '모임 종료 배치 처리를 완료했습니다.', document });
  } catch (error) {
    console.error('[batch] completeMeetups', error);
    return res.status(500).json({ success: false, message: '모임 종료 배치 처리에 실패하였습니다.' });
  }
}

module.exports = { closeRecruitment, startMeetups, completeMeetups };
