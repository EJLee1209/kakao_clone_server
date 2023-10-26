const express = require('express');
const app = express();
const mysql = require('mysql');
const dbconfig = require('./config/database');
const connection = mysql.createConnection(dbconfig);
const port = 8080;

// Routers
const authRouter = require('./routes/auth')(connection);
app.use('/', authRouter);

// /images 경로로 들어오는 GET 요청에 대해 'images' 디렉토리의 파일을 제공
app.use('/images', express.static('images'));

app.listen(port, () => {
  console.log(`server is listening at localhost:${port}`);
});
