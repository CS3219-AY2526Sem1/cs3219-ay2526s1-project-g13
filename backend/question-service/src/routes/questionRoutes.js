const express = require('express')
const router = express.Router()
const { fetchAllQuestions, pickQuestion, seedQuestions } = require('../controllers/questionController')

router.route('/').get(fetchAllQuestions)
router.route('/pick').get(pickQuestion)
router.route('/seed').post(seedQuestions)

module.exports = router