const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv').config()
const connectDB = require('./config/db')
const { kafkaManager } = require('./config/kafka')
const { pubsubManager } = require('./config/pubsub')

const app = express()

app.use(
  cors({
    origin: process.env.WEB_BASE_URL || "*", // Allow all origins if not set
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'question-service' })
})

const PORT = process.env.PORT || 8003
const useGcp = !!process.env.PUBSUB_PROJECT_ID;

app.listen(PORT, async () => {
  console.log(`Question service is running on port ${PORT}...`)
  

  if (process.env.MONGO_URI) {
    connectDB().catch((err) => {
      console.log("MongoDB connection error:", err);
      console.log("Server is running but MongoDB is not connected");
    });
  } else {
    console.log("MONGO_URI not set, skipping MongoDB connection");
  }
  
  // Setup subscribers
  try {
    if (useGcp) {
      await pubsubManager.setupSubscribers();
    } else {
      await kafkaManager.setupSubscribers();
    }
  } catch (error) {
    console.error("Error setting up subscribers:", error);
  }
})

app.get('/', (req, res) => {
  res.json({ message: 'Question service is up and running!' })
})

// Mount v1 routes for the question service
app.use('/v1/questions', require('./routes/questionRoutes'))
app.use('/v1/solutions', require('./routes/solutionRoutes'))

module.exports = app