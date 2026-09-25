const express = require('express');
const logger = require('morgan');
const dotenv = require('dotenv').config();
const { sequelize } = require('./models/index');

const errorRouter = require('./middleware/errorHandler');
const authorization = require('./middleware/authorization');
//const authRouter = require('../modules/Auth/auth_routes');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended : false }));
// urlencoded 할때 { extended : false } 옵션은 권장사항.

sequelize
    .sync({ force : true, alter : true, logging : false })
    .then(() => console.log(`DataBase 생성완료`))
    .catch((error) => console.log(`error : `, error));
   

//app.use('/auth', authorization, authRouter);
app.use(errorRouter);

module.exports = app;