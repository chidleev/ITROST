const { Server } = require("socket.io");
const jsonFile = require("jsonfile");
const path = require("path");
const fs = require("fs");

const hardSkillTests = require('../../database').HardSkillTests;
const hardSkillTestResults = require('../../database').HardSkillTestResults;

const runTestResultsChecker = require('../testResultsChecker');

module.exports.initialize = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.HOST,
        }
    });

    io.use((socket, next) => {
        socket.testUuid = socket.handshake.auth.testUuid;
        socket.filePath = path.join(__dirname, '..', 'tmpUserResults', `${socket.id}.json`);
        jsonFile.readFile(socket.filePath)
        .then(result => {
            socket.test = result;
            next();
        }).catch(error => {
            next(); //при первом заходе выскакивает ошибка что файла нет, и это так, ведь он создастся дальше
        })
    });

    io.on('connect', (socket) => {
        //добавить проверку, что тест действительно назначен
        hardSkillTests.findByPk(socket.testUuid).then(result => {
            if (result) {
                if (result.infoJSON.shuffling) {
                    result.questionJSON = shuffle(result.questionJSON);
                }
                
                socket.test = {
                    info: {
                        UUID: result.UUID,
                        name: result.name,
                        description: result.description,
                        skillUUID: result.skillUUID,
                        ...result.infoJSON
                    },
                    questions: result.questionJSON,
                    questionsSelection: result.infoJSON.canSkipQuestions? Array.from(result.questionJSON, (_, i) => i + 1) : [1],
                    startTime: "",
                    userReview: ""
                };
        
                jsonFile.writeFile(socket.filePath, socket.test, { spaces: 4 }) //вот здесь создается тот файл и ошибки больше нет
                .then(() => {
                    return registerEvents(socket);
                })
                .then(() => {
                    socket.emit('test session registered');
                })
                .catch(error => {
                    socket.emit('test session not registered', error);
                });
            } else {
                socket.emit('test doesnt exist');
            }
        });
    });
};

function registerEvents(socket) {
    return new Promise((resolve, reject) => {
        socket.once('start test', (resultUuid) => {
            if (socket.test.info.timeLimit >= 60) {
                setTimeout(() => {
                    socket.emit('timeout');
                }, socket.test.info.timeLimit * 1000);
            }
            socket.test.startTime = (new Date).toISOString();
            socket.test.resultUUID = resultUuid;
            jsonFile.writeFile(socket.filePath, socket.test, { spaces: 4 })
        });
    
        socket.on('question request', (questionNumber) => {
            const response = {
                questionData: null,
                questionsSelection: socket.test.questionsSelection
            };
            
            var question = {};
            try {
                question = socket.test.questions[+questionNumber - 1];
            } catch (error) {
                socket.emit('question response', response);
                return;
            }
            
            if (socket.test.questionsSelection.includes(+questionNumber)) {
                response.questionData = {
                    number: +questionNumber,
                    type: question.type,
                    text: question.text,
                    image: question.image,
                    canSkipQuestion: socket.test.info.canSkipQuestions ||  question.lastAnswer?.length,
                    canChangeChoice: (socket.test.info.canChangeChoice) && (socket.test.info.canSkipQuestions || +questionNumber == Math.max(...socket.test.questionsSelection)),
                    userAnswer: question.lastAnswer ?? [],
                    html: question.html
                }
    
                switch (question.type) {
                    case 'select':
                        response.questionData.multipleSelect = question.correctAnswerID.length > 1;
                        response.questionData.answers = question.answersShuffling? shuffle(question.answers) : question.answers;
                        break;
                
                    case 'compare':
                        response.questionData.prompts = [];
                        question.prompts.forEach(prompt => {
                            response.questionData.prompts.push({
                                ID: prompt.ID,
                                text: prompt.text,
                                image: prompt.image
                            })
                        });
                        response.questionData.prompts = question.promptsShuffling? shuffle(response.questionData.prompts) : response.questionData.prompts;
                        response.questionData.answers = question.answersShuffling? shuffle(question.answers) : question.answers;
                        break;
                
                    case 'detailed':
                        //ничего специфичного для этого типа вопросов
                        break;
                
                    case 'selfrate':
                        response.questionData.weight = question.weight;
                        break;
                }
    
                socket.emit('question response', response);
            } else {
                socket.emit('question response', response);
            }
        });
    
        socket.on('save my answer', (answer) => {
            var question = {};
            try {
                question = socket.test.questions[answer.questionNumber - 1];
            } catch (error) {
                socket.emit('answer not saved', {
                    questionNumber: answer.questionNumber,
                    error: error
                });
                return;
            }
    
            if  (socket.test.questionsSelection.includes(+answer.questionNumber) && 
                (socket.test.info.canChangeChoice || !question.lastAnswer?.length)) 
            {
                question.html = answer.html;
                question.lastAnswer = answer.data;
    
                question.answersHistory = {
                    ...question.answersHistory,
                };
                const timeStamp = new Date().toISOString();
                question.answersHistory[timeStamp] = answer.data;
    
                if ((!socket.test.info.canChangeChoice && question.lastAnswer?.length) || (!socket.test.info.canSkipQuestions && +answer.questionNumber != Math.max(...socket.test.questionsSelection))) {
                    socket.test.questionsSelection.splice(socket.test.questionsSelection.indexOf(+answer.questionNumber), 1);
                }
    
                if (!socket.test.info.canSkipQuestions && question.lastAnswer?.length) {
                    const nextNumber = Math.min(+answer.questionNumber + 1, socket.test.questions.length);
                    if (!socket.test.questionsSelection.includes(nextNumber)) {
                        socket.test.questionsSelection.push(nextNumber);
                    }
    
                    if (socket.test.questionsSelection.length > 2) {
                        socket.test.questionsSelection.splice(socket.test.questionsSelection.indexOf(Math.min(...socket.test.questionsSelection)), 1);
                    }
                }
    
                jsonFile.writeFile(socket.filePath, socket.test, { spaces: 4 }).then(() => {
                    if (answer.data.length)
                        socket.emit('answer saved', {
                            questionNumber: +answer.questionNumber,
                            questionsSelection: socket.test.questionsSelection
                        });
                    else
                        socket.emit('answer not saved', {
                            questionNumber: +answer.questionNumber,
                            error: null
                        });
                }).catch(error => {
                    socket.emit('answer not saved', {
                        questionNumber: +answer.questionNumber,
                        error: error
                    });
                });
            }
        });
    
        socket.on('disconnect', (reason) => {
            if (reason != 'client namespace disconnect') {
                fs.unlinkSync(socket.filePath);
                if (socket.test.resultUUID) {
                    runTestResultsChecker(socket.test)
                    .then(data => {
                        data.result.disconnectReason = reason;
                        hardSkillTestResults.update({
                            answerJSON: data.result,
                            totalScore: data.result.userScore.toFixed(2),
                            resultLevelUUID: data.levelUUID
                        },{
                            where: {
                                UUID: socket.test.resultUUID
                            }
                        })
                    })
                }
            }
        });

        resolve();
    })
}

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}