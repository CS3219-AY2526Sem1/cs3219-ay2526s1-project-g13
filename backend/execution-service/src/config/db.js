const mongoose = require('mongoose');

const DB_USER = 'admin';
const DB_PASS = 'password';
const DB_HOST = 'mongodb'; 
const DB_PORT = '27017';
const DB_NAME = 'execution_db'; 

const MONGO_URI = `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;

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