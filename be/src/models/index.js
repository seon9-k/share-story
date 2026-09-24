const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const Sequelize = require('sequelize');

//  NODE_ENV 환경변수 및 config 안전하게 처리
const env = process.env.NODE_ENV || 'development';
const configData = require('../config/config.json');
const config = configData[env] || configData['development'];

const User = require('./User');
const Meetup = require('./Meetup');
const Session = require('./Session');
const Apply = require('./Apply');
const Logbook = require('./Logbook');
const Review = require('./Review');

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);
const db = {};

// 1. db 객체에 모델 할당
db.User = User;
db.Meetup = Meetup;
db.Session = Session;
db.Apply = Apply;
db.Logbook = Logbook;
db.Review = Review;

// 2. 모델 초기화 (init 호출)
User.init(sequelize);
Meetup.init(sequelize);
Session.init(sequelize);
Apply.init(sequelize);
Logbook.init(sequelize);
Review.init(sequelize);

// 3. 연관관계 설정 (associate 호출)
User.associate(db);
Meetup.associate(db);
Session.associate(db);
Apply.associate(db);
Logbook.associate(db);
Review.associate(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;