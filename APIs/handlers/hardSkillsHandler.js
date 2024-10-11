const validator = require('validator');
const logger = require('../../logs/logger');
const controllerDB = require('../../database/index');


module.exports.findAll = function (req, res) {
    const errorsArray = [];

    // Поиск навыков
    controllerDB.HardSkills.findAll()
    .then(result => {
        res.status(200).json({
            data: result,
            errorsArray: errorsArray
        });
        return;
    })
    // Обработка ошибок
    .catch(error => {
        errorsArray.push(error.message);

        logger({
            filename: __filename,
            errorsArray: errorsArray,
            requestObject: req,
            errorObject: error,
            logsDir: res.locals.logsDir
        });
        
        res.status(500).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    });
}


module.exports.create = function (req, res) {
    const errorsArray = [];
    let newSkill;

    // Проверка входных данных
    if (validator.isEmpty(req.body.name)) {
        errorsArray.push("Не указано название навыка.");
    }
    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }
    // Создание навыка
    controllerDB.HardSkills.create({
        name: req.body.name,
        description: req.body.description
    })
    // Поиск всех должностей
    .then(result => {
        newSkill = result;
        return controllerDB.JobTitles.findAll();
    })
    // Создание ячеек должностей
    .then(allJobs => {
        const jobHardSkillsPromises = allJobs.map(job => {
            return controllerDB.JobHardSkills.create({
                skillUUID: newSkill.UUID,
                jobTitleUUID: job.UUID,
                requiredLevelUUID: null
            });
        });

        return Promise.all(jobHardSkillsPromises);
    })
    .then(() => {
        res.json({
            data: newSkill,
            errorsArray: errorsArray,
        })
        return;
    })
    // Обработка ошибок
    .catch(error => {
        errorsArray.push(error.message);
        
        logger({
            filename: __filename,
            errorsArray: errorsArray,
            requestObject: req,
            errorObject: error,
            logsDir: res.locals.logsDir
        });
    
        res.status(500).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    });
}


module.exports.destroy = function (req, res) {
    const errorsArray = [];

    // Удаление указанного навыка
    controllerDB.HardSkills.destroy({
        where: { 
            UUID: req.params.skillUuid,
        }
    })
    // Отправка результата
    .then(result => {
        res.status(200).json({
            data: result,
            errorsArray: errorsArray
        });
        return;
    })
    // Обработка ошибок
    .catch(error => {
        errorsArray.push(error.message);

        logger({
            filename: __filename,
            errorsArray: errorsArray,
            requestObject: req,
            errorObject: error,
            logsDir: res.locals.logsDir
        });

        res.status(500).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    });
}


module.exports.findByPk = function (req, res) {
    const errorsArray = [];

    // Поиск навыка по UUID
    controllerDB.HardSkills.findByPk(req.params.skillUuid)
    .then(result => {
        if (!result) {
            errorsArray.push("Навыка с указанным UUID не существует.");
        }

        res.status(200).json({
            data: result,
            errorsArray: errorsArray
        });
        return;
    })
    // Обработка ошибки
    .catch(error => {
        errorsArray.push(error.message);

        logger({
            filename: __filename,
            errorsArray: errorsArray,
            requestObject: req,
            errorObject: error,
            logsDir: res.locals.logsDir
        });

        res.status(500).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    });
}


module.exports.update = function (req, res) {
    const errorsArray = [];

    // Проверка входных данных
    if (validator.isEmpty(req.body.newValue ?? '')) {
        errorsArray.push("Не указано новое значение.");
    }
    
    if (validator.isEmpty(req.body.field ?? '')) {
        errorsArray.push("Не указано редактируемое поле.");
    }

    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }

    const updateOptions = {};
    updateOptions[req.body.field] = req.body.newValue;
    
    // Изменение записи о навыке
    controllerDB.HardSkills.update(updateOptions, 
    { 
        where: {
            UUID: req.params.skillUuid
        } 
    })
    // Отправка результата
    .then(result => {
        res.send();
    })
    // Обработка ошибок
    .catch(error => {
        errorsArray.push(error.message);

        logger({
            filename: __filename,
            errorsArray: errorsArray,
            requestObject: req,
            errorObject: error,
            logsDir: res.locals.logsDir
        });

        res.status(500).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    });
}