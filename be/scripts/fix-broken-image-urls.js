require('dotenv').config();

const { QueryTypes } = require('sequelize');
const db = require('../src/models');

/**
 * npm run fix:image-urls            → 대상만 조회 (dry-run)
 * npm run fix:image-urls -- --apply → 대상의 book_image_url을 NULL로 변경
 *
 * Blob 전환 전에 저장된 값(localhost 주소, /files/... 상대경로)은 원본 파일이 서버 디스크와 함께 사라져 복구할 수 없음.
 * http(s) 절대 URL 중 localhost가 아닌 값(Blob 공개 URL 등)은 건드리지 않음.
 */
const BROKEN_CONDITION = `
  book_image_url IS NOT NULL
  AND (
    book_image_url LIKE '/files/%'
    OR book_image_url ~* '^https?://(localhost|127\\.0\\.0\\.1)'
  )
`;

async function main() {
  const apply = process.argv.includes('--apply');
  const { host, database } = db.sequelize.config;
  console.log(`대상 DB: ${host}/${database}`);

  const rows = await db.sequelize.query(
    `SELECT meetup_id, book_image_url FROM meetup WHERE ${BROKEN_CONDITION} ORDER BY meetup_id`,
    { type: QueryTypes.SELECT }
  );
  console.log(`정리 대상: ${rows.length}건`);
  rows.forEach((r) => console.log(`  #${r.meetup_id} ${r.book_image_url}`));

  if (!apply) {
    console.log('dry-run 종료. 실제 변경은 --apply 옵션 필요');
  } else if (rows.length > 0) {
    const [, result] = await db.sequelize.query(
      `UPDATE meetup SET book_image_url = NULL WHERE ${BROKEN_CONDITION}`
    );
    console.log(`NULL 처리 완료: ${result.rowCount}건`);
  }
  await db.sequelize.close();
}

main().catch(async (err) => {
  console.error(err);
  await db.sequelize.close().catch(() => {});
  process.exit(1);
});
