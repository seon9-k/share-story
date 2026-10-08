const db = require('../../models/index');

// 배치가 수정한 행의 updated_user_id 값 (변경 주체 추적용)
const BATCH_USER = 'SYSTEM_BATCH';

/**
 * 모집 마감 배치
 * - RECRUITING 모임 중 (1) deadline이 지났거나 (2) 신청 인원이 max_capacity 이상인 모임을 CLOSED로 변경
 * - WHERE 절의 status='RECRUITING' 조건으로 여러 번 실행해도 결과 동일 (멱등)
 */
async function closeRecruitingMeetups() {
  const sql = `
    UPDATE meetup m
       SET status          = 'CLOSED',
           updated_user_id = :batchUser,
           updated_at      = NOW()
     WHERE m.status = 'RECRUITING'
       AND m.deleted_at IS NULL
       AND (
             m.deadline <= NOW()
          OR (SELECT COUNT(*)
                FROM apply a
               WHERE a.meetup_id = m.meetup_id
                 AND a.deleted_at IS NULL) >= m.max_capacity
       )
    RETURNING m.meetup_id, m.title, m.deadline;
  `;

  // postgres + type 미지정 → [RETURNING 행 배열, 메타데이터]
  const [rows] = await db.sequelize.query(sql, { replacements: { batchUser: BATCH_USER } });
  return { closed_count: rows.length, meetups: rows };
}

/**
 * 모임 종료 배치
 * - 마지막 회차 진행일(MAX(sch_date))이 KST 기준 오늘보다 이전인 모임을 COMPLETED로 변경
 * - 매일 00:10 KST 실행 시 최종 회차 다음 날 완료 처리됨
 * - CANCELLED 회차는 마지막 회차 계산에서 제외
 * - 회차가 없으면 MAX가 NULL이라 대상에서 제외됨
 */
async function completeFinishedMeetups() {
  const sql = `
    UPDATE meetup m
       SET status          = 'COMPLETED',
           updated_user_id = :batchUser,
           updated_at      = NOW()
     WHERE m.status IN ('CLOSED', 'IN_PROGRESS')
       AND m.deleted_at IS NULL
       AND (
             SELECT MAX(LEFT(s.sch_date, 10)::date)
               FROM "session" s
              WHERE s.meetup_id = m.meetup_id
                AND s.deleted_at IS NULL
                AND s.status <> 'CANCELLED'
           ) < (NOW() AT TIME ZONE 'Asia/Seoul')::date
    RETURNING m.meetup_id, m.title;
  `;

  const [rows] = await db.sequelize.query(sql, { replacements: { batchUser: BATCH_USER } });
  return { completed_count: rows.length, meetups: rows };
}

/**
 * 모임 시작 배치
 * - RECRUITING·CLOSED 모임 중 첫 회차 진행일(MIN(sch_date))이 KST 기준 오늘 이하인 모임을 IN_PROGRESS로 변경
 *   → 시작일이 되면 모집 중(승선 대기)이든 마감이든 항해 중이 되고, 이후 신청은 막힘 (신청은 RECRUITING만 허용)
 * - RECRUITING도 대상인 이유: 모집 마감일(deadline)이 첫 회차 이후로 잡힌 모임, 같은 시각(00:10)에 도는
 *   모집 마감 배치보다 먼저 실행된 경우에도 시작일에 맞춰 상태가 바뀌어야 함
 * - 매일 00:10 KST 실행 시 첫 회차 당일 시작 처리됨
 * - 이미 끝난 모임도 IN_PROGRESS가 되지만 종료 배치가 IN_PROGRESS도 받으므로 문제없음
 */
async function startMeetups() {
  const sql = `
    UPDATE meetup m
       SET status          = 'IN_PROGRESS',
           updated_user_id = :batchUser,
           updated_at      = NOW()
     WHERE m.status IN ('RECRUITING', 'CLOSED')
       AND m.deleted_at IS NULL
       AND (
             SELECT MIN(LEFT(s.sch_date, 10)::date)
               FROM "session" s
              WHERE s.meetup_id = m.meetup_id
                AND s.deleted_at IS NULL
                AND s.status <> 'CANCELLED'
           ) <= (NOW() AT TIME ZONE 'Asia/Seoul')::date
    RETURNING m.meetup_id, m.title;
  `;

  const [rows] = await db.sequelize.query(sql, { replacements: { batchUser: BATCH_USER } });
  return { started_count: rows.length, meetups: rows };
}

module.exports = {
  closeRecruitingMeetups,
  startMeetups,
  completeFinishedMeetups,
};
