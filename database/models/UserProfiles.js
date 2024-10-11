module.exports = (client, Sequelize, DataTypes) => {
    const Table = client.define("UserProfiles", {
        UUID: {
            type:           DataTypes.UUID,
            primaryKey:     true,
            unique:         true,
            allowNull:      false,
            defaultValue:   Sequelize.UUIDV4,
        },
        jobTitleUUID: {
            type:           DataTypes.UUID,
            unique:         false,
            allowNull:      false,
        },
        userUUID: {
            type:           DataTypes.UUID,
            unique:         true,
            allowNull:      false,
        },
        surname: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      false,
        },
        name: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      false,
        },
        patronymic: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      false,
        },
        birthday: {
            type:           DataTypes.DATE,
            unique:         false,
            allowNull:      false,
        },
        mail: {
            type:           DataTypes.STRING,
            unique:         true,
            allowNull:      false,
        },
        image: {
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