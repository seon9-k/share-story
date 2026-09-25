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

  } else if (
    err instanceof Sequelize.ConnectionError ||
    err instanceof Sequelize.ConnectionRefusedError
  ) {
    return res.status(500).json({ message: 'Database connection error' });
  } else if (err instanceof Sequelize.TimeoutError) {
    return res.status(504).json({ message: 'Database query timeout' });
  } else {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = errorHandler;
