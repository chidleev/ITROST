// Подключаем Sequelize
const db_conf = require('./dbconfig');
const {Sequelize, Op, DataTypes} = require('sequelize');

// Создаем объект Sequelize, настраиваем его

const client = new Sequelize(db_conf.DB, db_conf.USER, db_conf.PASSWORD, {
    host: db_conf.HOST,
    port: db_conf.PORT,
    dialect: db_conf.DIALECT,
    define: {
        timestamps: true,
    },
});
const db = {};
db.Sequelize = Sequelize;
db.Op = Op;
db.DataTypes = DataTypes;
db.client = client;

// Импортируем модели из папки ./models

db.HardSkills = require("./models/HardSkills") (client, Sequelize, DataTypes);
db.JobTitles = require("./models/JobTitles") (client, Sequelize, DataTypes);
db.Levels = require("./models/Levels") (client, Sequelize, DataTypes);
db.Users = require("./models/Users") (client, Sequelize, DataTypes);

db.HardSkillTests = require("./models/HardSkillTests") (client, Sequelize, DataTypes);
db.JobHardSkills = require("./models/JobHardSkills") (client, Sequelize, DataTypes);
db.UserProfiles = require('./models/UserProfiles') (client, Sequelize, DataTypes);
db.Feedbacks = require("./models/Feedbacks") (client, Sequelize, DataTypes);

db.HardSkillTestResults = require("./models/HardSkillTestResults") (client, Sequelize, DataTypes);
db.PromotionApplication = require("./models/PromotionApplications") (client, Sequelize, DataTypes);
db.Admins = require("./models/Admins") (client, Sequelize, DataTypes);
db.Teams = require("./models/Teams") (client, Sequelize, DataTypes);

db.AdminReviews = require("./models/AdminReviews") (client, Sequelize, DataTypes);
db.TeamMembers = require("./models/TeamMembers") (client, Sequelize, DataTypes);

db.HardSkillTeamMemberAssessments = require("./models/HardSkillTeamMemberAssessments") (client, Sequelize, DataTypes);

// Связываем модели между собой

// HardSkillTests
db.HardSkills.hasMany(db.HardSkillTests, {
    foreignKey: 'skillUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'tests'
});
db.HardSkillTests.belongsTo(db.HardSkills, {
    foreignKey: 'skillUUID',
    as: 'testedSkill'
});
// JobHardSkills
db.HardSkills.hasMany(db.JobHardSkills, {
    foreignKey: 'skillUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'jobRequirements'
});
db.JobHardSkills.belongsTo(db.HardSkills, {
    foreignKey: 'skillUUID',
    as: 'requiredSkill'
});
db.JobTitles.hasMany(db.JobHardSkills, {
    foreignKey: 'jobTitleUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'skillRequirements'
});
db.JobHardSkills.belongsTo(db.JobTitles, {
    foreignKey: 'jobTitleUUID',
    as: 'requiringJob'
});
// UserProfiles
db.JobTitles.hasMany(db.UserProfiles, {
    foreignKey: 'jobTitleUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'employes'
});
db.UserProfiles.belongsTo(db.JobTitles, {
    foreignKey: 'jobTitleUUID',
    as: 'jobInformation'
});
db.Users.hasOne(db.UserProfiles, {
    foreignKey: 'userUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'profileInformation'
});
db.UserProfiles.belongsTo(db.Users, {
    foreignKey: 'userUUID',
    as: 'creditals'
});
// Feedbacks
db.Users.hasMany(db.Feedbacks, {
    foreignKey: 'userUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'feedbacks'
});
db.Feedbacks.belongsTo(db.Users, {
    foreignKey: 'userUUID',
    as: 'respondentCreditals'
});
db.Feedbacks.belongsTo(db.Feedbacks, {
    foreignKey: 'prevUUID',
    as: 'previousMessage'
});
// HardSkillTestResults
db.HardSkillTests.hasMany(db.HardSkillTestResults, {
    foreignKey: 'testUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'appointments'
});
db.HardSkillTestResults.belongsTo(db.HardSkillTests, {
    foreignKey: 'testUUID',
    as: 'appointedTest'
});
db.Users.hasMany(db.HardSkillTestResults, {
    foreignKey: 'userUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'testsResults'
});
db.HardSkillTestResults.belongsTo(db.Users, {
    foreignKey: 'userUUID',
    as: 'testedPersonCreditals'
});
// PromotionApplication
db.JobTitles.hasMany(db.PromotionApplication, {
    foreignKey: 'jobTitleUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'candidates'
});
db.PromotionApplication.belongsTo(db.JobTitles, {
    foreignKey: 'jobTitleUUID',
    as: 'desiredJobTitle'
});
db.Users.hasMany(db.PromotionApplication, {
    foreignKey: 'userUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'applications'
});
db.PromotionApplication.belongsTo(db.Users, {
    foreignKey: 'userUUID',
    as: 'candidateCreditals'
});
// Admins
db.Users.hasOne(db.Admins, {
    foreignKey: 'userUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'adminCreditals'
});
db.Admins.belongsTo(db.Users, {
    foreignKey: 'userUUID',
    as: 'userCreditals'
});
// Teams
db.Users.hasMany(db.Teams, {
    foreignKey: 'leaderUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'managedTeams'
})
db.Teams.belongsTo(db.Users, {
    foreignKey: 'leaderUUID',
    as: 'leaderCreditals'
});
// AdminReviews
db.PromotionApplication.hasMany(db.AdminReviews, {
    foreignKey: 'promAppUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'adminsReviews'
});
db.AdminReviews.belongsTo(db.PromotionApplication, {
    foreignKey: 'promAppUUID',
    as: 'application'
});
db.Admins.hasMany(db.AdminReviews, {
    foreignKey: 'adminUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'reviews'
});
db.AdminReviews.belongsTo(db.Admins, {
    foreignKey: 'adminUUID',
    as: 'adminCreditals'
});
// TeamMembers
db.Users.hasMany(db.TeamMembers, {
    foreignKey: 'userUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'teamsRoles'
});
db.TeamMembers.belongsTo(db.Users, {
    foreignKey: 'userUUID',
    as: 'userCreditals'
});
db.Teams.hasMany(db.TeamMembers, {
    foreignKey: 'teamUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'members'
});
db.TeamMembers.belongsTo(db.Teams, {
    foreignKey: 'teamUUID',
    as: 'teamInformation'
});
// HardSkillTeamAssessments
db.HardSkills.hasMany(db.HardSkillTeamMemberAssessments, {
    foreignKey: 'skillUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'assessmentsByLeaders'
});
db.HardSkillTeamMemberAssessments.belongsTo(db.HardSkills, {
    foreignKey: 'skillUUID',
    as: 'assessedSkill'
});
db.TeamMembers.hasOne(db.HardSkillTeamMemberAssessments, {
    foreignKey: 'teamMemberUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'skillAassessment'
});
db.HardSkillTeamMemberAssessments.belongsTo(db.TeamMembers, {
    foreignKey: 'teamMemberUUID',
    as: 'assessedMember'
});
db.Teams.hasMany(db.HardSkillTeamMemberAssessments, {
    foreignKey: 'teamLeaderUUID',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'assessmentsByLeader'
});
db.HardSkillTeamMemberAssessments.belongsTo(db.Teams, {
    foreignKey: 'teamLeaderUUID',
    as: 'leader'
});
//Levels
db.Levels.hasMany(db.JobHardSkills, {
    foreignKey: 'requiredLevelUUID',
    as: 'requirements'
});
db.JobHardSkills.belongsTo(db.Levels, {
    foreignKey: 'requiredLevelUUID',
    as: 'requiredLevel'
});
db.Levels.hasMany(db.HardSkillTestResults, {
    foreignKey: 'resultLevelUUID',
    as: 'testsResults'
});
db.HardSkillTestResults.belongsTo(db.Levels, {
    foreignKey: 'resultLevelUUID',
    as: 'resultLevel'
});
//
// Экспортируем настроенный Sequelize объект
//
module.exports = db