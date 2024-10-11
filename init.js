// Подключение библиотек
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var pug = require('pug');
var logger = require('morgan');
require('dotenv').config()

var favicon = require('serve-favicon');

// Подключение роутов
var mainAPI = require('./APIs/mainAPI');
var testSystemApi = require('./testSystemApi/httpHandlers');
var competencyMatrixApi = require('./competencyMatrixApi');
var validator = require('./APIs/validators');

// Создание Express-приложения
var init = express();

init.use(logger('dev'));
init.use(express.json());
init.use(express.urlencoded({ extended: true }));
init.use(cookieParser(process.env.COOKIE_SECRET_KEY));

init.use((req, res, next) => {
    res.locals.logsDir = path.join(__dirname, 'logs');
    res.locals.rootDir = __dirname;
    next();
});

init.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
init.use('/background.jpg', express.static(path.join(__dirname, 'public', 'background.jpg')));

// Первичная проверка куки
init.use(validator.checkCookieToken);

// Страница входа и обращение к API входа
init.get('/login', (req, res) => {
    const result = validator.verificationAccess(res.locals.tokenData, 'user');
    if (result.status == 200) {
        res.redirect('/profile');
    }
    else {
        res.send(pug.renderFile(path.join(res.locals.rootDir, 'public', 'userSite', 'login.pug')));
    }
});

// Настройка роутов API
init.use('/api', mainAPI);

// Проверка авторизации на всех роутах
init.use(validator.isLogged);

/*указываем главному приложению сервера искать и отправлять файлы по запросу типа 
'/scripts/directory/files.type' из папки 'node_modules', находящейся в папке проекта*/
init.use('/script', express.static(path.join(__dirname, 'node_modules')));

init.use('/testsystem', testSystemApi);
init.use('/competency-matrix', competencyMatrixApi);

/*указываем главному приложению сервера переписывать все остальные запросы не файлов
в запросы типа '/', что необходимо для реализации работы SPA*/
init.use((req, res, next) => {
    if (req.url.indexOf('.') == -1) {
        req.url = '/';
    }
    next();
});
  
init.use('/static', express.static(path.join(__dirname, 'public', 'userSite', 'static')));
  
init.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'userSite', 'index.html'));
});

// catch 404 and forward to error handler
init.use((req, res, next) => {
    res.status(404).send();
});

/* error handler
init.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json(err);
});*/

module.exports = init;
