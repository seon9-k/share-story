const meetupService = require('../meetup/meetup.service');

// 메일 발송에 한 건이라도 실패하면 스케줄러(Function)가 실패로 기록하도록 500으로 응답함
// 이전엔 전부 실패해도 200이라 발송이 한 통도 안 되는 문제를 알아채지 못했음
function mailResult(res, document, { success, partialFailure }) {
  if (document.failed_count > 0) {
    return res.status(500).json({ success: false, message: partialFailure, document });
  }
  return res.status(200).json({ success: true, message: success, document });
}

async function sendZoomMail(req, res) {
  try {
    const document = await meetupService.sendZoomMailBatch();
    return mailResult(res, document, {
      success: 'Zoom 메일 발송 처리를 완료했습니다.',
      partialFailure: 'Zoom 메일 발송에 실패한 대상이 있습니다.',
    });
  } catch (error) {
    console.error('[session] sendZoomMail', error);
    return res.status(500).json({ success: false, message: 'Zoom 메일 발송 처리에 실패하였습니다.' });
  }
}

async function closeSessions(req, res) {
  try {
    const document = await meetupService.closePastSessions();
    return res.status(200).json({ success: true, message: '회차 완료 배치 처리를 완료했습니다.', document });
  } catch (error) {
    console.error('[session] closeSessions', error);
    return res.status(500).json({ success: false, message: '회차 완료 배치 처리에 실패하였습니다.' });
  }
}

async function sendLogbookMail(req, res) {
  try {
    const document = await meetupService.sendLogbookMailBatch();
    return mailResult(res, document, {
      success: '로그북 제출 안내 메일 발송 처리를 완료했습니다.',
      partialFailure: '로그북 제출 안내 메일 발송에 실패한 대상이 있습니다.',
    });
  } catch (error) {
    console.error('[session] sendLogbookMail', error);
    return res.status(500).json({ success: false, message: '로그북 제출 안내 메일 발송 처리에 실패하였습니다.' });
  }
}

module.exports = { sendZoomMail, closeSessions, sendLogbookMail };
