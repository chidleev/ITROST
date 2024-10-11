module.exports = (client, Sequelize, DataTypes) => {
    const Table = client.define("JobHardSkills", {
        UUID: {
            type:           DataTypes.UUID,
            primaryKey:     true,
            unique:         true,
            allowNull:      false,
            defaultValue:   Sequelize.UUIDV4,
        },
        skillUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
        jobTitleUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
        requiredLevelUUID : {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      true,
        },
        description: {
            type:           DataTypes.STRING,
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