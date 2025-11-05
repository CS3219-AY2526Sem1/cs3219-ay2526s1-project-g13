const { Question, Solution } = require('../models/questionModel')
const seedData = require('../data/seed.json')

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const TOPICS = [
        'Array', 'Algorithms', 'Backtracking', 'Breadth-first search', 'Binary search', 'Bit manipulation',
        'Brainteaser', 'Data Structures', 'Databases', 'Depth-first search', 'Divide and conquer',
        'Dynamic programming', 'Greedy', 'Hash table', 'Linked list', 'Math',
        'Matrix', 'Memoization', 'Monotonic stack', 'Recursion', 'Segment tree',
        'Sorting', 'Stack', 'String', 'Topological sort', 'Tree',
        'Trie', 'Two pointers', 'Queue', 'Quickselect', 'Union find'
        ]
const fetchAllQuestions = async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true'
        const notDeletedFilter = { $or: [{ deleted: false }, { deleted: { $exists: false } }] }
        const filter = includeArchived ? {} : notDeletedFilter
        const questions = await Question.find(filter)
        return res.status(200).json(questions)
    } catch (err) {
        console.error('fetchAllQuestions error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
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
    const includeArchived = req.query.includeArchived === 'true'
    if (q.deleted && !includeArchived) return res.status(404).json({ error: 'Question not found' })

        const resp = {
            _id: q._id,
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            topic: q.topic,
            examples: q.examples || [],
            link: q.link || null,
        }

        return res.status(200).json(resp)
    } catch (err) {
        console.error('getQuestionById error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Create a new question (optionally with a suggested solution)
const createQuestion = async (req, res) => {
    try {
        const payload = req.body
        // minimal validation
        const required = ['title', 'difficulty', 'topic', 'description']
        for (const field of required) if (!payload[field]) return res.status(400).json({ error: `${field} is required` })

        const q = new Question({
            title: payload.title,
            difficulty: payload.difficulty,
            topic: payload.topic,
            description: payload.description,
            examples: payload.examples || [],
            link: payload.link || null,
            mediaLink: payload.mediaLink || null,
            deleted: false
        })

        await q.save()

        // optionally create suggested solution
        if (payload.suggestedSolution) {
            const s = new Solution({
                questionId: q._id,
                title: payload.suggestedSolution.title || `${q.title} - solution`,
                difficulty: payload.suggestedSolution.difficulty || q.difficulty,
                topic: payload.suggestedSolution.topic || q.topic,
                language: payload.suggestedSolution.language,
                code: payload.suggestedSolution.code,
                explanation: payload.suggestedSolution.explanation || '',
                timeComplexity: payload.suggestedSolution.timeComplexity || null,
                spaceComplexity: payload.suggestedSolution.spaceComplexity || null,
                mediaLink: payload.suggestedSolution.mediaLink || null,
                deleted: false
            })
            await s.save()
        }

        return res.status(201).json(q)
    } catch (err) {
        console.error('createQuestion error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Update question (partial updates accepted). If suggestedSolution present, upsert it.
const updateQuestion = async (req, res) => {
    try {
        const id = req.params.id
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid question id' })

        const updates = { ...req.body }
        // prevent updating deleted flags directly here
        delete updates.deleted
        delete updates.deletedAt
        delete updates.deletedBy

        const q = await Question.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        if (!q) return res.status(404).json({ error: 'Question not found' })

        // handle suggestedSolution upsert
        if (req.body.suggestedSolution) {
            const sPayload = req.body.suggestedSolution
            if (sPayload._id && mongoose.Types.ObjectId.isValid(sPayload._id)) {
                await Solution.findByIdAndUpdate(sPayload._id, sPayload, { new: true, runValidators: true })
            } else {
                const s = new Solution({ questionId: q._id, ...sPayload, deleted: false })
                await s.save()
            }
        }

        return res.status(200).json(q)
    } catch (err) {
        console.error('updateQuestion error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Archive (soft-delete) a question and associated solutions
const archiveQuestion = async (req, res) => {
    try {
        const id = req.params.id
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid question id' })

        const deletedBy = req.body?.deletedBy || null
        const q = await Question.findByIdAndUpdate(id, { deleted: true, deletedAt: new Date(), deletedBy }, { new: true })
        if (!q) return res.status(404).json({ error: 'Question not found' })

        // archive all solutions for this question
        await Solution.updateMany({ questionId: q._id }, { deleted: true, deletedAt: new Date(), deletedBy })

        return res.status(200).json({ message: 'Question archived', question: q })
    } catch (err) {
        console.error('archiveQuestion error', err)
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
    // exclude archived questions unless explicitly requested; treat missing `deleted` as not-deleted
    match.$or = [{ deleted: false }, { deleted: { $exists: false } }]
    if (topic) match.topic = topic
    if (difficulty) match.difficulty = difficulty
    pipeline.push({ $match: match })
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
    const match = { $or: [{ deleted: false }, { deleted: { $exists: false } }] };
    if (topic) match.topic = topic;
    if (difficulty) match.difficulty = difficulty;
    pipeline.push({ $match: match });
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

const getTopicList = async (req, res) => {
    try {
        return res.status(200).json({ topics: TOPICS })
    } catch (err) {
        console.error('getTopicList error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }

}

module.exports = {
    fetchAllQuestions,
    pickQuestion,
    getQuestionById,
    getTopicList,
    getQuestion,
    createQuestion,
    updateQuestion,
    archiveQuestion,
    seedQuestions: async (req, res) => {
        try {
            await Question.deleteMany({})
            const toInsert = seedData.map(s => ({ ...s, deleted: false }))
            const created = await Question.insertMany(toInsert)
            return res.status(200).json({ inserted: created.length })
        } catch (err) {
            console.error('seedQuestions error', err)
            return res.status(500).json({ error: 'Seeding failed' })
        }
    },
}   