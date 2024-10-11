const path = require('path');
const express = require('express');

const hardSkillTests = require('../../database').HardSkillTests;

const componentLoader = express();
componentLoader.set('views', path.join(__dirname, '..', '..', 'public', 'testSystem', 'views', 'components'));

componentLoader.post('/question', (req, res) => {
    if (Boolean(req.body.type)) {
        res.render(`question_${req.body.type}.pug`, req.body, (error, html) => {
            if (error) {
                console.log(error);
                res.status(404).send(`Ошибка компиляции вопроса типа "${req.body.type}"`);
            }
            else res.send(html);
        });
    }
    else {
        res.status(404).send(`Не указан тип вопроса`);
    }
});

const mainComponents = ['welcome', 'questions_bar', 'timer'];

componentLoader.get('/', (req, res) => {
    hardSkillTests.findByPk(req.cookies.testUuid, {
        attributes: ['infoJSON', 'questionJSON']
    }).then(result => {
        if (result) {
            var componentsHtml = {};
            result.infoJSON.questionsCount = result.questionJSON.length;

            mainComponents.forEach(component => {
                res.render(`${component}.pug`, result.infoJSON, (error, html) => {
                    if (error) {
                        console.log(error);
                        res.status(404).send(`Ошибка компиляции компонента "${component}"`);
                        return;
                    }
                    else componentsHtml[component] = html;
                });
            });

            res.json(componentsHtml);
        } else {
            res.status(404).send(`Компонент "${component}" не найден`)
        }
    })
});


module.exports = componentLoader;