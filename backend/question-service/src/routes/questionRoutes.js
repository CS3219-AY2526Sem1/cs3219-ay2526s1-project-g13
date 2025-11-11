const express = require('express')
const router = express.Router()

const ctrl = require('../controllers/questionController')
const solCtrl = require('../controllers/solutionController')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

//safe handler when a controller export is missing
const safe = (fnName) => {
	const fn = ctrl[fnName]
	if (typeof fn === 'function') return fn
	return (req, res) => res.status(501).json({ error: `handler ${fnName} not implemented` })
}

// safe wrapper for solution controller exports
const safeSol = (fnName) => {
    const fn = solCtrl[fnName]
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
router.route('/:id/solutions').get(safeSol('getSolutionsForQuestion')).post(safeSol('createSolution'))

// Upload image for a question (multipart/form-data, field name 'image')
router.post('/:id/image', upload.single('image'), (req, res, next) => {
	const fn = ctrl.uploadQuestionImage
	if (typeof fn === 'function') return fn(req, res, next)
	return res.status(501).json({ error: 'handler uploadQuestionImage not implemented' })
})

// Upload image for a solution
router.post('/:id/solutions/:solutionId/image', upload.single('image'), (req, res, next) => {
	const fn = solCtrl.uploadSolutionImage
	if (typeof fn === 'function') return fn(req, res, next)
	return res.status(501).json({ error: 'handler uploadSolutionImage not implemented' })
})

module.exports = router