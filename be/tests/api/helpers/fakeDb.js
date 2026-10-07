// DB 없이 API 계층을 검증하기 위한 models 대체 객체. 각 테스트에서 mockResolvedValue로 동작을 지정함
const model = () => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  bulkCreate: jest.fn(),
  update: jest.fn(),
});

const db = {
  User: model(),
  Meetup: model(),
  Session: model(),
  Apply: model(),
  Logbook: model(),
  Review: model(),
  sequelize: { transaction: jest.fn() },
  Sequelize: require('sequelize'),
};

// 트랜잭션 콜백을 즉시 실행. 각 테스트 시작 시 호출
db.reset = () => {
  Object.values(db).forEach((value) => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach((fn) => fn?.mockReset?.());
    }
  });
  db.sequelize.transaction.mockImplementation(async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } }));
};

module.exports = db;
