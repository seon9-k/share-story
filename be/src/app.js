const express = require('express');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
// 공통 middleware
const errorHandler = require('./common/middleware/errorHandler');
// const authorization = require('./common/middleware/authorization');

// 기능별 router
const meetupRouter = require('./modules/meetup/meetup.routes');
const authRouter = require('./modules/auth/auth.routes');
const sessionRoutes = require('./modules/session/session.routes');

const app = express();

app.use(logger('dev'));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  }),
);
// 1. JSON 형태의 body 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// urlencoded 할때 { extended : false } 옵션은 권장사항.

// src/app.js 상단 또는 중간에 테스트용 헬스체크 라우트 추가
app.get('/ping', (req, res) => {
  console.log('핑 요청 들어옴!');
  res.send('pong');
});

app.use('/session', sessionRoutes);

// Meetup API
app.use('/meetup', require('./modules/member/meetup.routes'), meetupRouter);

app.use('/auth', authRouter);
// 마이페이지 및 참여자 기능
app.use('/member', require('./modules/member/member.routes'));
app.use('/logbook', require('./modules/logbook/logbook.routes'));
app.use('/review', require('./modules/review/review.routes'));
// 로그인 없이 조회하는 공개 API (홈 화면 항해일지 리뷰)
app.use('/public/reviews', require('./modules/review/review.public.routes'));
// 스케줄러(Function App) 전용 배치 API
app.use('/batch', require('./modules/batch/batch.routes'));
// Error Handler는 일반 route 등록 이후에 위치
app.use(errorHandler);

// 서버 실행은 server.js에서만 담당 (DB sync 완료 후 listen)
// 기존엔 여기서도 listen해 DB 준비 전에 요청을 받았고, server.js의 두 번째 listen은 포트 충돌로 실패했음
module.exports = app;
