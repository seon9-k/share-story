const db = require('../../models/index');
const { Op } = require('sequelize');
const { sendMail } = require('../../common/services/mailer.service');
const {
  isDeadlineBeforeFirstSession,
  DEADLINE_AFTER_FIRST_SESSION_MESSAGE,
} = require('./meetup.validation');

const throwHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const toMeetupDocument = ({ meetup, sessions }) => ({
  meetup: {
    meetup_id: meetup.meetup_id,
    leader_id: meetup.leader_id,
    title: meetup.title,
    description: meetup.description,
    book_title: meetup.book_title,
    book_image_url: meetup.book_image_url,
    price: meetup.price,
    min_capacity: meetup.min_capacity,
    max_capacity: meetup.max_capacity,
    deadline: meetup.deadline,
    status: meetup.status,
    created_at: meetup.created_at,
  },
  sessions: sessions.map((session) => ({
    session_id: session.session_id,
    meetup_id: session.meetup_id,
    session_number: session.session_number,
    topic: session.topic,
    sch_date: session.sch_date,
    sch_day: session.sch_day,
    sch_time: session.sch_time,
    zoom_url: session.zoom_url,
    zoom_password: session.zoom_password,
    status: session.status,
  })),
});

/* Meetup과 회차별 Session(4회)을 하나의 트랜잭션으로 생성함. */

async function createMeetup({ leaderId, payload }) {
  console.log('Checking leader with leaderId:', leaderId);
  const leader = await db.User.findByPk(leaderId);
  if (!leader) {
    console.log('Leader not found for leaderId:', leaderId);
    throwHttpError(404, '모임장을 찾을 수 없습니다.');
  }
  console.log('Creating meetup with leaderId:', leaderId, 'and payload:', payload);
  return db.sequelize.transaction(async (t) => {
    const meetup = await db.Meetup.create(
      {
        leader_id: leaderId,
        title: payload.title,
        description: payload.description,
        book_title: payload.book_title,
        book_image_url: payload.book_image_url ?? null,
        price: payload.price,
        min_capacity: payload.min_capacity,
        max_capacity: payload.max_capacity,
        deadline: payload.deadline,
        status: 'RECRUITING',
        created_user_id: leaderId,
        updated_user_id: leaderId,
      },
      { transaction: t },
    );

    const sessionKeySet = new Set();
    for (const session of payload.sessions) {
      const key = `${session.session_number}:${session.topic.trim().toLowerCase()}`;
      if (sessionKeySet.has(key)) {
        throwHttpError(400, 'session_number, topic, meetup_id 조합이 중복되었습니다.');
      }
      sessionKeySet.add(key);
    }

    const sessions = await db.Session.bulkCreate(
      payload.sessions.map((session) => ({
        meetup_id: meetup.meetup_id,
        session_number: session.session_number,
        topic: session.topic,
        sch_date: session.sch_date,
        sch_day: session.sch_day,
        sch_time: session.sch_time,
        sch_st_time: session.sch_st_time,
        sch_ed_time: session.sch_ed_time,
        zoom_url: session.zoom_url ?? null,
        zoom_password: session.zoom_password ?? null,
        status: 'SCHEDULED',
        created_user_id: leaderId,
        updated_user_id: leaderId,
      })),
      { transaction: t },
    );

    return toMeetupDocument({ meetup, sessions });
  });
}

async function updateMeetup({ meetupId, userId, payload }) {
  console.log(
    'Updating meetup with meetupId:',
    meetupId,
    'userId:',
    userId,
    'and payload:',
    payload,
  ); //input log
  const meetup = await db.Meetup.findByPk(meetupId);
  if (!meetup) {
    throwHttpError(404, '모임을 찾을 수 없습니다.');
  }
  // leader_id(개설자) vs user_id(요청자) 비교는 수정 권한 검증 시에만 수행함. (개설 시에는 검증하지 않음)
  if (meetup.leader_id !== userId) {
    throwHttpError(403, '모임 수정 권한이 없습니다.');
  }

  return db.sequelize.transaction(async (t) => {
    const meetupPatch = payload.meetup || payload;
    const meetupUpdates = {};
    [
      'title',
      'description',
      'book_title',
      'book_image_url',
      'price',
      'min_capacity',
      'max_capacity',
      'deadline',
    ].forEach((field) => {
      if (meetupPatch[field] !== undefined) {
        meetupUpdates[field] = meetupPatch[field];
      }
    });
    if (Object.keys(meetupUpdates).length > 0) {
      meetupUpdates.updated_user_id = userId;
      await meetup.update(meetupUpdates, { transaction: t });
    }

    if (Array.isArray(payload.sessions) && payload.sessions.length > 0) {
      for (const sessionPatch of payload.sessions) {
        const session = await db.Session.findByPk(sessionPatch.session_id, { transaction: t });
        if (!session) {
          throwHttpError(404, `session_id ${sessionPatch.session_id}를 찾을 수 없습니다.`);
        }
        if (Number(session.meetup_id) !== meetupId) {
          throwHttpError(
            400,
            `session_id ${sessionPatch.session_id}는 meetup_id ${meetupId} 소속이 아닙니다.`,
          );
        }

        const updates = {};
        [
          'session_number',
          'topic',
          'sch_date',
          'sch_day',
          'sch_time',
          'zoom_url',
          'zoom_password',
        ].forEach((field) => {
          if (sessionPatch[field] !== undefined) {
            updates[field] = sessionPatch[field];
          }
        });
        if (updates.sch_time !== undefined) {
          updates.sch_st_time = updates.sch_time;
          updates.sch_ed_time = updates.sch_time;
        }
        updates.updated_user_id = userId;
        await session.update(updates, { transaction: t });
      }
    }

    const refreshedMeetup = await db.Meetup.findByPk(meetupId, { transaction: t });
    const refreshedSessions = await db.Session.findAll({
      where: { meetup_id: meetupId },
      order: [['session_number', 'ASC']],
      transaction: t,
    });
    // 마감일·회차 일정을 바꾼 경우에만 수정 결과 기준으로 선후관계를 검사함 (기존 모임의 제목 수정 등은 막지 않음)
    // 위반하면 던진 에러로 트랜잭션이 롤백되어 변경이 반영되지 않음
    const changedSchedule =
      meetupUpdates.deadline !== undefined ||
      (payload.sessions || []).some((s) => s.sch_date !== undefined || s.sch_time !== undefined);
    if (
      changedSchedule &&
      !isDeadlineBeforeFirstSession(refreshedMeetup.deadline, refreshedSessions)
    ) {
      throwHttpError(400, DEADLINE_AFTER_FIRST_SESSION_MESSAGE);
    }
    return toMeetupDocument({ meetup: refreshedMeetup, sessions: refreshedSessions });
  });
}

async function listMeetups({ page = 1, limit = 10, keyword, status }) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10;
  const where = {};

  if (keyword && keyword.trim().length > 0) {
    where.title = { [Op.iLike]: `%${keyword.trim()}%` };
  }
  if (status && status.trim().length > 0) {
    where.status = status.trim();
  }

  const { rows, count } = await db.Meetup.findAndCountAll({
    where,
    attributes: [
      'meetup_id',
      'title',
      'book_title',
      'book_image_url',
      'description',
      'min_capacity',
      'max_capacity',
      'deadline',
      'status',
      'created_at',
    ],
    include: [
      { model: db.User, attributes: ['name'] },
      // 목록에는 회차 경계 계산용 세션 정보를 포함함.
      {
        model: db.Session,
        required: false,
        where: { status: { [Op.ne]: 'CANCELLED' } },
        attributes: ['session_number', 'sch_date', 'sch_day', 'sch_time'],
      },
    ],
    order: [['created_at', 'DESC']],
    offset: (safePage - 1) * safeLimit,
    limit: safeLimit,
    distinct: true,
  });

  const items = rows.map((meetup) => {
    const orderedSessions = (meetup.Sessions || [])
      .slice()
      .sort((left, right) => Number(left.session_number) - Number(right.session_number));
    const startSession = orderedSessions[0] || null;
    const endSession = orderedSessions[orderedSessions.length - 1] || null;
    return {
      meetup_id: meetup.meetup_id,
      title: meetup.title,
      book_title: meetup.book_title,
      book_image_url: meetup.book_image_url,
      description: meetup.description,
      min_capacity: meetup.min_capacity,
      max_capacity: meetup.max_capacity,
      deadline: meetup.deadline,
      status: meetup.status,
      leader_name: meetup.User?.name || null,
      sch_st_date: startSession?.sch_date || null,
      sch_ed_date: endSession?.sch_date || null,
      sch_day: startSession?.sch_day || null,
      sch_time: startSession?.sch_time || null,
    };
  });

  return {
    page: safePage,
    limit: safeLimit,
    total: count,
    nextPage: safePage * safeLimit < count ? safePage + 1 : null,
    items,
  };
}

async function getMeetupDetail({ meetupId }) {
  const meetup = await db.Meetup.findByPk(meetupId, {
    include: [{ model: db.User, attributes: ['user_id', 'name'] }],
  });
  if (!meetup) {
    throwHttpError(404, '모임을 찾을 수 없습니다.');
  }

  const sessions = await db.Session.findAll({
    where: { meetup_id: meetupId },
    order: [['session_number', 'ASC']],
    attributes: [
      'session_id',
      'session_number',
      'topic',
      'sch_date',
      'sch_day',
      'sch_time',
      'sch_st_time',
      'sch_ed_time',
      'zoom_url',
      'zoom_password',
      'status',
    ],
  });

  const applies = await db.Apply.findAll({
    where: { meetup_id: meetupId },
    include: [
      {
        model: db.User,
        attributes: ['genre_1', 'genre_2', 'monthly_reading_volume', 'age_group', 'gender'],
      },
    ],
  });

  const stats = {
    genre_1: {},
    genre_2: {},
    monthly_reading_volume: {},
    age_group: {},
    gender: {},
  };

  for (const apply of applies) {
    const user = apply.User;
    if (!user) continue;
    ['genre_1', 'genre_2', 'monthly_reading_volume', 'age_group', 'gender'].forEach((field) => {
      if (user[field] === null || user[field] === undefined) return;
      stats[field][user[field]] = (stats[field][user[field]] || 0) + 1;
    });
  }

  return {
    meetup: {
      meetup_id: meetup.meetup_id,
      leader_id: meetup.leader_id,
      title: meetup.title,
      description: meetup.description,
      book_title: meetup.book_title,
      book_image_url: meetup.book_image_url,
      price: meetup.price,
      min_capacity: meetup.min_capacity,
      max_capacity: meetup.max_capacity,
      deadline: meetup.deadline,
      status: meetup.status,
      leader_name: meetup.User?.name || null,
    },
    sessions,
    apply_count: applies.length,
    apply_user_stats: stats,
  };
}

async function applyMeetup({ meetupId, userId }) {
  const meetup = await db.Meetup.findByPk(meetupId);
  if (!meetup) {
    throwHttpError(404, '모임을 찾을 수 없습니다.');
  }
  if (meetup.status !== 'RECRUITING') {
    throwHttpError(400, '현재 모집중인 모임이 아닙니다.');
  }

  const exists = await db.Apply.findOne({ where: { meetup_id: meetupId, user_id: userId } });
  if (exists) {
    throwHttpError(409, '이미 신청한 모임입니다.');
  }

  const currentCount = await db.Apply.count({ where: { meetup_id: meetupId } });
  if (currentCount + 1 > meetup.max_capacity) {
    throwHttpError(400, '모집 인원이 마감되었습니다.');
  }

  const apply = await db.Apply.create({
    meetup_id: meetupId,
    user_id: userId,
    status: 'ING',
    created_user_id: userId,
    updated_user_id: userId,
  });

  return {
    apply_id: apply.apply_id,
    meetup_id: apply.meetup_id,
    user_id: apply.user_id,
    payment_status: 'PENDING',
  };
}

// 배치는 한국 시간(KST) 기준으로 날짜를 판단함.
// Azure App Service는 UTC라 서버 로컬 시간(getDate 등)을 쓰면 00:10 KST 실행 시 날짜가 하루 어긋남
const kstDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const formatDate = (date) => kstDateFormatter.format(new Date(date)); // YYYY-MM-DD (KST)
// KST는 서머타임이 없어 24시간 단위 이동이 곧 하루 이동임
const addDays = (date, days) => new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);

// 요구사항 REQ-SES-001: 각 회차 3일 전 과제(로그북) 제출 안내 / REQ-SES-004: 모임 1일 전·당일 Zoom 안내
const LOGBOOK_MAIL_DAYS_BEFORE = 3;
const LOGBOOK_DEADLINE_DAYS_BEFORE = 2; // 독후감은 모임 2일 전까지 제출

const buildZoomMailTemplate = ({ userName, schDate, schDay, schTime, zoomUrl, zoomPassword }) => {
  const subject = `[쉐어스토리] ${schDate} 모임 Zoom 접속 안내`;
  const body = [
    `${userName || '회원'}님, 안녕하세요.`,
    '',
    '다가오는 모임 Zoom 접속 정보를 안내드립니다.',
    `- 모임 일정: ${schDate || '-'} ${schDay || ''} ${schTime || ''}`.trim(),
    `- Zoom URL: ${zoomUrl}`,
    `- Zoom 비밀번호: ${zoomPassword}`,
    '',
    '모임 시작 5분 전 미리 접속 부탁드립니다.',
    '감사합니다.',
  ].join('\n');
  return { subject, body };
};

const buildLogbookMailTemplate = ({ userName, meetupTitle, topic, schDate, schDay, schTime, deadlineDate }) => {
  const subject = `[쉐어스토리] ${schDate} 모임 로그북 제출 안내`;
  const body = [
    `${userName || '회원'}님, 안녕하세요.`,
    '',
    `${meetupTitle ? `'${meetupTitle}' ` : ''}모임이 3일 앞으로 다가왔습니다. 로그북(독후감)을 제출해 주세요.`,
    `- 모임 일정: ${schDate || '-'} ${schDay || ''} ${schTime || ''}`.trim(),
    ...(topic ? [`- 이번 회차 주제: ${topic}`] : []),
    `- 제출 기한: ${deadlineDate} (모임 2일 전)까지`,
    '',
    '제출한 로그북을 모임장이 확인하면 Zoom 접속 정보가 메일로 발송됩니다.',
    '감사합니다.',
  ].join('\n');
  return { subject, body };
};

/*
 * 후보 목록을 검증하고 메일을 발송함.
 * - required 항목이 비어 있으면 발송하지 않고 skipped로 분류
 * - 한 명의 발송 실패가 나머지 발송을 막지 않음 (failed로 분류해 결과에 남김)
 */
async function deliverMails(candidates, { required, buildMail }) {
  const skippedTargets = [];
  const sendableTargets = [];

  for (const candidate of candidates) {
    const missingFields = required.filter((field) => !candidate[field]);
    if (missingFields.length > 0) {
      skippedTargets.push({ ...candidate, skipped_reason: `missing:${missingFields.join(',')}` });
      continue;
    }
    const mail = buildMail(candidate);
    sendableTargets.push({ ...candidate, mail_subject: mail.subject, mail_body: mail.body });
  }

  const sentTargets = [];
  const failedTargets = [];

  for (const target of sendableTargets) {
    try {
      const result = await sendMail({
        to: target.user_email,
        subject: target.mail_subject,
        text: target.mail_body,
      });
      sentTargets.push({
        ...target,
        message_id: result?.messageId || null,
        accepted: result?.accepted || [],
      });
    } catch (error) {
      failedTargets.push({ ...target, failed_reason: error.message });
    }
  }

  return {
    processed_count: sentTargets.length,
    total_candidate_count: candidates.length,
    skipped_count: skippedTargets.length,
    failed_count: failedTargets.length,
    targets: sentTargets,
    skipped_targets: skippedTargets,
    failed_targets: failedTargets,
  };
}

/*
 * REQ-SES-004 Zoom 접속 정보 메일
 * - 로그북을 제출하고 모임장이 확인(is_approved)한 신청자에게만 발송
 * - 모임 1일 전과 당일(KST 오늘~내일)에 열리는 SCHEDULED 회차가 대상
 *   → 매일 실행하면 회차당 1일 전·당일 두 번 발송됨 (기존엔 +2일까지 조회해 세 번 발송됐음)
 */
async function sendZoomMailBatch({ now = new Date() } = {}) {
  const today = formatDate(now);
  const dayAfterTomorrow = formatDate(addDays(now, 2));

  const rows = await db.Logbook.findAll({
    where: {
      submitted_at: { [Op.ne]: null },
      is_approved: true,
    },
    include: [
      {
        model: db.Session,
        where: {
          status: 'SCHEDULED',
          // [오늘, 모레) = 오늘·내일. 날짜 뒤에 시간이 붙은 값도 포함되도록 상한은 미만(<)으로 비교
          sch_date: { [Op.gte]: today, [Op.lt]: dayAfterTomorrow },
        },
        attributes: [
          'session_id',
          'sch_date',
          'sch_day',
          'sch_time',
          'zoom_url',
          'zoom_password',
          'meetup_id',
        ],
      },
      {
        model: db.Apply,
        attributes: ['apply_id', 'meetup_id', 'user_id'],
        include: [{ model: db.User, attributes: ['name', 'email'] }],
      },
    ],
  });

  const candidates = rows.map((logbook) => ({
    user_name: logbook.Apply?.User?.name || null,
    user_email: logbook.Apply?.User?.email || null,
    zoom_url: logbook.Session?.zoom_url || null,
    zoom_password: logbook.Session?.zoom_password || null,
    sch_date: logbook.Session?.sch_date || null,
    sch_day: logbook.Session?.sch_day || null,
    sch_time: logbook.Session?.sch_time || null,
  }));

  return deliverMails(candidates, {
    required: ['user_email', 'zoom_url', 'zoom_password'],
    buildMail: (candidate) =>
      buildZoomMailTemplate({
        userName: candidate.user_name,
        schDate: candidate.sch_date,
        schDay: candidate.sch_day,
        schTime: candidate.sch_time,
        zoomUrl: candidate.zoom_url,
        zoomPassword: candidate.zoom_password,
      }),
  });
}

/*
 * REQ-BAT-001 회차 완료 배치: 회차 진행일 익일(KST)에 SCHEDULED → COMPLETED
 * KST 기준이라 스케줄러가 몇 시에 호출하든(UTC 서버 포함) 같은 날짜로 판단함
 */
async function closePastSessions({ now = new Date() } = {}) {
  const today = formatDate(now);
  const [affected] = await db.Session.update(
    { status: 'COMPLETED' },
    {
      where: {
        status: 'SCHEDULED',
        sch_date: { [Op.lt]: today },
      },
    },
  );

  return { completed_count: affected };
}

/*
 * REQ-SES-001 과제(로그북) 제출 안내 메일: 각 회차 3일 전, 해당 모임 신청자 전원에게 발송
 * - 3일 뒤(KST)에 열리는 SCHEDULED 회차 중 진행 확정된 모임(CLOSED·IN_PROGRESS)만 대상
 *   모집 중인 모임은 아직 확정 전이라 제외함
 */
async function sendLogbookMailBatch({ now = new Date() } = {}) {
  const targetDate = formatDate(addDays(now, LOGBOOK_MAIL_DAYS_BEFORE));
  const dayAfterTarget = formatDate(addDays(now, LOGBOOK_MAIL_DAYS_BEFORE + 1));
  const deadlineDate = formatDate(addDays(now, LOGBOOK_MAIL_DAYS_BEFORE - LOGBOOK_DEADLINE_DAYS_BEFORE));

  const sessions = await db.Session.findAll({
    where: {
      status: 'SCHEDULED',
      sch_date: { [Op.gte]: targetDate, [Op.lt]: dayAfterTarget },
    },
    include: [
      {
        model: db.Meetup,
        where: { status: { [Op.in]: ['CLOSED', 'IN_PROGRESS'] } },
        attributes: ['meetup_id', 'title'],
      },
    ],
  });

  if (sessions.length === 0) {
    return {
      processed_count: 0,
      total_candidate_count: 0,
      skipped_count: 0,
      failed_count: 0,
      targets: [],
      skipped_targets: [],
      failed_targets: [],
    };
  }

  const applies = await db.Apply.findAll({
    where: { meetup_id: { [Op.in]: sessions.map((session) => session.meetup_id) } },
    include: [{ model: db.User, attributes: ['name', 'email'] }],
  });

  const candidates = [];
  for (const session of sessions) {
    for (const apply of applies.filter((item) => String(item.meetup_id) === String(session.meetup_id))) {
      candidates.push({
        user_name: apply.User?.name || null,
        user_email: apply.User?.email || null,
        meetup_title: session.Meetup?.title || null,
        topic: session.topic || null,
        sch_date: session.sch_date,
        sch_day: session.sch_day,
        sch_time: session.sch_time,
      });
    }
  }

  return deliverMails(candidates, {
    required: ['user_email'],
    buildMail: (candidate) =>
      buildLogbookMailTemplate({
        userName: candidate.user_name,
        meetupTitle: candidate.meetup_title,
        topic: candidate.topic,
        schDate: candidate.sch_date,
        schDay: candidate.sch_day,
        schTime: candidate.sch_time,
        deadlineDate,
      }),
  });
}

module.exports = {
  createMeetup,
  updateMeetup,
  listMeetups,
  getMeetupDetail,
  applyMeetup,
  sendZoomMailBatch,
  closePastSessions,
  sendLogbookMailBatch,
};
