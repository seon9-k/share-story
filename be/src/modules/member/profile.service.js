const db = require('../../models');
const { fail } = require('./member.http');

// 비밀번호 등 민감 정보는 조회하지 않고 화면에 필요한 필드만 반환
async function me({ userId }) {
  const user = await db.User.findOne({
    where: { user_id: userId },
    attributes: ['user_id', 'name', 'email', 'gender', 'age_group', 'monthly_reading_volume', 'genre_1', 'genre_2'],
  });
  if (!user) fail(404, '회원 정보를 찾을 수 없습니다.');
  return {
    user_id: user.user_id,
    name: user.name ?? null,
    email: user.email ?? null,
    gender: user.gender ?? null,
    age_group: user.age_group ?? null,
    readingAmount: user.monthly_reading_volume ?? null,
    genres: [user.genre_1, user.genre_2].filter(Boolean)
  };
}

module.exports = { me };
