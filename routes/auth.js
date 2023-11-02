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
  router.post('/friends/delete', (req, res) => {
    const body = req.body;
    const from_id = body.from_id;
    const to_id = body.to_id;

    const sql = 'DELETE FROM Friendship WHERE from_id = ? AND to_id = ?';
    connection.query(sql, [from_id, to_id], (error, rows) => {
      if (error) {
        console.error('Add Friend Error: ', error);
        console.error('Error Code: ', error.code);
        // 400 에러 전송
        return res.status(400).send(false);
      }

      return res.send(true);
    });
  });

  router.get('/friends/list', (req, res) => {
    const id = req.query.id;

    const sql =
      'SELECT Users.* FROM Users JOIN Friendship ON Users.id = Friendship.to_id WHERE Friendship.from_id = ?';
    connection.query(sql, [id], (error, rows) => {
      if (error) {
        console.error('Add Friend Error: ', error);
        console.error('Error Code: ', error.code);
        // 400 에러 전송
        return res.status(400).json({
          status: false,
          message: error.code,
          data: null,
        });
      }
      // 친구 목록 전송
      return res.json({
        status: true,
        message: '',
        data: rows,
      });
    });
  });

  router.post('/friends/add', (req, res) => {
    const body = req.body;
    const from_id = body.from_id;
    const to_id = body.to_id;

    const sql = 'INSERT INTO Friendship (from_id, to_id) VALUES(?, ?)';
    connection.query(sql, [from_id, to_id], (error, rows) => {
      if (error) {
        // 400 에러 전송
        console.error('Add Friend Error: ', error);
        console.error('Error Code: ', error.code);
        return res.status(400).send(false);
      }

      // 친구 추가 성공
      return res.send(true);
    });
  });

  router.get('/test', (req, res) => {
    return res.json({
      message: 'success',
    });
  });

  // id로 유저 정보 가져오기
  router.get('/user', (req, res) => {
    const id = req.query.id;
    const sql = 'SELECT * FROM Users WHERE id = ?';
    connection.query(sql, [id], (error, rows) => {
      if (error) {
        // 400 에러 전송
        return res.status(400).json({
          status: false,
          message: error.code,
          data: null,
        });
      }
      if (rows.length == 0) {
        // 400 에러 전송
        return res.status(400).json({
          status: false,
          message: '회원정보가 존재하지 않습니다',
          data: null,
        });
      }
      return res.json({
        status: true,
        message: '',
        data: rows[0],
      });
    });
  });

  // 유저 프로필 업데이트
  router.put('/user/update', upload.single('image'), (req, res) => {
    try {
      const body = req.body;
      const id = body.id;
      const name = body.name;
      const originalImagePath = body.originalImagePath;
      const stateMessage = body.stateMessage;
      const imagePath = req.file ? req.file.path : originalImagePath;

      const sql =
        'UPDATE Users SET name = ?, state_message = ?, profile_image_path = ? WHERE id = ?';
      connection.query(
        sql,
        [name, stateMessage, imagePath, id],
        (error, rows) => {
          if (error) {
            console.error('Register Error: ', error);
            console.error('Error Code: ', error.code);

            // 프로필 업데이트 실패했으므로 업로드한 이미지가 있으면 삭제
            if (imagePath) {
              fs.unlink(imagePath, (fsError) => {
                if (fsError) {
                  console.error('Error deleting file : ', fsError);
                  return;
                }
                console.log('image file deleted successfully');
              });
            }

            // 400 에러 전송
            return res.status(400).json({
              status: false,
              message: error.code,
              data: null,
            });
          }

          const user = {
            id: id,
            name: name,
            password: '',
            imagePath: imagePath,
            stateMessage: stateMessage,
          };
          console.log('update user: ' + user.id);

          // 회원가입 성공
          return res.json({
            status: true,
            message: '프로필 업데이트 완료',
            data: user,
          });
        }
      );
    } catch (error) {
      // 이미지 업로드 중 예외 발생
      console.error('Multer Error: ', error);
      console.error('Error Code: ', error.code);
      return res.status(500).json({
        status: false,
        message: '프로필 업데이트 실패(이미지 업로드 중 문제가 발생했습니다)',
        data: null,
      });
    }
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
