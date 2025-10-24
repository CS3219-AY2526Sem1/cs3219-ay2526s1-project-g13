const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
    submit_status: { type: String, required: true, default: 'pending', enum: ['pending', 'processing', 'done', 'failed']},
    language: { type: String, required: true},
    source_code: { type: String, required: true},
    result: { type: Object},
    processing_start_at: { type: Date, default: null},
})

module.exports = mongoose.model('Submission', submissionSchema)
