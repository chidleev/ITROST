var results = [];

var activeParameters = {
    FIOs: new Set(),
    skills: new Set(),
    levels: new Set(),
    schedules: new Set()
};

var FIOs = new Set(),
    skills = new Set(),
    levels = new Set(),
    schedules = new Set();

function init(data) {
    document.getElementById('main').innerHTML = data;

    results = document.querySelectorAll('.result');

    for (const result of results) {
        FIOs.add(result.childNodes[0].childNodes[1].childNodes[0].innerText);
        skills.add(result.childNodes[1].childNodes[1].childNodes[2].innerText);
        levels.add(result.childNodes[1].childNodes[2].childNodes[2].innerText);
        schedules.add(result.childNodes[0].childNodes[2].childNodes[0].textContent);
    }

    var fioSearchData = [],
        skillSearchData = [],
        levelSearchData = [],
        scheduledSearchData = [];

    for (const FIO of FIOs) { 
        fioSearchData.push({
            value: FIO,
            text: FIO
        });
    }

    for (const skill of skills) { 
        skillSearchData.push({
            value: skill,
            text: skill
        });
    }

    for (const level of levels) { 
        levelSearchData.push({
            value: level,
            text: level
        });
    }

    for (const schedule of schedules) { 
        scheduledSearchData.push({
            value: schedule,
            text: schedule
        });
    }

    new MultiSelect('#fio-search', {
        data: fioSearchData,
        placeholder: 'ФИО пользователя',
        search: true,
        selectAll: true,
        listAll: false,
        onSelect: function(value, text, element) {
            activeParameters.FIOs.add(value);
            updateResults(activeParameters);
        },
        onUnselect: function(value, text, element) {
            activeParameters.FIOs.delete(value);
            updateResults(activeParameters);
        }
    });

    new MultiSelect('#skill-search', {
        data: skillSearchData,
        placeholder: 'Навык',
        search: true,
        selectAll: true,
        listAll: true,
        onSelect: function(value, text, element) {
            activeParameters.skills.add(value);
            updateResults(activeParameters);
        },
        onUnselect: function(value, text, element) {
            activeParameters.skills.delete(value);
            updateResults(activeParameters);
        }
    });

    new MultiSelect('#level-search', {
        data: levelSearchData,
        placeholder: 'Результат',
        search: true,
        selectAll: true,
        listAll: true,
        onSelect: function(value, text, element) {
            activeParameters.levels.add(value);
            updateResults(activeParameters);
        },
        onUnselect: function(value, text, element) {
            activeParameters.levels.delete(value);
            updateResults(activeParameters);
        }
    });

    new MultiSelect('#scheduled-search', {
        data: scheduledSearchData,
        placeholder: 'Дата назначения',
        search: true,
        selectAll: true,
        listAll: false,
        onSelect: function(value, text, element) {
            activeParameters.schedules.add(value);
            updateResults(activeParameters);
        },
        onUnselect: function(value, text, element) {
            activeParameters.schedules.delete(value);
            updateResults(activeParameters);
        }
    });
}

function updateResults() {
    for (const result of results) {
        if (   (!activeParameters.FIOs.size || activeParameters.FIOs.has(result.childNodes[0].childNodes[1].childNodes[0].innerText))
            && (!activeParameters.skills.size || activeParameters.skills.has(result.childNodes[1].childNodes[1].childNodes[2].innerText))
            && (!activeParameters.levels.size || activeParameters.levels.has(result.childNodes[1].childNodes[2].childNodes[2].innerText))
            && (!activeParameters.schedules.size || activeParameters.schedules.has(result.childNodes[0].childNodes[2].childNodes[0].textContent))) {
            result.removeAttribute('hidden');
        } else {
            result.setAttribute('hidden', true);
        }
    }
}

axios.get('/testsystem/results/all-html')
.then(response => {
    init(response.data);
})
.catch(error => {
    document.getElementById('main').innerHTML = error.message;
})


document.getElementById('verified').addEventListener('click', e => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) {
        axios.get('/testsystem/results/all-html?verified=0')
        .then(response => {
            init(response.data);
        })
        .catch(error => {
            document.getElementById('main').innerHTML = error.message;
        })
    } else {
        axios.get('/testsystem/results/all-html')
        .then(response => {
            init(response.data);
        })
        .catch(error => {
            document.getElementById('main').innerHTML = error.message;
        })
    }
})

function deleteResult(UUID) {
    if (confirm('Вы уверены, что хотите удалить прохождение?')) {
        axios({
            method: 'delete',
            url: '/testsystem/results/'+UUID
        }).then(result => {
            alert('Результаты прохождения удалены');
            window.location.reload();
        }).catch(error => {
            alert('Не удалось удалить прохождение');
            console.log(error);
        })
    }
}