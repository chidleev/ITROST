module.exports = (client, Sequelize, DataTypes) => {
    const Table = client.define("Feedbacks", {
        UUID: {
            type:           DataTypes.UUID,
            primaryKey:     true,
            unique:         true,
            allowNull:      false,
            defaultValue:   Sequelize.UUIDV4,
        },
        prevUUID: {
            type:           DataTypes.UUID,
            unique:         true,
            allowNull:      true,
        },
        message: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      false,
        },
        image: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      true,
        },
        status: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      false,
        },
        userUUID: {
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