const { CAPACITY_LIMITS, SESSION_COUNT } = require('./meetup.constants');

const MIN_CAPACITY_LIMIT = CAPACITY_LIMITS.MIN;
const MAX_CAPACITY_LIMIT = CAPACITY_LIMITS.MAX;
const REQUIRED_SESSION_FIELDS = ['topic', 'sch_date', 'sch_day', 'sch_time', 'sch_st_time', 'sch_ed_time'];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

const validateSessions = (sessions = [], { strictCount = true } = {}) => {
  const errors = [];
  const numberSet = new Set();
  const topicSet = new Set();

  if (!Array.isArray(sessions)) {
    return ['sessions는 배열이어야 합니다.'];
  }

  if (strictCount && sessions.length !== SESSION_COUNT) {
    errors.push(`회차별 주제는 정확히 ${SESSION_COUNT}개여야 합니다.`);
    return errors;
  }

  sessions.forEach((session, index) => {
    if (!session || typeof session !== 'object') {
      errors.push(`sessions[${index}]는 객체여야 합니다.`);
      return;
    }

    if (!isPositiveInt(session.session_number)) {
      errors.push(`sessions[${index}].session_number는 1 이상의 정수여야 합니다.`);
    } else {
      if (numberSet.has(session.session_number)) {
        errors.push(`sessions[${index}].session_number가 중복되었습니다.`);
      }
      numberSet.add(session.session_number);
    }

    REQUIRED_SESSION_FIELDS.forEach((field) => {
      if (!isNonEmptyString(session[field])) {
        errors.push(`sessions[${index}].${field}은 필수입니다.`);
      }
    });

    if (isNonEmptyString(session.sch_date) && !/^\d{4}-\d{2}-\d{2}/.test(session.sch_date)) {
      errors.push(`sessions[${index}].sch_date은 YYYY-MM-DD 형식이어야 합니다.`);
    }

    if (isNonEmptyString(session.topic)) {
      const key = `${session.session_number || 'x'}:${session.topic.trim().toLowerCase()}`;
      if (topicSet.has(key)) {
        errors.push(`sessions[${index}]의 topic이 중복되었습니다.`);
      }
      topicSet.add(key);
    }

    if (session.meetup_id !== undefined && !isPositiveInt(session.meetup_id)) {
      errors.push(`sessions[${index}].meetup_id는 1 이상의 정수여야 합니다.`);
    }
    if (session.session_id !== undefined && !isPositiveInt(session.session_id)) {
      errors.push(`sessions[${index}].session_id는 1 이상의 정수여야 합니다.`);
    }
  });

  return errors;
};

/* POST /Meetups 요청 바디 검증. 문제가 없으면 빈 배열을 반환한다. */
function validateCreateMeetup(body = {}) {
  const errors = [];
  const { title, description, book_title, price, min_capacity, max_capacity, deadline, sessions } = body;

  if (!isNonEmptyString(title)) {
    errors.push('title은 필수입니다.');
  } else if (title.length > 100) {
    errors.push('title은 100자 이하여야 합니다.');
  }

  if (!isNonEmptyString(description)) {
    errors.push('description은 필수입니다.');
  }

  if (!isNonEmptyString(book_title)) {
    errors.push('book_title은 필수입니다.');
  } else if (book_title.length > 150) {
    errors.push('book_title은 150자 이하여야 합니다.');
  }
  //price 값이 100.5 일경우 정수로 변환하여 검증
  const priceInt = Number(price);
  if (!Number.isInteger(priceInt) || priceInt < 0) {
    errors.push('price는 0 이상의 정수여야 합니다.');
  }

  if (!Number.isInteger(min_capacity) || !Number.isInteger(max_capacity)) {
    errors.push('min_capacity, max_capacity는 정수여야 합니다.');
  } else {
    if (min_capacity < MIN_CAPACITY_LIMIT || max_capacity > MAX_CAPACITY_LIMIT) {
      errors.push(`모집 인원은 ${MIN_CAPACITY_LIMIT}~${MAX_CAPACITY_LIMIT}명 사이여야 합니다.`);
    }
    if (min_capacity > max_capacity) {
      errors.push('min_capacity는 max_capacity보다 클 수 없습니다.');
    }
  }

  const deadlineDate = new Date(deadline);
  if (!deadline || !isValidDate(deadline)) {
    errors.push('deadline은 유효한 날짜여야 합니다.');
  } else if (deadlineDate.getTime() <= Date.now()) {
    errors.push('deadline은 현재 시각 이후여야 합니다.');
  }

  errors.push(...validateSessions(sessions, { strictCount: true }));


  return errors;
}

function validateUpdateMeetup(paramMeetupId, body = {}) {
  const errors = [];
  const meetupId = Number(paramMeetupId);
  if (!isPositiveInt(meetupId)) {
    errors.push('meetup_id가 올바르지 않습니다.');
  }

  if (body.meetup_id !== undefined && Number(body.meetup_id) !== meetupId) {
    errors.push('입력 meetup_id와 URL meetup_id가 일치하지 않습니다.');
  }

  const meetup = body.meetup || body;
  if (meetup.title !== undefined && !isNonEmptyString(meetup.title)) {
    errors.push('title은 빈 문자열일 수 없습니다.');
  }
  if (meetup.description !== undefined && !isNonEmptyString(meetup.description)) {
    errors.push('description은 빈 문자열일 수 없습니다.');
  }
  if (meetup.book_title !== undefined && !isNonEmptyString(meetup.book_title)) {
    errors.push('book_title은 빈 문자열일 수 없습니다.');
  }

  if (Array.isArray(body.sessions)) {
    errors.push(...validateSessions(body.sessions, { strictCount: false }));
    body.sessions.forEach((session, index) => {
      if (session.meetup_id !== undefined && Number(session.meetup_id) !== meetupId) {
        errors.push(`sessions[${index}].meetup_id와 URL meetup_id가 일치하지 않습니다.`);
      }
    });
  }

  return errors;
}

function validateApplyMeetup({ userId, meetupId, body = {} }) {
  const errors = [];
  if (!isNonEmptyString(userId)) {
    errors.push('로그인 사용자를 확인할 수 없습니다.');
  }
  if (!isPositiveInt(meetupId)) {
    errors.push('meetup_id가 올바르지 않습니다.');
  }
  if (body.user_id && body.user_id !== userId) {
    errors.push('요청 user_id와 로그인 사용자가 일치하지 않습니다.');
  }
  if (body.meetup_id && Number(body.meetup_id) !== meetupId) {
    errors.push('요청 meetup_id와 URL meetup_id가 일치하지 않습니다.');
  }
  return errors;
}

module.exports = { validateCreateMeetup, validateUpdateMeetup, validateApplyMeetup, SESSION_COUNT };
