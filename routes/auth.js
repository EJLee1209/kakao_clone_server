const router = require('express').Router();
const multer = require('multer');

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
          console.error('Error: ', error);
          console.error('Error code: ', error.code);
          return res.json({
            status: false,
            message: '회원가입 실패',
            data: null,
          });
        }

        const user = {
          id: id,
          name: name,
          password: password,
          imagePath: imagePath,
        };
        console.log('new user: ' + user);

        return res.json({
          status: true,
          message: '회원가입 성공',
          data: {
            id: id,
            name: name,
            password: password,
            imagePath: imagePath,
          },
        });
      });
    } catch (error) {
      console.error('Error: ', error);
      console.error('Error code: ', error.code);
      return res.json({
        status: false,
        message: '회원가입 실패',
        data: null,
      });
    }
  });

  return router;
};
