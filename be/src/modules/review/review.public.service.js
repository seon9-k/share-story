const db = require('../../models');

const HIGHLIGHT_LIMIT = 10;

/**
 * 이름·닉네임 가운데를 가림 (공개 API라 실명을 그대로 내보내지 않음)
 * - 1자: 그대로 / 2자: 김* / 3자 이상: 첫 글자 + * + 끝 글자 (김서연 → 김*연, 김가나다 → 김**다)
 * - 이모지 등 서로게이트 쌍이 깨지지 않도록 Array.from으로 글자 단위 처리
 */
function maskName(name) {
  const chars = Array.from(String(name ?? '').trim());
  if (chars.length === 0) return '익명';
  if (chars.length === 1) return chars[0];
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

/* 홈 화면 항해일지용 최근 리뷰. 내용이 있는 리뷰만 최신순으로 반환 */
async function listHighlights() {
  const rows = await db.Review.findAll({
    attributes: ['review_id', 'content', 'rating', 'reviewed_at'],
    include: [{
      model: db.Apply, as: 'apply', required: true, attributes: ['apply_id'],
      include: [
        { model: db.User, attributes: ['name'] },
        { model: db.Meetup, attributes: ['title'] }
      ]
    }],
    order: [['reviewed_at', 'DESC'], ['review_id', 'DESC']],
    // 빈 내용을 거르고도 HIGHLIGHT_LIMIT개가 남도록 여유 있게 조회
    limit: HIGHLIGHT_LIMIT * 2
  });
  return rows
    .filter((row) => typeof row.content === 'string' && row.content.trim() !== '')
    .slice(0, HIGHLIGHT_LIMIT)
    .map((row) => ({
      review_id: String(row.review_id),
      content: row.content.trim(),
      rating: row.rating,
      reviewer_name: maskName(row.apply?.User?.name),
      meetup_title: row.apply?.Meetup?.title ?? null
    }));
}

module.exports = { listHighlights, maskName };
