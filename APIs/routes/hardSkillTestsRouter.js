const router = require('express')();
const validator = require('../validators');
const handler = require('../handlers/hardSkillTestsHandler');

//все тесты:            .../api/hardskilltests/all
//все тесты по навыку:  .../api/hardskilltests/all?skillUuid=...
router.get('/', handler.findAll);  

router.get('/:testUuid', handler.findByPk);

router.post('/', validator.isAdmin, handler.create);

router.delete('/:testUuid', validator.isAdmin, handler.destroy);

router.patch('/:testUuid', validator.isAdmin, handler.update)

module.exports = router;