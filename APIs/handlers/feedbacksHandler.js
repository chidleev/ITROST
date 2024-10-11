const logger = require('../../logs/logger');
const controllerDB = require('../../database/index').Feedbacks;
const validator = require('validator');
const fs = require('fs').promises;


module.exports.findAllRootFeedbacks = function (req, res) {
    const errorsArray = [];

    controllerDB.findAll({
        attributes: { 
            exclude: ['userUUID', 'updatedAt']
        },
        where: {
            userUUID: res.locals.tokenData.userUUID,
            prevUUID: null,
        },
    })
    .then(result => {
        res.status(200).json({
            data: result,
            errorsArray: errorsArray,
        })
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
    })
}

module.exports.findFeedbacksChainByRoot = function (req, res) {
    const errorsArray = [];

    var feedbacks = [];

    const getFeedbacksChain = (feedbacks = []) => {
        const last = feedbacks[0];
    
        return controllerDB.findOne({
            attributes: { 
                exclude: ['userUUID', 'updatedAt']
            },
            where: {
                prevUUID: last.UUID,
            },
        })
        .then(result => {
            if (result) {
                feedbacks.unshift(result);
                return getFeedbacksChain(feedbacks);
            }
            else {
                return Promise.resolve("OK");
            }
        })
        .catch(error => {
            return Promise.reject(error);
        });
    };

    controllerDB.findOne({
        attributes: { 
            exclude: ['userUUID', 'updatedAt']
        },
        where: {
            UUID: req.params.uuid, 
        },
    })
    .then(root => {
        if (!root) {
            errorsArray.push("Некорректный корень цепочки обращений");
            res.status(422).json({
                data: [],
                errorsArray: errorsArray,
            });
            return;
        }

        feedbacks.unshift(root);
        return getFeedbacksChain(feedbacks); 
    })
    .then(result => {
        res.status(200).json({
            data: feedbacks,
            errorsArray: errorsArray,
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
    })
}

module.exports.createFeedback = function (req, res) {
    const errorsArray = [];
    let newFeed;

    if (req.body.prevUUID && !validator.isUUID(req.body.prevUUID)) {
        errorsArray.push('Некорректный prevUUID');  
    }
    if (validator.isEmpty(req.body.message ?? "")) {
        errorsArray.push('Некорректное сообщение');
    }
    if (errorsArray.length) {
        if (req.files?.["image"]?.[0]?.path) {
            fs.unlink(req.files["image"][0].path);
        }
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }

    controllerDB.findOne({
        where: {
            UUID: req.body.prevUUID ?? "",
        }
    })
    .then(prevFeed => {
        let status = 200;
        
        // Если не первое сообщение, но не найдено прошлое
        if (req.body.prevUUID && !prevFeed) {
            errorsArray.push('Не найден предыдущий фидбек по указанному UUID');
            status = 404;
        }
        // Кто отвечает на открытый фидбек (может только админ)
        if (prevFeed?.status == 'открыто' && !res.locals.tokenData.userRoles.includes('admin')) {
            errorsArray.push('Вы не можете ответить на этот фидбек');
            status = 403;
        }
        if (errorsArray.length) {
            if (req.files?.["image"]?.[0]?.path) {
                fs.unlink(req.files["image"][0].path);
            }
            res.status(status).json({
                data: null,
                errorsArray: errorsArray
            });
            return;
        }

        // Определяем статус 
        let currentStatus = 'открыто';

        if (prevFeed?.status == 'открыто') {
            currentStatus = 'закрыто';
        }
        if (prevFeed?.status == 'закрыто' && res.locals.tokenData.userRoles.includes('admin')) {
            currentStatus = 'закрыто';
        }

        return controllerDB.create({
            prevUUID: req.body.prevUUID,
            message: req.body.message,
            image: null,
            status: currentStatus,
            userUUID: res.locals.tokenData.userUUID,
        })
    })
    .then(createdFeed => {
        newFeed = createdFeed;

        if (res.locals.multerError) {
            return Promise.reject(res.locals.multerError);
        }
        if (!req.files?.['image']?.[0]?.path) {
            return Promise.resolve();
        }

        // Заменяем в названии файла temp на UUID нового фидбека
        let oldPath = req.files["image"][0].path;
        let newPath = oldPath.replace('temp', newFeed.UUID);

        req.files["image"][0].path = newPath;
        return fs.rename(oldPath, newPath);
    })
    .then(() => {
        if (!req.files?.["image"]?.[0]?.path) {
            return Promise.resolve();
        }

        let newPath = req.files["image"][0].path;
        const prefix = 15; // Длина начального куска пути "public/userSite"
        newPath = newPath.slice(prefix);
        newFeed.image = newPath;

        return controllerDB.update({
            image: newPath,
        }, {
            where: {
                UUID: newFeed.UUID,
            }
        })
    })
    .then(() => {
        const { userUUID, ...responseFeed } = newFeed;
        res.json(responseFeed["dataValues"]);
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

        // Удаление возможного файла при неудачном создании запроса
        if (req.files?.["image"]?.[0]?.path) {
            fs.unlink(req.files["image"][0].path);
        }

        res.status(500).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    })
}