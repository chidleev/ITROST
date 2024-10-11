const router = require('express')();
const validator = require('../validators');
const handler = require('../handlers/jobHardSkillsHandler');


router.get('/all', handler.findAll);

router.get('/:uuid', handler.findByPk);

router.post('/', validator.isAdmin, handler.create);

router.delete('/:uuid', validator.isAdmin, handler.destroy);

router.patch('/:uuid', validator.isAdmin, handler.update);

module.exports = router;