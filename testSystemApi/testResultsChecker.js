const validator = require('validator')

const { G4F } = require("g4f");
const g4f = new G4F();
const g4fOptions = {
    provider: g4f.providers.Bing,
    model: 'gpt-4',
    debug: true,
    retry: {
        times: 3,
        condition: (text) => {
            const words = text.split(" ");
            if (words.length == 2 && validator.isNumeric(words[0]) && validator.isNumeric(words[1])) return true
            else return false;
        }
    }
}

module.exports = async function runTestResultsChecker(answerData) {
    const resultObjectData = {
        answersHistory: [],
        unviewedQuestions: [],
        startAt: answerData.startTime,
        endAt: "",
        elapsedTime: 0,
        maxScore: 0,
        userScore: 0,
        maxSelfrate: 0,
        userSelfrate: 0,
        shuffling: answerData.info.shuffling,
        timeLimit: answerData.info.timeLimit,
        canChangeChoice: answerData.info.canChangeChoice,
        canSkipQuestions: answerData.info.canSkipQuestions,
        questionsCount: answerData.questions.length
    }
    
    for (var questionData of answerData.questions) {
        const questionAnswersHistory = Object.entries(questionData.answersHistory ?? {});
        if (questionAnswersHistory.length) {
            for (var [key, userAnswerArray] of questionAnswersHistory) {
                resultObjectData.answersHistory.push({
                    leftAt: key,
                    userAnswerArray: userAnswerArray,
                    ID: questionData.ID,
                    type: questionData.type,
                    text: questionData.text,
                    image: questionData.image,
                    exactMatch: questionData.exactMatch,
                    weight: questionData.weight
                })
            }
    
            var lastAnswer = resultObjectData.answersHistory.slice(-1)[0];
    
            switch (lastAnswer.type) {
                case 'select': 
                    lastAnswer.correctAnswers = questionData.correctAnswerID;
                    lastAnswer.score = checkSelectAnswer(questionData) * questionData.weight;
                    lastAnswer.autoCheckSuccess = true;
                    resultObjectData.maxScore += questionData.weight;
                    resultObjectData.userScore += lastAnswer.score;
                    break;
                case 'compare': 
                    lastAnswer.prompts = questionData.prompts;
                    lastAnswer.answers = questionData.answers;
                    lastAnswer.score = checkCompareAnswer(questionData) * questionData.weight;
                    lastAnswer.autoCheckSuccess = true;
                    resultObjectData.maxScore += questionData.weight;
                    resultObjectData.userScore += lastAnswer.score;
                    break;
                case 'detailed': 
                    lastAnswer.expectedAnswers = questionData.expectedAnswers;
                    lastAnswer.score = await checkDetailedAnswer(questionData) * questionData.weight;
                    lastAnswer.autoCheckSuccess = questionData.autoCheckSuccess;
                    resultObjectData.maxScore += questionData.weight;
                    resultObjectData.userScore += lastAnswer.score;
                    break;
                case 'selfrate':
                    resultObjectData.maxSelfrate += questionData.weight;
                    resultObjectData.userSelfrate += questionData.lastAnswer?.[0]?.answer ?? 0;
                    break;
            }
        } else {
            resultObjectData.unviewedQuestions.push({
                ID: questionData.ID,
                type: questionData.type,
                text: questionData.text,
                image: questionData.image
            })

            switch (questionData.type) {
                case 'select':
                case 'compare':
                case 'detailed':
                    resultObjectData.maxScore += questionData.weight;
                    break;
                case 'selfrate':
                    resultObjectData.maxSelfrate += questionData.weight;
                    break;
            }
        }
    }
    
    resultObjectData.answersHistory.sort((a, b) => Date.parse(a.leftAt) - Date.parse(b.leftAt));
    resultObjectData.endAt = resultObjectData.answersHistory.slice(-1)[0].leftAt;
    resultObjectData.elapsedTime = (Date.parse(resultObjectData.endAt) - Date.parse(resultObjectData.startAt)) / 1000;

    const levelUUID = answerData.info.scoreMap.find(level => level.max >= (100 * resultObjectData.userScore / resultObjectData.maxScore)).resultUUID;

    return {
        result: resultObjectData,
        levelUUID: levelUUID,
    };
}

function checkSelectAnswer(questionData) {
    if (!questionData.lastAnswer?.length) return 0;

    if (questionData.exactMatch) {
        for (var correctAnswerID of questionData.correctAnswerID) {
            var index = questionData.lastAnswer.indexOf(correctAnswerID);
            if (!(index + 1)) return 0;
            questionData.lastAnswer.splice(index, 1);
        }
        if (questionData.lastAnswer.length) return 0;
        return 1;
    } else {
        const correctAnswers = [], wrongAnswers = [];
        for (var answerID of questionData.lastAnswer) {
            var index = questionData.correctAnswerID.indexOf(answerID);
            if (index + 1) correctAnswers.push(answerID);
            else wrongAnswers.push(answerID);
        }
        const correctAnswersFactor = correctAnswers.length / questionData.correctAnswerID.length;
        const wrongAnswersFactor = (questionData.answers.length - questionData.correctAnswerID.length - wrongAnswers.length + 1) / (questionData.answers.length - questionData.correctAnswerID.length + 1);
        return correctAnswersFactor * wrongAnswersFactor;
    }
};

function checkCompareAnswer(questionData) {
    if (!questionData.lastAnswer?.length) return 0;

    if (questionData.exactMatch) {
        for (var prompt of questionData.prompts) {
            var index = questionData.lastAnswer.indexOf({
                promptID: prompt.ID,
                answerID: prompt.correctAnswerID
            });
            if (!(index + 1)) return 0;
            questionData.lastAnswer.splice(index, 1);
        }
        if (questionData.lastAnswer.length) return 0;
        return 1;
    } else {
        const correctAnswers = [], wrongAnswers = [];
        for (var answer of questionData.lastAnswer) {
            var index = questionData.prompts.findIndex(prompt => prompt.ID == answer.promptID && prompt.correctAnswerID == answer.answerID);
            if (index + 1) correctAnswers.push(answer);
            else wrongAnswers.push(answer);
        }
        const correctAnswersFactor = correctAnswers.length / questionData.prompts.length;
        const wrongAnswersFactor = (questionData.prompts.length - wrongAnswers.length + 1) / (questionData.prompts.length + 1);
        return correctAnswersFactor * wrongAnswersFactor;
    }
};

async function checkDetailedAnswer(questionData) {
    questionData.autoCheckSuccess = true;

    if (!questionData.lastAnswer?.length) return 0;

    if (questionData.exactMatch) {
        if (questionData.expectedAnswers.includes(questionData.lastAnswer[0])) return 1;
        else return 0;
    } else {
        const messages = [
            { role: "user", content:  `Answer strictly with two numbers separated by a space without any words.` +
                                    `\nNumber type: float.` +
                                    `\nBoth numbers between 0.0 and 1.0 inclusive.` +
                                    `\nThe first number should reflect how correct the user's answer is, 0.0 - wrong, 1.0 - correct.` +
                                    `\nThe second number should reflect how much the user's answer matches the expected answer in meaning, 0.0 - the answer has nothing in common in meaning with the expected answer, 1.0 - the answer is similar in meaning to the expected answer.` +
                                    `\nQuestion asked: "${questionData.text}"` +
                                    `\nExpected answer: "${questionData.expectedAnswers[0]}"` +
                                    `\nUser's answer: "${questionData.lastAnswer[0]}"`
            }
        ];
        
        const results = [];
        var requestsCount = process.env.DETAILED_ANSWERS_CHECKER_RETRIES;
        try {
            for (var i = 0; i < requestsCount; i++)
                results.push(await g4f.chatCompletion(messages, g4fOptions));

            var averageCorrectFactor = 0, averageSimilarMeaningFactor = 0;

            for (var result of results) {
                const factors = result.split(' ');
                if (factors.length == 2) {
                    averageCorrectFactor += (+factors[0]);
                    averageSimilarMeaningFactor += (+factors[1]);
                } else {
                    requestsCount -= 1;
                }
            };

            if (requestsCount) {
                averageCorrectFactor /= requestsCount;
                averageSimilarMeaningFactor /= requestsCount;

                console.log(`\nQuestion asked: "${questionData.text}"`,
                            `\nExpected answer: "${questionData.expectedAnswers[0]}"`,
                            `\nUser's answer: "${questionData.lastAnswer[0]}"`,
                            `\nCorrect Factor: ${averageCorrectFactor}`,
                            `\nSimilar Meaning Factor: ${averageSimilarMeaningFactor}`);
                
                return averageCorrectFactor * averageSimilarMeaningFactor;
            } else {
                questionData.autoCheckSuccess = false;
                return 0;
            }
        } catch (error) {
            console.log(error);
            questionData.autoCheckSuccess = false;
            return 0;
        }
    }
};
