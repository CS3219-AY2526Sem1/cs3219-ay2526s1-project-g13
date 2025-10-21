const express = require('express')
const router = express.Router()
const { fetchAllQuestions, pickQuestion, seedQuestions, getQuestionById } = require('../controllers/questionController')

router.route('/').get(fetchAllQuestions)
router.route('/pick').get(pickQuestion)
router.route('/seed').post(seedQuestions)
router.route('/:id').get(getQuestionById)

module.exports = router