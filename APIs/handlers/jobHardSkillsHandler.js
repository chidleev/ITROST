const validator = require('validator');
const logger = require('../../logs/logger');
const operators = require('../../database/index').Op;
const controllerDB = require('../../database/index').JobHardSkills;


module.exports.findAll = function (req, res) {
    const errorsArray = [];

    const options = {};
    if (req.query.skillUuid) {
        options.where = {
            skillUUID: req.query.skillUuid,
        }
    }
    if (req.query.jobUuid) {
        options.where = {
            ...options.where,
            jobTitleUUID: req.query.jobUuid,
        }
    }

    // Поиск требований должности к навыку
    controllerDB.findAll(options)
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
    })
}


module.exports.create = function (req, res) {
    const errorsArray = [];

    // Проверка входных данных
    if (validator.isEmpty(req.body?.skillUUID + '' ?? "")) {
        errorsArray.push("Не указан навык должности");
    }
    if (validator.isEmpty(req.body?.jobTitleUUID + '' ?? "")) {
        errorsArray.push("Не указана должность");
    }
    if (validator.isEmpty(req.body?.requirements + '' ?? "")) {
        errorsArray.push("Не указаны требования к навыку");
    }

    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }
    // Создание записи
    controllerDB.create({
        skillUUID: req.body.skillUUID,
        jobTitleUUID: req.body.jobTitleUUID,
        requirements: req.body.requirements,
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
    })
}


module.exports.destroy = function (req, res) {
    const errorsArray = [];

    // Удаление навыка должности
    controllerDB.destroy({
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
    })
}


module.exports.findByPk = function (req, res) {
    const errorsArray = [];

    // Поиск записи и отправка результата
    controllerDB.findByPk(req.params.uuid)
    .then(result => {
        if (!result) {
            errorsArray.push("Навыка должности с указанным UUID не существует.");
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
    
    controllerDB.findByPk(req.params.uuid)
    .then(requirement => {
        switch (req.body.field) {
            case 'requiredLevel':
                if (req.body.newValue !== 'null') {
                    return requirement.setRequiredLevel(req.body.newValue);
                } else {
                    requirement.setRequiredLevel(null)
                    .then(requirement => {
                        requirement.description = null;
                        return requirement.save();
                    })
                }
                    
            case 'description':
                console.log(req.body.newValue);
                
                requirement.description = req.body.newValue;
                return requirement.save();

            default:
                errorsArray.push('Указанное поле не существует');

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
        }
    })
    .then(result => {
        res.json(result);
    })
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