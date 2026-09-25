const express = require('express');
const logger = require('morgan');
require('dotenv').config();

const { sequelize } = require('./models');

// 공통 middleware
const errorHandler = require('./common/middleware/errorHandler');
// const authorization = require('./common/middleware/authorization');

// 기능별 router
const meetupRouter = require('./modules/meetups/meetup.routes');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// urlencoded 할때 { extended : false } 옵션은 권장사항.

sequelize
  .sync({ force: true, alter: true, logging: false })
  .then(() => console.log('DataBase 생성완료'))
  .catch((error) => console.log('error : ', error));

// Meetup API
app.use('/meetups', meetupRouter);

//app.use('/auth', authorization, authRouter);
// Error Handler는 일반 route 등록 이후에 위치
app.use(errorHandler);

module.exports = app;
