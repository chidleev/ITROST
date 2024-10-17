const cookieObject = new URLSearchParams(document.cookie.replaceAll("&", "%26").replaceAll("; ","&"));

var pageData = {
    content: new Proxy({ html: '' }, {
        set: function(target, prop, newValue, receiver) {
            const success = Reflect.set(...arguments);
            document.getElementById('content').innerHTML = newValue;
            sessionStorage.setItem('pageData', JSON.stringify(pageData));
            return success;
        }
    })
};

axios.get(`/testSystem/components`)
.then(response => {
    pageData.content.html = response.data.welcome;
    document.getElementById('questions').innerHTML = response.data.questions_bar;
    document.getElementById('timer').innerHTML = response.data.timer;
}).catch(error => {
    const errorHTML = `<div class="prohibition">${error.response.data}, сообщите об этой ошибке администраторам сайта через форму обратной связи</div>`;
    pageData.content.html = errorHTML;
})

const socket = io("https://it-rost.mooo.com", {
    autoConnect: false
});
const testUuid = new URLSearchParams(window.location.search).get('uuid');
var userAnswer = [];

if (Boolean(testUuid)) {
    socket.auth = {
        testUuid: testUuid
    }
    socket.connect();
}
else {
    alert('Не возможно начать тестирование, отсутствует идентификатор теста, сообщите об этой ошибке администраторам сайта через форму обратной связи. Данная страница будет закрыта.');
    window.close();
};

socket.on('test doesnt exist', () => {
    alert('Не возможно начать тестирование, тест с указанным UUID не найден, сообщите об этой ошибке администраторам сайта через форму обратной связи. Данная страница будет закрыта.');
    window.close();
});

socket.on('test session registered', () => {
    document.getElementById('start-test')?.removeAttribute('disabled');
});

socket.on('test session not registered', (error) => {
    console.log(error);
    alert('Не возможно начать тестирование, сессия не была зарегестрирована в системе, сообщите об этой ошибке администраторам сайта через форму обратной связи. Данная страница будет закрыта.');
    window.close();
});

function startTest() {
    document.getElementById('exit-test').removeAttribute('disabled');
    document.getElementById('exit-test').addEventListener('click', e => {
        if (confirm('Вы уверены, что хотите завершить тест?')) exitTest();
    });

    document.querySelectorAll('.question').forEach(question => {
        question.addEventListener('click', questionRequest);
    });
    document.querySelector('.question:first-child').classList.remove('inactive');
    document.querySelector('.question:first-child').dispatchEvent(new Event('click'));

    if (!document.getElementById('time').hasAttribute('active') && +document.getElementById('time').getAttribute('seconds') >= 60) {
        document.getElementById('time').setAttribute('active', '');
        document.getElementById('time').timeUpdater = setInterval(updateTimer, 1000);
    }

    socket.emit('start test', cookieObject.get('resultUuid'));
};

function questionRequest(e) {
    if (!e.target.classList.contains('inactive')) {
        const currentQuestion = document.querySelector('.question.active');
        if (currentQuestion) {
            socket.emit('save my answer', {
                questionNumber: currentQuestion.innerText,
                data: userAnswer,
                html: pageData.content.html
            })
            currentQuestion.classList.remove('active');
        }
        socket.emit('question request', e.target.innerText);
    }
};

socket.on('answer saved', (data) => {
    document.querySelector(`#question-${data.questionNumber}`)?.classList.add('answered');
    document.querySelectorAll('.question').forEach(question => {
        if (data.questionsSelection.includes(+question.innerText) || question.classList.contains('active')) {
            question.classList.remove('inactive');
        } else {
            question.classList.add('inactive');
        }
    });
});

socket.on('answer not saved', (data) => {
    if (data.error) {
        console.log(data.error);
        alert('Ой! Ответ на вопрос не удалось сохранить, сообщите об этой ошибке администраторам сайта через форму обратной связи.');
    }
    document.querySelector(`#question-${data.questionNumber}`)?.classList.remove('answered');
});

socket.on('question response', async (questionResponse) => {
    if (questionResponse.questionData) {
        userAnswer = questionResponse.questionData.userAnswer;
        if (false && questionResponse.questionData.html) {
            pageData.content.html = questionResponse.questionData.html;
            initializeQuestion(questionResponse.questionData.type);
        } else {
            try {
                const response = await axios.post('/testSystem/components/question', questionResponse.questionData);
                pageData.content.html = response.data;
                initializeQuestion(questionResponse.questionData.type);
            } catch (error) {
                console.log(error);
                const errorHTML = `<div class="prohibition">${error.response?.data ?? error}, сообщите об этой ошибке администраторам сайта через форму обратной связи</div>`;
                pageData.content.html = errorHTML;
            }
        }
        document.querySelector(`#question-${questionResponse.questionData.number}`)?.classList.add('active');
    }

    document.querySelectorAll('.question').forEach(question => {
        if (questionResponse.questionsSelection.includes(+question.innerText) || question.classList.contains('active')) {
            question.classList.remove('inactive');
        } else {
            question.classList.add('inactive');
        }
    });
});

function initializeQuestion(type) {
    switch (type) {
        case 'select':
            userAnswer.forEach(id => {
                document.getElementById('answer-'+id).classList.add('selected');
            })
            break;

        case 'compare':
            document.querySelectorAll('.prompt>select').forEach(selector => {
                selector.answerPair = userAnswer.find(pair => {
                    return pair.promptID == +selector.getAttribute('prompt');
                });

                if (selector.answerPair) {
                    selector.value = selector.answerPair.answerID;
                } else {
                    selector.answerPair = {
                        promptID: +selector.getAttribute('prompt'),
                        answerID: 0
                    }
                }

                selector.addEventListener('change', (e) => {
                    const pairIndex = userAnswer.indexOf(e.target.answerPair);
                    if (pairIndex > -1) {
                        userAnswer[pairIndex].answerID = +e.target.value;
                    } else {
                        selector.answerPair.answerID = +e.target.value;
                        userAnswer.push(selector.answerPair);
                    }
                });
            });
            break;

        case 'selfrate':
            const selfRator = document.querySelector('#question>input');
            selfRator.value = userAnswer[0]?.answer ?? "";
            selfRator.addEventListener('change', (e) => {
                if (userAnswer[0]) {
                    userAnswer[0].answer = +e.target.value;
                } else {
                    userAnswer[0] = {
                        answer: +e.target.value,
                        explanation: ""
                    }
                }
            });

            var textarea = document.querySelector('textarea');
            textarea.value = userAnswer[0]?.explanation ?? "";
            bindCodeEditorShortcutKeys(textarea);
            textarea.addEventListener('input', (e) => {
                if (userAnswer[0]) {
                    userAnswer[0].explanation = e.target.value;
                } else {
                    userAnswer[0] = {
                        answer: 0,
                        explanation: e.target.value
                    }
                }
            });
            textarea.focus();
            break;

        case 'detailed':
            var textarea = document.querySelector('textarea');
            textarea.value = userAnswer[0] ?? ""
            bindCodeEditorShortcutKeys(textarea);
            textarea.addEventListener('input', (e) => {
                userAnswer[0] = e.target.value;
            });
            textarea.focus();
            break;
    }
};

socket.on('timeout', () => {
    document.querySelectorAll('.question').forEach(question => {
        if (!question.classList.contains('active')) {
            question.classList.add('inactive');
        }
    })
    exitTest();
    alert('Время на прохождение теста вышло!');
});

async function exitTest() {
    window.removeEventListener('beforeunload', preventExit);
    
    const currentQuestion = document.querySelector('.question.active');
    if (currentQuestion) {
        socket.emit('save my answer', {
            questionNumber: currentQuestion.innerText,
            data: userAnswer,
            html: pageData.content.html
        })
        currentQuestion.classList.remove('active');
    }

    axios.post('/testSystem/results/save', { sessionID: socket.id })
    .then(response => {
        socket.disconnect();
        if (confirm('Результаты Вашего теста сохранены. Желаете оставить обратную связь по тесту? Если нет, страница будет закрыта')) {
            window.location.replace(`/testSystem/feedback`);
        } else {
            window.close();
        }
    })
    .catch(error => {
        socket.disconnect();
        console.log(error);
        alert(`Приносим наши извинения, но результаты Вашего теста не удалось сохранить по следующей причине:\n- ${error.response.data}\nНе беспокойтесь, результат не потерян и хранится во временном файле на сервере, сообщите об ошибке(-ах) администраторам сайта через форму обратной звязи`);
        window.location.replace(`/testSystem/feedback?sessionID=${socket.id}`);
    })
}

function selectThis(id, isMultipleSelect) {
    if (isMultipleSelect) {
        if (userAnswer.includes(id)) {
            userAnswer.splice(userAnswer.indexOf(id), 1);
            document.getElementById('answer-'+id).classList.remove('selected');
        } else {
            userAnswer.push(id);
            document.getElementById('answer-'+id).classList.add('selected');
        }
    }
    else {
        if (userAnswer.includes(id)) {
            userAnswer = [];
            document.getElementById('answer-'+id).classList.remove('selected');
        } else {
            document.getElementById('answer-'+userAnswer[0])?.classList.remove('selected');
            userAnswer = [id];
            document.getElementById('answer-'+id).classList.add('selected');
        }
    }
};

function toggleQuestion(step) {
    if (step == 0) {
        if (userAnswer.length > 0) {
            const currentQuestion = document.querySelector('.question.active');

            socket.emit('save my answer', {
                questionNumber: currentQuestion.innerText,
                data: userAnswer,
                html: pageData.content.html
            });

            currentQuestion.classList.remove('active');

            socket.once('answer saved', (data) => {
                const nextNumber = +currentQuestion.innerText + 1;
                if (nextNumber > 0 && nextNumber <= +document.querySelector('.question:last-child').innerText) {
                    const nextQuestion = document.querySelector(`#question-${nextNumber}`);
                    nextQuestion.dispatchEvent(new Event('click'));
                    document.getElementById('questions').scrollBy({
                        left: 60 * step,
                        behavior: "smooth"
                    });
                }
            });
        }
    } else {
        const nextNumber = +document.querySelector('.question.active')?.innerText + step;
        if (nextNumber > 0 && nextNumber <= +document.querySelector('.question:last-child').innerText) {
            const nextQuestion = document.querySelector(`#question-${nextNumber}`);
            if (nextQuestion.classList.contains('inactive')) {
                toggleQuestion(step + Math.sign(step));
            } else {
                nextQuestion.dispatchEvent(new Event('click'));
                document.getElementById('questions').scrollBy({
                    left: 60 * step,
                    behavior: "smooth"
                });
            }
        }
    }
};

function updateTimer() {
    const timer = document.getElementById('time');
    const seconds = timer.getAttribute('seconds') - 1;

    timer.setAttribute('seconds', seconds);
    timer.innerHTML = Math.floor(seconds / 60) + ':' + (seconds % 60).toString().padStart(2, '0');
    
    if (seconds < 60) timer.classList.add('prohibition');

    if (seconds <= 0) {
        clearInterval(timer.timeUpdater);
        timer.removeAttribute('active');
    }
};

function preventExit(event) {
    event.preventDefault();
    event.returnValue = true;
};

window.addEventListener('beforeunload', preventExit);