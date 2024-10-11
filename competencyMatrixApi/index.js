const path = require('path');
const express = require('express');
const competencyMatrixApi = express();

const validator = require('validator');
const logger = require('../logs/logger.js');
const adminValidator = require('../APIs/validators.js').isAdmin;

const dataBase = require('../database/index.js');

competencyMatrixApi.set('views', path.join(__dirname, '..', 'public', 'competencyMatrix', 'views'));
competencyMatrixApi.set('view engine', 'pug');

competencyMatrixApi.use('/static', express.static(path.join(__dirname, '..', 'public', 'competencyMatrix', 'static')));

competencyMatrixApi.get('/', (req, res) => {
    Promise.all([
        dataBase.HardSkills.findAll({
            order: [['name']]
        }),
        dataBase.JobTitles.findAll({
            order: [['name']]
        }),
        dataBase.JobHardSkills.findAll({
            include: {
                model: dataBase.Levels,
                as: 'requiredLevel'
            }
        }),
        dataBase.Levels.findAll()
    ]).then(results => {
        res.render('index.pug', {
            skills: results[0],
            jobTitles: results[1],
            requirements: results[2],
            levels: results[3]
        });
    }).catch(error => {
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
});

competencyMatrixApi.get('/edit', adminValidator, (req, res) => {
    Promise.all([
        dataBase.HardSkills.findAll({
            order: [['name']]
        }),
        dataBase.JobTitles.findAll({
            order: [['name']]
        }),
        dataBase.JobHardSkills.findAll({
            include: {
                model: dataBase.Levels,
                as: 'requiredLevel'
            }
        }),
        dataBase.Levels.findAll()
    ]).then(results => {
        res.render('index_admin.pug', {
            skills: results[0],
            jobTitles: results[1],
            requirements: results[2],
            levels: results[3]
        });
    }).catch(error => {
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
});

module.exports = competencyMatrixApi;