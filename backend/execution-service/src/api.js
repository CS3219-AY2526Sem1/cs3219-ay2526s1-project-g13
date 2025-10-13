const express = require('express')
const axios = require('axios');
const connectDB = require(`./config/db`)
const Submission = require(`./models/submissionModel`)
const app = express()
const PORT = 8000

// connect the mongodb db
connectDB()

// Middleware
app.use(express.json())

// Route
app.post('/v1/execution/submit', async (req, res) => {
  
  try {
    // take parameters
    const {questionId, language, source_code} = req.body
    console.log(questionId, language, source_code)

    // add new submission in database
    const newSubmission = await Submission.create({
        language,
        source_code
    })

    res.status(201).json({
      submit_id: newSubmission._id 
    })
  } catch (error) {
    console.error('Error during submission process:', error.message)
    res.status(500).json({
      error: 'Internal Server Error' 
    })
  }
})

app.get('/v1/execution/submit/:submit_id', async (req, res) => {
  try {
    // take parameters
    const submitId = req.params.submit_id
    const foundSubmission = await Submission.findById(submitId)

    // submission not exists in database
    if (!foundSubmission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // return the status and result of job
    res.status(200).json({
      submit_status: foundSubmission.submit_status,
      result: foundSubmission.result
    })
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        error: 'Invalid submission ID format'
      })
    }
    console.error('Error during submission process:', error.message)
    res.status(500).json({
      error: 'Internal Server Error'
    })
  }
})

// Running server
app.listen(PORT, () => {
  console.log(`Listening at ${PORT}`)
})