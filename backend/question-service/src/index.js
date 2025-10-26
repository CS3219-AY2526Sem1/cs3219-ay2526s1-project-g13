const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv').config()
const connectDB = require('./config/db')

connectDB()

const app = express()

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const PORT = process.env.PORT || 8080

app.listen(PORT, () => {
  console.log(`Question service is running on port ${PORT}...`)
})

app.get('/', (req, res) => {
  res.json({ message: 'Question service is up and running!' })
})

// Mount v1 routes for the question service
app.use('/v1/questions', require('./routes/questionRoutes'))

module.exports = app