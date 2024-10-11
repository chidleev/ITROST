module.exports = (client, Sequelize, DataTypes) => {
    const Table = client.define("Levels", {
        UUID: {
            type:           DataTypes.UUID,
            primaryKey:     true,
            unique:         true,
            allowNull:      false,
            defaultValue:   Sequelize.UUIDV4,
        },
        name: {
            type:           DataTypes.STRING,
            unique:         true,
            allowNull:      false,
        },
        description: {
            type:           DataTypes.STRING,
            unique:         false,
            allowNull:      true,
        },
        priority: {
            type:           DataTypes.INTEGER,
            unique:         true,
            allowNull:      false
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