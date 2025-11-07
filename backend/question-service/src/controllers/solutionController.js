const { Question, Solution } = require('../models/questionModel')
const seedSolutions = require('../data/seed-solutions.json')

const mongoose = require('mongoose')

/**
 * Creates a new solution for a given question
 * Supports identifying the question either by numeric public questionID or its MongoDB _id
 * Designed for adding solutions manually or via admin UI workflows
 *
 * Behavior:
 * - Resolves the question from idParam (numeric or ObjectId)
 * - Creates a new solution inheriting defaults (difficulty/topic) from the parent question if not provided
 * - Sets solution status to Active by default
 *
 * Returns:
 * - 201 with created solution object
 * - 400 if question identifier is invalid
 * - 404 if the question does not exist
 * - 409 if a solution already exists for this language for the same question
 */
exports.createSolution = async (req, res) => {
  try {
    const idParam = req.params.id
    let q = null
    // allow numeric public questionID or ObjectId
    if (/^\d+$/.test(idParam)) {
      q = await Question.findOne({ questionID: Number(idParam) })
    } else if (mongoose.Types.ObjectId.isValid(idParam)) {
      q = await Question.findById(idParam)
    } else {
      return res.status(400).json({ error: 'Invalid question identifier' })
    }
    if (!q) return res.status(404).json({ error: 'Question not found' })

    const payload = req.body
      const s = new Solution({
      questionID: q.questionID,
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
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Solution for this language already exists for the question' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Retrieves all solutions associated with a given question
 * Allows lookup by numeric questionID or by ObjectId -> mapped to questionID
 * Can return only active solutions by default, or include archived based on query params
 *
 * Query Params:
 * req.query.status           optional explicit status filter ("Active" or "Archived")
 * req.query.includeArchived  include archived solutions if set to "true"
 *
 * Behavior:
 * - Resolves questionID based on provided identifier
 * - Applies filters for status and visibility
 *
 * Returns:
 * - 200 list of solutions sorted by newest-first
 * - 400 if the identifier is invalid or status is invalid
 * - 404 if target question does not exist
 */
exports.getSolutionsForQuestion = async (req, res) => {
  try {
    const idParam = req.params.id
    let q = null
    const filter = {}
    if (/^\d+$/.test(idParam)) {
      filter.questionID = Number(idParam)
    } else if (mongoose.Types.ObjectId.isValid(idParam)) {
      q = await Question.findById(idParam)
      if (!q) return res.status(404).json({ error: 'Question not found' })
      filter.questionID = q.questionID
    } else {
      return res.status(400).json({ error: 'Invalid question identifier' })
    }
    const includeArchived = req.query.includeArchived === 'true'
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

/**
 * Retrieves a single solution by its MongoDB ObjectID
 * Ensures archived solutions are hidden unless explicitly requested
 *
 * Query Params:
 * req.query.includeArchived  allow fetching archived solutions if set to "true"
 *
 * Returns:
 * - 200 with the solution object
 * - 400 if solutionId format is invalid
 * - 404 if solution not found or hidden due to archive state
 */
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

/**
 * Updates an existing solution (partial or full update supported)
 * Allows modifying explanation, code, metadata, or status
 *
 * Behavior:
 * - Validates solutionId
 * - Validates status if provided
 *
 * Returns:
 * - 200 with updated solution
 * - 400 if solutionId or status is invalid
 * - 404 if solution not found
 */
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

/**
 * Marks a solution as archived
 * Used to hide or retire outdated solutions while keeping record history intact
 *
 * Returns:
 * - 200 with updated solution metadata
 * - 400 if solutionId is invalid
 * - 404 if solution does not exist
 */
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

/**
 * Restores a previously archived solution back to active status
 * Useful when reintroducing an archived solution to users or editors
 *
 * Returns:
 * - 200 with restored solution
 * - 400 if solutionId is invalid
 * - 404 if solution does not exist
 */
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

/**
 * Seeds solutions from data/seed-solutions.json
 * Attempts to match solutions either by questionID or questionTitle
 * Intended for initial database setup or reset flows
 *
 * Behavior:
 * - Clears existing Solution collection
 * - Recreates solutions that map successfully to existing questions
 *
 * Returns:
 * - 200 with count of inserted solutions
 * - 500 on seeding failure
 */
exports.seedSolutions = async (req, res) => {
  try {
    // delete existing solutions
    await Solution.deleteMany({})
    const created = []
    for (const s of seedSolutions) {
      let q = null
      if (s.questionID) {
        q = await Question.findOne({ questionID: s.questionID })
      } else if (s.questionTitle) {
        q = await Question.findOne({ title: s.questionTitle })
      }
      if (!q) continue
      const sol = new Solution({
        questionID: q.questionID,
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
