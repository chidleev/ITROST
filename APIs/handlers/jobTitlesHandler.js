const validator = require('validator');
const logger = require('../../logs/logger');
const controllerDB = require('../../database/index');


module.exports.findAll = function (req, res) {
    const errorsArray = [];

    // Поиск должностей и отправка результата
    controllerDB.JobTitles.findAll()
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

    // Проверка входных данных
    if (validator.isEmpty(req.body?.name)) {
        errorsArray.push("Не указано название должности.");
    }
    
    if (validator.isEmpty(req.body?.vacantNum + '')) {
        errorsArray.push("Не указано число мест на должность");
    }

    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }
    // Создание должности
    Promise.all([
        controllerDB.JobTitles.create({
            name: req.body.name,
            description: req.body.description || '',
            vacantNum: req.body.vacantNum
        }),
        controllerDB.HardSkills.findAll()
    ])
    .then(async result => {
        await Promise.all(result[1].map(skill => {
            return controllerDB.JobHardSkills.create({
                skillUUID: skill.UUID,
                jobTitleUUID: result[0].UUID,
                requiredLevelUUID: null
            });
        }));
        res.json({
            data: result[0],
            errorsArray: errorsArray
        })
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


module.exports.destroy = function (req, res) {
    const errorsArray = [];

    // Удаление должности
    controllerDB.JobTitles.destroy({
        where: { 
            UUID: req.params.uuid,   
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


module.exports.findByPk = function (req, res) {
    const errorsArray = [];

    // Поиск должности и отправка результата
    controllerDB.JobTitles.findByPk(req.params.uuid)
    .then(result => {
        if (!result) {
            errorsArray.push("Должность с указанным UUID не существует.");
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
    controllerDB.JobTitles.update(updateOptions, 
    { 
        where: {
            UUID: req.params.uuid
        } 
    })
    // Отправка результата
    .then(result => {
        res.send();
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