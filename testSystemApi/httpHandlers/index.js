const path = require('path');
const express = require('express');
const axios = require('axios');
const validator = require('validator');
const logger = require('../../logs/logger.js');
const adminValidator = require('../../APIs/validators.js').isAdmin;

const componentLoader = require('./componentLoader.js');
const testResultsHandler = require('./testResultsHandler.js');

const dataBase = require('../../database/index.js');

const testSystemApi = express();

testSystemApi.set('views', path.join(__dirname, '..', '..', 'public', 'testSystem', 'views'));
testSystemApi.set('view engine', 'pug');

testSystemApi.use('/static', express.static(path.join(__dirname, '..', '..', 'public', 'testSystem', 'static')));

testSystemApi.use('/components', componentLoader);

testSystemApi.use('/results', testResultsHandler);

//Назначение теста
testSystemApi.post('/schedule', adminValidator, (req, res) => {
    const errorsArray = [];

    if (!validator.isUUID(req.body.testUUID + '' ?? "")) {
        errorsArray.push("Указан неверный UUID назначаемого теста");
    }

    if (!res.locals.targetUser.UUID) {
        errorsArray.push("Указанный UUID тестируемого человека не существует");
    }

    if (errorsArray.length) {
        res.status(422).json({
            data: null,
            errorsArray: errorsArray
        });
    } else {
        dataBase.HardSkillTestResults.create({
            userUUID: res.locals.targetUser.UUID,
            testUUID: req.body.testUUID,
            answerJSON: null
        })
        // Отправка результата
        .then(result => {
            res.status(200).json({
                data: result,
                errorsArray: errorsArray
            });
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
        })
    }
});

testSystemApi.get('/session', (req, res) => {
    if (validator.isUUID(req.query.uuid + '' ?? "")) {
        dataBase.HardSkillTestResults.findOne({
            attributes: ['UUID'],
            where: {
                userUUID: res.locals.tokenData.userUUID,
                testUUID: req.query.uuid,
                answerJSON: null
            }
        })
        .then(result => {
            if (result) {
                res.cookie('resultUuid', result.UUID);
                res.cookie('testUuid', req.query.uuid);
                res.render('index.pug');
            } else {
                res.render('not_found.pug');
            }
        })
        .catch(error => {
            logger({
                filename: __filename,
                errorsArray: [error.message],
                requestObject: req,
                errorObject: error,
                logsDir: res.locals.logsDir
            });
        
            res.status(500).json({
                data: null,
                errorsArray: [error.message],
            });
        })
    } else {
        res.render('not_found.pug');
    }
});

// const { G4F } = require("g4f");
// const g4f = new G4F();

// testSystemApi.get('/gpt', (req, res) => {
//     const messages = [
//         { role: "user", content: `Answer strictly with two numbers separated by a space without any words.` +
//                                 `\nNumber type: float.` +
//                                 `\nBoth numbers between 0 and 1 inclusive.` +
//                                 `\nThe first number should reflect how correct the user's answer is, 0 - wrong, 1 - correct.` +
//                                 `\nThe second number should reflect how much the user's answer matches the expected answer in meaning, 0 - the answer has nothing in common in meaning with the expected answer, 1 - the answer is similar in meaning to the expected answer.` +
//                                 `\nQuestion asked: "${}"` +
//                                 `\nExpected answer: "${}"` +
//                                 `\nUser's answer: "${}"`}
//     ];

//     const requests = [];

//     for (var i = 0; i < process.env.DETAILED_ANSWERS_CHECKER_RETRIES; i++)
//         requests.push(g4f.chatCompletion(messages, {
//             provider: g4f.providers.Bing,
//             model: 'gpt-4',
//             debug: true,
//             retry: {
//                 times: 3,
//                 condition: (text) => {
//                     const words = text.split(" ");
//                     return words.length == 2;
//                 }
//             }
//         }))
    
//     Promise.all(requests)
//     .then(results => {
//         res.json(results);
//     })
//     .catch(error => {
//         res.status(500).send(error.message);
//     });
// })

module.exports = testSystemApi