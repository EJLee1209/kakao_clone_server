const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // 업로드할 디렉토리 지정
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname); // 업로드할 파일명 지정
  },
});

const upload = multer({ storage: storage });

module.exports = (pool) => {
  // 채팅방 생성
  router.post('/chat/room/create', async (req, res) => {
    try {
      let sql = 'INSERT INTO ChatRooms () VALUES();';
      let result = await pool.query(sql, []);

      sql = 'SELECT LAST_INSERT_ID() as id';
      result = await pool.query(sql);
      res.send(result[0]);
    } catch (error) {
      console.error('Create chat room Error: ', error);
    }
  });
  // 채팅방 퇴장
  router.post('/chat/room/exit', async (req, res) => {
    const body = req.body;
    const userId = body.userId;
    const chatRoomId = body.chatRoomId;

    try {
      const sql =
        'DELETE FROM UserChatRoom WHERE userId = ? AND chatRoomId = ?';
      await pool.query(sql, [userId, chatRoomId]);

      res.send(true);
    } catch (error) {
      console.error('Exit chat room Error: ', error);
    }
  });

  // 채팅방 입장
  router.post('/chat/room/join', async (req, res) => {
    const body = req.body;
    const userId = body.userId;
    const chatRoomId = body.chatRoomId;

    try {
      const sql = 'INSERT INTO UserChatRoom (userId, chatRoomId) VALUES(?, ?);';
      await pool.query(sql, [userId, chatRoomId]);

      res.send(true);
    } catch (error) {
      console.error('Join chat room Error: ', error);
    }
  });

  // 메세지 저장
  router.post('/chat', upload.array('images', 12), async (req, res) => {
    try {
      const body = req.body;
      const chatRoomId = body.chatRoomId;
      const senderId = body.senderId;
      const message = body.message;
      const files = req.files;

      let filepaths = files ? files.map((file) => file.path) : '';
      let filepathsStr = filepaths.join(','); // 배열을 문자열로 변환
      filepathsStr = filepathsStr == '' ? null : filepathsStr;

      const sql =
        'INSERT INTO ChatMessages (chatRoomId, senderId, message, imagePath) VALUES(?, ?, ?, ?);';
      await pool.query(sql, [chatRoomId, senderId, message, filepathsStr]);
      res.send(true);
    } catch (error) {
      console.error('Save message Error: ', error);
      res.send(false);
    }
  });

  // 메세지 조회
  router.get('/chat', async (req, res) => {
    const chatRoomId = req.query.chatRoomId;
    try {
      const sql = 'SELECT * FROM ChatMessages WHERE chatRoomId = ?';
      let result = await pool.query(sql, [chatRoomId]);

      result.forEach((element) => {
        let imagePath = element.imagePath;
        if (imagePath) {
          let imagePathArr = imagePath.split(',');
          element.imagePath = imagePathArr;
        }
      });

      res.send(result);
    } catch (error) {
      console.error('Fetch message Error: ', error);
    }
  });

  // 채팅방에 참여 중인 사용자 정보 조회
  router.get('/chat/room/users', async (req, res) => {
    const chatRoomId = req.query.chatRoomId;
    try {
      const sql = 'CALL FindUsersInChatRoom(?);';
      let result = await pool.query(sql, [chatRoomId]);
      res.send(result[0]);
    } catch (error) {
      console.error('Fetch room users Error: ', error);
    }
  });

  // 채팅방 목록 조회
  router.get('/chat/room', async (req, res) => {
    const userId = req.query.userId;
    try {
      const sql = 'SELECT chatRoomId as id FROM UserChatRoom WHERE userId = ?';
      let result = await pool.query(sql, [userId]);

      res.send(result);
    } catch (error) {
      console.error('Fetch rooms Error: ', error);
    }
  });

  // 특정 사용자와의 1대1 채팅방 조회
  router.get('/chat/room/one', async (req, res) => {
    const query = req.query;
    const userId1 = query.userId1;
    const userId2 = query.userId2;

    try {
      const sql = 'CALL FindOneOnOneChatRoom(?, ?);';
      let result = await pool.query(sql, [userId1, userId2]);
      res.send(result[0]);
    } catch (error) {
      console.error('Fetch one on one room Error: ', error);
    }
  });

  return router;
};
