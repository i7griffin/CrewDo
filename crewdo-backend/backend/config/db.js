require('dotenv').config({ path: __dirname + '/../.env' });

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    console.log("DB CHECK:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("DB ERROR:", err.message);
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
});

module.exports = connectDB;