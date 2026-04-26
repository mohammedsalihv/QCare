const mongoose = require('mongoose');
const User = require('./models/users');

const MONGO_URL = 'mongodb://localhost:27017/QCare';

const checkAndCreateUser = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB.');

    const employeeId = 'EMP001';
    const password = '123456';

    let user = await User.findOne({ employeeId });

    if (user) {
      console.log(`User ${employeeId} already exists.`);
      // Update password just in case
      user.password = password;
      await user.save();
      console.log(`Password for ${employeeId} updated to ${password}.`);
    } else {
      console.log(`User ${employeeId} not found. Creating...`);
      await User.create({
        employeeId,
        employeeName: 'Demo Admin',
        email: 'emp001@qcare.com',
        password: password,
        role: 'superadmin',
        department: 'Information Technology',
        designation: 'System Administrator',
        status: 'active'
      });
      console.log(`User ${employeeId} created successfully with password ${password}.`);
    }

    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkAndCreateUser();
