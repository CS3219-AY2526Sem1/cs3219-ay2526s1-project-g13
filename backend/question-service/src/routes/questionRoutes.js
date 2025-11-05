const express = require('express')
const router = express.Router()
const { fetchAllQuestions, pickQuestion, seedQuestions, getQuestionById, getTopicList, createQuestion, updateQuestion, archiveQuestion } = require('../controllers/questionController')
const { createSolution, getSolutionsForQuestion } = require('../controllers/solutionController')

router.route('/').get(fetchAllQuestions).post(createQuestion)
router.route('/pick').get(pickQuestion)
router.route('/seed').post(seedQuestions)
router.route('/topics').get(getTopicList)
router.route('/:id').get(getQuestionById).patch(updateQuestion).delete(archiveQuestion)

// Solutions nested under question
router.route('/:id/solutions').post(createSolution).get(getSolutionsForQuestion)

module.exports = router