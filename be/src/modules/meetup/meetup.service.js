const db = require('../../models/index');
const { Op } = require('sequelize');
// const { sendMail } = require('../../common/services/mailer.service');

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

/* Meetup과 회차별 Session(4회)을 하나의 트랜잭션으로 생성한다. */

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
  // leader_id(개설자) vs user_id(요청자) 비교는 수정 권한 검증 시에만 수행한다. (개설 시에는 검증하지 않음)
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
      // 목록에는 회차 경계 계산용 세션 정보를 포함한다.
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

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
};

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

async function sendZoomMailBatch({ now = new Date() } = {}) {
  const today = formatDate(now);
  const twoDaysLater = formatDate(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000));

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
          sch_date: { [Op.between]: [today, twoDaysLater] },
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

  const sendableTargets = [];
  const skippedTargets = [];

  for (const candidate of candidates) {
    const missingFields = [];
    if (!candidate.user_email) missingFields.push('user_email');
    if (!candidate.zoom_url) missingFields.push('zoom_url');
    if (!candidate.zoom_password) missingFields.push('zoom_password');

    if (missingFields.length > 0) {
      skippedTargets.push({
        ...candidate,
        skipped_reason: `missing:${missingFields.join(',')}`,
      });
      continue;
    }

    const template = buildZoomMailTemplate({
      userName: candidate.user_name,
      schDate: candidate.sch_date,
      schDay: candidate.sch_day,
      schTime: candidate.sch_time,
      zoomUrl: candidate.zoom_url,
      zoomPassword: candidate.zoom_password,
    });

    sendableTargets.push({
      ...candidate,
      mail_subject: template.subject,
      mail_body: template.body,
    });
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
        message_id: result.messageId || null,
        accepted: result.accepted || [],
      });
    } catch (error) {
      failedTargets.push({
        ...target,
        failed_reason: error.message,
      });
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

async function sendLogbookMailBatch({ now = new Date() } = {}) {
  const today = formatDate(now);
  const targetSession = await db.Session.findOne({
    where: {
      status: 'IN_PROGRESS',
      sch_date: { [Op.gt]: today },
    },
    order: [['sch_date', 'ASC']],
  });

  if (!targetSession) {
    return { processed_count: 0, targets: [] };
  }

  const applies = await db.Apply.findAll({
    where: { meetup_id: targetSession.meetup_id },
    include: [{ model: db.User, attributes: ['name', 'email'] }],
  });

  const targets = applies.map((apply) => ({
    user_name: apply.User?.name || null,
    user_email: apply.User?.email || null,
    sch_date: targetSession.sch_date,
    sch_day: targetSession.sch_day,
    sch_time: targetSession.sch_time,
  }));

  return { processed_count: targets.length, targets };
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
