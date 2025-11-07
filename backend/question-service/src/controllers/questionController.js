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

/**
 * Fetches questions with optional filtering by status
 * Used both for normal retrieval and admin views
 *
 * Behavior:
 * - If status is provided, returns only questions with that status
 * - If includeArchived=true and no status filter, returns all questions
 * - Otherwise defaults to returning only active questions
 *
 * Query Params:
 * req.query.status           "Active" or "Archived"
 * req.query.includeArchived  allows returning archived if true
 *
 * Returns:
 * - 200 list of questions
 * - 400 if status query is invalid
 */
const fetchAllQuestions = async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true'
        const status = req.query.status
        const filter = {}
        if (status) {
            if (!['Active', 'Archived'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
            filter.status = status
        } else if (!includeArchived) {
            // default to only active questions
            filter.status = 'Active'
        }

        const questions = await Question.find(filter)
        return res.status(200).json(questions)
    } catch (err) {
        console.error('fetchAllQuestions error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * Retrieves a single question by its MongoDB ObjectID
 * Ensures archived questions remain hidden unless explicitly requested
 *
 * Behavior:
 * - Validates ObjectID format before lookup
 * - Returns 404 if archived and includeArchived is not set
 *
 * Query Params:
 * req.query.includeArchived  allow access to archived question details
 *
 * Returns:
 * - 200 with question details
 * - 400 if ID is invalid
 * - 404 if question cannot be returned
 */
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
    if (q.status === 'Archived' && !includeArchived) return res.status(404).json({ error: 'Question not found' })

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

/**
 * Creates a new question record
 * Can also attach a suggested solution during creation if provided
 *
 * Validates:
 * - title, difficulty, topic, and description are required
 *
 * Returns:
 * - 201 with newly created question
 * - 400 if required fields are missing
 */
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
            status: payload.status || 'Active'
        })

        await q.save()

        // optionally create suggested solution
        if (payload.suggestedSolution) {
            const s = new Solution({
                questionID: q.questionID,
                title: payload.suggestedSolution.title || `${q.title} - solution`,
                difficulty: payload.suggestedSolution.difficulty || q.difficulty,
                topic: payload.suggestedSolution.topic || q.topic,
                language: payload.suggestedSolution.language,
                code: payload.suggestedSolution.code,
                explanation: payload.suggestedSolution.explanation || '',
                timeComplexity: payload.suggestedSolution.timeComplexity || null,
                spaceComplexity: payload.suggestedSolution.spaceComplexity || null,
                mediaLink: payload.suggestedSolution.mediaLink || null,
                status: 'Active'
            })
            await s.save()
        }

        return res.status(201).json(q)
    } catch (err) {
        console.error('createQuestion error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * Updates an existing question with partial or full data
 * Supports updating or adding a suggested solution as part of the same request
 * If status changes, cascades the same status to associated solutions
 *
 * Returns:
 * - 200 with updated question
 * - 400 if question ID or status is invalid
 * - 404 if question not found
 */
const updateQuestion = async (req, res) => {
    try {
        const id = req.params.id
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid question id' })

    const updates = { ...req.body }
    if (updates.status && !['Active', 'Archived'].includes(updates.status)) return res.status(400).json({ error: 'Invalid status' })

    const q = await Question.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    if (!q) return res.status(404).json({ error: 'Question not found' })

    // handle suggestedSolution 
        if (req.body.suggestedSolution) {
            const sPayload = req.body.suggestedSolution
            if (sPayload._id && mongoose.Types.ObjectId.isValid(sPayload._id)) {
                await Solution.findByIdAndUpdate(sPayload._id, sPayload, { new: true, runValidators: true })
            } else {
                const s = new Solution({ questionID: q.questionID, ...sPayload, status: 'Active' })
                await s.save()
            }
        }

        // cascade status changes to solutions if status was changed
        if (updates.status === 'Archived') {
            await Solution.updateMany({ questionID: q.questionID }, { status: 'Archived' })
        } else if (updates.status === 'Active') {
            await Solution.updateMany({ questionID: q.questionID }, { status: 'Active' })
        }

        return res.status(200).json(q)
    } catch (err) {
        console.error('updateQuestion error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * Marks a question and all its associated solutions as archived
 * Used to hide outdated or temporarily unused problems
 *
 * Returns:
 * - 200 when archived successfully
 * - 404 if question not found
 */
const archiveQuestion = async (req, res) => {
    try {
        const id = req.params.id
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid question id' })

        const q = await Question.findByIdAndUpdate(id, { status: 'Archived' }, { new: true })
        if (!q) return res.status(404).json({ error: 'Question not found' })

    // archive all solutions for this question 
    await Solution.updateMany({ questionID: q.questionID }, { status: 'Archived' })

        return res.status(200).json({ message: 'Question archived', question: q })
    } catch (err) {
        console.error('archiveQuestion error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * Restores a previously archived question and its solutions to active status
 * Useful when reintroducing a question into the rotation
 *
 * Returns:
 * - 200 when restored successfully
 * - 404 if question not found
 */
const restoreQuestion = async (req, res) => {
    try {
        const id = req.params.id
        const mongoose = require('mongoose')
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid question id' })

        const q = await Question.findByIdAndUpdate(id, { status: 'Active' }, { new: true })
        if (!q) return res.status(404).json({ error: 'Question not found' })

    // restore associated solutions
    await Solution.updateMany({ questionID: q.questionID }, { status: 'Active' })

        return res.status(200).json({ message: 'Question restored', question: q })
    } catch (err) {
        console.error('restoreQuestion error', err)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * Selects and returns one random question based on optional topic and/or difficulty filters
 * Useful for serving a single practice question rather than a full list
 *
 * Behavior:
 * - If both topic and difficulty are provided, selects from matching subset
 * - If only one filter is provided, treats the other as unconstrained and picks randomly
 * - If no filters are provided, selects a fully random active question
 * - Archived questions are excluded unless includeArchived=true is explicitly passed
 *
 * Query Params:
 * req.query.topic            optional topic filter
 * req.query.difficulty       optional difficulty filter
 * req.query.includeArchived  set to "true" to allow archived questions
 *
 * Returns:
 * - 200 with one question object (safe-to-expose fields only)
 * - 400 if topic or difficulty is not in supported lists
 * - 404 if no matching question is found
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
    // exclude archived questions unless explicitly requested
    const includeArchived = req.query.includeArchived === 'true'
    if (!includeArchived) match.status = 'Active'
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
    const match = {};
    // by default exclude archived unless the message explicitly requests them
    try {
        const parsed = criteria || {}
        if (!parsed.includeArchived) match.status = 'Active'
    } catch (e) {
        match.status = 'Active'
    }
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
    getAllActiveQuestions: async (req, res) => {
        // convenience wrapper
        req.query.status = 'Active'
        return fetchAllQuestions(req, res)
    },
    getAllArchivedQuestions: async (req, res) => {
        req.query.status = 'Archived'
        return fetchAllQuestions(req, res)
    },
    pickQuestion,
    getQuestionById,
    getTopicList,
    getQuestion,
    createQuestion,
    updateQuestion,
    archiveQuestion,
    restoreQuestion,
    seedQuestions: async (req, res) => {
        try {
            await Question.deleteMany({})
            const toInsert = seedData.map(s => ({ ...s, status: 'Active' }))
            const created = await Question.insertMany(toInsert)
            return res.status(200).json({ inserted: created.length })
        } catch (err) {
            console.error('seedQuestions error', err)
            return res.status(500).json({ error: 'Seeding failed' })
        }
    },
}   