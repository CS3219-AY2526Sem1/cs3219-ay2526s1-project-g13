const mongoose = require('mongoose')

const questionSchema = mongoose.Schema({
    questionID: {
        type: Number,
        required: true,
        unique: true
    },
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
        enum: [
            'Array', 'Algorithms', 'Backtracking', 'Binary search', 'Bit manipulation',
            'Dynamic programming', 'Linked list', 'Math', 'Depth-first search', 
            'Sorting', 'Stack', 'String', 'Tree','Quickselect', 
          ],
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
  link: {
    type: String,
    required: false,
  },
  mediaLink: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        if (!v) return true; 
        // accept urls/paths that end with .jpg .jpeg or .png
        return /\.(jpe?g|png)(\?|$)/i.test(v);
      },
      message: (props) => `${props.value} is not a supported media file (allowed: .jpg, .jpeg, .png)`,
    },
  }
  ,
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  }
})

const solutionSchema = mongoose.Schema({
  // numeric reference to Question.questionID
  questionID: {
    type: Number,
    required: true,
    index: true
  },
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
        enum: [
            'Array', 'Algorithms', 'Backtracking', 'Binary search', 'Bit manipulation',
            'Dynamic programming', 'Linked list', 'Math', 'Depth-first search', 
            'Sorting', 'Stack', 'String', 'Tree','Quickselect', 
          ],
        required: true
    },
    language: {
        type: String,
        enum: ['JavaScript', 'Python', 'C++', 'Java'],
        required: true
    },
    code: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    timeComplexity: {
      type: String,
      enum: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(n^3)', 'O(2^n)', 'O(n!)', 'O(m * n)']
    },
    spaceComplexity: {
      type: String,
      enum: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)', 'O(n log n)', 'O(m * n)']
  },
  mediaLink: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        if (!v) return true; 
        // accept urls/paths that end with .jpg .jpeg or .png
        return /\.(jpe?g|png)(\?|$)/i.test(v);
      },
      message: (props) => `${props.value} is not a supported media file (allowed: .jpg, .jpeg, .png)`,
    },
  }
  ,
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  }
})

// enforce one solution per language per question
solutionSchema.index({ questionID: 1, language: 1 }, { unique: true })

// Export to be used in the controller
module.exports = {
  Question: mongoose.model('Question', questionSchema),
  Solution: mongoose.model('Solution', solutionSchema)
}