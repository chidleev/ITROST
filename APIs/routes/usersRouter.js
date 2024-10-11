const router = require('express')();
const validator = require('../validators');
const handler = require('../handlers/usersHandler');
const multer = require('../../multerConfigs');

router.get('/info', handler.getInfo);
router.get('/info/:login', handler.getInfoByLogin);

router.post('/create', validator.isAdmin, handler.createUser);

router.post('/updatePhoto', handler.changePhotoBeforeUpload, multer.profilePhotoUploader, multer.errorHandler, handler.changePhotoAfterUpload);

router.patch('/changePassword', handler.changePassword);
router.patch('/changeJobTitle', validator.isAdmin, handler.changeUserJob);

module.exports = router;