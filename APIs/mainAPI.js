const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require("fs");
const YAML = require('yaml');

var validator = require('./../APIs/validators');
var loginUser = require('./../APIs/handlers/usersHandler').loginUser;

const mainAPI = require('express')();

// Импорт роутеров API
const feedbacksRouter = require('./routes/feedbacksRouter.js');
const hardSkillsRouter = require('./routes/hardSkillsRouter.js');
const hardSkillTestsRouter = require('./routes/hardSkillTestsRouter.js');
const jobHardSkillsRouter = require('./routes/jobHardSkillsRouter.js');
const jobTitlesRouter = require('./routes/jobTitlesRouter.js');
const teamsRouter = require('./routes/teamsRouter.js');
const usersRouter = require('./routes/usersRouter.js');

// Настройка Swagger
const file = fs.readFileSync(path.join(__dirname, 'swagger.yml'), 'utf8');
const swaggerDocument = YAML.parse(file);
mainAPI.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API входа пользователя (отправка куки)
mainAPI.post('/login', loginUser);

// API выхода пользователя из аккаунта
mainAPI.get('/logout', (req, res) => {
    res.locals.tokenData = {};
    res.clearCookie('jwt');
    res.clearCookie('isTeamleader');
    res.clearCookie('isAdmin');
    res.redirect('/login');
});

mainAPI.get('/', (req, res) => {
    res.send("Main API work");
});

// Проверка авторизации на всех роутах
mainAPI.use(validator.isLogged);

mainAPI.use('/feedbacks', feedbacksRouter);
mainAPI.use('/hardskills', hardSkillsRouter);
mainAPI.use('/hardskilltests', hardSkillTestsRouter);
mainAPI.use('/jobhardskills', jobHardSkillsRouter);
mainAPI.use('/jobtitles', jobTitlesRouter);
mainAPI.use('/teams', teamsRouter);
mainAPI.use('/users', usersRouter);

mainAPI.use((req, res) => {
    res.status(404).send();
})

module.exports = mainAPI