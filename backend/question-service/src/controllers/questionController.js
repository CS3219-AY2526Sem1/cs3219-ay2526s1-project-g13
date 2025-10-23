const Question = require('../models/questionModel')
const seedData = require('../data/seed.json')

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const TOPICS = ['String', 'Algorithms', 'Data Structures', 'Databases', 'Bit Manipulation', 'Recursion', 'Arrays', 'Brainteaser']

const fetchAllQuestions = async (req, res) => {
    const questions = await Question.find({})
    res.status(200).json(questions)
}

const getQuestionById = async (req, res) => {
    try {
        const id = req.params.id
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid question id' })
        }

        const q = await Question.findById(id)
        if (!q) return res.status(404).json({ error: 'Question not found' })

        const resp = {
            _id: q._id,
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            topic: q.topic,
            examples: q.examples || [],
            templates: q.templates || [],
            link: q.link || null,
        }

        return res.status(200).json(resp)
    } catch (err) {
        console.error('getQuestionById error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * GET /v1/questions/pick?topic=&difficulty=
 * Selection rules:
 * - both provided: match both
 * - only topic: match topic (difficulty random)
 * - only difficulty: match difficulty (topic random)
 * - neither: any random question
 */
const pickQuestion = async (req, res) => {
    try {
        const topic = req.query.topic
        const difficulty = req.query.difficulty

        // Validate fields if provided
        if (topic && !TOPICS.includes(topic)) {
            return res.status(400).json({ error: 'Invalid topic/difficulty' })
        }
        if (difficulty && !DIFFICULTIES.includes(difficulty)) {
            return res.status(400).json({ error: 'Invalid topic/difficulty' })
        }

        const pipeline = []
        const match = {}
        if (topic) match.topic = topic
        if (difficulty) match.difficulty = difficulty
        if (Object.keys(match).length > 0) pipeline.push({ $match: match })
        pipeline.push({ $sample: { size: 1 } })

        const docs = await Question.aggregate(pipeline)
        if (!docs || docs.length === 0) {
            return res.status(404).json({ error: 'No question found for the given criteria' })
        }

        const q = docs[0]
        // ensure the response is safe to expose
        const resp = {
            _id: q._id,
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            topic: q.topic,
            examples: q.examples || [],
            templates: q.templates || [],
            link: q.link || null,
        }

        return res.status(200).json(resp)
    } catch (error) {
        console.error('pickQuestion error', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

module.exports = {
    fetchAllQuestions,
    pickQuestion,
    getQuestionById,
    seedQuestions: async (req, res) => {
        try {
            await Question.deleteMany({})
            const created = await Question.insertMany(seedData)
            return res.status(200).json({ inserted: created.length })
        } catch (err) {
            console.error('seedQuestions error', err)
            return res.status(500).json({ error: 'Seeding failed' })
        }
    },
}   