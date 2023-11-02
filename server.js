const express = require('express');
const app = express();
const mysql = require('mysql');
const util = require('util');
const dbconfig = require('./config/database');
const pool = mysql.createPool(dbconfig);
const port = 8080;
var ip = require('ip');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

pool.query = util.promisify(pool.query);

// Routers
const authRouter = require('./routes/auth')(pool);
const chatRouter = require('./routes/chat')(pool);
app.use('/', authRouter);
app.use('/', chatRouter);

// /images 경로로 들어오는 GET 요청에 대해 'images' 디렉토리의 파일을 제공
app.use('/images', express.static('images'));

app.listen(port, () => {
  console.log(`server is listening at http://${ip.address()}:${port}`);
});
