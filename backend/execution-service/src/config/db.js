const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('ES SUCESSFULLY connected to Database');
    } catch (err) {
        console.error('ES FAILED to connect to Database', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
