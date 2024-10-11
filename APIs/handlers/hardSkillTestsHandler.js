const validator = require('validator');
const logger = require('../../logs/logger');
const operators = require('../../database/index').Op;
const controllerDB = require('../../database/index').HardSkillTests;

const CheckJSON = require('../checkerJSON');


module.exports.findAll = function (req, res) {
    const errorsArray = [];

    const options = {
        attributes: [
            "UUID", 
            "name", 
            "description",
            "skillUUID",
            "infoJSON",
        ]
    };
    if (req.query.skillUuid) {
        options.where = {
            skillUUID: req.query.skillUuid,
        }
    }

    // Поиск тестов по навыку
    controllerDB.findAll(options)
    // Отправка результата поиска
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
    errorsArray.push(...CheckJSON.hardSkillTestInfoJSON(req.body?.infoJSON));
    errorsArray.push(...CheckJSON.hardSkillTestQuestionsJSON(req.body.questionsJSON));
    
    if (validator.isEmpty(req.body?.name + '' ?? "")) {
        errorsArray.push("Отсутствует название теста, невозможно создать тест")
    }

    if (validator.isEmpty(req.body?.skillUUID + '' ?? "")) {
        errorsArray.push("Не указан тестируемый навык");
    }

    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }
    // Создание теста
    controllerDB.create({
        name: req.body.name,
        description: req.body?.description,
        infoJSON: req.body.infoJSON,
        questionsJSON: req.body.questionsJSON,
        skillUUID: req.body.skillUUID,
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

    // Удаление теста
    controllerDB.destroy({
        where: { 
            UUID: req.params.testUuid,
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
    controllerDB.findByPk(req.params.testUuid)
    .then(result => {
        if (!result) {
            errorsArray.push("Теста с указанным UUID не существует.");
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
    errorsArray.push(...CheckJSON.hardSkillTestInfoJSON(req.body?.infoJSON));
    errorsArray.push(...CheckJSON.hardSkillTestQuestionsJSON(req.body.questionsJSON));
    
    if (validator.isEmpty(req.body?.name + '' ?? "")) {
        errorsArray.push("Отсутствует название теста, невозможно создать тест")
    }

    if (validator.isEmpty(req.body?.skillUUID + '' ?? "")) {
        errorsArray.push("Не указан тестируемый навык");
    }

    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }
    // Обновление записи о тесте
    controllerDB.update({
        name: req.body.name,
        description: req.body?.description,
        infoJSON: req.body.infoJSON,
        questionsJSON: req.body.questionsJSON,
        skillUUID: req.body.skillUUID,
    }, 
    { 
        where: {
            UUID: req.params.testUuid
        } 
    })
    // Отправка результата
    .then(result => {
        controllerDB.findByPk(req.params.testUuid)
            .then(new_data => {
                res.status(200).json({
                    data: new_data,
                    errorsArray: errorsArray
                });
                return;
        })
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