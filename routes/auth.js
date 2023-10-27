const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './images'); // 업로드할 디렉토리 지정
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.png'); // 업로드할 파일명 지정
  },
});

const upload = multer({ storage: storage });

module.exports = (connection) => {
  router.get('/test', (req, res) => {
    return res.json({
      message: 'success',
    });
  });

  // 로그인
  router.post('/login', (req, res) => {
    const body = req.body;
    const id = body.id;
    const password = body.password;

    // 이름 확인
    var sql = 'SELECT * FROM Users WHERE id = ?';
    connection.query(sql, [id], (error, rows) => {
      if (error) {
        console.error('Login Error: ', error);
        console.error('Error Code: ', error.code);

        // 400 에러 전송
        return res.status(400).json({
          status: false,
          message: error.code,
          data: null,
        });
      }

      // id 없음
      if (rows.length == 0) {
        return res.json({
          status: false,
          message: '회원정보가 없습니다',
          data: null,
        });
      }

      // 비밀번호 확인
      sql = 'SELECT * FROM Users WHERE id = ? AND password = ?';
      connection.query(sql, [id, password], (error, rows) => {
        if (error) {
          console.error('Login Error: ', error);
          console.error('Error Code: ', error.code);

          // 400 에러 전송
          return res.status(400).json({
            status: false,
            message: error.code,
            data: null,
          });
        }

        if (rows.length == 0) {
          return res.json({
            status: false,
            message: '비밀번호가 틀렸습니다',
            data: null,
          });
        }

        console.log(`logged in: ${rows[0].id}`);
        return res.json({
          status: true,
          message: '',
          data: rows[0],
        });
      });
    });
  });

  // 회원가입
  router.post('/register', upload.single('image'), (req, res) => {
    try {
      const body = req.body;
      const id = body.id;
      const password = body.password;
      const name = body.name;
      const imagePath = req.file ? req.file.path : null;

      const sql =
        'INSERT INTO Users (id, password, name, profile_image_path) VALUES(?, ?, ?, ?);';
      connection.query(sql, [id, password, name, imagePath], (error, rows) => {
        if (error) {
          console.error('Register Error: ', error);
          console.error('Error Code: ', error.code);

          // 회원가입 실패했으므로 업로드한 이미지가 있으면 삭제
          if (imagePath) {
            fs.unlink(imagePath, (fsError) => {
              if (fsError) {
                console.error('Error deleting file : ', fsError);
                return;
              }
              console.log('image file deleted successfully');
            });
          }

          var errorDescription = '회원가입 실패';
          if (error.code == 'ER_DUP_ENTRY') {
            errorDescription = '동일한 아이디가 이미 존재합니다';
          }
          // 400 에러 전송
          return res.status(400).json({
            status: false,
            message: errorDescription,
            data: null,
          });
        }

        const user = {
          id: id,
          name: name,
          password: password,
          imagePath: imagePath,
        };
        console.log('new user: ' + user.id);

        // 회원가입 성공
        return res.json({
          status: true,
          message: '회원가입 성공',
          data: user,
        });
      });
    } catch (error) {
      // 이미지 업로드 중 예외 발생
      console.error('Multer Error: ', error);
      console.error('Error Code: ', error.code);
      return res.status(500).json({
        status: false,
        message: '회원가입 실패(이미지 업로드 중 문제가 발생했습니다)',
        data: null,
      });
    }
  });

  // 모든 유저 정보 조회
  router.get('/users', (req, res) => {
    const sql = 'SELECT * FROM Users';
    connection.query(sql, (error, rows) => {
      if (error) {
        console.error('Get Users Error: ', error);
        console.error('Error Code: ', error.code);
        return res.json({
          message: `에러가 발생했습니다 에러 코드: ${error.code}`,
        });
      }

      return res.send(rows);
    });
  });

  return router;
};
