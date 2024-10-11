const fs = require('fs');
const path = require('path');

module.exports = ({ filename = '' , errorsArray = [], requestObject = {}, errorObject = {}, logsDir = '' }) => {
    const onlyFilename = filename.split('/')[filename.split('/').length-1].split('.')[0];
    const logFilePath = path.join(logsDir, onlyFilename+'.txt');
    
    const logMessage =  `[${new Date().toISOString()}]\n${filename}:\n` +
                        `METHOD: ${requestObject.method}\n` +
                        `URL: ${requestObject.url}\n` +
                        `BASE URL: ${requestObject.baseUrl}\n` +
                        `MESSAGES: ${errorsArray?.length ? '\n\t- '+errorsArray.join('\n\t- ') : 'EMPTY'}\n` +
                        `OTHER ERROR INFO: ${errorObject ? '\n'+JSON.stringify(errorObject, null, 4) : 'EMPTY'}\n\n`;

    // Добавление записи в файл
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Ошибка при записи логов.', err);
        }
    });
}