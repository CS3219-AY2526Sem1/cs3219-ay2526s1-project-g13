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

/**
 * Kafka consumer function to get question based on matching criteria
 * This function is called when the question service receives a message from the matching service
 * @param {Object} message - Kafka message containing matching criteria
 * @param {string} message.key - Message key (optional)
 * @param {string} message.value - JSON string containing topic and difficulty
 * @param {Object} kafkaManager - Kafka manager instance for sending responses
 * @param {string} questionTopic - Topic to send the question response to
 * @returns {Object} Question object or error response
 */
const getQuestion = async (message, kafkaManager, questionTopic) => {
    try {
        if (!message.value) {
            console.error('No message value provided');
            return { error: 'No message value provided' };
        }

        const messageValue = Buffer.isBuffer(message.value) ? message.value.toString() : message.value;
        console.log('getQuestion received messageValue:', messageValue);
        let criteria;
        try {
            criteria = JSON.parse(messageValue);
        } catch (parseError) {
            console.error('Failed to parse message value:', parseError);
            console.error('Message value was:', messageValue);
            return { error: 'Invalid message format' };
        }

        const { topic, difficulty } = criteria;

        if (topic && !TOPICS.includes(topic)) {
            console.error('Invalid topic:', topic);
            return { error: 'Invalid topic' };
        }
        if (difficulty && !DIFFICULTIES.includes(difficulty)) {
            console.error('Invalid difficulty:', difficulty);
            return { error: 'Invalid difficulty' };
        }

        const pipeline = [];
        const match = {};
        if (topic) match.topic = topic;
        if (difficulty) match.difficulty = difficulty;
        if (Object.keys(match).length > 0) pipeline.push({ $match: match });
        pipeline.push({ $sample: { size: 1 } });

        const docs = await Question.aggregate(pipeline);
        if (!docs || docs.length === 0) {
            console.error('No question found for criteria:', criteria);
            return { error: 'No question found for the given criteria' };
        }

        const q = docs[0];
        
        console.log('getQuestion returning question:', q);
        const messageBody = JSON.stringify({
            questionId: q._id.toString(),
        });

        const matchId = message.key?.toString();
        const producer = kafkaManager.getProducer();
        await producer.send({
            topic: questionTopic,
            messages: [
                {
                    key: matchId,
                    value: messageBody,
                },
            ],
        });
    } catch (error) {
        console.error('getQuestion error:', error);
        return { error: 'Internal server error' };
    }
}

module.exports = {
    fetchAllQuestions,
    pickQuestion,
    getQuestionById,
    getQuestion,
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