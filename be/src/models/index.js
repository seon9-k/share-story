const Sequelize = require('sequelize');
const config = require('../config/config.json')[process.env.NODE_ENV || 'development'];

const User = require('./User');
const Meetup = require('./Meetup');
const Session = require('./Session');
const Apply = require('./Apply');
const Logbook = require('./Logbook');
const Review = require('./Review');

const sequelize = new Sequelize(config.database, config.username, config.password, config);
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