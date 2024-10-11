const multer = require('multer');
const path = require('path');

const PHOTO_SIZE = Number(process.env.PHOTO_SIZE);


// ОБЩИЕ НАСТРОЙКИ:

// Проверка файлов на фото/иное
const photoFilter = function (req, file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Invalid file type, only JPEG and PNG is allowed!');
    }
}
// Обработка ошибки загрузки Multer-ом
module.exports.errorHandler = function (error, req, res, next) {
    if (error) {
        res.locals.multerError = error;
    }
    else {
        res.locals.multerError = null;
    }
    next()
}

// ЧАСТНЫЕ НАСТРОЙКИ:

// Конфигурация хранилища для ./public/userSite/static/img/profiles
const profilePhotoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('public/userSite/static/img/profiles'));
    },
    filename: function (req, file, cb) {
        cb(null, req.body.userUUID + path.extname(file.originalname));
    }
});
// Настройка Multer загрузчика для фотографий профиля
module.exports.profilePhotoUploader = multer({
    storage: profilePhotoStorage,
    limits: { fileSize: PHOTO_SIZE },
    fileFilter: photoFilter
}).single('photo');

// Конфигурация хранилища для ./public/userSite/static/img/feedbacks
const feedbackPhotoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('public/userSite/static/img/feedbacks'));
    },
    filename: function (req, file, cb) {
        cb(null, 'temp' + path.extname(file.originalname));
    }
});
// Настройка Multer загрузчика для фотографий профиля
module.exports.feedbackPhotoUploader = multer({
    storage: feedbackPhotoStorage,
    limits: { fileSize: PHOTO_SIZE },
    fileFilter: photoFilter
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'prevUUID', maxCount: 1 },
    { name: 'message', maxCount: 1 }
]);