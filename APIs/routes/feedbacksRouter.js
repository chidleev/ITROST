const router = require('express')();
const handler = require('../handlers/feedbacksHandler');
const multer = require('../../multerConfigs');


router.get('/', handler.findAllRootFeedbacks);

router.get('/:uuid', handler.findFeedbacksChainByRoot);

router.post('/', multer.feedbackPhotoUploader, multer.errorHandler, handler.createFeedback);

module.exports = router;