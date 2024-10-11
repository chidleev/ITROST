const matrix = document.getElementById('main');
matrix.mousedown = 0;

matrix.addEventListener('mousedown', (e) => {
    matrix.mousedown = 1;
});

window.addEventListener('mouseup', (e) => {
    matrix.mousedown = 0;
});

matrix.addEventListener('mousemove', (e) => {
    matrix.scrollLeft -= e.movementX * matrix.mousedown;
});

const levelsArray = Array.from(document.querySelectorAll('.level-info'));
const skillsArray = Array.from(document.querySelectorAll('.item.skill:not(.new)'));
const jobtitlesArray = Array.from(document.querySelectorAll('.item.jobtitle:not(.new)'));
const requirementsArray = Array.from(document.querySelectorAll('.item.requirement'));

const skillSearchData = skillsArray.map(skill => {
    return {
        value: skill.id,
        text: skill.value ?? skill.textContent
    }
});

const jobtitleSearchData = jobtitlesArray.map(jobtitle => {
    return {
        value: jobtitle.id,
        text: jobtitle.value ?? jobtitle.textContent
    }
});

new MultiSelect('#skill-search', {
    data: skillSearchData,
    placeholder: 'Поиск по навыкам',
    search: true,
    selectAll: true,
    listAll: false,
    onSelect: function(value, text, element) {
        
    },
    onUnselect: function(value, text, element) {
        
    }
});

new MultiSelect('#jobtitle-search', {
    data: jobtitleSearchData,
    placeholder: 'Поиск по должностям',
    search: true,
    selectAll: true,
    listAll: false,
    onSelect: function(value, text, element) {
    },
    onUnselect: function(value, text, element) {
    }
});

for (var skillItem of document.querySelectorAll('.item.skill:not(.new)')) {
    skillItem.addEventListener('click', (e) => {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.children[0].removeAttribute('hidden');
        infoPanel.children[1].setAttribute('hidden', true);
        infoPanel.children[2].setAttribute('hidden', true);

        infoPanel.children[0].children[0].value = document.getElementById('description-'+e.target.id).textContent;
        infoPanel.children[0].children[0].textContent = document.getElementById('description-'+e.target.id).textContent;
        setActiveItems(getComputedStyle(e.target).getPropertyValue('--grid-column'), 0);
    })

    skillItem.addEventListener('dblclick', (e) => {
        setFirstSkill(e.target.id);
        setActiveItems(2, 0);
        matrix.scrollTo({
            left: 0,
            behavior: "smooth"
        })
    })

    skillItem.addEventListener('change', (e) => {
        if (confirm(`Переименовать навык "${e.target.defaultValue}" в "${e.target.value}"?`)) {
            axios.patch(`/api/hardskills/${e.target.id}`, {
                newValue: e.target.value,
                field: 'name'
            }).then(result => {
                alert('Навык успешно переименован');
            }).catch(error => {
                alert('Не удалось переименовать навык');
                e.target.value = e.target.defaultValue;
                console.log(error);
            })
        } else {
            e.target.value = e.target.defaultValue;
        }
    })
}

for (var jobtitleItem of document.querySelectorAll('.item.jobtitle:not(.new)')) {
    jobtitleItem.addEventListener('click', (e) => {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.children[0].setAttribute('hidden', true);
        infoPanel.children[1].removeAttribute('hidden');
        infoPanel.children[2].setAttribute('hidden', true);

        infoPanel.children[1].children[0].value = document.getElementById('description-'+e.target.id).textContent;
        infoPanel.children[1].children[0].textContent = document.getElementById('description-'+e.target.id).textContent;
        setActiveItems(0, getComputedStyle(e.target).getPropertyValue('--grid-row'));
    })

    jobtitleItem.addEventListener('dblclick', (e) => {
        setFirstJobtitle(e.target.id);
        setActiveItems(0, 2);
        matrix.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    })

    jobtitleItem.addEventListener('change', (e) => {
        if (confirm(`Переименовать должность "${e.target.defaultValue}" в "${e.target.value}"?`)) {
            axios.patch(`/api/jobtitles/${e.target.id}`, {
                newValue: e.target.value,
                field: 'name'
            }).then(result => {
                alert('Должность успешно переименована');
            }).catch(error => {
                alert('Не удалось переименовать должность');
                e.target.value = e.target.defaultValue;
                console.log(error);
            })
        } else {
            e.target.value = e.target.defaultValue;
        }
    })
}

for (var requirementItem of document.querySelectorAll('.item.requirement')) {
    requirementItem.addEventListener('click', (e) => {
        const infoPanel = document.getElementById('info-panel');
        infoPanel.children[0].setAttribute('hidden', true);
        infoPanel.children[1].setAttribute('hidden', true);
        infoPanel.children[2].removeAttribute('hidden');

        const requirementElement = e.composedPath().splice(-6, 1)[0];
        var description = requirementElement.children[1];
        infoPanel.children[2].children[0].value = description.textContent;
        infoPanel.children[2].children[0].textContent = description.textContent;
        setActiveItems(getComputedStyle(e.target).getPropertyValue('--grid-column'), getComputedStyle(e.target).getPropertyValue('--grid-row'));
    })

    requirementItem.addEventListener('dblclick', (e) => {
        const requirementElement = e.composedPath().splice(-6, 1)[0];
        setFirstSkill(requirementElement.getAttribute('skill-id'));
        setFirstJobtitle(requirementElement.getAttribute('jobtitle-id'));
        setActiveItems(2, 2);
        matrix.scrollTo({
            top:0,
            left: 0,
            behavior: "smooth"
        })
    })

    if (document.URL.includes('edit')) {
        new MultiSelect('#select-'+requirementItem.id, {
            data: levelsArray.map(level => {
                return {
                    value: level.id,
                    text: level.textContent,
                    selected: (requirementItem.getAttribute('level-id') == level.id)
                }
            }),
            placeholder: 'Требуемый уровень',
            search: false,
            selectAll: false,
            listAll: true,
            max: 1,
            onSelect: function(value, text, element) {
                const requirementUUID = this.selectElement.id.split('-').slice(1).join('-');
                axios.patch(`/api/jobhardskills/${requirementUUID}`, {
                    newValue: value,
                    field: 'requiredLevel'
                }).then(result => {
                    console.log(result);
                    
                }).catch(error => {
                    alert('Не удалось изменить требуемый уровень');
                    console.log(error);
                })
            }
        });
    }
}

function setFirstSkill(id) {
    const skillElement = skillsArray.find(el => el.id == id);
    const currentColumn = +getComputedStyle(skillElement).getPropertyValue('--grid-column');
    
    skillElement.style.setProperty('--grid-column', 1);

    for (const skillEl of skillsArray) {
        if (+getComputedStyle(skillEl).getPropertyValue('--grid-column') < currentColumn) {
            skillEl.style.setProperty('--grid-column', +getComputedStyle(skillEl).getPropertyValue('--grid-column') + 1);
        }
    }

    for (const requirementEl of requirementsArray) {
        const skillID = requirementEl.getAttribute('skill-id');
        const gridColumn = +getComputedStyle(requirementEl).getPropertyValue('--grid-column');
        if (skillID == id) {
            requirementEl.style.setProperty('--grid-column', 2);
        } else if (gridColumn < currentColumn) {
            requirementEl.style.setProperty('--grid-column', +getComputedStyle(requirementEl).getPropertyValue('--grid-column') + 1);
        }
    }
}

function setFirstJobtitle(id) {
    const jobtitleElement = jobtitlesArray.find(el => el.id == id);
    const currentRow = +getComputedStyle(jobtitleElement).getPropertyValue('--grid-row');
    
    jobtitleElement.style.setProperty('--grid-row', 1);

    for (const jobtitleEl of jobtitlesArray) {
        if (+getComputedStyle(jobtitleEl).getPropertyValue('--grid-row') < currentRow) {
            jobtitleEl.style.setProperty('--grid-row', +getComputedStyle(jobtitleEl).getPropertyValue('--grid-row') + 1);
        }
    }

    for (const requirementEl of requirementsArray) {
        const jobtitleID = requirementEl.getAttribute('jobtitle-id');
        const gridRow = +getComputedStyle(requirementEl).getPropertyValue('--grid-row');
        if (jobtitleID == id) {
            requirementEl.style.setProperty('--grid-row', 2);
        } else if (gridRow < currentRow) {
            requirementEl.style.setProperty('--grid-row', +getComputedStyle(requirementEl).getPropertyValue('--grid-row') + 1);
        }
    }
}

function setActiveItems(col, row) {
    for (const skillEl of skillsArray) {
        skillEl.classList.remove('active');
        if (+getComputedStyle(skillEl).getPropertyValue('--grid-column') == col) {
            skillEl.classList.add('active');
        }
    }

    for (const jobtitleEl of jobtitlesArray) {
        jobtitleEl.classList.remove('active');
        if (+getComputedStyle(jobtitleEl).getPropertyValue('--grid-row') == row) {
            jobtitleEl.classList.add('active');
        }
    }

    for (const requirementEl of requirementsArray) {
        const gridCol = +getComputedStyle(requirementEl).getPropertyValue('--grid-column');
        const gridRow = +getComputedStyle(requirementEl).getPropertyValue('--grid-row');
        requirementEl.classList.remove('active');
        if (gridCol == col || gridRow == row) {
            requirementEl.classList.add('active');
        }
    }
}

if (document.URL.includes('edit')) {
    document.getElementById('new-skill').addEventListener('change', e => {
        if (e.target.value.length && confirm('Создать навык "'+e.target.value+'"?')) {
            axios.post('/api/hardskills', {
                name: e.target.value
            })
            .then(result => {
                window.location.reload();
            })
            .catch(error => {
                alert('Не удалось создать навык');
                console.log(error);
            })
        }
        e.target.value = '';
    })
}

function deleteSkill() {
    const selectedSkillUUID = document.querySelector('.item.skill.active')?.id;
    const selectedSkillName = document.querySelector('.item.skill.active')?.value;
    if (confirm(`Удалить навык "${selectedSkillName}"?`)) {
        axios.delete(`/api/hardskills/${selectedSkillUUID}`)
        .then(result => {
            window.location.reload();
        })
        .catch(error => {
            alert('Не удалось удалить навык');
            console.log(error);
        })
    }
}

if (document.URL.includes('edit')) {
    document.getElementById('new-jobtitle').addEventListener('change', e => {
        if (e.target.value.length && confirm('Создать должность "'+e.target.value+'"?')) {
            axios.post('/api/jobtitles', {
                name: e.target.value,
                vacantNum: 0
            })
            .then(result => {
                window.location.reload();
            })
            .catch(error => {
                alert('Не удалось создать должность');
                console.log(error);
            })
        }
        e.target.value = '';
    })
}

function deleteJobtitle() {
    const selectedJobtitleUUID = document.querySelector('.item.jobtitle.active')?.id;
    const selectedJobtitleName = document.querySelector('.item.jobtitle.active')?.value;
    if (confirm(`Удалить должность "${selectedJobtitleName}"?`)) {
        axios.delete(`/api/jobtitles/${selectedJobtitleUUID}`)
        .then(result => {
            window.location.reload();
        })
        .catch(error => {
            alert('Не удалось удалить должность');
            console.log(error);
        })
    }
}

document.getElementById('skill-textarea').addEventListener('change', e => {
    const activeSkill = document.querySelector('.item.skill.active');
    if (activeSkill && confirm(`Изменить описание навыка "${activeSkill.value}"?`)) {
        axios.patch(`/api/hardskills/${activeSkill.id}`, {
            newValue: e.target.value,
            field: 'description'
        }).then(result => {
            alert('Описание изменено');
            document.getElementById('description-'+activeSkill.id).textContent = e.target.value;
        }).catch(error => {
            alert('Не удалось изменить описание');
            e.target.value = e.target.defaultValue;
            console.log(error);
        })
    } else {
        e.target.value = e.target.defaultValue;
    }
})

document.getElementById('jobtitle-textarea').addEventListener('change', e => {
    const activeJobtitle = document.querySelector('.item.jobtitle.active');
    if (activeJobtitle && confirm(`Изменить описание должности "${activeJobtitle.value}"?`)) {
        axios.patch(`/api/jobtitles/${activeJobtitle.id}`, {
            newValue: e.target.value,
            field: 'description'
        }).then(result => {
            alert('Описание изменено');
            document.getElementById('description-'+activeJobtitle.id).textContent = e.target.value;
        }).catch(error => {
            alert('Не удалось изменить описание');
            e.target.value = e.target.defaultValue;
            console.log(error);
        })
    } else {
        e.target.value = e.target.defaultValue;
    }
})

document.getElementById('requirement-textarea').addEventListener('change', e => {
    const activeSkill = document.querySelector('.item.skill.active');
    const activeJobtitle = document.querySelector('.item.jobtitle.active');
    const activeRequirement = document.querySelector(`.item.requirement[skill-id='${activeSkill.id}'][jobtitle-id='${activeJobtitle.id}']`);
    
    if (activeRequirement && confirm(`Изменить описание требования должности "${activeJobtitle.value}" к навыку "${activeSkill.value}"?`)) {
        axios.patch(`/api/jobhardskills/${activeRequirement.id}`, {
            newValue: e.target.value,
            field: 'description'
        }).then(result => {
            alert('Описание изменено');
            document.getElementById('description-'+activeRequirement.id).textContent = e.target.value;
        }).catch(error => {
            alert('Не удалось изменить описание');
            e.target.value = e.target.defaultValue;
            console.log(error);
        })
    } else {
        e.target.value = e.target.defaultValue;
    }
})

const searchParams = new URLSearchParams(window.location.search);

if (searchParams.get('skill')) {
    setFirstSkill(skillsArray.find(a => a.textContent.toLowerCase().includes(searchParams.get('skill').toLowerCase())).id);
    setActiveItems(2, 0);
    if (searchParams.get('jobtitle')) {
        setFirstJobtitle(jobtitlesArray.find(a => a.textContent.toLowerCase().includes(searchParams.get('jobtitle').toLowerCase())).id);
        setActiveItems(2, 2);
    }
}

if (searchParams.get('jobtitle')) {
    setFirstJobtitle(jobtitlesArray.find(a => a.textContent.toLowerCase().includes(searchParams.get('jobtitle').toLowerCase())).id);
    setActiveItems(0, 2);
    if (searchParams.get('skill')) {
        setFirstSkill(skillsArray.find(a => a.textContent.toLowerCase().includes(searchParams.get('skill').toLowerCase())).id);
        setActiveItems(2, 2);
    }
}