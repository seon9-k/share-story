const { Sequelize } = require('sequelize');
// next => promise 
const errorHandler = (err, req, res, next) => {
  console.log('======error handler========');

  // Unique duplicate Error
  if (err instanceof Sequelize.UniqueConstraintError) {
    return res
      .status(409)
      .json({ message: 'Unique constraint violation: duplicate data' });

   //valid Check   
  } else if (err instanceof Sequelize.ValidationError) {
    return res
      .status(400)
      .json({ message: 'Validation error: invalid data format' });

   // ForeignKey
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    return res.status(400).json({ message: 'Foreign key constraint error' });

  // 업로드 오류: 파일 용량 초과(multer)는 413, 그 외 multer 오류는 400
  } else if (err.name === 'MulterError') {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      success: false,
      message: tooLarge ? '파일 크기는 10MB 이하여야 합니다.' : '파일 업로드 요청이 올바르지 않습니다.',
    });

  // 의도적으로 status를 지정한 4xx 오류(예: 허용되지 않는 파일 형식)는 그대로 응답
  } else if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ success: false, message: err.message });

  } else if (
    err instanceof Sequelize.ConnectionError ||
    err instanceof Sequelize.ConnectionRefusedError
  ) {
    console.error(err)
    return res.status(500).json({ message: 'Database connection error' });
  } else if (err instanceof Sequelize.TimeoutError) {
    console.error(err)
    return res.status(504).json({ message: 'Database query timeout' });
  } else {
    console.error(err)
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = errorHandler;
