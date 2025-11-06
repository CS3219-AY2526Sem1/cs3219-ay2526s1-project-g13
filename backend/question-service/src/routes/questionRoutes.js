const express = require('express')
const router = express.Router()

const ctrl = require('../controllers/questionController')

//safe handler when a controller export is missing
const safe = (fnName) => {
	const fn = ctrl[fnName]
	if (typeof fn === 'function') return fn
	return (req, res) => res.status(501).json({ error: `handler ${fnName} not implemented` })
}

router.route('/').get(safe('fetchAllQuestions')).post(safe('createQuestion'))
router.route('/active').get(safe('getAllActiveQuestions'))
router.route('/archived').get(safe('getAllArchivedQuestions'))
router.route('/pick').get(safe('pickQuestion'))
router.route('/seed').post(safe('seedQuestions'))
router.route('/topics').get(safe('getTopicList'))
router.route('/:id').get(safe('getQuestionById')).patch(safe('updateQuestion')).delete(safe('archiveQuestion'))
router.route('/:id/restore').post(safe('restoreQuestion'))

module.exports = router