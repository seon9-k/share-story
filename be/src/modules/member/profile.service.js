const db = require('../../models');
const { fail } = require('./member.http');

// 비밀번호 등 민감 정보는 조회하지 않고 화면에 필요한 필드만 반환
async function me({ userId }) {
  const user = await db.User.findOne({
    where: { user_id: userId },
    attributes: ['user_id', 'name', 'email'],
  });
  if (!user) fail(404, '회원 정보를 찾을 수 없습니다.');
  return { user_id: user.user_id, name: user.name ?? null, email: user.email ?? null };
}

module.exports = { me };
