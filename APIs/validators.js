const validator = require('validator');
const logger = require('../logs/logger');
const JWT = require('jsonwebtoken');

const dataBase = require('../database')

module.exports.checkCookieToken = async function(req, res, next) {
    const errorsArray = [];

    res.locals.targetUser = {
        UUID: null,
        profileUUID: null
    };

    if (validator.isUUID(req.query.profileUUID ?? "", 4)) {
        res.locals.targetUser.profileUUID = req.query.profileUUID;
    }
    if (validator.isUUID(req.body.profileUUID + '' ?? "", 4)) {
        res.locals.targetUser.profileUUID = req.body.profileUUID;
    }
    if (validator.isUUID(res.locals.targetUser.profileUUID ?? "", 4)) {
        res.locals.targetUser.UUID = (await dataBase.UserProfiles.findByPk(res.locals.targetUser.profileUUID, 
            { 
                include: {
                    model: dataBase.Users, 
                    as: 'creditals'
                }
            }))?.creditals.UUID ?? null;
    }
    
    res.locals.tokenData = {
        iat: 0,
        exp: 0,
        userUUID: "",
        userRoles: [],
    };

    const token = req.cookies?.jwt;
    if (!token) {
        next();
    } else {
        JWT.verify(token, process.env.JWT_KEY, function(error, tokenPayload) {
            // Если ошибки расшифровки токена нет
            if (!error) {
                const currentTime = Math.floor(Date.now() / 1000);

                res.locals.tokenData.iat = tokenPayload.iat;
                res.locals.tokenData.exp = currentTime + Number(process.env.COOKIE_LIFETIME);
                res.locals.tokenData.userUUID = tokenPayload.userUUID;
                res.locals.tokenData.userRoles.push(...tokenPayload.userRoles);

                next();
            }
            // Если ошибка расшифровки токена - истечение его срока
            else if (error.name == 'TokenExpiredError') {
                res.locals.tokenData.iat = 0;
                res.locals.tokenData.exp = 0;
                res.locals.tokenData.userUUID = tokenPayload.userUUID;
                res.locals.tokenData.userRoles.push(...tokenPayload.userRoles);

                next();
            }
            // Если есть иные ошибки расшифровки токена
            else {
                errorsArray.push(error.message);

                logger({
                    filename: __filename,
                    errorsArray: errorsArray,
                    requestObject: req,
                    errorObject: error,
                    logsDir: res.locals.logsDir
                });

                res.status(400).json({
                    data: null,
                    errorsArray: [error.message],
                });
            }
        });
    }
}

module.exports.verificationAccess = function (tokenData, role = '') {
    const currentTime = Math.floor(Date.now() / 1000);
    if (tokenData.iat == 0) {
        return {
            status: 401,
            message: "Unauthorized",
        }
    }
    else if (tokenData.exp < currentTime) {
        return {
            status: 401,
            message: "Old cookie",
        }
    }
    else if (!tokenData.userRoles.includes(role)) {
        return {
            status: 403,
            message: "Access denied",
        }
    }
    else {
        return {
            status: 200,
            message: "OK",
        }
    }
}

module.exports.isLogged = function (req, res, next) {
    const result = module.exports.verificationAccess(res.locals.tokenData, 'user');
    if (result.status == 200) {
        JWT.sign(res.locals.tokenData, process.env.JWT_KEY, (err, signedToken) => {
            res.cookie('jwt', signedToken, {
                httpOnly: true,
                maxAge: 1000 * process.env.COOKIE_LIFETIME, 
            })
            next();
        })
    }
    else {
        if (req.baseUrl.indexOf('api') == -1) {
            res.redirect('/login');
        } else {
            res.status(result.status).send(result.message);
        }
    }
}

module.exports.isTeamleader = function (req, res, next) {
    const result = module.exports.verificationAccess(res.locals.tokenData, 'teamleader');
    if (result.status == 200) {
        JWT.sign(res.locals.tokenData, process.env.JWT_KEY, (err, signedToken) => {
            res.cookie('jwt', signedToken, {
                httpOnly: true,
                maxAge: 1000 * process.env.COOKIE_LIFETIME, 
            })
            next();
        })
    }
    else {
        res.status(result.status).send(result.message);
    }
}

module.exports.isAdmin = function (req, res, next) {
    const result = module.exports.verificationAccess(res.locals.tokenData, 'admin');
    if (result.status == 200) {
        JWT.sign(res.locals.tokenData, process.env.JWT_KEY, (err, signedToken) => {
            res.cookie('jwt', signedToken, {
                httpOnly: true,
                maxAge: 1000 * process.env.COOKIE_LIFETIME, 
            })
            next();
        })
    }
    else {
        res.status(result.status).send(result.message);
    }
}