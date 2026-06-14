import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/architectai';
    if (process.env.NODE_ENV === 'test') {
      uri = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/architectai_test';
    }

    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
