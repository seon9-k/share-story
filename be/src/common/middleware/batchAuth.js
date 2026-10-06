const crypto = require('crypto');

/**
 * 배치 전용 인증: x-batch-key 헤더를 BATCH_API_KEY 환경변수와 비교함.
 * Function App과 App Service에 같은 키를 설정해 두고 사용함
 */
module.exports = function batchAuth(req, res, next) {
  const expected = Buffer.from(process.env.BATCH_API_KEY || '');
  const actual = Buffer.from(req.get('x-batch-key') || '');

  // 키 미설정·길이 불일치는 바로 거부 (timingSafeEqual은 바이트 길이가 같아야 함)
  if (expected.length === 0 || actual.length !== expected.length
      || !crypto.timingSafeEqual(actual, expected)) {
    return res.status(401).json({ success: false, message: '배치 인증 실패' });
  }
  next();
};
