require('dotenv').config();

const db = require('../src/models');

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ensureLocalDevelopment = () => {
  const env = process.env.NODE_ENV || 'development';
  const host = db.sequelize.config.host;
  const isLocalHost = host === '127.0.0.1' || host === 'localhost' || host === '::1';

  if (env !== 'development' || !isLocalHost) {
    throw new Error('This script can run only on local development DB.');
  }
};

async function findOrCreateUser({ userId, name, email }) {
  const existing = await db.User.findByPk(userId);
  if (existing) return existing;

  return db.User.create({
    user_id: userId,
    name,
    email,
    password: null,
    monthly_reading_volume: 'BOOKS_1_2',
    age_group: '20s',
    gender: 'M',
    created_user_id: userId,
    updated_user_id: userId
  });
}

async function seed() {
  ensureLocalDevelopment();

  const leaderId = 'zoom-test-leader';
  const memberId = 'zoom-test-member';

  await db.sequelize.transaction(async (transaction) => {
    await findOrCreateUser({
      userId: leaderId,
      name: 'Zoom Test Leader',
      email: 'zoom-test-leader@example.test'
    });

    await findOrCreateUser({
      userId: memberId,
      name: 'Zoom Test Member',
      email: 'zoom-test-member@example.test'
    });

    let meetup = await db.Meetup.findOne({
      where: { title: 'ZOOM_MAIL_TEST_MEETUP', leader_id: leaderId },
      transaction
    });

    if (!meetup) {
      meetup = await db.Meetup.create(
        {
          leader_id: leaderId,
          title: 'ZOOM_MAIL_TEST_MEETUP',
          description: 'Zoom 메일 발송 기능 테스트용 모임',
          book_title: '테스트 도서',
          book_image_url: null,
          price: 0,
          min_capacity: 4,
          max_capacity: 8,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'RECRUITING',
          created_user_id: leaderId,
          updated_user_id: leaderId
        },
        { transaction }
      );
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);

    let session = await db.Session.findOne({
      where: { meetup_id: meetup.meetup_id, session_number: 1 },
      transaction
    });

    const sessionPayload = {
      topic: 'Zoom 메일 테스트 회차',
      sch_date: formatDate(targetDate),
      sch_day: '내일',
      sch_time: '20:00',
      sch_st_time: '20:00',
      sch_ed_time: '22:00',
      zoom_url: 'https://zoom.us/j/1234567890',
      zoom_password: 'TEST1234',
      status: 'SCHEDULED',
      updated_user_id: leaderId
    };

    if (!session) {
      session = await db.Session.create(
        {
          meetup_id: meetup.meetup_id,
          session_number: 1,
          ...sessionPayload,
          created_user_id: leaderId
        },
        { transaction }
      );
    } else {
      await session.update(sessionPayload, { transaction });
    }

    let apply = await db.Apply.findOne({
      where: { meetup_id: meetup.meetup_id, user_id: memberId },
      transaction
    });

    if (!apply) {
      apply = await db.Apply.create(
        {
          meetup_id: meetup.meetup_id,
          user_id: memberId,
          status: 'ING',
          created_user_id: memberId,
          updated_user_id: memberId
        },
        { transaction }
      );
    }

    let logbook = await db.Logbook.findOne({
      where: { session_id: session.session_id, apply_id: apply.apply_id },
      transaction
    });

    const logbookPayload = {
      meetup_id: meetup.meetup_id,
      content: 'Zoom 메일 배치 테스트용 로그북',
      submitted_at: new Date(),
      is_approved: true,
      updated_user_id: memberId
    };

    if (!logbook) {
      logbook = await db.Logbook.create(
        {
          session_id: session.session_id,
          apply_id: apply.apply_id,
          ...logbookPayload,
          created_user_id: memberId
        },
        { transaction }
      );
    } else {
      await logbook.update(logbookPayload, { transaction });
    }

    console.log(
      JSON.stringify(
        {
          message: 'Zoom mail candidate ready',
          meetup_id: meetup.meetup_id,
          session_id: session.session_id,
          apply_id: apply.apply_id,
          logbook_id: logbook.logbook_id
        },
        null,
        2
      )
    );
  });
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.sequelize.close();
  });
