export const GenderType = {
  M: 'M',
  F: 'F'
};

export const Category1Type = {
  NOVEL: 'NOVEL',
  ECONOMY_BUSINESS: 'ECONOMY_BUSINESS',
  SELF_DEVELOPMENT: 'SELF_DEVELOPMENT',
  IT: 'IT',
  ESSAY: 'ESSAY',
  TRAVEL_LIFESTYLE: 'TRAVEL_LIFESTYLE',
  PARENT_CHILD: 'PARENT_CHILD',
  HUMANITIES_PHILOSOPHY: 'HUMANITIES_PHILOSOPHY',
  SOCIETY: 'SOCIETY',
  SCIENCE: 'SCIENCE',
  HISTORY: 'HISTORY',
  ETC: 'ETC'
};

export const Category2Type = { ...Category1Type }; // 동일 목록

export const ReadingType = {
  BOOKS_1_2: 'BOOKS_1_2',
  BOOKS_3_4: 'BOOKS_3_4',
  BOOKS_5_6: 'BOOKS_5_6',
  BOOKS_7_PLUS: 'BOOKS_7_PLUS'
};

export const GroupStatusType = {
  RECRUITING: 'RECRUITING',
  CLOSED: 'CLOSED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

export const SessionStatusType = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export const PaymentStatusType = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export const ApplyStatusType = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};