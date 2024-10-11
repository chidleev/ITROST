const router = require('express')();
const validator = require('../validators');
const handler = require('../handlers/hardSkillsHandler');


router.get('/', handler.findAll);

router.post('/', validator.isAdmin, handler.create);

router.delete('/:skillUuid', validator.isAdmin, handler.destroy);

router.get('/:skillUuid', handler.findByPk);

router.patch('/:skillUuid', validator.isAdmin, handler.update);

module.exports = router;