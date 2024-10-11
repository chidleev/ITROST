// Экспортируем настройки подключения
module.exports = {
    HOST:     'mysql7.serv00.com',
    PORT:     3306,
    USER:     'm6248_dielve',
    PASSWORD: process.env.DATABASE_PASSWORD,
    DB:       'm6248_it_rost',
    DIALECT:  'mysql'
};