const validator = require('validator');

module.exports.hardSkillTestInfoJSON = function (infoJSON) {
    const errorsArray = [];

    if (!validator.isBoolean(infoJSON?.canChangeChoice + '' ?? "")) {
        errorsArray.push("Некорректное поле 'canChangeChoice', невозможно создать тест");
    }

    if (!validator.isBoolean(infoJSON?.canSkipQuestions + '' ?? "")) {
        errorsArray.push("Некорректное поле 'canSkipQuestions', невозможно создать тест");
    }
    
    if (!validator.isBoolean(infoJSON?.shuffling + '' ?? "")) {
        errorsArray.push("Некорректное поле 'shuffling', невозможно создать тест");
    }

    if (!validator.isNumeric(infoJSON?.timeLimit + '' ?? "") || infoJSON.timeLimit < 0) {
        errorsArray.push("Некорректное поле 'timeLimit', невозможно создать тест");
    }
    
    if (infoJSON?.scoreMap?.length < 1) {
        errorsArray.push("Список уровней результатов теста пуст, невозможно создать тест");
    }

    return errorsArray;
}

module.exports.hardSkillTestQuestionsJSON = function (questionsJSON) {
    const errorsArray = [];

    if (!questionsJSON.length) {
        errorsArray.push("Не указаны вопросы для теста");
    }
    else {
        questionsJSON.forEach(question => {
            let error = `Впрос №${question?.ID}: `;

            if (!validator.isNumeric(question?.weight + '' ?? "") || question.weight < 0) {
                errorsArray.push(error + "Некорректное поле 'weight'");
            }

            if (validator.isEmpty(question?.text + '' ?? "")) {
                errorsArray.push(error + "Отсутствует текст вопроса")
            }

            switch (question.type) {
                case 'select':
                    if (!validator.isBoolean(question?.exactMatch + '' ?? "")) {
                        errorsArray.push(error + "Некорректное поле 'exactMatch'");
                    }
        
                    if (question?.correctAnswerID?.length < 1) {
                        errorsArray.push(error + "Список верных ответов пуст");
                    }

                    if (question?.answers?.length < 1) {
                        errorsArray.push(error + "Список вариантов ответа пуст");
                    }
                    else {
                        question.answers.forEach(answer => {
                            if (validator.isEmpty(answer?.text + '' ?? "")) {
                                errorsArray.push(error + `Отсутствует текст ответа №${answer.ID}`)
                            }
                        });
                    }
                    break;

                case 'compare':
                    if (!validator.isBoolean(question?.exactMatch + '' ?? "")) {
                        errorsArray.push(error + "Некорректное поле 'exactMatch'");
                    }
        
                    if (question?.prompts?.length < 1) {
                        errorsArray.push(error + "Список промптов пуст");
                    }
                    else {
                        question.prompts.forEach(prompt => {
                            if (validator.isEmpty(prompt?.text + '' ?? "")) {
                                errorsArray.push(error + `Отсутствует текст промпта №${prompt.ID}`)
                            }

                            if (!validator.isNumeric(prompt?.correctAnswerID + '' ?? "") || prompt.correctAnswerID < 0) {
                                errorsArray.push(error + `Некорректное поле 'correctAnswerID' промпта №${prompt.ID}`);
                            }
                        });
                    }

                    if (question?.answers?.length < 1) {
                        errorsArray.push(error + "Список вариантов ответа пуст");
                    }
                    else {
                        question.answers.forEach(answer => {
                            if (validator.isEmpty(answer?.text + '' ?? "")) {
                                errorsArray.push(error + `Отсутствует текст ответа №${answer.ID}`)
                            }
                        });
                    }
                    break;

                case 'detailed':
                    if (!validator.isBoolean(question?.exactMatch + '' ?? "")) {
                        errorsArray.push(error + "Некорректное поле 'exactMatch'");
                    }
        
                    if (validator.isEmpty(question?.expectedAnswer + '' ?? "")) {
                        errorsArray.push(error + "Отсутствует ожидаемый ответ")
                    }
                    break;

                case 'selfrate':
                    if (!validator.isNumeric(question?.maxRate + '' ?? "") || question.maxRate < 0) {
                        errorsArray.push(error + "Некорректное поле 'maxRate'");
                    }
                    break;

                default:
                    errorsArray.push(error + `Неизвестный тип вопроса '${question.type}'`);
                    break;
            }
        });
    }

    return errorsArray;
}

module.exports.userProfiles = function (req) {
    const errorsArray = [];

    if (validator.isUUID(req.body?.jobTitleUUID + '' ?? "")) {
        errorsArray.push("Не указан UUID должности");
    }
    if (validator.isUUID(req.body?.userUUID + '' ?? "")) {
        errorsArray.push("Не указан UUID пользователя");
    }
    if (validator.isEmpty(req.body?.surname + '' ?? "")) {
        errorsArray.push("Отсутствует фамилия");
    }
    if (validator.isEmpty(req.body?.name + '' ?? "")) {
        errorsArray.push("Отсутствует имяя");
    }
    if (!validator.isDate(req.body?.birthday + '' ?? "")) {
        errorsArray.push("Введен некорректный день рождения");
    }
    if (!validator.isEmail(req.body?.mail + '' ?? "")) {
        errorsArray.push("Введена некорректная почта");
    }
    
    return errorsArray;
}