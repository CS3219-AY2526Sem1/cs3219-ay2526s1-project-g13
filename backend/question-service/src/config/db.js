const mongoose = require('mongoose')
const Question = require('../models/questionModel')
const seedData = require('../data/seed.json')

const connectDB = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`MongoDB Connected: ${con.connection.host}`)
        
        const questionCount = await Question.countDocuments()
        if (questionCount === 0) {
            console.log('Database is empty, seeding with sample questions...')
            await Question.insertMany(seedData)
            console.log(`Seeded ${seedData.length} questions`)
        } else {
            console.log(`Database contains ${questionCount} questions`)
        }
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

module.exports = connectDB