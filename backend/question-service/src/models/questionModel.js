const mongoose = require('mongoose')

const questionSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    topic: {
        type: String,
        enum: ['String', 'Algorithms', 'Data Structures', 'Databases', 
            'Bit Manipulation', 'Recursion', 'Arrays', 'Brainteaser'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    examples: {
    type: [
        {
        input: {
          type: String,
          required: true,
          },
        output: {
          type: String,
          required: true,
          },
        explanation: {
          type: String,
          },
        },
      ],
    },
    templates: {
    type: [
      {
        language: {
          type: String,
          required: true,
        },
        starterCode: {
          type: String,
          required: true,
        },
      },
    ],
  },
})

// Export to be used in the controller
module.exports = mongoose.model('Question', questionSchema)