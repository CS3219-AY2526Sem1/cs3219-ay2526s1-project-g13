const express = require('express')
const axios = require('axios');
const connectDB = require(`./src/config/db`)
const Submission = require(`./src/models/submissionModel`)
const app = express()
const PORT = 8000

connectDB()

let qsResponseDemo = {
  "questionId": "1",
  "testCases": [
    {
      "id": 1,
      "inputSpec": "1 2",
      "expectedOutput": "3"
    },
    {
      "id": 2,
      "inputSpec": "5 5",
      "expectedOutput": "10"
    },
    {
      "id": 3,
      "inputSpec": "-1 0",
      "expectedOutput": "-1"
    }
  ]
}

// Middleware
app.use(express.json())

// Route
app.post('/v1/execution/submit', async (req, res) => {
  // take parameters
  try {
    const {questionId, language, source_code} = req.body
    console.log(questionId, language, source_code)

    // EXAMPLE, MAY CHANGE 
    /*
    const questionServiceURL = `http://localhost:8001/v1/questions/${questionId}/testcase`
    console.log(`Calling QS at ${questionServiceURL}`)

    const response = await axios.get(questionServiceURL)

    // EXAMPLE, MAY CHANGE
    const testCases = response.data.testCases 
    */

    const testCases = qsResponseDemo.testCases

    const newSubmission = await Submission.create({
        language,
        source_code,
        test_cases: testCases
    })

    res.status(201).json({submit_id: newSubmission._id})
  } catch (error) {
    console.error('Error during submission process:', error.message)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/v1/execution/submit/:submit_id', async (req, res) => {
  try {
    const submitId = req.params.submit_id
    
  } catch (error) {
    console.error('Error during submission process:', error.message)
    res.status(501).json({ error: 'Internal Server Error'})
  }
})

// Running server
app.listen(PORT, () => {
  console.log(`Listening at ${PORT}`)
})