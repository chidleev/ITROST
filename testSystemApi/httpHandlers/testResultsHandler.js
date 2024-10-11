const path = require('path');
const fs = require("fs");
const validator = require('validator');
const jsonFile = require("jsonfile");
const logger = require('../../logs/logger');
const adminValidator = require('../../APIs/validators').isAdmin;
const runTestResultsChecker = require('../testResultsChecker');
const dataBase = require('../../database');
const { error } = require('console');

const testResultsHandler = require('express')();
testResultsHandler.set('views', path.join(__dirname, '..', '..', 'public', 'testSystem', 'resultsViews'));
testResultsHandler.set('view engine', 'pug');

// //все результаты:                   .../testsystem/results/all
// //все результаты по навыку:         .../testsystem/results/all?skillUUID=...
// //все результаты по человеку:       .../testsystem/results/all?profileUUID=...
// //все результаты по верификации:    .../testsystem/results/all?verified=1/0
// testResultsHandler.get('/all', (req, res) => {
//     const errorsArray = [];
//     var options = {
//         attributes: { exclude: ['testUUID', 'userUUID', 'answerJSON'] },
//         include: {
//             model: dataBase.HardSkillTests,
//             as: 'appointedTest',
//             attributes: ['UUID', 'SkillUUID']
//         }
//     };

//     if (validator.isBoolean(req.query.verified ?? "")) {
//         options.where = {
//             isHumanVerified: req.query.verified
//         };
//     };
    
//     if (res.locals.targetUser.UUID) {
//         options.where = {
//             ...options.where,
//             userUUID: res.locals.targetUser.UUID
//         };
//         if (!res.locals.tokenData.userRoles.includes('admin')) {
//             options.attributes.exclude.push('userReview');
//         }
//     } else if (!res.locals.tokenData.userRoles.includes('admin')) {
//         options.where = {
//             ...options.where,
//             userUUID: res.locals.tokenData.userUUID
//         }; 
//     };

//     dataBase.HardSkillTestResults.findAll(options)
//     .then(result => {
//         if (validator.isUUID(req.query.skillUUID ?? "", 4)) {
//             res.json({
//                 data: result.filter(element => { 
//                     return element.dataValues.HardSkillTest.dataValues.SkillUUID == req.query.skillUUID;
//                 }),
//                 errorsArray: errorsArray,
//             });
//         } else {
//             res.json({
//                 data: result,
//                 errorsArray: errorsArray,
//             });
//         }
//     })
//     .catch(error => {
//         errorsArray.push(error.message);

//         logger({
//             filename: __filename,
//             errorsArray: errorsArray,
//             requestObject: req,
//             errorObject: error,
//             logsDir: res.locals.logsDir
//         });
        
//         res.status(500).json({
//             data: [],
//             errorsArray: errorsArray,
//         });
//     });
// });

testResultsHandler.post('/save', (req, res) => {
    if (!req.body.sessionID) {
        res.status(400).send('Session ID not specified');
        return;
    }

    res.clearCookie('testUuid');

    const filePath = path.join(__dirname, '..', 'tmpUserResults', `${req.body.sessionID}.json`);
    jsonFile.readFile(filePath)
    .then(answerData => {
        runTestResultsChecker(answerData)
        .then(data => {
            fs.unlinkSync(filePath);
            dataBase.HardSkillTestResults.update({
                answerJSON: data.result,
                totalScore: data.result.userScore.toFixed(2),
                resultLevelUUID: data.levelUUID
            },{
                where: {
                    UUID: req.cookies.resultUuid
                }
            })
        })
        res.send();
    })
    .catch(error => {
        res.status(500).send(error.message);
    })
});

testResultsHandler.use(adminValidator);

testResultsHandler.get('/all-html', (req, res) => {
    var options = {
        include: [{
            model: dataBase.HardSkillTests,
            as: 'appointedTest',
            include: {
                model: dataBase.HardSkills,
                as: 'testedSkill'
            }
        }, {
            model: dataBase.Users,
            as: 'testedPersonCreditals',
            include: {
                model: dataBase.UserProfiles,
                as: 'profileInformation',
                include: {
                    model: dataBase.JobTitles,
                    as: 'jobInformation',
                    attributes: ['name']
                }
            }
        }, {
            model: dataBase.Levels,
            as: 'resultLevel'
        }],
        order: [['UUID', 'DESC']]
    };

    if (validator.isBoolean(req.query.verified ?? "")) {
        options.where = {
            isHumanVerified: req.query.verified
        };
    };
    
    dataBase.HardSkillTestResults.findAll(options)
    .then(result => {
        res.render('resultCards.pug', { results: result }, (error, html) => {
            if (error) {
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
            } else {
                res.send(html);
            }
        });
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
            data: [],
            errorsArray: errorsArray,
        });
    });
});

testResultsHandler.get('/:resultUUID/view', (req, res) => {
    var options = {
        attributes: { exclude: ['testUUID', 'userUUID'] },
        include: [{
            model: dataBase.HardSkillTests,
            as: 'appointedTest',
            include: {
                model: dataBase.HardSkills,
                as: 'testedSkill'
            }
        }, {
            model: dataBase.Users,
            as: 'testedPersonCreditals',
            attributes: { exclude: ['UUID', 'password'] },
            include: {
                model: dataBase.UserProfiles,
                as: 'profileInformation',
                include: {
                    model: dataBase.JobTitles,
                    as: 'jobInformation',
                    attributes: ['name']
                }
            }
        }, {
            model: dataBase.Levels,
            as: 'resultLevel'
        }]
    };

    dataBase.HardSkillTestResults.findByPk(req.params.resultUUID, options)
    .then(result => {
        res.render('resultDetailed.pug', { result: result });
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
            data: [],
            errorsArray: errorsArray,
        });
    });
})

testResultsHandler.get('/:resultUUID', (req, res) => {
    const errorsArray = []
    var options = {
        attributes: { exclude: ['testUUID', 'userUUID'] },
        include: {
            model: dataBase.HardSkillTests,
            as: 'appointedTest',
            attributes: ['UUID', 'SkillUUID']
        }
    };

    if (!res.locals.tokenData.userRoles.includes('admin')) {
        options.where = {
            userUUID: res.locals.tokenData.userUUID
        }
    }

    if (req.params.resultUUID) {
        dataBase.HardSkillTestResults.findByPk(req.params.resultUUID, options)
        .then(result => {
            res.json({
                data: result,
                errorsArray: errorsArray,
            });
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
                data: [],
                errorsArray: errorsArray,
            });
        });
    } else {
        res.status(400).json({
            data: null,
            errorsArray: ["Invalid test result UUID"],
        });
    }
});

testResultsHandler.patch('/:resultUUID/change-score', (req, res) => {
    const errorsArray = []
    dataBase.HardSkillTestResults.findByPk(req.params.resultUUID, {
        attributes: ['answerJSON']
    })
    .then(result => {
        const answerData = result.dataValues.answerJSON.answersHistory.find(a => a.ID == req.body.questionID && a.score >= 0);
        const answerDataIndex = result.dataValues.answerJSON.answersHistory.findIndex(a => a.ID == req.body.questionID && a.score >= 0);
        answerData.score = req.body.newScore;
        answerData.autoCheckSuccess = true;
        result.dataValues.answerJSON.answersHistory.splice(answerDataIndex, 1, answerData);
        return dataBase.HardSkillTestResults.update({
            answerJSON: result.dataValues.answerJSON
        },{
            where: {
                UUID: req.params.resultUUID
            }
        })       
    })
    .then(() => {
        res.send();
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
})

testResultsHandler.patch('/:resultUUID', (req, res) => {
    dataBase.HardSkillTestResults.update({
        isHumanVerified: 1
    },{
        where: {
            UUID: req.params.resultUUID
        }
    })
    .then(() => {
        res.send();
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
})

testResultsHandler.delete('/:resultUUID', (req, res) => {
    const errorsArray = []
    
    dataBase.HardSkillTestResults.destroy({
        where: {
            UUID: req.params.resultUUID
        }
    })
    .then(result => {
        res.status(200).json({
            data: result,
            errorsArray: errorsArray
        });
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
    });
    
});

testResultsHandler.get('/', (req, res) => {
    res.render('index.pug');
})

module.exports = testResultsHandler