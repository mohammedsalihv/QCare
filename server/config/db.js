 const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const { ensureSharedUserEmails } = require('../utils/userEmailIndex');
    await ensureSharedUserEmails(mongoose.connection.collection('users'));
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
