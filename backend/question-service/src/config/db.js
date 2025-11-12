const mongoose = require('mongoose')
const { Question, Solution } = require('../models/questionModel')
const seedData = require('../data/seed.json')
const seedSolutions = require('../data/seed-solutions.json')

const connectDB = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB Connected: ${con.connection.host}`)
        
        const questionCount = await Question.countDocuments()
        if (questionCount === 0) {
            console.log('Database is empty, seeding with sample questions...')
            const toInsert = seedData.map(s => ({ ...s, status: 'Active' }))
            await Question.insertMany(toInsert)
            console.log(`Seeded ${seedData.length} questions`)
            // sseed solutions that map to the seeded questions.
            try {
                const solCount = await Solution.countDocuments()
                if (solCount === 0) {
                    console.log('No solutions found, seeding sample solutions...')

                    const qDocs = await Question.find({}, 'questionID title').lean()
                    const titleToQID = {}
                    qDocs.forEach(q => { if (q && q.title) titleToQID[q.title] = q.questionID })

                    const toInsert = seedSolutions.map(s => {
                        let mappedQID = s.questionID
                        if (!mappedQID && s.questionTitle) mappedQID = titleToQID[s.questionTitle]
                        if (!mappedQID) return null
                        return {
                            questionID: mappedQID,
                            title: s.title || `${s.questionTitle || mappedQID} - solution`,
                            difficulty: s.difficulty || null,
                            topic: s.topic || null,
                            language: s.language || 'JavaScript',
                            code: s.code || '',
                            explanation: s.explanation || '',
                            timeComplexity: s.timeComplexity || null,
                            spaceComplexity: s.spaceComplexity || null,
                            mediaLink: s.mediaLink || null,
                            status: s.status || 'Active'
                        }
                    }).filter(Boolean)

                    if (toInsert.length === 0) {
                        console.log('No seed solutions matched seeded questions, skipping solution auto-seed')
                    } else {
                        try {
                            const inserted = await Solution.insertMany(toInsert, { ordered: false })
                            console.log(`Seeded ${Array.isArray(inserted) ? inserted.length : (inserted && inserted.insertedCount) || 0} solutions`)
                        } catch (bulkErr) {
                            console.warn('Some errors occurred while inserting solution seeds:', bulkErr && bulkErr.message ? bulkErr.message : bulkErr)
                            const finalCount = await Solution.countDocuments()
                            console.log(`Database now contains ${finalCount} solutions`)
                        }
                    }
                } else {
                    console.log(`Database already contains ${solCount} solutions, skipping auto-seed for solutions`)
                }
            } catch (err) {
                console.error('Error while auto-seeding solutions:', err)
            }
        } else {
            console.log(`Database contains ${questionCount} questions`)
        }
    } catch (error) {
        console.log("MongoDB connection error:", error)
        throw error
    }
}

module.exports = connectDB