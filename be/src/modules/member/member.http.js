const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

function id(value, field) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || BigInt(value) > 9223372036854775807n) {
    fail(400, `${field}가 올바르지 않습니다.`);
  }
  return value;
}

function content(body) {
  if (typeof body?.content !== 'string' || !body.content.trim()) {
    fail(400, 'content는 비어 있지 않은 문자열이어야 합니다.');
  }
  return body.content.trim();
}

function pagination(query = {}) {
  const parse = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) fail(400, '페이지 입력값이 올바르지 않습니다.');
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number > max) fail(400, '페이지 입력값이 올바르지 않습니다.');
    return number;
  };
  const page = parse(query.page, 1, 1000000);
  const limit = parse(query.limit, 10, 100);
  return { page, limit, offset: (page - 1) * limit };
}

const pageDocument = ({ count, rows }, { page, limit }) => ({
  page, limit, total: count, nextPage: page * limit < count ? page + 1 : null, items: rows
});

const endpoint = (handler, status = 200) => async (req, res, next) => {
  try {
    if (typeof req.user_id !== 'string' || !req.user_id) fail(401, '로그인이 필요합니다.');
    const document = await handler(req);
    return res.status(status).json({ success: true, document });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: '이미 등록된 데이터입니다.' });
    }
    return next(error);
  }
};

module.exports = { fail, id, content, pagination, pageDocument, endpoint };
