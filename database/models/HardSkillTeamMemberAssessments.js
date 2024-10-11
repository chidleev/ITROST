module.exports = (client, Sequelize, DataTypes) => {
    const Table = client.define("HardSkillTeamMemberAssessments", {
        UUID: {
            type:           DataTypes.UUID,
            primaryKey:     true,
            unique:         true,
            allowNull:      false,
            defaultValue:   Sequelize.UUIDV4,
        },
        review: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      false,
        },
        skillUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
        teamMemberUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
        teamLeaderUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
    }, {});

    Table.beforeCreate((newObject, options) => {
        if (!newObject.UUID) {
            newObject.UUID = uuidv4();
        }
        if (!newObject.createdAt) {
            newObject.createdAt = new Date();
        }
        if (!newObject.updatedAt) {
            newObject.updatedAt = new Date();
        }
    });

    Table.beforeUpdate((newObject, options) => {
        newObject.updatedAt = new Date();
    });
    
    return Table;
};