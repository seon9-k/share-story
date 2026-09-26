require('dotenv').config();

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
