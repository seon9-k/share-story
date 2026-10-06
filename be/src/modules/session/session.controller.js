const meetupService = require('../meetup/meetup.service');

async function sendZoomMail(req, res) {
  try {
    const document = await meetupService.sendZoomMailBatch();
    return res.status(200).json({ success: true, message: 'Zoom 메일 발송 처리를 완료했습니다.', document });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Zoom 메일 발송 처리에 실패하였습니다.' });
  }
}

async function closeSessions(req, res) {
  try {
    const document = await meetupService.closePastSessions();
    return res.status(200).json({ success: true, message: '회차 완료 배치 처리를 완료했습니다.', document });
  } catch (error) {
    return res.status(500).json({ success: false, message: '회차 완료 배치 처리에 실패하였습니다.' });
  }
}

async function sendLogbookMail(req, res) {
  try {
    const document = await meetupService.sendLogbookMailBatch();
    return res.status(200).json({ success: true, message: '로그북 제출 안내 메일 발송 처리를 완료했습니다.', document });
  } catch (error) {
    return res.status(500).json({ success: false, message: '로그북 제출 안내 메일 발송 처리에 실패하였습니다.' });
  }
}

module.exports = { sendZoomMail, closeSessions, sendLogbookMail };