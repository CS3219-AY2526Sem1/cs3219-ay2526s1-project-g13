const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const Question = require('./models/questionModel')

const seedFile = path.join(__dirname, 'data', 'seed.json')

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://admin:password@localhost:27017/peerprepQuestionServiceDB?authSource=admin'

async function run() {
  if (!fs.existsSync(seedFile)) {
    console.error('Seed file not found:', seedFile)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(seedFile, 'utf8'))

  try {
    console.log('Connecting to', MONGODB_URI)
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

    console.log('Clearing questions collection...')
    await Question.deleteMany({})

    console.log('Inserting seed documents...')
    const created = await Question.insertMany(data)
    console.log(`Inserted ${created.length} documents.`)

    await mongoose.disconnect()
    console.log('Done')
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed', err)
    try { await mongoose.disconnect() } catch (_) {}
    process.exit(1)
  }
}

if (require.main === module) run()

module.exports = run
