require('dotenv').config();

// JWT_SECRET 없으면 로그인 때 500이 나던 문제 → 기동 시점에 바로 실패하도록 검사
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Check be/.env');
  process.exit(1);
}

const app = require('./app');
const { sequelize } = require('./models');

const port = process.env.PORT || 3000;

sequelize
  .sync({ force: false, alter: false, logging: false })
  .then(() => {
    console.log('DataBase 생성완료');
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  })
  .catch((error) => {
    console.error('Server startup failed:', error);
    process.exitCode = 1;
  });
