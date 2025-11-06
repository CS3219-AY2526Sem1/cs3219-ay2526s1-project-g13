const { Question, Solution } = require('../models/questionModel')
const seedSolutions = require('../data/seed-solutions.json')

const mongoose = require('mongoose')

exports.createSolution = async (req, res) => {
  try {
    const questionId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(questionId)) return res.status(400).json({ error: 'Invalid question id' })

    const q = await Question.findById(questionId)
    if (!q) return res.status(404).json({ error: 'Question not found' })

    const payload = req.body
      const s = new Solution({
      questionId: q._id,
      title: payload.title || `${q.title} - solution`,
      difficulty: payload.difficulty || q.difficulty,
      topic: payload.topic || q.topic,
      language: payload.language,
      code: payload.code || '',
      explanation: payload.explanation || '',
      timeComplexity: payload.timeComplexity || null,
      spaceComplexity: payload.spaceComplexity || null,
      mediaLink: payload.mediaLink || null,
        status: 'Active'
    })
    await s.save()
    return res.status(201).json(s)
  } catch (err) {
    console.error('createSolution error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

exports.getSolutionsForQuestion = async (req, res) => {
  try {
    const questionId = req.params.id
    if (!mongoose.Types.ObjectId.isValid(questionId)) return res.status(400).json({ error: 'Invalid question id' })

    const includeArchived = req.query.includeArchived === 'true'
    const filter = { questionId }
      const status = req.query.status
      if (status) {
        if (!['Active', 'Archived'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
        filter.status = status
      } else if (!includeArchived) {
        filter.status = 'Active'
      }

    const sols = await Solution.find(filter).sort({ _id: -1 })
    return res.status(200).json(sols)
  } catch (err) {
    console.error('getSolutionsForQuestion error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

exports.getSolutionById = async (req, res) => {
  try {
    const id = req.params.solutionId
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid solution id' })
    const sol = await Solution.findById(id)
      if (!sol) return res.status(404).json({ error: 'Solution not found' })
      if (sol.status === 'Archived' && req.query.includeArchived !== 'true') return res.status(404).json({ error: 'Solution not found' })
    return res.status(200).json(sol)
  } catch (err) {
    console.error('getSolutionById error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

exports.updateSolution = async (req, res) => {
  try {
    const id = req.params.solutionId
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid solution id' })
    const updates = { ...req.body }
      if (updates.status && !['Active', 'Archived'].includes(updates.status)) return res.status(400).json({ error: 'Invalid status' })
    const sol = await Solution.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    if (!sol) return res.status(404).json({ error: 'Solution not found' })
    return res.status(200).json(sol)
  } catch (err) {
    console.error('updateSolution error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

exports.archiveSolution = async (req, res) => {
  try {
    const id = req.params.solutionId
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid solution id' })
      const sol = await Solution.findByIdAndUpdate(id, { status: 'Archived' }, { new: true })
    if (!sol) return res.status(404).json({ error: 'Solution not found' })
    return res.status(200).json({ message: 'Solution archived', solution: sol })
  } catch (err) {
    console.error('archiveSolution error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

exports.restoreSolution = async (req, res) => {
  try {
    const id = req.params.solutionId
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid solution id' })
      const sol = await Solution.findByIdAndUpdate(id, { status: 'Active' }, { new: true })
    if (!sol) return res.status(404).json({ error: 'Solution not found' })
    return res.status(200).json({ message: 'Solution restored', solution: sol })
  } catch (err) {
    console.error('restoreSolution error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Seed solutions from data/seed-solutions.json (maps by questionTitle)
exports.seedSolutions = async (req, res) => {
  try {
    // delete existing solutions
    await Solution.deleteMany({})
    const created = []
    for (const s of seedSolutions) {
      const q = await Question.findOne({ title: s.questionTitle })
      if (!q) continue
      const sol = new Solution({
        questionId: q._id,
        title: s.title || `${q.title} - solution`,
        difficulty: s.difficulty || q.difficulty,
        topic: s.topic || q.topic,
        language: s.language || 'JavaScript',
        code: s.code || '',
        explanation: s.explanation || '',
        timeComplexity: s.timeComplexity || null,
        spaceComplexity: s.spaceComplexity || null,
        mediaLink: s.mediaLink || null,
          status: 'Active'
      })
      await sol.save()
      created.push(sol)
    }
    return res.status(200).json({ inserted: created.length })
  } catch (err) {
    console.error('seedSolutions error', err)
    return res.status(500).json({ error: 'Seeding solutions failed' })
  }
}
