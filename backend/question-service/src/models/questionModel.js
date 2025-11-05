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
        enum: [
            'Array', 'Algorithms', 'Backtracking', 'Breadth-first search', 'Binary search', 'Bit manipulation',
            'Brainteaser', 'Data Structures', 'Databases', 'Depth-first search', 'Divide and conquer',
            'Dynamic programming', 'Greedy', 'Hash table', 'Linked list', 'Math',
            'Matrix', 'Memoization', 'Monotonic stack', 'Recursion', 'Segment tree',
            'Sorting', 'Stack', 'String', 'Topological sort', 'Tree',
            'Trie', 'Two pointers', 'Queue', 'Quickselect', 'Union find'
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
})

const solutionSchema = mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
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
            'Array', 'Algorithms', 'Backtracking', 'Breadth-first search', 'Binary search', 'Bit manipulation',
            'Brainteaser', 'Data Structures', 'Databases', 'Depth-first search', 'Divide and conquer',
            'Dynamic programming', 'Greedy', 'Hash table', 'Linked list', 'Math',
            'Matrix', 'Memoization', 'Monotonic stack', 'Recursion', 'Segment tree',
            'Sorting', 'Stack', 'String', 'Topological sort', 'Tree',
            'Trie', 'Two pointers', 'Queue', 'Quickselect', 'Union find'
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
      enum: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'O(n^3)', 'O(2^n)', 'O(n!)']
    },
    spaceComplexity: {
      type: String,
      enum: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)', 'O(n log n)']
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
})

// Export to be used in the controller
module.exports = {
  Question: mongoose.model('Question', questionSchema),
  Solution: mongoose.model('Solution', solutionSchema)
}