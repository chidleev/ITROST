const questions = document.querySelectorAll('.question');
const answers = document.querySelectorAll('.answer');

for (const question of questions) {
    question.addEventListener('click', (e) => {
        const answer = document.getElementById('answered-'+e.target.innerText);
        const questionsBarHeight = document.getElementById('questions').getBoundingClientRect().height;
        const answerInfoHeight = document.getElementById('answer-info').getBoundingClientRect().height;
        window.scrollTo({
            top: answer.getBoundingClientRect().y + window.scrollY - (window.screen.orientation.type.includes('landscape') ? questionsBarHeight + 5 : questionsBarHeight + answerInfoHeight + 10),
            behavior: 'smooth'
        });
        document.querySelector('.question.active')?.classList.remove('active');
        e.target.classList.add('active');
        document.querySelector('.answer.active')?.classList.remove('active');
        answer.classList.add('active');
        showAnswerInfo(answer);
    })
}

for (const answer of answers) {
    if (answer.classList.contains('answered')) {
        answer.addEventListener('click', (e) => {
            const question = document.getElementById('question-'+answer.id);
            document.getElementById('questions').scrollTo({
                left: question.getBoundingClientRect().x + document.getElementById('questions').scrollLeft - 5,
                behavior: 'smooth'
            })
            document.querySelector('.question.active')?.classList.remove('active');
            question.classList.add('active');
            document.querySelector('.answer.active')?.classList.remove('active');
            answer.classList.add('active');
            showAnswerInfo(answer);
        })
    }
}

var answerInfo, infoContent;

function showAnswerInfo(answerElement) {
    infoContent = document.getElementById('info-content')
    infoContent.removeAttribute('hidden');
    document.getElementById('info-alltest').setAttribute('hidden', true);
    answerInfo = document.getElementById(answerElement.id+'-info');
    
    infoContent.childNodes[1].textContent = 'Тип вопроса: ' + answerInfo.childNodes[0].textContent;

    if (answerInfo.childNodes[1].textContent) {
        infoContent.childNodes[0].setAttribute('src', answerInfo.childNodes[1].textContent);
        infoContent.childNodes[0].removeAttribute('hidden');
    } else {
        infoContent.childNodes[0].setAttribute('hidden', true);
    }

    if (answerInfo.childNodes[2]?.textContent) {
        infoContent.childNodes[4].textContent = 'Точное соответствие: ' + answerInfo.childNodes[2]?.textContent ?? null;
        infoContent.childNodes[4].removeAttribute('hidden');
    } else {
        infoContent.childNodes[4].setAttribute('hidden', true);
    }
    
    infoContent.childNodes[5].textContent = 'Вес вопроса: ' + answerInfo.childNodes[3].textContent;

    var userAnswerArray = JSON.parse(answerInfo.childNodes[4].textContent);
    switch (answerInfo.childNodes[0].textContent) {
        case 'select': 
            infoContent.childNodes[3].innerHTML = `
                <span>Ответ пользователя: </span>
                <span>${userAnswerArray.join('</span><span>')}</span>
            `
            break;
        case 'compare': 
            userAnswerArray.sort((a, b) => a.promptID - b.promptID)
            userAnswerArray = userAnswerArray.map(pair => {
                return pair.promptID + ' – ' + pair.answerID
            })
            infoContent.childNodes[3].innerHTML = `
                <span>Ответ пользователя: </span>
                <span>${userAnswerArray.join('</span><span>')}</span>
            `
            break;
        case 'detailed': 
            infoContent.childNodes[3].innerHTML = `
                <span>Ответ пользователя: </span>
                <div>${userAnswerArray[0] ?? '<ответ не указан>'}</div>
            `
            break;
        case 'selfrate':
            infoContent.childNodes[3].innerHTML = `
                <span>Самооценка пользователя: ${userAnswerArray[0].answer}<br>Пояснение: </span>
                <div>${userAnswerArray[0].explanation ?? '<без пояснения>'}</div>
            `
            break;
    }

    if (answerInfo.childNodes[5]?.textContent) {
        infoContent.childNodes[6].innerHTML = '<div>Коэффициент корректности: ' + (answerInfo.childNodes[5]?.textContent ?? 0) + '</div><div class="button" ' + ((/true/).test(answerInfo.childNodes[6]?.textContent ?? '')? 'disabled=true' : 'onclick="changeScore()"') + ' >Изменить</div>';
        infoContent.childNodes[6].removeAttribute('hidden');
    } else {
        infoContent.childNodes[6].setAttribute('hidden', true);
    }
    
    if (answerInfo.childNodes[6]?.textContent) {
        infoContent.childNodes[7].textContent = 'Статус автоматической проверки ответа: ' + ((/true/).test(answerInfo.childNodes[6]?.textContent ?? '')? 'удачно' : 'неудачно');
        infoContent.childNodes[7].removeAttribute('hidden');
    } else {
        infoContent.childNodes[7].setAttribute('hidden', true);
    }

    if (answerInfo.childNodes[7]?.textContent) {
        infoContent.childNodes[2].textContent = 'Ожидаемый ответ: ' + answerInfo.childNodes[7].textContent;
        var expectedAnswer = JSON.parse(answerInfo.childNodes[7].textContent);
        switch (answerInfo.childNodes[0].textContent) {
            case 'select': 
                infoContent.childNodes[2].innerHTML = `
                    <span>Ожидаемый ответ: </span>
                    <span>${expectedAnswer.join('</span><span>')}</span>
                `
                break;
            case 'compare': 
                expectedAnswer = expectedAnswer.map(pair => {
                    return pair.ID + ' – ' + pair.correctAnswerID
                })
                infoContent.childNodes[2].innerHTML = `
                    <span>Ожидаемый ответ: </span>
                    <span>${expectedAnswer.join('</span><span>')}</span>
                `
                break;
            case 'detailed': 
                infoContent.childNodes[2].innerHTML = `
                    <span>Ожидаемый ответ: </span>
                    <div>${expectedAnswer.join('</div><div>')}</div>
                `
                break;
        }
        infoContent.childNodes[2].removeAttribute('hidden');
    } else {
        infoContent.childNodes[2].setAttribute('hidden', true);
    }
}

function hideAnswerInfo() {
    document.querySelector('.question.active')?.classList.remove('active');
    document.querySelector('.answer.active')?.classList.remove('active');
    document.getElementById('info-content').setAttribute('hidden', true);
    document.getElementById('info-alltest').removeAttribute('hidden');
}

const answerFilters = [];

new MultiSelect('#answer-search', {
    data: [{
        value: 'answered',
        text: 'Окончательные ответы'
    },{
        value: 'unanswered',
        text: 'Промежуточные ответы'
    },{
        value: 'success',
        text: 'Удачно проверенные'
    },{
        value: 'failed',
        text: 'Неудачно проверенные'
    }],
    placeholder: 'Поиск по ответам',
    search: false,
    selectAll: true,
    listAll: false,
    onSelect: function(value, text, element) {
        answerFilters.push(value);
        updateAnswers();
    },
    onUnselect: function(value, text, element) {
        answerFilters.splice(answerFilters.indexOf(value), 1)
        updateAnswers();
    }
});

function updateAnswers() {
    for (const answer of answers) {
        if (answerFilters.every(filter => { return answer.classList.contains(filter) })) {
            answer.removeAttribute('hidden');
        } else {
            answer.setAttribute('hidden', true);
        }
    }
}

function changeScore() {
    let score = parseFloat(prompt("Введите новый коэффициент корректности ответа [0;1]", '0').replace(',', '.'));
    if (isNaN(score) || score < 0 || score > 1) alert('Некорректный коэффициент');
    else {
        let question_active = document.querySelector('.question.active');
        let answer_active = document.querySelector('.answer.active');
        if (question_active && answer_active) {
            const path = window.location.pathname.split('/').splice(0, 4).join('/') + '/change-score';
            axios.patch(path, {
                questionID: question_active.textContent,
                newScore: score
            }).then(result => {
                answer_active.classList.add('success');
                answer_active.classList.remove('failed');
                infoContent.childNodes[6].innerHTML = '<div>Коэффициент корректности: ' + score + '</div><div class="button" onclick="changeScore()">Изменить</div>';
                answerInfo.childNodes[5].textContent = score.toString();
            }).catch(error => {
                alert('Не удалось изменить коэффициент');
                answer_active.classList.add('failed');
                answer_active.classList.remove('success');
                console.log(error);
            })
        }
    }
}

function deleteResult() {
    if (confirm('Вы уверены, что хотите удалить прохождение?')) {
        const path = window.location.pathname.split('/').splice(0, 4).join('/');
        axios({
            method: 'delete',
            url: path
        }).then(result => {
            alert('Результаты прохождения удалены');
            window.location.replace('/testsystem/results');
        }).catch(error => {
            alert('Не удалось удалить прохождение');
            console.log(error);
        })
    }
}

function verifyResult() {
    const path = window.location.pathname.split('/').splice(0, 4).join('/');
    axios({
        method: 'patch',
        url: path
    }).then(result => {
        alert('Результаты прохождения подтверждены');
        document.getElementById('info-alltest').children[1].setAttribute('hidden', null);
    }).catch(error => {
        alert('Не удалось подтвердить прохождение');
        console.log(error);
    })
}