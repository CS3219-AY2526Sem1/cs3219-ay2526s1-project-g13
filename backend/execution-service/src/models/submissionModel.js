const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
    status: { type: String, required: true, default: 'pending', enum: ['pending', 'processing', 'done', 'failed']},
    language: { type: String, required: true},
    source_code: { type: String, required: true},
    test_cases: { type: Object, required: true},
    results: { type: Object},
})

module.exports = mongoose.model('Submission', submissionSchema)
