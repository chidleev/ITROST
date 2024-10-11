const validator = require('validator');
const bcrypt = require('bcrypt');

const JWT = require('jsonwebtoken');

const logger = require('../../logs/logger');
const checkData = require('../checkerJSON');
const operators = require('../../database/index').Op;
const controllerDB = require('../../database/index');
const { application } = require('express');
const verificationAccess = require('../validators').verificationAccess;

module.exports.createUser = function (req, res) {
    const errorsArray = [];

    // Проверка входных данных
    if (validator.isEmpty(req.body?.login)) {
        errorsArray.push("Не указан логин");
    }
    if (validator.isEmpty(req.body?.password)) {
        errorsArray.push("Не указан пароль");
    }
    req.body.userUUID = "temporary empty";
    errorsArray.push(...checkData.userProfiles(req));

    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }
    // Шифрование полученного пароля
    const salt = 10;
    bcrypt.hash(req.body.password, salt)
    // Создание пользователя
    .then(hash => {
        return controllerDB.Users.create({
            login: req.body.login,
            password: hash
        })
    })
    // Создание профиля пользователя
    .then(user => {
        return controllerDB.UserProfiles.create({
            jobTitleUUID: req.body.jobTitleUUID,
            userUUID: user.UUID,
            surname: req.body.surname,
            name: req.body.name,
            patronymic: req.body.patronymic,
            birthday: req.body.birthday,
            mail: req.body.mail,
            image: ""
        })
    })
    // Отправка результата
    .then(profile => {
        res.status(200).json({
            data: profile,
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

module.exports.loginUser = function (req, res) {
    const errorsArray = [];

    const result = verificationAccess(res.locals.tokenData, 'user')
    if (result.status != 401) {
        res.status(200).send("Authorization unnessesary");
        return;
    }
    else if (!("login" in req.body) || !("password" in req.body)) {
        res.status(401).send("Authorization nessesary");
        return;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const tokenPayload = {
        iat: currentTime,
        exp: currentTime + Number(process.env.COOKIE_LIFETIME), // Срок истечет через COOKIE_LIFETIME секунд от Date.now()/1000
        userUUID: "",
        userRoles: [],
    }

    controllerDB.Users.findOne({
        where: { login: req.body.login },
        attributes: ['UUID', 'password'],
    })
    // Поиск пользователя по логину
    .then(user => {
        if (!user) {
            errorsArray.push("User does not exist")
            return Promise.reject();
        }

        tokenPayload.userUUID = user.UUID;
        tokenPayload.userRoles.push("user");

        return bcrypt.compare(req.body.password, user.password)
    })
    // Проверка пароля
    .then(isPasswordMatch => {
        if (!isPasswordMatch) {
            errorsArray.push("Wrong password")
            return Promise.reject();
        }

        return controllerDB.Teams.findOne({
            where: { leaderUUID: tokenPayload.userUUID },
            attributes: ['UUID'],
        })
    })
    // Проверка роли "тимлид"
    .then(team => {
        if (team) {
            tokenPayload.userRoles.push("teamleader");
            res.cookie('isTeamleader', 'true', {
                maxAge: 1000 * process.env.COOKIE_LIFETIME, 
            });
        }

        return controllerDB.Admins.findOne({
            where: { userUUID: tokenPayload.userUUID },
            attributes: ['UUID'],
        })
    })
    // Проверка роли "админ"
    .then(admin => {
        if (admin) {
            tokenPayload.userRoles.push("admin");
            res.cookie('isAdmin', 'true', {
                maxAge: 1000 * process.env.COOKIE_LIFETIME, 
            });
        }
        // Авторизация пользователя
        JWT.sign(tokenPayload, process.env.JWT_KEY, (error, signedToken) => {
            if (error) {
                errorsArray.push(error?.message);

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
            } else {
                res.cookie('jwt', signedToken, {
                    httpOnly: true,
                    maxAge: 1000 * process.env.COOKIE_LIFETIME, 
                })
                res.status(200).send();
            }
        })
    })
    // Обработка ошибок
    .catch(error => {
        if (error) {
            errorsArray.push(error.message);

            logger({
                filename: __filename,
                errorsArray: errorsArray,
                requestObject: req,
                errorObject: error,
                logsDir: res.locals.logsDir
            });
        }
        var status = 500;
        if (errorsArray[0] == 'User does not exist' || errorsArray[0] == 'Wrong password') {
            status = 403;
        }
        res.status(status).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    })
}

module.exports.updateProfile = function (req, res) {
    // TODO - сделать частичное для юзера и полное для админа обновление профиля
}

module.exports.changePassword = function (req, res) {
    const errorsArray = [];
    /* {
        oldPassword: "",
        newPassword: ""
    } */
    if (validator.isEmpty(req.body.oldPassword)) {
        errorsArray.push("Некорректный старый пароль")
    }
    if (validator.isEmpty(req.body.newPassword)) {
        errorsArray.push("Некорректный новый пароль")
    }
    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }

    controllerDB.Users.findOne({
        attributes: {
            include: ['password']
        },
        where: {
            UUID: res.locals.tokenData.userUUID,
        },
    })
    .then(result => {
        return bcrypt.compare(req.body.oldPassword, result.password);
    })
    .then(isMatch => {
        if (!isMatch) {
            errorsArray.push("Неверный пароль");
            res.status(403).json({
                data: null,
                errorsArray: errorsArray,
            });
        }

        const salt = 10;
        return bcrypt.hash(req.body.newPassword, salt);
    }) 
    .then(hash => {
        return controllerDB.Users.update({
            password: hash,
        }, {
            where: {
                UUID: res.locals.tokenData.userUUID
            }
        })
    })
    .then(result => {
        res.send("OK");
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

module.exports.changePhotoBeforeUpload = function (req, res, next) {
    // Проверка, меняет ли пользователь свое фото / меняет админ / меняет третье лицо
    if (!(res.locals.tokenData.userUUID == req.body.userUUID || res.locals.tokenData.userRoles.includes('admin'))) {
        res.status(403).send('Access denied');
        return;
    }

    next()
}

module.exports.changePhotoAfterUpload = function (req, res) {
    const errorsArray = [];

    // Возникла ли ошибка при сохранении фото
    if (res.locals.multerError) {
        errorsArray.push(res.locals.multerError.message);

        logger({
            filename: __filename,
            errorsArray: errorsArray,
            requestObject: req,
            errorObject: res.locals.multerError,
            logsDir: res.locals.logsDir
        });

        res.status(500).json({
            data: null,
            errorsArray: errorsArray,
        });
        return;
    }

    // Отправил ли фото пользователь
    if (!req.file) {
        errorsArray.push('Файл не был отправлен на сервер');
        res.status(422).json({
            data: [],
            errorsArray: errorsArray,
        })
        return;
    }

    const prefix = 15; // Длина начального куска пути "public/userSite"
    req.file.path = req.file.path.slice(prefix);
    
    // Обновление пути до фото в UserProfiles
    controllerDB.UserProfiles.update({
        image: req.file.path,
    }, {
        where: {
            userUUID: req.body.userUUID,
        } 
    })
    .then(result => {
        res.status(200).json({
            data: [ req.file.path ],
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
    })
}

module.exports.getInfo = function (req, res) {
    const errorsArray = [];

    controllerDB.Users.findOne({
        attributes: { 
            exclude: ['password', 'createdAt', 'updatedAt'] 
        },
        where: {
            UUID: res.locals.tokenData.userUUID
        },
        include: [{
            model: controllerDB.UserProfiles,
            as: 'profileInformation',
            attributes: { 
                exclude: ['userUUID', 'jobTitleUUID', 'createdAt', 'updatedAt'] 
            },
            include: {
                model: controllerDB.JobTitles,
                as: 'jobInformation',
                attributes: ['name', 'description']
            }
        },{
            model: controllerDB.HardSkillTestResults,
            as: 'testsResults', 
            attributes: ['isHumanVerified'],
            include: [{
                model: controllerDB.HardSkillTests,
                as: 'appointedTest',
                attributes: ['UUID', 'createdAt', 'updatedAt'],
                include: {
                    model: controllerDB.HardSkills,
                    as: 'testedSkill',
                    attributes: ['name', 'description']
                }
            },{
                model: controllerDB.Levels,
                as: 'resultLevel',
                attributes: ['name', 'description', 'priority']
            }]
        }]
    })
    .then(async targetUserInfo => {
        if (!targetUserInfo) {
            res.status(404).json({
                data: null,
                errorsArray: ['User not found'],
            });
            return;
        }

        targetUserInfo.dataValues.appointedTestsCount = 0;
        for (var testResult of targetUserInfo.dataValues.testsResults) {
            if (!testResult.dataValues.resultLevel) targetUserInfo.dataValues.appointedTestsCount += 1;
        }

        targetUserInfo.dataValues.applications = await targetUserInfo.getApplications({
            attributes: ['status', [controllerDB.Sequelize.fn('MAX', controllerDB.Sequelize.literal('PromotionApplications.createdAt')), 'submittedAt']]
        });

        delete targetUserInfo.dataValues.UUID;
        res.json(targetUserInfo);
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
    })
}

module.exports.getInfoByLogin = function (req, res) {
    const errorsArray = [];

    controllerDB.Users.findOne({
        attributes: { 
            exclude: ['password', 'createdAt', 'updatedAt'] 
        },
        where: {
            login: req.params.login
        },
        include: [{
            model: controllerDB.UserProfiles,
            as: 'profileInformation',
            attributes: { 
                exclude: ['userUUID', 'jobTitleUUID', 'createdAt', 'updatedAt'] 
            },
            include: {
                model: controllerDB.JobTitles,
                as: 'jobInformation',
                attributes: ['name', 'description']
            }
        },{
            model: controllerDB.HardSkillTestResults,
            as: 'testsResults', 
            attributes: ['isHumanVerified'],
            include: [{
                model: controllerDB.HardSkillTests,
                as: 'appointedTest',
                attributes: ['UUID', 'createdAt', 'updatedAt'],
                include: {
                    model: controllerDB.HardSkills,
                    as: 'testedSkill',
                    attributes: ['name', 'description']
                }
            },{
                model: controllerDB.Levels,
                as: 'resultLevel',
                attributes: ['name', 'description', 'priority']
            }]
        }]
    })
    .then(async targetUserInfo => {
        if (!targetUserInfo) {
            res.status(404).json({
                data: null,
                errorsArray: ['User not found'],
            });
            return;
        }

        for (var testResult of targetUserInfo.dataValues.testsResults) {
            if (!testResult.dataValues.resultLevel) delete targetUserInfo.dataValues.testsResults[targetUserInfo.dataValues.testsResults.indexOf(testResult)];
        }

        delete targetUserInfo.dataValues.UUID;
        res.json(targetUserInfo);
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
    })
}

module.exports.changeUserJob = function (req, res) {
    const errorsArray = [];

    let status = 200;
    if (!res.locals.tokenData.userRoles.includes('admin')) {
        status = 403;
        errorsArray.push("Access denied");
    }
    if (!validator.isUUID(req.body.userUUID)) {
        status = 422;
        errorsArray.push("Некорректный UUID пользователя");
    }
    if (!validator.isUUID(req.body.jobTitleUUID)) {
        status = 422;
        errorsArray.push("Некорректный UUID должности");
    }
    if (errorsArray.length) {
        res.status(status).json({
            data: null,
            errorsArray: errorsArray
        });
        return;
    }

    controllerDB.Users.update({
        jobInformation: req.body.jobTitleUUID
    }, {
        where: {
            UUID: req.body.userUUID
        }
    })
    .then(result => {
        if (result == 0) {
            errorsArray.push("Новая должность совпадает со старой должностью");
        }
        res.json({
            data: ["OK"],
            errorsArray: errorsArray
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
    })
}