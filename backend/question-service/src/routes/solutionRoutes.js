const express = require('express')
const router = express.Router()
const { createSolution, getSolutionsForQuestion, getSolutionById, updateSolution, archiveSolution, restoreSolution, seedSolutions } = require('../controllers/solutionController')

router.route('/seed').post(seedSolutions)
router.route('/:solutionId').get(getSolutionById).patch(updateSolution).delete(archiveSolution)
router.route('/:solutionId/restore').post(restoreSolution)

module.exports = router
