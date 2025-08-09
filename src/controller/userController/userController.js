import pool from '../../database/connection.js';
import logger from '../../utils/logger.js';

const getAllUsers = async (req, res) => {
  try{
    await pool.connect();
    logger.info(`Database connected successfully`);
  }catch(error){
    logger.error(`Database connection failed ${error}` );
  }
};

export default getAllUsers;