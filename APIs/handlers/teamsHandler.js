const validator = require('validator');
const logger = require('../../logs/logger');
const { UUID } = require('sequelize');
const operators = require('../../database/index').Op;
const controllerDB = require('../../database/index').Teams;


module.exports.findAll = function (req, res) {
    const errorsArray = [];

    // Поиск навыков
    controllerDB.findAll()
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

    if (!validator.isUUID(req.body.leaderUUID)) {
        errorsArray.push("Некорректно указан UUID тимлида");
    }
    if (!validator.isEmpty(req.body.name)) {
        errorsArray.push("Некорректно указано название команды");
    }
    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }

    controllerDB.create({
        name: req.body.name,
        leaderUUID: req.body.leaderUUID,
        description: req.body.description || '',
    })
    .then(result => {
        res.status(200).json({
            data: result,
            errorsArray: errorsArray
        });
        return;
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

module.exports.destroy = function (req, res) {
    const errorsArray = [];

    controllerDB.destroy({
        where: {
            UUID: req.params.uuid,
        }
    })
    .then(result => {
        res.status(200).json({
            data: result,
            errorsArray: errorsArray
        });
        return;
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

module.exports.findByPk = function (req, res) {
    const errorsArray = [];

    controllerDB.findByPk(req.params.uuid)
    .then(result => {
        if (!result) {
            errorsArray.push("Команда с указанным UUID не существует.");
        }
        res.status(200).json({
            data: result,
            errorsArray: errorsArray
        });
        return;
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

module.exports.update = function (req, res) {
    const errorsArray = [];

    if (!validator.isUUID(req.body.leaderUUID)) {
        errorsArray.push("Некорректно указан новый UUID тимлида");
    }
    if (!validator.isEmpty(req.body.name)) {
        errorsArray.push("Некорректно указано новое название команды");
    }
    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }

    controllerDB.update({
        name: req.body.name,
        leaderUUID: req.body.leaderUUID,
        description: req.body.description || '',

    },{
        where: {
            UUID: req.params.uuid,
        }
    })
    .then(result => {
        controllerDB.findByPk(req.params.uuid)
            .then(new_data => {
                res.status(200).json({
                    data: new_data,
                    errorsArray: errorsArray
                });
                return;
        })
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