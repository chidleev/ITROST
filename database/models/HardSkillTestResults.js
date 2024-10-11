module.exports = (client, Sequelize, DataTypes) => {
    const Table = client.define("HardSkillTestResults", {
        UUID: {
            type:           DataTypes.UUID,
            primaryKey:     true,
            unique:         true,
            allowNull:      false,
            defaultValue:   Sequelize.UUIDV4,
        },
        answerJSON: {
            type:           DataTypes.JSON,
            unique:         false,
            allowNull:      true,
        },
        totalScore: {
            type:           DataTypes.FLOAT,
            unique:         false,
            allowNull:      true,
        },
        deadline: {
            type:           DataTypes.DATE,
            unique:         false,
            allowNull:      true,
        },
        isHumanVerified: {
            type:           DataTypes.BOOLEAN,
            unique:         false,
            allowNull:      false,
            defaultValue:   false,
        },
        userReview: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      true,
        },
        testUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
        userUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
        resultLevelUUID : {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      true,
        }
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